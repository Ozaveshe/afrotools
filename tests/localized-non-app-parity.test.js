'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const api = require('../scripts/build-localized-non-app-parity.js');

const ROOT = path.resolve(__dirname, '..');
const report = api.build();

assert(report.totals.englishRoutes >= 400, 'The non-app denominator must include top-level public routes and the English blog corpus');
assert.strictEqual(report.rows.filter((row) => row.englishRoute === '/').length, 1, 'Homepage must appear exactly once');
assert(report.rows.some((row) => row.englishRoute === '/contact/'), 'Contact must be audited');
assert(report.rows.some((row) => row.englishRoute === '/blog/'), 'Blog hub must be audited');
assert(report.rows.some((row) => row.routeClass === 'editorial'), 'English blog articles must be audited');

for (const locale of ['fr', 'sw']) {
  const total = report.totals[locale];
  assert.strictEqual(total.pass + total.underStandard + total.missing, report.totals.englishRoutes, `${locale} totals must reconcile`);
}

const home = report.rows.find((row) => row.englishRoute === '/');
assert(home.locales.fr.route === '/fr/', 'French homepage route must map to English root');
assert(home.locales.sw.route === '/sw/', 'Swahili homepage route must map to English root');

const missing = api.assess(home.english, null, 'institutional');
assert.strictEqual(missing.status, 'missing');
const contracted = api.assess(home.english, {
  ...home.english,
  words: Math.floor(home.english.words * 0.2),
  h2: 0,
  h3: 0,
  links: 0,
  forms: 0,
  inputs: 0,
  buttons: 0,
  schemaBlocks: 0,
  hasFaqSchema: false,
  hasCanonical: true,
  hasDescription: true,
  hasOpenGraph: true,
  hasViewport: true,
  langMatches: true
}, 'institutional');
assert.strictEqual(contracted.status, 'under-standard');
assert(contracted.reasons.some((reason) => reason.includes('visible content')));

const frenchHomeWithoutFaqSchema = api.assess(home.english, {
  ...home.english,
  hasFaqSchema: false,
  langMatches: true
}, 'home', '/');
assert.strictEqual(frenchHomeWithoutFaqSchema.status, 'pass', 'homepage parity must not require FAQ rich-result markup');

const cars = report.rows.find((row) => row.englishRoute === '/cars/');
assert(cars, 'Cars product entry must appear in the audit ledger');
assert.strictEqual(cars.locales.sw.assessment.status, 'pass', 'Swahili car entry must satisfy discovery parity without unsafe FAQ markup');
assert.strictEqual(cars.locales.sw.metrics.hasFaqSchema, false, 'Swahili car entry must not copy invisible English FAQ schema');

assert(fs.existsSync(path.join(ROOT, 'reports/localized-non-app-parity.json')), 'JSON report must be committed');
assert(fs.existsSync(path.join(ROOT, 'reports/localized-non-app-parity.md')), 'Markdown report must be committed');

console.log(`Localized non-app parity contract passed: ${report.totals.englishRoutes} English routes.`);
