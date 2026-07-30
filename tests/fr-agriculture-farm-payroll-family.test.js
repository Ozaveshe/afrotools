'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const manifest = require('../data/localization/fr-agriculture-parity-manifest.json');
const aiRouteMap = require('../assets/js/ai/french-route-map.generated.js');
const fixture = require('./fixtures/farm-payroll-english-invariants.json');
const { ROOT, assertNativeFrenchOutput } = require('../scripts/lib/fr-agriculture-parity-manifest');

function runtime() {
  const context = { window: {} };
  vm.createContext(context);
  for (const file of ['data/agriculture/farm-payroll-data.js', 'engines/src/farm-payroll-engine.js']) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), 'utf8'), context, { filename: file });
  }
  return context.window.AfroTools;
}

const rows = manifest.rows.filter(row => row.family === 'farm-payroll');
const countries = rows.filter(row => row.country);
const hub = rows.find(row => !row.country);
const owners = runtime();
const oracles = {};

assert.equal(rows.length, 55);
assert.equal(countries.length, 54);
assertNativeFrenchOutput(manifest, rows.map(row => row.french.route));
assert.equal((fs.readFileSync(path.join(ROOT, hub.french.file), 'utf8').match(/<li><a href="\/fr\/agriculture\/farm-payroll\//g) || []).length, 54);

for (const row of countries) {
  const code = row.country.code;
  const html = fs.readFileSync(path.join(ROOT, row.french.file), 'utf8');
  const english = fs.readFileSync(path.join(ROOT, row.english.file), 'utf8');
  assert.doesNotMatch(html, /<iframe\b/i);
  assert.match(html, /\/engines\/farm-payroll-engine\.js/);
  assert.match(html, /\/data\/agriculture\/farm-payroll-data\.js/);
  assert.match(html, /Exporter en PDF/);
  assert.match(html, /Exporter en CSV/);
  assert.match(html, /Exporter en JSON/);
  assert.match(html, /Exporter en TXT/);
  assert.ok(english.includes(`hreflang="fr" href="https://afrotools.com${row.french.route}"`));
  assert.equal(aiRouteMap.routes[row.english.routeKey], row.french.routeKey);
  assert.ok(owners.FarmPayrollData[code]);

  const expectedCases = fixture.countries[code].cases;
  for (const expected of expectedCases) {
    const actual = owners.FarmPayrollEngine.calculate(expected.input, owners.FarmPayrollData[code]);
    assert.deepEqual(JSON.parse(JSON.stringify(actual)), expected.output, `${code} ${expected.id} engine invariant`);
  }
  const standard = expectedCases.find(item => item.id === 'permanent-standard');
  const casual = expectedCases.find(item => item.id === 'casual-standard');
  oracles[code] = {
    currency: standard.output.currency,
    permanent: {
      input: standard.input,
      grossForDeductions: standard.output.grossForDeductions,
      totalDeductions: standard.output.totalDeductions,
      netPay: standard.output.netPay,
      totalEmployerCost: standard.output.totalEmployerCost,
      farmMonthlyCost: standard.output.farmMonthlyCost,
      farmAnnualCost: standard.output.farmAnnualCost,
      minimumWageCheck: standard.output.mwCheck,
    },
    casual: {
      input: casual.input,
      grossForDeductions: casual.output.grossForDeductions,
      netPay: casual.output.netPay,
      farmMonthlyCost: casual.output.farmMonthlyCost,
      minimumWageCheck: casual.output.mwCheck,
    },
  };
}

const report = { family: 'farm-payroll', rows: 55, countryOracles: 54, oracles };
if (process.env.FR_AGRI_ORACLE_OUTPUT) {
  fs.writeFileSync(path.resolve(process.env.FR_AGRI_ORACLE_OUTPUT), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}
console.log(JSON.stringify({ family: report.family, rows: report.rows, countryOracles: report.countryOracles }, null, 2));
