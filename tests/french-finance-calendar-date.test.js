const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function calendar(inputs) {
  const source = fs.readFileSync(path.join(__dirname, '../assets/js/pages/french-finance-export-contract.js'), 'utf8');
  const context = {window: {}, document: {readyState: 'loading', addEventListener() {}}};
  vm.runInNewContext(source.replace('summaryText: summaryText,', 'calendarForTest: calendarText, summaryText: summaryText,'), context);
  return context.window.AfroTools.frenchFinanceExport.calendarForTest({
    title: 'Scénario synthétique', route: '/fr/test/', inputs,
    results: [{label: 'Résultat', value: '42'}]
  });
}

test('calendar never invents a date for undated financial results', () => {
  assert.throws(() => calendar([{label: 'Congés pris', value: '5'}]), /date explicite et unique/);
});
test('calendar rejects impossible or ambiguous dates instead of silently choosing', () => {
  assert.throws(() => calendar([{label: 'Date', value: '2026-02-30'}]), /invalide/);
  assert.throws(() => calendar([{label: 'Début', value: '2026-10-01'}, {label: 'Fin', value: '2026-10-05'}]), /date explicite et unique/);
});
test('calendar retains an explicit valid date including leap day', () => {
  assert.match(calendar([{label: 'Date', value: '2028-02-29'}]), /DTSTART;VALUE=DATE:20280229\r\n/);
});
