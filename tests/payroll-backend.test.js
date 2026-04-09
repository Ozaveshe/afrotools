#!/usr/bin/env node
"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");

function loadFrontendEngine(file, key) {
  const helperSource = fs.readFileSync(path.join(ROOT, "assets", "js", "lib", "ke-payroll.js"), "utf8");
  const source = fs.readFileSync(path.join(ROOT, file), "utf8");
  const afroTools = { engines: {} };
  const sandbox = {
    window: { AfroTools: afroTools },
    AfroTools: afroTools,
    module: { exports: {} },
    exports: {},
    Math,
    isNaN,
    isFinite,
    parseInt,
    parseFloat,
    Infinity,
    console
  };

  vm.runInNewContext(helperSource, sandbox, { filename: "assets/js/lib/ke-payroll.js" });
  vm.runInNewContext(source, sandbox, { filename: file });
  return sandbox.window.AfroTools.engines[key];
}

function loadPayslipEngine() {
  const helperSource = fs.readFileSync(path.join(ROOT, "assets", "js", "lib", "ke-payroll.js"), "utf8");
  const source = fs.readFileSync(path.join(ROOT, "engines", "payslip-engine.js"), "utf8");
  const overrideSource = fs.readFileSync(path.join(ROOT, "assets", "js", "lib", "payroll-tool-overrides.js"), "utf8");
  const afroTools = {};
  const sandbox = {
    window: { AfroTools: afroTools },
    AfroTools: afroTools,
    module: { exports: {} },
    exports: {},
    Math,
    isNaN,
    isFinite,
    parseInt,
    parseFloat,
    Infinity,
    console
  };

  vm.runInNewContext(helperSource, sandbox, { filename: "assets/js/lib/ke-payroll.js" });
  vm.runInNewContext(source, sandbox, { filename: "engines/payslip-engine.js" });
  vm.runInNewContext(overrideSource, sandbox, { filename: "assets/js/lib/payroll-tool-overrides.js" });
  return sandbox.window.AfroTools.PayslipEngine;
}

function loadStaffCostEngine() {
  const helperSource = fs.readFileSync(path.join(ROOT, "assets", "js", "lib", "ke-payroll.js"), "utf8");
  const source = fs.readFileSync(path.join(ROOT, "engines", "staff-cost-engine.js"), "utf8");
  const overrideSource = fs.readFileSync(path.join(ROOT, "assets", "js", "lib", "payroll-tool-overrides.js"), "utf8");
  const afroTools = {};
  const sandbox = {
    window: { AfroTools: afroTools },
    AfroTools: afroTools,
    module: { exports: {} },
    exports: {},
    Math,
    isNaN,
    isFinite,
    parseInt,
    parseFloat,
    Infinity,
    console
  };

  vm.runInNewContext(helperSource, sandbox, { filename: "assets/js/lib/ke-payroll.js" });
  vm.runInNewContext(source, sandbox, { filename: "engines/staff-cost-engine.js" });
  sandbox.window.StaffCostEngine = sandbox.StaffCostEngine;
  vm.runInNewContext(overrideSource, sandbox, { filename: "assets/js/lib/payroll-tool-overrides.js" });
  return sandbox.window.StaffCostEngine || sandbox.StaffCostEngine;
}

function loadHREngine() {
  const ratesSource = fs.readFileSync(path.join(ROOT, "data", "hr", "social-security-rates.js"), "utf8");
  const overtimeSource = fs.readFileSync(path.join(ROOT, "data", "hr", "overtime-rules.js"), "utf8");
  const engineSource = fs.readFileSync(path.join(ROOT, "engines", "hr-engine.js"), "utf8");
  const afroTools = {};
  const sandbox = {
    window: { AfroTools: afroTools },
    AfroTools: afroTools,
    module: { exports: {} },
    exports: {},
    Math,
    isNaN,
    isFinite,
    parseInt,
    parseFloat,
    Infinity,
    console
  };

  vm.runInNewContext(ratesSource, sandbox, { filename: "data/hr/social-security-rates.js" });
  vm.runInNewContext(overtimeSource, sandbox, { filename: "data/hr/overtime-rules.js" });
  vm.runInNewContext(engineSource, sandbox, { filename: "engines/hr-engine.js" });
  return sandbox.window.AfroTools.HREngine;
}

