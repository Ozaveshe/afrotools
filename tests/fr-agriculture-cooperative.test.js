'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const engine = require('../engines/src/cooperative-engine');
const manifest = require('../data/localization/fr-agriculture-parity-manifest.json');
const ai = require('../assets/js/ai/french-route-map.generated.js');
const { ROOT, assertNativeFrenchOutput } = require('../scripts/lib/fr-agriculture-parity-manifest');
const row = manifest.rows.find(value => value.english.id === 'cooperative-calculator');
assert.ok(row);
assertNativeFrenchOutput(manifest, [row.french.route]);
const html = fs.readFileSync(path.join(ROOT, row.french.file), 'utf8');
assert.doesNotMatch(html, /<iframe\b|\bfetch\s*\(/i);
assert.match(html, /cooperative-engine\.js/);
assert.match(html, /aucune saisie envoyée à un serveur/i);
assert.match(html, /ne prouvent aucune obligation légale universelle/i);
assert.equal(ai.routes[row.english.routeKey], row.french.routeKey);
const profiles = [];
for (const coopType of ['agri', 'sacco', 'multi']) {
  for (const method of ['patronage', 'shares', 'hybrid']) {
    for (const hybridPatronagePct of [0, 35, 50, 100]) {
      const input = {
        coopType, method, revenue: 10000000, expenses: 6500000, members: 120,
        myProduce: 1200, totalProduce: 85000, myShares: 50000, totalShares: 3500000,
        marketPrice: 450, saccoRate: 12.5, hybridPatronagePct,
        allocations: { reserve: 25, education: 5, dividend: 50, social: 5, retained: 15 },
      };
      const output = engine.calculate(input);
      assert.equal(output.ok, true);
      profiles.push({ input, output });
    }
  }
}
const oracle = { schemaVersion: 1, family: 'singleton:cooperative-calculator', profiles };
if (process.env.FR_AGRI_ORACLE_OUTPUT) fs.writeFileSync(path.resolve(ROOT, process.env.FR_AGRI_ORACLE_OUTPUT), `${JSON.stringify(oracle, null, 2)}\n`);
console.log(JSON.stringify({ family: oracle.family, rows: 1, profiles: profiles.length }, null, 2));
