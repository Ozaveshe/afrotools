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

// Execute the complete shipped init/load path. Select replacement resets its
// value like a native single-select, and values must belong to its options.
function pendingSnapshotRuntime(locale, search = '') {
  const filename = path.join(__dirname, '../assets/js/pages', locale === 'en' ? 'currency-converter-vip.js' : 'currency-converter-locales-vip.js');
  const nodes = new Map(), requests = [], copied = [], downloads = [];
  function node(id) {
    if (nodes.has(id)) return nodes.get(id);
    let value = '', html = '', options = [];
    const select = id === 'fxFrom' || id === 'fxTo';
    const item = { hidden: id === 'fxResult' || id === 'fxManualGroup', textContent: '', events: {},
      addEventListener(type, fn) { this.events[type] = fn; }, focus() {},
      querySelector(selector) { const code = selector.match(/^option\[value="([A-Z]{3})"\]$/)?.[1]; return code && options.includes(code) ? {} : null; },
      get value() { return value; }, set value(next) { value = select && !options.includes(String(next)) ? '' : String(next); },
      get innerHTML() { return html; }, set innerHTML(next) { html = String(next); if (select) { options = [...html.matchAll(/<option value="([A-Z]{3})"/g)].map(match => match[1]); value = options[0] || ''; } }
    };
    nodes.set(id, item); return item;
  }
  const radio = node('radio'); radio.value = 'snapshot';
  const shortcut = { events: {}, addEventListener(type, fn) { this.events[type] = fn; }, getAttribute(name) { return name === 'data-fx-from' ? 'EUR' : 'XOF'; } };
  const context = { Date: FixedDate, Intl, URLSearchParams, location: { search },
    navigator: { clipboard: { async writeText(text) { copied.push(text); } } },
    URL: { createObjectURL() { downloads.push('unexpected download'); return 'blob:synthetic'; }, revokeObjectURL() {} }, Blob,
    document: { readyState: 'complete', documentElement: { lang: locale }, getElementById: node,
      querySelector() { return radio; }, querySelectorAll(selector) { return selector.includes('rateMode') ? [radio] : selector.includes('data-fx-from') ? [shortcut] : []; },
      createElement() { return { click() {}, remove() {} }; }, body: { appendChild() {} } },
    fetch(url) { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); requests.push({ url, resolve, reject, settled: false }); return promise; }
  };
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), context, { filename });
  const tick = () => new Promise(resolve => setImmediate(resolve));
  async function reply(data) { const pending = requests.find(request => !request.settled); assert(pending); pending.settled = true; pending.resolve({ ok: true, json: async () => data }); await tick(); }
  async function rejectAll() { for (let i = 0; i < 2; i++) { const pending = requests.find(request => !request.settled); assert(pending); pending.settled = true; pending.reject(new Error('synthetic unavailable snapshot')); await tick(); } }
  function choose(from, to) { node('fxFrom').value = from; node('fxFrom').events.change(); node('fxTo').value = to; node('fxTo').events.change(); assert.equal(node('fxFrom').value, from); assert.equal(node('fxTo').value, to); }
  function submit() { node('fxForm').events.submit({ preventDefault() {} }); }
  function manual(from = 'KES', to = 'GHS') { radio.value = 'manual'; radio.events.change(); choose(from, to); node('fxAmount').value = '100'; node('fxManualRate').value = '0.1'; node('fxManualRate').events.input(); submit(); assert.equal(node('fxResult').hidden, false); }
  return { node, radio, shortcut, requests, copied, downloads, reply, rejectAll, choose, submit, manual,
    pair() { return [node('fxFrom').value, node('fxTo').value]; },
    async copy() { await node('fxCopy').events.click(); }, csv() { node('fxCsv').events.click(); } };
}
function delayedSnapshot(rates = { NGN: 1500, KES: 130, GHS: 15, EUR: 0.9, XOF: 600 }) {
  return { schemaVersion: 1, base: 'USD', source: 'fawazahmed', timestamp: '2026-10-09T00:00:00Z', rates, retained_rate_codes: [] };
}
async function assertQuoteCleared(h) {
  assert.equal(h.node('fxManualRate').value, '');
  assert.equal(h.node('fxResult').hidden, true);
  assert.equal(h.node('fxEmpty').hidden, false);
  assert.equal(h.node('fxActionStatus').textContent, '');
  await h.copy(); h.csv(); assert.equal(h.copied.length, 0); assert.equal(h.downloads.length, 0);
  h.submit(); assert.equal(h.node('fxResult').hidden, true); assert.notEqual(h.node('fxManualError').textContent, '');
}
for (const locale of ['en', 'fr', 'sw']) {
  test(locale + ' complete owner preserves a manual pair, quote and result after delayed success', async () => {
    const h = pendingSnapshotRuntime(locale); h.manual(); const before = h.node('fxResultValue').textContent;
    await h.reply(delayedSnapshot()); assert.deepEqual(h.pair(), ['KES', 'GHS']);
    assert.equal(h.node('fxManualRate').value, '0.1'); assert.equal(h.node('fxResult').hidden, false); assert.equal(h.node('fxResultValue').textContent, before);
    assert.equal(h.node('fxManualPair').textContent, '1 KES = ? GHS'); await h.copy(); assert.match(h.copied[0], /100 KES = 10\.000000 GHS/);
    h.submit(); assert.equal(h.node('fxResultValue').textContent, before); assert.equal(h.requests.length, 1);
  });
  test(locale + ' complete owner preserves manual work when both pending snapshot sources fail', async () => {
    const h = pendingSnapshotRuntime(locale); h.manual(); const before = h.node('fxResultValue').textContent;
    await h.rejectAll(); assert.deepEqual(h.pair(), ['KES', 'GHS']); assert.equal(h.node('fxManualRate').value, '0.1'); assert.equal(h.node('fxResultValue').textContent, before); assert.equal(h.node('fxResult').hidden, false);
    assert.equal(h.node('fxConvert').disabled, false); assert.deepEqual(h.requests.map(r => r.url), ['/api/forex?base=USD', '/data/forex/latest.json']);
    h.radio.value = 'snapshot'; h.radio.events.change(); assert.equal(h.node('fxConvert').disabled, true);
  });
  for (const missing of ['from', 'to', 'both']) test(locale + ' late snapshot missing ' + missing + ' changes only unsupported choices and clears the bound quote', async () => {
    const h = pendingSnapshotRuntime(locale); h.manual(); h.node('fxActionStatus').textContent = 'old export status';
    const rates = { NGN: 1500 }; if (missing !== 'from' && missing !== 'both') rates.KES = 130; if (missing !== 'to' && missing !== 'both') rates.GHS = 15;
    await h.reply(delayedSnapshot(rates)); assert.deepEqual(h.pair(), missing === 'from' ? ['USD', 'GHS'] : missing === 'to' ? ['KES', 'NGN'] : ['USD', 'NGN']);
    await assertQuoteCleared(h);
  });
  test(locale + ' untouched late URL currencies absent at bootstrap still become selected', async () => {
    const h = pendingSnapshotRuntime(locale, '?from=AED&to=UGX'); assert.deepEqual(h.pair(), ['USD', 'NGN']);
    await h.reply(delayedSnapshot({ NGN: 1500, AED: 3.67, UGX: 3700 })); assert.deepEqual(h.pair(), ['AED', 'UGX']); assert.equal(h.node('fxManualPair').textContent, '1 AED = ? UGX');
    assert.equal(h.node('fxManualRate').value, ''); assert.equal(h.node('fxResult').hidden, true);
  });
  test(locale + ' supported URL intent survives untouched but yields to a real pending pair edit', async () => {
    const untouched = pendingSnapshotRuntime(locale, '?from=EUR&to=KES'); assert.deepEqual(untouched.pair(), ['EUR', 'KES']); await untouched.reply(delayedSnapshot()); assert.deepEqual(untouched.pair(), ['EUR', 'KES']);
    const edited = pendingSnapshotRuntime(locale, '?from=EUR&to=KES'); edited.choose('KES', 'GHS'); await edited.reply(delayedSnapshot()); assert.deepEqual(edited.pair(), ['KES', 'GHS']);
  });
  test(locale + ' a manual quote binds the visible bootstrap pair before late URL currencies arrive', async () => {
    const h = pendingSnapshotRuntime(locale, '?from=AED&to=UGX'); h.radio.value = 'manual'; h.radio.events.change(); h.node('fxAmount').value = '100'; h.node('fxManualRate').value = '0.1'; h.node('fxManualRate').events.input(); h.submit();
    await h.reply(delayedSnapshot({ NGN: 1500, AED: 3.67, UGX: 3700 })); assert.deepEqual(h.pair(), ['USD', 'NGN']); assert.equal(h.node('fxManualRate').value, '0.1'); assert.equal(h.node('fxResult').hidden, false); assert.match(h.node('fxRateUsed').textContent, /USD.*NGN/);
  });
  test(locale + ' genuine select changes clear a manual quote before later snapshot settlement', async () => {
    const h = pendingSnapshotRuntime(locale); h.manual(); h.node('fxActionStatus').textContent = 'old export status'; h.node('fxFrom').value = 'USD'; h.node('fxFrom').events.change(); await assertQuoteCleared(h);
    await h.reply(delayedSnapshot()); assert.deepEqual(h.pair(), ['USD', 'GHS']); assert.equal(h.node('fxManualRate').value, '');
  });
  test(locale + ' genuine swap changes clear the quote and remain selected after late settlement', async () => {
    const h = pendingSnapshotRuntime(locale); h.manual(); h.node('fxActionStatus').textContent = 'old export status'; h.node('fxSwap').events.click(); assert.deepEqual(h.pair(), ['GHS', 'KES']); await assertQuoteCleared(h);
    await h.reply(delayedSnapshot()); assert.deepEqual(h.pair(), ['GHS', 'KES']);
  });
  test(locale + ' expired pending snapshots stay unavailable without destroying the manual pair', async () => {
    const h = pendingSnapshotRuntime(locale); h.manual(); const stale = { ...delayedSnapshot(), timestamp: '2026-09-01T00:00:00Z' }; await h.reply(stale); await h.reply(stale);
    assert.deepEqual(h.pair(), ['KES', 'GHS']); assert.equal(h.node('fxManualRate').value, '0.1'); assert.equal(h.node('fxResult').hidden, false);
    h.radio.value = 'snapshot'; h.radio.events.change(); assert.equal(h.node('fxConvert').disabled, true);
  });
  if (locale !== 'en') test(locale + ' supported localized shortcut clears its old quote and survives late options', async () => {
    const h = pendingSnapshotRuntime(locale); h.manual(); h.shortcut.events.click(); assert.deepEqual(h.pair(), ['EUR', 'XOF']); await assertQuoteCleared(h);
    await h.reply(delayedSnapshot()); assert.deepEqual(h.pair(), ['EUR', 'XOF']);
  });
}
