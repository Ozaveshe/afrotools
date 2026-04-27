(function () {
  "use strict";

  var COUNTRIES = {
    NG: { name: "Nigeria", currency: "NGN", fx: 1580, aqi: 132, flood: 60, drought: 58, water: 58, biomass: 145, recycle: 1.00, charcoal: 0.42, lpg: 1.15, power: 0.14, rain: 1.00 },
    KE: { name: "Kenya", currency: "KES", fx: 130, aqi: 88, flood: 52, drought: 64, water: 62, biomass: 95, recycle: 1.05, charcoal: 0.36, lpg: 1.45, power: 0.20, rain: 0.88 },
    ZA: { name: "South Africa", currency: "ZAR", fx: 18.8, aqi: 92, flood: 48, drought: 70, water: 72, biomass: 75, recycle: 1.22, charcoal: 0.50, lpg: 1.60, power: 0.18, rain: 0.72 },
    GH: { name: "Ghana", currency: "GHS", fx: 13.8, aqi: 104, flood: 58, drought: 46, water: 48, biomass: 135, recycle: 0.96, charcoal: 0.38, lpg: 1.20, power: 0.16, rain: 1.05 },
    EG: { name: "Egypt", currency: "EGP", fx: 47.5, aqi: 150, flood: 34, drought: 74, water: 86, biomass: 35, recycle: 1.12, charcoal: 0.48, lpg: 0.95, power: 0.10, rain: 0.28 },
    ET: { name: "Ethiopia", currency: "ETB", fx: 120, aqi: 118, flood: 50, drought: 68, water: 66, biomass: 105, recycle: 0.86, charcoal: 0.30, lpg: 1.55, power: 0.08, rain: 0.82 },
    TZ: { name: "Tanzania", currency: "TZS", fx: 2600, aqi: 82, flood: 56, drought: 54, water: 52, biomass: 120, recycle: 0.92, charcoal: 0.32, lpg: 1.25, power: 0.13, rain: 0.96 },
    UG: { name: "Uganda", currency: "UGX", fx: 3800, aqi: 96, flood: 61, drought: 50, water: 44, biomass: 150, recycle: 0.90, charcoal: 0.31, lpg: 1.35, power: 0.18, rain: 1.15 },
    RW: { name: "Rwanda", currency: "RWF", fx: 1300, aqi: 72, flood: 55, drought: 48, water: 42, biomass: 135, recycle: 0.95, charcoal: 0.34, lpg: 1.40, power: 0.22, rain: 1.08 },
    CI: { name: "Cote d'Ivoire", currency: "XOF", fx: 610, aqi: 108, flood: 54, drought: 44, water: 46, biomass: 160, recycle: 0.97, charcoal: 0.33, lpg: 1.18, power: 0.15, rain: 1.12 },
    CM: { name: "Cameroon", currency: "XAF", fx: 610, aqi: 101, flood: 57, drought: 45, water: 47, biomass: 170, recycle: 0.92, charcoal: 0.31, lpg: 1.20, power: 0.16, rain: 1.18 },
    SN: { name: "Senegal", currency: "XOF", fx: 610, aqi: 122, flood: 45, drought: 72, water: 76, biomass: 65, recycle: 0.95, charcoal: 0.35, lpg: 1.10, power: 0.19, rain: 0.48 },
    MA: { name: "Morocco", currency: "MAD", fx: 10.1, aqi: 94, flood: 40, drought: 78, water: 80, biomass: 55, recycle: 1.08, charcoal: 0.46, lpg: 1.05, power: 0.12, rain: 0.52 },
    TN: { name: "Tunisia", currency: "TND", fx: 3.1, aqi: 90, flood: 38, drought: 76, water: 78, biomass: 45, recycle: 1.10, charcoal: 0.44, lpg: 1.00, power: 0.11, rain: 0.50 },
    AO: { name: "Angola", currency: "AOA", fx: 920, aqi: 86, flood: 50, drought: 52, water: 50, biomass: 125, recycle: 0.94, charcoal: 0.36, lpg: 1.30, power: 0.17, rain: 0.94 }
  };

  var MONTH_RAIN = [0.72, 0.78, 0.9, 1.04, 1.15, 1.2, 1.14, 1.03, 1.0, 0.92, 0.82, 0.74];

  function $(id) { return document.getElementById(id); }
  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
  function round(n, d) {
    var p = Math.pow(10, d || 0);
    return Math.round((Number(n) || 0) * p) / p;
  }
  function num(v, fallback) {
    var n = parseFloat(v);
    return Number.isFinite(n) ? n : (fallback || 0);
  }
  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
  function fmt(n, d) {
    return (Number(n) || 0).toLocaleString(undefined, {
      minimumFractionDigits: d || 0,
      maximumFractionDigits: d || 0
    });
  }
  function moneyUSD(n) { return "$" + fmt(n, 0); }
  function moneyLocal(n, countryCode) {
    var c = COUNTRIES[countryCode] || COUNTRIES.NG;
    return c.currency + " " + fmt((Number(n) || 0) * c.fx, 0);
  }
  function country(code) { return COUNTRIES[code] || COUNTRIES.NG; }
  function level(score) {
    if (score >= 82) return { label: "Extreme", cls: "dark" };
    if (score >= 66) return { label: "High", cls: "danger" };
    if (score >= 45) return { label: "Medium", cls: "warn" };
    return { label: "Lower", cls: "" };
  }
  function grade(score) {
    if (score >= 85) return "A";
    if (score >= 72) return "B";
    if (score >= 58) return "C";
    if (score >= 44) return "D";
    return "F";
  }
  function metric(label, value, unit) {
    return { label: label, value: value, unit: unit || "" };
  }
  function action(title, body) {
    return { title: title, body: body };
  }
  function row(label, value, detail) {
    return { label: label, value: value, detail: detail || "" };
  }

  var PM25_BREAKPOINTS = [
    [0, 12, 0, 50],
    [12.1, 35.4, 51, 100],
    [35.5, 55.4, 101, 150],
    [55.5, 150.4, 151, 200],
    [150.5, 250.4, 201, 300],
    [250.5, 350.4, 301, 400],
    [350.5, 500.4, 401, 500]
  ];
  function pm25ToAqi(pm) {
    pm = clamp(pm, 0, 500.4);
    for (var i = 0; i < PM25_BREAKPOINTS.length; i += 1) {
      var b = PM25_BREAKPOINTS[i];
      if (pm >= b[0] && pm <= b[1]) {
        return Math.round(((b[3] - b[2]) / (b[1] - b[0])) * (pm - b[0]) + b[2]);
      }
    }
    return 500;
  }
  function aqiCategory(aqi) {
    if (aqi <= 50) return { label: "Good", cls: "" };
    if (aqi <= 100) return { label: "Moderate", cls: "warn" };
    if (aqi <= 150) return { label: "Unhealthy for sensitive groups", cls: "warn" };
    if (aqi <= 200) return { label: "Unhealthy", cls: "danger" };
    if (aqi <= 300) return { label: "Very unhealthy", cls: "danger" };
    return { label: "Hazardous", cls: "dark" };
  }

  var CALCULATORS = {
    "air-quality": function (v) {
      var c = country(v.country);
      var cityMod = { capital: 1, industrial: 1.18, roadside: 1.28, periurban: 0.88, rural: 0.62 }[v.location] || 1;
      var sourceMod = { traffic: 1.08, generators: 1.14, burning: 1.22, dust: 1.1, cooking: 0.95, mixed: 1 }[v.source] || 1;
      var healthMod = { general: 1, child: 1.35, elderly: 1.32, asthma: 1.55, pregnant: 1.4 }[v.health] || 1;
      var fuelMod = { clean: 0.96, lpg: 1, charcoal: 1.14, wood: 1.22, kerosene: 1.18 }[v.indoorFuel] || 1;
      var aqi = v.pm25 > 0 ? pm25ToAqi(v.pm25) : Math.round(c.aqi * cityMod * sourceMod * fuelMod);
      aqi = clamp(aqi, 0, 500);
      var cat = aqiCategory(aqi);
      var pm = v.pm25 > 0 ? v.pm25 : round(aqi * 0.42, 1);
      var exposureScore = clamp(aqi * healthMod * (0.72 + (num(v.exposureHours, 6) / 18)), 0, 500);
      var safeHours = aqi <= 50 ? 10 : aqi <= 100 ? 7 : aqi <= 150 ? 4 : aqi <= 200 ? 2 : 1;
      if (v.health !== "general") safeHours = Math.max(0.5, safeHours * 0.65);
      var mask = aqi < 101 ? "No mask usually needed" : aqi < 151 ? "KN95 on roadside days" : "N95 or KN95 outdoors";
      var cost = (20 + exposureScore * 1.8) * c.fx;
      return {
        label: "Estimated AQI",
        value: fmt(aqi),
        sub: cat.label + " for " + c.name + " under this exposure pattern.",
        level: cat.label,
        levelClass: cat.cls,
        metrics: [
          metric("PM2.5 estimate", fmt(pm, 1), "ug/m3"),
          metric("Personal exposure score", fmt(exposureScore), "/500"),
          metric("Outdoor time guide", fmt(safeHours, 1), "hours"),
          metric("Annual health-cost proxy", c.currency + " " + fmt(cost, 0), "planning")
        ],
        breakdown: [
          row("Protection", mask, "AQI protection should be stricter for children, pregnancy, asthma and older adults."),
          row("Dominant source", v.source, "Use this to decide whether the next step is ventilation, route choice, fuel switching, or waste-burning control."),
          row("Indoor fuel", v.indoorFuel, "Clean fuels and ventilation matter because household smoke can dominate daily dose.")
        ],
        actions: [
          action("Check before travel", "Use the AQI result as a planning prompt, then confirm with a live monitor or local air-quality feed before school runs, outdoor work or exercise."),
          action("Cut the biggest exposure first", v.source === "cooking" || v.indoorFuel !== "clean" ? "Prioritize cleaner cooking fuel, cross-ventilation and keeping children away from smoke." : "Shift walking routes away from traffic corridors and avoid open-burning periods."),
          action("Make it measurable", "Record PM2.5 readings for seven days if you have a low-cost sensor. Compare morning, roadside and cooking periods.")
        ]
      };
    },

    "carbon-credit": function (v) {
      var c = country(v.country);
      var rates = { redd: 5.4, reforestation: 4.2, agroforestry: 3.1, soil: 1.6, mangrove: 7.8, cookstove: 1.2, methane: 2.7 };
      var stdPrice = { verra: 9, gold: 13, planvivo: 11, domestic: 6 };
      var units = Math.max(1, num(v.projectSize, 100));
      var years = clamp(num(v.years, 10), 1, 40);
      var price = num(v.price, 0) || stdPrice[v.standard] || 9;
      var annualCredits = units * (rates[v.projectType] || 3) * (0.8 + c.biomass / 180);
      var buffer = clamp(num(v.bufferPct, 15), 0, 40) / 100;
      var gross = annualCredits * years * price;
      var net = gross * (1 - buffer) - num(v.validationCost, 35000);
      var l = level(net < 0 ? 72 : units < 50 ? 58 : 34);
      return {
        label: "Net credit revenue",
        value: moneyUSD(net),
        sub: moneyLocal(net, v.country) + " after buffer and validation cost.",
        level: net > 0 ? "Commercially plausible" : "Needs aggregation",
        levelClass: net > 0 ? "" : "warn",
        metrics: [
          metric("Annual credits", fmt(annualCredits, 0), "tCO2e"),
          metric("Crediting period", fmt(years), "years"),
          metric("Gross revenue", moneyUSD(gross), ""),
          metric("Buffer reserve", fmt(buffer * 100), "%")
        ],
        breakdown: [
          row("Standard", v.standard, "Plan for methodology, safeguards, public comment, validation, monitoring, verification and issuance."),
          row("Minimum scale signal", units < 100 ? "Smallholder scale" : "Direct project candidate", units < 100 ? "Aggregation through a cooperative or program is likely more realistic." : "Direct registration may be worth scoping."),
          row("Commercial risk", l.label, "Credit prices, validation cost, reversal buffer and buyer due diligence can change the result.")
        ],
        actions: [
          action("Run additionality first", "Document what would happen without carbon finance. If the project would happen anyway, credits are weak."),
          action("Build MRV evidence", "Collect geotagged boundaries, baseline land-use records, community consent and monitoring responsibilities before paying validators."),
          action("Stress-test the price", "Recalculate at half the credit price and double the validation cost before pitching the project.")
        ]
      };
    },

    "ewaste-value": function (v) {
      var c = country(v.country);
      var devices = {
        smartphone: { value: 18, kg: 0.18, hazard: 44 },
        laptop: { value: 42, kg: 2.1, hazard: 62 },
        desktop: { value: 36, kg: 7.5, hazard: 58 },
        tv: { value: 30, kg: 12, hazard: 72 },
        battery: { value: 4, kg: 0.6, hazard: 86 },
        mixed: { value: 11, kg: 1, hazard: 65 }
      };
      var cond = { working: 1.55, repairable: 1.05, dead: 0.62, stripped: 0.34 }[v.condition] || 1;
      var recycler = { certified: 1.08, collection: 0.95, scrap: 0.72 }[v.recycler] || 0.9;
      var d = devices[v.device] || devices.mixed;
      var qty = Math.max(1, num(v.quantity, 1));
      var dataRisk = { none: 0, low: 18, medium: 42, high: 70 }[v.dataRisk] || 0;
      var value = d.value * cond * recycler * qty * c.recycle;
      var kg = d.kg * qty;
      var co2 = kg * 11.5;
      var hazardScore = clamp(d.hazard + dataRisk + (v.recycler === "scrap" ? 12 : 0), 0, 100);
      var l = level(hazardScore);
      return {
        label: "Estimated payout",
        value: moneyLocal(value, v.country),
        sub: moneyUSD(value) + " equivalent, before transport or buyer inspection.",
        level: l.label + " handling risk",
        levelClass: l.cls,
        metrics: [
          metric("Total mass", fmt(kg, 1), "kg"),
          metric("CO2 avoided proxy", fmt(co2, 0), "kg CO2e"),
          metric("Hazard score", fmt(hazardScore), "/100"),
          metric("Data wipe priority", dataRisk >= 42 ? "High" : "Normal", "")
        ],
        breakdown: [
          row("Device value", v.device, "Working devices earn a resale premium; dead devices are valued mostly for recoverable material."),
          row("Recycler route", v.recycler, "Certified or formal collection lowers health and fire risk even when payout is lower."),
          row("Data safety", dataRisk >= 42 ? "Wipe before handoff" : "Basic reset", "Remove accounts, SIM/SD cards and storage media where possible.")
        ],
        actions: [
          action("Prepare the device", "Remove accounts, reset the device, take out SIM and memory cards, and keep chargers or accessories together."),
          action("Avoid unsafe dismantling", "Do not burn cables, crack batteries, break CRT glass or dismantle boards without PPE and ventilation."),
          action("Ask for traceability", "Request a receipt, weight record or collection note if the recycler claims formal processing.")
        ]
      };
    },

    "flood-risk": function (v) {
      var c = country(v.country);
      var site = { coastal: 18, river: 20, wetland: 22, urban: 12, upland: -8 }[v.site] || 0;
      var distance = { under100: 22, "100to500": 16, "500to2k": 8, over2k: 0 }[v.distance] || 0;
      var elevation = { under5: 20, "5to15": 13, "15to50": 6, over50: -4 }[v.elevation] || 0;
      var drainage = { blocked: 16, poor: 11, average: 5, good: -4 }[v.drainage] || 0;
      var building = { mud: 1.65, timber: 1.32, block: 1, reinforced: 0.72 }[v.building] || 1;
      var score = clamp(c.flood + site + distance + elevation + drainage, 0, 100);
      var annProb = clamp((score / 100) * 0.28 * building, 0.02, 0.65);
      var propertyUSD = num(v.propertyValue, 50000);
      var expectedLoss = propertyUSD * annProb * 0.22 * building;
      var premium = propertyUSD * ({ none: 0.018, basic: 0.012, full: 0.008 }[v.insurance] || 0.014);
      var l = level(score);
      return {
        label: "Flood risk score",
        value: fmt(score),
        sub: fmt(annProb * 100, 1) + "% annual probability proxy for this site.",
        level: l.label,
        levelClass: l.cls,
        metrics: [
          metric("Expected annual loss", moneyUSD(expectedLoss), ""),
          metric("Insurance budget proxy", moneyUSD(premium), "/year"),
          metric("Five-year chance", fmt((1 - Math.pow(1 - annProb, 5)) * 100, 0), "%"),
          metric("Building vulnerability", fmt(building, 2), "x")
        ],
        breakdown: [
          row("Site exposure", v.site, "Distance to water, drainage and elevation dominate first-pass risk."),
          row("Damage driver", v.building, "More resilient structures reduce expected loss even when flood probability stays high."),
          row("Insurance signal", v.insurance, "Premium estimates are planning numbers; confirm exclusions and flood wording.")
        ],
        actions: [
          action("Verify the map", "Check local flood maps, nearby high-water marks and drainage channels before buying, renting or insuring."),
          action("Protect openings first", "Raise sockets, use flood barriers at doors, clear drains and move stock or documents above expected water height."),
          action("Build an evacuation trigger", "Set a rainfall or river-level trigger, a family contact plan and a bag for key documents.")
        ]
      };
    },

    "sustainability-scorecard": function (v) {
      var sectorWeight = { retail: 0, manufacturing: -6, food: -3, services: 4, logistics: -4, farm: -2 }[v.sector] || 0;
      var energy = clamp(num(v.renewablePct, 0) * 0.24 + (v.energyAudit === "yes" ? 8 : 0) - num(v.generatorPct, 0) * 0.08, 0, 25);
      var waste = clamp(num(v.recyclingPct, 0) * 0.18 + (v.separatesWaste === "yes" ? 7 : 0) + (v.hazardPlan === "yes" ? 5 : 0), 0, 25);
      var water = clamp((v.waterMeter === "yes" ? 8 : 0) + num(v.waterReusePct, 0) * 0.16 + (v.leakChecks === "yes" ? 5 : 0), 0, 20);
      var sourcing = clamp(num(v.localSourcingPct, 0) * 0.13 + (v.supplierCode === "yes" ? 7 : 0), 0, 15);
      var people = clamp((v.ppe === "yes" ? 5 : 0) + (v.training === "yes" ? 5 : 0) + (v.reporting === "yes" ? 5 : 0), 0, 15);
      var score = clamp(energy + waste + water + sourcing + people + sectorWeight, 0, 100);
      var g = grade(score);
      var l = level(100 - score);
      return {
        label: "Sustainability grade",
        value: g,
        sub: fmt(score, 0) + "/100 across energy, waste, water, sourcing and people.",
        level: score >= 72 ? "Investor-ready baseline" : score >= 55 ? "Improving" : "Needs a 90-day plan",
        levelClass: score >= 72 ? "" : score >= 55 ? "warn" : "danger",
        metrics: [
          metric("Energy", fmt(energy), "/25"),
          metric("Waste", fmt(waste), "/25"),
          metric("Water", fmt(water), "/20"),
          metric("Disclosure readiness", fmt(people + sourcing), "/30")
        ],
        breakdown: [
          row("Materiality", v.sector, "Focus first on the environmental issue that investors, regulators or customers will ask about in your sector."),
          row("Lowest category", l.label, "The weakest category should become the next quarter's operating project."),
          row("Evidence quality", v.reporting === "yes" ? "Documented" : "Undocumented", "A score without receipts is useful internally but weak for external reporting.")
        ],
        actions: [
          action("Create a 90-day evidence folder", "Keep utility bills, waste receipts, training logs, incident records and supplier commitments in one place."),
          action("Pick one measurable target", "Choose a target such as 20% less generator use, weekly waste segregation or leak checks with meter readings."),
          action("Prepare disclosure language", "Use this as a self-assessment, then map formal reporting to GRI, local regulation or lender requirements.")
        ]
      };
    },

    "tree-planting-roi": function (v) {
      var c = country(v.country);
      var species = {
        fruit: { seq: 0.026, yield: 16, harvest: 4, capex: 4.5 },
        timber: { seq: 0.032, yield: 30, harvest: 15, capex: 3.8 },
        indigenous: { seq: 0.022, yield: 6, harvest: 8, capex: 3.2 },
        mangrove: { seq: 0.045, yield: 4, harvest: 10, capex: 5.5 },
        agroforestry: { seq: 0.028, yield: 12, harvest: 5, capex: 4.2 }
      }[v.species] || { seq: 0.025, yield: 10, harvest: 6, capex: 4 };
      var trees = Math.max(1, num(v.trees, 500));
      var survival = clamp(num(v.survivalPct, 75), 10, 100) / 100;
      var years = 25;
      var carbonPrice = num(v.carbonPrice, 12);
      var maintenance = num(v.maintenancePerTree, 1.2) * trees * years;
      var setup = num(v.investment, trees * species.capex);
      var liveTrees = trees * survival;
      var credits = liveTrees * species.seq * years * (0.85 + c.biomass / 240);
      var carbonRevenue = credits * carbonPrice;
      var produceRevenue = liveTrees * species.yield * Math.max(0, years - species.harvest + 1);
      var verification = v.verification === "direct" ? 28000 : v.verification === "cooperative" ? 4500 : 0;
      var net = carbonRevenue + produceRevenue - setup - maintenance - verification;
      var payback = net > 0 ? Math.ceil((setup + verification) / Math.max(1, (carbonRevenue + produceRevenue) / years)) : 0;
      return {
        label: "25-year net value",
        value: moneyUSD(net),
        sub: fmt(credits, 0) + " tCO2e survival-adjusted carbon over 25 years.",
        level: net > 0 ? "Positive ROI" : "Needs redesign",
        levelClass: net > 0 ? "" : "danger",
        metrics: [
          metric("Live trees", fmt(liveTrees), ""),
          metric("Carbon revenue", moneyUSD(carbonRevenue), ""),
          metric("Produce or timber value", moneyUSD(produceRevenue), ""),
          metric("Payback", payback ? fmt(payback) : "No", "years")
        ],
        breakdown: [
          row("Survival adjustment", fmt(survival * 100) + "%", "Mortality changes both climate value and farm income."),
          row("Verification route", v.verification, "Small projects usually need cooperative aggregation before carbon revenue is practical."),
          row("Maintenance load", moneyUSD(maintenance), "Watering, guards, fire breaks and replacement seedlings are the quiet cost.")
        ],
        actions: [
          action("Plan survival before planting", "Budget water, fencing, fire control and replacement seedlings. Survival is the business model."),
          action("Separate farm ROI from credit ROI", "Do not depend on carbon revenue until methodology, land tenure and monitoring are clear."),
          action("Use native and productive mixes", "Combine indigenous canopy or mangrove restoration with productive agroforestry where land use allows.")
        ]
      };
    },

    "drought-risk": function (v) {
      var c = country(v.country);
      var crop = { maize: 12, rice: 8, cassava: -10, cocoa: 6, sorghum: -6, vegetables: 14, livestock: 10 }[v.crop] || 5;
      var season = { dry: 18, early: 9, main: 2, late: 12 }[v.season] || 0;
      var irrigation = { none: 18, partial: 8, reliable: -12 }[v.irrigation] || 0;
      var soil = { sandy: 10, loam: 0, clay: -3, degraded: 14 }[v.soil] || 0;
      var anomaly = Math.abs(Math.min(0, num(v.rainfallAnomaly, -20))) * 0.9;
      var score = clamp(c.drought + crop + season + irrigation + soil + anomaly, 0, 100);
      var l = level(score);
      var area = Math.max(0.1, num(v.area, 2));
      var value = num(v.cropValue, 1200);
      var lossPct = clamp(score * 0.55, 5, 75) / 100;
      var loss = area * value * lossPct;
      var waterDeficit = Math.max(0, (score - 35) * 4.2 * area);
      return {
        label: "Drought risk score",
        value: fmt(score),
        sub: fmt(lossPct * 100, 0) + "% expected crop-value loss if no mitigation changes.",
        level: l.label,
        levelClass: l.cls,
        metrics: [
          metric("Expected loss", moneyUSD(loss), ""),
          metric("Water deficit proxy", fmt(waterDeficit, 0), "m3"),
          metric("Area exposed", fmt(area, 1), "ha"),
          metric("Insurance trigger", score >= 66 ? "Review now" : "Monitor", "")
        ],
        breakdown: [
          row("Rainfall anomaly", fmt(num(v.rainfallAnomaly, -20)) + "%", "Negative values mean rainfall below the local norm."),
          row("Crop sensitivity", v.crop, "Crop choice can matter as much as location."),
          row("Water control", v.irrigation, "Reliable irrigation sharply lowers drought loss.")
        ],
        actions: [
          action("Set a planting trigger", "Delay or stagger planting if early rains are below normal for two consecutive weeks."),
          action("Reduce open soil", "Use mulch, minimum tillage or cover crops to hold moisture and cool the root zone."),
          action("Prepare a fallback crop", "Keep a short-cycle or drought-tolerant backup variety if the season starts late.")
        ]
      };
    },

    "water-scarcity": function (v) {
      var c = country(v.country);
      var useMod = { household: 1, business: 1.18, school: 1.12, clinic: 1.35, farm: 1.55 }[v.useType] || 1;
      var people = Math.max(1, num(v.people, 4));
      var daily = Math.max(10, num(v.dailyDemand, 70)) * people * useMod;
      var supplyDays = clamp(num(v.supplyDays, 4), 0, 7);
      var shortageDays = (7 - supplyDays) * 4.35;
      var storage = Math.max(0, num(v.storage, 500));
      var reuse = clamp(num(v.reusePct, 0), 0, 90) / 100;
      var effectiveDemand = daily * (1 - reuse);
      var bufferDays = storage / effectiveDemand;
      var recommended = effectiveDemand * Math.min(14, Math.max(3, shortageDays / 2));
      var score = clamp(c.water + shortageDays * 2.2 - bufferDays * 5 - reuse * 18, 0, 100);
      var l = level(score);
      return {
        label: "Water scarcity score",
        value: fmt(score),
        sub: fmt(shortageDays, 1) + " shortage days/month before storage and reuse buffers.",
        level: l.label,
        levelClass: l.cls,
        metrics: [
          metric("Daily demand", fmt(effectiveDemand, 0), "litres"),
          metric("Storage buffer", fmt(bufferDays, 1), "days"),
          metric("Recommended storage", fmt(recommended, 0), "litres"),
          metric("Demand cut from reuse", fmt(reuse * 100), "%")
        ],
        breakdown: [
          row("Supply reliability", fmt(supplyDays) + " days/week", "Intermittent supply makes storage sizing more important than tariff alone."),
          row("Use profile", v.useType, "Clinics, schools and farms need a higher safety buffer than households."),
          row("Stress benchmark", c.name, "The country preset reflects broad water-stress conditions, not a utility guarantee.")
        ],
        actions: [
          action("Size storage to outages", "Use the recommended storage as a starting point, then add margin for dry-season weeks."),
          action("Cut non-potable demand", "Reuse greywater for cleaning, flushing or irrigation where safe and legal."),
          action("Track litres per person", "Meter or estimate daily use for two weeks before buying tanks or pumps.")
        ]
      };
    },

    "rainfall-tracker": function (v) {
      var c = country(v.country);
      var month = clamp(num(v.month, 6), 1, 12);
      var cropNeed = { maize: 520, rice: 900, cassava: 620, cocoa: 1300, sorghum: 430, vegetables: 650, pasture: 500 }[v.crop] || 600;
      var expected = num(v.expectedRain, 0) || Math.round(85 * c.rain * MONTH_RAIN[month - 1]);
      var received = num(v.receivedRain, expected * 0.8);
      var ratio = expected ? received / expected : 1;
      var stageMod = { planting: 1.2, vegetative: 1.1, flowering: 1.35, harvest: 0.65 }[v.stage] || 1;
      var deficit = Math.max(0, expected - received) * stageMod;
      var irrigation = deficit * num(v.area, 1) * 10;
      var status = ratio < 0.6 ? "Severe deficit" : ratio < 0.85 ? "Below normal" : ratio <= 1.25 ? "Near normal" : "Wet spell";
      var cls = ratio < 0.85 ? "warn" : ratio > 1.25 ? "danger" : "";
      return {
        label: "Rainfall status",
        value: status,
        sub: fmt(ratio * 100, 0) + "% of expected rainfall for the selected month.",
        level: status,
        levelClass: cls,
        metrics: [
          metric("Rain received", fmt(received), "mm"),
          metric("Expected rain", fmt(expected), "mm"),
          metric("Irrigation need", fmt(irrigation, 0), "m3"),
          metric("Crop seasonal need", fmt(cropNeed), "mm")
        ],
        breakdown: [
          row("Crop stage", v.stage, "Flowering and establishment stages are more sensitive to dry spells."),
          row("Month", month, "The preset is a planning baseline. Use station or CHIRPS data for decisions."),
          row("Wet-spell flag", ratio > 1.25 ? "Drainage risk" : "No major wet flag", "Above-normal rain can shift the risk from drought to flooding or disease.")
        ],
        actions: [
          action("Use local rain-gauge data", "Compare this estimate with a farm rain gauge or extension-office report before changing planting dates."),
          action("Protect the next growth stage", deficit > 0 ? "Prioritize irrigation or mulching for the most sensitive fields first." : "Check drainage and fungal disease risk if rainfall is above normal."),
          action("Record the pattern", "Keep monthly received rainfall and yield notes. The value compounds over seasons.")
        ]
      };
    },

    "deforestation": function (v) {
      var c = country(v.country);
      var density = { tropical: 190, miombo: 95, mangrove: 230, savanna: 58, plantation: 80 }[v.forestType] || 100;
      var ha = Math.max(0.01, num(v.hectares, 10));
      var soil = { low: 0.08, medium: 0.18, high: 0.32 }[v.soilCarbon] || 0.18;
      var use = { cropland: 1.05, pasture: 1.1, mining: 1.28, urban: 1.18, selective: 0.42 }[v.newUse] || 1;
      var emissions = ha * density * 3.67 * use + ha * density * soil * 3.67;
      var lostSink = ha * (2.8 + c.biomass / 100) * 20;
      var restoration = ha * ({ natural: 900, assisted: 1500, plantation: 2200, mangrove: 3000 }[v.restoration] || 1500);
      var score = clamp(ha * 1.8 + density / 3 + use * 18, 0, 100);
      var l = level(score);
      return {
        label: "CO2 release proxy",
        value: fmt(emissions, 0),
        sub: "tCO2e from biomass and soil disturbance, plus lost future sequestration.",
        level: l.label + " impact",
        levelClass: l.cls,
        metrics: [
          metric("Lost future sink", fmt(lostSink, 0), "tCO2e/20yr"),
          metric("Restoration budget", moneyUSD(restoration), ""),
          metric("Area affected", fmt(ha, 1), "ha"),
          metric("Biomass density", fmt(density), "tC/ha")
        ],
        breakdown: [
          row("Forest type", v.forestType, "Mangrove and tropical forests usually carry high carbon and biodiversity value."),
          row("New land use", v.newUse, "Permanent conversion locks in most of the climate loss."),
          row("Restoration route", v.restoration, "Assisted natural regeneration is often cheaper but needs protection from fire and grazing.")
        ],
        actions: [
          action("Check legal status", "Confirm land title, forest reserve rules, community consent and required permits before clearing."),
          action("Avoid high-carbon patches", "Map riparian buffers, steep slopes, wetlands and older forest first. They are costly to replace."),
          action("Price restoration upfront", "Add restoration or offset cost to the project economics before approving land conversion.")
        ]
      };
    },

    "waste-management": function (v) {
      var c = country(v.country);
      var kgMonth = Math.max(1, num(v.kgDay, 50) * 30);
      var organic = clamp(num(v.organicPct, 35), 0, 100) / 100;
      var recycling = clamp(num(v.recyclingPct, 20), 0, 95) / 100;
      var separation = { none: 0.55, basic: 0.82, color: 1.05, audited: 1.2 }[v.separation] || 0.8;
      var hazardous = { no: 0, small: 10, high: 24 }[v.hazardous] || 0;
      var diversion = clamp((organic * 0.45 + recycling) * separation, 0, 0.95);
      var collectionCost = kgMonth * 0.025 * c.recycle + num(v.pickups, 8) * 8 + hazardous * 6;
      var savings = kgMonth * diversion * 0.018;
      var score = clamp(diversion * 80 + separation * 10 - hazardous, 0, 100);
      var l = level(100 - score);
      return {
        label: "Circularity score",
        value: fmt(score),
        sub: fmt(diversion * 100, 0) + "% potential diversion from landfill or open dumping.",
        level: score >= 60 ? "Operationally useful" : "Needs sorting",
        levelClass: score >= 60 ? "" : "warn",
        metrics: [
          metric("Monthly waste", fmt(kgMonth), "kg"),
          metric("Collection cost", moneyUSD(collectionCost), "/month"),
          metric("Recoverable value", moneyUSD(savings), "/month"),
          metric("Hazard flag", hazardous ? "Yes" : "No", "")
        ],
        breakdown: [
          row("Separation system", v.separation, "Source separation is the main unlock for lower cost and better recycling revenue."),
          row("Organic share", fmt(organic * 100) + "%", "Organic waste is heavy and often best handled through composting or animal-feed routes where safe."),
          row("Pickup rhythm", fmt(num(v.pickups, 8)) + "/month", "Too few pickups create odor, pests and illegal dumping risk.")
        ],
        actions: [
          action("Create three streams", "Start with organics, dry recyclables and residual waste. Add hazardous/e-waste only with a specialist route."),
          action("Measure for one week", "Weigh bags or estimate bin volume for seven days before signing a waste contract."),
          action("Use receipts", "Ask collectors for weight tickets or collection logs so savings and compliance are not anecdotal.")
        ]
      };
    },

    "recycling-revenue": function (v) {
      var c = country(v.country);
      var prices = { plastic: 0.12, aluminum: 0.9, steel: 0.18, paper: 0.08, glass: 0.035, organic: 0.025 };
      var co2 = { plastic: 1.6, aluminum: 8.5, steel: 1.4, paper: 0.9, glass: 0.32, organic: 0.22 };
      var kg = {
        plastic: num(v.plastic, 80),
        aluminum: num(v.aluminum, 15),
        steel: num(v.steel, 30),
        paper: num(v.paper, 60),
        glass: num(v.glass, 40),
        organic: num(v.organic, 100)
      };
      var contamination = clamp(num(v.contaminationPct, 12), 0, 60) / 100;
      var transport = num(v.transportCost, 12);
      var revenue = 0;
      var saved = 0;
      Object.keys(kg).forEach(function (k) {
        revenue += kg[k] * prices[k] * c.recycle;
        saved += kg[k] * co2[k];
      });
      revenue = revenue * (1 - contamination) - transport;
      var totalKg = Object.keys(kg).reduce(function (a, k) { return a + kg[k]; }, 0);
      var score = clamp(100 - contamination * 140 - (transport > revenue ? 20 : 0), 0, 100);
      return {
        label: "Net recycling revenue",
        value: moneyUSD(revenue),
        sub: moneyLocal(revenue, v.country) + " after contamination and transport cost.",
        level: revenue > 0 ? "Worth collecting" : "Consolidate loads",
        levelClass: revenue > 0 ? "" : "warn",
        metrics: [
          metric("Material mass", fmt(totalKg), "kg/month"),
          metric("CO2 avoided proxy", fmt(saved, 0), "kg CO2e"),
          metric("Quality score", fmt(score), "/100"),
          metric("Contamination loss", fmt(contamination * 100), "%")
        ],
        breakdown: [
          row("Best value material", kg.aluminum > 0 ? "Aluminum" : "Plastic/paper", "Aluminum and clean metals usually carry the strongest price per kg."),
          row("Transport drag", moneyUSD(transport), "Small loads often lose money because transport eats the value."),
          row("Quality", score >= 70 ? "Clean stream" : "Needs sorting", "Dry, sorted, baled or bagged materials command better rates.")
        ],
        actions: [
          action("Sort at source", "Keep food waste and liquid out of dry recyclables. Contamination is the fastest way to lose revenue."),
          action("Pool pickups", "Combine with neighbors, tenants or nearby shops to reduce transport cost per kg."),
          action("Track buyer prices", "Record buyer, kg, price and rejection reasons each pickup. Use it to negotiate.")
        ]
      };
    },

    "charcoal-vs-clean": function (v) {
      var c = country(v.country);
      var kgWeek = Math.max(0.1, num(v.charcoalKgWeek, 8));
      var years = clamp(num(v.years, 5), 1, 10);
      var stoveCost = num(v.stoveCost, 65);
      var charcoalCost = kgWeek * c.charcoal * 52 * years;
      var alt = {
        lpg: { fuel: c.lpg * kgWeek * 0.42 * 52 * years, capex: stoveCost, label: "LPG" },
        electric: { fuel: c.power * kgWeek * 5.8 * 52 * years, capex: stoveCost * 1.4, label: "Electric" },
        biogas: { fuel: kgWeek * 0.08 * 52 * years, capex: stoveCost * 8, label: "Biogas" },
        ethanol: { fuel: kgWeek * 0.72 * 52 * years, capex: stoveCost * 1.2, label: "Ethanol" }
      }[v.cleanOption] || { fuel: c.lpg * kgWeek * 0.42 * 52 * years, capex: stoveCost, label: "LPG" };
      var cleanCost = alt.fuel + alt.capex;
      var savings = charcoalCost - cleanCost;
      var co2Saved = kgWeek * 52 * years * 2.9 * ({ lpg: 0.62, electric: 0.55, biogas: 0.82, ethanol: 0.7 }[v.cleanOption] || 0.62);
      var ventilation = { poor: 22, average: 10, good: 0, outdoor: -8 }[v.ventilation] || 8;
      var healthScore = clamp(62 + ventilation + kgWeek * 1.4 - (v.cleanOption === "biogas" ? 18 : 10), 0, 100);
      var l = level(healthScore);
      return {
        label: "Five-year savings",
        value: moneyUSD(savings),
        sub: alt.label + " compared with current charcoal use over " + years + " years.",
        level: savings >= 0 ? "Switch pays back" : "Needs subsidy or finance",
        levelClass: savings >= 0 ? "" : "warn",
        metrics: [
          metric("Current charcoal cost", moneyUSD(charcoalCost), ""),
          metric("Clean option cost", moneyUSD(cleanCost), ""),
          metric("CO2 reduction proxy", fmt(co2Saved, 0), "kg CO2e"),
          metric("Smoke-risk score", fmt(healthScore), "/100")
        ],
        breakdown: [
          row("Clean option", alt.label, "Fuel availability and refill distance can matter more than headline fuel price."),
          row("Ventilation", v.ventilation, "Poor ventilation makes household air pollution much worse."),
          row("Payback signal", savings >= 0 ? "Positive" : "Not yet", "Try a lower stove cost, group purchase or PAYGo option if savings are negative.")
        ],
        actions: [
          action("Price refills locally", "Check the real LPG, electricity or ethanol price near your home before buying the stove."),
          action("Improve ventilation immediately", "Even before switching fuels, cook near airflow and keep children away from smoke."),
          action("Finance the stove, not the smoke", "If the clean option saves money monthly, a small payment plan may beat weekly charcoal spend.")
        ]
      };
    }
  };

  function collectValues() {
    var out = {};
    document.querySelectorAll("[data-cl-field]").forEach(function (el) {
      var key = el.getAttribute("data-cl-field");
      if (el.type === "number" || el.getAttribute("data-cl-number") === "true") out[key] = num(el.value, 0);
      else out[key] = el.value;
    });
    return out;
  }

  var lastSummary = "";
  var lastResult = null;
  var lastInputs = null;
  var lastConfig = null;
  var pdfLoaderPromise = null;

  function renderList(el, items, kind) {
    if (!el) return;
    if (!items || !items.length) {
      el.innerHTML = '<div class="cl-empty-state">Run the calculator to see a tailored plan.</div>';
      return;
    }
    var cls = kind === "actions" ? "cl-action-list" : "cl-breakdown-list";
    el.innerHTML = '<ul class="' + cls + '">' + items.map(function (item) {
      return "<li><strong>" + esc(item.title || item.label) + "</strong>" +
        esc(item.body || item.value) +
        (item.detail ? "<span class=\"cl-field-help\">" + esc(item.detail) + "</span>" : "") +
        "</li>";
    }).join("") + "</ul>";
  }

  function renderSources(config) {
    var wrap = $("cl-sources");
    if (!wrap || !config || !config.sources) return;
    wrap.innerHTML = '<h2 class="cl-card-title">Sources and methodology</h2><ul class="cl-source-list">' +
      config.sources.map(function (s) {
        return '<li><a href="' + esc(s.href) + '" target="_blank" rel="noopener">' + esc(s.label) + '</a><span>' + esc(s.note) + '</span></li>';
      }).join("") + "</ul>";
  }

  function readJson(key, fallback) {
    try {
      var value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }

  function toolSlug(config) {
    return (config && (config.slug || config.tool)) || "";
  }

  function toolHref(config) {
    return (config && config.href) || window.location.pathname;
  }

  function applyValues(values, autoSubmit) {
    Object.keys(values || {}).forEach(function (key) {
      var el = document.querySelector('[data-cl-field="' + key + '"]');
      if (!el) return;
      el.value = values[key];
      el.dispatchEvent(new Event("change", { bubbles: true }));
    });
    if (autoSubmit) {
      var form = $("climateForm");
      if (form) {
        if (typeof form.requestSubmit === "function") form.requestSubmit();
        else form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      }
    }
  }

  function applyUrlAndJourneyDefaults() {
    var params = new URLSearchParams(window.location.search || "");
    var values = {};
    params.forEach(function (value, key) {
      if (document.querySelector('[data-cl-field="' + key + '"]')) values[key] = value;
    });
    var journey = readJson("afro_climate_journey", null);
    if (journey && journey.country && document.querySelector('[data-cl-field="country"]') && !values.country) {
      values.country = journey.country;
    }
    applyValues(values, false);
  }

  function initPresets() {
    document.querySelectorAll(".cl-preset-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var values = {};
        try { values = JSON.parse(btn.getAttribute("data-cl-preset") || "{}"); } catch (e) {}
        var countryEl = document.querySelector('[data-cl-field="country"]');
        if (countryEl && values.country == null) values.country = countryEl.value;
        applyValues(values, true);
      });
    });
  }

  function addQuery(href, values) {
    var url = new URL(href, window.location.origin);
    if (values && values.country) url.searchParams.set("country", values.country);
    if (lastConfig && lastConfig.workflow) url.searchParams.set("from", toolSlug(lastConfig));
    return url.pathname + url.search;
  }

  function decorateNextLinks(config, values) {
    var wrap = $("cl-next-links");
    if (!wrap || !config || !config.nextTools) return;
    wrap.innerHTML = config.nextTools.map(function (next) {
      return '<a class="cl-workflow-link" href="' + esc(addQuery(next.href || ("/tools/" + next.slug + "/"), values || {})) + '">' +
        '<strong>' + esc(next.shortName || next.slug) + '</strong><span>' + esc(next.tag || next.desc || "Open next tool") + '</span></a>';
    }).join("");
  }

  function logRecent(config) {
    var slug = toolSlug(config);
    try {
      if (window.AfroData && AfroData.logToolUse) AfroData.logToolUse(slug, config.shortName || config.title);
      else {
        var key = "afro_recent_v2_guest";
        var recent = readJson(key, []);
        recent = recent.filter(function (item) { return item.toolId !== slug; });
        recent.unshift({ toolId: slug, name: config.shortName || config.title || slug, date: new Date().toISOString() });
        writeJson(key, recent.slice(0, 20));
      }
    } catch (e) {}
  }

  function buildClimateItem(config, values, result) {
    var code = values && values.country || "";
    var countryName = (COUNTRIES[code] && COUNTRIES[code].name) || code || "Africa";
    var slug = toolSlug(config);
    return {
      id: "climate-" + slug + "-" + Date.now().toString(36),
      itemType: "climate-scenario",
      toolSlug: slug,
      toolName: config.shortName || config.title || slug,
      workflow: config.workflow || "",
      title: (config.shortName || config.title || slug) + " - " + countryName,
      country: code,
      countryName: countryName,
      href: toolHref(config),
      resultLabel: result.label,
      resultValue: result.value,
      resultSub: result.sub,
      level: result.level,
      metrics: result.metrics || [],
      actions: result.actions || [],
      nextTools: (config.nextTools || []).map(function (step) {
        return {
          slug: step.slug || "",
          label: step.shortName || step.label || step.slug || "Next step",
          href: step.href || (step.slug ? "/tools/" + step.slug + "/" : "/climate/")
        };
      }),
      inputs: values || {},
      createdAt: new Date().toISOString()
    };
  }

  async function syncWorkspaceItem(item) {
    if (!window.AfroWorkspace || !AfroWorkspace.upsert || !AfroWorkspace.isSignedIn || !AfroWorkspace.isSignedIn()) {
      return { synced: false };
    }
    try {
      await AfroWorkspace.upsert({
        itemType: "climate-scenario",
        itemKey: item.id,
        toolSlug: item.toolSlug,
        title: item.title,
        summary: item.resultLabel + ": " + item.resultValue + " - " + item.level,
        href: item.href,
        payload: item,
        meta: { country_code: item.country || "", workflow: item.workflow || "" }
      });
      return { synced: true };
    } catch (e) {
      console.warn("[Climate] workspace sync failed:", e.message || e);
      return { synced: false, error: e };
    }
  }

  async function saveClimateResult(config) {
    if (!lastResult || !lastInputs) return null;
    var item = buildClimateItem(config, lastInputs, lastResult);
    var items = readJson("afro_climate_workspace", []);
    if (!Array.isArray(items)) items = [];
    items.unshift(item);
    writeJson("afro_climate_workspace", items.slice(0, 30));
    try {
      if (window.AfroData && AfroData.save) AfroData.save(item.toolSlug, { inputs: item.inputs, outputs: lastResult, climate: true });
    } catch (e) {}
    var sync = await syncWorkspaceItem(item);
    try { window.dispatchEvent(new CustomEvent("afro-workspace-change", { detail: { action: "upsert", itemType: "climate-scenario", item: item, synced: sync.synced } })); } catch (e) {}
    return { item: item, synced: sync.synced };
  }

  function hasGateEmail() {
    try {
      if (localStorage.getItem("afrotools-email-gate") || localStorage.getItem("afrotools_lead_email")) return true;
      if (window.AfroAuth && AfroAuth.getUser && AfroAuth.getUser() && AfroAuth.getUser().email) return true;
    } catch (e) {}
    return false;
  }

  function rememberLeadEmail(email) {
    try {
      localStorage.setItem("afrotools-email-gate", email);
      localStorage.setItem("afrotools_lead_email", email);
    } catch (e) {}
  }

  function captureClimateLead(email, extra) {
    var payload = Object.assign({
      email: email,
      source: "climate-pdf-gate",
      toolSlug: toolSlug(lastConfig),
      countryCode: lastInputs && lastInputs.country || null,
      pageUrl: window.location.href,
      referrerUrl: document.referrer || null,
      optInDigest: true
    }, extra || {});
    try {
      return fetch("/api/capture-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }).catch(function () {});
    } catch (e) {
      return Promise.resolve();
    }
  }

  function showPdfGate(config, onDone) {
    if (hasGateEmail()) {
      onDone();
      return;
    }
    var overlay = document.createElement("div");
    overlay.className = "cl-email-overlay";
    overlay.innerHTML = '<div class="cl-email-modal" role="dialog" aria-modal="true" aria-labelledby="clEmailTitle">' +
      '<button type="button" class="cl-email-close" aria-label="Close">x</button>' +
      '<span class="cl-kicker">PDF report</span>' +
      '<h2 id="clEmailTitle">' + esc(config.pdfTitle || "Climate report") + '</h2>' +
      '<p>' + esc(config.leadMagnet || "Enter your email to download the PDF report.") + '</p>' +
      '<form id="clEmailForm">' +
      '<label>Email<input type="email" id="clLeadEmail" autocomplete="email" required placeholder="you@example.com"></label>' +
      '<label>Name<input type="text" id="clLeadName" autocomplete="name" placeholder="Optional"></label>' +
      '<label>Company<input type="text" id="clLeadCompany" autocomplete="organization" placeholder="Optional"></label>' +
      '<button class="cl-btn" type="submit">Download PDF</button>' +
      '<p class="cl-compact-note">We store the lead so AfroTools can send relevant Climate updates. No spam.</p>' +
      '</form></div>';
    document.body.appendChild(overlay);
    var email = $("clLeadEmail");
    var close = overlay.querySelector(".cl-email-close");
    var cleanup = function () { overlay.remove(); };
    if (email) setTimeout(function () { email.focus(); }, 30);
    if (close) close.addEventListener("click", cleanup);
    overlay.addEventListener("click", function (event) { if (event.target === overlay) cleanup(); });
    $("clEmailForm").addEventListener("submit", function (event) {
      event.preventDefault();
      var emailValue = ($("clLeadEmail").value || "").trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailValue)) {
        $("clLeadEmail").focus();
        return;
      }
      rememberLeadEmail(emailValue);
      captureClimateLead(emailValue, {
        name: ($("clLeadName").value || "").trim() || null,
        company: ($("clLeadCompany").value || "").trim() || null
      });
      cleanup();
      onDone();
    });
  }

  function loadJsPdf() {
    if (window.jspdf && window.jspdf.jsPDF) return Promise.resolve();
    if (pdfLoaderPromise) return pdfLoaderPromise;
    pdfLoaderPromise = new Promise(function (resolve, reject) {
      var script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      script.onload = resolve;
      script.onerror = function () { reject(new Error("Could not load PDF engine")); };
      document.head.appendChild(script);
    });
    return pdfLoaderPromise;
  }

  function pdfText(doc, text, x, y, width, lineHeight) {
    var lines = doc.splitTextToSize(String(text || ""), width);
    doc.text(lines, x, y);
    return y + lines.length * (lineHeight || 5);
  }

  async function generateClimatePdf(config) {
    if (!lastResult || !lastInputs) return;
    try {
      await loadJsPdf();
      var jsPDF = window.jspdf && window.jspdf.jsPDF;
      if (!jsPDF) throw new Error("PDF engine unavailable");
      var doc = new jsPDF({ unit: "mm", format: "a4" });
      var y = 18;
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 38, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("AFROTOOLS", 18, 14);
      doc.setFontSize(16);
      doc.text(config.pdfTitle || config.title || "Climate report", 18, 28);
      doc.setTextColor(17, 24, 39);
      y = 50;
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text((lastResult.label || "Result") + ": " + (lastResult.value || ""), 18, y);
      y += 7;
      doc.setFont("helvetica", "normal");
      y = pdfText(doc, lastResult.sub || "", 18, y, 174, 5) + 4;
      doc.setFont("helvetica", "bold");
      doc.text("Metrics", 18, y);
      y += 7;
      doc.setFont("helvetica", "normal");
      (lastResult.metrics || []).forEach(function (m) {
        if (y > 265) { doc.addPage(); y = 18; }
        doc.text(String(m.label || ""), 18, y);
        doc.text(String(m.value || "") + (m.unit ? " " + m.unit : ""), 190, y, { align: "right" });
        y += 6;
      });
      y += 4;
      doc.setFont("helvetica", "bold");
      doc.text("Action plan", 18, y);
      y += 7;
      doc.setFont("helvetica", "normal");
      (lastResult.actions || []).forEach(function (a, index) {
        if (y > 250) { doc.addPage(); y = 18; }
        doc.setFont("helvetica", "bold");
        doc.text((index + 1) + ". " + (a.title || "Action"), 18, y);
        y += 5;
        doc.setFont("helvetica", "normal");
        y = pdfText(doc, a.body || "", 22, y, 166, 4.5) + 2;
      });
      y += 4;
      doc.setFont("helvetica", "bold");
      doc.text("Method", 18, Math.min(y, 270));
      y = Math.min(y + 6, 276);
      doc.setFont("helvetica", "normal");
      pdfText(doc, (config.upgrade || "Scenario calculator with planning assumptions and action steps.") + " Reference pattern: " + (config.competitor || "Climate planning tools") + ".", 18, y, 174, 4.5);
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text("Planning estimate only. Verify with local authorities, engineers, auditors or official monitoring before formal decisions.", 105, 288, { align: "center" });
      var file = "afrotools-" + toolSlug(config) + "-" + new Date().toISOString().slice(0, 10) + ".pdf";
      doc.save(file);
    } catch (e) {
      console.warn("[Climate] PDF generation failed, falling back to print:", e.message || e);
      window.print();
    }
  }

  function initHub() {
    var cfg = window.AfroClimateHubConfig;
    var form = $("clPathForm");
    var output = $("clPathOutput");
    if (!cfg || !form || !output) return;
    function getTool(slug) {
      return (cfg.tools || []).find(function (tool) { return tool.slug === slug; }) || { slug: slug, shortName: slug, href: "/tools/" + slug + "/" };
    }
    function render() {
      var country = $("clPathCountry").value || "NG";
      var persona = $("clPathPersona").value || "farm";
      var goal = $("clPathGoal").value || "risk";
      var pathway = (cfg.pathways || []).find(function (p) { return p.id === persona; }) || (cfg.pathways || [])[0];
      var tools = (pathway && pathway.tools || []).map(getTool);
      writeJson("afro_climate_journey", { country: country, persona: persona, goal: goal, tools: tools.map(function (tool) { return tool.slug; }), savedAt: new Date().toISOString() });
      output.innerHTML = '<div class="cl-pathway-result-head"><strong>' + esc(pathway.label) + '</strong><span>' + esc(country) + " - " + esc(goal) + '</span></div>' +
        '<div class="cl-pathway-result-grid">' + tools.map(function (tool, index) {
          var href = addQuery(tool.href || ("/tools/" + tool.slug + "/"), { country: country });
          return '<a href="' + esc(href) + '"><span>' + (index + 1) + '</span><strong>' + esc(tool.shortName || tool.slug) + '</strong><em>' + esc(tool.workflow || tool.tag || "Run tool") + '</em></a>';
        }).join("") + '</div>';
    }
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      render();
    });
    form.addEventListener("change", render);
    render();
  }

  function renderResult(res, config) {
    $("cl-results").classList.add("on");
    lastResult = res;
    lastInputs = collectValues();
    lastConfig = config;
    $("cl-result-label").textContent = res.label;
    $("cl-result-value").textContent = res.value;
    $("cl-result-sub").textContent = res.sub;
    var pill = $("cl-result-level");
    pill.textContent = res.level;
    pill.className = "cl-risk-pill " + (res.levelClass || "");
    $("cl-metrics").innerHTML = (res.metrics || []).map(function (m) {
      return '<div class="cl-metric"><div class="cl-metric-label">' + esc(m.label) + '</div><div class="cl-metric-value">' + esc(m.value) + '</div><div class="cl-metric-unit">' + esc(m.unit || "") + '</div></div>';
    }).join("");
    renderList($("cl-breakdown"), res.breakdown, "breakdown");
    renderList($("cl-actions"), res.actions, "actions");
    renderSources(config);
    decorateNextLinks(config, lastInputs);
    logRecent(config);
    lastSummary = [
      config.title,
      res.label + ": " + res.value,
      res.sub,
      "Level: " + res.level,
      "Next actions:",
      (res.actions || []).map(function (a, i) { return (i + 1) + ". " + a.title + " - " + a.body; }).join("\n")
    ].join("\n");
    var copy = $("copyClimateSummary");
    if (copy) copy.disabled = false;
    var save = $("saveClimateDashboard");
    if (save) save.disabled = false;
    var pdf = $("downloadClimatePdf");
    if (pdf) pdf.disabled = false;
    $("cl-results").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function initFaq() {
    document.querySelectorAll(".cl-faq-q").forEach(function (btn) {
      btn.addEventListener("click", function () {
        btn.closest(".cl-faq-item").classList.toggle("open");
      });
    });
  }

  function init() {
    initHub();
    var config = window.AfroClimateToolConfig || {};
    var calc = CALCULATORS[config.tool];
    initFaq();
    renderSources(config);
    var form = $("climateForm");
    if (!form || !calc) return;
    lastConfig = config;
    applyUrlAndJourneyDefaults();
    initPresets();
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      renderResult(calc(collectValues()), config);
    });
    var copy = $("copyClimateSummary");
    if (copy) {
      copy.disabled = true;
      copy.addEventListener("click", function () {
        if (!lastSummary) return;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(lastSummary).then(function () {
            copy.textContent = "Copied summary";
            setTimeout(function () { copy.textContent = "Copy action plan"; }, 1400);
          });
        }
      });
    }
    var save = $("saveClimateDashboard");
    if (save) {
      save.disabled = true;
      save.addEventListener("click", function () {
        save.disabled = true;
        save.textContent = "Saving...";
        saveClimateResult(config).then(function (saved) {
          save.textContent = saved && saved.synced ? "Saved and synced" : "Saved to dashboard";
          setTimeout(function () {
            save.textContent = "Save to dashboard";
            save.disabled = !lastResult;
          }, 1600);
        }).catch(function () {
          save.textContent = "Save failed";
          setTimeout(function () {
            save.textContent = "Save to dashboard";
            save.disabled = !lastResult;
          }, 1600);
        });
      });
    }
    var pdf = $("downloadClimatePdf");
    if (pdf) {
      pdf.disabled = true;
      pdf.addEventListener("click", function () {
        if (!lastResult) return;
        showPdfGate(config, function () {
          pdf.disabled = true;
          pdf.textContent = "Generating PDF...";
          generateClimatePdf(config).then(function () {
            pdf.textContent = "Download PDF report";
            pdf.disabled = false;
          });
        });
      });
    }
  }

  window.AfroClimateTools = {
    calculate: function (tool, values) {
      if (!CALCULATORS[tool]) throw new Error("Unknown climate tool: " + tool);
      return CALCULATORS[tool](values || {});
    },
    countries: COUNTRIES
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
