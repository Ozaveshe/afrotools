'use strict';

const dns = require('dns').promises;
const engine = require('./_shared/seo-audit-engine.js');

const FETCH_TIMEOUT_MS = 10000;
const COMPANION_TIMEOUT_MS = 5000;
const MAX_HTML_BYTES = 2 * 1024 * 1024;
const MAX_REDIRECTS = 3;
const USER_AGENT = 'AfroSEO-Studio/1.0 (+https://afrotools.com/tools/seo-studio/)';

// Per-instance rate limit: coarse abuse guard, not billing metering.
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60 * 1000;
const rateBuckets = new Map();

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    },
    body: JSON.stringify(body)
  };
}

function clientIp(event) {
  const header = event.headers && (event.headers['x-nf-client-connection-ip'] || event.headers['x-forwarded-for'] || '');
  return String(header).split(',')[0].trim() || 'unknown';
}

function rateLimited(ip) {
  const now = Date.now();
  const bucket = rateBuckets.get(ip) || [];
  const fresh = bucket.filter((ts) => now - ts < RATE_WINDOW_MS);
  if (fresh.length >= RATE_LIMIT) {
    rateBuckets.set(ip, fresh);
    return true;
  }
  fresh.push(now);
  rateBuckets.set(ip, fresh);
  if (rateBuckets.size > 5000) rateBuckets.clear();
  return false;
}

function isPrivateIpv4(ip) {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return true;
  const [a, b] = parts;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a >= 224) return true;
  return false;
}

function isPrivateIpv6(ip) {
  const lower = ip.toLowerCase();
  return lower === '::1' || lower === '::' ||
    lower.startsWith('fe80') || lower.startsWith('fc') || lower.startsWith('fd') ||
    lower.startsWith('::ffff:127.') || lower.startsWith('::ffff:10.') || lower.startsWith('::ffff:192.168.');
}

async function validateTargetUrl(rawUrl) {
  let url;
  try {
    url = new URL(String(rawUrl || '').trim());
  } catch (error) {
    return { ok: false, error: 'Enter a full URL, e.g. https://example.com/page' };
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { ok: false, error: 'Only http and https URLs can be audited.' };
  }
  if (url.username || url.password) {
    return { ok: false, error: 'URLs with embedded credentials are not supported.' };
  }
  if (url.port && url.port !== '80' && url.port !== '443') {
    return { ok: false, error: 'Only standard ports (80/443) can be audited.' };
  }
  const host = url.hostname.toLowerCase();
  if (!host || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) {
    return { ok: false, error: 'That host cannot be audited.' };
  }
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    if (isPrivateIpv4(host)) return { ok: false, error: 'Private or reserved IP addresses cannot be audited.' };
  } else if (host.includes(':')) {
    return { ok: false, error: 'IPv6 literals cannot be audited.' };
  } else {
    try {
      const records = await dns.lookup(host, { all: true, verbatim: true });
      for (const record of records) {
        if (record.family === 4 && isPrivateIpv4(record.address)) {
          return { ok: false, error: 'That host resolves to a private address and cannot be audited.' };
        }
        if (record.family === 6 && isPrivateIpv6(record.address)) {
          return { ok: false, error: 'That host resolves to a private address and cannot be audited.' };
        }
      }
    } catch (error) {
      return { ok: false, error: 'That domain does not resolve. Check the spelling.' };
    }
  }
  return { ok: true, url };
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, Object.assign({
      redirect: 'manual',
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5',
        'Accept-Language': 'en'
      }
    }, options));
  } finally {
    clearTimeout(timer);
  }
}

async function readBodyCapped(response, maxBytes) {
  const declared = Number(response.headers.get('content-length') || 0);
  if (declared && declared > maxBytes) {
    throw new Error('Page is larger than ' + Math.round(maxBytes / 1024 / 1024) + 'MB and cannot be audited.');
  }
  const reader = response.body && response.body.getReader ? response.body.getReader() : null;
  if (!reader) {
    const text = await response.text();
    return text.slice(0, maxBytes);
  }
  const chunks = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    chunks.push(value);
    if (received >= maxBytes) {
      try { await reader.cancel(); } catch (error) { /* stream already done */ }
      break;
    }
  }
  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))).toString('utf8').slice(0, maxBytes);
}

