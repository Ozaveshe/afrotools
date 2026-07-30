'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const CHECKED_AT = Date.parse('2026-07-28T00:00:00Z');
const DAY = 86400000;

function loadBrowserScript(relativePath) {
  const window = {
    AfroTools: {},
    location: { pathname: '/__test__' }
  };
  window.window = window;
  const document = {
    readyState: 'loading',
    addEventListener() {}
  };
  const context = vm.createContext({
    window,
    document,
    console,
    Intl,
    Date,
    Number,
    Math,
    Infinity
  });
  vm.runInContext(
    fs.readFileSync(path.join(ROOT, relativePath), 'utf8'),
    context,
    { filename: relativePath }
  );
  return window.AfroTools;
}

function assertNear(actual, expected, label, tolerance = 0.02) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `${label}: expected ${expected}, received ${actual}`
  );
}

test('French PAYE shared calculator matches English owner engines for shared fixtures', () => {
  const french = loadBrowserScript('assets/js/pages/french-paye-parity.js').frenchPayeParity;
  const egypt = loadBrowserScript('assets/js/engines/eg-paye.js').engines.egPAYE;
  const southAfrica = loadBrowserScript('assets/js/engines/za-paye.js').engines.zaPAYE;
  const tanzania = loadBrowserScript('assets/js/engines/tz-paye.js').engines.tzPAYE;

  const egGrossMonthly = 50000;
  const egFrench = french.calculate(french.configs['eg-paye'], egGrossMonthly);
  const egOwner = egypt.calculate(egGrossMonthly * 12, { nosi: true });
  assertNear(egFrench.employeeMonthly, egOwner.nosi / 12, 'Egypt employee contribution');
  assertNear(egFrench.taxMonthly, egOwner.tax / 12, 'Egypt PAYE');
  assertNear(egFrench.netMonthly, egOwner.netAnnual / 12, 'Egypt net salary');
  assertNear(egFrench.employerMonthly, egOwner.employerNOSI / 12, 'Egypt employer contribution');

  const zaGrossMonthly = 60000;
  const zaFrench = french.calculate(french.configs['za-paye'], zaGrossMonthly);
  const zaOwner = southAfrica.calculate(zaGrossMonthly * 12, {
    ageGroup: 'under65',
    retirement: 0,
    medMembers: 0,
    uif: true
  });
  assertNear(zaFrench.employeeMonthly, zaOwner.uif / 12, 'South Africa UIF employee');
  assertNear(zaFrench.taxMonthly, zaOwner.paye / 12, 'South Africa PAYE');
  assertNear(zaFrench.netMonthly, zaOwner.netAnnual / 12, 'South Africa net salary');
  assertNear(zaFrench.employerMonthly, zaOwner.employerUIF / 12, 'South Africa UIF employer');

  const tzGrossMonthly = 1500000;
  const tzFrench = french.calculate(french.configs['tz-paye'], tzGrossMonthly);
  const tzOwner = tanzania.calculate(tzGrossMonthly, {
    sector: 'private',
    nssf: true,
    secondary: false
  });
  assertNear(tzFrench.employeeMonthly, tzOwner.socialEmployee, 'Tanzania NSSF employee');
  assertNear(tzFrench.taxMonthly, tzOwner.paye, 'Tanzania PAYE');
  assertNear(tzFrench.netMonthly, tzOwner.net, 'Tanzania net salary');
  assertNear(tzFrench.employerMonthly, tzOwner.socialEmployer, 'Tanzania NSSF employer');
});

test('French PAYE configs remain fresh and produce finite nonnegative result fields', () => {
  const french = loadBrowserScript('assets/js/pages/french-paye-parity.js').frenchPayeParity;
  const resultFields = [
    'grossMonthly',
    'grossAnnual',
    'employeeMonthly',
    'employerMonthly',
    'taxableMonthly',
    'taxMonthly',
    'stampMonthly',
    'deductionsMonthly',
    'netMonthly',
    'employerCostMonthly',
    'effectiveRate'
  ];

  for (const [id, config] of Object.entries(french.configs)) {
    const checkedAt = Date.parse(`${config.checkedOn}T00:00:00Z`);
    assert.ok(Number.isFinite(checkedAt), `${id} has a valid checked date`);
    const ageDays = Math.floor((CHECKED_AT - checkedAt) / DAY);
    assert.ok(ageDays >= 0 && ageDays <= 366, `${id} checked date is within 366 days`);

    const result = french.calculate(config, 500000);
    for (const field of resultFields) {
      assert.ok(Number.isFinite(result[field]), `${id}.${field} is finite`);
      assert.ok(result[field] >= 0, `${id}.${field} is nonnegative`);
    }
  }
});
