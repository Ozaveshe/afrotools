const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const engine = require('../assets/js/engines/break-even-planner.js');

test('separates exact thresholds from whole-unit sales', () => {
  const result = engine.calculate({ fixedCosts: 1000, sellingPrice: 35, variableCost: 15 });
  assert.equal(result.contributionPerUnit, 20);
  assert.equal(result.contributionRatio, 0.571429);
  assert.equal(result.exactBreakEvenUnits, 50);
  assert.equal(result.wholeBreakEvenUnits, 50);
  assert.equal(result.exactBreakEvenRevenue, 1750);
  assert.equal(result.wholeUnitRevenue, 1750);

  const fractional = engine.calculate({ fixedCosts: 1010, sellingPrice: 35, variableCost: 15 });
  assert.equal(fractional.exactBreakEvenUnits, 50.5);
  assert.equal(fractional.wholeBreakEvenUnits, 51);
  assert.equal(fractional.exactBreakEvenRevenue, 1767.5);
  assert.equal(fractional.wholeUnitRevenue, 1785);
});

test('zero fixed cost is valid and optional planning inputs remain optional', () => {
  const result = engine.calculate({ fixedCosts: 0, sellingPrice: 30, variableCost: 10 });
  assert.equal(result.exactBreakEvenUnits, 0);
  assert.equal(result.wholeBreakEvenUnits, 0);
  assert.equal(result.exactBreakEvenRevenue, 0);
  assert.equal(result.wholeUnitRevenue, 0);
  assert.equal(result.plannedProfitLoss, null);
  assert.equal(result.marginOfSafetyUnits, null);
  assert.equal(result.targetProfitWholeUnits, null);
});

test('planned results remain signed and target profit rounds only whole units', () => {
  const result = engine.calculate({ fixedCosts: 1000, sellingPrice: 30, variableCost: 10, plannedUnits: 40, targetProfit: 505 });
  assert.equal(result.plannedProfitLoss, -200);
  assert.equal(result.marginOfSafetyUnits, -10);
  assert.equal(result.marginOfSafetyPercent, -25);
  assert.equal(result.targetProfitExactUnits, 75.25);
  assert.equal(result.targetProfitWholeUnits, 76);
});

test('rejects blank, negative, non-finite and non-viable values', () => {
  assert.throws(() => engine.calculate({ fixedCosts: '', sellingPrice: 30, variableCost: 10 }), /required/);
  assert.throws(() => engine.calculate({ fixedCosts: -1, sellingPrice: 30, variableCost: 10 }), /zero or greater/);
  assert.throws(() => engine.calculate({ fixedCosts: 1, sellingPrice: 0, variableCost: 0 }), /greater than zero/);
  assert.throws(() => engine.calculate({ fixedCosts: 1, sellingPrice: 10, variableCost: 10 }), /greater than variable/);
  assert.throws(() => engine.calculate({ fixedCosts: 1, sellingPrice: 10, variableCost: -1 }), /zero or greater/);
  assert.throws(() => engine.calculate({ fixedCosts: 1, sellingPrice: 10, variableCost: 1, plannedUnits: -1 }), /zero or greater/);
  assert.throws(() => engine.calculate({ fixedCosts: 1, sellingPrice: 10, variableCost: 1, targetProfit: Infinity }), /finite/);
});

test('all launched locales are native apps on one formula engine', () => {
  const files = [
    'tools/break-even/index.html',
    'fr/tools/seuil-rentabilite/index.html',
    'sw/zana/kikokotoo-break-even/index.html',
    'ha/kayan-aiki/dawo-da-jari/index.html'
  ];
  for (const file of files) {
    const html = fs.readFileSync(path.resolve(file), 'utf8');
    assert.match(html, /WebApplication/);
    assert.match(html, /FAQPage/);
    assert.match(html, /assets\/js\/engines\/break-even-planner\.js/);
    assert.match(html, /assets\/js\/pages\/break-even-vip\.js/);
    assert.doesNotMatch(html, /Chart\.js|chart\.umd|fetch\(|<iframe/i);
    assert.doesNotMatch(html, /vatRate|levyRate|paymentFeeRate|African Business Examples/i);
  }
});

test('both iframe widgets bind the shared engine and canonical full tool', () => {
  for (const file of ['widgets/iframe/financial-break-even.html', 'widgets/iframe/business-break-even-lite.html']) {
    const html = fs.readFileSync(path.resolve(file), 'utf8');
    assert.match(html, /assets\/js\/engines\/break-even-planner\.js/);
    assert.match(html, /widgets\/financial\/break-even\.js/);
    assert.match(html, /https:\/\/afrotools\.com\/tools\/break-even\//);
  }
  const widget = fs.readFileSync(path.resolve('widgets/financial/break-even.js'), 'utf8');
  assert.match(widget, /BreakEvenPlanner/);
  assert.match(widget, /data-error/);
});

test('historical aliases redirect one hop without a loop', () => {
  const policy = JSON.parse(fs.readFileSync(path.resolve('data/registry/route-policy.json'), 'utf8'));
  const decisions = new Map(policy.canonicalDecisions.map((row) => [row.source, row.destination]));
  assert.equal(decisions.get('/business/break-even/'), '/tools/break-even/');
  assert.equal(decisions.get('/fr/business/break-even/'), '/fr/tools/seuil-rentabilite/');
  assert.equal(decisions.has('/tools/break-even/'), false);
  assert.equal(decisions.has('/fr/tools/seuil-rentabilite/'), false);
  const redirects = fs.readFileSync(path.resolve('_redirects'), 'utf8');
  assert.match(redirects, /^\/business\/break-even\/\s+\/tools\/break-even\/\s+301!$/m);
  assert.match(redirects, /^\/fr\/business\/break-even\/\s+\/fr\/tools\/seuil-rentabilite\/\s+301!$/m);
});

test('AI context is local, user-input-only and formula explicit', () => {
  const context = JSON.parse(fs.readFileSync(path.resolve('data/ai/tool-context/break-even.json'), 'utf8'));
  assert.match(context.staticText, /Exact threshold revenue equals fixed costs divided by contribution ratio/);
  assert.match(context.staticText, /English, French, Swahili and Hausa/);
  assert.match(context.staticText, /remain in the browser/);
  assert.match(context.staticText, /Never supply or infer VAT/);
  assert.doesNotMatch(context.staticText, /recommended price|typical margin|market demand is/i);
});
