"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "data/localization/fr-hr-payroll-parity.json"), "utf8"));
const fieldContracts = JSON.parse(fs.readFileSync(path.join(ROOT, "data/localization/fr-hr-payroll-field-contracts.json"), "utf8"));
const engine = require(path.join(ROOT, "assets/js/engines/fr-hr-payroll-parity.js"));
const expectedIds = [
  "contractor-vs-employee",
  "domestic-worker",
  "employee-cost",
  "gratuity-calculator",
  "maternity-leave",
  "retrenchment-calculator"
];

function base(overrides) {
  return Object.assign({
    jurisdiction: "Juridiction de test",
    currency: "TST",
    sourceLabel: "Source officielle synthétique",
    sourceDate: new Date().toISOString().slice(0, 10)
  }, overrides);
}

function parseAttributes(tag, element) {
  const attributes = {};
  for (const match of tag.matchAll(/([:\w-]+)(?:="([^"]*)"|='([^']*)'|=([^\s>]+))?/g)) {
    if (match[1].toLowerCase() === element) continue;
    attributes[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4] ?? true;
  }
  return attributes;
}

function controlsIn(html) {
  return Array.from(html.matchAll(/<(input|select|textarea)\b[^>]*>/gi)).map((match) => ({
    element: match[1].toLowerCase(),
    index: match.index,
    attributes: parseAttributes(match[0], match[1].toLowerCase())
  }));
}

function findControl(html, locator) {
  const control = controlsIn(html).find((entry) => entry.attributes[locator.by] === locator.value);
  assert.ok(control, `missing ${locator.by}=${locator.value}`);
  return control;
}

function optionValues(html, control, mode) {
  if (mode === "country-cards") {
    return Array.from(html.matchAll(/<a href="([^"]+)" class="hr-country-card">/g)).map((match) => match[1]);
  }
  const closing = html.indexOf("</select>", control.index);
  const block = html.slice(control.index, closing + "</select>".length);
  return Array.from(block.matchAll(/<option\b[^>]*value="([^"]*)"/gi)).map((match) => match[1]);
}

function selectedValue(html, control, mode) {
  if (mode === "country-cards") return optionValues(html, control, mode)[0];
  const closing = html.indexOf("</select>", control.index);
  const block = html.slice(control.index, closing + "</select>".length);
  const options = Array.from(block.matchAll(/<option\b([^>]*)value="([^"]*)"([^>]*)>/gi));
  const selected = options.find((match) => /\bselected\b/i.test(match[1] + match[3]));
  return (selected || options[0])?.[2];
}

test("manifest owns exactly the six canonical HR & Payroll apps", () => {
  assert.equal(manifest.tools.length, 6);
  assert.deepEqual(manifest.tools.map((tool) => tool.id), expectedIds);
  assert.equal(new Set(manifest.tools.map((tool) => tool.route)).size, 6);
  assert.equal(manifest.hubRoute, "/fr/hr-payroll/");
});

