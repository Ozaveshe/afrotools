'use strict';
// Runs the actual route controller and unchanged budget engine. The small event
// host below is deterministic handler evidence, not native DOM/browser proof.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const api = require('../yo/awon-ise/alawus-na-nysc/nysc-yoruba.js');
const engine = require('../tools/nysc-allowance/nysc-budget-engine.js');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'yo/awon-ise/alawus-na-nysc/index.html'), 'utf8');
const tags = [...html.matchAll(/<(input|textarea|form|section|div|p|button)\b([^>]*\bid="([^"]+)"[^>]*)>/g)];
function attr(text, name) { return (text.match(new RegExp('\\b' + name + '="([^"]*)"')) || [])[1]; }
class Element {
  constructor(tag, id) { this.tagName = tag.toUpperCase(); this.id = id; this.value = ''; this.hidden = false; this.validity = {badInput: false}; this.attributes = {}; this.listeners = {}; this.children = []; this.text = ''; }
  set textContent(value) { this.text = String(value); this.children = []; }
  get textContent() { return this.text + this.children.map(e => e.textContent).join(' '); }
  setAttribute(key, value) { this.attributes[key] = value; }
  removeAttribute(key) { delete this.attributes[key]; }
  append(...children) { this.children.push(...children); }
  appendChild(child) { this.append(child); }
  replaceChildren(...children) { this.text = ''; this.children = children; }
  addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); }
  async fire(type) { for (const fn of this.listeners[type] || []) await fn({preventDefault() {}}); }
  focus() { this.focused = true; }
  click() { this.clicked = true; }
  remove() { this.removed = true; }
}
function host() {
  const elements = Object.fromEntries(tags.map(([, tag, attrs, id]) => {
    const el = new Element(tag, id); el.value = attr(attrs, 'value') || ''; el.hidden = /\bhidden\b/.test(attrs);
    return [id, el];
  }));
  const downloads = [], copied = [], revoked = [], timers = [];
  const doc = {getElementById: id => elements[id], body: new Element('body'), createElement(tag) { const e = new Element(tag); if (tag === 'a') downloads.push(e); return e; }};
  let blob;
  const win = {navigator: {clipboard: {async writeText(text) {copied.push(text);}}}, Blob,
    URL: {createObjectURL(value) {blob = value; return 'blob:local-test';}, revokeObjectURL(value) {revoked.push(value);}},
    setTimeout(fn, ms) {timers.push({fn, ms});}, print() {win.prints++;}, prints: 0,
    fetch() {throw new Error('Network is outside the local calculation contract');}};
  Object.defineProperty(win, 'localStorage', {get() {throw new Error('Automatic persistence is forbidden');}});
  Object.defineProperty(win, 'sessionStorage', {get() {throw new Error('Automatic persistence is forbidden');}});
  api.mount(doc, win);
  return {elements, doc, win, downloads, copied, revoked, timers, get blob() {return blob;}, submit: () => elements.nyscBudgetForm.fire('submit'),
    set(values) {for (const [key, value] of Object.entries(values)) elements[key].value = String(value);},
    edit: () => elements.nyscBudgetForm.fire('input')};
}
function complete(overrides = {}) {
  return {planMonths: '10', federalMonthly: '77000', federalMonths: '10', stateMonthly: '10000', stateMonths: '6', ppaMonthly: '15000', ppaMonths: '4', otherMonthly: '5000', otherMonths: '2', oneTimeIncome: '20000', housingMonthly: '20000', foodMonthly: '25000', transportMonthly: '12000', dataMonthly: '5000', otherCostMonthly: '3000', oneTimeCosts: '40000', ...overrides};
}
test('full payer-period and cost model matches the maintained English engine', () => {
  const result = api.calculate(complete()); assert.deepEqual(result, engine.calculate(complete()));
  assert.equal(result.totalIncome, 920000); assert.equal(result.totalCosts, 690000); assert.equal(result.remainder, 230000);
});
test('all sixteen numeric fields have actual labelled HTML controls with matching limits', () => {
  assert.equal(Object.keys(api.fields).length, 16);
  for (const [key, [, min, max]] of Object.entries(api.fields)) {
    const tag = tags.find(row => row[3] === key); assert.ok(tag, key); assert.equal(attr(tag[2], 'type'), 'number');
    assert.equal(Number(attr(tag[2], 'min')), min); assert.equal(Number(attr(tag[2], 'max')), max);
    assert.equal(attr(tag[2], 'aria-describedby'), 'amountHelp');
    assert.match(html, new RegExp('<label\\b[^>]*>[^<]+<input id="' + key + '"'));
  }
});
test('historical official starting figure is editable with no invented state presets', () => {
  assert.equal(host().elements.federalMonthly.value, '77000');
  assert.equal(host().elements.stateMonthly.value, '0'); assert.equal(host().elements.ppaMonthly.value, '0');
  assert.match(html, /25 Oṣù Kẹta 2025/); assert.match(html, /yid\.fmyd\.gov\.ng/);
  assert.doesNotMatch(html, /stateTopup|33000|Lagos \(\+|value="20000"/);
});
test('blank costs remain provisional and use human Yoruba labels in TXT', () => {
  const input = complete({housingMonthly: ''}), result = api.calculate(input), text = api.makeReport(result, {});
  assert.equal(result.budgetComplete, false); assert.equal(result.bufferMonths, null);
  assert.match(text, /A kò tíì jẹ́rìí iye yìí/); assert.match(text, /Owó ilé lóṣù/);
  assert.doesNotMatch(text, /housingMonthly|Missing expense|Current result|Provisional difference/);
});
test('whitespace-only costs retain the same unknown-cost semantics as blanks', () => {
  const result = api.calculate(complete({housingMonthly: '  '}));
  assert.equal(result.budgetComplete, false); assert.deepEqual(result.missingCosts, ['housingMonthly']);
});
test('explicit zero costs complete the budget and preserve genuine zero income', () => {
  const input = complete(Object.fromEntries([...api.costKeys, 'federalMonthly', 'stateMonthly', 'ppaMonthly', 'otherMonthly', 'oneTimeIncome'].map(k => [k, '0'])));
  const result = api.calculate(input); assert.equal(result.valid, true); assert.equal(result.budgetComplete, true);
  assert.equal(result.totalIncome, 0); assert.equal(result.remainder, 0); assert.equal(result.bufferMonths, null);
});
for (const value of ['-1', 'Infinity', 'NaN', '0x10', '1,000', '1.5', '10000001']) {
  test(`rejects malformed/out-of-range monthly input ${value}`, () => {
    const r = api.calculate(complete({stateMonthly: value})); assert.equal(r.valid, false); assert.equal(r.field, 'stateMonthly');
    assert.match(r.error, /Ìrànwọ́ ìpínlẹ̀/); assert.doesNotMatch(r.error, /Enter|amount|month|Invalid/);
  });
}
for (const [key, value] of [['planMonths', ''], ['planMonths', '0'], ['planMonths', '13'], ['ppaMonths', '1.5'], ['stateMonths', '11']]) {
  test(`month validation identifies ${key}=${value}`, () => {const r = api.calculate(complete({[key]: value})); assert.equal(r.valid, false); assert.equal(r.field, key);});
}
test('native badInput is invalid even when the browser exposes an empty value', () => {
  const r = api.calculate(complete({stateMonthly: ''}), {stateMonthly: true}); assert.equal(r.valid, false); assert.equal(r.field, 'stateMonthly');
  assert.equal(api.calculate(complete({stateMonthly: ''})).stateMonthly, 0);
});
test('negative remainder remains a shortfall, zero buffer and no savings promise', () => {
  const result = api.calculate(complete({federalMonthly: '0', stateMonthly: '0', ppaMonthly: '0', otherMonthly: '0', oneTimeIncome: '0'}));
  assert.equal(result.remainder, -690000); assert.equal(result.bufferMonths, 0);
  assert.match(api.makeReport(result, {}), /Àìpé tí ètò fi hàn/);
});
test('submit renders actual engine totals and focuses the result without HTML injection', async () => {
  const h = host(); h.set({...complete(), planName: '<img src=x onerror=bad()>', sourceNotes: 'Àkọsílẹ̀ àpẹẹrẹ'}); await h.submit();
  assert.equal(h.elements.nyscResults.hidden, false); assert.equal(h.elements.nyscResults.focused, true);
  assert.match(h.elements.metricGrid.textContent, /920,000/); assert.match(h.elements.metricGrid.textContent, /690,000/);
  assert.match(h.elements.resultContext.textContent, /<img src=x onerror=bad\(\)>/);
  assert.equal(h.elements.resultContext.children.length, 0); assert.equal(h.win.AFROTOOLS_NYSC_YORUBA, true);
});
test('actual cost breakdown shows an unconfirmed blank rather than a confirmed zero', async () => {
  const h = host(); h.set(complete({housingMonthly: ''})); await h.submit();
  assert.match(h.elements.costBreakdown.children[0].textContent, /A kò tíì jẹ́rìí iye/);
  assert.match(h.elements.resultContext.textContent, /Ìnáwó kò tíì pé/);
  assert.match(h.elements.metricGrid.textContent, /Ìyàtọ̀ àkọ́kọ́/);
});
test('actual recurring cost rows label whole-plan totals while monthly assumptions stay monthly', async () => {
  const h = host(); h.set(complete()); await h.submit();
  const expected = [200000, 250000, 120000, 50000, 30000];
  for (let i = 0; i < 5; i++) {
    const row = h.elements.costBreakdown.children[i];
    assert.match(row.children[0].textContent, /àpapọ̀ fún ètò oṣù 10/);
    assert.doesNotMatch(row.children[0].textContent, /lóṣù/);
    assert.match(row.children[1].textContent, new RegExp(expected[i].toLocaleString('en-NG')));
  }
  assert.match(h.elements.costBreakdown.children[0].children[0].textContent, /Owó ilé/);
  assert.match(h.elements.incomeBreakdown.children[0].children[0].textContent, /^Ìjọba àpapọ̀/);
  const oneTime = h.elements.costBreakdown.children[5];
  assert.equal(oneTime.children[0].textContent, 'Ìnáwó ìbẹ̀rẹ̀ lẹ́ẹ̀kan');
  assert.match(oneTime.children[1].textContent, /40,000/);
  assert.doesNotMatch(oneTime.children[0].textContent, /oṣù 10/);
  await h.elements.downloadNysc.fire('click');
  assert.match(await h.blob.text(), /Owó ilé lóṣù: ₦20,000/);
});
test('invalid submit links and focuses one error, preserves values and recovers after correction', async () => {
  const h = host(); h.set(complete({stateMonthly: '-1'})); await h.submit();
  assert.equal(h.elements.nyscResults.hidden, true); assert.equal(h.elements.stateMonthly.attributes['aria-invalid'], 'true');
  assert.equal(h.elements.stateMonthly.attributes['aria-describedby'], 'amountHelp nyscError'); assert.equal(h.elements.stateMonthly.focused, true);
  assert.equal(h.elements.stateMonthly.value, '-1'); h.set({stateMonthly: '10000'}); await h.edit(); await h.submit();
  assert.equal(h.elements.nyscResults.hidden, false); assert.equal(h.elements.nyscError.textContent, '');
  assert.equal(h.elements.stateMonthly.attributes['aria-invalid'], undefined);
});
test('browser badInput passes through the actual submit handler', async () => {
  const h = host(); h.set(complete({stateMonthly: ''})); h.elements.stateMonthly.validity.badInput = true; await h.submit();
  assert.equal(h.elements.nyscResults.hidden, true); assert.equal(h.elements.stateMonthly.attributes['aria-invalid'], 'true');
});
test('edit invalidates results and suppresses stale copy, download and print', async () => {
  const h = host(); h.set(complete()); await h.submit(); h.set({federalMonthly: '80000'}); await h.edit();
  for (const key of ['copyNysc', 'downloadNysc', 'printNysc']) await h.elements[key].fire('click');
  assert.equal(h.elements.nyscResults.hidden, true); assert.equal(h.copied.length, 0); assert.equal(h.downloads.length, 0); assert.equal(h.win.prints, 0);
  await h.submit(); assert.match(h.elements.metricGrid.textContent, /950,000/);
});
test('metadata changes also suppress stale exports', async () => {
  const h = host(); h.set(complete()); await h.submit(); h.set({sourceNotes: 'Àkọsílẹ̀ tuntun'}); await h.elements.nyscBudgetForm.fire('change');
  await h.elements.downloadNysc.fire('click'); assert.equal(h.downloads.length, 0);
});
test('TXT and clipboard contain the same full Yoruba worksheet, entered assumptions and source limitations', async () => {
  const h = host(); h.set({...complete(), planName: 'Ètò àpẹẹrẹ', checkedOn: '2026-10-17', sourceNotes: 'Àkọsílẹ̀ àpẹẹrẹ, kì í ṣe data ènìyàn'}); await h.submit();
  await h.elements.copyNysc.fire('click'); await h.elements.downloadNysc.fire('click'); const txt = await h.blob.text();
  assert.equal(txt, h.copied[0]); assert.equal(h.blob.type, 'text/plain;charset=utf-8');
  assert.equal(h.downloads[0].download, 'afrotools-eto-nysc-yoruba.txt'); assert.equal(h.downloads[0].clicked, true);
  assert.match(txt, /Ètò àpẹẹrẹ/); assert.match(txt, /2026-10-17/); assert.match(txt, /920,000/); assert.match(txt, /230,000/);
  for (const key of Object.keys(api.fields)) assert.ok(txt.includes(api.fields[key][0]));
  assert.match(txt, /kì í ṣe ìlérí owó/); assert.match(txt, /yid\.fmyd\.gov\.ng/); assert.doesNotMatch(txt, /Inputs|Workflow:|Privacy:|Unnamed|Verification|Limitations/);
  assert.equal(h.timers[0].ms, 1000); h.timers[0].fn(); assert.deepEqual(h.revoked, ['blob:local-test']);
});
test('clipboard rejection gives a Yoruba TXT recovery message', async () => {
  const h = host(); h.win.navigator.clipboard.writeText = async () => {throw new Error('Denied');}; h.set(complete()); await h.submit();
  await h.elements.copyNysc.fire('click'); assert.match(h.elements.exportStatus.textContent, /Gba TXT/);
});
test('late clipboard completion does not overwrite edit/recalculate status', async () => {
  const h = host(); let resolve; h.win.navigator.clipboard.writeText = () => new Promise(r => {resolve = r;}); h.set(complete()); await h.submit();
  const pending = h.elements.copyNysc.fire('click'); await h.edit(); const status = h.elements.exportStatus.textContent; resolve(); await pending;
  assert.equal(h.elements.exportStatus.textContent, status);
});
test('failed TXT creation does not claim a saved download', async () => {
  const h = host(); h.set(complete()); await h.submit(); h.win.URL.createObjectURL = () => {throw new Error('Unavailable');};
  await h.elements.downloadNysc.fire('click'); assert.match(h.elements.exportStatus.textContent, /A kò lè pèsè TXT/); assert.equal(h.downloads.length, 0);
});
test('print invokes the actual print boundary only after valid calculation', async () => {
  const h = host(); await h.elements.printNysc.fire('click'); assert.equal(h.win.prints, 0); h.set(complete()); await h.submit();
  await h.elements.printNysc.fire('click'); assert.equal(h.win.prints, 1); assert.match(h.elements.exportStatus.textContent, /PDF/);
});
test('route remains unavailable/noindex and contains no promoted reciprocal alternate', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'data/registry/yoruba-route-manifest.json'), 'utf8'));
  assert.equal(manifest.routes.find(r => r.route === '/yo/awon-ise/alawus-na-nysc/').state, 'unavailable');
  assert.match(html, /name="robots" content="noindex, follow"/); assert.match(html, /data-yoruba-fallback role="note"/);
  assert.doesNotMatch(html, /rel="alternate"|data-yo-action-planner|data-mixed-education-batch/);
});
test('actual availability synchronizer preserves this single route byte-for-byte', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'data/registry/yoruba-route-manifest.json'), 'utf8'));
  const record = manifest.routes.find(r => r.route === '/yo/awon-ise/alawus-na-nysc/');
  assert.equal(require('../scripts/sync-yoruba-fallbacks.js').syncContent(html, record), html);
});
test('English destination is disclosed without mispronouncing the Yoruba link label as English', () => {
  const link = html.match(/<a href="\/tools\/nysc-allowance\/"[^>]*>/)[0];
  assert.match(link, /hreflang="en"/); assert.doesNotMatch(link, /\slang=/);
});
test('full numeric workflow parity includes every maintained English budget field', () => {
  const source = fs.readFileSync(path.join(root, 'tools/nysc-allowance/index.html'), 'utf8');
  const ids = [...source.matchAll(/<input id="([^"]+)" type="number"/g)].map(m => m[1]).sort();
  assert.deepEqual(Object.keys(api.fields).sort(), ids);
});
test('source and rendered report use NFC and retain no known legacy English export UI', () => {
  const script = fs.readFileSync(path.join(root, 'yo/awon-ise/alawus-na-nysc/nysc-yoruba.js'), 'utf8');
  for (const text of [html, script, api.makeReport(api.calculate(complete()), {})]) assert.equal(text, text.normalize('NFC'));
  assert.doesNotMatch(html, /Copy brief|Download \.txt|Local-first export|Verification, freshness|Capture NYSC|Ajiye shirin/);
  assert.doesNotMatch(html, /Kwíkọ́/);
  assert.match(html, /href="#main-content"/); assert.match(html, /role="alert"/); assert.match(html, /role="status"/);
});
