(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.SingleFoodCalorieEngine = api;
})(typeof window !== "undefined" ? window : this, function () {
  "use strict";
  function number(value, label, min) {
    var parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < min || parsed > 100000) throw new Error(label + " must be between " + min + " and 100000.");
    return parsed;
  }
  function calculate(input) {
    var foodName = String(input && input.foodName || "").trim();
    var source = String(input && input.source || "").trim();
    if (!foodName) throw new Error("Enter the food or dish.");
    if (!source) throw new Error("Enter the value source and date.");
    var amountEaten = number(input.amountEaten, "Amount eaten", 0.1);
    var labelAmount = number(input.labelAmount, "Reference amount", 0.1);
    var labelCalories = number(input.labelCalories, "Reference calories", 0);
    return {
      foodName: foodName.slice(0, 80), source: source.slice(0, 120),
      unit: ["g", "ml", "serving"].indexOf(input.unit) >= 0 ? input.unit : "g",
      amountEaten: amountEaten, labelAmount: labelAmount, labelCalories: labelCalories,
      calories: Math.round((amountEaten / labelAmount) * labelCalories * 10) / 10
    };
  }
  return { calculate: calculate };
});
