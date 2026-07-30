(function (global) {
  "use strict";

  var COPY = Object.freeze({
    en: Object.freeze({
      locale: "en-US",
      marketRange: "Market range: ",
      commercialPremium: " (commercial premium applied)",
      perHour: "/hr",
      basePrice: "Base Price",
      beforeAdjustments: "Before adjustments",
      sizeFactor: "Size Factor",
      size: " size",
      complexity: "Complexity",
      rightsPremium: "Rights Premium",
      none: "None",
      use: " use",
      direct: "Instagram / Direct",
    }),
    fr: Object.freeze({
      locale: "fr-FR",
      marketRange: "Fourchette du marché : ",
      commercialPremium: " (majoration commerciale appliquée)",
      perHour: "/h",
      basePrice: "Prix de base",
      beforeAdjustments: "Avant ajustements",
      sizeFactor: "Facteur de format",
      size: " — format",
      complexity: "Complexité",
      rightsPremium: "Majoration des droits",
      none: "Aucune",
      use: " — usage",
      direct: "Instagram / Direct",
    }),
  });

  function copy() {
    return COPY[
      String(document.documentElement.lang || "en").toLowerCase().split("-")[0]
    ] || COPY.en;
  }

  function format(number, locale) {
    return number.toLocaleString(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }

  function read(id) {
    return document.getElementById(id).value;
  }

  function calculate() {
    var engine = global.AfroTools && global.AfroTools.ArtCommissionEngine;
    if (!engine) throw new Error("ArtCommissionEngine is unavailable");
    var labels = copy();
    var result = engine.calculate({
      country: read("country"),
      artType: read("artType"),
      size: read("size"),
      complexity: read("complexity"),
      rights: read("rights"),
      revisions: read("revisions"),
      timeline: read("timeline"),
      hours: read("hours"),
    });
    var money = function (number) {
      return result.symbol + format(number, labels.locale);
    };

    document.getElementById("recPrice").textContent = money(result.price);
    document.getElementById("priceRange").textContent =
      labels.marketRange +
      money(result.minPrice) +
      " — " +
      money(result.maxPrice) +
      (result.rights === "commercial" ? labels.commercialPremium : "");
    document.getElementById("hourlyRate").textContent =
      money(result.hourlyRate) + labels.perHour;
    document.getElementById("metrics").innerHTML =
      '<div class="en-metric"><div class="en-metric-label">' +
      labels.basePrice +
      '</div><div class="en-metric-value">' +
      money(result.base) +
      '</div><div class="en-metric-unit">' +
      labels.beforeAdjustments +
      "</div></div>" +
      '<div class="en-metric"><div class="en-metric-label">' +
      labels.sizeFactor +
      '</div><div class="en-metric-value">' +
      result.sizeMultiplier +
      'x</div><div class="en-metric-unit">' +
      result.size +
      labels.size +
      "</div></div>" +
      '<div class="en-metric"><div class="en-metric-label">' +
      labels.complexity +
      '</div><div class="en-metric-value">' +
      result.complexityMultiplier +
      'x</div><div class="en-metric-unit">' +
      result.complexity.replace("_", " ") +
      "</div></div>" +
      '<div class="en-metric"><div class="en-metric-label">' +
      labels.rightsPremium +
      '</div><div class="en-metric-value">' +
      (result.rights === "commercial" ? "+50%" : labels.none) +
      '</div><div class="en-metric-unit">' +
      result.rights +
      labels.use +
      "</div></div>";
    document.getElementById("platformTable").innerHTML =
      "<tr><td>" +
      labels.direct +
      '</td><td class="en-td-highlight">' +
      money(result.price) +
      '</td><td>0%</td><td class="en-td-value">' +
      money(result.price) +
      "</td></tr>" +
      "<tr><td>Fiverr</td><td>" +
      money(result.price * 1.25) +
      '</td><td>20%</td><td class="en-td-value">' +
      money(result.price) +
      "</td></tr>" +
      "<tr><td>Upwork</td><td>" +
      money(result.price * 1.2) +
      '</td><td>10–20%</td><td class="en-td-value">' +
      money(result.price * 0.85) +
      "</td></tr>" +
      "<tr><td>Etsy</td><td>" +
      money(result.price * 1.1) +
      '</td><td>6.5%</td><td class="en-td-value">' +
      money(result.price * 0.935) +
      "</td></tr>";
    document.getElementById("results").classList.add("on");
    document
      .getElementById("results")
      .scrollIntoView({ behavior: "smooth", block: "start" });
  }

  global.updateBaseRates = function () {};
  global.calculate = calculate;
})(window);
