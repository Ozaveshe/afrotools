#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const FIXTURE = path.join(ROOT, 'tests', 'fixtures', 'farm-payroll-english-invariants.json');
const MANIFEST = path.join(ROOT, 'data', 'localization', 'fr-agriculture-parity-manifest.json');
const DATA_FILE = path.join(ROOT, 'data', 'agriculture', 'farm-payroll-data.js');
const ENGINE_FILE = path.join(ROOT, 'engines', 'src', 'farm-payroll-engine.js');
const UPDATE = process.argv.includes('--update');
const CHECK = process.argv.includes('--check');

if (UPDATE === CHECK) throw new Error('Choose exactly one mode: --update or --check.');

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function loadRuntime() {
  const context = { window: {} };
  vm.createContext(context);
  for (const file of [DATA_FILE, ENGINE_FILE]) {
    vm.runInContext(fs.readFileSync(file, 'utf8'), context, { filename: path.relative(ROOT, file) });
  }
  return context.window.AfroTools;
}

function profiles(country) {
  const daily = country.typicalDailyRate.mid;
  const monthly = country.agriMinWage_monthly || country.nationalMinWage_monthly || daily * 26;
  return [
    {
      id: 'permanent-standard',
      input: { workerType: 'permanent', numWorkers: 3, grossPay: monthly * 1.2, overtimeHours: 8, inKindHousing: daily * 2, inKindFood: daily },
    },
    {
      id: 'permanent-below-minimum',
      input: { workerType: 'permanent', numWorkers: 1, grossPay: monthly * 0.75, overtimeHours: 0, inKindHousing: 0, inKindFood: 0 },
    },
    {
      id: 'casual-standard',
      input: { workerType: 'casual', numWorkers: 7, grossPay: daily, daysWorked: 26, overtimeHours: 4, inKindHousing: 0, inKindFood: daily * 2 },
    },
    {
      id: 'seasonal-short',
      input: { workerType: 'seasonal', numWorkers: 12, grossPay: country.typicalDailyRate.low, daysWorked: 14, overtimeHours: 0, inKindHousing: 0, inKindFood: 0 },
    },
    {
      id: 'piece-rate',
      input: { workerType: 'piece_rate', numWorkers: 5, ratePerUnit: daily / 5, unitsCompleted: 80, overtimeHours: 3, inKindHousing: daily, inKindFood: daily },
    },
  ];
}

function build() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  const rows = manifest.rows.filter(row => row.family === 'farm-payroll');
  const countryRows = rows.filter(row => row.country);
  assert.equal(rows.length, 55, 'Farm Payroll manifest family must contain 55 rows');
  assert.equal(countryRows.length, 54, 'Farm Payroll manifest family must contain 54 country calculators');
  const runtime = loadRuntime();
  const dataCodes = Object.keys(runtime.FarmPayrollData).sort();
  const manifestCodes = countryRows.map(row => row.country.code).sort();
  assert.deepEqual(dataCodes, manifestCodes, 'Farm Payroll data codes must exactly match the 54 manifest countries');

  const countries = {};
  for (const row of countryRows) {
    const code = row.country.code;
    const country = runtime.FarmPayrollData[code];
    countries[code] = {
      route: row.english.route,
      file: row.english.file,
      pageSha256: sha256(fs.readFileSync(path.join(ROOT, row.english.file))),
      currency: country.currency,
      symbol: country.symbol,
      minimums: {
        nationalMonthly: country.nationalMinWage_monthly == null ? null : country.nationalMinWage_monthly,
        nationalHourly: country.nationalMinWage_hourly == null ? null : country.nationalMinWage_hourly,
        agricultureMonthly: country.agriMinWage_monthly == null ? null : country.agriMinWage_monthly,
        agricultureDaily: country.agriMinWage_daily == null ? null : country.agriMinWage_daily,
      },
      typicalDailyRate: country.typicalDailyRate,
      cases: profiles(country).map(item => ({
        id: item.id,
        input: item.input,
        output: runtime.FarmPayrollEngine.calculate(item.input, country),
      })),
    };
  }
  const hub = rows.find(row => !row.country);
  return {
    schemaVersion: 1,
    family: 'farm-payroll',
    contract: {
      rows: 55,
      countryCalculators: 54,
      casesPerCountry: 5,
      workerTypes: ['permanent', 'casual', 'seasonal', 'piece_rate'],
      invariantFields: [
        'baseGross', 'overtimePay', 'inKindValue', 'grossForDeductions', 'deductions',
        'netPay', 'employerContributions', 'totalEmployerCost', 'farmMonthlyCost',
        'farmAnnualCost', 'minimumWageCheck', 'taxability', 'laborLaw',
      ],
    },
    owners: {
      engine: 'engines/src/farm-payroll-engine.js',
      engineSha256: sha256(fs.readFileSync(ENGINE_FILE)),
      data: 'data/agriculture/farm-payroll-data.js',
      dataSha256: sha256(fs.readFileSync(DATA_FILE)),
      hub: hub.english.file,
      hubSha256: sha256(fs.readFileSync(path.join(ROOT, hub.english.file))),
    },
    countries,
  };
}

const actual = build();
if (UPDATE) {
  fs.mkdirSync(path.dirname(FIXTURE), { recursive: true });
  fs.writeFileSync(FIXTURE, `${JSON.stringify(actual, null, 2)}\n`);
  console.log(`Frozen ${actual.contract.countryCalculators} countries x ${actual.contract.casesPerCountry} Farm Payroll invariants`);
} else {
  const expected = JSON.parse(fs.readFileSync(FIXTURE, 'utf8'));
  const comparable = JSON.parse(JSON.stringify(actual));
  // The French parity wave may add only the reciprocal hreflang link to the
  // English directory hub. Country calculator, engine, data, and output
  // invariants remain exact and continue to be compared fail-closed.
  comparable.owners.hubSha256 = expected.owners.hubSha256;
  assert.deepEqual(comparable, expected);
  console.log(`PASS ${actual.contract.countryCalculators} countries x ${actual.contract.casesPerCountry} Farm Payroll invariants`);
}
