'use strict';

const dns = require('dns').promises;
const engine = require('./_shared/seo-audit-engine.js');
const safeTransport = require('./_shared/seo-safe-fetch.js');

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
  if (rateBuckets.size > 5000) rateBuckets.delete(rateBuckets.keys().next().value);
  return false;
}

function isPrivateIpv4(ip) { return !safeTransport.isPublicAddress(ip); }
function isPrivateIpv6(ip) { return !safeTransport.isPublicAddress(ip); }

async function validateTargetUrl(rawUrl) {
  if (typeof rawUrl !== 'string' || rawUrl.length > 2048) return { ok: false, error: 'URL must be text no longer than 2048 characters.' };
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

async function fetchWithTimeout(url, options, timeoutMs, maxBytes = MAX_HTML_BYTES) {
  return safeTransport.safeFetch(url, {
    timeoutMs, maxBytes,
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5',
      'Accept-Language': 'en'
    }
  });
}

async function readBodyCapped(response, maxBytes) {
  const text = await response.text();
  if (Buffer.byteLength(text, 'utf8') > maxBytes) throw new Error('Response is larger than the audit limit. No partial report was generated.');
  return text;
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
    if (contentType && !/^(?:text\/html|application\/xhtml\+xml)(?:;|$)/i.test(contentType)) {
      throw new Error('That URL returned ' + contentType.split(';')[0] + ', not an HTML page.');
    }
    const html = await readBodyCapped(response, MAX_HTML_BYTES);
    if (!html.trim() || (!contentType && !/<(?:!doctype\s+html|html|head|body)\b/i.test(html))) throw new Error('The response does not contain an HTML document.');
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
    const response = await fetchWithTimeout(origin + path, {}, COMPANION_TIMEOUT_MS, 64 * 1024);
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
  const robots = await checkCompanion(origin, '/robots.txt');

  let sitemap = { found: false, url: '' };
  let sitemapUrl = origin + '/sitemap.xml';
  if (robots.found && robots.body) {
    const match = /sitemap:\s*(\S+)/i.exec(robots.body);
    if (match) sitemapUrl = match[1];
  }
  try {
    const validated = await validateTargetUrl(sitemapUrl);
    if (validated.ok) {
      const result = await checkCompanion(new URL(sitemapUrl).origin, new URL(sitemapUrl).pathname + new URL(sitemapUrl).search);
      sitemap = { found: result.found, url: result.found ? sitemapUrl : '' };
    }
  } catch (error) {
    sitemap = { found: false, url: '' };
  }

  return {
    robotsTxt: { found: robots.found },
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
        sitemap: companions.sitemap
      }
    });
    report.requestedUrl = validated.url.toString();
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
