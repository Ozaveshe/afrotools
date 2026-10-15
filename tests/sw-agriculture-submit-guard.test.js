'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const install = require('../assets/js/lib/sw-agriculture-submit-guard');
const { apps, render } = require('../scripts/build-sw-agriculture-assigned-apps');
const excluded = new Set(['coffee-calculator', 'cooperative-calculator', 'warehouse-receipt']);
const guarded = apps.filter(app => !excluded.has(app.id));
assert.equal(guarded.length, 17);
for (const app of guarded) {
  const html = render(app);
  assert.match(html, /<form data-agri-form data-local-submit-guard="1">/);
  assert.match(html, /<textarea id="scenario" rows=/);
  assert.doesNotMatch(html, /name="scenario"/);
  assert.match(html, /<button type="submit" disabled>/);
  assert.match(html, /<p data-local-script-note>/);
  assert(html.indexOf('sw-agriculture-submit-guard.js') > html.indexOf('sw-agriculture-assigned-parity.js'));
}
for (const app of apps.filter(app => excluded.has(app.id))) {
  const html = render(app);
  assert.doesNotMatch(html, /data-local-submit-guard|sw-agriculture-submit-guard|data-local-script-note/);
  // Commerce ownership is PR370: retain its independent fail-closed contract.
  assert.doesNotMatch(html, /name="scenario"/);
  assert.match(html, /data-commerce-submit-guard="1"/);
  assert.match(html, /<button type="submit" disabled>/);
  assert.match(html, /data-commerce-script-note/);
}
const controller = fs.readFileSync(require.resolve('../assets/js/pages/sw-agriculture-assigned-parity.js'), 'utf8');
function fixture({ hook = true, engine = true, id = 'fertilizer-calc' } = {}) {
  const submit = { disabled: true }, exports = [{ disabled: false }], status = { textContent: '' }, note = { hidden: false };
  let listener, capture;
  const form = { querySelector: () => submit, addEventListener: (_, fn, mode) => { listener = fn; capture = mode; } };
  const host = { querySelector: selector => selector.includes('data-status') ? status : selector.includes('data-local-script-note') ? note : form, querySelectorAll: () => exports };
  const engineContract = controller.match(new RegExp('if\\(id==="' + id + '"\\)[\\s\\S]*?a\\.(\\w+)\\.(\\w+)\\('));
  assert(engineContract, 'Original controller engine contract exists for ' + id);
  const win = { document: { querySelector: () => host }, __SW_AGRI_CONFIG__: { id },
    __SW_AGRI_TEST__: hook ? { run() {}, getLatest() {}, report() {} } : undefined,
    AfroTools: engine ? { [engineContract[1]]: { [engineContract[2]]() {} } } : {} };
  install(win);
  let prevented = false, stopped = false;
  listener({ preventDefault() { prevented = true; }, stopImmediatePropagation() { stopped = true; } });
  return { submit, exports, status, note, capture, prevented, stopped };
}
const healthy = fixture();
assert.equal(healthy.submit.disabled, false);
assert.equal(healthy.note.hidden, true);
assert.equal(healthy.capture, true);
assert.equal(healthy.prevented, true);
assert.equal(healthy.stopped, false);
for (const app of guarded) {
  assert.equal(fixture({ id: app.id }).submit.disabled, false, app.id + ' original engine method');
  assert.equal(fixture({ id: app.id, engine: false }).submit.disabled, true, app.id + ' absent engine');
}
for (const scenario of [{ hook: false }, { engine: false }]) {
  const failed = fixture(scenario);
  assert.equal(failed.submit.disabled, true);
  assert.equal(failed.note.hidden, false);
  assert.equal(failed.exports[0].disabled, true);
  assert.equal(failed.prevented, true);
  assert.equal(failed.stopped, true);
  assert.match(failed.status.textContent, /hakijapakia.*Ingizo halijatumwa/);
}
const marker = controller.indexOf('window.__SW_AGRI_TEST__=');
assert(marker > controller.indexOf('form.addEventListener("submit"'));
assert(marker > controller.indexOf('form.addEventListener("reset"'));
assert(marker > controller.indexOf('root.addEventListener("click"'));
assert(marker > controller.indexOf('root.addEventListener("change"'));
console.log('Agriculture submit boundary: 17 guarded, three commerce routes excluded; healthy and missing dependencies passed');
