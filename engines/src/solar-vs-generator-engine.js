!function() {
  "use strict";
  window.AfroTools = window.AfroTools || {}, window.AfroTools.SolarVsGeneratorEngine = {
    calculate: function(r, e) {
      var a = ENERGY_DATA.countries[e];
      if (!a) {
        return {
          error: "Country data not available."
        };
      }
      var o = parseFloat(r.dailyHours) || 0, t = parseFloat(r.genKVA) || 0, n = parseFloat(r.dailyKWh) || 0;
      if (o <= 0) {
        return {
          error: "Please enter valid daily hours of backup needed."
        };
      }
      if (t <= 0 && n <= 0) {
        return {
          error: "Please enter generator size or daily energy need."
        };
      }
      var l = a.currencySymbol, s = a.usdRate || 1;
      !n && t && (n = .8 * t * o);
      var i = .8 * t * .28 * o, u = a.fuel.diesel, c = i * u, d = Math.round(30 * c), y = Math.round(365 * c * 5), g = t > 0 ? 150 * t : 180 * n, h = Math.round(g * s), S = h + y + Math.round(.15 * y), p = n / (.8 * a.solar.avgSunHours) || 1, f = 900 * (p = Math.max(.5, Math.round(2 * p) / 2)), v = Math.round(f * s), m = v + Math.round(.03 * v * 5), L = S - m, b = d > 0 ? (v / (12 * d)).toFixed(1) : ">10", M = L > 0 ? "Solar" : L < -5e4 ? "Generator" : "Similar cost — solar preferred for reliability", k = [];
      return k.push(a.name + " fuel price: " + l + u.toFixed(2) + "/L — " + (u > 2 ? "high fuel cost makes solar very attractive" : "moderate fuel cost") + "."),
      k.push("Solar system needed: " + p + "kW (with battery storage for " + o + "hr backup)."),
      k.push("5-year generator total: " + l + S.toLocaleString() + " vs solar: " + l + m.toLocaleString() + "."),
      L > 0 && k.push("Solar saves " + l + L.toLocaleString() + " over 5 years. Payback: ~" + b + " years."),
      k.push(a.solar.avgSunHours + " peak sun hours/day in " + a.name + " — panels operate efficiently year-round."),
      {
        genCapexLocal: l + h.toLocaleString(),
        gen5yrRunning: l + y.toLocaleString(),
        gen5yrTotal: l + S.toLocaleString(),
        solarCapexLocal: l + v.toLocaleString(),
        solar5yrTotal: l + m.toLocaleString(),
        savings5yr: L > 0 ? l + L.toLocaleString() : "Generator cheaper by " + l + Math.abs(L).toLocaleString(),
        paybackYrs: b + " yrs",
        recommendation: M,
        solarSizeKW: p,
        observations: k,
        countryName: a.name,
        currencySymbol: l
      };
    }
  };
}();

