(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.JobOfferEngine = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  var CRITERIA = ["financial", "roleFit", "learning", "flexibility", "stability", "team"];

  function number(value, minimum, maximum) {
    if (value === "" || value === null || typeof value === "undefined") return 0;
    var parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < minimum || parsed > maximum) throw new Error("INVALID_NUMBER");
    return parsed;
  }

  function annualValue(offer) {
    var value = 12 * (number(offer.monthlyPay, 0, 1e15) + number(offer.monthlyCash, 0, 1e15) +
      number(offer.monthlyBenefits, 0, 1e15) - number(offer.monthlyCosts, 0, 1e15)) +
      number(offer.annualBonus, 0, 1e15) - number(offer.oneOffCosts, 0, 1e15);
    if (!Number.isFinite(value)) throw new Error("INVALID_NUMBER");
    return value;
  }

  function compare(offers, weights) {
    if (!Array.isArray(offers) || offers.length !== 2) throw new Error("TWO_OFFERS_REQUIRED");
    if (!weights || typeof weights !== "object") throw new Error("WEIGHTS_REQUIRED");
    var cleanWeights = {};
    var weightTotal = 0;
    CRITERIA.forEach(function (key) {
      cleanWeights[key] = number(weights[key], 0, 1e6);
      weightTotal += cleanWeights[key];
    });
    if (weightTotal <= 0) throw new Error("ZERO_WEIGHT_TOTAL");

    var values = offers.map(annualValue);
    var highestPositive = Math.max(0, values[0], values[1]);
    var rows = offers.map(function (offer, index) {
      var scores = {};
      scores.financial = highestPositive > 0 ? Math.max(0, values[index]) / highestPositive * 100 : 0;
      CRITERIA.slice(1).forEach(function (key) {
        scores[key] = number(offer[key], 0, 10);
        scores[key] *= 10;
      });
      var weighted = CRITERIA.reduce(function (sum, key) {
        return sum + scores[key] * cleanWeights[key];
      }, 0) / weightTotal;
      return {
        label: String(offer.label || ("Offer " + (index ? "B" : "A"))).slice(0, 80),
        annualValue: values[index],
        scores: scores,
        weightedScore: Math.round(weighted * 10) / 10
      };
    });
    return {
      offers: rows,
      annualDelta: values[1] - values[0],
      scoreDelta: Math.round((rows[1].weightedScore - rows[0].weightedScore) * 10) / 10,
      normalizedWeights: CRITERIA.reduce(function (out, key) {
        out[key] = cleanWeights[key] / weightTotal;
        return out;
      }, {}),
      methodology: "Annual value = 12 × (monthly pay + monthly cash allowances + monthly benefit estimate − monthly work costs) + expected annual bonus − one-off costs. Financial score is each non-negative annual value divided by the higher positive annual value. Other ratings are user-entered 0–10 values. The weighted score is the normalized weighted average. Offer order is preserved; no recommendation is made."
    };
  }

  return { CRITERIA: CRITERIA, annualValue: annualValue, compare: compare };
});