function loadWindowEngine(file, globalKey) {
  const source = fs.readFileSync(path.join(ROOT, file), "utf8");
  const sandbox = {
    window: {},
    module: { exports: {} },
    exports: {},
    Math,
    isNaN,
    isFinite,
    parseInt,
    parseFloat,
    Infinity,
    console
  };

  vm.runInNewContext(source, sandbox, { filename: file });
  return sandbox.window[globalKey];
}

function test(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    console.error(error.stack || error.message);
    process.exitCode = 1;
  }
}

const keFrontend = loadFrontendEngine("assets/js/engines/ke-paye.js", "kePAYE");
const keBackend = require(path.join(ROOT, "netlify", "functions", "_engines", "ke-paye.js"));
const ngBackend = require(path.join(ROOT, "netlify", "functions", "_engines", "ng-paye.js"));
const payslipEngine = loadPayslipEngine();
const staffCostEngine = loadStaffCostEngine();
const hrEngine = loadHREngine();
const ghSsnitEngine = loadWindowEngine("engines/gh-ssnit-engine.js", "SSNITEngine");
const minWageEngine = loadWindowEngine("engines/minimum-wage-engine.js", "AfroTools").MinWageEngine;
const kePayroll = require(path.join(ROOT, "assets", "js", "lib", "ke-payroll.js"));
const { normalizeTaxOptions, resolveAnnualSalaryInputs } = require(path.join(
  ROOT,
  "netlify",
  "functions",
  "_shared",
  "tax-request.js"
));

test("Kenya frontend PAYE deducts AHL from chargeable pay", () => {
  const result = keFrontend.calculate(100000, {
    nssf: true,
    shif: true,
    ahl: true,
    personalRelief: true
  });

  assert(Math.abs(result.nssf - 6000) < 1, `expected NSSF 6000, got ${result.nssf}`);
  assert(Math.abs(result.taxable - 89750) < 1, `expected taxable 89750, got ${result.taxable}`);
  assert(Math.abs(result.paye - 19307.5) < 1, `expected PAYE 19307.5, got ${result.paye}`);
});

test("Kenya backend PAYE deducts AHL from chargeable pay", () => {
  const result = keBackend.calculate({
    grossAnnual: 1200000,
    nssf: true,
    shif: true,
    ahl: true,
    personalRelief: true
  });

  assert.strictEqual(result.deductions.nssf, 72000);
  assert.strictEqual(result.tax.taxableIncome, 1077000);
  assert.strictEqual(result.tax.netTax, 231700.2);
});

test("Payslip engine Kenya PAYE deducts SHIF and AHL", () => {
  const payslip = payslipEngine.calculate({
    country: "KE",
    basic: 80000,
    housing: 20000,
    transport: 0
  });

  const paye = payslip.deductions.find((item) => item.name === "PAYE Tax");
  assert(paye, "expected PAYE deduction to exist");
  assert(Math.abs(paye.amount - 19308.35) < 1, `expected PAYE 19308.35, got ${paye.amount}`);
});

test("Kenya payroll helper uses Year 4 NSSF caps and employee-only SHIF", () => {
  const burden = kePayroll.calculateStatutoryBurden(150000, "new");

  assert.strictEqual(burden.employee.nssf, 6480);
  assert.strictEqual(burden.employee.shif, 4125);
  assert.strictEqual(burden.employer.shif, 0);
  assert.strictEqual(burden.employer.total, 8730);
});

test("Staff cost Kenya override uses shared payroll rules", () => {
  const result = staffCostEngine.calcCustom("KE", 100000, 0, 0, 0);
  const payeRow = result.rows.find((row) => row.item === "PAYE Tax");

  assert(payeRow, "expected PAYE row to exist");
  assert.strictEqual(result.employerCosts, 7500);
  assert(Math.abs(payeRow.amount - 19308.35) < 1, `expected PAYE 19308.35, got ${payeRow.amount}`);
});

