'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const english = require('../tools/malaria-risk/malaria-urgency-engine.js');
const french = require('../fr/tools/risque-paludisme/malaria-urgency-fr.js');
const html = fs.readFileSync(path.join(root, 'fr/tools/risque-paludisme/index.html'), 'utf8');
const registry = fs.readFileSync(path.join(root, 'assets/js/components/tool-registry.js'), 'utf8');

const base = { exposure: 'unknown', testStatus: 'none', symptomTiming: 'none' };
const fixtures = [
  { ...base, exposure: 'no', testStatus: 'negative', symptomTiming: 'today', unableFluids: true },
  { ...base, testStatus: 'positive' },
  { ...base, testStatus: 'pending', symptomTiming: '1-2', fever: true },
  { ...base, exposure: 'yes', symptomTiming: 'today', fever: true },
  { ...base, exposure: 'no', symptomTiming: 'today', headache: true },
  { ...base, exposure: 'yes' },
  { ...base, exposure: 'no' }
];

test('French outcomes preserve the exact English safety decision for every branch', () => {
  for (const fixture of fixtures) {
    const source = english.assess(fixture);
    const localized = french.assess(fixture);
    assert.deepEqual(localized.source, source);
    assert.notEqual(localized.level, source.level);
    assert.ok(localized.reasons.length > 0);
    assert.doesNotMatch(`${localized.level} ${localized.action} ${localized.warning}`, /\b(today|care|testing|checklist)\b/i);
  }
});

test('French validation errors are native and retain fail-closed timing checks', () => {
  assert.throws(
    () => french.assess({ ...base, fever: true }),
    /Indiquez quand les symptômes actuels ont commencé/
  );
  assert.throws(
    () => french.assess({ ...base, exposure: 'maybe' }),
    /Choisissez une réponse concernant l’exposition/
  );
});

test('French page reuses the accepted engine and removes the geographic score model', () => {
  assert.match(html, /src="\/tools\/malaria-risk\/malaria-urgency-engine\.js/);
  assert.match(html, /src="\.\/malaria-urgency-fr\.js"/);
  assert.match(html, /Test de paludisme le plus récent pour ces symptômes/);
  assert.match(html, /Impossible de garder des liquides/);
  assert.match(html, /id="resultPanel"[\s\S]*tabindex="-1"/);
  assert.doesNotMatch(html, /Score indicatif|Saison actuelle|Nuits passées|Zone rurale|score\s*\+=/i);
  assert.doesNotMatch(html, /fonts\.googleapis|fonts\.gstatic|fetch\s*\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage/i);
  assert.match(html, /Privé et local/);
  const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert.ok(jsonLdMatch, 'French WebApplication schema must exist');
  const schema = JSON.parse(jsonLdMatch[1]);
  assert.equal(schema.inLanguage, 'fr');
  assert.equal(schema.url, 'https://afrotools.com/fr/tools/risque-paludisme/');
  assert.equal(schema.applicationCategory, 'HealthApplication');
  assert.match(html, /<title>Checklist de dépistage du paludisme \| AfroTools<\/title>/);
  assert.match(html, /<link rel="canonical" href="https:\/\/afrotools\.com\/fr\/tools\/risque-paludisme\/">/);
  assert.match(html, /hreflang="en" href="https:\/\/afrotools\.com\/tools\/malaria-risk\/"/);
});

test('French job-offer registry route stays on the AfroTools domain', () => {
  const start = registry.indexOf("id: 'evaluateur-offre-emploi-fr'");
  assert.ok(start >= 0, 'French job-offer registry row must exist');
  const row = registry.slice(start, registry.indexOf('},', start) + 2);
  assert.match(row, /href: '\/fr\/tools\/evaluateur-offre-emploi\/'/);
  assert.doesNotMatch(row, /africa-tools\.com/);
});
