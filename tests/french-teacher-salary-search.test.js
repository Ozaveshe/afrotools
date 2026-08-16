const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.join(__dirname, '..');
const PAGE = fs.readFileSync(path.join(ROOT, 'fr/tools/salaire-enseignant/index.html'), 'utf8');
const OWNER = fs.readFileSync(path.join(ROOT, 'scripts/build-fr-education-parity.js'), 'utf8');
const REGISTRY = fs.readFileSync(path.join(ROOT, 'assets/js/components/tool-registry.js'), 'utf8');

test('teacher salary snippet describes the actual calculator', () => {
  assert.match(PAGE, /<title>Calculateur de salaire enseignant \| AfroTools<\/title>/);
  assert.match(PAGE, /<meta name="description" content="[^"]*brut mensuel[^"]*taux horaire[^"]*sans inventer de barème national/i);
  assert.match(PAGE, /<h1>Calculateur de salaire enseignant<\/h1>/);
});

test('teacher salary owner and discovery entry preserve the same honest boundary', () => {
  assert.match(OWNER, /"teacher-salary": \{[\s\S]*?title: "Calculateur de salaire enseignant"/);
  assert.match(OWNER, /sans inventer de barème national/);
  assert.match(REGISTRY, /id: 'salaire-enseignant-fr'[\s\S]*?name: 'Calculateur de salaire enseignant'/);
  assert.match(REGISTRY, /à partir d’une offre réelle/);
});

test('teacher salary page does not claim a national grid or official salary lookup', () => {
  assert.doesNotMatch(PAGE, /grille salariale nationale|barème officiel|salaires? (?:moyens?|officiels?) par pays/i);
  assert.match(PAGE, /sans inventer de barème national/i);
});
