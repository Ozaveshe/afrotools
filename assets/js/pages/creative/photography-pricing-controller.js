(function (global) {
  "use strict";
  function fmt(number) { return number.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 }); }
  function value(id) { return document.getElementById(id).value; }
  function calculate() {
    var engine = global.AfroTools && global.AfroTools.PhotographyPricingEngine;
    var tools = global.AfroTools && global.AfroTools.CreativeResultTools;
    if (!engine) throw new Error("PhotographyPricingEngine is unavailable");
    if (!(parseFloat(value("shootHours")) > 0)) {
      return tools.reject(tools.text("Enter shoot hours greater than zero.", "Saisissez un nombre d'heures de prise de vue supérieur à zéro."), "shootHours");
    }
    if (!(parseFloat(value("editHours")) >= 0)) {
      return tools.reject(tools.text("Editing hours cannot be negative.", "Les heures de retouche ne peuvent pas être négatives."), "editHours");
    }
    if (!(parseInt(value("workDays"), 10) >= 1)) {
      return tools.reject(tools.text("Enter at least one monthly working day.", "Saisissez au moins un jour de travail mensuel."), "workDays");
    }
    var result = engine.calculate({
      country: value("country"), speciality: value("speciality"), experience: value("experience"),
      equipment: value("equipment"), shootHours: value("shootHours"), editHours: value("editHours"),
      studioRent: value("studioRent"), workDays: value("workDays"), equipmentValue: value("equipValue"),
      prints: value("prints"),
    });
    var symbol = result.symbol;
    document.getElementById("sessionPrice").textContent = symbol + fmt(result.sessionPrice);
    document.getElementById("dayRate").textContent = "Day rate: " + symbol + fmt(result.dayRate) + " | " + symbol + fmt(result.monthly) + "/month estimated";
    document.getElementById("annualIncome").textContent = symbol + fmt(result.annual / 1000) + "k";
    document.getElementById("metrics").innerHTML =
      '<div class="en-metric"><div class="en-metric-label">Daily Overhead</div><div class="en-metric-value">' + symbol + fmt(result.dailyCost) + '</div><div class="en-metric-unit">Rent + depreciation</div></div>' +
      '<div class="en-metric"><div class="en-metric-label">Session Hours</div><div class="en-metric-value">' + (result.shootHours + result.editHours) + '</div><div class="en-metric-unit">Shoot + editing</div></div>' +
      '<div class="en-metric"><div class="en-metric-label">Hourly Rate</div><div class="en-metric-value">' + symbol + fmt(result.hourlyRate) + '</div><div class="en-metric-unit">Effective hourly</div></div>' +
      '<div class="en-metric"><div class="en-metric-label">Profit Margin</div><div class="en-metric-value">~60%</div><div class="en-metric-unit">After overhead</div></div>';
    var labels = { new: "New (0–1yr)", mid: "Experienced (2–5yr)", senior: "Senior (5+yr)", established: "Established" };
    document.getElementById("marketTable").innerHTML = ["new", "mid", "senior", "established"].map(function (level) {
      var range = result.market[level];
      return '<tr' + (level === result.experience ? ' style="background:var(--en-accent-pale)"' : "") + '><td class="en-td-value">' +
        labels[level] + (level === result.experience ? " ←" : "") + "</td><td>" + symbol + fmt(range[0]) + "–" + symbol + fmt(range[1]) +
        "</td><td>" + symbol + fmt((range[0] + range[1]) / 2 * 2) + "</td><td>" + symbol + fmt(range[1] * 2.5) + "–" + symbol + fmt(range[1] * 5) + "</td></tr>";
    }).join("");
    document.getElementById("results").classList.add("on");
    tools.publish({ name: tools.text("Photography Session Pricing Tool", "Calculateur du prix d'une séance photo"), fileBase: "photography-pricing" });
    document.getElementById("results").scrollIntoView({ behavior: "smooth", block: "start" });
  }
  global.calculate = calculate;
})(window);
