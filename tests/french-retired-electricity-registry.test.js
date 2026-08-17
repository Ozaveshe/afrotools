const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');

test('retired French electricity country bridges stay outside the live registry', () => {
  const registry = fs.readFileSync(path.join(ROOT, 'assets/js/components/tool-registry.js'), 'utf8');
  const owner = fs.readFileSync(path.join(ROOT, 'scripts/register-french-energy-registry-wave.js'), 'utf8');

  assert.match(owner, /RETIRED_COUNTRY_FAMILY_SLUGS = new Set\(\['tarifs-electricite', 'compteur-prepaye'\]\)/);
  assert.doesNotMatch(registry, /id: 'tarifs-electricite-[^']+-fr'/);
  assert.doesNotMatch(registry, /id: 'compteur-prepaye-[^']+-fr'/);

  for (const relativePath of [
    'fr/tools/tarifs-electricite/senegal/index.html',
    'fr/tools/compteur-prepaye/cameroon/index.html'
  ]) {
    const html = fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
    assert.match(html, /name="robots" content="noindex,follow"/);
    assert.match(html, /rel="canonical" href="https:\/\/afrotools\.com\/fr\/tools\/(?:tarifs-electricite|compteur-prepaye)\/"/);
  }
});
