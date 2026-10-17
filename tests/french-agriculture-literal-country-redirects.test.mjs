import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url), retirement = require('../scripts/retire-french-english-iframe-routes.js');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
// A normal locked dev dependency, with no machine-specific path or missing-package skip.
const entry = fileURLToPath(import.meta.resolve('@netlify/redirect-matcher'));
const packageRoot = path.dirname(entry);
assert.equal(JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'))).version, '0.4.2');
for (const [file, pin] of Object.entries({
  'index.js': '99049d98c9825bf3f78635165d87319e6346166668fa39f14b648d84dcca0f2a',
  'matcher.wasm': 'c53e89bc6ef96a0558dee9ba86fca9c382ec568d8de1a07c046706615e89e856',
  'wasm_exec.js': '0c949f4996f9a89698e4b5c586de32249c3b69b7baadb64d220073cc04acba14'
})) assert.equal(sha(fs.readFileSync(path.join(packageRoot, file))), pin, file);
const { createMatcher } = await import('@netlify/redirect-matcher');
const original = fs.readFileSync(path.join(ROOT, '_redirects'), 'utf8');
const aliases = retirement.loadCountryAliases();
assert.equal(aliases.length, 138);
const pathsFor = alias => [`/${alias.sourceFile}`, `/${alias.sourceFile.replace(/\.html$/, '')}`, `/${alias.sourceFile.replace(/\.html$/, '/')}`];
const literals = aliases.flatMap(alias => pathsFor(alias).map(sourcePath => `${sourcePath}  ${alias.canonicalHub}?country=${alias.countrySlug}  301!\n`));
assert.equal(literals.length, 414);
const baseline = literals.reduce((text, line) => text.replace(line, ''), original);
const proposed = retirement.updateRedirects(original);
function rules(text) {
  return text.split(/\r?\n/).flatMap((line, index) => {
    const parts = line.trim().split(/\s+/); if (!parts[0] || parts[0].startsWith('#')) return [];
    assert.equal(parts.length, 3);
    return [{ path: parts[0], to: parts[1], status: Number(parts[2].replace('!', '')), force: parts[2].endsWith('!'), params: {}, conditions: {}, headers: {}, proxy: false }];
  });
}
const before = await createMatcher(rules(baseline), {}), after = await createMatcher(rules(proposed), {});
assert.deepEqual(before.parseErrors, []); assert.deepEqual(after.parseErrors, []);
const request = (pathname, query = '') => ({ scheme: 'https', host: 'example.invalid', path: pathname, query, headers: {}, cookies: {} });
const countryContext = { window: {} }; vm.createContext(countryContext);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'data/agriculture/country-index.js'), 'utf8'), countryContext, { timeout: 1000 });
const data = countryContext.window.AfroTools;
const presetSource = fs.readFileSync(path.join(ROOT, 'assets/js/pages/fr-agriculture-country-preset.js'), 'utf8');
const controls = new Map();
for (const family of ['crop-insurance', 'export-docs', 'poultry-roi', 'vaccination-schedule']) {
  const html = fs.readFileSync(path.join(ROOT, 'fr/agriculture', family, 'index.html'), 'utf8');
  const id = family === 'poultry-roi' ? 'countryCode' : 'country';
  const selectHtml = html.match(new RegExp(`<select\\b[^>]*\\bid=["']${id}["'][^>]*>([\\s\\S]*?)<\\/select>`, 'i'));
  assert(selectHtml);
  const options = [...selectHtml[1].matchAll(/<option\b[^>]*\bvalue=["']([^"']*)["']/gi)].map(match => ({ value: match[1] }));
  const select = { options, value: options[0]?.value || '', appendChild: option => options.push(option) };
  if (family === 'export-docs') {
    const engineContext = { window: {} }; vm.createContext(engineContext);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'engines/export-docs-directory-engine.js'), 'utf8'), engineContext, { timeout: 1000 });
    const directory = engineContext.window.AfroTools.ExportDocsDirectoryEngine.buildDirectory(data.countryIndex, data.regionLabels, Object.keys(data.regionLabels));
    assert(directory.ok); assert.equal(directory.rows.length, 54);
    const render = html.match(/function renderOptions\(\)\{[\s\S]*?\}(?=function choose)/)?.[0]; assert(render);
    // Execute the current native hub's real option renderer, not a reimplementation.
    vm.runInNewContext(render + ';renderOptions();', { directory, document: { createElement: () => ({}) }, id: requested => { assert.equal(requested, 'country'); return select; } }, { timeout: 1000 });
  }
  controls.set(family, { id, options, defaultValue: select.value });
}
function preset(family, search) {
  const control = controls.get(family); let changes = 0;
  const select = { options: control.options, value: control.defaultValue, dispatchEvent: event => { assert.equal(event.type, 'change'); changes++; } };
  const context = { window: { location: { search }, AfroTools: { countryIndex: data.countryIndex } }, document: { readyState: 'complete', getElementById: id => id === control.id ? select : null }, URLSearchParams, Event: function(type) { this.type = type; } };
  vm.runInNewContext(presetSource, context, { timeout: 1000 });
  return { value: select.value, changes };
}
let matched = 0, presetChecks = 0, compatibilityChecks = 0;
try {
  for (const alias of aliases) {
    const family = alias.sourceFile.split('/')[2];
    assert(controls.get(family).options.some(option => option.value === alias.countryCode), 'Manifest country must exist in the real native control');
    for (const pathname of pathsFor(alias)) {
      for (const query of ['', `country=${alias.countryCode === 'GH' ? 'NG' : 'GH'}&synthetic=1`]) {
        const hit = after.match(request(pathname, query)); assert.equal(hit.type, 'match'); assert.equal(hit.status, 301);
        const destination = new URL(hit.to, 'https://example.invalid');
        assert.equal(destination.pathname, alias.canonicalHub); assert.equal(destination.search, '?country=' + alias.countrySlug); assert(!hit.to.includes(':country'));
        assert.deepEqual(preset(family, destination.search), { value: alias.countryCode, changes: 1 }); matched++; presetChecks++;
      }
    }
    assert.deepEqual(preset(family, '?country=' + alias.countryCode), { value: alias.countryCode, changes: 1 }); presetChecks++;
  }
  for (const family of controls.keys()) {
    for (const suffix of ['not-a-country.html', 'not-a-country', 'not-a-country/', 'deep/not-a-country.html']) {
      for (const query of ['', 'country=XX']) { const req = request('/fr/agriculture/' + family + '/' + suffix, query); assert.deepEqual(after.match(req), before.match(req)); compatibilityChecks++; }
    }
    const known = aliases.find(alias => alias.sourceFile.split('/')[2] === family);
    for (const suffix of [known.countrySlug + '.html', known.countrySlug, known.countrySlug + '/']) {
      const req = request('/fr/agriculture/' + family + '/deep/' + suffix);
      assert.deepEqual(after.match(req), before.match(req)); compatibilityChecks++;
    }
    for (const query of ['', '?country=not-a-country', '?country=:country', '?country=XX']) {
      assert.deepEqual(preset(family, query), { value: controls.get(family).defaultValue, changes: 0 }); presetChecks++;
    }
  }
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/registry/french-agriculture-country-aliases.json'), 'utf8'));
  for (const mutate of [m => m.aliases.pop(), m => { m.aliases[0].countryCode = 'XX'; }, m => { m.aliases[0].countrySlug = 'other'; }, m => { m.aliases[0].canonicalHub = '/other/'; }, m => { m.aliases[1] = { ...m.aliases[0] }; }]) {
    const copy = structuredClone(manifest); mutate(copy); assert.throws(() => retirement.validateCountryAliases(copy, retirement.loadCountryInventory()));
  }
  const start = '# BEGIN FRENCH ENGLISH-IFRAME RETIREMENT', end = '# END FRENCH ENGLISH-IFRAME RETIREMENT';
  const strip = text => text.slice(0, text.indexOf(start)) + text.slice(text.indexOf(end) + end.length);
  assert.equal(strip(proposed), strip(original), 'Every byte outside the owned block is preserved');
  assert.equal(literals.reduce((text, line) => text.replace(line, ''), proposed), baseline, 'Only the414 known literal variant lines are added; all15 fallbacks unchanged');
  assert.equal(retirement.updateRedirects(proposed), proposed, 'Emitter is idempotent');
  const pending = retirement.buildCountryPrefillChanges().changes;
  assert.equal(pending.size, original === proposed ? 0 : 2, 'Exactly the two owned outputs require generation, or both are already current');
  for (const file of pending.keys()) assert(['_redirects', 'reports/french-english-iframe-retirement.json'].includes(path.relative(ROOT, file).split(path.sep).join('/')));
  console.log(JSON.stringify({ pass: true, aliases: aliases.length, matched, presetChecks, compatibilityChecks, invalidManifestsRejected: 5, officialMatcher: '0.4.2', noHttp: true, generatedWrites: 0 }));
} finally { before.close(); after.close(); }
