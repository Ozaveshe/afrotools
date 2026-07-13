!function() {
  "use strict";
  window.AfroTools = window.AfroTools || {};
  var a = window.AfroTools.insuranceData;
  window.AfroTools.TravelInsuranceEngine = {
    calculate: function(i, e) {
      var r = a && a.countries && a.countries[e] ? a.countries[e] : null;
      if (!r) {
        return {
          error: "Country data not available"
        };
      }
      var n = r.symbol || "", o = r.currency || "", t = {
        country: r.name,
        currency: o,
        symbol: n
      }, d = i.destination || "Within Africa", c = parseFloat(i.duration) || 7, l = parseInt(i.travelers) || 1, s = i.coverLevel || "Standard (medical + baggage)", u = parseFloat(i.age) || 35, m = a.travelZones || {}, f = d.indexOf("Africa") >= 0 ? m.intraAfrica : d.indexOf("Europe") >= 0 ? m.toEurope : d.indexOf("America") >= 0 ? m.toNorthAmerica : d.indexOf("Asia") >= 0 ? m.toAsia : m.worldwide;
      f || (f = {
        daily: {
          min: 5,
          max: 15
        },
        currency: "USD"
      });
      var x = s.indexOf("Basic") >= 0 ? .7 : s.indexOf("Premium") >= 0 ? 1.6 : 1, y = u > 65 ? 2 : u > 55 ? 1.5 : u > 45 ? 1.2 : 1, v = Math.round(f.daily.min * c * l * x * y), $ = Math.round(f.daily.max * c * l * x * y);
      return t.estimatedPremiumMin = "$" + v, t.estimatedPremiumMax = "$" + $, t.dailyRateMin = "$" + f.daily.min,
      t.dailyRateMax = "$" + f.daily.max, t.medicalCover = s.indexOf("Basic") >= 0 ? "$10,000-$25,000" : s.indexOf("Premium") >= 0 ? "$100,000-$500,000" : "$25,000-$100,000",
      t.baggageCover = s.indexOf("Basic") >= 0 ? "Not included" : "$500-$2,000", t.cancellationCover = s.indexOf("Premium") >= 0 ? "Up to trip cost" : "Not included",
      t.destination = d, t.duration = c + " days", t.travelers = l, t;
    }
  };
}();