async function fetchDocument(startUrl) {
  const redirects = [];
  let currentUrl = startUrl;
  const startedAt = Date.now();

  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    const response = await fetchWithTimeout(currentUrl.toString(), {}, FETCH_TIMEOUT_MS);
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) throw new Error('Redirect with no location header (HTTP ' + response.status + ').');
      if (hop === MAX_REDIRECTS) throw new Error('Too many redirects (more than ' + MAX_REDIRECTS + ').');
      const nextUrl = new URL(location, currentUrl);
      const validated = await validateTargetUrl(nextUrl.toString());
      if (!validated.ok) throw new Error('Redirect target blocked: ' + validated.error);
      redirects.push({ from: currentUrl.toString(), to: nextUrl.toString(), status: response.status });
      currentUrl = validated.url;
      continue;
    }
    const contentType = String(response.headers.get('content-type') || '');
    if (!response.ok) {
      throw new Error('The page returned HTTP ' + response.status + '.');
    }
    if (contentType && contentType.indexOf('html') < 0 && contentType.indexOf('text/') < 0) {
      throw new Error('That URL returned ' + contentType.split(';')[0] + ', not an HTML page.');
    }
    const html = await readBodyCapped(response, MAX_HTML_BYTES);
    return {
      html,
      finalUrl: currentUrl.toString(),
      responseTimeMs: Date.now() - startedAt,
      status: response.status,
      contentType,
      contentEncoding: response.headers.get('content-encoding') || '',
      xRobotsTag: response.headers.get('x-robots-tag') || '',
      redirects
    };
  }
  throw new Error('Too many redirects.');
}

async function checkCompanion(origin, path) {
  try {
    const response = await fetchWithTimeout(origin + path, {}, COMPANION_TIMEOUT_MS);
    if (response.status >= 300 && response.status < 400) return { found: false };
    if (!response.ok) return { found: false };
    const body = await readBodyCapped(response, 64 * 1024);
    return { found: true, body };
  } catch (error) {
    return { found: false };
  }
}

async function collectCompanions(finalUrl) {
  const origin = new URL(finalUrl).origin;
  const [robots, llms] = await Promise.all([
    checkCompanion(origin, '/robots.txt'),
    checkCompanion(origin, '/llms.txt')
  ]);

  let sitemap = { found: false, url: '' };
  let sitemapUrl = origin + '/sitemap.xml';
  if (robots.found && robots.body) {
    const match = /sitemap:\s*(\S+)/i.exec(robots.body);
    if (match) sitemapUrl = match[1];
  }
  try {
    const validated = await validateTargetUrl(sitemapUrl);
    if (validated.ok) {
      const result = await checkCompanion(new URL(sitemapUrl).origin, new URL(sitemapUrl).pathname);
      sitemap = { found: result.found, url: result.found ? sitemapUrl : '' };
    }
  } catch (error) {
    sitemap = { found: false, url: '' };
  }

  return {
    robotsTxt: { found: robots.found },
    llmsTxt: { found: llms.found },
    sitemap
  };
}

exports.handler = async function handler(event) {
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed', code: 'method_not_allowed' });
  }

  const ip = clientIp(event);
  if (rateLimited(ip)) {
    return json(429, { error: 'Too many audits from this connection. Try again in a minute.', code: 'rate_limited' });
  }

  let rawUrl = '';
  if (event.httpMethod === 'GET') {
    rawUrl = (event.queryStringParameters && event.queryStringParameters.url) || '';
  } else {
    try {
      rawUrl = (JSON.parse(event.body || '{}').url) || '';
    } catch (error) {
      return json(400, { error: 'Invalid JSON body.', code: 'bad_request' });
    }
  }

  const validated = await validateTargetUrl(rawUrl);
  if (!validated.ok) {
    return json(400, { error: validated.error, code: 'invalid_url' });
  }

  try {
    const document = await fetchDocument(validated.url);
    const companions = await collectCompanions(document.finalUrl);
    const report = engine.analyzeHtml({
      html: document.html,
      url: document.finalUrl,
      fetchMeta: {
        responseTimeMs: document.responseTimeMs,
        contentEncoding: document.contentEncoding,
        xRobotsTag: document.xRobotsTag,
        redirects: document.redirects,
        robotsTxt: companions.robotsTxt,
        llmsTxt: companions.llmsTxt,
        sitemap: companions.sitemap
      }
    });
    report.requestedUrl = rawUrl;
    report.finalUrl = document.finalUrl;
    report.fetchedAt = new Date().toISOString();
    return json(200, report);
  } catch (error) {
    const message = error && error.name === 'AbortError'
      ? 'The page took longer than ' + (FETCH_TIMEOUT_MS / 1000) + ' seconds to respond.'
      : String(error && error.message || 'Audit failed.');
    return json(422, { error: message, code: 'fetch_failed' });
  }
};
