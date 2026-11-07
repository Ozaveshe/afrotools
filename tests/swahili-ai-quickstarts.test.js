'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = process.env.AFROTOOLS_TEST_ROOT || path.resolve(__dirname, '..');
const OVERLAY = process.env.AFROTOOLS_TEST_OVERLAY;
function read(file) {
  const candidate = OVERLAY && path.join(OVERLAY, file);
  return fs.readFileSync(candidate && fs.existsSync(candidate) ? candidate : path.join(ROOT, file), 'utf8');
}

function generatedSwPage() {
  const pages = new Map(['fr/ai/index.html', 'sw/ai/index.html', 'fr/api/index.html', 'sw/api/index.html'].map(file => [path.resolve(ROOT, file), read(file)]));
  const fakeFs = {
    readFileSync: file => pages.has(path.resolve(file)) ? pages.get(path.resolve(file)) : read(path.relative(ROOT, file)),
    existsSync: file => pages.has(path.resolve(file)),
    writeFileSync: (file, content) => pages.set(path.resolve(file), content)
  };
  const context = {
    require: name => name === 'fs' ? fakeFs : require(name),
    __dirname: path.join(ROOT, 'scripts'), module: { exports: {} },
    process: { argv: ['node', 'owner', '--write'] }, console: { log() {}, error() {} }
  };
  vm.runInNewContext(read('scripts/build-localized-ai-api-pages.js'), context);
  const first = pages.get(path.resolve(ROOT, 'sw/ai/index.html'));
  vm.runInNewContext(read('scripts/build-localized-ai-api-pages.js'), { ...context });
  assert.equal(pages.get(path.resolve(ROOT, 'sw/ai/index.html')), first, 'owner is idempotent');
  return first;
}

function runtime() {
  const root = { URLSearchParams };
  root.window = root;
  for (const file of ['components/tool-registry.js', 'ai/tool-manifest.js', 'ai/guardrails.js', 'ai/i18n.js', 'ai/swahili-route-map.generated.js', 'ai/intent-router.js']) {
    vm.runInNewContext(read('assets/js/' + file), root);
  }
  const entry = { module: { exports: {} } };
  vm.runInNewContext(read('assets/js/pages/sw-ai-route-entry.js'), entry);
  root.entry = entry.module.exports;
  return root;
}

function attachPage(root, query, value = '') {
  const nodes = {};
  const redirects = [];
  const node = tag => ({
    tag, children: [], dataset: {}, attributes: {}, textContent: '',
    appendChild(child) { this.children.push(child); if (child.id) nodes[child.id] = child; },
    replaceChildren() { this.children = []; },
    setAttribute(name, value) { this.attributes[name] = value; },
    addEventListener(name, fn) { this[name] = fn; },
    focus() { this.focused = true; }
  });
  const form = node('form');
  const input = node('input'); input.form = form; input.value = value;
  nodes.aiSwQuery = input;
  const note = node('p');
  root.document = { getElementById: id => nodes[id], createElement: node, querySelector: () => note };
  root.location = { search: query, replace: url => redirects.push(url) };
  root.fetch = () => { throw Error('Routing must not use the network'); };
  root.entry.boot(root);
  return { input, form, nodes, redirects, note };
}

const expected = [
  ['paye-calculator', '/sw/mshahara-na-kodi/paye/'],
  ['import-duty', '/sw/zana/gharama-bidhaa/'],
  ['cv-builder', '/sw/zana/mjenzi-cv/'],
  ['solar-vs-generator', '/sw/zana/solar-dhidi-ya-generator/'],
  ['pdf-workspace', '/sw/zana/nafasi-pdf/'],
  ['cost-of-living', '/sw/zana/gharama-za-maisha/']
];

