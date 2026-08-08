(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.StructuralScreeningEngine = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  var bars = [
      { d: 12, a: 113 },
      { d: 16, a: 201 },
      { d: 20, a: 314 },
      { d: 25, a: 491 },
      { d: 32, a: 804 },
    ],
    slabBars = [
      { d: 10, a: 78.5 },
      { d: 12, a: 113 },
      { d: 16, a: 201 },
    ],
    footingBars = [
      { d: 12, a: 113 },
      { d: 16, a: 201 },
      { d: 20, a: 314 },
    ],
    materialCosts = {
      NGN: { concrete: 85000, rebar: 950, symbol: "₦", name: "Nigeria" },
      KES: { concrete: 15000, rebar: 180, symbol: "KSh", name: "Kenya" },
      GHS: { concrete: 1400, rebar: 18, symbol: "GH₵", name: "Ghana" },
      ZAR: { concrete: 3000, rebar: 22, symbol: "R", name: "South Africa" },
      TZS: { concrete: 300000, rebar: 4000, symbol: "TSh", name: "Tanzania" },
      UGX: { concrete: 380000, rebar: 5200, symbol: "USh", name: "Uganda" },
      ETB: { concrete: 7000, rebar: 90, symbol: "Br", name: "Ethiopia" },
      USD: { concrete: 120, rebar: 0.9, symbol: "$", name: "USD" },
    };
  function positive(value, label) {
    var n = Number(value);
    if (!Number.isFinite(n) || n <= 0)
      throw new Error(label + " must be greater than zero.");
    return n;
  }
  function chooseBars(area, min, max) {
    for (var i = 0; i < bars.length; i++) {
      var n = Math.ceil(area / bars[i].a);
      if (n >= min && n <= max)
        return {
          count: n,
          diameter: bars[i].d,
          area: n * bars[i].a,
          label:
            n + "Y" + bars[i].d + " (" + (n * bars[i].a).toFixed(0) + " mm2)",
        };
    }
    for (var j = 0; j < bars.length; j++) {
      var count = Math.ceil(area / bars[j].a);
      if (count >= min)
        return {
          count: count,
          diameter: bars[j].d,
          area: count * bars[j].a,
          label:
            count +
            "Y" +
            bars[j].d +
            " (" +
            (count * bars[j].a).toFixed(0) +
            " mm2)",
        };
    }
    return { label: "Requires larger section" };
  }
  function calculateBeam(input) {
    var L = positive(input.span, "Span"),
      w = positive(input.udl, "Load"),
      fcu = positive(input.fcu, "Concrete strength"),
      fy = positive(input.fy, "Steel strength"),
      b = positive(input.width, "Width"),
      cover = positive(input.cover, "Cover"),
      M = (w * L * L) / 8,
      V = (w * L) / 2,
      dMin = Math.ceil((L * 1000) / 12),
      h = Math.ceil((dMin + cover + 18) / 25) * 25,
      d = h - cover - 18,
      K = (M * 1e6) / (fcu * b * d * d),
      compression = K > 0.156,
      Kuse = Math.min(K, 0.156),
      z = Math.min(d * (0.5 + Math.sqrt(0.25 - Kuse / 0.9)), 0.95 * d),
      As = (M * 1e6) / (0.87 * fy * z),
      AsMin = (0.13 * b * h) / 100,
      choice = chooseBars(As, 1, 6);
    return {
      kind: "beam",
      span: L,
      M: M,
      V: V,
      width: b,
      height: h,
      d: d,
      K: K,
      compression: compression,
      z: z,
      As: As,
      AsMin: AsMin,
      barChoice: choice.label,
      linksSpacing: Math.min(Math.floor(0.75 * d), 300),
      concreteM3: (b / 1000) * (h / 1000) * L,
      rebarKg: As * 1e-6 * L * 7850 * 1.3,
    };
  }
  function calculateColumn(input) {
    var N = positive(input.load, "Load"),
      fcu = positive(input.fcu, "Concrete strength"),
      fy = positive(input.fy, "Steel strength"),
      p = positive(input.steelPct, "Steel percentage") / 100;
    if (p >= 1) throw new Error("Steel percentage must be below 100%.");
    var shape = input.shape === "circle" ? "circle" : "square",
      Ag = (N * 1000) / (0.4 * fcu * (1 - p) + 0.8 * fy * p),
      dim =
        shape === "square"
          ? Math.ceil(Math.sqrt(Ag) / 25) * 25
          : Math.ceil((2 * Math.sqrt(Ag / Math.PI)) / 25) * 25,
      actualAg = shape === "square" ? dim * dim : (Math.PI * dim * dim) / 4,
      Asc = Math.round(p * actualAg),
      choice = chooseBars(Asc, 4, 8),
      capacity =
        (0.4 * fcu * (actualAg - Asc)) / 1000 + (0.8 * fy * Asc) / 1000;
    return {
      kind: "column",
      load: N,
      fcu: fcu,
      fy: fy,
      steelPct: p * 100,
      shape: shape,
      Ag: Ag,
      dim: dim,
      dimLabel:
        shape === "square" ? dim + "x" + dim + " mm" : dim + " mm diameter",
      actualAg: actualAg,
      Asc: Asc,
      barChoice: choice.label,
      capacity: capacity,
      concreteM3: (actualAg / 1e6) * 3,
      rebarKg: Asc * 1e-6 * 3 * 7850 * 1.15,
    };
  }
  function calculateSlab(input) {
    var L = positive(input.span, "Span"),
      qk = positive(input.liveLoad, "Live load"),
      fcu = positive(input.fcu, "Concrete strength"),
      finish = positive(input.finishLoad, "Finish load"),
      h = Math.max(Math.ceil((L * 1000) / 26 / 25) * 25, 125),
      d = h - 26,
      sw = (h / 1000) * 24,
      gk = sw + finish,
      n = 1.4 * gk + 1.6 * qk,
      M = (n * L * L) / 8,
      K = (M * 1e6) / (fcu * 1000 * d * d);
    if (K >= 0.225)
      throw new Error(
        "Simplified slab screening is outside its safe formula range.",
      );
    var z = Math.min(d * (0.5 + Math.sqrt(0.25 - K / 0.9)), 0.95 * d),
      As = (M * 1e6) / (0.87 * 460 * z),
      AsMin = (0.13 * 1000 * h) / 100,
      AsDesign = Math.max(As, AsMin),
      choice = null;
    for (var i = 0; i < slabBars.length; i++) {
      var spacing = Math.floor((slabBars[i].a * 1000) / AsDesign / 25) * 25;
      if (spacing >= 100 && spacing <= 300) {
        choice = {
          label:
            "Y" +
            slabBars[i].d +
            " @ " +
            spacing +
            " mm c/c (" +
            Math.round((slabBars[i].a * 1000) / spacing) +
            " mm2/m)",
        };
        break;
      }
    }
    if (!choice) choice = { label: "Y12 @ 150 mm c/c" };
    return {
      kind: "slab",
      span: L,
      height: h,
      d: d,
      sw: sw,
      gk: gk,
      ultimateLoad: n,
      M: M,
      K: K,
      z: z,
      As: As,
      AsMin: AsMin,
      AsDesign: AsDesign,
      barChoice: choice.label,
      concreteM3PerM2: h / 1000,
      rebarKgPerM2: AsDesign * 1e-6 * 7850 * 1.5,
    };
  }
  function calculateFooting(input) {
    var N = positive(input.load, "Load"),
      sbc = positive(input.sbc, "Bearing capacity"),
      fcu = positive(input.fcu, "Concrete strength"),
      col = positive(input.columnSize, "Column size"),
      swFactor = 1.1,
      areaReq = (N * swFactor) / sbc,
      side = Math.ceil((Math.sqrt(areaReq) * 1000) / 50) * 50;
    if (side <= col)
      throw new Error("Footing side must exceed the column size.");
    var sideM = side / 1000,
      actualArea = sideM * sideM,
      Nu = 1.4 * N,
      qu = Nu / actualArea,
      d = Math.max(150, Math.ceil((side - col) / 4 / 25) * 25),
      h = d + 62,
      cantilever = (side - col) / 2000,
      M = (qu * sideM * cantilever * cantilever) / 2,
      As = (M * 1e6) / (0.87 * 460 * 0.95 * d),
      AsMin = (0.13 * 1000 * h) / 100,
      AsDesign = Math.max(As, AsMin),
      choice = null;
    for (var i = 0; i < footingBars.length; i++) {
      var spacing = Math.floor((footingBars[i].a * 1000) / AsDesign / 25) * 25;
      if (spacing >= 100 && spacing <= 300) {
        choice = {
          label: "Y" + footingBars[i].d + " @ " + spacing + " mm c/c both ways",
        };
        break;
      }
    }
    if (!choice) choice = { label: "Y16 @ 150 mm c/c both ways" };
    var roundedDepth = Math.ceil(h / 25) * 25;
    return {
      kind: "footing",
      load: N,
      sbc: sbc,
      fcu: fcu,
      columnSize: col,
      areaReq: areaReq,
      side: side,
      sideM: sideM,
      actualArea: actualArea,
      servicePressure: (N * swFactor) / actualArea,
      ultimatePressure: qu,
      d: d,
      height: roundedDepth,
      cantilever: cantilever,
      M: M,
      As: As,
      AsMin: AsMin,
      AsDesign: AsDesign,
      barChoice: choice.label,
      concreteM3: (actualArea * roundedDepth) / 1000,
      rebarKg: AsDesign * 1e-6 * sideM * 7850 * 2 * 1.1,
    };
  }
  function materialCost(concreteM3, rebarKg, currency) {
    var c = materialCosts[currency] || materialCosts.USD,
      concreteCost = positive(concreteM3, "Concrete volume") * c.concrete,
      rebarCost = positive(rebarKg, "Rebar mass") * c.rebar;
    return {
      currency: currency in materialCosts ? currency : "USD",
      name: c.name,
      symbol: c.symbol,
      concreteCost: concreteCost,
      rebarCost: rebarCost,
      total: concreteCost + rebarCost,
      dataStatus: "legacy_undated_stale",
      confidence: "low",
    };
  }
  return {
    calculateBeam: calculateBeam,
    calculateColumn: calculateColumn,
    calculateSlab: calculateSlab,
    calculateFooting: calculateFooting,
    materialCost: materialCost,
    MATERIAL_COSTS: materialCosts,
  };
});
