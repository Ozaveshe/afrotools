'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const manifest = require('../data/localization/fr-agriculture-parity-manifest.json');
const ai = require('../assets/js/ai/french-route-map.generated.js');
const data = require('../data/agriculture/farm-size-data.json');
const engine = require('../engines/src/farm-size-engine');
const contract = require('../scripts/lib/fr-agriculture-singleton-contracts/farm-size-converter');
const { ROOT, assertNativeFrenchOutput } = require('../scripts/lib/fr-agriculture-parity-manifest');

const row = manifest.rows.find(item => item.english.id === 'farm-size-converter');
assert.ok(row);
assertNativeFrenchOutput(manifest, [row.french.route]);
const html = fs.readFileSync(path.join(ROOT, row.french.file), 'utf8');
assert.doesNotMatch(html, /<iframe\b/i);
assert.doesNotMatch(html, /\bfetch\s*\(/i);
assert.match(html, /<html\b[^>]*\blang="fr"/);
assert.match(html, /farm-size-data\.js/);
assert.match(html, /farm-size-engine\.js/);
assert.match(html, /Exporter en PDF/);
assert.match(html, /aucune saisie envoyée à un serveur/i);
assert.equal(ai.routes[row.english.routeKey], row.french.routeKey);
assert.deepEqual(Object.keys(contract.UNIT_LABELS), Object.keys(data.units));

const profiles = [];
for (const fromKey of Object.keys(data.units)) {
  for (const toKey of Object.keys(data.units)) {
    for (const amount of [0, 0.000001, 0.25, 1, 17, 1000, 2500000]) {
      const output = engine.calculate({ amount, fromKey, toKey }, data);
      assert.equal(output.ok, true);
      profiles.push({ input: { amount, fromKey, toKey }, output });
    }
  }
}
const oracle = {
  schemaVersion: 1,
  family: 'singleton:farm-size-converter',
  units: Object.keys(data.units).length,
  profiles,
};
if (process.env.FR_AGRI_ORACLE_OUTPUT) {
  fs.writeFileSync(path.resolve(ROOT, process.env.FR_AGRI_ORACLE_OUTPUT), `${JSON.stringify(oracle, null, 2)}\n`, 'utf8');
}
console.log(JSON.stringify({ family: oracle.family, rows: 1, units: oracle.units, profiles: profiles.length }, null, 2));
