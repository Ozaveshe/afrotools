'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const manifest = require('../data/localization/fr-agriculture-parity-manifest.json');
const aiRouteMap = require('../assets/js/ai/french-route-map.generated.js');
const data = require('../data/agriculture/fertilizer-calc-data.json');
const engine = require('../engines/src/fertilizer-calc-engine');

const ROOT = path.resolve(__dirname, '..');
const row = manifest.rows.find(item => item.english.id === 'fertilizer-calc');
assert(row);
const english = fs.readFileSync(path.join(ROOT, row.english.file), 'utf8');
const french = fs.readFileSync(path.join(ROOT, row.french.file), 'utf8');
for (const html of [english, french]) {
  assert.match(html, /\/data\/agriculture\/fertilizer-calc-data\.js/);
  assert.match(html, /\/engines\/fertilizer-calc-engine\.js/);
}
assert.doesNotMatch(english, /var CROPS=\{/);
assert.doesNotMatch(french, /<iframe\b/i);
assert.match(french, /Exporter en PDF/);
assert.match(french, /Exporter en CSV/);
assert.match(french, /Exporter en JSON/);
assert.match(french, /Exporter en TXT/);
assert.match(french, /aucune saisie envoyée à un serveur/i);
assert.match(french, /aucune donnée en direct/i);
assert.ok(english.includes('hreflang="fr" href="https://afrotools.com/fr/tools/calculateur-engrais/"'));
assert.ok(french.includes('hreflang="en" href="https://afrotools.com/tools/fertilizer-calc/"'));
assert.equal(aiRouteMap.routes[row.english.routeKey], row.french.routeKey);

const profiles = [
  { cropId: 'maize', soil: 'loam', target: 'medium', currency: 'NGN', area: 1 },
  { cropId: 'cassava', soil: 'laterite', target: 'high', currency: 'GHS', area: 2.75 },
  { cropId: 'wheat', soil: 'sandy', target: 'low', currency: 'USD', area: 0.5 },
  { cropId: 'cocoa', soil: 'volcanic', target: 'medium', currency: 'KES', area: 12 },
];
const oracles = profiles.map(profile => ({ profile, result: engine.calculate(profile, data) }));
oracles.forEach(oracle => assert.equal(oracle.result.ok, true));
if (process.env.FR_AGRI_ORACLE_OUTPUT) {
  fs.writeFileSync(path.resolve(process.env.FR_AGRI_ORACLE_OUTPUT), `${JSON.stringify({
    family: 'singleton:fertilizer-calc',
    rows: 1,
    exhaustiveEngineScenarios: 6930,
    browserProfiles: oracles,
  }, null, 2)}\n`, 'utf8');
}
console.log(JSON.stringify({ family: 'singleton:fertilizer-calc', rows: 1, profiles: profiles.length }, null, 2));
