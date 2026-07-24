const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const engine = require('../assets/js/engines/profit-margin.js');

test('profit margin engine keeps gross margin and markup distinct', () => {
  const result = engine.calculate({ mode: 'gross', unit: 'USD', revenue: 150, cogs: 100 });
  assert.equal(result.grossProfit, 50);
  assert.equal(result.grossMargin, 33.33);
  assert.equal(result.markup, 50);
  assert.equal(result.selectedMargin, 33.33);
});

test('operating and net margins subtract only user-entered values', () => {
  const operating = engine.calculate({ mode: 'operating', revenue: 1000, cogs: 400, operatingExpenses: 300 });
  assert.equal(operating.operatingProfit, 300);
  assert.equal(operating.operatingMargin, 30);
  const net = engine.calculate({ mode: 'net', revenue: 1000, cogs: 400, operatingExpenses: 300, interestExpense: 50, taxExpense: 20, otherExpenses: 30 });
  assert.equal(net.netProfit, 200);
  assert.equal(net.netMargin, 20);
});

test('losses remain valid and markup is undefined at zero COGS', () => {
  const loss = engine.calculate({ mode: 'gross', revenue: 100, cogs: 140 });
  assert.equal(loss.grossProfit, -40);
  assert.equal(loss.grossMargin, -40);
  assert.equal(loss.markup, -28.57);
  const zeroCost = engine.calculate({ mode: 'gross', revenue: 100, cogs: 0 });
  assert.equal(zeroCost.markup, null);
  assert.throws(() => engine.calculate({ mode: 'gross', revenue: 0, cogs: 0 }), /greater than zero/);
  assert.throws(() => engine.calculate({ mode: 'gross', revenue: 100, cogs: -1 }), /non-negative/);
  assert.throws(() => engine.calculate({ mode: 'net', revenue: 100, cogs: 10, operatingExpenses: '', interestExpense: 0, taxExpense: 0, otherExpenses: 0 }), /required/);
});

test('all launched locales have crawlable formula and evidence boundaries', () => {
  for (const file of ['tools/profit-margin/index.html', 'fr/tools/marge-beneficiaire/index.html', 'sw/zana/kikokotoo-margin-ya-faida/index.html', 'ha/kayan-aiki/tazarar-riba/index.html']) {
    const html = fs.readFileSync(path.resolve(file), 'utf8');
    assert.match(html, /FAQPage|formula|formule|kanuni|dabarar/i);
    assert.match(html, /WebApplication/);
    assert.match(html, /assets\/js\/engines\/profit-margin\.js/);
    assert.match(html, /assets\/js\/pages\/profit-margin-vip\.js/);
    assert.doesNotMatch(html, /<iframe/i);
    assert.match(html, /33(?:\.|,)33 ?%/);
    assert.match(html, /50 ?%/);
    assert.match(html, /Report calculation error|Signaler une erreur de calcul|Ripoti hitilafu ya hesabu|Kai rahoton kuskuren lissafi/);
    assert.doesNotMatch(html, /import duty|FOREX|industry benchmark|good profit margin|pricing recommendation|retail typically|100% markup = 50% margin/i);
  }
});

test('profit-margin AI source context is formula-only and recommendation-free', () => {
  const context = JSON.parse(fs.readFileSync(path.resolve('data/ai/tool-context/profit-margin.json'), 'utf8'));
  assert.match(context.staticText, /Gross margin is/);
  assert.match(context.staticText, /Markup is gross profit divided by COGS/);
  assert.match(context.staticText, /never supply a tax rate/);
  assert.doesNotMatch(context.staticText, /retail 25|services 50|restaurants 5|tech 60|pricing strategy|cost reduction/i);
});
