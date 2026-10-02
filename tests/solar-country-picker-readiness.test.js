const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const cp = require('node:child_process');
const acorn = require('acorn');
const dataset = require('../data/energy/solar-roi-country-dataset');
const { ensureSolarCountryPickerReadiness } = require('../scripts/lib/solar-country-picker-readiness');

function controller(html) {
  return [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(row => row[1]).find(source => source.includes('function setupCountryPicker('));
}
function withoutPicker(node) {
  if (!node || typeof node !== 'object') return node;
  if (node.type === 'FunctionDeclaration' && node.id.name === 'setupCountryPicker') return null;
  if (Array.isArray(node)) return node.map(withoutPicker).filter(value => value !== null);
  return Object.fromEntries(Object.entries(node).filter(([key]) => !['start', 'end', 'raw'].includes(key)).map(([key, value]) => [key, withoutPicker(value)]));
}
test('all 108 country controllers preserve calculation, data, source, consent, storage and export AST outside picker initialization', () => {
  const paths = Object.values(dataset.countries).flatMap(country => [
    `tools/solar-roi/${country.slug}/index.html`, `fr/tools/roi-solaire/${country.slug}/index.html`
  ]);
  const blobs = cp.execFileSync('git', ['cat-file', '--batch'], {
    input: paths.map(file => 'eac06a15a6f128d8b7ddfd5b8eecf1f074cfd4b0:' + file).join('\n') + '\n', maxBuffer: 40e6
  });
  let offset = 0;
  for (const file of paths) {
    const end = blobs.indexOf(10, offset), size = Number(blobs.subarray(offset, end).toString().split(' ')[2]);
    assert.ok(Number.isFinite(size), file + ' baseline exists');
    const before = blobs.subarray(end + 1, end + 1 + size).toString(); offset = end + 1 + size + 1;
    const after = fs.readFileSync(file, 'utf8');
    assert.deepEqual(withoutPicker(acorn.parse(controller(after), { ecmaVersion: 'latest' })), withoutPicker(acorn.parse(controller(before), { ecmaVersion: 'latest' })), file);
    assert.equal(ensureSolarCountryPickerReadiness(after), after, file + ' owner is idempotent');
  }
});
test('displayed code, styles, JSON and external script declarations remain untouched', () => {
  for (const html of ['<pre><select id="solarCountryPageSelect"></select></pre>', '<code><input id="solarCountryPageSearch"></code>', '<textarea><input id="solarCountryPageSearch"></textarea>', '<script type="application/json">{"id":"solarCountryPageSelect"}</script>', '<script src="/country.js"></script>']) {
    assert.equal(ensureSolarCountryPickerReadiness(html), html);
  }
});
