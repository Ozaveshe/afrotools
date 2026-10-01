const test = require('node:test');
const assert = require('node:assert/strict');
const { processHtml } = require('../scripts/repair-fr-solar-country-pages');

test('French Solar country label repair is repeatable and preserves calculator scripts', () => {
  const script = '<script>const label="Install";const country="Ghana";</script>';
  const source = '<p>Install</p><p>Installationation</p><label for="solarCountryPageSearch">Pays sélectionné</label><input id="solarCountryPageSearch"><select id="solarCountryPageSelect"></select>' + script;
  const once = processHtml(source);
  assert.equal(processHtml(once), once);
  assert.match(once, /<label for="solarCountryPageSearch">Rechercher un pays<\/label>/);
  assert.equal((once.match(/for="solarCountryPageSelect"/g) || []).length, 1);
  assert.match(once, /<label for="solarCountryPageSelect">Sélectionner un pays<\/label>/);
  assert.equal((once.match(/<p>Installation<\/p>/g) || []).length, 2);
  assert.ok(once.endsWith(script));
});
