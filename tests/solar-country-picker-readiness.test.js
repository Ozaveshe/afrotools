const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const acorn = require('acorn');
const dataset = require('../data/energy/solar-roi-country-dataset');
const { ensureSolarCountryPickerReadiness } = require('../scripts/lib/solar-country-picker-readiness');
const isolation = require('./fixtures/solar-picker-isolation-baseline.json');
const reviewed = require('./fixtures/solar-reviewed-country-controller-contracts.json');
const root = path.resolve(__dirname, '..');
const sha256 = source => crypto.createHash('sha256').update(source).digest('hex');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

function controller(html) {
  return [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(row => row[1]).find(source => source.includes('function setupCountryPicker('));
}
function withoutPicker(node) {
  if (!node || typeof node !== 'object') return node;
  if (node.type === 'FunctionDeclaration' && node.id.name === 'setupCountryPicker') return null;
  if (Array.isArray(node)) return node.map(withoutPicker).filter(value => value !== null);
  return Object.fromEntries(Object.entries(node).filter(([key]) => !['start', 'end', 'raw'].includes(key)).map(([key, value]) => [key, withoutPicker(value)]));
}
const protectedAst = source => withoutPicker(acorn.parse(source, { ecmaVersion: 'latest' }));
const protectedHash = source => sha256(JSON.stringify(protectedAst(source)));

test('portable immutable English/French fixtures isolate picker readiness from every other controller AST node', () => {
  assert.equal(isolation.baselineCommit, 'eac06a15a6f128d8b7ddfd5b8eecf1f074cfd4b0');
  assert.equal(isolation.entries.length, 2);
  for (const fixture of isolation.entries) {
    assert.equal(sha256(fixture.controller), fixture.controllerSha256, fixture.file);
    const before = '<input id="solarCountryPageSearch"><select id="solarCountryPageSelect"></select><script>' + fixture.controller + '</script>';
    const after = ensureSolarCountryPickerReadiness(before);
    assert.notEqual(after, before, fixture.file + ' readiness is actually applied');
    assert.deepEqual(protectedAst(controller(after)), protectedAst(fixture.controller), fixture.file);
    assert.match(after, /id="solarCountryPageSearch" disabled/);
    assert.match(after, /id="solarCountryPageSelect" disabled/);
    assert.match(controller(after), /select\.disabled=false;if\(input\)input\.disabled=false;/);
    assert.equal(ensureSolarCountryPickerReadiness(after), after, fixture.file + ' transform is idempotent');
  }
});

test('reviewed numeric and French lifecycle owners retain their independently accepted source bytes', () => {
  assert.equal(reviewed.numericCommit, '52330eee4a9496eac0a242d5a471745bde854834');
  assert.equal(reviewed.owners.length, 6);
  for (const owner of reviewed.owners) {
    assert.equal(sha256(read(owner.file).replace(/\r\n?/g, '\n')), owner.sha256, owner.file + ' requires explicit source review before recapture');
  }
});

test('all 108 current country controllers retain reviewed calculation, data, source, consent, storage and export AST and readiness', () => {
  const paths = Object.values(dataset.countries).flatMap(country => [
    `tools/solar-roi/${country.slug}/index.html`, `fr/tools/roi-solaire/${country.slug}/index.html`
  ]);
  assert.equal(paths.length, 108);
  assert.deepEqual(reviewed.rows.map(row => row.file), paths, 'exact dataset routes and order, no omitted or added country');
  for (const file of paths) {
    const after = read(file);
    assert.equal(protectedHash(controller(after)), reviewed.rows.find(row => row.file === file).controllerAstOutsidePickerSha256, file + ' requires explicit numeric/locale owner review');
    assert.equal(ensureSolarCountryPickerReadiness(after), after, file + ' owner is idempotent');
    assert.match(after, /id="solarCountryPageSearch"[^>]*\sdisabled/);
    assert.match(after, /id="solarCountryPageSelect"[^>]*\sdisabled/);
    assert.match(controller(after), /select\.disabled=false;if\(input\)input\.disabled=false;/);
  }
});

test('current fingerprint guard detects an unreviewed battery-input regression outside picker code', () => {
  const source = controller(read('tools/solar-roi/kenya/index.html'));
  const mutant = source.replace('num("batteryCost",DEFAULTS.batteryCost)', 'DEFAULTS.batteryCost');
  assert.notEqual(mutant, source, 'mutate the actual honored battery-input path');
  assert.notEqual(protectedHash(mutant), reviewed.rows.find(row => row.file === 'tools/solar-roi/kenya/index.html').controllerAstOutsidePickerSha256);
});
test('displayed code, styles, JSON and external script declarations remain untouched', () => {
  for (const html of ['<pre><select id="solarCountryPageSelect"></select></pre>', '<code><input id="solarCountryPageSearch"></code>', '<textarea><input id="solarCountryPageSearch"></textarea>', '<script type="application/json">{"id":"solarCountryPageSelect"}</script>', '<script src="/country.js"></script>']) {
    assert.equal(ensureSolarCountryPickerReadiness(html), html);
  }
});
