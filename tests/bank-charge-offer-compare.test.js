"use strict";
const assert = require("assert"),
  fs = require("fs"),
  path = require("path");
const engine = require("../assets/js/engines/bank-charge-offer-compare.js");
const now = "2026-07-22T12:00:00Z";
const fixture = {
  currency: "KES",
  comparisonLabel: "July offers",
  transfers: 10,
  atmWithdrawals: 2,
  messages: 10,
  internationalSpend: 10000,
  nameA: "Alpha",
  monthlyAccountFeeA: 100,
  transferFeeA: 5,
  atmFeeA: 20,
  messageFeeA: 1,
  annualCardFeeA: 120,
  internationalFeePctA: 2,
  otherMonthlyFeeA: 30,
  evidenceLabelA: "Alpha tariff",
  evidenceDateA: "2026-07-20",
  nameB: "Beta",
  monthlyAccountFeeB: 50,
  transferFeeB: 7,
  atmFeeB: 10,
  messageFeeB: 2,
  annualCardFeeB: 240,
  internationalFeePctB: 1,
  otherMonthlyFeeB: 20,
  evidenceLabelB: "Beta tariff",
  evidenceDateB: "2026-07-20",
};
const r = engine.calculate(fixture, now);
assert.equal(r.ok, true);
assert.equal(r.offerA.monthlyTotal, 440);
assert.equal(r.offerB.monthlyTotal, 300);
assert.equal(r.offerA.annualTotal, 5280);
assert.equal(r.offerB.annualTotal, 3600);
assert.equal(r.monthlyDifference, 140);
assert.equal(r.lowerModeledCost, "B");
assert.equal(
  engine.calculate({ ...fixture, transfers: 1.5 }, now).error,
  "invalid_activity",
);
assert.equal(
  engine.calculate({ ...fixture, internationalFeePctA: 101 }, now).error,
  "invalid_fee",
);
assert.equal(
  engine.calculate({ ...fixture, evidenceDateA: "2025-01-01" }, now).error,
  "invalid_evidence",
);
assert.equal(
  engine.calculate({ ...fixture, evidenceDateA: "2099-01-01" }, now).error,
  "invalid_evidence",
);
const root = path.resolve(__dirname, "..");
for (const p of [
  "tools/bank-charges/index.html",
  "fr/tools/frais-bancaires/index.html",
  "ha/kayan-aiki/cajin-banki/index.html",
  "sw/zana/ada-za-benki/index.html",
]) {
  const h = fs.readFileSync(path.join(root, p), "utf8");
  assert.match(h, /data-bank-charge-compare/);
  assert.match(
    h,
    /bog\.gov\.gh\/supervision-regulation\/consumer-rights-and-responsibilities/,
  );
  assert.doesNotMatch(
    h,
    /GTBank|M-Pesa|\bKuda\b|cheapest bank|ai-advisor|40\+ banks|8 countries/i,
  );
}
const c = fs.readFileSync(
  path.join(root, "assets/js/pages/bank-charge-offer-vip.js"),
  "utf8",
);
assert.doesNotMatch(c, /\bfetch\s*\(|localStorage|sessionStorage|gtag\s*\(/i);
assert.match(c, /noGate: true/);
assert.match(c, /function csvCell/);
console.log("bank-charge-offer-compare: all checks passed");