test("dedicated generator is current and limited to the hub plus six owners", () => {
  const result = spawnSync(process.execPath, ["scripts/build-french-hr-payroll-parity.js", "--check"], {
    cwd: ROOT, encoding: "utf8"
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /6\/6 apps plus hub/);
});

test("structured oracle matches all 77 English owner controls and generated French DOM contracts exactly", () => {
  assert.equal(fieldContracts.schemaVersion, 1);
  assert.deepEqual(fieldContracts.tools.map((tool) => tool.id), expectedIds);
  let mappedControls = 0;
  for (const toolContract of fieldContracts.tools) {
    const tool = manifest.tools.find((entry) => entry.id === toolContract.id);
    const englishHtml = fs.readFileSync(path.join(ROOT, toolContract.englishOwner), "utf8");
    const frenchHtml = fs.readFileSync(path.join(ROOT, tool.route.replace(/^\/|\/$/g, ""), "index.html"), "utf8");
    for (const contract of toolContract.controls) {
      const frenchControl = findControl(frenchHtml, { by: "name", value: contract.french });
      assert.equal(frenchControl.element, contract.element, `${tool.id}/${contract.french} French element`);
      assert.match(frenchHtml, new RegExp(`<label[^>]*for="${frenchControl.attributes.id}"[^>]*>[^<]+`), `${tool.id}/${contract.french} visible label`);
      for (const attribute of fieldContracts.attributes) {
        const expected = attribute === "required"
          ? Boolean(contract.required)
          : (Object.prototype.hasOwnProperty.call(contract, attribute) ? String(contract[attribute]) : undefined);
        const frenchActual = attribute === "required"
          ? Boolean(frenchControl.attributes.required)
          : (frenchControl.attributes[attribute] === undefined ? undefined : String(frenchControl.attributes[attribute]));
        assert.equal(frenchActual, expected, `${tool.id}/${contract.french} French ${attribute}`);
      }
      if (contract.extension) continue;
      mappedControls += 1;
      const englishControl = findControl(englishHtml, contract.english);
      assert.equal(englishControl.element, contract.element, `${tool.id}/${contract.french} English element`);
      for (const attribute of fieldContracts.attributes) {
        const expected = attribute === "required"
          ? Boolean(contract.required)
          : (Object.prototype.hasOwnProperty.call(contract, attribute) ? String(contract[attribute]) : undefined);
        const englishActual = attribute === "required"
          ? Boolean(englishControl.attributes.required)
          : (englishControl.attributes[attribute] === undefined ? undefined : String(englishControl.attributes[attribute]));
        assert.equal(englishActual, expected, `${tool.id}/${contract.french} English ${attribute}`);
      }
      if (contract.options) {
        const frenchValues = optionValues(frenchHtml, frenchControl, "inline");
        const englishValues = optionValues(englishHtml, englishControl, contract.options);
        assert.deepEqual(frenchValues, englishValues, `${tool.id}/${contract.french} selector values`);
        assert.equal(
          selectedValue(frenchHtml, frenchControl, "inline"),
          selectedValue(englishHtml, englishControl, contract.options),
          `${tool.id}/${contract.french} selector default`
        );
      }
    }
  }
  assert.equal(mappedControls, 77);
});

test("frozen arithmetic contracts produce the expected six results", () => {
  let result = engine.calculate("contractor-vs-employee", base({
    employeeBase: 1000, employeeAddons: 200, employeeOther: 50, contractorQuote: 1400, contractorOther: 0
  }));
  assert.equal(result.valid, true);
  assert.deepEqual(result.values, {
    employeeMonthly: 1250, contractorMonthly: 1400, employeeAnnual: 15000, contractorAnnual: 16800, difference: 150
  });

  result = engine.calculate("domestic-worker", base({
    country: "senegal", role: "live-out-housekeeper", basePay: 1000, payPeriod: "monthly",
    legalFloor: 900, floorPeriod: "monthly", hoursPerWeek: 40, daysPerWeek: 5, overtimeHours: 0,
    overtimeMultiplier: 1.5, allowances: 100, inKind: 50, employerPct: 5, leavePct: 4,
    adminCost: 20, annualBonus: 600, setupCost: 0, retentionBuffer: 10,
    contractStatus: "draft", payRecord: "yes", restDays: "partial", notes: "Hypothèse synthétique"
  }));
  assert.equal(result.valid, true);
  assert.equal(result.values.baseMonthly, 1000);
  assert.equal(result.values.floorMonthly, 900);
  assert.equal(result.values.monthlyCost, 1319);
  assert.equal(result.values.annualCost, 15828);
  assert.equal(result.values.retentionMonthly, 1450.9);
  assert.equal(result.values.readiness, 87);
  assert.equal(result.workflow.scenarios.length, 2);
  assert.match(result.workflow.details.flat().join(" "), /Sénégal|Hypothèse synthétique/);
  assert.ok(result.workflow.checklist.length >= 3);

  result = engine.calculate("employee-cost", base({
    salary: 1000, obligations: 100, benefits: 50, allowances: 100, other: 50, oneOff: 0, allocationMonths: 12
  }));
  assert.equal(result.valid, true);
  assert.equal(result.values.recurring, 1300);
  assert.equal(result.values.firstYear, 15600);

  result = engine.calculate("gratuity-calculator", base({
    monthlyPay: 3000, years: 5, months: 6, daysPerYear: 15, divisor: 30, additions: 500, deductions: 250
  }));
  assert.equal(result.valid, true);
  assert.equal(result.values.core, 8250);
  assert.equal(result.values.net, 8500);

  result = engine.calculate("maternity-leave", base({
    country: "/tools/maternity-leave/senegal/", countryLabel: "Sénégal",
    leaveType: "both", compareCountry: "/tools/maternity-leave/cote-divoire/", compareCountryLabel: "Côte d'Ivoire",
    leaveNotes: "Complément à confirmer",
    monthlySalary: 3043.75, startDate: "2026-08-01", officialDays: 90, requestedDays: 100,
    officialRate: 80, companyDays: 112, companyRate: 100
  }));
  assert.equal(result.valid, true);
  assert.equal(result.values.officialValue, 7200);
  assert.equal(result.values.requestedValue, 8000);
  assert.equal(result.values.companyValue, 11200);
  assert.equal(result.values.requestedEnd, "2026-11-08");
  assert.match(result.workflow.details.flat().join(" "), /Sénégal|Côte d'Ivoire|Comparer les deux|Complément à confirmer/);
  assert.equal(result.workflow.scenarios.length, 3);

  result = engine.calculate("retrenchment-calculator", base({
    monthlyPay: 7800, years: 7, months: 4, weeksPerYear: 1, noticeMonths: 1,
    leaveDays: 10, divisor: 39, other: 1000, deductions: 500
  }));
  assert.equal(result.valid, true);
  assert.equal(result.values.severance, 13200);
  assert.equal(result.values.gross, 24000);
  assert.equal(result.values.net, 23500);
});

test("invalid, future-source, and impossible deduction states are explicit", () => {
  assert.equal(engine.calculate("employee-cost", base({ salary: 0, allocationMonths: 0 })).valid, false);
  assert.match(engine.calculate("contractor-vs-employee", base({
    employeeBase: 1, contractorQuote: 1, sourceDate: "2999-01-01"
  })).errors.join(" "), /future/);
  assert.match(engine.calculate("gratuity-calculator", base({
    monthlyPay: 100, years: 1, months: 0, daysPerYear: 1, divisor: 30, additions: 0, deductions: 999
  })).errors.join(" "), /déductions/);
  assert.equal(engine.calculate("maternity-leave", base({
    country: "/tools/maternity-leave/senegal/", countryLabel: "Sénégal",
    leaveType: "maternity", compareCountry: "/tools/maternity-leave/cote-divoire/", compareCountryLabel: "Côte d'Ivoire",
    monthlySalary: 1000, startDate: "", officialDays: 90, requestedDays: 90,
    officialRate: 100, companyDays: 90, companyRate: 100
  })).valid, false);
});

test("French invalid states are bound to the real English owner controls", () => {
  const domesticOwner = fs.readFileSync(path.join(ROOT, "tools/domestic-worker/index.html"), "utf8");
  const gratuityOwner = fs.readFileSync(path.join(ROOT, "tools/gratuity-calculator/index.html"), "utf8");
  const retrenchmentOwner = fs.readFileSync(path.join(ROOT, "tools/retrenchment-calculator/verified-planner.js"), "utf8");
  assert.match(domesticOwner, /name="overtimeHours"[^>]*max="160"/);
  assert.match(domesticOwner, /name="employerContribution"[^>]*max="40"/);
  assert.match(domesticOwner, /name="leaveReserve"[^>]*max="30"/);
  assert.match(gratuityOwner, /daysPerYear\s*<=\s*0/);
  assert.match(gratuityOwner, /serviceYears\s*<=\s*0/);
  assert.match(retrenchmentOwner, /serviceYears\s*<=\s*0/);

  const domesticInput = {
    country: "senegal", role: "nanny", basePay: 1000, payPeriod: "monthly", legalFloor: 900,
    floorPeriod: "monthly", hoursPerWeek: 40, daysPerWeek: 5, overtimeHours: 0,
    overtimeMultiplier: 1.5, allowances: 0, inKind: 0, employerPct: 0, leavePct: 0,
    adminCost: 0, annualBonus: 0, setupCost: 0, retentionBuffer: 0,
    contractStatus: "yes", payRecord: "yes", restDays: "yes"
  };
  for (const [field, value] of [["overtimeHours", 161], ["employerPct", 41], ["leavePct", 31]]) {
    assert.equal(engine.calculate("domestic-worker", base({ ...domesticInput, [field]: value })).valid, false, field);
  }
  assert.equal(engine.calculate("gratuity-calculator", base({
    monthlyPay: 1000, years: 0, months: 0, daysPerYear: 15, divisor: 30, additions: 0, deductions: 0
  })).valid, false);
  assert.equal(engine.calculate("gratuity-calculator", base({
    monthlyPay: 1000, years: 1, months: 0, daysPerYear: 0, divisor: 30, additions: 0, deductions: 0
  })).valid, false);
  assert.equal(engine.calculate("retrenchment-calculator", base({
    monthlyPay: 1000, years: 0, months: 0, weeksPerYear: 1, noticeMonths: 0,
    leaveDays: 0, divisor: 30, other: 0, deductions: 0
  })).valid, false);
});

test("expanded French forms preserve the English workflow controls and export surface", () => {
  const domestic = manifest.tools.find((tool) => tool.id === "domestic-worker");
  const maternity = manifest.tools.find((tool) => tool.id === "maternity-leave");
  const domesticNames = domestic.fields.map((field) => field[0]);
  const maternityNames = maternity.fields.map((field) => field[0]);
  for (const name of [
    "country", "role", "legalFloor", "floorPeriod", "retentionBuffer", "contractStatus",
    "payRecord", "restDays", "notes"
  ]) assert.ok(domesticNames.includes(name), name);
  for (const name of ["country", "leaveType", "compareCountry", "leaveNotes"]) {
    assert.ok(maternityNames.includes(name), name);
  }
  for (const tool of [domestic, maternity]) {
    const html = fs.readFileSync(path.join(ROOT, tool.route.replace(/^\/|\/$/g, ""), "index.html"), "utf8");
    assert.match(html, /id="fr-hr-payroll-workflow"/);
    assert.match(html, /data-export="txt"/);
    assert.match(html, /data-export="json"/);
    assert.match(html, /data-export="pdf"/);
  }
});

test("each native page has complete French SEO, GEO, privacy, export, and artwork contracts", () => {
  for (const tool of manifest.tools) {
    const file = path.join(ROOT, tool.route.replace(/^\/|\/$/g, ""), "index.html");
    const html = fs.readFileSync(file, "utf8");
    assert.match(html, /<html\b[^>]*\blang="fr"/);
    assert.match(html, new RegExp(`<link rel="canonical" href="https://afrotools.com${tool.route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}">`));
    assert.match(html, new RegExp(`hreflang="en" href="https://afrotools.com${tool.englishRoute.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
    assert.match(html, /hreflang="fr"/);
    assert.match(html, /hreflang="x-default"/);
    assert.match(html, /og:image/);
    assert.match(html, /twitter:image/);
    assert.match(html, /"@type":"SoftwareApplication"/);
    assert.match(html, /"inLanguage":"fr"/);
    assert.match(html, /data-consent-mode="browser_local_only"/);
    assert.match(html, /Toute future aide IA exigerait un consentement explicite/);
    assert.match(html, /window\.AfroDisableAssistant = true/);
    assert.match(html, /Enregistrer JSON/);
    assert.match(html, /Rouvrir un JSON/);
    assert.match(html, /Télécharger PDF/);
    assert.match(html, /Source officielle ou professionnelle consultée/);
    assert.doesNotMatch(html, /<iframe|source-launch|action="https?:|\/api\/ai-advisor/i);
    assert.equal(fs.existsSync(path.join(ROOT, tool.image.replace(/^\//, ""))), true, tool.image);
  }
});

test("hub, registry, and deterministic French route map agree on all six owners", () => {
  const hub = fs.readFileSync(path.join(ROOT, "fr/hr-payroll/index.html"), "utf8");
  const registry = fs.readFileSync(path.join(ROOT, "assets/js/components/tool-registry.js"), "utf8");
  const routeMap = fs.readFileSync(path.join(ROOT, "assets/js/ai/french-route-map.generated.js"), "utf8");
  const intentEval = JSON.parse(fs.readFileSync(path.join(ROOT, "data/ai/french-intent-eval.json"), "utf8"));
  assert.equal((hub.match(/class="fr-hr-tool-card"/g) || []).length, 6);
  assert.match(hub, /window\.AfroDisableAssistant = true/);
  for (const tool of manifest.tools) {
    assert.match(hub, new RegExp(`href="${tool.route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`));
    assert.match(registry, new RegExp(`href: ['"]${tool.route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}['"]`));
    assert.match(routeMap, new RegExp(`"${tool.englishRoute.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}":"${tool.route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`));
    assert.equal(intentEval.cases.some((entry) => entry.expectedToolId === tool.id && entry.expectedRoute === tool.route + "?source=ask"), true);
  }
});

test("French runtime never persists, logs, URL-encodes, or sends HR inputs", () => {
  const runtime = fs.readFileSync(path.join(ROOT, "assets/js/pages/fr-hr-payroll-parity.js"), "utf8");
  assert.doesNotMatch(runtime, /\blocalStorage\b|\bsessionStorage\b|\bfetch\s*\(|XMLHttpRequest|sendBeacon|URLSearchParams|console\./);
  assert.doesNotMatch(runtime, /location\.(search|hash)|history\.(pushState|replaceState)/);
});
