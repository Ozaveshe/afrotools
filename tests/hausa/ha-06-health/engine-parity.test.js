'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '../../..');
const routes = [
  ['hospital-cost', 'ha/kayan-aiki/kudin-asibiti/index.html', '/ha/kayan-aiki/kudin-asibiti/', '/tools/hospital-cost/hospital-quote-engine.js', 'hospital'],
  ['sickle-cell', 'ha/kayan-aiki/sickle-cell/index.html', '/ha/kayan-aiki/sickle-cell/', '/tools/sickle-cell/sickle-cell-engine.js', 'sickle'],
  ['genotype-checker', 'ha/kayan-aiki/duba-genotype/index.html', '/ha/kayan-aiki/duba-genotype/', '/tools/genotype-checker/haemoglobin-result-verification-engine.js', 'genotype'],
  ['childbirth-cost', 'ha/kayan-aiki/kudin-haihuwa/index.html', '/ha/kayan-aiki/kudin-haihuwa/', '/tools/childbirth-cost/childbirth-budget-engine.js', 'childbirth'],
  ['drug-price-compare', 'ha/kayan-aiki/kwatanta-farashin-magani/index.html', '/ha/kayan-aiki/kwatanta-farashin-magani/', '/tools/drug-price-compare/exact-medicine-compare-engine.js', 'medicine'],
  ['african-meal-plan', 'ha/kayan-aiki/tsarin-abincin-afirka/index.html', '/ha/kayan-aiki/tsarin-abincin-afirka/', '/tools/african-meal-plan/meal-logistics-engine.js', 'meal']
];

function read(relative) {
  return fs.readFileSync(path.join(ROOT, relative), 'utf8');
}

test('all six exact Hausa routes are native, self-canonical engine consumers', () => {
  for (const [id, file, route, engine, app] of routes) {
    const html = read(file);
    assert.match(html, /^<!doctype html>/i, `${id} is a native document`);
    assert.match(html, /<html lang="ha"/i, `${id} declares Hausa`);
    assert.ok(html.includes(`rel="canonical" href="https://afrotools.com${route}"`), `${id} self-canonical`);
    assert.ok(html.includes(`property="og:url" content="https://afrotools.com${route}"`), `${id} OG URL`);
    assert.ok(html.includes(`data-ha-health-app="${app}"`), `${id} Hausa app initializer`);
    assert.ok(html.includes(`src="${engine}"`), `${id} uses the English-owned DOM-free engine`);
    assert.ok(html.includes('src="/ha/assets/health-parity-ha.js"'), `${id} uses Hausa presentation runtime`);
    assert.ok(html.includes('id="download-txt"') && html.includes('id="download-pdf"'), `${id} advertises only implemented exports`);
    const ogImage = html.match(/property="og:image" content="https:\/\/afrotools\.com(\/assets\/img\/tools\/[^"?]+\.webp)"/);
    assert.ok(ogImage, `${id} has a dedicated local OG image`);
    assert.ok(fs.statSync(path.join(ROOT, ogImage[1])).size > 10000, `${id} artwork is a non-placeholder asset`);
    for (const schema of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) JSON.parse(schema[1]);
    assert.doesNotMatch(html, /<iframe\b|http-equiv="refresh"|location\.(?:href|replace)|window\.open\(/i, `${id} has no bridge or redirect`);
  }
});

test('owned Hausa health hub discovers all exact routes with truthful semantics', () => {
  const html = read('ha/lafiya/index.html');
  for (const [, , route] of routes) assert.ok(html.includes(`href="${route}"`), `ha/lafiya/index.html links ${route}`);
  assert.doesNotMatch(html, /href="\/ha\/kayan-aiki\/abincin-afirka\/"/i);
});

