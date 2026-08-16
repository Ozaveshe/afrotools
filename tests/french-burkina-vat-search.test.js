const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.join(__dirname, '..');
const PAGE = fs.readFileSync(path.join(ROOT, 'fr/burkina-faso/calculateur-tva.html'), 'utf8');
const VERIFICATION = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/tool-verification.json'), 'utf8')).tools['bf-vat'];
const REGISTRY = fs.readFileSync(path.join(ROOT, 'assets/js/components/tool-registry.js'), 'utf8');

test('Burkina VAT search copy exposes both current DGI rates without claiming universal eligibility', () => {
  assert.match(PAGE, /<title>Calculateur TVA Burkina Faso 2026 : 18 % ou 10 % \| AfroTools<\/title>/);
  assert.match(PAGE, /<meta name="description" content="[^"]*18 %[^"]*10 %[^"]*agréés/i);
  assert.match(PAGE, /article 317/i);
  assert.doesNotMatch(PAGE, /taux normal unique|Y a-t-il un taux réduit[\s\S]{0,500}>Non,/i);
});

test('the 10 percent path is evidence-gated and the standard arithmetic remains local', () => {
  assert.match(PAGE, /<option value="0\.10">10 % : hébergement ou restauration agréés<\/option>/);
  assert.match(PAGE, /id="rateConfirmed"/);
  assert.match(PAGE, /if \(reduced && !rateConfirmed\)/);
  assert.match(PAGE, /window\.TVAEngine\.calculate\(input, rate, MODE\)/);
  assert.doesNotMatch(PAGE, /fetch\(|XMLHttpRequest|gross_salary|pdf-leads|ai-advisor/i);
});

test('official-source and discovery owners carry the corrected Article 317 boundary', () => {
  assert.equal(VERIFICATION.last_verified, '2026-08-17');
  assert.ok(VERIFICATION.routes.includes('/fr/burkina-faso/calculateur-tva'));
  assert.ok(VERIFICATION.source_urls.includes('https://dgi.bf/verification/CGI'));
  assert.match(VERIFICATION.methodology_markdown, /10% reduced rate only after/i);
  assert.match(REGISTRY, /id: 'bf-tva-fr'[\s\S]*?10 %[\s\S]*?établissement agréé/);
});
