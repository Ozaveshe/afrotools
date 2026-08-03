"use strict";

const assert = require("assert");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "data/localization/sw-hr-payroll-six-manifest.json"), "utf8"));
const inventory = JSON.parse(fs.readFileSync(path.join(ROOT, "reports/swahili-free-app-parity-inventory.json"), "utf8"));
const acceptance = JSON.parse(fs.readFileSync(path.join(ROOT, "data/audits/swahili-free-app-acceptance.json"), "utf8"));
const contracts = JSON.parse(fs.readFileSync(path.join(ROOT, "data/localization/fr-hr-payroll-field-contracts.json"), "utf8"));
const sw = require(path.join(ROOT, "assets/js/engines/sw-hr-payroll-six.js"));
const navbarVersion = crypto.createHash("md5").update(fs.readFileSync(path.join(ROOT, "assets/js/components/navbar.min.js"))).digest("hex").slice(0, 8);

function attrs(tag) {
  const output = {};
  for (const match of tag.matchAll(/([:\w-]+)(?:="([^"]*)"|='([^']*)'|=([^\s>]+))?/g)) output[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4] ?? true;
  return output;
}

function control(html, name) {
  const tags = Array.from(html.matchAll(/<(input|select|textarea)\b[^>]*>/gi));
  const found = tags.find((match) => attrs(match[0]).name === name);
  assert(found, `missing generated control ${name}`);
  return { element: found[1].toLowerCase(), attributes: attrs(found[0]) };
}

function visibleAndAccessibleText(html) {
  const attributes = Array.from(html.matchAll(/\b(?:aria-label|title|placeholder|alt)="([^"]*)"/gi)).map((match) => match[1]);
  const visible = html.replace(/<(script|style|template)\b[^>]*>[\s\S]*?<\/\1>/gi, " ").replace(/<[^>]+>/g, " ");
  return `${visible} ${attributes.join(" ")}`;
}

assert.strictEqual(manifest.rows.length, 6, "manifest must own exactly six rows");
const acceptedIds = new Set(acceptance.entries.filter((entry) => entry.status === "accepted").map((entry) => entry.englishId));
assert.deepStrictEqual(manifest.rows.filter((row) => acceptedIds.has(row.englishId)).map((row) => row.englishId).sort(), manifest.rows.map((row) => row.englishId).sort(), "manifest rows must all be coordinator accepted");
const inventoryRows = inventory.rows.filter((row) => row.categoryKey === "hr-payroll");
assert.deepStrictEqual(manifest.rows.map((row) => row.englishId).sort(), inventoryRows.map((row) => row.englishId).sort(), "manifest differs from authoritative HR & Payroll denominator");
assert(inventoryRows.every((row) => row.accepted === true), "an HR & Payroll inventory row is not coordinator accepted");

for (const row of manifest.rows) {
  const file = path.join(ROOT, row.swahiliFile);
  const html = fs.readFileSync(file, "utf8");
  assert(/<html\b[^>]*\blang="sw"/i.test(html), `${row.englishId}: lang must be sw`);
  assert(html.includes(`rel="canonical" href="https://afrotools.com${row.swahiliRoute}"`), `${row.englishId}: self canonical`);
  assert(html.includes(`hreflang="en" href="https://afrotools.com${row.englishRoute}"`), `${row.englishId}: English alternate`);
  assert(html.includes(`property="og:url" content="https://afrotools.com${row.swahiliRoute}"`), `${row.englishId}: OG URL`);
  assert(html.includes(`/assets/img/tools/${row.englishId}.webp`), `${row.englishId}: owned artwork`);
  assert(!/\b(Calculate|Download|Reset|Source used|Confidence|Planning estimate|browser|server|data|export|filing)\b/i.test(visibleAndAccessibleText(html)), `${row.englishId}: visible or accessibility English shell text`);
  assert(html.includes("data-consent-mode=\"browser_local_only\""), `${row.englishId}: local-only consent boundary`);
  assert(html.includes("window.AfroLocalOnly = true"), `${row.englishId}: explicit navbar/auth no-network flag`);
  assert(html.includes("window.AfroDisableAssistant = true"), `${row.englishId}: local-only AI surface disabled`);
  assert(html.includes('<meta name="afrotools-network-policy" content="local-only" data-source-owner="scripts/build-swahili-hr-payroll-six.js">'), `${row.englishId}: source-owned local-only network policy`);
  assert(html.includes(`/assets/js/components/navbar.min.js?v=${navbarVersion}`), `${row.englishId}: current navbar cache key`);
  const english = fs.readFileSync(path.join(ROOT, row.englishRoute.replace(/^\//, ""), "index.html"), "utf8");
  assert(english.includes(`hreflang="sw" href="https://afrotools.com${row.swahiliRoute}"`), `${row.englishId}: reciprocal English hreflang`);
  const contract = contracts.tools.find((tool) => tool.id === row.englishId);
  assert(contract, `${row.englishId}: English field contract`);
  for (const expected of contract.controls) {
    const actual = control(html, expected.french);
    assert.strictEqual(actual.element, expected.element, `${row.englishId}/${expected.french}: element`);
    for (const key of contracts.attributes) {
      if (key === "required") {
        const engineRequiredEvidence = row.englishId === "maternity-leave" && ["sourceLabel", "sourceDate"].includes(expected.french);
        assert.strictEqual(Boolean(actual.attributes.required), engineRequiredEvidence ? true : Boolean(expected.required), `${row.englishId}/${expected.french}: required`);
      }
      else if (Object.prototype.hasOwnProperty.call(expected, key)) assert.strictEqual(String(actual.attributes[key]), String(expected[key]), `${row.englishId}/${expected.french}: ${key}`);
      else assert.strictEqual(Object.prototype.hasOwnProperty.call(actual.attributes, key), false, `${row.englishId}/${expected.french}: unexpected ${key}`);
    }
  }
}

const maternityHtml = fs.readFileSync(path.join(ROOT, "sw/zana/kikokotoo-likizo-ya-uzazi/index.html"), "utf8");
assert.strictEqual(Boolean(control(maternityHtml, "sourceLabel").attributes.required), true, "maternity source label must match the fail-closed engine");
assert.strictEqual(Boolean(control(maternityHtml, "sourceDate").attributes.required), true, "maternity source date must match the fail-closed engine");

const hubHtml = fs.readFileSync(path.join(ROOT, "sw/mshahara-na-kodi/payroll/index.html"), "utf8");
for (const row of manifest.rows) {
  assert(hubHtml.includes(`"${row.englishId}"`), `${row.englishId}: hub configuration ownership`);
  assert(hubHtml.includes(`href="${row.swahiliRoute}"`), `${row.englishId}: hub no-script discovery`);
}
assert(hubHtml.includes("/assets/css/sw-hr-payroll-hub-repair.css"), "hub dark-mode repair stylesheet");
assert(hubHtml.includes("/assets/js/sw-hr-payroll-hub-repair.js"), "hub exact-six runtime discovery");
assert(hubHtml.includes("window.AfroLocalOnly = true"), "hub explicit navbar/auth no-network flag");
assert(hubHtml.includes('<meta name="afrotools-network-policy" content="local-only" data-source-owner="scripts/build-swahili-hr-payroll-six.js">'), "hub source-owned local-only network policy");
assert(hubHtml.includes(`/assets/js/components/navbar.min.js?v=${navbarVersion}`), "hub current navbar cache key");
assert(!/fonts\.(?:googleapis|gstatic)\.com/i.test(hubHtml), "hub typography must remain self-hosted");
assert(!/kanuni rasmi za kila nchi|matokeo sahihi zaidi|kila kiwango[^.]+hutokana na sheria|makato yote muhimu[^.]+huhesabiwa kwa usahihi/is.test(hubHtml), "hub must not overclaim statutory accuracy");

const navbarSource = fs.readFileSync(path.join(ROOT, "assets/js/components/navbar.js"), "utf8");
assert(navbarSource.includes("_isExplicitLocalOnlySurface"), "shared navbar must honor source-owned local-only metadata");
assert(navbarSource.includes("afrotools-network-policy"), "shared navbar must inspect the local-only network policy meta tag");
assert((navbarSource.match(/_isExplicitLocalOnlySurface\(\)/g) || []).length >= 3, "both delayed auth paths must fail closed from source-owned metadata");
const scopedCss = fs.readFileSync(path.join(ROOT, "assets/css/sw-hr-payroll-six.css"), "utf8");
assert(/\.sw-hr-breadcrumb a,.sw-hr-source a\{[^}]*text-decoration-line:underline/i.test(scopedCss), "breadcrumb and source links require a non-color cue");

const today = new Date().toISOString().slice(0, 10);
const base = { jurisdiction: "Kenya", currency: "KES", sourceLabel: "Kenya Ministry of Labour", sourceDate: today };
const fixtures = {
  "contractor-vs-employee": { ...base, employeeBase: "1000", employeeAddons: "200", employeeOther: "50", contractorQuote: "1400", contractorOther: "0" },
  "domestic-worker": { ...base, country: "kenya", role: "nanny", basePay: "1000", payPeriod: "monthly", legalFloor: "900", floorPeriod: "monthly", hoursPerWeek: "40", daysPerWeek: "5", overtimeHours: "10", overtimeMultiplier: "1.5", allowances: "100", inKind: "50", employerPct: "5", leavePct: "4", adminCost: "20", annualBonus: "600", setupCost: "0", retentionBuffer: "10", contractStatus: "yes", payRecord: "yes", restDays: "yes", notes: "Jaribio bandia" },
  "employee-cost": { ...base, salary: "1000", obligations: "100", benefits: "50", allowances: "100", other: "50", oneOff: "1200", allocationMonths: "12" },
  "gratuity-calculator": { ...base, monthlyPay: "3000", years: "5", months: "6", daysPerYear: "15", divisor: "30", additions: "500", deductions: "250" },
  "maternity-leave": { ...base, country: "/tools/maternity-leave/kenya/", countryLabel: "Kenya", leaveType: "maternity", monthlySalary: "3043.75", startDate: "2026-08-01", officialDays: "90", requestedDays: "100", officialRate: "80", companyDays: "112", companyRate: "100", compareCountry: "/tools/maternity-leave/tanzania/", compareCountryLabel: "Tanzania", leaveNotes: "Jaribio bandia" },
  "retrenchment-calculator": { ...base, monthlyPay: "7800", years: "7", months: "4", weeksPerYear: "1", noticeMonths: "1", leaveDays: "10", divisor: "39", other: "1000", deductions: "500" }
};

const englishOwners = {
  "contractor-vs-employee": ["tools/contractor-vs-employee/index.html", "const employeeMonthly = employeeBase + employeeAddons + employeeOther;", "const contractorMonthly = contractorQuote + contractorOther;"],
  "domestic-worker": ["tools/domestic-worker/index.html", "var effectiveHourly = regularMonthlyHours > 0 ? baseMonthly / regularMonthlyHours : 0;", "effectiveHourly: effectiveHourly,"],
  "employee-cost": ["tools/employee-cost/index.html", "const planningMonthly = recurring + oneOff / allocationMonths;", "const firstYear = recurring * 12 + oneOff;"],
  "gratuity-calculator": ["tools/gratuity-calculator/index.html", "const dailyPay = monthlyPay / divisor;", "document.getElementById('gratuity-daily').textContent = format(currency, dailyPay);"],
  "maternity-leave": ["tools/maternity-leave/verified-planner.js", "var daily = salary / 30.4375;", "var requestedValue = (daily * requestedDays * officialRate) / 100;"],
  "retrenchment-calculator": ["tools/retrenchment-calculator/verified-planner.js", "var weeklyPay = monthlyPay * 12 / 52;", "var gross = severance + notice + leave + other;"]
};

for (const [id, [ownerFile, ...markers]] of Object.entries(englishOwners)) {
  const source = fs.readFileSync(path.join(ROOT, ownerFile), "utf8");
  for (const marker of markers) assert(source.includes(marker), `${id}: English owner formula marker drifted: ${marker}`);
}

function englishOwnerOracle(id, input) {
  const value = (key) => Number(input[key]);
  if (id === "contractor-vs-employee") {
    const employeeMonthly = value("employeeBase") + value("employeeAddons") + value("employeeOther");
    const contractorMonthly = value("contractorQuote") + value("contractorOther");
    return { employeeMonthly, contractorMonthly, employeeAnnual: employeeMonthly * 12, contractorAnnual: contractorMonthly * 12, difference: contractorMonthly - employeeMonthly };
  }
  if (id === "domestic-worker") {
    const hoursPerWeek = value("hoursPerWeek");
    const daysPerWeek = value("daysPerWeek");
    const monthlyEquivalent = (amount, period) => {
      if (period === "hourly") return amount * hoursPerWeek * (52 / 12);
      if (period === "daily") return amount * daysPerWeek * (52 / 12);
      if (period === "weekly") return amount * (52 / 12);
      return amount;
    };
    const baseMonthly = monthlyEquivalent(value("basePay"), input.payPeriod);
    const floorMonthly = monthlyEquivalent(value("legalFloor"), input.floorPeriod);
    const effectiveHourly = baseMonthly / (hoursPerWeek * (52 / 12));
    const overtimePay = value("overtimeHours") * effectiveHourly * Math.max(1, value("overtimeMultiplier"));
    const contributionBase = baseMonthly + overtimePay + value("allowances");
    const employerContribution = contributionBase * (value("employerPct") / 100);
    const leaveReserve = contributionBase * (value("leavePct") / 100);
    const monthlyCost = baseMonthly + overtimePay + value("allowances") + value("inKind") + employerContribution + leaveReserve + value("adminCost") + value("annualBonus") / 12 + value("setupCost") / 12;
    const floorGap = baseMonthly - floorMonthly;
    let readiness = 30 + (floorGap >= 0 ? 22 : 0) + (input.contractStatus === "yes" ? 14 : input.contractStatus === "draft" ? 7 : 0) + (input.payRecord === "yes" ? 12 : input.payRecord === "partial" ? 5 : 0) + (input.restDays === "yes" ? 10 : input.restDays === "partial" ? 4 : 0) + (input.sourceDate ? 8 : 0) + (hoursPerWeek <= 52 ? 4 : 0);
    readiness = Math.max(0, Math.min(100, Math.round(readiness)));
    return { baseMonthly, floorMonthly, effectiveHourly, overtimePay, employerContribution, leaveReserve, monthlyCost, annualCost: monthlyCost * 12, floorGap, readiness, retentionMonthly: monthlyCost * (1 + value("retentionBuffer") / 100) };
  }
  if (id === "employee-cost") {
    const recurring = value("salary") + value("obligations") + value("benefits") + value("allowances") + value("other");
    const planningMonthly = recurring + value("oneOff") / value("allocationMonths");
    return { recurring, planningMonthly, firstYear: recurring * 12 + value("oneOff"), loadPct: ((planningMonthly - value("salary")) / value("salary")) * 100 };
  }
  if (id === "gratuity-calculator") {
    const serviceYears = value("years") + value("months") / 12;
    const dailyPay = value("monthlyPay") / value("divisor");
    const core = dailyPay * value("daysPerYear") * serviceYears;
    const gross = core + value("additions");
    return { serviceYears, dailyPay, core, gross, net: gross - value("deductions") };
  }
  if (id === "maternity-leave") {
    const dailyPay = value("monthlySalary") / 30.4375;
    const endDate = (days) => {
      const date = new Date(`${input.startDate}T00:00:00Z`);
      date.setUTCDate(date.getUTCDate() + Math.max(0, days - 1));
      return date.toISOString().slice(0, 10);
    };
    return { dailyPay, officialValue: dailyPay * value("officialDays") * value("officialRate") / 100, requestedValue: dailyPay * value("requestedDays") * value("officialRate") / 100, companyValue: dailyPay * value("companyDays") * value("companyRate") / 100, officialEnd: endDate(value("officialDays")), requestedEnd: endDate(value("requestedDays")), companyEnd: value("companyDays") ? endDate(value("companyDays")) : "" };
  }
  if (id === "retrenchment-calculator") {
    const serviceYears = value("years") + value("months") / 12;
    const weeklyPay = value("monthlyPay") * 12 / 52;
    const severance = weeklyPay * value("weeksPerYear") * serviceYears;
    const notice = value("monthlyPay") * value("noticeMonths");
    const leave = value("monthlyPay") / value("divisor") * value("leaveDays");
    const gross = severance + notice + leave + value("other");
    return { serviceYears, weeklyPay, severance, notice, leave, gross, net: gross - value("deductions") };
  }
  throw new Error(`No English-owner oracle for ${id}`);
}

for (const id of Object.keys(fixtures)) {
  const localized = sw.calculate(id, fixtures[id]);
  const oracle = englishOwnerOracle(id, fixtures[id]);
  assert.strictEqual(localized.valid, true, `${id}: Swahili valid fixture`);
  assert.deepStrictEqual(localized.values, oracle, `${id}: arithmetic differs from the English source owner`);
  assert(localized.rows.every((row) => !/Coût|Montant|Indemnité|Valeur|Ancienneté|Congé/.test(row[0])), `${id}: French result label leaked`);
  const invalid = sw.calculate(id, { ...fixtures[id], jurisdiction: "", sourceLabel: "", sourceDate: "2099-01-01" });
  assert.strictEqual(invalid.valid, false, `${id}: invalid evidence must fail closed`);
  assert(invalid.errors.length >= 3, `${id}: invalid evidence errors`);
}

const domesticResult = sw.calculate("domestic-worker", fixtures["domestic-worker"]);
assert.strictEqual(domesticResult.values.effectiveHourly, englishOwnerOracle("domestic-worker", fixtures["domestic-worker"]).effectiveHourly, "domestic worker effectiveHourly return value");
assert(domesticResult.rows.some(([label, amount]) => label === "Malipo halisi kwa saa" && amount === domesticResult.values.effectiveHourly), "domestic worker effectiveHourly visible/export row");
const gratuityResult = sw.calculate("gratuity-calculator", fixtures["gratuity-calculator"]);
assert.strictEqual(gratuityResult.values.dailyPay, 100, "gratuity dailyPay return value");
assert(gratuityResult.rows.some(([label, amount]) => label === "Malipo ya siku" && amount === gratuityResult.values.dailyPay), "gratuity dailyPay visible/export row");

const stale = sw.calculate("employee-cost", { ...fixtures["employee-cost"], sourceDate: "2020-01-01" });
assert.strictEqual(stale.evidence.state, "stale", "stale evidence state");
assert.strictEqual(sw.calculate("gratuity-calculator", { ...fixtures["gratuity-calculator"], divisor: "0" }).valid, false, "zero divisor must fail");
assert.strictEqual(sw.calculate("maternity-leave", { ...fixtures["maternity-leave"], requestedDays: "366" }).valid, false, "leave boundary must fail");
assert.strictEqual(sw.calculate("retrenchment-calculator", { ...fixtures["retrenchment-calculator"], deductions: "999999" }).valid, false, "deductions above gross must fail");

const generator = fs.readFileSync(path.join(ROOT, "scripts/build-swahili-hr-payroll-six.js"), "utf8");
for (const row of manifest.rows) {
  assert(generator.includes(`"${row.englishId}"`), `${row.englishId}: maintained generator ownership`);
}
assert(generator.includes('scripts/build-swahili-hr-payroll-six.js'), "generator must retain its source-owner marker");
console.log("Swahili HR & Payroll exact-six contract: PASS (6/6)");
