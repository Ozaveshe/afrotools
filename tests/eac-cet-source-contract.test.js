'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const test = require('node:test');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');

function loadEngine(relativePath) {
  const source = fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
  const context = {};
  vm.runInNewContext(source, context, { filename: relativePath });
  return context.EacCetEngine;
}

function assertCetContract(engine) {
  assert.ok(engine, 'EAC CET engine should load');
  assert.strictEqual(engine.getMemberStates().length, 8);
  assert.ok(engine.getMemberStates().some((member) => member.code === 'SO'));

  const mobile = engine.PRODUCTS.find((product) => product.name === 'Mobile Phones / Smartphones');
  assert.deepStrictEqual(
    { hsRange: mobile.hsRange, cetRate: mobile.cetRate },
    { hsRange: '8517.13 / 8517.14', cetRate: 0 }
  );

  const kenya = engine.calculate({ cifValue: 1000, cetRate: 0, countryCode: 'KE' });
  assert.strictEqual(kenya.totalLevies, 45, 'Kenya IDF 2.5% plus RDL 2% should total 4.5% of CIF');

  const tanzania = engine.calculate({ cifValue: 1000, cetRate: 0, countryCode: 'TZ' });
  assert.strictEqual(tanzania.totalLevies, 30, 'Tanzania IDF 1% plus RDL 2% should total 3% of CIF');

  assert.strictEqual(engine.calculate({ cifValue: 1000, cetRate: 0, countryCode: 'KE', hsRange: mobile.hsRange }).cetDuty, 250);
  assert.strictEqual(engine.calculate({ cifValue: 1000, cetRate: 0, countryCode: 'UG', hsRange: mobile.hsRange }).cetDuty, 100);
  assert.strictEqual(engine.calculate({ cifValue: 1000, cetRate: 0, countryCode: 'TZ', hsRange: mobile.hsRange }).cetDuty, 0);

  assert.strictEqual(engine.compareCountries(1000, 0).length, 5, 'comparison intentionally covers five modeled markets');
  assert.match(engine.getDutyRemission().description, /not blanket 0% entitlements/i);
}

test('readable EAC CET source matches the official-source planning contract', function () {
  assertCetContract(loadEngine('engines/src/eac-cet-engine.js'));
});

test('generated EAC CET engine matches the official-source planning contract', function () {
  assertCetContract(loadEngine('engines/eac-cet-engine.js'));
});

test('EAC CET page labels modeled scope and links current official references', function () {
  const html = fs.readFileSync(path.join(ROOT, 'tools/eac-cet/index.html'), 'utf8');
  assert.match(html, /8 EAC Members/);
  assert.match(html, /Compare Five Modeled EAC Markets/);
  assert.match(html, /0% EAC base CET/);
  assert.match(html, /EAC Gazette, 30 June 2026/);
  assert.match(html, /EAC Gazette, 15 July 2026/);
  assert.match(html, /Kenya Miscellaneous Fees and Levies Act/);
  assert.doesNotMatch(html, /Compare All EAC Countries/);
});
