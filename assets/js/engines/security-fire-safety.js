(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.AfroToolsSecurityFire = api;
})(typeof window !== "undefined" ? window : this, function () {
  "use strict";

  var WEIGHTS = [8, 10, 7, 5, 8, 7, 5, 8, 6, 6, 5, 6, 5, 4, 5, 3, 2];
  var SYMBOLS = { NG: "NGN ", ZA: "ZAR ", KE: "KES ", GH: "GHS " };
  var ITEM_COSTS = {
    NG: { c1:15000,c2:500000,c3:120000,c4:200000,c5:8000,c6:80000,c7:20000,c8:5000,c9:3000,c10:5000,c11:15000,c12:30000,c13:50000,c14:5000,c15:40000,c16:0,c17:5000 },
    ZA: { c1:800,c2:30000,c3:8000,c4:12000,c5:500,c6:5000,c7:1200,c8:300,c9:200,c10:300,c11:800,c12:2000,c13:3000,c14:300,c15:2500,c16:0,c17:300 },
    KE: { c1:2000,c2:80000,c3:20000,c4:35000,c5:1200,c6:15000,c7:3000,c8:800,c9:500,c10:800,c11:2000,c12:5000,c13:8000,c14:800,c15:6000,c16:0,c17:800 },
    GH: { c1:1200,c2:50000,c3:12000,c4:20000,c5:700,c6:9000,c7:1800,c8:500,c9:300,c10:500,c11:1200,c12:3000,c13:5000,c14:500,c15:3500,c16:0,c17:500 }
  };
  var PROPERTY_MULTIPLIERS = { office:1,warehouse:1.3,retail:1,restaurant:1.5,hospital:2,school:1.4 };
  var DOMAINS = [
    { id:"suppression",max:30,indices:[1,2,3,4] },
    { id:"detection",max:20,indices:[5,6,7] },
    { id:"evacuation",max:25,indices:[8,9,10,11] },
    { id:"documentation",max:15,indices:[12,13,14] },
    { id:"electrical",max:10,indices:[15,16,17] }
  ];

  function finite(value, min, max, label) {
    var number = Number(value);
    if (!Number.isFinite(number) || number < min || number > max) throw new RangeError(label);
    return number;
  }

  function calculate(input) {
    var country = Object.prototype.hasOwnProperty.call(ITEM_COSTS, input.country) ? input.country : "NG";
    var propertyType = Object.prototype.hasOwnProperty.call(PROPERTY_MULTIPLIERS, input.propType) ? input.propType : "office";
    var area = finite(input.area, 10, 1000000, "area");
    var floors = finite(input.floors, 1, 300, "floors");
    var occupants = finite(input.occupants, 1, 1000000, "occupants");
    var selected = new Set(Array.isArray(input.checks) ? input.checks : []);
    var costs = ITEM_COSTS[country];
    var propertyMultiplier = PROPERTY_MULTIPLIERS[propertyType];
    var checkedPoints = 0;
    var failed = [];
    var remediation = 0;
    WEIGHTS.forEach(function (points, index) {
      var id = "c" + (index + 1);
      if (selected.has(id)) {
        checkedPoints += points;
      } else {
        var cost = (costs[id] || 0) * propertyMultiplier;
        failed.push({ id: id, points: points, cost: cost });
        remediation += cost;
      }
    });
    remediation *= Math.ceil(area / 200) * 0.5 + 0.5;
    return {
      score: Math.round(checkedPoints),
      checkedPoints: checkedPoints,
      totalPoints: 100,
      failed: failed,
      remediation: remediation,
      maintenance: remediation * 0.05,
      currency: SYMBOLS[country],
      area: area,
      floors: floors,
      occupants: occupants,
      domains: DOMAINS.map(function (domain) {
        var score = domain.indices.reduce(function (sum, index) {
          return sum + (selected.has("c" + index) ? WEIGHTS[index - 1] : 0);
        }, 0);
        return { id: domain.id, score: score, max: domain.max };
      })
    };
  }

  return {
    WEIGHTS: WEIGHTS.slice(),
    SYMBOLS: Object.assign({}, SYMBOLS),
    DOMAINS: DOMAINS.map(function (domain) { return Object.assign({}, domain, { indices: domain.indices.slice() }); }),
    calculate: calculate
  };
});
