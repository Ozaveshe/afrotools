const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const HUB_PATH = path.join(ROOT, 'health', 'index.html');
const REGISTRY_PATH = path.join(ROOT, 'assets', 'js', 'components', 'tool-registry.js');
const CSS_PATH = path.join(ROOT, 'assets', 'css', 'health-hub-vip.css');

function englishHealthRoutes() {
  const sandbox = { document: undefined, window: {} };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(REGISTRY_PATH, 'utf8'), sandbox);
  return sandbox.AFRO_TOOLS
    .filter((tool) => (tool.lang || 'en') === 'en' && tool.category === 'health')
    .map((tool) => tool.href);
}

test('Health hub exposes the exact registry inventory without JavaScript', () => {
  const html = fs.readFileSync(HUB_PATH, 'utf8');
  const expected = englishHealthRoutes();
  const directory = html.match(
    /<div class="registry-grid health-directory"[^>]*data-health-directory[^>]*>([\s\S]*?)\s*<\/div>\s*<\/section>/
  );

  assert.ok(directory, 'static Health directory must be present');
  const routes = Array.from(directory[1].matchAll(/<a\s+href="([^"]+)"/g), (match) => match[1]);

  assert.equal(expected.length, 42);
  assert.equal(new Set(expected).size, 42);
  assert.equal(routes.length, 42);
  assert.equal(new Set(routes).size, 42);
  assert.deepEqual([...routes].sort(), [...expected].sort());
});

test('Health hub has one main landmark and honest medical, privacy and source boundaries', () => {
  const html = fs.readFileSync(HUB_PATH, 'utf8');

  assert.equal((html.match(/<main(?:\s|>)/g) || []).length, 1);
  assert.equal((html.match(/<\/main>/g) || []).length, 1);
  assert.match(html, /Medical-information boundary/);
  assert.match(html, /Privacy boundary/);
  assert.match(html, /Source and freshness boundary/);
  assert.match(html, /do not diagnose, prescribe or replace emergency care/i);
  assert.match(html, /If a source or checked date is absent/i);
  assert.doesNotMatch(html, /AI-first|AI report tool|AI or guided tool/i);
});

test('Health hub uses local font delivery and a scoped responsive dark-mode layer', () => {
  const html = fs.readFileSync(HUB_PATH, 'utf8');
  const css = fs.readFileSync(CSS_PATH, 'utf8');

  assert.doesNotMatch(html, /fonts\.googleapis\.com|fonts\.gstatic\.com/i);
  assert.match(html, /\/assets\/css\/health-hub-vip\.css/);
  assert.match(css, /\.health-hub-vip/);
  assert.match(css, /html\[data-theme="dark"\] \.health-hub-vip/);
  assert.match(css, /@media \(max-width: 48rem\)/);
  assert.match(css, /overflow-wrap: anywhere/);
  assert.match(css, /prefers-reduced-motion/);
});

test('Health hub search metadata is route-correct, bounded and valid JSON-LD', () => {
  const html = fs.readFileSync(HUB_PATH, 'utf8');
  const title = html.match(/<title>([\s\S]*?)<\/title>/i);
  const description = html.match(/<meta name="description" content="([^"]+)">/i);
  const jsonLdBlocks = Array.from(
    html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi),
    (match) => JSON.parse(match[1])
  );

  assert.ok(title);
  assert.ok(description);
  assert.ok(title[1].replace(/&amp;/g, '&').length <= 65);
  assert.ok(description[1].length >= 110 && description[1].length <= 160);
  assert.match(html, /<link rel="canonical" href="https:\/\/afrotools\.com\/health\/">/);
  assert.match(html, /<meta property="article:modified_time" content="2026-07-26">/);
  assert.equal(jsonLdBlocks.length, 3);
  assert.equal(jsonLdBlocks[0]['@type'], 'CollectionPage');
  assert.equal(jsonLdBlocks[0].url, 'https://afrotools.com/health/');
  assert.equal(jsonLdBlocks[0].dateModified, '2026-07-26');
  assert.equal(jsonLdBlocks[2]['@type'], 'ItemList');
});
