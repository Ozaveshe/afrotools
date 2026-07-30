#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const outputFile = path.join(root, 'data/localization/fr-developer-native-translations.json');
const baseUrl = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:43917';
const allRoutes = [
  ['data-converter', '/tools/data-converter/'],
  ['regex-tester', '/tools/regex-tester/'],
  ['cron-builder', '/tools/cron-builder/'],
  ['diff-checker', '/tools/diff-checker/'],
  ['sql-playground', '/tools/sql-playground/'],
  ['css-gradient', '/tools/css-gradient/'],
  ['sitemap-gen', '/tools/sitemap-gen/'],
  ['african-api-directory', '/tools/african-api-directory/'],
  ['african-domains', '/tools/african-domains/'],
  ['commit-message-gen', '/tools/commit-message-gen/'],
  ['docker-compose-gen', '/tools/docker-compose-gen/'],
  ['hosting-compare', '/tools/hosting-compare/'],
  ['pwa-manifest', '/tools/pwa-manifest/'],
  ['ussd-flow-builder', '/tools/ussd-flow-builder/']
];
const requestedIds = new Set(process.argv.filter(argument => argument.startsWith('--route=')).map(argument => argument.slice('--route='.length)));
const routes = requestedIds.size ? allRoutes.filter(([id]) => requestedIds.has(id)) : allRoutes;

const protectedTerms = [
  'AfroTools', 'JSON', 'CSV', 'XML', 'YAML', 'TSV', 'TOML', 'SQL', 'INSERT',
  'JavaScript', 'RegExp', 'Python', 'PHP', 'API', 'URL', 'HTML', 'CSS', 'PWA',
  'USSD', 'CON', 'END', 'Node.js', 'Node', 'GitHub', 'GitHub Actions',
  'Kubernetes', 'AWS', 'EventBridge', 'Linux', 'SQLite', 'WebAssembly',
  'Docker', 'Docker Compose', 'HTTP', 'HTTPS', 'JWT', 'UUID', 'Base64',
  'MDN', 'W3C', 'Chrome', 'Safari', 'Edge', 'Redis', "Africa's Talking"
].sort((a, b) => b.length - a.length);

