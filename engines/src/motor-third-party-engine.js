!function () {
  "use strict";
  window.AfroTools = window.AfroTools || {};
  var DB = window.AfroTools.insuranceData;
  window.AfroTools.MotorThirdPartyEngine = {
    calculate: function (inp, cc) {
      var C = DB && DB.countries && DB.countries[cc] ? DB.countries[cc] : null;
      if (!C) return { error: "Country data not available" };
      var sym = C.symbol || "", cur = C.currency || "";
      function fmt(v) { return v == null ? sym + "0" : sym + Math.round(v).toLocaleString(); }

      var vehicleType = inp.vehicleType || "Private Car";
      var engineCap = inp.engineCapacity || "1500-2000cc";
      var usage = inp.usage || "Private";
      var tp = (C.motor && C.motor.thirdParty) || { min: 5e3, max: 15e3, mandatory: true };
      var baseMin = tp.min || 0, baseMax = tp.max || 0;

      // A min==max==0 market has no priced compulsory third-party product
      // (e.g. South Africa: the Road Accident Fund is funded by a fuel levy, not
      // a policy). Never fabricate a premium from the missing-data fallback.
      var none = baseMin <= 0 && baseMax <= 0;

      var factor = (vehicleType.indexOf("Motorcycle") >= 0 ? .5 : vehicleType.indexOf("Truck") >= 0 || vehicleType.indexOf("Bus") >= 0 ? 2 : vehicleType.indexOf("Minibus") >= 0 ? 1.5 : vehicleType.indexOf("Commercial") >= 0 ? 1.3 : 1)
        * (engineCap.indexOf("Below 1000") >= 0 ? .7 : engineCap.indexOf("1000-1500") >= 0 ? .85 : engineCap.indexOf("2000-3000") >= 0 ? 1.15 : engineCap.indexOf("Above 3000") >= 0 ? 1.3 : 1)
        * (usage.indexOf("Commercial") >= 0 ? 1.3 : usage.indexOf("Hire") >= 0 || usage.indexOf("Taxi") >= 0 ? 1.5 : 1);

      var out = { country: C.name, currency: cur, symbol: sym };
      out.minimumPremium = none ? "Not applicable" : fmt(Math.round(baseMin * factor));
      out.maximumPremium = none ? "Not applicable" : fmt(Math.round(baseMax * factor));
      out.mandatoryStatus = tp.mandatory !== false ? "Mandatory by law" : "Not mandatory for private vehicles";
      out.regulator = C.regulator || "National Insurance Regulator";
      out.providers = (C.motor && C.motor.providers || []).join(", ");
      out.notes = tp.notes || "Motor third-party liability insurance is legally required to drive on public roads.";
      return out;
    }
  };
}();
