const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.join(__dirname, '..');
const PAGE = fs.readFileSync(path.join(ROOT, 'fr/blog/average-salary-south-africa-2026/index.html'), 'utf8');

test('South Africa salary guide gives the current Stats SA average with its scope', () => {
  assert.match(PAGE, /<title>Salaire Afrique du Sud 2026 : moyenne R29 997, minimum R30,23 \| AfroTools<\/title>/);
  assert.match(PAGE, /rémunération mensuelle moyenne de 29 997 rands en février 2026/i);
  assert.match(PAGE, /secteur formel non agricole/i);
  assert.match(PAGE, /statssa\.gov\.za\/\?p=19676/);
});

test('the guide carries the current minimum and retires the stale category claim', () => {
  assert.match(PAGE, /R30,23 par heure ordinaire depuis le 1er mars 2026/i);
  assert.match(PAGE, /travailleurs agricoles et domestiques/i);
  assert.match(PAGE, /R16,62 par heure/i);
  assert.match(PAGE, /54075rg11941gon7083\.pdf/);
  assert.doesNotMatch(PAGE, /27,58 rands par heure|travailleurs domestiques et les travailleurs agricoles ont des taux minimums distincts, généralement un peu plus bas/i);
});

test('monthly references and local decision-tool handoffs stay bounded', () => {
  assert.match(PAGE, /R5 239,46/);
  assert.match(PAGE, /R5 894,40/);
  assert.match(PAGE, /Ce n'est pas un forfait universel/);
  assert.match(PAGE, /href="\/fr\/south-africa\/za-paye"/);
  assert.match(PAGE, /href="\/fr\/tools\/comparateur-salaires\/"/);
  assert.doesNotMatch(PAGE, /fetch\(|XMLHttpRequest|ai-advisor|pdf-leads/i);
});
