const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.join(__dirname, '..');
const PAGE = fs.readFileSync(path.join(ROOT, 'fr/blog/salaire-moyen-rdc-2026/index.html'), 'utf8');

test('RDC salary search copy answers with the current official SMIG boundary', () => {
  assert.match(PAGE, /<title>Salaire moyen RDC 2026 : SMIG 21 500 CDF et brut-net<\/title>/);
  assert.match(PAGE, /<meta name="description" content="[^"]*21 500 CDF par jour depuis janvier 2026/i);
  assert.match(PAGE, /décret n° 25\/22 du 30 mai 2025/i);
  assert.match(PAGE, /annuairetravail-rdc\.cd\/detail\?slug=decret-n-25-22/i);
  assert.match(PAGE, /n'a pas trouvé[^.]*moyenne nationale/i);
});

test('the guide no longer invents salary ranges or city multipliers', () => {
  assert.doesNotMatch(PAGE, /var sectors|var cities|var levels|14\s?000\s?000|factor:\s*1\.15|factor:\s*0\.65/i);
  assert.doesNotMatch(PAGE, /salaire moyen de bureau|fourchettes sectorielles|fourchette du secteur et de la ville/i);
  assert.match(PAGE, /sans inventer de barème par ville/i);
});

test('the local checker uses days and an explicit category coefficient', () => {
  assert.match(PAGE, /var DAILY_SMIG = 21500;/);
  assert.match(PAGE, /DAILY_SMIG \* days \* \(coefficient \/ 100\)/);
  assert.match(PAGE, /id="days"[^>]*min="1"[^>]*max="31"/);
  assert.match(PAGE, /id="coefficient"[^>]*min="100"[^>]*max="1000"/);
  assert.match(PAGE, /URL\.createObjectURL\(blob\)/);
  assert.doesNotMatch(PAGE, /fetch\(|XMLHttpRequest|ai-advisor|pdf-leads/i);
});
