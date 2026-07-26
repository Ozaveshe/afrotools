(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.CalorieDiaryEngine = api;
})(typeof window !== "undefined" ? window : this, function () {
  "use strict";

  function finite(value, label, options) {
    var number = Number(value);
    var min = options && options.min !== undefined ? options.min : 0;
    var max = options && options.max !== undefined ? options.max : 100000;
    if (!Number.isFinite(number) || number < min || number > max) {
      throw new Error(label + " must be between " + min + " and " + max + ".");
    }
    return number;
  }

  function calculateEntry(input) {
    var name = String(input && input.foodName || "").trim();
    if (!name) throw new Error("Enter a food or dish name.");
    var amount = finite(input.amount, "Amount eaten", { min: 0.1 });
    var referenceAmount = finite(input.referenceAmount, "Label reference amount", { min: 0.1 });
    var referenceCalories = finite(input.referenceCalories, "Label calories", { min: 0 });
    var unit = ["g", "ml", "serving"].indexOf(input.unit) >= 0 ? input.unit : "g";
    return {
      foodName: name.slice(0, 80),
      amount: amount,
      unit: unit,
      referenceAmount: referenceAmount,
      referenceCalories: referenceCalories,
      sourceNote: String(input.sourceNote || "").trim().slice(0, 120),
      calories: Math.round((amount / referenceAmount) * referenceCalories * 10) / 10
    };
  }

  function total(entries) {
    if (!Array.isArray(entries)) return 0;
    var sum = entries.reduce(function (runningTotal, item) {
      return runningTotal + finite(item && item.calories, "Entry calories", { min: 0, max: 1000000000000 });
    }, 0);
    if (!Number.isFinite(sum) || sum > 10000000000000) {
      throw new Error("Diary total is outside the supported range.");
    }
    return Math.round(sum * 10) / 10;
  }

  return { calculateEntry: calculateEntry, total: total };
});
