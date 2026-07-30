'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const manifest = require('../data/localization/fr-agriculture-parity-manifest.json');
const aiRouteMap = require('../assets/js/ai/french-route-map.generated.js');
const { ROOT, assertNativeFrenchOutput } = require('../scripts/lib/fr-agriculture-parity-manifest');

function runtime() {
  const context = { window: {} };
  vm.createContext(context);
  for (const file of ['data/agriculture/agri-loans-data.js', 'engines/src/farm-loan-engine.js']) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), 'utf8'), context, { filename: file });
  }
  return {
    data: context.window.AfroTools.AgriLoansData,
    engine: context.window.AfroTools.FarmLoanEngine,
  };
}

const rows = manifest.rows.filter(row => row.family === 'farm-loans');
const countries = rows.filter(row => row.country);
const hub = rows.find(row => !row.country);
const { data, engine } = runtime();
const oracles = {};

assert.equal(rows.length, 16);
assert.equal(countries.length, 15);
assertNativeFrenchOutput(manifest, rows.map(row => row.french.route));
assert.equal((fs.readFileSync(path.join(ROOT, hub.french.file), 'utf8').match(/<li><a href="\/fr\/agriculture\/farm-loans\//g) || []).length, 15);

for (const row of countries) {
  const code = row.country.code;
  const html = fs.readFileSync(path.join(ROOT, row.french.file), 'utf8');
  const english = fs.readFileSync(path.join(ROOT, row.english.file), 'utf8');
  assert.doesNotMatch(html, /<iframe\b/i);
  assert.match(html, /\/engines\/farm-loan-engine\.js/);
  assert.match(html, /\/data\/agriculture\/agri-loans-data\.js/);
  assert.match(html, /Exporter en PDF/);
  assert.match(html, /Exporter en CSV/);
  assert.match(html, /Exporter en JSON/);
  assert.match(html, /Exporter en TXT/);
  assert.ok(english.includes(`hreflang="fr" href="https://afrotools.com${row.french.route}"`));
  assert.equal(aiRouteMap.routes[row.english.routeKey], row.french.routeKey);
  assert.ok(data[code]);

  const profiles = {
    established: {
      age: 35, farmSize_ha: 4.5, isCoop: true, hasBankAccount: true,
      hasCollateral: true, requestedAmount: 500000, tenorMonths: 24,
    },
    constrained: {
      age: 17, farmSize_ha: 0.25, isCoop: false, hasBankAccount: false,
      hasCollateral: false, requestedAmount: 1000000000, tenorMonths: 12,
    },
  };
  const established = engine.evaluatePrograms(profiles.established, data[code]);
  const constrained = engine.evaluatePrograms(profiles.constrained, data[code]);
  assert.equal(established.length, data[code].programs.length);
  assert.equal(constrained.length, data[code].programs.length);
  assert.deepEqual(established.map(result => result.program.id).sort(), data[code].programs.map(program => program.id).sort());
  assert.ok(established.some(result => result.eligible));
  assert.ok(constrained.some(result => !result.eligible));
  for (const result of established) {
    if (result.repayment) {
      assert.ok(Number.isFinite(result.repayment.monthly));
      assert.ok(Number.isFinite(result.repayment.totalPayable));
      assert.ok(Number.isFinite(result.repayment.totalInterest));
    }
  }
  oracles[code] = {
    currency: data[code].currency,
    programCount: data[code].programs.length,
    established: {
      profile: profiles.established,
      order: established.map(result => result.program.id),
      eligible: established.filter(result => result.eligible).map(result => result.program.id),
      repayment: established.filter(result => result.repayment).map(result => ({
        id: result.program.id,
        rate: result.rate,
        monthly: result.repayment.monthly,
        totalPayable: result.repayment.totalPayable,
        totalInterest: result.repayment.totalInterest,
        loanUsed: result.repayment.loanUsed,
      })),
    },
    constrained: {
      profile: profiles.constrained,
      order: constrained.map(result => result.program.id),
      eligible: constrained.filter(result => result.eligible).map(result => result.program.id),
      blockerCounts: Object.fromEntries(constrained.map(result => [result.program.id, result.blockers.length])),
    },
  };
}

const report = { family: 'farm-loans', rows: 16, countryOracles: 15, oracles };
if (process.env.FR_AGRI_ORACLE_OUTPUT) {
  fs.writeFileSync(path.resolve(process.env.FR_AGRI_ORACLE_OUTPUT), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}
console.log(JSON.stringify({ family: report.family, rows: report.rows, countryOracles: report.countryOracles }, null, 2));
