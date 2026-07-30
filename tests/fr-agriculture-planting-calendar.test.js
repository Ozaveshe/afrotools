'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const manifest = require('../data/localization/fr-agriculture-parity-manifest.json');
const aiRouteMap = require('../assets/js/ai/french-route-map.generated.js');
const data = require('../data/agriculture/planting-calendar-data.json');
const engine = require('../engines/src/planting-calendar-engine');

const ROOT = path.resolve(__dirname, '..');
const row = manifest.rows.find(item => item.english.id === 'planting-calendar');
assert(row, 'Planting Calendar manifest row must exist');
assert.equal(row.english.routeKey, '/tools/planting-calendar/');
assert.equal(row.french.routeKey, '/fr/tools/calendrier-semis/');

const english = fs.readFileSync(path.join(ROOT, row.english.file), 'utf8');
const french = fs.readFileSync(path.join(ROOT, row.french.file), 'utf8');
assert.match(english, /\/data\/agriculture\/planting-calendar-data\.js/);
assert.match(english, /\/engines\/planting-calendar-engine\.js/);
assert.match(english, /\/assets\/js\/pages\/planting-calendar-controller\.js/);
assert.doesNotMatch(english, /const MONTHS=\[/);
assert.doesNotMatch(french, /<iframe\b/i);
assert.match(french, /\/data\/agriculture\/planting-calendar-data\.js/);
assert.match(french, /\/engines\/planting-calendar-engine\.js/);
assert.match(french, /\/assets\/js\/pages\/fr-planting-calendar-controller\.js/);
assert.match(french, /Exporter en PDF/);
assert.match(french, /Exporter en CSV/);
assert.match(french, /Exporter en JSON/);
assert.match(french, /Exporter en TXT/);
assert.match(french, /aucune saisie envoyée à un serveur/i);
assert.match(french, /aucune donnée en direct/i);
assert.ok(english.includes('hreflang="fr" href="https://afrotools.com/fr/tools/calendrier-semis/"'));
assert.ok(french.includes('hreflang="en" href="https://afrotools.com/tools/planting-calendar/"'));
assert.equal(aiRouteMap.routes[row.english.routeKey], row.french.routeKey);

const oracles = {};
for (const zone of Object.keys(data.zones)) {
  for (const rainfall of ['unimodal', 'bimodal']) {
    const result = engine.calculate({ zone, rainfall }, data);
    oracles[`${zone}:${rainfall}`] = {
      note: result.note,
      cropOrder: result.crops.map(crop => crop.id),
      calendar: Object.fromEntries(result.crops.map(crop => [
        crop.id,
        crop.months.map(month => month.value),
      ])),
    };
  }
}

if (process.env.FR_AGRI_ORACLE_OUTPUT) {
  fs.writeFileSync(path.resolve(process.env.FR_AGRI_ORACLE_OUTPUT), `${JSON.stringify({
    family: 'singleton:planting-calendar',
    rows: 1,
    scenarios: Object.keys(oracles).length,
    oracles,
  }, null, 2)}\n`, 'utf8');
}

console.log(JSON.stringify({
  family: 'singleton:planting-calendar',
  rows: 1,
  scenarios: Object.keys(oracles).length,
}, null, 2));