test('central Hausa all-tools surface remains byte-identical to the frozen base', () => {
  const { execFileSync } = require('node:child_process');
  const diff = execFileSync('git', ['diff', '--no-ext-diff', '6edacda8437e1fa9b9e5a512138cbdd3169e38be', '--', 'ha/kayan-aiki/index.html'], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(diff, '');
});

test('Hausa runtime is local-only and contains no input telemetry path', () => {
  const js = read('ha/assets/health-parity-ha.js');
  assert.doesNotMatch(js, /\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|localStorage|sessionStorage|indexedDB|history\.(?:pushState|replaceState)|URLSearchParams|console\./);
  assert.match(js, /local-only-no-storage-no-input-network/);
});

test('hospital route preserves provider-quote arithmetic', () => {
  const engine = require(path.join(ROOT, 'tools/hospital-cost/hospital-quote-engine.js'));
  const result = engine.calculate({ facility: 'Synthetic Quote A', currency: 'ngn', quoteDate: '2026-07-20', consultation: 5000, facilityFee: 15000, procedure: 80000, tests: 10000, medicines: 5000, travel: 0, other: 0, insuranceContribution: 25000, bufferPercent: 10 });
  assert.deepEqual({ gross: result.gross, contribution: result.insuranceContribution, oop: result.outOfPocket, buffer: result.bufferAmount, total: result.totalWithBuffer }, { gross: 115000, contribution: 25000, oop: 90000, buffer: 9000, total: 99000 });
  assert.throws(() => engine.calculate({ facility: 'Q', currency: 'NGN', quoteDate: '2026-07-20', consultation: 1, facilityFee: 0, procedure: 0, tests: 0, medicines: 0, travel: 0, other: 0, insuranceContribution: 2, bufferPercent: 0 }), /cannot exceed/);
});

test('sickle route preserves neutral per-pregnancy Punnett probabilities', () => {
  const engine = require(path.join(ROOT, 'tools/sickle-cell/sickle-cell-engine.js'));
  const result = engine.calculate('AS', 'AC');
  assert.equal(result.ok, true);
  assert.equal(result.totalProbability, 100);
  assert.deepEqual(result.outcomes.map(({ genotype, probability }) => [genotype, probability]), [['AA', 25], ['AS', 25], ['AC', 25], ['SC', 25]]);
  assert.equal(engine.calculate('', 'AA').ok, false);
});

test('genotype route preserves one-report verification, not compatibility', () => {
  const engine = require(path.join(ROOT, 'tools/genotype-checker/haemoglobin-result-verification-engine.js'));
  const recognised = engine.verify({ reportedResult: 'HbAS', testMethod: 'hplc', testDate: '2026-07-20', confirmationStatus: 'final' });
  assert.equal(recognised.ok, true);
  assert.equal(recognised.canonicalCode, 'AS');
  const ambiguous = engine.verify({ reportedResult: 'HbS beta+', testMethod: 'unknown', testDate: '', confirmationStatus: 'preliminary' });
  assert.equal(ambiguous.ok, true);
  assert.equal(ambiguous.canonicalCode, null);
  assert.ok(ambiguous.flags.length >= 3);
});

test('childbirth route preserves dated user-entered budget arithmetic', () => {
  const engine = require(path.join(ROOT, 'tools/childbirth-cost/childbirth-budget-engine.js'));
  const result = engine.calculate({ currency: 'ngn', quoteDate: '2026-07-20', asOf: '2026-07-26', sourceType: 'written-provider', plannedCare: '100000', professionalFees: '25000', medicinesSupplies: '10000', testsCare: '5000', transportStay: '5000', contingency: '15000', confirmedContribution: '30000' });
  assert.equal(result.valid, true);
  assert.deepEqual({ gross: result.grossCents, contribution: result.contributionCents, household: result.householdCents, age: result.ageDays }, { gross: 16000000, contribution: 3000000, household: 13000000, age: 6 });
  assert.equal(engine.calculate({ currency: 'NGN', quoteDate: '2026-07-20', asOf: '2026-07-26', sourceType: 'written-provider', plannedCare: '0', professionalFees: '0', medicinesSupplies: '0', testsCare: '0', transportStay: '0', contingency: '0', confirmedContribution: '0' }).valid, false);
});

test('medicine route preserves exact-product whole-pack comparison', () => {
  const engine = require(path.join(ROOT, 'tools/drug-price-compare/exact-medicine-compare-engine.js'));
  const result = engine.calculate({ medicine: 'SyntheticMed', strength: '500 mg', dosageForm: 'tablet', requiredUnits: 21, currency: 'NGN', quoteDate: '2026-07-20', aProvider: 'Quote A', aPackSize: 10, aPackPrice: 1200, aFee: 100, bProvider: 'Quote B', bPackSize: 7, bPackPrice: 900, bFee: 0 });
  assert.deepEqual({ aPacks: result.a.packsNeeded, aUnused: result.a.unusedUnits, aTotal: result.a.totalCost, bPacks: result.b.packsNeeded, bUnused: result.b.unusedUnits, bTotal: result.b.totalCost, difference: result.difference }, { aPacks: 3, aUnused: 9, aTotal: 3700, bPacks: 3, bUnused: 0, bTotal: 2700, difference: 1000 });
  assert.throws(() => engine.calculate({}), /quote date/i);
});

test('meal route preserves per-person logistics and budget arithmetic', () => {
  const engine = require(path.join(ROOT, 'tools/african-meal-plan/meal-logistics-engine.js'));
  const result = engine.calculate({ days: 7, people: 4, mealsPerDay: 3, currency: 'NGN', dailyBudget: 1500, bufferPercent: 10, priceDate: '2026-07-20', notes: 'Synthetic fixture' });
  assert.deepEqual({ servings: result.totalServings, base: result.baseBudget, buffer: result.bufferAmount, total: result.totalBudget }, { servings: 84, base: 42000, buffer: 4200, total: 46200 });
  assert.throws(() => engine.calculate({ days: 32, people: 4, mealsPerDay: 3, currency: 'NGN', dailyBudget: 1500, bufferPercent: 10, priceDate: '2026-07-20' }), /Days/);
});
