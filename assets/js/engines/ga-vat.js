(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) { root.AfroTools = root.AfroTools || {}; root.AfroTools.GAVatEngine = api; }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  var STANDARD_RATE = 18;
  var REVIEWED_ON = "2026-07-22";
  var SOURCE_AS_OF = "2025-12-30";
  var EVIDENCE = {
    ten: "finance-law-2026-article-221-ten-percent-listed-supply",
    five: "finance-law-2026-article-221-five-percent-listed-supply",
    zero: "finance-law-2026-article-221-zero-rated-operation"
  };
  var TREATMENTS = {
    standard: { rate: STANDARD_RATE, evidence: null },
    "article-221-ten-confirmed": { rate: 10, evidence: EVIDENCE.ten },
    "article-221-five-confirmed": { rate: 5, evidence: EVIDENCE.five },
    "article-221-zero-confirmed": { rate: 0, evidence: EVIDENCE.zero }
  };
  function amount(value) {
    if (value === "" || value === null || typeof value === "undefined") throw new RangeError("amount is required");
    var parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) throw new RangeError("amount must be non-negative");
    return parsed;
  }
  function treatment(key) {
    var item = TREATMENTS[key || "standard"];
    if (!item) throw new RangeError("unsupported Gabon VAT treatment");
    return item;
  }
  function requireEvidence(item, confirmed, evidenceType) {
    if (item.evidence && (confirmed !== true || evidenceType !== item.evidence)) {
      var error = new RangeError("exact current Article 221 evidence is required");
      error.code = "RATE_EVIDENCE_REQUIRED";
      throw error;
    }
  }
  function roundedBase(value) { return Math.floor((value + Number.EPSILON) / 1000) * 1000; }
  function roundFranc(value) { return Math.round(value); }
  function extract(gross, rate) {
    if (rate === 0) return { net: gross, base: roundedBase(gross) };
    var guess = Math.floor(gross / (1000 * (1 + rate / 100)));
    for (var k = Math.max(0, guess - 2); k <= guess + 2; k += 1) {
      var net = gross - k * 1000 * rate / 100;
      if (net >= k * 1000 && net < (k + 1) * 1000) return { net: net, base: k * 1000 };
    }
    throw new RangeError("inclusive amount cannot be resolved under Article 220 rounding");
  }
  function calculate(input) {
    input = input || {};
    var entered = amount(input.amount);
    var kind = input.rateKind || "standard";
    var item = treatment(kind);
    requireEvidence(item, input.rateEvidenceConfirmed, input.rateEvidenceType);
    var mode = input.mode === "extract" ? "extract" : "add";
    var resolved = mode === "extract" ? extract(entered, item.rate) : { net: entered, base: roundedBase(entered) };
    var vat = roundFranc(resolved.base * item.rate / 100);
    var gross = mode === "extract" ? roundFranc(entered) : roundFranc(resolved.net + vat);
    return { mode: mode, rateKind: kind, rate: item.rate, net: roundFranc(resolved.net), taxableBase: resolved.base, vat: vat, gross: gross, sourceAsOf: SOURCE_AS_OF, rounding: "taxable-base-down-to-xaf-1000" };
  }
  return {
    STANDARD_RATE: STANDARD_RATE,
    REVIEWED_ON: REVIEWED_ON, SOURCE_AS_OF: SOURCE_AS_OF, EVIDENCE: EVIDENCE, TREATMENTS: TREATMENTS,
    formulaParameters: { standard: "18%", reduced: "10% or 5% only for exact Article 221 listed operations", zero: "0% only for exact Article 221 listed operations", threshold: "XAF 60m generally; XAF 500m forestry; opt-in conditions under Article 208 bis", rounding: "Article 220 floors the taxable base to XAF 1,000" },
    roundedBase: roundedBase, calculate: calculate
  };
});
