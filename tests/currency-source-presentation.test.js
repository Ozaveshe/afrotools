'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const acorn = require('acorn');
const hooks = require('../scripts/apply-source-confidence-hooks');
const ROOT = path.resolve(__dirname, '..');
const sourcePath = path.join(ROOT, 'assets/js/pages/currency-converter-vip.js');
const pagePath = path.join(ROOT, 'tools/currency-converter/index.html');
const NOW = Date.parse('2026-10-10T12:00:00Z');
class FixedDate extends Date { static now() { return NOW; } }

function runtime() {
  const source = fs.readFileSync(sourcePath, 'utf8');
  const body = acorn.parse(source, { ecmaVersion: 'latest' }).body[0].expression.callee.body.body;
  const code = body.filter(n => ['VariableDeclaration', 'FunctionDeclaration'].includes(n.type)).map(n => source.slice(n.start, n.end)).join('\n');
  const nodes = {};
  function node(id) { return nodes[id] ||= { value: '', textContent: '', hidden: false, href: '', className: '', events: {}, addEventListener(type, fn) { this.events[type] = fn; }, focus() {} }; }
  const radio = node('radio'); radio.value = 'snapshot';
  const context = { Date: FixedDate, Intl, URLSearchParams, location: { search: '' }, document: { getElementById: node, querySelector: () => radio, querySelectorAll: () => [radio] } };
  vm.createContext(context); vm.runInContext(code, context);
  const run = expression => vm.runInContext(expression, context);
  run('load=function(){};init()');
  function render(data) { context.input = data; run('var accepted=acceptedSnapshot(input);if(!accepted)throw new Error("fixture rejected");renderSource(accepted)'); }
  return { node, radio, run, render };
}
function snapshot() { return { schemaVersion: 1, base: 'USD', source: 'exchangerate-api', timestamp: '2026-10-09T00:00:00Z', rates: { NGN: 1334.4164, KES: 130 }, retained_rate_codes: [] }; }
const methods = ['fxSourceMethodology', 'fxSourceMethodologySecondary'];

test('accepted pair shows its provider methodology and actual observation date', () => {
  const r = runtime(); r.render(snapshot());
  assert.equal(r.node('fxSourceLabel').textContent, 'ExchangeRate-API via AfroTools');
  assert.match(r.node('fxSourceDate').textContent, /^Pair observation date: .*9 Oct|^Pair observation date: .*Oct 9/);
  assert.equal(r.node(methods[0]).href, 'https://www.exchangerate-api.com/docs/free');
  assert.equal(r.node(methods[0]).hidden, false); assert.equal(r.node(methods[1]).hidden, true);
  r.node('fxAmount').value = '100'; r.run('calculate({preventDefault(){}})');
  assert.equal(r.run('state.result.converted'), 133441.64);
});

test('mixed retained pair names both sources, keeps older pair date and changes methods with pair', () => {
  const data = snapshot(); data.retained_rate_codes = ['KES']; data.rate_observations = { KES: { rate: 130, source: 'frankfurter', observed_at: '2026-10-08T00:00:00Z' } };
  const r = runtime(); r.render(data); r.node('fxTo').value = 'KES'; r.node('fxTo').events.change();
  assert.equal(r.node('fxSourceLabel').textContent, 'ExchangeRate-API via AfroTools + Frankfurter via AfroTools');
  assert.match(r.node('fxSourceDate').textContent, /Oct 8|8 Oct/);
  assert.equal(r.node(methods[1]).href, 'https://frankfurter.dev/'); assert.equal(r.node(methods[1]).hidden, false);
  r.node('fxTo').value = 'NGN'; r.node('fxTo').events.change();
  assert.equal(r.node(methods[1]).hidden, true); assert.equal(r.node(methods[1]).href, '');
  assert.equal(r.node('fxSourceLabel').textContent, 'ExchangeRate-API via AfroTools');
  assert.match(r.node('fxSourceDate').textContent, /Oct 9|9 Oct/);
});

