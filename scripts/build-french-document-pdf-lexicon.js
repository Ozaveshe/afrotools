#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');
const acorn = require('acorn');
const localizer = require('../assets/js/lib/fr-document-pdf-localizer.js');

const ROOT = path.resolve(__dirname, '..');
const CONFIG_PATH = path.join(ROOT, 'data', 'localization', 'fr-document-pdf-parity.json');
const ALLOWLIST_PATH = path.join(ROOT, 'data', 'localization', 'fr-document-pdf-language-allowlist.json');
const OVERRIDES_PATH = path.join(ROOT, 'data', 'localization', 'fr-document-pdf-lexicon-overrides.json');
const OUTPUT_PATH = path.join(ROOT, 'data', 'localization', 'fr-document-pdf-lexicon.json');
const WRITE = process.argv.includes('--write');
const REFRESH = process.argv.includes('--refresh');

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function decodeEntities(value) {
  return String(value || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#(?:39|x27);/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)));
}

function clean(value) {
  return decodeEntities(value).replace(/\s+/g, ' ').trim();
}

function stripMarkup(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|noscript|svg|template)\b[\s\S]*?<\/\1>/gi, ' ');
}

function extractMarkupStrings(html) {
  const strings = new Set();
  const source = stripMarkup(html);
  source.replace(/>([^<]+)</g, (_, value) => {
    const text = clean(value);
    if (text) strings.add(text);
    return _;
  });
  source.replace(/\b(?:placeholder|title|aria-label|aria-description|data-name|data-desc|alt)=("([^"]*)"|'([^']*)')/gi,
    (_, quoted, doubleValue, singleValue) => {
      const text = clean(doubleValue == null ? singleValue : doubleValue);
      if (text) strings.add(text);
      return _;
    });
  return strings;
}

function extractSchemaStrings(html) {
  const strings = new Set();
  const scripts = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  function visit(value, key) {
    if (Array.isArray(value)) {
      value.forEach((entry) => visit(entry, key));
      return;
    }
    if (value && typeof value === 'object') {
      Object.entries(value).forEach(([childKey, entry]) => visit(entry, childKey));
      return;
    }
    if (typeof value !== 'string' || /^@|url|item|sameAs$/i.test(key || '')) return;
    const text = clean(value);
    if (text) strings.add(text);
  }
  for (const match of scripts) {
    try {
      visit(JSON.parse(match[1]), '');
    } catch {
      // Malformed source schema is left for the parity verifier to report.
    }
  }
  return strings;
}

function extractJavaScriptStrings(source, filename) {
  const strings = new Set();
  let tree;
  try {
    tree = acorn.parse(source, {
      ecmaVersion: 'latest',
      sourceType: 'script',
      allowHashBang: true
    });
  } catch (error) {
    try {
      tree = acorn.parse(source, {
        ecmaVersion: 'latest',
        sourceType: 'module',
        allowHashBang: true
      });
    } catch (moduleError) {
      console.warn(`Skipping JavaScript lexicon extraction for ${filename}: ${moduleError.message}`);
      return strings;
    }
  }
  const stack = [tree];
  while (stack.length) {
    const node = stack.pop();
    if (!node || typeof node !== 'object') continue;
    if (node.type === 'Literal' && typeof node.value === 'string') {
      const text = clean(node.value);
      if (text) strings.add(text);
    } else if (node.type === 'TemplateLiteral' && node.expressions.length === 0) {
      const text = clean(node.quasis.map((quasi) => quasi.value.cooked || '').join(''));
      if (text) strings.add(text);
    }
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) {
        value.forEach((entry) => {
          if (entry && typeof entry === 'object') stack.push(entry);
        });
      } else if (value && typeof value === 'object' && typeof value.type === 'string') {
        stack.push(value);
      }
    }
  }
  return strings;
}

