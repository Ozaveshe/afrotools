'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const parity = require('../scripts/build-localized-non-app-parity.js');

const ROOT = path.resolve(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

for (const locale of ['fr', 'sw']) {
  const ai = read(`${locale}/ai/index.html`);
  const api = read(`${locale}/api/index.html`);
  assert(ai.includes(`name="afrotools-content-id" content="localized-ai:${locale}:entry"`), `${locale} AI stable content id`);
  assert(ai.includes('data-source-owner="scripts/build-localized-ai-api-pages.js"'), `${locale} AI source owner`);
  assert((ai.match(/<form\b/g) || []).length >= 3, `${locale} AI keeps three useful handoff forms`);
  assert((ai.match(/<a\b/g) || []).length >= 17, `${locale} AI keeps English-level discovery depth`);
  assert(api.includes('name="afrotools-source-owner" content="scripts/build-localized-ai-api-pages.js"'), `${locale} API source owner`);
  assert(api.includes(`name="afrotools-content-id" content="localized-api:${locale}:entry"`), `${locale} API stable content id`);
  assert(api.includes('data-api-sandbox'), `${locale} API sandbox controls`);
  assert(api.includes('FAQPage'), `${locale} API FAQ schema`);
  assert(!api.includes('<iframe'), `${locale} API is native, not an English iframe`);
  if (locale === 'fr') assert(!api.includes('Hesabu brut-net'), 'French API has no Swahili PAYE description');
}

const report = parity.build();
for (const englishRoute of ['/ai/', '/api/']) {
  const row = report.rows.find((candidate) => candidate.englishRoute === englishRoute);
  assert(row, `${englishRoute} parity row exists`);
  for (const locale of ['fr', 'sw']) {
    assert.strictEqual(row.locales[locale].assessment.status, 'pass', `${locale}${englishRoute} passes non-app parity: ${row.locales[locale].assessment.reasons.join(', ')}`);
  }
}

console.log('Localized AI/API parity passed: 4 routes.');
