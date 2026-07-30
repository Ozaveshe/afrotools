(function (root, factory) {
  'use strict';
  var engine = factory();
  if (typeof module === 'object' && module.exports) module.exports = engine;
  root.AfroTools = root.AfroTools || {};
  root.AfroTools.ScaffoldingEngine = engine;
}(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var RATES = {
    NG:{ sym:'₦', tube_rent_wk:800, tube_buy:4500, board_rent_wk:400, board_buy:2200, coupler_rent_wk:120, coupler_buy:650, bamboo_rent_wk:200, labour_m2:3500 },
    KE:{ sym:'KES', tube_rent_wk:320, tube_buy:1800, board_rent_wk:160, board_buy:880, coupler_rent_wk:48, coupler_buy:260, bamboo_rent_wk:80, labour_m2:1400 },
    ZA:{ sym:'ZAR', tube_rent_wk:90, tube_buy:520, board_rent_wk:45, board_buy:260, coupler_rent_wk:14, coupler_buy:75, bamboo_rent_wk:0, labour_m2:420 },
    GH:{ sym:'GHS', tube_rent_wk:70, tube_buy:400, board_rent_wk:35, board_buy:200, coupler_rent_wk:11, coupler_buy:58, bamboo_rent_wk:18, labour_m2:320 },
    EG:{ sym:'EGP', tube_rent_wk:75, tube_buy:430, board_rent_wk:38, board_buy:215, coupler_rent_wk:12, coupler_buy:62, bamboo_rent_wk:0, labour_m2:350 },
    ET:{ sym:'ETB', tube_rent_wk:180, tube_buy:1000, board_rent_wk:90, board_buy:500, coupler_rent_wk:27, coupler_buy:150, bamboo_rent_wk:45, labour_m2:850 },
    TZ:{ sym:'TZS', tube_rent_wk:6500, tube_buy:36000, board_rent_wk:3200, board_buy:18000, coupler_rent_wk:960, coupler_buy:5400, bamboo_rent_wk:1600, labour_m2:30000 },
    UG:{ sym:'UGX', tube_rent_wk:8500, tube_buy:47000, board_rent_wk:4200, board_buy:23000, coupler_rent_wk:1260, coupler_buy:7000, bamboo_rent_wk:2100, labour_m2:40000 },
    RW:{ sym:'RWF', tube_rent_wk:1400, tube_buy:7800, board_rent_wk:700, board_buy:3900, coupler_rent_wk:210, coupler_buy:1170, bamboo_rent_wk:350, labour_m2:6500 },
    MA:{ sym:'MAD', tube_rent_wk:35, tube_buy:200, board_rent_wk:18, board_buy:100, coupler_rent_wk:5, coupler_buy:29, bamboo_rent_wk:0, labour_m2:165 }
  };

  function finitePositive(value) {
    value = Number(value);
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  function calculate(input) {
    input = input || {};
    var rate = RATES[input.country];
    var perimeter = finitePositive(input.perimeter);
    var height = finitePositive(input.height);
    var weeks = finitePositive(input.weeks);
    var type = input.type === 'bamboo' ? 'bamboo' : 'steel';
    var mode = input.mode === 'buy' ? 'buy' : 'rent';
    if (!rate || perimeter === null || height === null || weeks === null) {
      return { ok:false, error:'invalid-input' };
    }
    var area = perimeter * height;
    var tubes = Math.ceil(area / 1.5);
    var boards = Math.ceil(perimeter * Math.ceil(height / 2));
    var couplers = Math.ceil(tubes * 2.5);
    var materialCost;
    if (type === 'bamboo') {
      materialCost = mode === 'buy' ? 0 : tubes * rate.bamboo_rent_wk * weeks;
    } else if (mode === 'rent') {
      materialCost = tubes * rate.tube_rent_wk * weeks +
        boards * rate.board_rent_wk * weeks +
        couplers * rate.coupler_rent_wk * weeks;
    } else {
      materialCost = tubes * rate.tube_buy + boards * rate.board_buy + couplers * rate.coupler_buy;
    }
    var labourCost = input.includeLabour ? area * rate.labour_m2 : 0;
    return {
      ok:true, country:input.country, symbol:rate.sym, perimeter:perimeter, height:height,
      weeks:weeks, type:type, mode:mode, includeLabour:!!input.includeLabour,
      area:area, tubes:tubes, boards:boards, couplers:couplers,
      materialCost:materialCost, labourCost:labourCost, total:materialCost + labourCost,
      materialCostPerM2:mode === 'rent' ? materialCost / area / weeks : materialCost / area
    };
  }

  return { rates:RATES, calculate:calculate };
}));
