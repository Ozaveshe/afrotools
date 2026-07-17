#!/usr/bin/env node
/**
 * Audit AfroStream creator profile URLs for likely wrong-person links.
 *
 * The audit is intentionally conservative. It does not prove every account,
 * but it highlights links whose handles do not match the creator name, slug,
 * or repeated handles on the same profile. Review these with live sources
 * before writing corrections to Supabase.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DEFAULT_URL = 'https://afrotools.com/api/afrostream/creators?sort=name&limit=500';
const PLATFORM_FIELDS = [
  ['youtube_url', 'YouTube'],
  ['twitch_url', 'Twitch'],
  ['tiktok_url', 'TikTok'],
  ['kick_url', 'Kick'],
  ['instagram_url', 'Instagram'],
  ['twitter_url', 'X'],
];

const ALLOWLIST = new Set([
  'akothee:youtube_url:estherakoth',
  'akothee:instagram_url:akotheke',
  'akothee:twitter_url:akotheambassador',
  'black-sherif:youtube_url:blackosherif',
  'damso:tiktok_url:damabordelofficiel',
  'dan-kwaku-yeboah:youtube_url:dkygh',
  'dip-doundou-guiss:youtube_url:ddg221',
  'flavour-nabania:tiktok_url:flavourofafrica',
  'flavour-nabania:instagram_url:2niteflavour',
  'flavour-nabania:twitter_url:2niteflavour',
  'gilmario-vemba:instagram_url:mr_filadagodaaa',
  'khaby-lame:instagram_url:khaby00',
  'khaligraph-jones:twitter_url:aborog',
  'king-oumar:twitch_url:kointhecut',
  'elgrande-toto:kick_url:elgrandetotoff',
  'omar-shawar:kick_url:shawar',
]);

const KNOWN_BAD_FRAGMENTS = [
  'angelikidjoo',
  'burboy',
  'drhalnasmir',
  'falnlyipupaofficiel',
  'mthnandeni',
  'pquareworld',
  'paboranking',
  'sababorin',
  'spaboraug',
  'tiaboratina',
  'zuaborang',
  'noorgamer',
];

function argValue(name) {
  const idx = process.argv.indexOf(name);
  return idx === -1 ? '' : process.argv[idx + 1] || '';
}

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/^@/, '')
    .replace(/[^a-z0-9]/g, '');
}

function tokenize(value) {
  return String(value || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .filter((token) => token.length >= 3);
}

function handleFromUrl(url) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');
    const parts = parsed.pathname.split('/').filter(Boolean);
    if (!parts.length) return '';
    if (host.includes('youtube.com') && parts[0] === 'channel') return parts[1] || '';
    if (host.includes('youtube.com') && parts[0] === 'c') return parts[1] || '';
    return parts[0].replace(/^@/, '');
  } catch {
    return '';
  }
}

function profileTokens(creator) {
  const tokens = new Set([
    ...tokenize(creator.name),
    ...tokenize(creator.slug),
    ...tokenize(creator.tags),
    ...tokenize(creator.categories),
  ]);

  for (const [field] of PLATFORM_FIELDS) {
    const handle = handleFromUrl(creator[field]);
    if (handle) tokens.add(normalize(handle));
  }

  return tokens;
}

function repeatedHandles(creator) {
  const counts = new Map();
  for (const [field] of PLATFORM_FIELDS) {
    const handle = normalize(handleFromUrl(creator[field]));
    if (!handle) continue;
    counts.set(handle, (counts.get(handle) || 0) + 1);
  }
  return new Set([...counts].filter(([, count]) => count > 1).map(([handle]) => handle));
}

function scoreLink(creator, field, label) {
  const url = creator[field];
  const rawHandle = handleFromUrl(url);
  const handle = normalize(rawHandle);
  if (!handle) return null;

  const allowKey = `${creator.slug}:${field}:${handle}`;
  if (ALLOWLIST.has(allowKey)) return null;

  const tokens = profileTokens(creator);
  const repeated = repeatedHandles(creator);
  const reasons = [];
  let score = 0;

  if (KNOWN_BAD_FRAGMENTS.includes(handle)) {
    score -= 6;
    reasons.push('known bad or mangled handle from prior audit');
  }

  if (repeated.size && !repeated.has(handle)) {
    score -= 2;
    reasons.push(`differs from repeated handle ${[...repeated].join(',')}`);
  }

  const overlap = [...tokens].filter((token) => handle.includes(token) || token.includes(handle));
  if (overlap.length) {
    score += 2;
  } else {
    score -= 3;
    reasons.push('no handle overlap with creator name, slug, tags, or other profile URLs');
  }

  if ((field === 'kick_url' || field === 'twitch_url') && !/gaming|stream|irl|twitch|kick|variety/i.test(`${creator.categories || ''} ${creator.tags || ''}`)) {
    score -= 1;
    reasons.push('livestream URL on a non-streamer profile');
  }

  if (score >= 0) return null;

  return {
    id: creator.id,
    slug: creator.slug,
    name: creator.name,
    field,
    platform: label,
    url,
    handle: rawHandle,
    score,
    reasons,
  };
}

async function loadCreators() {
  const input = argValue('--input');
  if (input) {
    return JSON.parse(fs.readFileSync(path.resolve(ROOT, input), 'utf8'));
  }

  const sourceUrl = process.env.AFROSTREAM_CREATORS_URL || DEFAULT_URL;
  const res = await fetch(sourceUrl, {
    headers: { 'user-agent': 'AfroTools link audit/1.0' },
  });
  if (!res.ok) throw new Error(`Failed to fetch creators: ${res.status} ${res.statusText}`);
  return res.json();
}

function writeOutput(payload) {
  const out = argValue('--out');
  if (!out) return;
  const target = path.resolve(ROOT, out);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, JSON.stringify(payload, null, 2) + '\n');
}

loadCreators()
  .then((payload) => {
    const creators = Array.isArray(payload) ? payload : payload.creators || payload.data || [];
    const issues = creators.flatMap((creator) => (
      PLATFORM_FIELDS.map(([field, label]) => scoreLink(creator, field, label)).filter(Boolean)
    )).sort((a, b) => a.score - b.score || a.slug.localeCompare(b.slug));

    const summary = {
      checked_at: new Date().toISOString(),
      total_creators: creators.length,
      total_profile_urls: creators.reduce((count, creator) => (
        count + PLATFORM_FIELDS.filter(([field]) => creator[field]).length
      ), 0),
      suspect_count: issues.length,
      high_risk_count: issues.filter((issue) => issue.score <= -3).length,
      issues,
    };

    console.log(`Checked creators: ${summary.total_creators}`);
    console.log(`Profile URLs: ${summary.total_profile_urls}`);
    console.log(`Suspect links: ${summary.suspect_count}`);
    console.log(`High risk: ${summary.high_risk_count}`);
    for (const issue of issues.slice(0, 30)) {
      console.log(`${issue.score}\t${issue.slug}\t${issue.field}\t${issue.url}\t${issue.reasons.join('; ')}`);
    }
    writeOutput(summary);
  })
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
