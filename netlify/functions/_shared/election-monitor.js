
'use strict';
const crypto = require('node:crypto');

function targets(ledger, surveySources = []) {
  const selected = new Map();
  // One latest linked official notice per country, plus configured feeds.
  const countries = [...new Set(ledger.elections.map((record) => record.countryCode))];
  for (const code of countries) {
    const sources = ledger.elections.filter((record) => record.countryCode === code)
      .flatMap((record) => (record.sources || []).filter((source) => source.type === 'official')
        .map((source) => ({ ...source, countryCode: code, country: record.country })))
      .sort((a,b) => b.checkedAt.localeCompare(a.checkedAt) || a.url.localeCompare(b.url));
    if (sources[0]) selected.set(sources[0].url, sources[0]);
  }
  for (const feed of ledger.newsFeeds || []) {
    if (feed.status === 'paused') continue;
    const url = feed.feedUrl || feed.url;
    if (!selected.has(url)) selected.set(url, {url,label:feed.label,country:feed.country || 'Africa',countryCode:'',sourceType:feed.sourceType});
  }
  for (const source of surveySources) {
    if (!selected.has(source.url)) selected.set(source.url, source);
  }
  return [...selected.values()].slice(0,16).map((source) => {
    const url = new URL(source.url);
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Unsafe configured election source');
    return {id:crypto.createHash('sha256').update(url.href).digest('hex').slice(0,20),url:url.href,label:source.label,
      country:source.country,countryCode:source.countryCode,sourceType:source.sourceType || 'official-page'};
  });
}

async function retrieve(source, fetchImpl = fetch) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(),8000);
  try {
    let url = source.url;
    let response;
    for (let redirects=0;redirects<=3;redirects++) {
      response = await fetchImpl(url,{signal:controller.signal,redirect:'manual',
        headers:{accept:'text/html,application/rss+xml,application/atom+xml,application/xml;q=0.9',
          'user-agent':'AfroTools Election Source Monitor (+https://afrotools.com/tools/africa-election-tracker/)'}});
      if (![301,302,303,307,308].includes(response.status)) break;
      const next = new URL(response.headers.get('location'),url);
      if (next.protocol !== 'https:' || next.hostname !== new URL(source.url).hostname || next.username || next.password || redirects === 3)
        throw new Error('redirect-review');
      url = next.href;
    }
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const type = response.headers.get('content-type') || '';
    if (!/text\/|xml|json/i.test(type)) throw new Error('unsupported-content');
    if (Number(response.headers.get('content-length') || 0) > 1024*1024) throw new Error('source-too-large');
    const reader = response.body.getReader();
    const chunks = []; let total=0;
    try {
      while (true) {
        const {done,value} = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > 1024*1024) throw new Error('source-too-large');
        chunks.push(Buffer.from(value));
      }
    } finally { await reader.cancel().catch(() => {}); }
    const body = Buffer.concat(chunks).toString('utf8');
    if (!body.trim()) throw new Error('empty-response');
    if (/captcha|verify you are human|just a moment|access denied/i.test(body.slice(0,12000))) throw new Error('challenge-page');
    return crypto.createHash('sha256').update(body).digest('hex');
  } finally { clearTimeout(timer); }
}

async function collect(ledger,previous,retrieveImpl=retrieve,now=new Date().toISOString(),surveySources=[]) {
  const list = targets(ledger,surveySources);
  const old = new Map((previous && previous.sources || []).map((source) => [source.id,source]));
  const sources = await Promise.all(list.map(async (source) => {
    const prior = old.get(source.id);
    try {
      const hash = await retrieveImpl(source);
      const changed = !!(prior && prior.hash && prior.hash !== hash);
      return {...source,checkedAt:now,observedAt:now,hash,status:changed?'changed':'reachable',
        requiresReview:changed || !prior || !!prior.requiresReview,
        changedAt:changed?now:prior && prior.changedAt || null};
    } catch (error) {
      const reason = /^HTTP \d{3}$/.test(error.message) || ['redirect-review','unsupported-content','source-too-large','empty-response','challenge-page'].includes(error.message)
        ? error.message : 'fetch-failed';
      return {...source,checkedAt:now,observedAt:prior && prior.observedAt || null,hash:prior && prior.hash || null,
        status:['HTTP 403','HTTP 429','challenge-page'].includes(reason)?'blocked':'unavailable',requiresReview:true,
        changedAt:prior && prior.changedAt || null,error:reason};
    }
  }));
  return {schemaVersion:1,lastCheckedAt:now,cadenceHours:1,status:sources.every((source) => source.status==='reachable')?'observed':'degraded',
    purpose:'Source reachability and change detection only. Observations are not verified election facts or polls.',
    sources};
}
function publicReport(report,now=Date.now()) {
  if (!report || report.schemaVersion !== 1 || !Array.isArray(report.sources)) return null;
  const time = Date.parse(report.lastCheckedAt);
  const stale = !Number.isFinite(time) || time>now || now-time>2*3600000;
  return {schemaVersion:1,lastCheckedAt:report.lastCheckedAt,cadenceHours:1,status:stale?'stale':report.status,
    purpose:report.purpose,sources:report.sources.map(({hash,...source}) => source)};
}
module.exports={targets,retrieve,collect,publicReport};