test('generated Swahili quickstarts retain prompts, locale and canonical metadata', () => {
  const before = read('sw/ai/index.html');
  const after = generatedSwPage();
  const links = [...after.matchAll(/class="ai-local-link" href="([^"]*[?]lang=sw&amp;q=[^"]+)"/g)].map(match => new URL(match[1].replace(/&amp;/g, '&'), 'https://afrotools.com'));
  const oldPrompts = [...before.matchAll(/class="ai-local-link" href="([^"]*[?]lang=sw&amp;q=[^"]+)"/g)].map(match => new URL(match[1].replace(/&amp;/g, '&'), 'https://afrotools.com').searchParams.get('q'));
  assert.equal(links.length, 6);
  links.forEach((url, i) => { assert.equal(url.pathname, '/sw/ai/'); assert.equal(url.searchParams.get('lang'), 'sw'); assert.equal(url.searchParams.get('q'), oldPrompts[i]); });
  assert.match(after, /<form class="ai-local-form" action="\/sw\/ai\/" method="get" role="search">/);
  assert.deepEqual(after.match(/<link\b[^>]*(?:canonical|hreflang)[^>]*>/g), before.match(/<link\b[^>]*(?:canonical|hreflang)[^>]*>/g));
  const scripts = [...after.matchAll(/<script src="([^"?]+)(?:\?[^"]*)?"[^>]*>/g)].map(match => match[1]);
  for (const name of ['components/tool-registry.min.js', 'ai/tool-manifest.js', 'ai/guardrails.js', 'ai/i18n.js', 'ai/swahili-route-map.generated.js', 'ai/intent-router.js']) {
    assert.equal(scripts.filter(src => src === '/assets/js/' + name).length, 1);
    assert.ok(scripts.indexOf('/assets/js/' + name) < scripts.indexOf('/assets/js/pages/sw-ai-route-entry.js'));
  }
});

test('each of the six real quickstart prompts stays visible and yields the relevant accepted workflow only after submission', () => {
  const html = generatedSwPage();
  const links = [...html.matchAll(/class="ai-local-link" href="([^"]*[?]lang=sw&amp;q=[^"]+)"/g)];
  const root = runtime();
  links.forEach((match, i) => {
    const url = new URL(match[1].replace(/&amp;/g, '&'), 'https://afrotools.com');
    const page = attachPage(root, url.search);
    assert.equal(page.input.value, url.searchParams.get('q'));
    assert.equal(page.nodes.aiSwResult, undefined, 'loading q must not run or submit');
    assert.equal(page.redirects.length, 0);
    let prevented = false;
    page.form.submit({ preventDefault() { prevented = true; } });
    assert.ok(prevented);
    const result = page.nodes.aiSwResult;
    const link = result.children.find(child => child.tag === 'a');
    assert.equal(link.href, expected[i][1], expected[i][0]);
    assert.equal(root.AfroToolsAISwahiliRouteMap.ids[expected[i][0]], link.href);
    assert.match(link.textContent, /^Fungua: /);
    assert.doesNotMatch(link.textContent, /zana ya Kiswahili$/, 'link names actual tool');
    assert.equal(result.attributes['aria-live'], 'polite');
    if (i === 1) assert.ok(result.children.some(child => child.textContent === 'AfroTools itumie thamani gani ya bidhaa au gari?'), 'import clarification is Swahili');
    assert.equal(page.redirects.length, 0, 'opening selected tool is a separate user action');
  });
});

test('unknown input, unavailable router or thrown error gives a Swahili catalog fallback without claiming an answer', () => {
  for (const available of [true, false, 'throws']) {
    const root = runtime();
    if (!available) delete root.AfroToolsAIIntentRouter;
    if (available === 'throws') root.AfroToolsAIIntentRouter.routeDeterministically = () => { throw Error('synthetic cached dependency failure'); };
    const page = attachPage(root, '?q=zzxyzzxyzzxy');
    page.form.submit({ preventDefault() {} });
    const link = page.nodes.aiSwResult.children.find(child => child.tag === 'a');
    assert.equal(link.href, '/sw/zana-zote/');
    assert.equal(link.textContent, 'Vinjari zana za Kiswahili');
  }
});

test('query prefill never overwrites user edits or renders prompt HTML; accepted tool entry remains supported', () => {
  const root = runtime();
  let page = attachPage(root, '?q=PDF', 'edited query');
  assert.equal(page.input.value, 'edited query');
  page = attachPage(root, '?q=' + encodeURIComponent('<img src=x onerror=alert(1)>'));
  assert.equal(page.input.value, '<img src=x onerror=alert(1)>');
  assert.equal(page.nodes.aiSwResult, undefined);
  page = attachPage(root, '?tool=cv-builder');
  assert.deepEqual(page.redirects, ['/sw/zana/mjenzi-cv/?source=sw-ai-tool']);
  page = attachPage(root, '?tool=unknown-tool');
  assert.equal(page.input.value, 'unknown tool');
  assert.equal(page.note.dataset.aiToolStatus, 'not-accepted');
  page = attachPage(root, '');
  page.form.submit({ preventDefault() {} });
  assert.equal(page.input.focused, true);
  assert.equal(page.nodes.aiSwResult, undefined);
});
