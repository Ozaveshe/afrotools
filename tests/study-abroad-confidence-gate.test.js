const assert = require('assert');
const path = require('path');

const root = path.join(__dirname, '..');

global.window = global;
global.navigator = {};
global.localStorage = {
  getItem() { return null; },
  setItem() {}
};
global.document = {
  readyState: 'loading',
  addEventListener() {},
  querySelector() { return null; },
  getElementById() { return null; },
  createElement() {
    return {
      addEventListener() {},
      insertAdjacentElement() {},
      querySelector() { return null; },
      set innerHTML(value) { this._html = value; },
      get innerHTML() { return this._html || ''; },
    };
  },
};

require(path.join(root, 'assets/js/components/product-backbone.js'));
require(path.join(root, 'tools/study-abroad-cost/study-abroad-fx-policy.js'));
require(path.join(root, 'tools/study-abroad-cost/study-abroad-cost.js'));
require(path.join(root, 'tools/study-abroad-cost/study-abroad-backbone.js'));
const gate = require(path.join(root, 'tools/study-abroad-cost/study-abroad-confidence-gate.js'));

const countries = global.AfroStudyAbroadUpgrade.countries;
assert.strictEqual(countries.length, 100, 'Study Abroad should still expose 100 destinations');

const classified = gate.classifyAll(countries);
const counts = gate.groupCounts(countries);
assert.strictEqual(counts.total, 100, 'Confidence grouping should cover every destination');
assert(counts[gate.STATUS.HERO] >= 5, 'Hero destinations should be grouped as hero verified');
assert(counts[gate.STATUS.READY] > 0, 'Some destinations should be ready for planning estimate');
assert(counts[gate.STATUS.PARTIAL] > 0, 'Some destinations should be partial source coverage');
assert(counts[gate.STATUS.NEEDS] > 0, 'Some destinations should need verification');

const uk = countries.find((country) => country.key === 'uk');
const france = countries.find((country) => country.key === 'france');
const mexico = countries.find((country) => country.key === 'mexico');
const uae = countries.find((country) => country.key === 'uae');
assert.strictEqual(gate.classifyDestination(uk), gate.STATUS.HERO, 'UK should remain hero verified');
assert.strictEqual(gate.classifyDestination(france), gate.STATUS.READY, 'France should be planning-estimate ready');
assert.strictEqual(gate.classifyDestination(mexico), gate.STATUS.PARTIAL, 'Mexico should be partial source coverage');
assert.strictEqual(gate.classifyDestination(uae), gate.STATUS.NEEDS, 'UAE should be needs verification from low confidence regional data');

const weakPanel = gate.renderDestinationPanel(uae, { fullRouteDest: 20000 });
assert(weakPanel.includes('Planning estimate only'), 'Weak destinations should show planning-estimate-only badge');
assert(weakPanel.includes('Report outdated cost'), 'Feedback loop should include outdated-cost reporting');
assert(weakPanel.includes('Submit official source'), 'Feedback loop should include source submission');
assert(weakPanel.includes('Planning range'), 'Weak destination panel should show a range');

const report = gate.generateSourceGapReport(countries);
assert.strictEqual(report.totalDestinations, 100, 'Source-gap export should include 100 destinations');
assert.strictEqual(report.rows.length, 100, 'Source-gap rows should include every destination');
assert(report.rows[0].priorityScore >= report.rows[report.rows.length - 1].priorityScore, 'Source-gap report should be priority sorted');
assert(report.rows.every((row) => Array.isArray(row.missingFields) && row.missingFields.length), 'Every source-gap row should list missing fields');
assert(report.rows.every((row) => Array.isArray(row.sourceGaps) && row.sourceGaps.length), 'Every source-gap row should list source gaps');

const csv = gate.toCsv(report.rows);
assert(csv.startsWith('country,key,region,currency,confidenceStatus'), 'CSV export should include a stable header');
assert(csv.includes('"United Arab Emirates"'), 'CSV export should include destination rows');
assert.match(gate.rangeLabel(1000, 'USD', 0.25), /\$750.*\$1,250/, 'Range labels should soften weak-data precision');

console.log('Study Abroad confidence gate verified.');