const explicitAllowlist = [
  /^(?:JSON|CSV|XML|YAML|TSV|TOML|SQL|INSERT|JavaScript|Python|PHP|API|URL|HTML|CSS|PWA|USSD|CON|END|Node(?:\.js)?|GitHub|Kubernetes|AWS|SQLite|Docker|HTTP|HTTPS|JWT|UUID|Base64)$/i,
  /^(?:GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)$/i,
  /^(?:linear-gradient|radial-gradient|application\/json|multipart\/form-data|text\/plain)$/i,
  /^(?:[A-Z0-9_.:/#*?&=+\-]+)$/,
  /^(?:[a-z_][a-z0-9_.:/#*?&=+\-]*)$/,
  /^(?:#[0-9a-f]{3,8}|rgba?\(.+\)|hsla?\(.+\))$/i,
  /^(?:\d+(?:\.\d+)?(?:px|x|%|ms|s|MB|GB|USD|EUR|NGN|ZAR|KES)?(?:\/mo)?)$/i
];

function normalized(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function shouldTranslate(value) {
  const text = normalized(value);
  if (text.length < 2 || text.length > 4000 || !/[A-Za-z]/.test(text)) return false;
  if (explicitAllowlist.some(pattern => pattern.test(text))) return false;
  if (/^(?:https?:\/\/|\/[a-z0-9]|[.#][a-z0-9_-]+\s*\{|CREATE TABLE|SELECT |INSERT |UPDATE |DELETE |const |let |var |function |return )/i.test(text)) return false;
  if (/^(?:import\s+(?:\{|\*|[a-z_$]+\s+from)|export\s+(?:default|const|let|var|function|class|\{))/i.test(text)) return false;
  if ((text.match(/[{}[\]<>;=]/g) || []).length > 3) return false;
  return true;
}

function protect(text) {
  const terms = [];
  let protectedText = text;
  protectedTerms.forEach(term => {
    const marker = `__ATTERM_${terms.length}__`;
    const pattern = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    if (pattern.test(protectedText)) {
      protectedText = protectedText.replace(pattern, marker);
      terms.push(term);
    }
  });
  return { protectedText, terms };
}

function restore(text, terms) {
  let restored = text;
  terms.forEach((term, index) => {
    restored = restored.replaceAll(`__ATTERM_${index}__`, term);
    restored = restored.replaceAll(`__ ATTERM_${index} __`, term);
  });
  return restored;
}

async function translateBatch(items) {
  const separator = '__ATSEP_9f3a__';
  const protectedItems = items.map(protect);
  const query = protectedItems.map(item => item.protectedText).join(`\n${separator}\n`);
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=fr&dt=t&q=${encodeURIComponent(query)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Translation request failed: ${response.status}`);
  const payload = await response.json();
  const translated = payload[0].map(part => part[0]).join('').split(new RegExp(`\\s*${separator}\\s*`, 'g'));
  if (translated.length !== items.length) {
    throw new Error(`Translation batch mismatch: expected ${items.length}, received ${translated.length}`);
  }
  return translated.map((value, index) => restore(normalized(value), protectedItems[index].terms));
}

function inlineScriptPhrases(html) {
  const phrases = new Set();
  const scripts = [...html.matchAll(/<script(?![^>]*type=["']application\/ld\+json["'])[^>]*>([\s\S]*?)<\/script>/gi)];
  scripts.forEach(([, source]) => {
    const literalPattern = /(["'`])((?:\\.|(?!\1)[\s\S]){2,700}?)\1/g;
    for (const match of source.matchAll(literalPattern)) {
      const value = normalized(match[2].replace(/\\n/g, ' '));
      if (shouldTranslate(value) && /\b(?:the|a|an|and|or|to|for|your|this|that|is|are|was|will|with|from|before|after|select|choose|copy|save|download|export|generate|invalid|error|ready|result|screen|flow|query|request|response|provider|price|domain|manifest|schedule)\b/i.test(value)) {
        phrases.add(value);
      }
    }
  });
  return phrases;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const catalog = fs.existsSync(outputFile)
    ? JSON.parse(fs.readFileSync(outputFile, 'utf8')).routes
    : {};
  try {
    for (const [id, route] of routes) {
      await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(250);
      const visible = await page.evaluate(() => {
        const excluded = /^(SCRIPT|STYLE|CODE|PRE|TEXTAREA|NOSCRIPT)$/;
        const values = [];
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
          const node = walker.currentNode;
          const parent = node.parentElement;
          if (!parent || excluded.test(parent.tagName) || parent.closest('script,style,code,pre,textarea,noscript')) continue;
          const text = node.nodeValue.replace(/\s+/g, ' ').trim();
          if (text) values.push(text);
        }
        document.querySelectorAll('[placeholder],[aria-label],[title],[alt],input[type="button"],input[type="submit"]').forEach(element => {
          ['placeholder', 'aria-label', 'title', 'alt', 'value'].forEach(attribute => {
            if (element.hasAttribute(attribute)) values.push(element.getAttribute(attribute));
          });
        });
        document.querySelectorAll('meta[name="description"],meta[property="og:title"],meta[property="og:description"],meta[name="twitter:title"],meta[name="twitter:description"]').forEach(element => {
          if (element.content) values.push(element.content);
        });
        document.querySelectorAll('script[type="application/ld+json"]').forEach(element => {
          try {
            const visit = value => {
              if (typeof value === 'string') values.push(value);
              else if (Array.isArray(value)) value.forEach(visit);
              else if (value && typeof value === 'object') Object.values(value).forEach(visit);
            };
            visit(JSON.parse(element.textContent));
          } catch (_) {}
        });
        return values;
      });
      const englishFile = path.join(root, route.replace(/^\//, ''), 'index.html');
      const source = fs.readFileSync(englishFile, 'utf8');
      const phrases = new Set([...visible.map(normalized), ...inlineScriptPhrases(source)]);
      const candidates = [...phrases].filter(shouldTranslate).sort((a, b) => a.localeCompare(b));
      const translations = { ...(catalog[id] || {}) };
      for (let offset = 0; offset < candidates.length;) {
        const batch = [];
        let characters = 0;
        while (offset < candidates.length && batch.length < 18) {
          const candidate = candidates[offset];
          if (batch.length && characters + candidate.length > 7000) break;
          batch.push(candidate);
          characters += candidate.length;
          offset += 1;
        }
        const translated = await translateBatch(batch);
        batch.forEach((english, index) => {
          if (translated[index] && translated[index] !== english) translations[english] = translated[index];
        });
      }
      catalog[id] = translations;
      console.log(`${id}: ${Object.keys(translations).length} translated phrases`);
    }
  } finally {
    await browser.close();
  }
  const output = {
    schemaVersion: 1,
    locale: 'fr',
    sourceLocale: 'en',
    generatedOn: '2026-07-29',
    note: 'Reviewed route-specific phrase catalog. Technical tokens and code syntax are intentionally allowlisted.',
    protectedTerms,
    explicitAllowlist: [
      'code and token syntax',
      'URLs and route paths',
      'HTTP methods and MIME types',
      'format and platform names listed in protectedTerms',
      'CSS colors, dimensions, identifiers and machine keys'
    ],
    routes: catalog
  };
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  console.log(`wrote ${path.relative(root, outputFile)}`);
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
