(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.AfroToolsElectricalLoadEngine = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var BREAKERS = [6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160];
  var GENERATORS = [
    2.5, 3.5, 5, 6.5, 8, 10, 12.5, 15, 20, 25, 30, 40, 50, 60, 80, 100,
  ];
  var PROFILES = {
    NG: {
      name: "Nigeria",
      voltage: 230,
      tariff: 68,
      currency: "NGN",
      symbol: "₦",
    },
    KE: {
      name: "Kenya",
      voltage: 240,
      tariff: 25,
      currency: "KES",
      symbol: "KSh",
    },
    ZA: {
      name: "South Africa",
      voltage: 230,
      tariff: 3.5,
      currency: "ZAR",
      symbol: "R",
    },
    GH: {
      name: "Ghana",
      voltage: 230,
      tariff: 1.8,
      currency: "GHS",
      symbol: "GH₵",
    },
    EG: {
      name: "Egypt",
      voltage: 220,
      tariff: 2,
      currency: "EGP",
      symbol: "E£",
    },
  };
  var APPLIANCES = {
    Lighting: [
      ["LED Bulb", 10],
      ["Fluorescent Tube (36W)", 36],
      ["Security Light", 100],
      ["Recessed Downlight", 15],
      ["Floodlight (exterior)", 50],
    ],
    Kitchen: [
      ["Refrigerator", 150],
      ["Freezer (chest)", 200],
      ["Microwave", 1000],
      ["Electric Cooker", 2000],
      ["Electric Kettle", 2200],
      ["Blender", 400],
      ["Toaster", 800],
      ["Rice Cooker", 700],
    ],
    Cooling: [
      ["Standing Fan", 75],
      ["Ceiling Fan", 60],
      ["AC 1HP (split)", 750],
      ["AC 1.5HP (split)", 1120],
      ["AC 2HP (split)", 1500],
      ["AC 2.5HP (split)", 1900],
    ],
    Heating: [
      ["Water Heater (geyser)", 2000],
      ["Immersion Heater", 3000],
      ["Electric Iron", 1000],
      ["Room Heater", 1500],
    ],
    Entertainment: [
      ['TV (LED 43")', 100],
      ['TV (LED 55")', 150],
      ["Home Theatre System", 300],
      ["DSTV / Decoder", 30],
      ["Gaming Console", 200],
      ["Sound Bar", 60],
    ],
    Office: [
      ["Laptop", 65],
      ["Desktop Computer", 300],
      ["Printer", 500],
      ["Router / Modem", 15],
      ["Monitor", 40],
      ["UPS (small)", 150],
    ],
    Laundry: [
      ["Washing Machine", 500],
      ["Tumble Dryer", 2500],
      ["Iron", 1000],
    ],
    "Power Tools": [
      ["Angle Grinder", 800],
      ["Electric Drill", 600],
      ["Welding Machine", 3000],
      ["Circular Saw", 1200],
    ],
    Water: [
      ["Borehole Pump (0.75kW)", 750],
      ["Borehole Pump (1.5kW)", 1500],
      ["Borehole Pump (2.2kW)", 2200],
      ["Pressure Pump", 370],
    ],
    Other: [
      ["Phone Charger", 15],
      ["Hair Dryer", 1500],
      ["CCTV Camera", 15],
      ["Gate Motor", 200],
      ["Electric Fence Energiser", 100],
    ],
  };

  function finite(value, field, min, max) {
    var number = Number(value);
    if (!Number.isFinite(number) || number < min || number > max)
      throw new Error(field);
    return number;
  }
  function categoryFor(name) {
    var value = String(name || "").toLowerCase();
    var found = "Other";
    Object.keys(APPLIANCES).forEach(function (category) {
      APPLIANCES[category].forEach(function (entry) {
        if (value.indexOf(entry[0].split(" ")[0].toLowerCase()) !== -1)
          found = category;
      });
    });
    return found;
  }
  function nextAtLeast(values, required) {
    for (var i = 0; i < values.length; i += 1)
      if (values[i] >= required) return values[i];
    return values[values.length - 1];
  }
  function cableFor(amps) {
    if (amps <= 15) return "1.5mm²";
    if (amps <= 20) return "2.5mm²";
    if (amps <= 30) return "4.0mm²";
    if (amps <= 40) return "6.0mm²";
    if (amps <= 60) return "10mm²";
    if (amps <= 80) return "16mm²";
    if (amps <= 100) return "25mm²";
    return "25mm²+";
  }
  function calculate(input) {
    input = input || {};
    var profile = PROFILES[input.countryCode];
    if (!profile) throw new Error("countryCode");
    var phases = finite(input.phases, "phases", 1, 3);
    if (phases !== 1 && phases !== 3) throw new Error("phases");
    var diversity = finite(input.diversity, "diversity", 0.1, 1);
    var rows = Array.isArray(input.appliances) ? input.appliances : [];
    if (!rows.length) throw new Error("appliances");
    var appliances = rows.map(function (row, index) {
      var name = String(row.name || "").trim();
      if (!name) throw new Error("appliances[" + index + "].name");
      var watts = finite(
        row.watts,
        "appliances[" + index + "].watts",
        1,
        1000000,
      );
      var quantity = finite(
        row.quantity,
        "appliances[" + index + "].quantity",
        1,
        50,
      );
      var hours = finite(
        row.hoursPerDay,
        "appliances[" + index + "].hoursPerDay",
        0,
        24,
      );
      if (!Number.isInteger(quantity))
        throw new Error("appliances[" + index + "].quantity");
      var connectedWatts = watts * quantity;
      return {
        name: name,
        watts: watts,
        quantity: quantity,
        hoursPerDay: hours,
        connectedWatts: connectedWatts,
        monthlyKwh: (connectedWatts * hours * 30) / 1000,
        category: categoryFor(name),
      };
    });
    var totalWatts = appliances.reduce(function (sum, row) {
      return sum + row.connectedWatts;
    }, 0);
    var monthlyKwh = appliances.reduce(function (sum, row) {
      return sum + row.monthlyKwh;
    }, 0);
    var demandWatts = totalWatts * diversity;
    var demandKw = demandWatts / 1000;
    var amps =
      phases === 1
        ? demandWatts / profile.voltage
        : demandWatts / (profile.voltage * 1.732);
    var breakerRequired = amps * 1.25;
    var generatorRequired = Math.ceil((demandKw / 0.8) * 1.25);
    var recommendation =
      demandKw > 13 && phases === 1
        ? "three-phase-review"
        : demandKw > 8 && phases === 1
          ? "single-phase-limit"
          : "within-selected-phase";
    return {
      version: "electrical-load-legacy-screen-v1",
      sourceState: "undated-static-assumptions",
      confidence: "low",
      countryCode: input.countryCode,
      profile: profile,
      phases: phases,
      diversity: diversity,
      appliances: appliances,
      totalKw: totalWatts / 1000,
      demandKw: demandKw,
      amps: amps,
      breakerAmps: nextAtLeast(BREAKERS, breakerRequired),
      breakerRangeExceeded: breakerRequired > BREAKERS[BREAKERS.length - 1],
      cablePrompt: cableFor(amps),
      generatorKva: nextAtLeast(GENERATORS, generatorRequired),
      generatorRangeExceeded:
        generatorRequired > GENERATORS[GENERATORS.length - 1],
      monthlyKwh: monthlyKwh,
      monthlyCost: Math.round(monthlyKwh * profile.tariff),
      recommendation: recommendation,
    };
  }
  return {
    calculate: calculate,
    profiles: PROFILES,
    appliances: APPLIANCES,
    breakerSizes: BREAKERS,
    generatorSizes: GENERATORS,
  };
});
