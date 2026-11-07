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
function generated() {
  const pages = new Map(['fr/ai/index.html', 'sw/ai/index.html', 'fr/api/index.html', 'sw/api/index.html'].map(file => [path.resolve(ROOT, file), read(file)]));
  const fakeFs = {
    readFileSync: file => pages.has(path.resolve(file)) ? pages.get(path.resolve(file)) : read(path.relative(ROOT, file)),
    existsSync: file => pages.has(path.resolve(file)),
    writeFileSync: (file, content) => pages.set(path.resolve(file), content)
  };
  const context = { require: name => name === 'fs' ? fakeFs : require(name), __dirname: path.join(ROOT, 'scripts'), module: { exports: {} }, process: { argv: ['node', 'owner', '--write'] }, console: { log() {}, error() {} } };
  vm.runInNewContext(read('scripts/build-localized-ai-api-pages.js'), context);
  const first = pages.get(path.resolve(ROOT, 'sw/ai/index.html'));
  vm.runInNewContext(read('scripts/build-localized-ai-api-pages.js'), { ...context });
  assert.equal(pages.get(path.resolve(ROOT, 'sw/ai/index.html')), first);
  return first;
}
function page(query = '') {
  const nodes = {}, timers = new Map(), documentEvents = {}, calls = [];
  let nextTimer = 0;
  function node(tag) {
    return { tag, children: [], dataset: {}, attributes: {}, value: '', textContent: '', listeners: {},
      appendChild(child) { this.children.push(child); if (child.id) nodes[child.id] = child; },
      replaceChildren() { this.children = []; },
      setAttribute(name, value) { this.attributes[name] = value; },
      addEventListener(name, fn) { (this.listeners[name] ||= []).push(fn); },
      focus() { this.focused = true; }
    };
  }
  const form = node('form'), input = node('input'); input.form = form; nodes.aiSwQuery = input;
  const root = { URLSearchParams, location: { search: '?q=' + encodeURIComponent(query), replace() { throw Error('Unexpected navigation'); } },
    document: { getElementById: id => nodes[id], createElement: node, querySelector: () => null, addEventListener: (name, fn) => (documentEvents[name] ||= []).push(fn) },
    setTimeout(fn) { timers.set(++nextTimer, fn); return nextTimer; }, clearTimeout(id) { timers.delete(id); },
    fetch() { throw Error('No model or network request is permitted'); }
  };
  root.window = root;
  const context = vm.createContext(root);
  const html = generated();
  const inline = html.match(/<script data-afrotools-sw-ai-submit>\s*([\s\S]*?)<\/script>/);
  assert.ok(inline, 'generated form must install the early guard before deferred scripts');
  vm.runInContext(inline[1], context);
  function submit() {
    let prevented = false;
    const event = { preventDefault() { prevented = true; } };
    (form.listeners.submit || []).slice().forEach(fn => fn(event));
    assert.ok(prevented, 'explicit submit cannot navigate away before local result');
  }
  function ready(withRouter = true) {
    if (withRouter) {
      const document = root.document;
      delete root.document;
      for (const file of ['components/tool-registry.js', 'ai/tool-manifest.js', 'ai/guardrails.js', 'ai/i18n.js', 'ai/swahili-route-map.generated.js', 'ai/intent-router.js']) vm.runInContext(read('assets/js/' + file), context);
      root.document = document;
      const route = root.AfroToolsAIIntentRouter.routeDeterministically;
      root.AfroToolsAIIntentRouter.routeDeterministically = (text, options) => { calls.push(text); return route(text, options); };
    }
    vm.runInContext(read('assets/js/pages/sw-ai-route-entry.js'), context);
  }
  return { root, html, input, form, nodes, timers, calls, submit, ready,
    domReady() { (documentEvents.DOMContentLoaded || []).forEach(fn => fn()); },
    expire() { const list = [...timers.values()]; timers.clear(); list.forEach(fn => fn()); },
    resultLink() { return nodes.aiSwResult?.children.find(child => child.tag === 'a'); },
    resultText() { return (nodes.aiSwResult?.children || []).map(child => child.textContent).join(' '); }
  };
}

test('owner places exactly one early guard immediately after main form and preserves canonical/hreflang', () => {
  const html = generated();
  assert.equal((html.match(/data-afrotools-sw-ai-submit/g) || []).length, 1);
  assert.match(html, /<\/form>\s*<script data-afrotools-sw-ai-submit>/);
  assert.ok(html.indexOf('data-afrotools-sw-ai-submit') < html.indexOf('/assets/js/ai/intent-router.js'));
  assert.deepEqual(html.match(/<link\b[^>]*(?:canonical|hreflang)[^>]*>/g), read('sw/ai/index.html').match(/<link\b[^>]*(?:canonical|hreflang)[^>]*>/g));
});

