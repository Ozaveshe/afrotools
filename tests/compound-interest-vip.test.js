'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const engine = require('../engines/src/investment-return-engine.js');
const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('compound-interest view reuses the reviewed Investment Return engine', () => {
  const en = read('tools/compound-interest/index.html');
  const fr = read('fr/tools/interet-compose/index.html');
  const widget = read('widgets/iframe/financial-compound-interest.html');
  const widgetJs = read('widgets/financial/compound-interest.js');
  for (const source of [en, fr, widget]) assert.match(source, /\/engines\/investment-return-engine\.js/);
  assert.match(widgetJs, /engines\.investmentReturn/);
  assert.doesNotMatch(en + fr + widgetJs, /Chart\.js|new Chart|daily compounding|Ghana T-Bills|Kenyan T-Bills/);
  assert.doesNotMatch(fr, /fetch\(['"]\/tools\/compound-interest/);
});

test('checked regular-savings example matches the shared engine', () => {
  const result = engine.project({
    initialInvestment: 100000, monthlyContribution: 10000, annualRatePercent: 8,
    years: 5, compoundsPerYear: 12, contributionTiming: 'end', inflationRatePercent: 0
  });
  assert.ok(Math.abs(result.finalValue - 883753.1332825755) < 0.001);
  assert.equal(result.totalContributed, 700000);
  assert.ok(Math.abs(result.projectedGain - 183753.13328257552) < 0.001);
  assert.match(read('tools/compound-interest/index.html'), /883,753\.13/);
  assert.match(read('fr/tools/interet-compose/index.html'), /883 753,13/);
});

test('shared engine handles zero rate, contribution timing and bounded invalid inputs', () => {
  const zero = engine.project({ initialInvestment:1000, monthlyContribution:100, annualRatePercent:0, years:1, compoundsPerYear:12, contributionTiming:'end', inflationRatePercent:0 });
  assert.equal(zero.finalValue, 2200);
  assert.equal(zero.projectedGain, 0);
  const end = engine.project({ initialInvestment:1000, monthlyContribution:100, annualRatePercent:12, years:1, compoundsPerYear:12, contributionTiming:'end', inflationRatePercent:0 });
  const beginning = engine.project({ initialInvestment:1000, monthlyContribution:100, annualRatePercent:12, years:1, compoundsPerYear:12, contributionTiming:'beginning', inflationRatePercent:0 });
  assert.ok(beginning.finalValue > end.finalValue);
  assert.throws(() => engine.project({ initialInvestment:-1, monthlyContribution:0, annualRatePercent:8, years:1 }), /zero or greater/);
  assert.throws(() => engine.project({ initialInvestment:1, monthlyContribution:-1, annualRatePercent:8, years:1 }), /zero or greater/);
  assert.throws(() => engine.project({ initialInvestment:1, monthlyContribution:0, annualRatePercent:Infinity, years:1 }), /finite/);
  assert.throws(() => engine.project({ initialInvestment:1, monthlyContribution:0, annualRatePercent:8, years:101 }), /between one month/);
  assert.throws(() => engine.project({ initialInvestment:1, monthlyContribution:0, annualRatePercent:8, years:1, compoundsPerYear:365 }), /1, 4, or 12/);
});

test('SEO and AI contracts state the real browser-local boundaries', () => {
  for (const file of ['tools/compound-interest/index.html', 'fr/tools/interet-compose/index.html']) {
    const html = read(file);
    assert.match(html, /dateModified/);
    assert.match(html, /investor\.gov\/financial-tools-calculators\/calculators\/compound-interest-calculator/);
    assert.match(html, /FAQPage/);
  }
  const context = JSON.parse(read('data/ai/tool-context/compound-interest.json'));
  assert.equal(context.sourceOfTruth, 'engines/src/investment-return-engine.js');
  assert.equal(context.boundaries.prefill, false);
  assert.equal(context.boundaries.liveRates, false);
  assert.equal(context.boundaries.guaranteedReturn, false);
  const manifest = require('../assets/js/ai/tool-manifest.js').MAJOR_TOOL_OVERRIDES['compound-interest'];
  assert.deepEqual(manifest.aiCapabilities, ['route_only', 'export']);
  assert.equal(manifest.privacyMode, 'browser_local');
  assert.deepEqual(manifest.languagesSupported, ['en', 'fr']);
});
