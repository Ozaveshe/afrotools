const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function runtime(selector) {
  const registryEvents = {}, timers = [];
  let loadingModule;
  const document = { documentElement: { lang: 'en' }, readyState: 'loading', addEventListener(type, fn) { if (loadingModule === 'cv-template-registry') registryEvents[type] = fn; }, getElementById() { return null; }, querySelector(query) { return query === '.cv-workspace-template-select' ? selector || null : null; }, createElement() { return { textContent: '', get innerHTML() { return String(this.textContent).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); } }; } };
  const ctx = { document, console, URLSearchParams, location: { search: "" }, setTimeout(fn) { timers.push(fn); } };
  ctx.window = ctx;
  vm.createContext(ctx);
  for (const file of ['cv-data', 'cv-app', 'cv-templates', 'cv-template-studio', 'cv-pdf-templates', 'cv-template-registry', 'cv-template-registry-studio', 'cv-template-expanded-renderers', 'cv-template-registry-expanded']) {
    loadingModule = file;
    vm.runInContext(fs.readFileSync('tools/cv-builder/js/' + file + '.js', 'utf8'), ctx, { filename: file });
  }
  // The registry's documented window.CVApp consumer gets the actual app object.
  ctx.CVApp = vm.runInContext('CVApp', ctx);
  ctx.registryEvents = registryEvents;
  ctx.flushTimers = () => { while (timers.length) timers.shift()(); };
  return ctx;
}

test('the real default Slate renderer has its own identity and readiness without changing the 30-template catalog', () => {
  const ctx = runtime();
  const selected = vm.runInContext('CVApp.getState().template', ctx);
  assert.equal(selected, 'slate');
  const registry = ctx.CVTemplateRegistry;
  assert.equal(registry.get(selected).id, selected);
  assert.equal(registry.get(selected).name, 'Slate');
  assert.equal(registry.hasRenderer(selected), true);
  assert.equal(registry.get(selected).exportReady, true);
  assert.equal(registry.get(selected).atsFriendly, false);
  assert.equal(registry.get(selected).layoutType, 'sidebar');
  assert.equal(registry.all().length, 30);
  assert.equal(registry.visible().length, 30);
  assert.equal(registry.all().some(row => row.id === 'slate'), false);
  assert.equal(registry.claimText(), '30 export-ready templates');
});

test('registry and current app renderer produce identical synthetic CV content without mutating the saved model', () => {
  const ctx = runtime();
  vm.runInContext(`var sample = createEmptyCV(); Object.assign(sample, { fn: 'AfroTools', ln: 'Sample', title: 'Administrative Assistant', email: 'sample@example.com', loc: 'Lagos, Nigeria', summary: 'Organizes records and schedules meetings.' }); sample.skills.h = 'Records management, Scheduling'; sample.skills.t = 'Excel, Word'; sample.edus = [{ deg: 'B.Sc', sch: 'Example University', y2: '2025' }];`, ctx);
  const before = JSON.stringify(ctx.sample);
  const expected = vm.runInContext('CVTemplates.slate(sample, COUNTRY_NORMS.NG, "#0062CC")', ctx);
  assert.equal(ctx.CVTemplateRegistry.render('slate', ctx.sample, 'NG', '#0062CC'), expected);
  for (const text of ['AfroTools Sample', 'Administrative Assistant', 'sample@example.com', 'Records management', 'Example University', '2025']) assert.ok(expected.includes(text), text);
  assert.equal(JSON.stringify(ctx.sample), before);
  const element = { className: 'cv-preview cv-template-print-ats-classic cv-layout-ats-plain', attributes: {}, setAttribute(key, value) { this.attributes[key] = value; } };
  ctx.CVTemplateRegistry.decoratePreview(element, 'slate');
  assert.equal(element.attributes['data-template-id'], 'slate');
  assert.equal(element.attributes['data-template-ats'], 'false');
  assert.equal(element.attributes['data-template-layout'], 'sidebar');
  assert.ok(element.className.includes('cv-template-print-slate'));
  assert.ok(!element.className.includes('ats-classic'));
});

test('a missing Slate renderer stays unavailable and unknown template fallback remains ATS Classic', () => {
  const ctx = { module: { exports: {} } };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync('tools/cv-builder/js/cv-template-registry.js', 'utf8'), ctx);
  const registry = ctx.module.exports.createRegistry({});
  assert.equal(registry.hasRenderer('slate'), false);
  assert.equal(registry.get('slate').exportReady, false);
  assert.equal(registry.get('unknown-saved-id').id, 'ats-classic');
  assert.equal(registry.hasRenderer('unknown-saved-id'), false);
});

test('actual registry sync identifies active Slate and switches to catalog choices without stale options', () => {
  const events = {};
  // Minimal native-select semantics: replacing options selects the first option;
  // assigning an absent value yields no selected option.
  const selector = {
    dataset: {}, options: [], selectedIndex: -1,
    classList: { contains(name) { return name === 'cv-workspace-template-select'; } },
    addEventListener(type, fn) { events[type] = fn; },
    set innerHTML(html) { this.options = [...html.matchAll(/<option value="([^"]+)">([^<]+)<\/option>/g)].map(m => ({ value: m[1], text: m[2] })); this.selectedIndex = this.options.length ? 0 : -1; },
    get value() { return this.options[this.selectedIndex]?.value || ''; },
    set value(value) { this.selectedIndex = this.options.findIndex(option => option.value === value); }
  };
  const ctx = runtime(selector), registry = ctx.CVTemplateRegistry;
  const originalCatalog = registry.visible().map(row => row.id).join('|');
  ctx.registryEvents.DOMContentLoaded();
  assert.equal(selector.value, 'slate');
  assert.equal(selector.options[selector.selectedIndex].text, 'Slate (current layout)');
  assert.equal(selector.options.length, 31);
  assert.equal(registry.visible().length, 30);
  assert.equal(registry.claimText(), '30 export-ready templates');

  const catalogId = registry.visible()[0].id;
  assert.notEqual(catalogId, 'slate');
  selector.value = catalogId;
  events.change();
  ctx.registryEvents.change({ target: selector });
  ctx.flushTimers();
  assert.equal(ctx.CVApp.getState().template, catalogId);
  assert.equal(selector.value, catalogId);
  assert.equal(selector.options.length, 30);
  assert.equal(selector.options.some(option => option.value === 'slate'), false);
  assert.equal(registry.visible().map(row => row.id).join('|'), originalCatalog);

  // Loading an existing Slate draft restores its honest active option.
  ctx.CVApp.setTopState('template', 'slate');
  ctx.registryEvents.DOMContentLoaded();
  ctx.registryEvents.DOMContentLoaded();
  assert.equal(selector.value, 'slate');
  assert.equal(selector.options.filter(option => option.value === 'slate').length, 1);
});
