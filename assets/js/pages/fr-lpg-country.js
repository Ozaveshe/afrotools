(() => {
  "use strict";
  const form = document.getElementById("lpg-form");
  const result = document.getElementById("lpg-result");
  const status = document.getElementById("lpg-status");
  const format = new Intl.NumberFormat("fr", { maximumFractionDigits: 3 });
  const currency = form.dataset.currency;

  // Use the receipt-based price per delivered kg from the full LPG calculator.
  function refillBudget(cylinderKg, refillPrice, monthlyRefills) {
    if (![cylinderKg, refillPrice, monthlyRefills].every(value => Number.isFinite(value) && value > 0)) return null;
    const monthlyCost = refillPrice * monthlyRefills;
    const budget = {
      pricePerKg: refillPrice / cylinderKg,
      monthlyKg: cylinderKg * monthlyRefills,
      monthlyCost,
      annualCost: 12 * monthlyCost
    };
    return Object.values(budget).every(Number.isFinite) ? budget : null;
  }

  form.addEventListener("input", () => {
    result.hidden = true;
    status.textContent = "";
  });
  form.addEventListener("submit", event => {
    event.preventDefault();
    const { kg, price, refills } = form.elements;
    const budget = refillBudget(kg.valueAsNumber, price.valueAsNumber, refills.valueAsNumber);
    if (!budget) {
      result.hidden = true;
      status.textContent = "Saisissez un poids, un prix et un nombre de recharges strictement positifs et vérifiez les montants.";
      return;
    }
    const units = { pricePerKg: currency + "/kg", monthlyKg: "kg", monthlyCost: currency, annualCost: currency };
    for (const cell of result.querySelectorAll("[data-value]")) {
      const key = cell.dataset.value;
      cell.textContent = format.format(budget[key]) + " " + units[key];
    }
    result.hidden = false;
    result.querySelector("h2").focus();
  });
})();