test('fawaz observation has its own fixed source link without changing rate qualification', () => {
  const data = snapshot(); data.source = 'fawazahmed'; const before = JSON.stringify(data);
  const r = runtime(); r.render(data);
  assert.equal(r.node(methods[0]).href, 'https://github.com/fawazahmed0/exchange-api');
  assert.equal(JSON.stringify(data), before);
});

test('manual mode never presents a dataset method as the user quote source', () => {
  const r = runtime(); r.render(snapshot()); r.radio.value = 'manual'; r.radio.events.change();
  assert.equal(r.node('fxSourceLabel').textContent, 'User-provided quote');
  assert.match(r.node('fxSourceDate').textContent, /not verified/);
  for (const id of methods) { assert.equal(r.node(id).hidden, true); assert.equal(r.node(id).href, ''); }
  r.node('fxManualRate').value = '2'; r.node('fxAmount').value = '100'; r.run('calculate({preventDefault(){}})');
  assert.equal(r.run('state.result.converted'), 200);
  r.radio.value = 'snapshot'; r.radio.events.change();
  assert.equal(r.node('fxSourceLabel').textContent, 'ExchangeRate-API via AfroTools');
  assert.equal(r.node(methods[0]).hidden, false);
});

for (const reason of ['stale', 'error']) test(reason + ' failure and manual round trip clear provider methods and preserve failure meaning', () => {
  const r = runtime(); r.render(snapshot()); r.run('failClosed("' + reason + '")');
  assert.equal(r.node('fxConvert').disabled, true);
  r.radio.value = 'manual'; r.radio.events.change(); r.radio.value = 'snapshot'; r.radio.events.change();
  assert.equal(r.node('fxSourceLabel').textContent, 'Snapshot conversion paused');
  assert.match(r.node('fxSourceDate').textContent, reason === 'stale' ? /more than seven days old/ : /No valid dated dataset/);
  for (const id of methods) assert.equal(r.node(id).hidden, true);
});

test('unavailable selected pair does not retain a different pair source link', () => {
  const r = runtime(); r.render(snapshot()); r.node('fxTo').value = 'XXX'; r.node('fxTo').events.change();
  assert.equal(r.node('fxSourceLabel').textContent, 'Source unavailable for this pair');
  for (const id of methods) assert.equal(r.node(id).hidden, true);
});

test('runtime disclosure replaces only this converter static hook and misleading invariant provider', () => {
  const html = fs.readFileSync(pagePath, 'utf8');
  assert.equal(hooks.hasRuntimeCurrencySource(html, 'forex-third-party-snapshot', 'tools/currency-converter/index.html'), true);
  assert.ok(!html.includes('data-source-meta-id="forex-third-party-snapshot"'));
  assert.ok(!html.includes('"isBasedOn": "https://github.com/fawazahmed0/exchange-api"'));
  const retained = hooks.addSourceHook(html, 'forex-third-party-snapshot', 'tools/currency-converter/index.html');
  assert.equal(retained.html, html); assert.equal(retained.action, 'already-present');
  assert.equal(hooks.hasRuntimeCurrencySource(html, 'forex-third-party-snapshot', 'tools\\currency-converter\\index.html'), true);
  assert.equal(hooks.hasRuntimeCurrencySource(html, 'other-source', 'tools/currency-converter/index.html'), false);
  assert.equal(hooks.hasRuntimeCurrencySource(html, 'forex-third-party-snapshot', 'tools/forex-profit/index.html'), false);
  const missing = html.replace('id="fxSourceMethodologySecondary"', 'id="missing-method"');
  assert.equal(hooks.hasRuntimeCurrencySource(missing, 'forex-third-party-snapshot', 'tools/currency-converter/index.html'), false);
  assert.match(hooks.addSourceHook(missing, 'forex-third-party-snapshot', 'tools/currency-converter/index.html').html, /data-source-meta-id="forex-third-party-snapshot"/);
});