test("Payslip engine Ghana uses capped SSNIT and employee-only deduction", () => {
  const payslip = payslipEngine.calculate({
    country: "GH",
    basic: 100000,
    housing: 0,
    transport: 0
  });

  const ssnit = payslip.deductions.find((item) => item.name.indexOf("SSNIT") !== -1);
  assert(ssnit, "expected Ghana SSNIT deduction");
  assert.strictEqual(ssnit.amount, 3795);
});

test("Staff cost Ghana override uses 13% employer burden on capped basic", () => {
  const result = staffCostEngine.calcCustom("GH", 100000, 100000, 0, 0);
  assert.strictEqual(result.employerCosts, 8970);
});

test("Payslip engine South Africa uses 2027 SARS rebate", () => {
  const payslip = payslipEngine.calculate({
    country: "ZA",
    basic: 50000,
    housing: 0,
    transport: 0
  });

  const paye = payslip.deductions.find((item) => item.name === "PAYE Tax");
  assert(paye, "expected South Africa PAYE deduction");
  assert(Math.abs(paye.amount - 11075.58) < 1, `expected PAYE 11075.58, got ${paye.amount}`);
});

test("HR engine normalizes holiday overtime to public holiday rate", () => {
  const result = hrEngine.calculateOvertime({
    country: "GH",
    monthlySalary: 10000,
    overtimeHours: 2,
    dayType: "holiday"
  });

  assert.strictEqual(result.otMultiplier, 2.5);
});

test("HR engine Kenya social security respects Tier II offset", () => {
  const result = hrEngine.calculateSocialSecurity("KE", 150000);
  const tier1 = result.breakdown.find((item) => item.name.indexOf("Tier I") !== -1);
  const tier2 = result.breakdown.find((item) => item.name.indexOf("Tier II") !== -1);

  assert(tier1, "expected Kenya Tier I scheme");
  assert(tier2, "expected Kenya Tier II scheme");
  assert.strictEqual(Math.round(tier1.employeeAmount), 540);
  assert.strictEqual(Math.round(tier2.employeeAmount), 5940);
});

test("HR engine Ghana social security uses 2026 cap and 13% employer total", () => {
  const result = hrEngine.calculateSocialSecurity("GH", 100000);

  assert.strictEqual(Math.round(result.totalEmployee), 3795);
  assert.strictEqual(Math.round(result.totalEmployer), 8970);
});

test("Ghana SSNIT engine caps insurable earnings at GHS 69,000", () => {
  const result = ghSsnitEngine.calcContributions(100000, 0);

  assert.strictEqual(result.t1Emp, 3795);
  assert.strictEqual(result.totalEmployer, 8970);
});

test("Minimum wage engine returns South Africa 2026 rate", () => {
  const country = minWageEngine.getCountry("ZA");
  const sectors = minWageEngine.getStateRates("ZA");

  assert.strictEqual(country.hourly, 30.23);
  assert.strictEqual(country.effectiveDate, "March 2026");
  assert.strictEqual(sectors[0].rate, 30.23);
  assert.strictEqual(sectors[3].rate, 16.62);
});

test("Tax request helper accepts one salary input and annualises monthly values", () => {
  const result = resolveAnnualSalaryInputs({ grossMonthly: "100000" });
  assert.deepStrictEqual(result, {
    field: "grossMonthly",
    mode: "gross",
    annualAmount: 1200000
  });
});

test("Tax request helper rejects ambiguous salary inputs", () => {
  assert.throws(
    () => resolveAnnualSalaryInputs({ grossAnnual: 1000, netAnnual: 900 }),
    /Provide exactly one/
  );
});

test("Nigeria backend accepts lowercase regime aliases", () => {
  const normalized = normalizeTaxOptions("ng", { regime: "nta" });
  assert.strictEqual(normalized.regime, "NTA_2026");

  const result = ngBackend.calculate({
    grossAnnual: 5000000,
    regime: "pita",
    pension: true,
    nhf: false
  });

  assert.strictEqual(result.meta.regime, "PITA_2025");
});

if (!process.exitCode) {
  console.log("All payroll backend checks passed.");
}
