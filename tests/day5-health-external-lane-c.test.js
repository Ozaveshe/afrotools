#!/usr/bin/env node
"use strict";

const assert = require("assert");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const routes = [
  ["health/calorie-counter", "calorie-counter"],
  ["tools/calorie-counter", "calorie-counter-tools"],
  ["tools/african-meal-plan", "african-meal-plan"],
  ["tools/home-workout", "home-workout"],
  ["tools/gym-cost-compare", "gym-cost-compare"],
  ["tools/hospital-cost", "hospital-cost"],
  ["tools/clinic-costs", "clinic-costs"],
  ["tools/pharmacy-prices", "pharmacy-prices"],
  ["tools/drug-price-compare", "drug-price-compare"],
  ["tools/dental-cost", "dental-cost"],
  ["tools/eye-care-cost", "eye-care-cost"],
  ["tools/mental-health-cost", "mental-health-cost"],
  ["tools/traditional-vs-western", "traditional-vs-western"],
  ["tools/medical-tourism", "medical-tourism"],
];

function read(relative) {
  return fs.readFileSync(path.join(root, relative), "utf8");
}

function hash(text) {
  return "sha256:" + crypto.createHash("sha256").update(text).digest("hex");
}

function assertThrows(fn, pattern) {
  assert.throws(fn, pattern);
}

