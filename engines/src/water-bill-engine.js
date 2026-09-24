!function() {
  "use strict";
  window.AfroTools = window.AfroTools || {}, window.AfroTools.WaterBillEngine = {
    calculate: function(e, r) {
      if (r === 'ET') {
        if (e.tariffMode === 'addis-149-year5') {
          var usage149 = Number(e.monthlyUsage), fee149 = Number(e.customFee);
          if (e.monthlyUsage === '' || e.monthlyUsage == null || !Number.isFinite(usage149) || usage149 < 0 ||
              e.customFee === '' || e.customFee == null || !Number.isFinite(fee149) || fee149 < 0 ||
              ['domestic', 'non-domestic'].indexOf(e.customerType) === -1) {
            return { error: 'Enter nonnegative monthly usage and other charges, and select a customer class.' };
          }
          // Regulation 149/2023, articles 4-5; Schedule I fifth-year column;
          // Schedule 5 item 11 specifies a 3 m³ minimum billable consumption.
          // This is a dated schedule model, not confirmation of current implementation.
          var volume149 = Math.max(3, usage149);
          var limits149 = [5, 14, 23, 32, 41, 50, Infinity];
          var rates149 = [22.17, 38.80, 72.07, 110.87, 133.04, 155.22, 177.39];
          var lines149 = [], charge149 = 0, lower149 = 0;
          for (var b149 = 0; b149 < limits149.length; b149++) {
            if (e.customerType === 'non-domestic') {
              if (volume149 <= limits149[b149]) {
                charge149 = volume149 * rates149[b149];
                lines149.push({ volume: volume149, rate: rates149[b149], amount: charge149 });
                break;
              }
            } else {
              var block149 = Math.max(0, Math.min(volume149, limits149[b149]) - lower149);
              if (block149 > 0) {
                lines149.push({ volume: block149, rate: rates149[b149], amount: block149 * rates149[b149] });
                charge149 += block149 * rates149[b149];
              }
              lower149 = limits149[b149];
            }
          }
          if (!Number.isFinite(charge149 + fee149)) return { error: 'These inputs exceed the supported calculation range.' };
          return {
            waterCharge: Math.round(charge149 * 100) / 100,
            otherCharges: fee149,
            total: Math.round((charge149 + fee149) * 100) / 100,
            billableUsage: volume149, actualUsage: usage149, breakdown: lines149,
            schedule: 'Regulation 149/2023, fifth year: 8 July 2026 to 7 July 2027',
            observations: ['Dated schedule estimate; later adjustments and current provider implementation are not confirmed.',
              'Water charge plus your entered other charges. Sewerage, meter rent, waste collection, tax and arrears are not added automatically.',
              'Minimum billable consumption is 3 m³. Domestic blocks are progressive; non-domestic consumption uses the rate of the reached block.']
          };
        }
        var required = ['monthlyUsage', 'householdSize', 'customRate', 'customFee'];
        if (required.some(function(key) { return e[key] === '' || e[key] == null || !Number.isFinite(Number(e[key])); })) {
          return { error: 'Enter usage, household size, a rate and other charges. Enter 0 for no other charges.' };
        }
        var usage = Number(e.monthlyUsage), people = Number(e.householdSize);
        var rate = Number(e.customRate), fee = Number(e.customFee);
        if (usage <= 0 || !Number.isInteger(people) || people < 1 || rate <= 0 || fee < 0) {
          return { error: 'Usage and rate must be positive; household size must be a positive whole number; other charges cannot be negative.' };
        }
        var charge = usage * rate, total = charge + fee;
        if (!Number.isFinite(total)) return { error: 'These inputs exceed the supported calculation range.' };
        function birr(value) { return 'ETB ' + value.toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
        return {
          monthlyBill: birr(total), energyCharge: birr(charge), fixedCharge: birr(fee), ratePerM3: birr(rate),
          dailyUsageLitres: (usage * 1000 / 30).toFixed(1) + ' L',
          perPersonPerDay: (usage * 1000 / 30 / people).toFixed(1) + ' L/person',
          observations: ['Planning estimate using your entered rate and other charges, not a verified provider tariff.',
            'Formula: ' + usage + ' m³ × ETB ' + rate + ' + ETB ' + fee + '.',
            'Assumes a flat rate and a 30-day month. Tiered tariffs, sewerage, tax and arrears are not calculated automatically.'],
          countryName: 'Ethiopia', currencySymbol: 'ETB '
        };
      }
      var a = ENERGY_DATA.countries[r];
      if (!a) {
        return {
          error: "Country data not available."
        };
      }
      var t = parseFloat(e.monthlyUsage) || 0, n = e.customerType || "residential", o = parseInt(e.householdSize) || 4;
      if (t <= 0) {
        return {
          error: "Please enter valid monthly water usage (m³)."
        };
      }
      var i = a.currencySymbol, s = a.water, l = "commercial" === n ? s.commercial || 1.5 * s.residential : s.residential;
      if (!l || l <= 0) {
        return {
          error: "Water tariff data not available for this country."
        };
      }
      var u = t * l, c = Math.round(.08 * u), d = Math.round(u + c), h = Math.round(t / 30 * 1e3), f = o > 0 ? Math.round(h / o) : h, m = 100 * o * 30 / 1e3, y = t <= .8 * m ? "Efficient" : t <= m ? "Adequate" : "High Usage", g = [];
      return g.push("Water tariff in " + a.name + ": " + i + l.toFixed(2) + " per m³ (" + n + ")."),
      g.push("Daily usage: " + h + "L total — " + f + "L per person (WHO adequate benchmark: 100L/person/day)."),
      g.push("Efficiency rating: " + y + "."), t > 1.5 * m && g.push("Fix leaking taps — a dripping tap wastes ~20L/day. Install low-flow showerheads."),
      "residential" === n && g.push("Rainwater harvesting can offset 30–50% of residential water use in " + a.name + "."),
      {
        monthlyBill: i + d.toLocaleString(),
        energyCharge: i + Math.round(u).toLocaleString(),
        fixedCharge: i + c.toLocaleString(),
        ratePerM3: i + l.toFixed(2),
        dailyUsageLitres: h + " L",
        perPersonPerDay: f + " L/person",
        efficiencyRating: y,
        whoBenchmarkM3: m.toFixed(1) + " m³",
        observations: g,
        countryName: a.name,
        currencySymbol: i
      };
    }
  };
}();
