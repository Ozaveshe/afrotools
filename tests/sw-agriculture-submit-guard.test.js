'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const install = require('../assets/js/lib/sw-agriculture-submit-guard');
const { apps, render } = require('../scripts/build-sw-agriculture-assigned-apps');
const excluded = new Set(['coffee-calculator', 'cooperative-calculator', 'warehouse-receipt']);
const guarded = apps.filter(app => !excluded.has(app.id));
assert.equal(guarded.length, 17);
// Explicit maintained form owners. An installed owner MUST render its native
// hooks; a missing marker cannot fall back to the old JSON assertions.
const path = require('node:path');
const fieldForms = {
  'storage-loss': { owner:'sw-storage-loss-form.js', marker:'data-storage-loss-form', runtime:'sw-storage-loss-form.js', fields:['crop','countryCode','methodKey','quantityTonnes','durationMonths','pricePerTonne'] },
  'crop-yield': { owner:'sw-crop-yield-form.js', marker:'data-crop-yield-form', runtime:'sw-crop-yield-form.js', fields:['crop','sizeUnit','currency','farmSize','yieldPerHa','marketPrice','inputCosts'] },
  'export-docs': { owner:'sw-export-docs-checklist.js', marker:'data-export-docs-checklist', runtime:'sw-export-docs-checklist.js', fields:['query','countryCode','product','destination','shipment'] },
};
function hasFieldOwner(app) {
  return Object.hasOwn(fieldForms, app.id) && fs.existsSync(path.join(__dirname,'../scripts/lib',fieldForms[app.id].owner));
}
function assertFieldForm(app, html) {
  assert(Object.hasOwn(fieldForms, app.id), 'only an explicit app may use field markup');
  const spec=fieldForms[app.id];
  assert(hasFieldOwner(app), app.id+' maintained owner exists');
  assert.equal((html.match(new RegExp(' '+spec.marker+'(?=[ >])','g'))||[]).length,1, app.id+' exact owner marker');
  assert.match(html, /<form data-agri-form data-local-submit-guard="1" novalidate>/);
  assert.doesNotMatch(html, /<textarea\b[^>]*id="scenario"/);
  for (const field of spec.fields) {
    assert.match(html,new RegExp('<(?:input|select)\\b(?=[^>]*\\bid="'+field+'")(?=[^>]*\\bname="'+field+'")[^>]*>'),app.id+' input '+field);
    assert.match(html,new RegExp('<label for="'+field+'">'),app.id+' label '+field);
  }
  for (const hook of ['data-result','data-output','data-status','data-import','data-local-script-note']) assert.match(html,new RegExp(' '+hook+'(?=[ =/>])'),app.id+' required hook '+hook);
  assert.match(html, /<button type="submit" disabled>/);
  const runtime='/assets/js/pages/'+spec.runtime;
  assert(html.indexOf(runtime)>=0, app.id+' declared controller included');
  assert(html.indexOf('sw-agriculture-submit-guard.js')>html.indexOf(runtime),app.id+' guard follows its own controller');
  const source=fs.readFileSync(path.join(__dirname,'../assets/js/pages',spec.runtime),'utf8');
  assert(source.indexOf('__SW_AGRI_TEST__')>source.lastIndexOf('addEventListener('),app.id+' readiness hook only after real handlers bind');
  assert.doesNotMatch(source,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket/,app.id+' calculation/report stays local');
}
let fieldFormMutationNegatives=0;
for (const app of guarded) {
  const html = render(app);
  if (hasFieldOwner(app)) {
    assertFieldForm(app,html);
    const spec=fieldForms[app.id], field=spec.fields[0];
    const broken=[
      html.replace(' '+spec.marker,''),
      html.replace(' data-agri-form',''),
      html.replace('data-local-submit-guard="1"','data-local-submit-guard="0"'),
      html.replace('/assets/js/pages/'+spec.runtime,'/assets/js/pages/missing-controller.js'),
      html.replace(' data-output',''),
      html.replace(' data-result',''),
      html.replace('name="'+field+'"','name="missing-field"'),
      html.replace('<label for="'+field+'">','<label for="wrong-field">'),
    ];
    for (const mutation of broken) { assert.throws(()=>assertFieldForm(app,mutation),app.id+' malformed field form cannot fall back');fieldFormMutationNegatives++; }
  } else {
    for (const spec of Object.values(fieldForms)) assert(!html.includes(spec.marker),app.id+' cannot impersonate another field owner');
  assert.match(html, /<form data-agri-form data-local-submit-guard="1">/);
  assert.match(html, /<textarea id="scenario" rows=/);
  assert.doesNotMatch(html, /name="scenario"/);
  assert.match(html, /<button type="submit" disabled>/);
  assert.match(html, /<p data-local-script-note>/);
  assert(html.indexOf('sw-agriculture-submit-guard.js') > html.indexOf('sw-agriculture-assigned-parity.js'));
  }
}
console.log("Explicit field-form malformed markup negatives:",fieldFormMutationNegatives);
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
