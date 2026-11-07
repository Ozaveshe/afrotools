'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const verification = require('../scripts/apply-tool-verification');
const quality = require('../scripts/lib/calculation-quality');
const sources = require('../scripts/build-source-registry');
const hooks = require('../scripts/apply-source-confidence-hooks');
const { dedicatedContract } = require('../scripts/lib/paye-verification-contract');
const review = require('../data/calculation-quality/reviews/senegal-paye-household-provenance-2026-11-07.json');
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const pagePath = path.join(root, 'fr/senegal/calculateur-salaire-net.html');
const page = fs.readFileSync(pagePath, 'utf8');

test('distinct reviewed replacement locales preserve unrelated tools and dated history', () => {
  const previous = read('data/tool-verification.json');
  const next = verification.applySenegalPayeEvidence(structuredClone(previous));
  for (const [id, value] of Object.entries(previous.tools)) {
    if (!['sn-paye', 'sn-paye-fr'].includes(id)) assert.deepEqual(next.tools[id], value, id);
  }
  for (const [id, route] of [['sn-paye', '/senegal/sn-paye'], ['sn-paye-fr', '/fr/senegal/calculateur-salaire-net']]) {
    assert.deepEqual(next.tools[id].source_urls, review.sourceRecords.map(item => item.url));
    assert.deepEqual(next.tools[id].routes, [route]);
    assert.equal(next.tools[id].last_verified, '2026-11-07');
    for (const historical of previous.tools[id].change_history || []) assert.ok(next.tools[id].change_history.some(row => JSON.stringify(row) === JSON.stringify(historical)));
  }
  assert.deepEqual(verification.applySenegalPayeEvidence(structuredClone(next)), next);
});

test('shared Senegal engines select French reviewed evidence without changing other countries', () => {
  const manifest = verification.applySenegalPayeEvidence(read('data/tool-verification.json'));
  assert.equal(quality.verificationByCountry(manifest, 'SN'), manifest.tools['sn-paye-fr']);
  assert.equal(quality.verificationByCountry(manifest, 'KE'), manifest.tools['ke-paye']);
  assert.equal(quality.verificationByCountry({ tools: {} }, 'ZZ'), null);
  assert.throws(() => quality.verificationByCountry({ tools: {} }, 'SN'), /dated Senegal French source review/);
});

test('current locale sources are distinct and historical source is not relabeled current', () => {
  const old = read('data/calculation-quality/formula-registry.json').formulas;
  const withCurrentEvidence = id => ({ ...old.find(item => item.id === id), lastVerified: review.reviewedAt,
    sources: review.sourceRecords.map(item => ({ title: item.title, url: item.url, kind: 'official', authorityStatus: 'source-reviewed' })) });
  const current = withCurrentEvidence('paye-server-sn');
  const englishFormula = withCurrentEvidence('route-sn-paye');
  const previousSource = read('data/source-registry.json').sources.find(item => item.id === 'paye-sn-source');
  const [historical, french, english] = sources.buildSenegalPayeSources(current, englishFormula, '2026-11-07');
  assert.equal(historical.id, 'paye-sn-source');
  assert.equal(historical.lastReviewedAt, previousSource.lastReviewedAt);
  assert.equal(historical.sourceUrl, previousSource.sourceUrl);
  assert.equal(historical.confidence, 'low_confidence');
  assert.deepEqual(historical.routes, []);
  assert.deepEqual(historical.toolIds, []);
  for (const record of [french, english]) {
    assert.equal(record.sourceUrl, review.sourceUrl);
    assert.equal(record.lastReviewedAt, review.reviewedAt);
  }
  assert.equal(french.id, 'ledger-tool-sn-paye-fr');
  assert.deepEqual(french.routes, ['/fr/senegal/calculateur-salaire-net']);
  assert.equal(english.id, 'ledger-tool-sn-paye-en');
  assert.deepEqual(english.routes, ['/senegal/sn-paye']);
  assert.match(french.displayDisclaimer, /septembre 2026/);
  assert.match(english.displayDisclaimer, /September 2026/);
  assert.throws(() => sources.buildSenegalPayeSources(current, null, '2026-11-07'), /dated Senegal formula review/);
  assert.throws(() => sources.buildSenegalPayeSources({ ...current, lastVerified: '2026-07-28' }, englishFormula, '2026-11-07'), /dated Senegal formula review/);
});

test('French disclosure retains dated scope, primary links and usable report action', () => {
  const contract = dedicatedContract(page);
  assert.deepEqual(contract.errors, []);
  assert.equal(contract.sourceId, 'ledger-tool-sn-paye-fr');
  for (const snippet of [review.sourceUrl, 'au 1er janvier 2026', 'non confirmés', 'topic=calculation-error']) {
    assert.ok(dedicatedContract(page.replaceAll(snippet, 'removed')).errors.length, snippet);
  }
  assert.ok(dedicatedContract(page.replace('</body>', '<div data-source-meta-id="paye-sn-source"></div></body>')).errors.length);
  assert.equal(verification.applyPanelToFile(pagePath, review.verification), false);
  assert.equal(hooks.applyTargets([{ file: 'fr/senegal/calculateur-salaire-net.html', sourceId: contract.sourceId }])[0].action, 'already-present');
});

test('English disclosure and generators preserve the exact reviewed English scope', () => {
  const file = path.join(root, 'senegal/sn-paye.html');
  const html = fs.readFileSync(file, 'utf8');
  const contract = dedicatedContract(html);
  assert.deepEqual(contract.errors, []);
  assert.equal(contract.sourceId, 'ledger-tool-sn-paye-en');
  for (const snippet of [review.sourceUrl, 'as of 1 January 2026', 'unconfirmed', 'topic=calculation-error']) {
    assert.ok(dedicatedContract(html.replaceAll(snippet, 'removed')).errors.length, snippet);
  }
  assert.ok(dedicatedContract(html.replace('</body>', '<div data-source-meta-id="paye-sn-source"></div></body>')).errors.length);
  assert.equal(verification.applyPanelToFile(file, review.englishVerification), false);
  assert.equal(hooks.applyTargets([{ file: 'senegal/sn-paye.html', sourceId: contract.sourceId }])[0].action, 'already-present');
});

test('both numeric changes require the exact additive review and zero remains unchanged', () => {
  assert.equal(review.fixtureDeltas.length, 2);
  assert.deepEqual(review.fixtureDeltas.map(item => item.fixtureId), ['paye-sn-defaults', 'paye-sn-large-decimal']);
  assert.deepEqual(quality.validateFixtureDeltaReviews(review.fixtureDeltas, [review]), review.fixtureDeltas);
  const changed = structuredClone(review.fixtureDeltas);
  changed[0].nextExpected['tax.netTax'] += 1;
  assert.throws(() => quality.validateFixtureDeltaReviews(changed, [review]), /matching source review/);
  const zero = read('data/calculation-quality/golden-fixtures.json').fixtures.find(item => item.id === 'paye-sn-zero');
  assert.ok(zero);
  assert.ok(Object.values(zero.expected).every(value => value === 0));
});
