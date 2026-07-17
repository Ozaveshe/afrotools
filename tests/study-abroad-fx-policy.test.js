const assert = require('assert');
const path = require('path');

const root = path.join(__dirname, '..');

global.window = global;
global.navigator = { share: null };
global.document = {
  readyState: 'loading',
  body: null,
  addEventListener() {},
  querySelector() { return null; },
  getElementById() { return null; },
  createElement() {
    return {
      addEventListener() {},
      appendChild() {},
      insertAdjacentElement() {},
      querySelector() { return null; },
      set innerHTML(value) { this._html = value; },
      get innerHTML() { return this._html || ''; },
    };
  },
};

require(path.join(root, 'assets/js/components/product-backbone.js'));
const fx = require(path.join(root, 'tools/study-abroad-cost/study-abroad-fx-policy.js'));
require(path.join(root, 'tools/study-abroad-cost/study-abroad-cost.js'));
require(path.join(root, 'tools/study-abroad-cost/study-abroad-backbone.js'));

const requiredRateFields = [
  'baseCurrency',
  'quoteCurrency',
  'rate',
  'provider',
  'lastUpdated',
  'mode',
  'refreshPolicy',
  'confidence',
];

const gbpUsd = fx.getRateToUsd('GBP');
assert(gbpUsd, 'GBP static FX metadata should exist');
for (const key of requiredRateFields) {
  assert(Object.prototype.hasOwnProperty.call(gbpUsd, key), `GBP/USD FX metadata missing ${key}`);
}
assert.strictEqual(gbpUsd.mode, 'static_estimate', 'Study Abroad static rates must be explicit static estimates');
assert.notStrictEqual(fx.modeLabel(gbpUsd), 'Live rate', 'Static rates must not display as live');
assert.match(gbpUsd.refreshPolicy, /Manual review|does not call/i, 'Static rates need a safe refresh policy');

const usdNgn = fx.getRate('USD', 'NGN');
assert(usdNgn, 'USD/NGN metadata should be available from the static table');
assert.strictEqual(usdNgn.mode, 'static_estimate', 'Cross-rate metadata must remain static estimate');

const missing = fx.fromUsd(1000, 'ZZZ');
assert.strictEqual(missing.amount, null, 'Missing FX should return null amount instead of a fake conversion');
assert.strictEqual(missing.missing, true, 'Missing FX should be flagged');

const display = global.AfroProductBackbone.currencyDisplay({
  amount: 1000,
  currency: 'GBP',
  usdAmount: 1270,
  localAmount: null,
  localCurrency: 'ZZZ',
  label: 'Full route',
  estimate: true,
  fxRates: [gbpUsd],
  fxMissing: ['ZZZ'],
  showFxMeta: true,
});
assert(display.includes('Static estimate'), 'CurrencyDisplay should show static estimate label');
assert(display.includes('Last updated: not available'), 'CurrencyDisplay should show missing timestamp honestly');
assert(display.includes('Missing: ZZZ'), 'CurrencyDisplay should expose missing local FX');
assert(!display.includes('Live rate'), 'CurrencyDisplay must not call static rates live');

const unknownCountry = {
  key: 'fx-test',
  name: 'FX Testland',
  region: 'Africa',
  currency: 'ZZZ',
  profile: 'Africa',
  confidence: 'low',
};
const state = {
  homeCurrency: 'ZZZ',
  availableBudget: 1000,
  fundingSource: 'self',
  livingStyle: 'standard',
  dependents: 'none',
  intakeYear: 2026,
  level: 'masters',
  field: 'engineering',
  years: 1,
  scholarshipMode: 'none',
};

const scenario = global.AfroStudyAbroadUpgrade.estimateScenario(unknownCountry, state);
assert.strictEqual(scenario.firstYearDest, null, 'Missing destination FX should not fabricate destination-currency output');
assert.strictEqual(scenario.firstYearLocal, null, 'Missing home FX should not fabricate local-currency output');
assert.deepStrictEqual(scenario.fx.missing, ['ZZZ', 'ZZZ'], 'Scenario should carry missing FX currencies');

const risk = global.AfroStudyAbroadUpgrade.riskFor(scenario);
assert.strictEqual(risk.level, 'unknown', 'Missing budget FX should make affordability risk unknown');
assert.match(risk.reasons.join(' '), /FX rate is missing/i, 'Missing FX risk should explain why');

const html = require('fs').readFileSync(path.join(root, 'tools/study-abroad-cost/index.html'), 'utf8');
assert(html.includes('study-abroad-fx-policy.js'), 'Study Abroad page must load the FX policy script');
assert(html.includes('study-abroad-fx-policy.css'), 'Study Abroad page must load the FX policy CSS');

console.log('Study Abroad FX policy verified.');
