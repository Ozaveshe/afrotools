'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function engine() {
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../engines/src/minimum-wage-engine.js'), 'utf8'), context);
  return context.window.AfroTools.MinWageEngine;
}

test('CSV preserves fractional amounts and escapes multiline source fields', () => {
  const subject = engine();
  subject.getAllCountries = () => [{name: 'Test, country', currency: 'TST', monthly: 1234.56, usdMonthly: 12.34, effectiveDate: 'Recorded date', law: 'Source "A"\nSecond line'}];
  assert.equal(subject.exportCSV(), 'Country,Currency,Monthly (Local),Monthly (USD Approx),Effective Date,Law\r\n"Test, country",TST,1234.56,12.34,Recorded date,"Source ""A""\nSecond line"');
});

test('localized exports translate headings and missing-value markers without changing source facts', () => {
  const subject = engine();
  subject.getAllCountries = () => [{name: 'Test country', currency: 'TST', monthly: 0, usdMonthly: null, effectiveDate: 'Recorded date', law: 'Original source title'}];
  assert.equal(subject.exportCSV('sw'), 'Nchi,Sarafu,Kwa mwezi (sarafu ya nchi),Kwa mwezi (makadirio ya USD),Tarehe ya kuanza kutumika,Sheria\r\nTest country,TST,Hakijawekwa,Hakuna,Recorded date,Original source title');
  assert.match(subject.exportCSV('fr'), /^Pays,Devise,/);
  assert.match(subject.exportCSV('fr'), /Non fixé,Non disponible,Recorded date,Original source title$/);
  assert.equal(subject.exportCSV('unknown'), subject.exportCSV());
});
