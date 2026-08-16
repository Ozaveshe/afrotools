const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.join(__dirname, '..');
const TARGETS = [
  'fr/tools/suivi-carburant/index.html',
  'fr/tools/cout-employe/index.html'
];

test('reviewed French proof panels contain their intended accented labels', () => {
  const fuel = fs.readFileSync(path.join(ROOT, TARGETS[0]), 'utf8');
  const staff = fs.readFileSync(path.join(ROOT, TARGETS[1]), 'utf8');
  assert.match(fuel, /coût mensuel et dérive/);
  assert.match(fuel, /Source à vérifier :<\/strong> Reçus de station/);
  assert.match(fuel, /Point à confirmer/);
  assert.match(staff, /Coût employé avec hypothèses visibles/);
  assert.match(staff, /Source à vérifier/);
});

test('known visible question-mark replacement patterns cannot return', () => {
  for (const relative of TARGETS) {
    const html = fs.readFileSync(path.join(ROOT, relative), 'utf8');
    assert.doesNotMatch(html, /d\?rive|Re\?us|observ\?|autorit\?|employ\?|Source \? vérifier|Point \? confirmer/);
  }
});
