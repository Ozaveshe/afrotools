const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const engine = require('../assets/js/engines/markup-selling-price.js');

test('markup mode keeps markup and margin distinct', () => {
  const result = engine.calculate({ mode: 'markup', unit: 'USD', cost: 100, percentage: 50 });
  assert.equal(result.sellingPrice, 150);
  assert.equal(result.profit, 50);
  assert.equal(result.markup, 50);
  assert.equal(result.margin, 33.33);
});

test('target margin mode solves the inverse formula', () => {
  const result = engine.calculate({ mode: 'target-margin', cost: 100, percentage: 20 });
  assert.equal(result.sellingPrice, 125);
  assert.equal(result.profit, 25);
  assert.equal(result.markup, 25);
  assert.equal(result.margin, 20);
});

test('bounds reject undefined prices but allow valid below-cost cases', () => {
  const loss = engine.calculate({ mode: 'markup', cost: 100, percentage: -25 });
  assert.equal(loss.sellingPrice, 75);
  assert.equal(loss.profit, -25);
  assert.equal(loss.margin, -33.33);
  assert.throws(() => engine.calculate({ mode: 'markup', cost: 100, percentage: -100 }), /greater than -100/);
  assert.throws(() => engine.calculate({ mode: 'target-margin', cost: 100, percentage: 100 }), /less than 100/);
  assert.throws(() => engine.calculate({ mode: 'markup', cost: 0, percentage: 10 }), /greater than zero/);
  assert.throws(() => engine.calculate({ mode: 'markup', cost: '', percentage: 10 }), /required/);
  assert.throws(() => engine.calculate({ mode: 'markup', cost: 100, percentage: '' }), /required/);
});

test('comparison uses only user-authored percentages and enforces a finite limit', () => {
  const results = engine.compare({ cost: 100, markups: [10, 50, -20] });
  assert.deepEqual(results.map((row) => row.sellingPrice), [110, 150, 80]);
  assert.throws(() => engine.compare({ cost: 100, markups: [] }), /at least one/);
  assert.throws(() => engine.compare({ cost: 100, markups: Array(21).fill(10) }), /no more than 20/);
});

test('all launched locales are native formula-only applications', () => {
  const files = [
    'tools/markup-calc/index.html',
    'fr/tools/calculateur-marge/index.html',
    'sw/zana/kikokotoo-markup/index.html',
    'ha/kayan-aiki/karin-farashi/index.html'
  ];
  for (const file of files) {
    const html = fs.readFileSync(path.resolve(file), 'utf8');
    assert.match(html, /WebApplication/);
    assert.match(html, /FAQPage/);
    assert.match(html, /assets\/js\/engines\/markup-selling-price\.js/);
    assert.match(html, /assets\/js\/pages\/markup-calc-vip\.js/);
    assert.doesNotMatch(html, /fetch\(['"]\/tools\/markup-calc|chart\.js|<iframe/i);
    assert.match(html, /150/);
    assert.match(html, /33(?:\.|,)33 ?%/);
    assert.doesNotMatch(html, /retail goods typically|wholesale is often|credit risk premium|African Market Markups|100-200% markup/i);
  }
});

test('AI context is browser-local and formula-only', () => {
  const context = JSON.parse(fs.readFileSync(path.resolve('data/ai/tool-context/markup-calc.json'), 'utf8'));
  assert.match(context.staticText, /selling price equals cost times/);
  assert.match(context.staticText, /English, French, Swahili and Hausa/);
  assert.match(context.staticText, /remain in the browser/);
  assert.match(context.staticText, /Never supply or infer tax/);
  assert.doesNotMatch(context.staticText, /retail 50|wholesale 10|recommended markup|credit price/i);
});

test('requested alias redirects once to the self-canonical route', () => {
  const redirects = fs.readFileSync(path.resolve('_redirects'), 'utf8');
  assert.match(redirects, /^\/tools\/markup-calculator\/\s+\/tools\/markup-calc\/\s+301!$/m);
  assert.doesNotMatch(redirects, /^\/tools\/markup-calc\/\s+\/tools\/markup-calculator\//m);
  const page = fs.readFileSync(path.resolve('tools/markup-calc/index.html'), 'utf8');
  assert.match(page, /rel="canonical" href="https:\/\/afrotools\.com\/tools\/markup-calc\/"/);
});
