(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.AfroToolsHomeSecurityCost = api;
})(typeof window !== "undefined" ? window : this, function () {
  "use strict";

  var CONTROL_CONTRACT = [
    { id: "country", defaultValue: "NG", values: ["NG", "KE", "ZA", "GH", "EG", "TZ"] },
    { id: "homeType", defaultValue: "bungalow", values: ["flat", "bungalow", "duplex", "mansion"] },
    { id: "riskLevel", defaultValue: "medium", values: ["low", "medium", "high"] },
    { id: "securityLevel", defaultValue: "standard", values: ["basic", "standard", "premium"] }
  ];
  var COSTS = {
    NG: { cctv:{basic:[150000,300000],standard:[250000,500000],premium:[500000,1500000]}, alarm:{basic:[50000,150000],standard:[100000,250000],premium:[200000,500000]}, guard:{unarmed:80000,armed:150000}, monitoring:15000, maintenance:5000 },
    KE: { cctv:{basic:[20000,50000],standard:[40000,100000],premium:[80000,200000]}, alarm:{basic:[8000,20000],standard:[15000,35000],premium:[30000,80000]}, guard:{unarmed:15000,armed:30000}, monitoring:2000, maintenance:700 },
    ZA: { cctv:{basic:[5000,12000],standard:[10000,25000],premium:[20000,60000]}, alarm:{basic:[2000,5000],standard:[4000,10000],premium:[8000,25000]}, guard:{unarmed:8000,armed:18000}, monitoring:500, maintenance:200 },
    GH: { cctv:{basic:[3000,7000],standard:[6000,15000],premium:[12000,35000]}, alarm:{basic:[1200,3000],standard:[2500,6000],premium:[5000,15000]}, guard:{unarmed:700,armed:1500}, monitoring:300, maintenance:120 },
    EG: { cctv:{basic:[8000,20000],standard:[15000,40000],premium:[30000,100000]}, alarm:{basic:[3000,8000],standard:[6000,15000],premium:[12000,35000]}, guard:{unarmed:2000,armed:4000}, monitoring:800, maintenance:300 },
    TZ: { cctv:{basic:[80000,200000],standard:[150000,400000],premium:[300000,1000000]}, alarm:{basic:[30000,80000],standard:[60000,150000],premium:[120000,350000]}, guard:{unarmed:80000,armed:150000}, monitoring:15000, maintenance:5000 }
  };
  var SYMBOLS = { NG:"NGN ", KE:"KES ", ZA:"ZAR ", GH:"GHS ", EG:"EGP ", TZ:"TZS " };
  var HOME_MULTIPLIERS = { flat:0.7, bungalow:1, duplex:1.4, mansion:2.5 };

  function contractFor(id) {
    return CONTROL_CONTRACT.find(function (control) { return control.id === id; });
  }

  function selection(input, id) {
    var control = contractFor(id);
    var value = input && input[id];
    if (!control || control.values.indexOf(value) === -1) {
      var error = new RangeError(id);
      error.code = "invalid_" + id;
      throw error;
    }
    return value;
  }

  function midpoint(range) {
    return (range[0] + range[1]) / 2;
  }

  function calculate(input) {
    var country = selection(input, "country");
    var homeType = selection(input, "homeType");
    var riskLevel = selection(input, "riskLevel");
    var securityLevel = selection(input, "securityLevel");
    var costs = COSTS[country];
    var cctvSetup = midpoint(costs.cctv[securityLevel]) * HOME_MULTIPLIERS[homeType];
    var alarmSetup = midpoint(costs.alarm[securityLevel]);
    var guardMonthly = securityLevel === "premium"
      ? (riskLevel === "high" ? costs.guard.armed : costs.guard.unarmed)
      : 0;
    var monitoring = securityLevel === "basic" ? 0 : costs.monitoring;
    var maintenance = costs.maintenance;
    var totalSetup = cctvSetup + (securityLevel === "basic" ? 0 : alarmSetup);
    var totalMonthly = guardMonthly + monitoring + maintenance;
    return {
      country: country,
      homeType: homeType,
      riskLevel: riskLevel,
      securityLevel: securityLevel,
      currency: SYMBOLS[country],
      cctvSetup: cctvSetup,
      alarmSetup: alarmSetup,
      guardMonthly: guardMonthly,
      monitoring: monitoring,
      maintenance: maintenance,
      totalSetup: totalSetup,
      totalMonthly: totalMonthly,
      annualCost: totalSetup / 5 + totalMonthly * 12,
      fiveYear: totalSetup + totalMonthly * 60
    };
  }

  return {
    CONTROL_CONTRACT: CONTROL_CONTRACT.map(function (control) {
      return { id:control.id, defaultValue:control.defaultValue, values:control.values.slice() };
    }),
    calculate: calculate
  };
});
