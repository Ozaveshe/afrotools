!function () {
  "use strict";
  window.AfroTools = window.AfroTools || {};
  var DB = window.AfroTools.insuranceData;
  window.AfroTools.CarInsuranceEngine = {
    calculate: function (inp, cc) {
      var C = DB && DB.countries && DB.countries[cc] ? DB.countries[cc] : null;
      if (!C) return { error: "Country data not available." };
      var sym = C.symbol || "", cur = C.currency || "";
      function fmt(v) { return v == null ? sym + "0" : sym + Math.round(v).toLocaleString(); }

      // A comprehensive premium and the excess are a percentage of the sum
      // insured. Defaulting a missing vehicle value to 0 would render cover as a
      // misleading "0" (free), so force the input instead of costing it at zero.
      var value = parseFloat(inp.vehicleValue) || 0;
      if (!(value > 0)) return { error: "Enter your vehicle value to estimate comprehensive cover." };

      var age = parseFloat(inp.vehicleAge) || 0;
      var driverAge = parseFloat(inp.driverAge) || 30;
      var licensed = parseFloat(inp.yearsLicensed) || 1;
      var claims = parseInt(inp.claimHistory) || 0;
      var motor = C.motor || {};
      var tp = motor.thirdParty || { min: 5e3, max: 15e3, mandatory: true };
      var compMin = (motor.comprehensive ? motor.comprehensive.rateMin : 3) / 100;
      var compMax = (motor.comprehensive ? motor.comprehensive.rateMax : 8) / 100;

      // Driver-risk factor applies to comprehensive underwriting only.
      var risk = (age > 10 ? 1.3 : age > 5 ? 1.15 : age > 2 ? 1 : .95)
        * (driverAge < 25 ? 1.25 : driverAge > 55 ? 1.1 : 1)
        * (licensed < 2 ? 1.2 : licensed < 5 ? 1.05 : .95)
        * (claims === 0 ? .9 : claims === 1 ? 1 : claims === 2 ? 1.2 : 1.4);

      var out = { country: C.name, currency: cur, symbol: sym };
      var compLo = value * compMin * risk, compHi = value * compMax * risk;
      out.comprehensiveMin = fmt(compLo);
      out.comprehensiveMax = fmt(compHi);

      // Third-party is a regulated/tariff price, not driver-risk-rated. Show the
      // published band as-is; a min==max market (e.g. Nigeria's NAICOM 15,000)
      // must not be discounted below its statutory rate by the risk factor.
      var tpMin = tp.min || 0, tpMax = tp.max || 0;
      var tpNone = tpMin <= 0 && tpMax <= 0; // no priced product (e.g. South Africa's RAF fuel levy)
      out.thirdPartyMin = tpNone ? "Not applicable" : fmt(tpMin);
      out.thirdPartyMax = tpNone ? "Not applicable" : fmt(tpMax);

      out.thirdPartyMandatory = !motor.thirdParty || !!motor.thirdParty.mandatory;
      out.providers = (motor.providers || []).join(", ");
      out.excess = fmt(.01 * value);
      out.savingTip = claims === 0
        ? "Your clean record saves you ~10% (No Claim Discount)."
        : "Consider defensive driving courses to reduce premiums.";
      out.annualThirdParty = tpNone ? "Not applicable" : fmt((tpMin + tpMax) / 2);
      out.annualComprehensive = fmt((compLo + compHi) / 2);
      return out;
    }
  };
}();
