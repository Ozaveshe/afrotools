!function() {
  "use strict";
  window.AfroTools = window.AfroTools || {};
  var r = window.AfroTools.insuranceData;
  window.AfroTools.MotorThirdPartyEngine = {
    calculate: function(o, e) {
      var n = r && r.countries && r.countries[e] ? r.countries[e] : null;
      if (!n) {
        return {
          error: "Country data not available"
        };
      }
      var i = n.symbol || "", a = n.currency || "";
      function t(r) {
        return null == r ? i + "0" : i + Math.round(r).toLocaleString();
      }
      var u = {
        country: n.name,
        currency: a,
        symbol: i
      }, d = o.vehicleType || "Private Car", l = o.engineCapacity || "1500-2000cc", c = o.usage || "Private", m = n.motor ? n.motor.thirdParty : {
        min: 5e3,
        max: 15e3,
        mandatory: !0
      }, s = m.min || 5e3, f = m.max || 15e3, y = (d.indexOf("Motorcycle") >= 0 ? .5 : d.indexOf("Truck") >= 0 || d.indexOf("Bus") >= 0 ? 2 : d.indexOf("Minibus") >= 0 ? 1.5 : d.indexOf("Commercial") >= 0 ? 1.3 : 1) * (l.indexOf("Below 1000") >= 0 ? .7 : l.indexOf("1000-1500") >= 0 ? .85 : l.indexOf("2000-3000") >= 0 ? 1.15 : l.indexOf("Above 3000") >= 0 ? 1.3 : 1) * (c.indexOf("Commercial") >= 0 ? 1.3 : c.indexOf("Hire") >= 0 || c.indexOf("Taxi") >= 0 ? 1.5 : 1);
      return u.minimumPremium = t(Math.round(s * y)), u.maximumPremium = t(Math.round(f * y)),
      u.mandatoryStatus = !1 !== m.mandatory ? "Mandatory by law" : "Not mandatory for private vehicles",
      u.regulator = n.regulator || "National Insurance Regulator", u.providers = (n.motor && n.motor.providers || []).join(", "),
      u.notes = m.notes || "Motor third-party liability insurance is legally required to drive on public roads.",
      u;
    }
  };
}();
