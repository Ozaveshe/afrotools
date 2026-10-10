'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const acorn = require('acorn');
const now = Date.parse('2026-10-10T12:00:00Z');
class FixedDate extends Date { static now() { return now; } }

// Execute the native controller functions with a small event adapter. Browser
// tests separately cover the served artifact and real controls/downloads.
function runtime(locale) {
  const file = locale === 'en' ? 'currency-converter-vip.js' : 'currency-converter-locales-vip.js';
  const source = fs.readFileSync(path.join(__dirname, '../assets/js/pages', file), 'utf8');
  const body = acorn.parse(source, { ecmaVersion: 'latest' }).body[0].expression.callee.body.body;
  const code = body.filter(n => ['VariableDeclaration', 'FunctionDeclaration'].includes(n.type))
    .map(n => source.slice(n.start, n.end)).join('\n');
  const nodes = {};
  const node = id => nodes[id] ||= { value: '', hidden: false, textContent: '', events: {},
    addEventListener(type, handler) { this.events[type] = handler; }, focus() {} };
  const radio = node('radio'); radio.value = 'snapshot';
  const context = { Date: FixedDate, Intl, URLSearchParams, location: { search: '' }, copied: 0,
    navigator: { clipboard: { writeText: async () => { context.copied++; } } },
    document: { documentElement: { lang: locale }, getElementById: node,
      querySelector: () => radio, querySelectorAll: () => [radio] } };
  vm.createContext(context); vm.runInContext(code, context);
  const run = expression => vm.runInContext(expression, context);
  const accept = value => { context.input = value; return run('acceptedSnapshot(input)'); };
  return { context, node, radio, run, accept };
}
const snapshot = () => ({ schemaVersion: 1, base: 'USD', source: 'fawazahmed',
  timestamp: '2026-10-09T00:00:00Z', rates: { NGN: 1500, KES: 130, ZWL: 6800 }, retained_rate_codes: ['ZWL'] });

for (const locale of ['en', 'fr', 'sw']) {
  test(locale + ' rejects missing, expired, future and unsupported retained observations', () => {
    const { accept } = runtime(locale);
    assert.equal(accept(snapshot()).rates.ZWL, undefined);
    for (const change of [{ observed_at: '2026-09-01T00:00:00Z' },
      { observed_at: '2026-10-11T00:00:00Z' }, { observed_at: 'invalid' },
      { source: 'unknown' }, { rate: 6801 }]) {
      const data = snapshot(); data.rate_observations = { ZWL: { rate: 6800,
        source: 'frankfurter', observed_at: '2026-10-08T00:00:00Z', ...change } };
      const before = JSON.stringify(data);
      assert.equal(accept(data).rates.ZWL, undefined);
      assert.equal(JSON.stringify(data), before);
    }
    for (const change of [{ base: 'EUR' }, { source: 'unknown' },
      { retained_rate_codes: null }, { timestamp: '2026-10-11T00:00:00Z' }]) {
      assert.equal(accept({ ...snapshot(), ...change }), null);
    }
  });
  test(locale + ' preserves the original date/provider for a valid retained cross-rate', () => {
    const r = runtime(locale), data = snapshot();
    data.rate_observations = { ZWL: { rate: 6800, source: 'frankfurter', observed_at: '2026-10-08T00:00:00Z' } };
    r.context.accepted = r.accept(data);
    r.run('state.rates=accepted.rates;state.observations=accepted.observations');
    const pair = r.run("pairObservation('NGN','ZWL')");
    assert.equal(pair.date, '2026-10-08T00:00:00.000Z');
    assert.match(pair.source, /frankfurter/i);
    r.node('fxAmount').value = '100'; r.node('fxFrom').value = 'USD'; r.node('fxTo').value = 'NGN';
    r.node('fxManualRate').value = '2'; r.radio.value = 'manual';
    r.run('calculate({preventDefault(){}})');
    assert.equal(r.run('state.result.converted'), 200);
  });
  test(locale + ' accepts API rounding but rejects unqualified API rows', () => {
    const { accept } = runtime(locale), base = { status: 'available', rate: 1,
      source: 'fawazahmed', observed_at: '2026-10-09T00:00:00Z' };
    const data = { base: 'USD', source: 'fawazahmed', timestamp: base.observed_at,
      rates: { NGN: 1500.123457 }, qualification: { NGN: { status: 'available', reason: null,
        base, target: { ...base, rate: 1500.1234568 } } } };
    assert.equal(accept(data).rates.NGN, 1500.123457);
    for (const change of [{ status: 'unavailable' }, { reason: 'missing-observation' },
      { target: { ...base, rate: 1 } }, { base: { ...base, source: 'unknown' } }]) {
      assert.equal(accept({ ...data, qualification: { NGN: { ...data.qualification.NGN, ...change } } }), null);
    }
  });
}

for (const action of ['amount', 'manualRate', 'from', 'to', 'mode', 'swap', 'invalidSubmit']) {
  test('English result cannot be copied after ' + action + ' changes', () => {
    const r = runtime('en'); r.run('load=function(){};init()');
    r.context.accepted = r.accept(snapshot()); r.run('renderSource(accepted)');
    r.node('fxAmount').value = '100'; r.node('fxFrom').value = 'USD'; r.node('fxTo').value = 'NGN';
    r.run('calculate({preventDefault(){}})'); assert.equal(r.run('state.result.converted'), 150000);
    if (action === 'amount') { r.node('fxAmount').value = '200'; r.node('fxAmount').events.input(); }
    if (action === 'manualRate') { r.node('fxManualRate').value = '2'; r.node('fxManualRate').events.input(); }
    if (action === 'from' || action === 'to') { const node = r.node(action === 'from' ? 'fxFrom' : 'fxTo'); node.value = 'KES'; node.events.change(); }
    if (action === 'mode') { r.radio.value = 'manual'; r.radio.events.change(); }
    if (action === 'swap') r.node('fxSwap').events.click();
    if (action === 'invalidSubmit') { r.node('fxAmount').value = '-1'; r.run('calculate({preventDefault(){}})'); }
    assert.equal(r.run('state.result'), null); assert.equal(r.node('fxResult').hidden, true);
    r.run('copy()'); assert.equal(r.context.copied, 0);
  });
}