test('all six real early click/Enter submissions show progress and route once ready; double submits do not duplicate work', () => {
  const html = generated();
  const prompts = [...html.matchAll(/class="ai-local-link" href="([^"]*[?]lang=sw&amp;q=[^"]+)"/g)].map(match => new URL(match[1].replace(/&amp;/g, '&'), 'https://afrotools.com').searchParams.get('q'));
  const routes = ['/sw/mshahara-na-kodi/paye/', '/sw/zana/gharama-bidhaa/', '/sw/zana/mjenzi-cv/', '/sw/zana/solar-dhidi-ya-generator/', '/sw/zana/nafasi-pdf/', '/sw/zana/gharama-za-maisha/'];
  assert.equal(prompts.length, 6);
  prompts.forEach((prompt, i) => {
    const p = page(prompt);
    assert.equal(p.input.value, prompt);
    p.submit(); p.submit();
    assert.match(p.resultText(), /Inapakia utafutaji wa zana/);
    assert.equal(p.resultLink().href, '/sw/zana-zote/', 'catalog is available even during loading');
    p.ready();
    assert.deepEqual(p.calls, [prompt]);
    assert.equal(p.resultLink().href, routes[i]);
    assert.equal(p.timers.size, 0);
    p.submit();
    assert.equal(p.calls.length, 1);
  });
});

test('ordinary q load does not submit; early submission consumes exact current edits instead of stale URL prompt', () => {
  let p = page('PDF'); p.ready();
  assert.equal(p.calls.length, 0); assert.equal(p.nodes.aiSwResult, undefined);
  p = page('Linganisha sola na jenereta kwa duka Lagos'); p.submit();
  p.input.value = 'Tengeneza CV ya mhandisi wa umeme Ghana'; p.ready();
  assert.deepEqual(p.calls, ['Tengeneza CV ya mhandisi wa umeme Ghana']);
  assert.equal(p.input.value, 'Tengeneza CV ya mhandisi wa umeme Ghana');
  assert.equal(p.resultLink().href, '/sw/zana/mjenzi-cv/');
  p.input.value = 'Compress sign na export PDF bila kupakia'; p.submit();
  assert.equal(p.calls.length, 2); assert.equal(p.resultLink().href, '/sw/zana/nafasi-pdf/');
});

test('failed or slow runtime leaves a usable catalog link and never an endless loading state', () => {
  let p = page('PDF'); p.submit(); p.domReady();
  assert.doesNotMatch(p.resultText(), /Inapakia/); assert.equal(p.resultLink().href, '/sw/zana-zote/');
  assert.equal(p.timers.size, 0); p.submit(); assert.doesNotMatch(p.resultText(), /Inapakia/);
  p = page('PDF'); p.submit(); p.expire();
  assert.doesNotMatch(p.resultText(), /Inapakia/); assert.equal(p.resultLink().href, '/sw/zana-zote/');
  p.ready(); assert.equal(p.calls.length, 1); assert.equal(p.resultLink().href, '/sw/zana/nafasi-pdf/');
  p = page('PDF'); p.submit(); p.ready(false);
  assert.doesNotMatch(p.resultText(), /Inapakia/); assert.equal(p.resultLink().href, '/sw/zana-zote/');
  assert.equal(p.timers.size, 0);
});

test('empty input creates no queued work and preserves a usable editable form', () => {
  let p = page(''); p.submit();
  assert.equal(p.input.focused, true); assert.equal(p.nodes.aiSwResult, undefined);
  p.ready(); assert.equal(p.calls.length, 0); assert.equal(p.form.disabled, undefined);
  p = page('PDF'); p.submit(); p.input.value = ''; p.ready();
  assert.equal(p.calls.length, 0); assert.doesNotMatch(p.resultText(), /Inapakia/); assert.equal(p.timers.size, 0);
  p = page('PDF'); p.submit(); p.input.value = ''; p.submit(); p.ready();
  assert.equal(p.calls.length, 0); assert.doesNotMatch(p.resultText(), /Inapakia/); assert.equal(p.timers.size, 0);
  p = page('PDF'); p.ready(); p.submit(); p.input.value = ''; p.submit(); p.input.value = 'PDF'; p.submit();
  assert.equal(p.calls.length, 2); assert.equal(p.resultLink().href, '/sw/zana/nafasi-pdf/');
});
