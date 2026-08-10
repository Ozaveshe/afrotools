'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const engine = require('../engines/src/pension-fund-projection-engine.js');
const root = path.resolve(__dirname, '..');

function valid(overrides) {
  return Object.assign({ countryCode:'TZ', currency:'TZS', currentAge:44, retirementAge:45, monthlySalary:1000, salaryGrowthPercent:0, contributionRatePercent:10, currentBalance:0, annualReturnPercent:0, annualFeePercent:0, inflationPercent:0, drawdownPercent:4, sourceLabel:'Synthetic current statement', sourceCheckedDate:'2026-08-09', asOfDate:'2026-08-09', schemeInputsConfirmed:true, assumptionsConfirmed:true }, overrides || {});
}

test('exact zero-return fixture preserves contributions and user drawdown', () => {
  const result = engine.calculate(valid());
  assert.equal(result.years, 1);
  assert.ok(Math.abs(result.base.endingBalance - 1200) < 1e-8);
  assert.ok(Math.abs(result.base.totalContributed - 1200) < 1e-8);
  assert.ok(Math.abs(result.base.investmentGrowth) < 1e-8);
  assert.ok(Math.abs(result.base.illustrativeMonthlyDrawdown - 4) < 1e-8);
  assert.ok(Math.abs(result.base.replacementRatioPercent - 0.4) < 1e-8);
  assert.equal(result.base.yearly.length, 2);
});

test('fees, inflation and deterministic sensitivity are explicit', () => {
  const result = engine.calculate(valid({ currentAge:45, retirementAge:55, annualReturnPercent:8, annualFeePercent:1.5, inflationPercent:5 }));
  assert.equal(result.base.netAnnualReturnPercent, 6.5);
  assert.ok(result.lower.endingBalance < result.base.endingBalance);
  assert.ok(result.higher.endingBalance > result.base.endingBalance);
  assert.ok(result.base.realValue < result.base.endingBalance);
});

test('stale sources and missing confirmations fail closed', () => {
  assert.throws(() => engine.calculate(valid({ sourceCheckedDate:'2025-01-01' })), /366 days/);
  assert.throws(() => engine.calculate(valid({ schemeInputsConfirmed:false })), /Confirm/);
  assert.throws(() => engine.calculate(valid({ retirementAge:44 })), /between|greater/);
});

test('English and Swahili owners expose the same complete local workflow', () => {
  const en = fs.readFileSync(path.join(root, 'tools/pension-projection/index.html'), 'utf8');
  const sw = fs.readFileSync(path.join(root, 'sw/zana/makadirio-ya-mfuko-wa-pensheni/index.html'), 'utf8');
  for (const html of [en, sw]) {
    for (const name of ['countryCode','currency','currentAge','retirementAge','monthlySalary','salaryGrowthPercent','contributionRatePercent','currentBalance','annualReturnPercent','annualFeePercent','inflationPercent','drawdownPercent','sourceLabel','sourceCheckedDate','asOfDate','schemeInputsConfirmed','assumptionsConfirmed']) assert.match(html, new RegExp(`name="${name}"`));
    for (const action of ['reset','save','load','import','copy','json','csv','txt','pdf']) assert.match(html, new RegExp(`data-action="${action}"`));
    assert.match(html, /pension-fund-projection-engine\.js/);
    assert.match(html, /assets\/img\/tools\/pension-projection\.webp/);
    assert.doesNotMatch(html, /iframe|cdn\.jsdelivr\.net\/npm\/chart|data\/hr\/pension-systems|AI-powered insights/);
  }
});

test('exact route ownership and reciprocal hreflang are explicit', () => {
  const en = fs.readFileSync(path.join(root, 'tools/pension-projection/index.html'), 'utf8');
  const fr = fs.readFileSync(path.join(root, 'fr/tools/projection-pension/index.html'), 'utf8');
  const sw = fs.readFileSync(path.join(root, 'sw/zana/makadirio-ya-mfuko-wa-pensheni/index.html'), 'utf8');
  const target = 'https://afrotools.com/sw/zana/makadirio-ya-mfuko-wa-pensheni/';
  assert.match(en, /data-afrotools-source-owner="scripts\/build-sw-pension-fund-projection\.js"/);
  assert.ok(en.includes(target) && fr.includes(target));
  assert.match(sw, /rel="canonical" href="https:\/\/afrotools\.com\/sw\/zana\/makadirio-ya-mfuko-wa-pensheni\/"/);
  assert.match(sw, /hreflang="en" href="https:\/\/afrotools\.com\/tools\/pension-projection\/"/);
  assert.match(sw, /"inLanguage":"sw"/);
  const registry = JSON.parse(fs.readFileSync(path.join(root, 'data/source-registry.json'), 'utf8'));
  const source = registry.sources.find(row => row.id === 'pension-projection-method-source');
  assert.ok(source.routes.includes('/sw/zana/makadirio-ya-mfuko-wa-pensheni'));
  assert.equal(source.sourceUrl, 'https://www.investor.gov/financial-tools-calculators/calculators/compound-interest-calculator');

  const toolRegistry = fs.readFileSync(path.join(root, 'assets/js/components/tool-registry.js'), 'utf8');
  const ownerRows = toolRegistry.split(/\r?\n/).filter(line => line.includes("id: 'pension-projection-sw'"));
  assert.equal(ownerRows.length, 1, 'Swahili Pension Projection has exactly one registry owner');
  assert.ok(ownerRows[0].includes("href: '/sw/zana/makadirio-ya-mfuko-wa-pensheni/'"));
  assert.ok(ownerRows[0].includes("sourceId: 'pension-projection'"));
  assert.ok(ownerRows[0].includes("imageId: 'pension-projection'"));
  const hub = fs.readFileSync(path.join(root, 'sw/mshahara-na-kodi/index.html'), 'utf8');
  assert.equal((hub.match(/href="\/sw\/zana\/makadirio-ya-mfuko-wa-pensheni\/"/g) || []).length, 1, 'salary and tax hub discovers the route exactly once');
});

test('source owner is current and does not mutate central release files', () => {
  const beforeEn = fs.readFileSync(path.join(root, 'tools/pension-projection/index.html'), 'utf8');
  const beforeFr = fs.readFileSync(path.join(root, 'fr/tools/projection-pension/index.html'), 'utf8');
  const beforeSw = fs.readFileSync(path.join(root, 'sw/zana/makadirio-ya-mfuko-wa-pensheni/index.html'), 'utf8');
  require('../scripts/build-sw-pension-fund-projection.js');
  assert.equal(fs.readFileSync(path.join(root, 'tools/pension-projection/index.html'), 'utf8'), beforeEn);
  assert.equal(fs.readFileSync(path.join(root, 'fr/tools/projection-pension/index.html'), 'utf8'), beforeFr);
  assert.equal(fs.readFileSync(path.join(root, 'sw/zana/makadirio-ya-mfuko-wa-pensheni/index.html'), 'utf8'), beforeSw);
});
