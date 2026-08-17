const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.join(__dirname, '..');
const PAGE = fs.readFileSync(path.join(ROOT, 'fr/blog/average-salary-nigeria-2026/index.html'), 'utf8');

test('Nigeria salary guide gives the verified statutory answer and its limits', () => {
  assert.match(PAGE, /<title>Salaire moyen Nigeria 2026 : minimum ₦70 000 et offre \| AfroTools<\/title>/);
  assert.match(PAGE, /salaire minimum de 70 000 NGN par mois/i);
  assert.match(PAGE, /statehouse\.gov\.ng\/president-tinubus-broadcast-on-the-nationwide-protest/);
  assert.match(PAGE, /nsiwc\.gov\.ng\/information-center\/circulars-salary-structures/);
});

test('the guide no longer publishes unsupported sector city or remote salary ranges', () => {
  assert.doesNotMatch(PAGE, /5 000 000|10 000 000|Prime vs moyenne nationale|400 000 à 600 000|deux à cinq fois/i);
  assert.doesNotMatch(PAGE, /données anonymisées d'autres professionnels|des centaines de milliers d'utilisateurs/i);
  assert.match(PAGE, /L'ancienne version de ce guide affichait de telles fourchettes sans source\. Elles ont été supprimées\./);
});

test('NBS evidence and local tool handoffs preserve the product boundary', () => {
  assert.match(PAGE, /microdata\.nigerianstat\.gov\.ng\/index\.php\/catalog\/152\/study-description/);
  assert.match(PAGE, /nombre brut de réponses dans une tranche n'est pas[^.]*statistique nationale/i);
  assert.match(PAGE, /href="\/fr\/tools\/comparateur-salaires\/"/);
  assert.match(PAGE, /href="\/fr\/nigeria\/ng-salary-tax"/);
  assert.doesNotMatch(PAGE, /fetch\(|XMLHttpRequest|ai-advisor|pdf-leads/i);
});
