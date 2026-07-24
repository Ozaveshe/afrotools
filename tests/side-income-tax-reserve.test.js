'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const engine = require('../assets/js/engines/side-income-tax-reserve.js');

const now = '2026-07-22T12:00:00Z';
const fixture = {
  currency: 'KES',
  jurisdiction: 'Kenya',
  taxPeriod: '2026 year of income',
  grossRevenue: 1000000,
  refunds: 50000,
  platformFees: 100000,
  otherExpenses: 150000,
  taxCredits: 20000,
  reserveRatePct: 20,
  instalments: 4,
  evidenceLabel: 'Official notice reviewed by me',
  evidenceDate: '2026-07-20'
};

const result = engine.calculate(fixture, now);
assert.equal(result.ok, true);
assert.equal(result.totalCosts, 300000);
assert.equal(result.planningProfit, 700000);
assert.equal(result.reserveBeforeCredits, 140000);
assert.equal(result.reserveAfterCredits, 120000);
assert.equal(result.creditExcess, 0);
assert.equal(result.cashAfterCosts, 700000);
assert.equal(result.cashAfterReserve, 580000);
assert.equal(result.reservePerInstalment, 30000);
assert.equal(result.expenseRatioPct, 30);
assert.equal(result.reserveGrossRatePct, 12);

const zero = engine.calculate({ ...fixture, grossRevenue: 0, refunds: 0, platformFees: 0, otherExpenses: 0, taxCredits: 0, reserveRatePct: 0 }, now);
assert.equal(zero.ok, true);
assert.equal(zero.planningProfit, 0);
assert.equal(zero.reserveAfterCredits, 0);
assert.equal(zero.expenseRatioPct, 0);

const excessCredit = engine.calculate({ ...fixture, taxCredits: 200000 }, now);
assert.equal(excessCredit.reserveAfterCredits, 0);
assert.equal(excessCredit.creditExcess, 60000);

assert.equal(engine.calculate({ ...fixture, currency: 'K' }, now).error, 'invalid_context');
assert.equal(engine.calculate({ ...fixture, jurisdiction: '' }, now).error, 'invalid_context');
assert.equal(engine.calculate({ ...fixture, grossRevenue: -1 }, now).error, 'invalid_amount');
assert.equal(engine.calculate({ ...fixture, refunds: 1000001 }, now).error, 'invalid_costs');
assert.equal(engine.calculate({ ...fixture, platformFees: 900000 }, now).error, 'invalid_costs');
assert.equal(engine.calculate({ ...fixture, reserveRatePct: 101 }, now).error, 'invalid_assumption');
assert.equal(engine.calculate({ ...fixture, instalments: 13 }, now).error, 'invalid_assumption');
assert.equal(engine.calculate({ ...fixture, evidenceDate: '2025-07-20' }, now).error, 'invalid_evidence');
assert.equal(engine.calculate({ ...fixture, evidenceDate: '2026-07-23' }, now).error, 'invalid_evidence');
assert.equal(engine.recentDate('2025-07-22', now), true);
assert.equal(engine.recentDate('2025-07-21', now), false);

const root = path.resolve(__dirname, '..');
for (const route of ['tools/side-hustle-tax/index.html', 'fr/tools/impot-activite-secondaire/index.html']) {
  const html = fs.readFileSync(path.join(root, route), 'utf8');
  assert.match(html, /data-side-income-reserve/);
  assert.match(html, /side-income-tax-reserve\.js/);
  assert.match(html, /ataftax\.org\/members/);
  assert.match(html, /kra\.go\.ke\/file-my-returns/);
  assert.match(html, /sars\.gov\.za\/types-of-tax\/provisional-tax/);
  assert.match(html, /gra\.gov\.gh\/domestic-tax\/personal-income-tax/);
  assert.doesNotMatch(html, /\.netlify\/functions\/ai-advisor|Uber|Bolt|Jumia|Upwork|Fiverr|10 African countries|Compare Regimes|quarterly tax schedule/i);
}

const controller = fs.readFileSync(path.join(root, 'assets/js/pages/side-income-tax-reserve-vip.js'), 'utf8');
assert.doesNotMatch(controller, /\bfetch\s*\(|localStorage|sessionStorage|analytics/i);
assert.match(controller, /side-income-tax-reserve\.csv/);
assert.match(controller, /side-income-tax-reserve\.json/);
assert.match(controller, /noGate: true/);
assert.match(controller, /skipGate: true/);
assert.match(controller, /function csvCell/);

console.log('side-income-tax-reserve: all checks passed');