function extractRouteOwnedScriptStrings(html, englishFile) {
  const strings = new Set();
  const ownerDirectory = path.posix.dirname(`/${englishFile.replaceAll('\\', '/')}`);
  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
  for (const match of scripts) {
    const attrs = match[1] || '';
    if (/type=["']application\/ld\+json["']/i.test(attrs)) continue;
    const srcMatch = attrs.match(/\bsrc=["']([^"']+)["']/i);
    if (srcMatch) {
      const pathname = srcMatch[1].split(/[?#]/)[0];
      if (!pathname.startsWith(`${ownerDirectory}/`)) continue;
      const absolute = path.join(ROOT, pathname.replace(/^\/+/, '').replaceAll('/', path.sep));
      if (!fs.existsSync(absolute)) continue;
      for (const value of extractJavaScriptStrings(fs.readFileSync(absolute, 'utf8'), path.relative(ROOT, absolute))) {
        strings.add(value);
      }
      continue;
    }
    for (const value of extractJavaScriptStrings(match[2] || '', `${englishFile}:inline`)) strings.add(value);
  }
  return strings;
}

function looksUserFacing(value) {
  if (!/[A-Za-z]/.test(value)) return false;
  if (value.length > 600) return false;
  if (/[{}]|=>|:\s*["']|(?:^|\s)(?:const|let|var|function|return|querySelector|addEventListener)\b/.test(value)) return false;
  if (/^(?:[#.][\w-]+|[\w-]+(?:\s*[,>+~]\s*[#.\w-]+)+)$/.test(value)) return false;
  if (/^(?:https?:|\/|\.\/|\.\.\/|data:|blob:)/i.test(value)) return false;
  if (/^[\w.-]+\.(?:js|css|json|png|jpe?g|webp|svg|woff2?|pdf|zip)$/i.test(value)) return false;
  if (/^[A-Z0-9_:-]+$/.test(value) && value.length > 2) return false;
  if (/^[a-z][a-zA-Z0-9]*(?:[A-Z][a-zA-Z0-9]*)+$/.test(value)) return false;
  if (/^[a-z0-9_-]+$/.test(value) && !/\s/.test(value)) return value.length > 3;
  return true;
}

function protectedPhrase(value, allowlist, routeId) {
  const accepted = new Set([
    ...allowlist.globalExactTerms,
    ...(allowlist.routeExactTerms[routeId] || [])
  ].map((term) => term.toLowerCase()));
  return accepted.has(value.toLowerCase());
}

function translateRemote(value) {
  const query = new URLSearchParams({
    client: 'gtx',
    sl: 'en',
    tl: 'fr',
    dt: 't',
    q: value
  });
  const url = `https://translate.googleapis.com/translate_a/single?${query}`;
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'AfroTools-localization-build/1.0' } }, (response) => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => { body += chunk; });
      response.on('end', () => {
        if (response.statusCode !== 200) {
          reject(new Error(`Translation service returned ${response.statusCode}`));
          return;
        }
        try {
          const parsed = JSON.parse(body);
          resolve((parsed[0] || []).map((part) => part[0] || '').join(''));
        } catch (error) {
          reject(new Error(`Invalid translation response: ${error.message}`));
        }
      });
    }).on('error', reject);
  });
}

async function mapConcurrent(items, limit, worker) {
  const output = new Array(items.length);
  let cursor = 0;
  async function run() {
    while (cursor < items.length) {
      const index = cursor++;
      output[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return output;
}

function stableObject(entries) {
  return Object.fromEntries([...entries].sort((a, b) => a[0].localeCompare(b[0], 'en')));
}

async function main() {
  const config = readJson(CONFIG_PATH);
  const allowlist = readJson(ALLOWLIST_PATH);
  const overrides = readJson(OVERRIDES_PATH);
  const previous = fs.existsSync(OUTPUT_PATH) ? readJson(OUTPUT_PATH) : { routes: {} };
  const candidates = new Map();

  for (const app of config.apps) {
    const files = [app.englishFile, app.englishWorkspaceFile].filter(Boolean);
    const strings = new Set();
    for (const relativeFile of files) {
      const html = fs.readFileSync(path.join(ROOT, relativeFile), 'utf8');
      for (const value of extractMarkupStrings(html)) strings.add(value);
      for (const value of extractSchemaStrings(html)) strings.add(value);
      for (const value of extractRouteOwnedScriptStrings(html, relativeFile)) strings.add(value);
    }
    const previousRoute = previous.routes && previous.routes[app.id] ? previous.routes[app.id] : {};
    const entries = [];
    for (const source of strings) {
      if (!looksUserFacing(source) || protectedPhrase(source, allowlist, app.id)) continue;
      if (!REFRESH && previousRoute[source]) {
        entries.push([source, previousRoute[source]]);
        continue;
      }
      if (Object.prototype.hasOwnProperty.call(localizer.exact, source)) {
        entries.push([source, localizer.exact[source]]);
        continue;
      }
      const existing = localizer.translate(source);
      if (existing !== source && !/\b(?:the|and|your|you|with|without|from|this|that|for|download|upload|select|choose|click|file|files|page|pages|save|copy|share|print|preview|export|reset|clear|result|ready|review|verify|browser|privacy|tool|document)\b/i.test(existing)) {
        entries.push([source, existing]);
        continue;
      }
      const key = source;
      if (!candidates.has(key)) candidates.set(key, []);
      candidates.get(key).push(app.id);
    }
    candidates.set(`\u0000route:${app.id}`, entries);
  }

  const remoteSources = [...candidates.keys()].filter((key) => !key.startsWith('\u0000route:'));
  console.log(`Exact lexicon: ${remoteSources.length} unique strings require translation.`);
  const translated = await mapConcurrent(remoteSources, 6, async (source, index) => {
    if (index && index % 100 === 0) console.log(`Translated ${index}/${remoteSources.length}`);
    let lastError;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        return await translateRemote(source);
      } catch (error) {
        lastError = error;
        await new Promise((resolve) => setTimeout(resolve, attempt * 250));
      }
    }
    throw new Error(`Could not translate "${source.slice(0, 80)}": ${lastError && lastError.message}`);
  });
  const translations = new Map(remoteSources.map((source, index) => [source, translated[index]]));

  const routes = {};
  for (const app of config.apps) {
    const entries = candidates.get(`\u0000route:${app.id}`) || [];
    for (const [source, owners] of candidates) {
      if (source.startsWith('\u0000route:') || !owners.includes(app.id)) continue;
      entries.push([source, translations.get(source)]);
    }
    routes[app.id] = stableObject([
      ...entries,
      ...Object.entries((overrides.routes && overrides.routes[app.id]) || {})
    ]);
  }
  const output = {
    schemaVersion: 1,
    locale: 'fr',
    category: 'document-pdf',
    generatedBy: 'scripts/build-french-document-pdf-lexicon.js',
    reviewedOn: '2026-07-28',
    routes
  };
  const serialized = `${JSON.stringify(output, null, 2)}\n`;
  if (WRITE) {
    fs.writeFileSync(OUTPUT_PATH, serialized, 'utf8');
    console.log(`Wrote ${path.relative(ROOT, OUTPUT_PATH)} with ${Object.values(routes).reduce((sum, route) => sum + Object.keys(route).length, 0)} route-owned entries.`);
  } else if (!fs.existsSync(OUTPUT_PATH) || fs.readFileSync(OUTPUT_PATH, 'utf8') !== serialized) {
    console.error('French Document/PDF exact lexicon is stale. Run with --write.');
    process.exitCode = 1;
  } else {
    console.log('French Document/PDF exact lexicon is current.');
  }
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
