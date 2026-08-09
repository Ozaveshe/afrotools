(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.BoqGenEngine = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  var K = [
    "cement",
    "block9",
    "block6",
    "sand_m3",
    "granite_m3",
    "rebar_ton",
    "zinc_sheet",
    "clay_tile",
    "pvc_32mm",
    "pvc_110mm",
    "wire_25mm",
    "door_wood",
    "door_steel",
    "window_alum",
    "tiles_floor",
    "tiles_wall",
    "paint_5L",
    "wc_unit",
    "shower_unit",
    "sink_kitchen",
    "glass_m2",
    "plaster_bag",
    "gravel_m3",
    "inverter_kva",
  ];
  var RAW = {
    NG: [
      "NGN",
      "Nigeria",
      0.4,
      [
        10000, 350, 280, 12000, 22000, 680000, 6500, 800, 800, 3500, 1800,
        45000, 75000, 35000, 3500, 4000, 8500, 35000, 25000, 15000, 8000, 3500,
        15000, 180000,
      ],
    ],
    KE: [
      "KES",
      "Kenya",
      0.35,
      [
        680, 35, 28, 2500, 4500, 110000, 900, 85, 120, 550, 280, 8000, 12000,
        6000, 600, 700, 1400, 6000, 4500, 2500, 1200, 550, 2800, 32000,
      ],
    ],
    GH: [
      "GHS",
      "Ghana",
      0.35,
      [
        90, 5, 4, 180, 350, 8500, 85, 8, 18, 75, 40, 650, 1100, 550, 55, 65,
        120, 500, 380, 220, 110, 55, 200, 2800,
      ],
    ],
    ZA: [
      "ZAR",
      "South Africa",
      0.45,
      [
        280, 7, 5.5, 550, 980, 15000, 350, 28, 45, 220, 120, 2200, 4500, 1800,
        220, 260, 350, 1800, 1400, 650, 420, 180, 900, 6500,
      ],
    ],
    UG: [
      "UGX",
      "Uganda",
      0.35,
      [
        185000, 900, 700, 280000, 520000, 4200000, 65000, 6500, 12000, 55000,
        25000, 480000, 850000, 420000, 55000, 68000, 62000, 380000, 290000,
        160000, 95000, 48000, 320000, 1200000,
      ],
    ],
    TZ: [
      "TZS",
      "Tanzania",
      0.35,
      [
        28000, 1200, 950, 55000, 120000, 2200000, 15000, 1500, 4500, 22000,
        9000, 180000, 320000, 160000, 22000, 28000, 24000, 145000, 115000,
        62000, 38000, 18000, 72000, 480000,
      ],
    ],
    RW: [
      "RWF",
      "Rwanda",
      0.35,
      [
        12000, 500, 400, 25000, 55000, 1050000, 8000, 750, 2200, 10000, 4200,
        85000, 150000, 75000, 9500, 12000, 11000, 68000, 52000, 29000, 17000,
        8200, 32000, 220000,
      ],
    ],
    ET: [
      "ETB",
      "Ethiopia",
      0.35,
      [
        900, 22, 17, 1800, 3800, 85000, 650, 55, 180, 820, 340, 6500, 12000,
        5800, 750, 900, 820, 5200, 3900, 2200, 1400, 620, 2600, 16000,
      ],
    ],
    SN: [
      "XOF",
      "Senegal",
      0.38,
      [
        8500, 220, 175, 18000, 38000, 920000, 7500, 680, 2200, 9500, 3800,
        95000, 165000, 82000, 10500, 13000, 12500, 75000, 58000, 32000, 19000,
        9000, 35000, 250000,
      ],
    ],
    CI: [
      "XOF",
      "Côte d’Ivoire",
      0.38,
      [
        8200, 210, 165, 17000, 36000, 880000, 7200, 650, 2100, 9200, 3600,
        90000, 158000, 78000, 10000, 12500, 12000, 72000, 55000, 30000, 18000,
        8600, 33000, 240000,
      ],
    ],
    CM: [
      "XAF",
      "Cameroon",
      0.38,
      [
        8000, 200, 158, 16000, 35000, 860000, 7000, 640, 2000, 8800, 3500,
        88000, 155000, 76000, 9500, 12000, 11500, 70000, 53000, 29000, 17500,
        8200, 32000, 235000,
      ],
    ],
    ZM: [
      "ZMW",
      "Zambia",
      0.38,
      [
        120, 5.5, 4.2, 280, 580, 17000, 420, 38, 55, 270, 145, 2800, 5200, 2400,
        280, 340, 420, 2200, 1700, 820, 520, 220, 1100, 8200,
      ],
    ],
    ZW: [
      "USD",
      "Zimbabwe",
      0.4,
      [
        18, 0.45, 0.35, 45, 90, 1800, 22, 2.5, 4.5, 22, 12, 220, 420, 195, 22,
        28, 35, 180, 140, 65, 42, 18, 85, 680,
      ],
    ],
    EG: [
      "EGP",
      "Egypt",
      0.35,
      [
        3200, 22, 17, 900, 1800, 55000, 850, 75, 95, 480, 220, 4500, 8500, 4200,
        550, 680, 780, 4200, 3200, 1800, 880, 420, 1800, 18000,
      ],
    ],
    MA: [
      "MAD",
      "Morocco",
      0.38,
      [
        120, 4.5, 3.5, 180, 380, 9500, 220, 18, 28, 140, 68, 1800, 3500, 1600,
        180, 220, 320, 1400, 1100, 580, 320, 85, 680, 7200,
      ],
    ],
  };
  var BUILD_PRESETS = {
    res1: {
      area: 60,
      doors: 3,
      windows: 5,
      wc: 1,
      showers: 1,
      sinks: 1,
      beds: 1,
    },
    res2: {
      area: 90,
      doors: 4,
      windows: 7,
      wc: 2,
      showers: 2,
      sinks: 1,
      beds: 2,
    },
    res3: {
      area: 120,
      doors: 5,
      windows: 8,
      wc: 2,
      showers: 2,
      sinks: 1,
      beds: 3,
    },
    res4: {
      area: 160,
      doors: 7,
      windows: 10,
      wc: 3,
      showers: 3,
      sinks: 1,
      beds: 4,
    },
    res5: {
      area: 220,
      doors: 9,
      windows: 14,
      wc: 4,
      showers: 4,
      sinks: 1,
      beds: 5,
    },
    comm: {
      area: 100,
      doors: 4,
      windows: 10,
      wc: 2,
      showers: 0,
      sinks: 1,
      beds: 0,
    },
    warehouse: {
      area: 200,
      doors: 3,
      windows: 6,
      wc: 1,
      showers: 1,
      sinks: 1,
      beds: 0,
    },
    custom: {
      area: 0,
      doors: 4,
      windows: 8,
      wc: 2,
      showers: 2,
      sinks: 1,
      beds: 3,
    },
  };
  function country(code) {
    var row = RAW[code];
    if (!row) return null;
    var rates = {};
    K.forEach(function (key, index) {
      rates[key] = row[3][index];
    });
    return {
      code: code,
      currency: row[0],
      name: row[1],
      labourRate: row[2],
      rates: rates,
    };
  }
  function item(id, description, unit, qty, rate, note) {
    qty = Number(qty);
    rate = Number(rate) || 0;
    return {
      id: id,
      description: description,
      unit: unit,
      qty: qty,
      rate: rate,
      note: note || "",
      amount: rate > 0 ? Math.round(rate * qty) : 0,
    };
  }
  function calculate(input) {
    var cd = country(input && input.country),
      n = function (key) {
        return Number(input && input[key]);
      },
      area = n("area"),
      floors = n("floors"),
      wallHeight = n("wallHeight"),
      contingency = n("contingency"),
      doors = n("doors"),
      windows = n("windows"),
      glazedDoors = n("glazedDoors"),
      wc = n("wc"),
      showers = n("showers"),
      sinks = n("sinks"),
      beds = n("beds"),
      sockets = n("sockets"),
      inverter = Number(input && input.inverter) || 0,
      wallType = input && input.wallType,
      roofType = input && input.roofType,
      finishing = input && input.finishing;
    if (
      !cd ||
      !Number.isFinite(area) ||
      area <= 0 ||
      !Number.isFinite(floors) ||
      floors <= 0 ||
      !Number.isInteger(floors) ||
      !Number.isFinite(wallHeight) ||
      wallHeight <= 0 ||
      !Number.isFinite(contingency) ||
      contingency < 0 ||
      contingency > 100 ||
      ![doors, windows, glazedDoors, wc, showers, sinks, beds, sockets].every(
        function (v) {
          return Number.isFinite(v) && v >= 0 && Number.isInteger(v);
        },
      ) ||
      !["block9", "block6", "brick"].includes(wallType) ||
      !["zinc", "tiles", "concrete", "shingles"].includes(roofType) ||
      !["basic", "standard", "premium"].includes(finishing) ||
      ![0, 1].includes(inverter)
    )
      return { error: "invalid_boq_gen_input" };
    var r = cd.rates,
      perimeter = Math.sqrt(area) * 4,
      grossWallArea = perimeter * wallHeight * floors,
      wallOpenings = doors * 2 + windows * 1.5,
      netWallArea = grossWallArea - wallOpenings;
    if (netWallArea <= 0) return { error: "invalid_boq_gen_input" };
    var blockKey = wallType === "block9" ? "block9" : "block6",
      foundVol = perimeter * 0.45 * 0.9,
      sections = [];
    function section(id, name, items) {
      sections.push({
        id: id,
        name: name,
        items: items.filter(function (row) {
          return Number.isFinite(row.qty) && row.qty > 0;
        }),
      });
    }
    section("substructure", "A. SUBSTRUCTURE (Foundation)", [
      item(
        "excavation",
        "Excavation for strip foundation",
        "m³",
        foundVol * 1.2,
        0,
        "Labour only",
      ),
      item(
        "hardcore",
        "Hardcore fill (150mm compacted)",
        "m³",
        area * 0.15,
        r.gravel_m3,
        "Sub-base",
      ),
      item(
        "blinding-cement",
        "Cement (1:2:4 blinding, 50mm)",
        "bags",
        Math.round(area * 0.1),
        r.cement,
        "Mass concrete",
      ),
      item(
        "foundation-blocks",
        '9" blocks for foundation walls',
        "blocks",
        Math.round(perimeter * 1.2 * 10),
        r[blockKey],
        "Foundation walling",
      ),
      item(
        "foundation-mortar",
        "Portland Cement (mortar)",
        "bags",
        Math.round(area * 0.15),
        r.cement,
        "Foundation mortar",
      ),
      item(
        "foundation-sand",
        "Sharp Sand",
        "m³",
        Number((area * 0.15).toFixed(1)),
        r.sand_m3,
        "",
      ),
      item(
        "foundation-rebar",
        "Reinforcement steel (Y10, Y12)",
        "kg",
        Math.round(area * 8),
        r.rebar_ton / 1000,
        "Foundation RC",
      ),
    ]);
    section("superstructure", "B. SUPERSTRUCTURE (Walls)", [
      item(
        "wall-blocks",
        (wallType === "block9" ? '9"' : '6"') + " hollow block (walls)",
        "blocks",
        Math.round(netWallArea * 10),
        r[blockKey],
        "All floors",
      ),
      item(
        "wall-mortar",
        "Portland Cement (wall mortar)",
        "bags",
        Math.round(netWallArea * 0.15),
        r.cement,
        "1:6 mortar",
      ),
      item(
        "wall-sand",
        "Sharp Sand (wall mortar)",
        "m³",
        Number((netWallArea * 0.04).toFixed(1)),
        r.sand_m3,
        "",
      ),
      item(
        "ring-steel",
        "Ring beam steel (Y12)",
        "kg",
        Math.round(perimeter * floors * 4.5),
        r.rebar_ton / 1000,
        "Per floor ring beam",
      ),
      item(
        "ring-formwork",
        "Ring beam formwork + concrete",
        "m run",
        Math.round(perimeter * floors),
        r.cement * 1.2,
        "Estimated",
      ),
    ]);
    var roofItems =
      roofType === "zinc"
        ? [
            item(
              "zinc-sheets",
              "Long-span aluminium zinc sheet (0.55mm)",
              "sheets",
              Math.round((area * 1.2) / 3.6),
              r.zinc_sheet,
              "3.6m sheet, 10% overlap",
            ),
            item(
              "rafters",
              "Hardwood rafters (50×100mm)",
              "pcs",
              Math.round(area * 0.5),
              r.door_wood * 0.04,
              "3m spans",
            ),
            item(
              "ceiling",
              "Ceiling board (PVC or hardboard)",
              "sheets",
              Math.round(area / 2.88),
              r.paint_5L * 2,
              "1200×2400mm sheets",
            ),
            item(
              "roof-screws",
              "Roofing screws (with washers)",
              "boxes",
              Math.round(area / 25),
              r.paint_5L * 0.3,
              "Per 100 box",
            ),
            item(
              "ridge-cap",
              "Ridge cap / flashing",
              "m run",
              Math.round((perimeter / 4) * 1.2),
              r.zinc_sheet * 0.3,
              "",
            ),
          ]
        : roofType === "concrete"
          ? [
              item(
                "slab-rebar",
                "Reinforcement steel (Y12 slab)",
                "kg",
                Math.round(area * 12),
                r.rebar_ton / 1000,
                "2-way slab",
              ),
              item(
                "slab-cement",
                "Portland Cement (slab concrete)",
                "bags",
                Math.round(area * 0.55),
                r.cement,
                "1:2:4 mix",
              ),
              item(
                "slab-sand",
                "Sharp Sand",
                "m³",
                Number((area * 0.12).toFixed(1)),
                r.sand_m3,
                "",
              ),
              item(
                "slab-granite",
                "Granite aggregate",
                "m³",
                Number((area * 0.15).toFixed(1)),
                r.granite_m3,
                '3/4" granite',
              ),
              item(
                "slab-formwork",
                "Formwork (plywood + props)",
                "m²",
                Math.round(area * 1.05),
                r.paint_5L * 1.5,
                "Slab soffit",
              ),
            ]
          : [
              item(
                "clay-tiles",
                "Clay roof tiles",
                "pcs",
                Math.round(area * 12),
                r.clay_tile,
                "10% wastage",
              ),
              item(
                "tile-rafters",
                "Hardwood rafters & battens",
                "pcs",
                Math.round(area * 0.6),
                r.door_wood * 0.04,
                "",
              ),
              item(
                "ridge-tiles",
                "Ridge tiles",
                "pcs",
                Math.round((perimeter / 4) * 5),
                r.clay_tile * 1.5,
                "",
              ),
              item(
                "roof-membrane",
                "Roofing felt / membrane",
                "m²",
                Math.round(area * 1.1),
                r.glass_m2 * 0.3,
                "Underlay",
              ),
            ];
    section("roof", "C. ROOF", roofItems);
    section("openings", "D. DOORS & WINDOWS", [
      item(
        "wood-doors",
        "Wooden panel doors (900×2100mm)",
        "units",
        doors,
        r.door_wood,
        "Standard internal",
      ),
      item(
        "steel-doors",
        "Steel security door (main entrance)",
        "units",
        Math.max(1, Math.round(doors * 0.2)),
        r.door_steel,
        "Front + back",
      ),
      item(
        "windows",
        "Aluminium sliding window (1500×1200mm)",
        "units",
        windows,
        r.window_alum,
        "Standard casement",
      ),
      item(
        "glazed-doors",
        "Glazed entrance door",
        "units",
        glazedDoors,
        r.door_steel * 0.7,
        "",
      ),
      item(
        "door-frames",
        "Door frames (hardwood)",
        "sets",
        doors,
        r.door_wood * 0.15,
        "",
      ),
      item(
        "door-hardware",
        "Door hardware (hinges, locks, handles)",
        "sets",
        doors + windows,
        r.paint_5L * 0.8,
        "Per set",
      ),
    ]);
    section("finishes", "E. FINISHES", [
      item(
        "plaster",
        "Render/plaster (interior walls)",
        "bags",
        Math.round(netWallArea * 0.12),
        r.plaster_bag || r.cement * 0.8,
        "2-coat plaster",
      ),
      item(
        "partial-floor-tiles",
        "Floor tiles (600×600mm)",
        "m²",
        finishing === "basic" ? Math.round(area * 0.5 * 1.1) : 0,
        r.tiles_floor,
        "10% wastage",
      ),
      item(
        "all-floor-tiles",
        "Floor tiles (600×600mm) – all areas",
        "m²",
        finishing !== "basic" ? Math.round(area * 1.1) : 0,
        r.tiles_floor,
        "",
      ),
      item(
        "screed",
        "Plain screed (where no tiles)",
        "m²",
        finishing === "basic" ? Math.round(area * 0.5) : 0,
        r.cement * 0.4,
        "50mm screeded floor",
      ),
      item(
        "wall-tiles",
        "Wall tiles – wet areas (200×300mm)",
        "m²",
        Math.round((wc + showers) * 8),
        r.tiles_wall,
        "Bathrooms + kitchen",
      ),
      item(
        "emulsion",
        "Emulsion paint – interior",
        "tins",
        Math.round(netWallArea / 20),
        r.paint_5L,
        "5L tins, 2 coats",
      ),
      item(
        "trim-paint",
        "Gloss/trim paint – doors + windows",
        "tins",
        Math.round((doors + windows) / 4),
        r.paint_5L * 1.2,
        "",
      ),
      item(
        "tile-adhesive",
        "Tile adhesive (25kg bags)",
        "bags",
        finishing !== "basic"
          ? Math.round(area * 0.5)
          : Math.round((wc + showers) * 4),
        r.plaster_bag || r.cement,
        "",
      ),
      item(
        "tile-grout",
        "Tile grout (5kg bags)",
        "bags",
        finishing !== "basic"
          ? Math.round(area * 0.2)
          : Math.round((wc + showers) * 2),
        (r.plaster_bag || r.cement) * 0.6,
        "",
      ),
    ]);
    section("plumbing", "F. PLUMBING", [
      item("wc", "WC suite (pan, cistern, seat)", "sets", wc, r.wc_unit, ""),
      item(
        "showers",
        "Shower set (tray, mixer, head)",
        "sets",
        showers,
        r.shower_unit,
        "",
      ),
      item(
        "sinks",
        "Kitchen sink (stainless, double bowl)",
        "units",
        sinks,
        r.sink_kitchen,
        "",
      ),
      item(
        "waste-pipe",
        "PVC waste pipe 110mm",
        "m",
        Math.round((wc + showers + sinks) * 5),
        r.pvc_110mm / 6,
        "",
      ),
      item(
        "water-pipe",
        "PVC water supply pipe 32mm",
        "m",
        Math.round(perimeter * 0.8 * floors),
        r.pvc_32mm / 6,
        "",
      ),
      item(
        "water-tank",
        "Overhead water tank (1000L)",
        "units",
        1,
        r.sink_kitchen * 4,
        "Polyethylene",
      ),
      item(
        "float-valve",
        "Ball float valve + fittings",
        "set",
        1,
        r.sink_kitchen * 0.5,
        "",
      ),
      item(
        "water-pump",
        "Water pump (0.5HP)",
        "unit",
        1,
        r.wc_unit * 1.5,
        "Booster pump",
      ),
    ]);
    var electrical = [
      item(
        "power-wire",
        "2.5mm² electrical wire",
        "m",
        Math.round(area * (beds || 3) * 2.5),
        r.wire_25mm,
        "Ring main",
      ),
      item(
        "lighting-wire",
        "1.5mm² lighting wire",
        "m",
        Math.round(area * 1.5),
        r.wire_25mm * 0.7,
        "Lighting circuit",
      ),
      item(
        "sockets",
        "Socket outlets (double)",
        "pcs",
        (beds || 3) * sockets,
        r.paint_5L * 0.5,
        "",
      ),
      item(
        "switches",
        "Light switches (single)",
        "pcs",
        Math.round((beds + 3) * 1.5),
        r.paint_5L * 0.3,
        "",
      ),
      item(
        "distribution-board",
        "Distribution board (8-way MCB)",
        "unit",
        1,
        r.door_wood * 0.8,
        "Consumer unit",
      ),
      item(
        "breakers",
        "MCB circuit breakers (various)",
        "pcs",
        8,
        r.paint_5L * 0.6,
        "",
      ),
      item(
        "conduit",
        "Conduit (PVC 20mm)",
        "m",
        Math.round(area * 3),
        r.wire_25mm * 0.3,
        "",
      ),
    ];
    if (inverter)
      electrical.push(
        item(
          "inverter",
          "Inverter/UPS (2kVA) + battery",
          "set",
          1,
          r.inverter_kva,
          "Backup power",
        ),
      );
    electrical.push(
      item(
        "earthing",
        "Earth rod + earth wire",
        "set",
        1,
        r.paint_5L * 1.5,
        "Earthing system",
      ),
    );
    section("electrical", "G. ELECTRICAL", electrical);
    var allItems = [],
      materialTotal = 0;
    sections.forEach(function (sec) {
      sec.items.forEach(function (row) {
        allItems.push(row);
        materialTotal += row.amount;
      });
    });
    var labourCost = Math.round(materialTotal * cd.labourRate),
      subtotal = materialTotal + labourCost,
      contingencyAmount = Math.round((subtotal * contingency) / 100),
      grandTotal = subtotal + contingencyAmount;
    return {
      input: Object.assign({}, input),
      country: cd,
      geometry: {
        perimeter: perimeter,
        grossWallArea: grossWallArea,
        wallOpenings: wallOpenings,
        netWallArea: netWallArea,
        foundationVolume: foundVol,
      },
      sections: sections,
      allItems: allItems,
      materialTotal: materialTotal,
      labourCost: labourCost,
      subtotal: subtotal,
      contingencyAmount: contingencyAmount,
      grandTotal: grandTotal,
      snapshot: "2025-Q1",
      stale: true,
      confidence: "low",
      sourceStatus: "unverified-embedded-market-rates",
      formulaRevision: "2026-08-wall-floor-fix",
    };
  }
  return Object.freeze({
    RATE_KEYS: K,
    COUNTRY_ROWS: RAW,
    BUILD_PRESETS: BUILD_PRESETS,
    country: country,
    calculate: calculate,
  });
});