(function addSolarGeneratorComparison(root) {
  "use strict";
  var engine = root.AfroTools.SolarVsGeneratorEngine;
  function number(value, fallback) {
    if (value == null || value === "") return fallback;
    return (typeof value === "number" || typeof value === "string" && value.trim() !== "") ? Number(value) : NaN;
  }
  function valid(value, min, max) {
    return Number.isFinite(value) && value >= min && value <= max;
  }
  engine.planningDefaults = function (input, code) {
    var country = root.ENERGY_DATA && root.ENERGY_DATA.countries[code];
    if (!country) return { error: "country" };
    var hours = number(input.dailyHours, 0), kva = number(input.genKVA, 0), energy = number(input.dailyKWh, 0);
    if (!valid(hours, 0.01, 24) || !valid(kva, 0, 100000) || !valid(energy, 0, 1000000) || (!kva && !energy)) return { error: "load" };
    if (!energy) energy = 0.8 * kva * hours;
    if (!kva) kva = energy / (0.8 * hours);
    var averageLoadKW = energy / hours, generatorKW = 0.8 * kva;
    if (averageLoadKW > generatorKW + 1e-9) return { error: "capacity", averageLoadKW: averageLoadKW, generatorKW: generatorKW };
    var sunHours = Number(country.solar.avgSunHours), rate = Number(country.usdRate || 1);
    var solarKW = Math.max(0.5, Math.round(2 * energy / (0.8 * sunHours)) / 2);
    var fuelPrice = number(input.fuelPrice, Number(country.fuel.diesel));
    // Same daily energy on both sides; nameplate capacity is not assumed consumption.
    // 0.28 L/kWh is a simple planning factor, not a manufacturer load curve.
    var litresHour = number(input.genLitresHour, averageLoadKW * 0.28), days = number(input.operatingDays, 365);
    var solarCapex = number(input.solarCapex, Math.round(900 * solarKW * rate));
    return {
      dailyHours: hours, dailyKWh: energy, genKVA: kva, operatingDays: days,
      averageLoadKW: averageLoadKW, generatorKW: generatorKW, fuelLitresPerKWhEstimate: 0.28,
      fuelPrice: fuelPrice, genLitresHour: litresHour,
      genCapex: Math.round(150 * kva * rate), solarCapex: solarCapex,
      genAnnualMaintenance: litresHour * hours * days * fuelPrice * 0.15,
      solarAnnualMaintenance: solarCapex * 0.03, solarReplacement5yr: 0,
      solarSizeKW: solarKW, sunHours: sunHours,
      currency: country.currency, currencySymbol: country.currencySymbol,
      snapshot: "2026-03"
    };
  };
  engine.calculateComparison = function (input, code) {
    var defaults = engine.planningDefaults(input, code);
    if (defaults.error) return defaults;
    var resolved = Object.assign({}, defaults), basis = {};
    var fields = ["operatingDays", "fuelPrice", "genLitresHour", "genCapex", "solarCapex", "genAnnualMaintenance", "solarAnnualMaintenance", "solarReplacement5yr"];
    for (var index = 0; index < fields.length; index++) {
      var key = fields[index], supplied = input[key] != null && input[key] !== "";
      resolved[key] = number(input[key], defaults[key]);
      var min = key === "operatingDays" ? 1 : key === "genLitresHour" ? 0.000001 : 0;
      var max = key === "operatingDays" ? 366 : key === "genLitresHour" ? 100000 : 1e15;
      if (!valid(resolved[key], min, max)) return { error: "assumption", field: key };
      basis[key] = supplied ? "user_entered" : "planning_default";
    }
    var annualLitres = resolved.genLitresHour * resolved.dailyHours * resolved.operatingDays;
    var annualFuel = annualLitres * resolved.fuelPrice;
    var generatorOperating = annualFuel + resolved.genAnnualMaintenance;
    var solarOperating = resolved.solarAnnualMaintenance + resolved.solarReplacement5yr / 5;
    var generatorTotal = resolved.genCapex + generatorOperating * 5;
    var solarTotal = resolved.solarCapex + solarOperating * 5;
    var annualSaving = generatorOperating - solarOperating;
    var extraCapital = resolved.solarCapex - resolved.genCapex;
    var payback = extraCapital > 0 && annualSaving > 0 ? extraCapital / annualSaving : null;
    if (payback !== null && !Number.isFinite(payback)) return { error: "range" };
    var breakdown = {
      annualLitres: annualLitres, annualFuel: annualFuel,
      genCapital: resolved.genCapex, genFuel5yr: annualFuel * 5,
      genMaintenance5yr: resolved.genAnnualMaintenance * 5, genTotal: generatorTotal,
      solarCapital: resolved.solarCapex, solarMaintenance5yr: resolved.solarAnnualMaintenance * 5,
      solarReplacement5yr: resolved.solarReplacement5yr, solarTotal: solarTotal,
      savings5yr: generatorTotal - solarTotal, annualSaving: annualSaving, extraCapital: extraCapital
    };
    if (Object.keys(breakdown).some(function (key) { return !Number.isFinite(breakdown[key]); })) return { error: "range" };
    function money(value) { return resolved.currency + " " + Math.round(value).toLocaleString("en-US"); }
    return {
      gen5yrTotal: money(generatorTotal), solar5yrTotal: money(solarTotal),
      savings5yr: money(Math.abs(generatorTotal - solarTotal)) + (generatorTotal >= solarTotal ? " (solar nafuu)" : " (jenereta nafuu)"),
      paybackYrs: extraCapital <= 0 ? "Mtaji wa solar si mkubwa zaidi" : annualSaving <= 0 ? "Hakuna akiba ya mwaka" : payback.toFixed(1) + " miaka",
      paybackYears: payback, assumptions: resolved, assumptionBasis: basis, breakdown: breakdown,
      solarSizeKW: resolved.solarSizeKW
    };
  };
})(window);