for (const [route, key] of routes) {
  const html = read(route + "/index.html");
  assert.match(html, /<meta name="viewport"/i, route + " needs viewport metadata");
  assert.match(html, new RegExp('<link rel="canonical" href="https://afrotools\\.com/' + route.replace("health/", "health/").replace("tools/", "tools/") + '/">'), route + " canonical mismatch");
  assert.match(html, /application\/ld\+json/i, route + " needs schema");
  assert.match(html, /Download TXT/i, route + " needs ungated TXT export");
  assert.match(html, /Download PDF/i, route + " needs ungated PDF export");
  assert.doesNotMatch(html, /fonts\.googleapis|fonts\.gstatic|cdn\.jsdelivr|cdnjs|unpkg/i, route + " has an external font/CDN dependency");
  assert.doesNotMatch(html, /\bfetch\s*\(|XMLHttpRequest|sendBeacon|analytics\.track/i, route + " has an app-owned network/analytics path");
  assert.doesNotMatch(html, /[?&](?:name|medicine|provider|notes|amount)=/i, route + " risks sensitive URL state");

  const controls = Array.from(html.matchAll(/<(?:input|select|textarea)\b[^>]*\bid="([^"]+)"/gi), (match) => match[1]);
  for (const id of controls) {
    assert.match(html, new RegExp('<label\\b[^>]*for="' + id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + '"', "i"), route + " control #" + id + " needs a visible label");
  }

  for (const script of html.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (/application\/ld\+json/i.test(script[1])) continue;
    new vm.Script(script[2], { filename: route + "/index.html:inline" });
  }

  const definition = JSON.parse(read("data/ai/tool-context/" + key + ".json"));
  assert.strictEqual(definition.schemaVersion, 1);
  assert.strictEqual(definition.toolKey, key);
  assert.strictEqual(definition.status, "unverified-static");
  assert.strictEqual(definition.legacyTextSha256, hash(definition.staticText), key + " context hash mismatch");
}

assert.notStrictEqual(
  /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(read("health/calorie-counter/index.html"))[1],
  /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(read("tools/calorie-counter/index.html"))[1],
  "calorie routes must remain distinct"
);
assert.match(read("tools/mental-health-cost/index.html"), /local emergency service[\s\S]*nearest emergency department/i);
assert.match(read("tools/traditional-vs-western/index.html"), /does not assume[\s\S]*uniform, equivalent/i);
assert.match(read("tools/medical-tourism/index.html"), /does not rank clinical quality, verify accreditation, clear anyone to travel or predict/i);

const diary = require("../health/calorie-counter/calorie-diary-engine.js");
const diaryItem = diary.calculateEntry({ foodName: "Stew", amount: 250, unit: "g", referenceAmount: 100, referenceCalories: 180 });
assert.strictEqual(diaryItem.calories, 450);
assert.strictEqual(diary.total([diaryItem, { calories: 50 }]), 500);
assertThrows(() => diary.calculateEntry({ foodName: "", amount: 1, referenceAmount: 1, referenceCalories: 1 }), /food/i);

const single = require("../tools/calorie-counter/single-food-calorie-engine.js");
assert.strictEqual(single.calculate({ foodName: "Label food", amountEaten: 75, unit: "g", labelAmount: 100, labelCalories: 240, source: "label 2026-07-26" }).calories, 180);
assertThrows(() => single.calculate({ foodName: "x", amountEaten: 1, labelAmount: 0, labelCalories: 1, source: "x" }), /Reference amount/);

const meal = require("../tools/african-meal-plan/meal-logistics-engine.js");
const mealResult = meal.calculate({ days: 7, people: 2, mealsPerDay: 3, dailyBudget: 1000, bufferPercent: 10, currency: "NGN", priceDate: "2026-07-26" });
assert.deepStrictEqual([mealResult.totalServings, mealResult.totalBudget], [42, 15400]);

const home = require("../tools/home-workout/home-activity-engine.js");
const homeResult = home.calculate({ activity: "Routine", weeks: 4, sessionsPerWeek: 3, activeMinutes: 20, breakMinutes: 5 });
assert.deepStrictEqual([homeResult.totalSessions, homeResult.weeklyMinutes, homeResult.totalMinutes], [12, 75, 300]);

const gym = require("../tools/gym-cost-compare/gym-quote-engine.js");
const gymResult = gym.calculate({ currency: "KES", quoteDate: "2026-07-26", months: 2, visitsPerMonth: 4, aName: "A", aMonthly: 1000, aJoining: 500, aTransport: 100, aExtras: 0, bName: "B", bMonthly: 1200, bJoining: 0, bTransport: 50, bExtras: 100 });
assert.deepStrictEqual([gymResult.a.total, gymResult.b.total, gymResult.difference], [3300, 2900, 400]);

const hospital = require("../tools/hospital-cost/hospital-quote-engine.js");
const hospitalResult = hospital.calculate({ facility: "Quote A", currency: "GHS", quoteDate: "2026-07-26", bufferPercent: 10, consultation: 100, facilityFee: 200, procedure: 500, tests: 100, medicines: 50, travel: 50, other: 0, insuranceContribution: 200 });
assert.deepStrictEqual([hospitalResult.gross, hospitalResult.outOfPocket, hospitalResult.totalWithBuffer], [1000, 800, 880]);
assertThrows(() => hospital.calculate({ facility: "x", currency: "GHS", quoteDate: "2026-07-26", bufferPercent: 0, consultation: 0, facilityFee: 0, procedure: 0, tests: 0, medicines: 0, travel: 0, other: 0, insuranceContribution: 1 }), /cannot exceed/);

const clinic = require("../tools/clinic-costs/clinic-visit-engine.js");
const clinicResult = clinic.calculate({ provider: "Clinic", currency: "KES", quoteDate: "2026-07-26", followups: 2, initialVisit: 1000, followupVisit: 500, testsTotal: 200, medicinesTotal: 300, transportPerVisit: 100, otherTotal: 0, insuranceContribution: 500, bufferPercent: 10 });
assert.deepStrictEqual([clinicResult.totalVisits, clinicResult.gross, clinicResult.totalWithBuffer], [3, 2800, 2530]);

const pharmacy = require("../tools/pharmacy-prices/pharmacy-quote-engine.js");
const pharmacyResult = pharmacy.calculate({ medicine: "Exact", strength: "500 mg", dosageForm: "tablet", pharmacy: "P", currency: "NGN", quoteDate: "2026-07-26", packSize: 10, packPrice: 1200, requiredUnits: 24, fee: 100 });
assert.deepStrictEqual([pharmacyResult.packsNeeded, pharmacyResult.unusedUnits, pharmacyResult.totalCost], [3, 6, 3700]);

const medicine = require("../tools/drug-price-compare/exact-medicine-compare-engine.js");
const medicineResult = medicine.calculate({ medicine: "M", strength: "5 mg", dosageForm: "tablet", requiredUnits: 25, currency: "ZAR", quoteDate: "2026-07-26", aProvider: "A", aPackSize: 10, aPackPrice: 50, aFee: 0, bProvider: "B", bPackSize: 30, bPackPrice: 130, bFee: 5 });
assert.deepStrictEqual([medicineResult.a.totalCost, medicineResult.b.totalCost, medicineResult.difference], [150, 135, 15]);

const dental = require("../tools/dental-cost/dental-quote-engine.js");
const dentalResult = dental.calculate({ provider: "D", service: "Quoted", currency: "NGN", quoteDate: "2026-07-26", quantity: 2, unitPrice: 10000, consultation: 1000, imaging: 2000, followup: 1000, medicines: 500, travel: 500, insuranceContribution: 5000, bufferPercent: 10 });
assert.deepStrictEqual([dentalResult.serviceSubtotal, dentalResult.gross, dentalResult.totalWithBuffer], [20000, 25000, 22000]);

const eye = require("../tools/eye-care-cost/eye-care-quote-engine.js");
const eyeResult = eye.calculate({ provider: "E", currency: "GHS", quoteDate: "2026-07-26", exam: 100, tests: 50, lenses: 300, frames: 200, fitting: 50, followup: 50, travel: 50, insuranceContribution: 100, bufferPercent: 10 });
assert.deepStrictEqual([eyeResult.gross, eyeResult.outOfPocket, eyeResult.totalWithBuffer], [800, 700, 770]);

const mental = require("../tools/mental-health-cost/mental-health-cost-engine.js");
const mentalResult = mental.calculate({ provider: "P", currency: "KES", quoteDate: "2026-07-26", sessions: 4, assessment: 1000, sessionFee: 2000, transportPerSession: 200, other: 0, insuranceContribution: 1000, bufferPercent: 10 });
assert.deepStrictEqual([mentalResult.gross, mentalResult.totalWithBuffer], [9800, 9680]);

const care = require("../tools/traditional-vs-western/care-plan-compare-engine.js");
const careResult = care.calculate({ currency: "NGN", quoteDate: "2026-07-26", aName: "Plan A", aProvider: "A", aInitial: 1000, aFollowups: 2, aFollowupCost: 500, aTravel: 100, aOther: 200, bName: "Plan B", bProvider: "B", bInitial: 2000, bFollowups: 1, bFollowupCost: 200, bTravel: 50, bOther: 0 });
assert.deepStrictEqual([careResult.a.total, careResult.b.total, careResult.difference], [2500, 2300, 200]);

const travel = require("../tools/medical-tourism/medical-travel-budget-engine.js");
const travelResult = travel.calculate({ destination: "D", provider: "P", quoteDate: "2026-07-26", currency: "USD", clinicalQuote: 5000, tests: 500, aftercare: 500, internationalTransport: 1000, documents: 200, nights: 10, nightlyRate: 100, localCosts: 300, companionCosts: 500, insuranceContribution: 1000, contingencyPercent: 10, localAlternative: 6000 });
assert.deepStrictEqual([travelResult.clinicalSubtotal, travelResult.travelSubtotal, travelResult.totalWithContingency, travelResult.localDifference], [6000, 3000, 8800, 2800]);

console.log("day5-health-external-lane-c.test.js passed: 14 routes, 14 contexts, 14 deterministic engines");
