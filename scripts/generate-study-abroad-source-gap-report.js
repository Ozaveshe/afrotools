const fs = require('fs');
const path = require('path');

const root = process.cwd();

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
      get innerHTML() { return this._html || ''; }
    };
  }
};

require(path.join(root, 'tools/study-abroad-cost/study-abroad-fx-policy.js'));
require(path.join(root, 'tools/study-abroad-cost/study-abroad-cost.js'));
require(path.join(root, 'tools/study-abroad-cost/study-abroad-backbone.js'));
const gate = require(path.join(root, 'tools/study-abroad-cost/study-abroad-confidence-gate.js'));

const countries = global.AfroStudyAbroadUpgrade && global.AfroStudyAbroadUpgrade.countries || [];
const report = gate.generateSourceGapReport(countries);

const outDir = path.join(root, 'audit-results');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  path.join(outDir, 'study-abroad-source-gap-report.json'),
  JSON.stringify(report, null, 2) + '\n'
);
fs.writeFileSync(
  path.join(outDir, 'study-abroad-source-gap-report.csv'),
  gate.toCsv(report.rows)
);

console.log(JSON.stringify({
  generatedAt: report.generatedAt,
  totalDestinations: report.totalDestinations,
  statusCounts: report.statusCounts,
  topPriority: report.rows.slice(0, 5).map((row) => ({
    country: row.country,
    status: row.confidenceLabel,
    priorityScore: row.priorityScore
  }))
}, null, 2));
