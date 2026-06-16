/**
 * AfroTools AI construction workflow.
 *
 * Deterministic planning assistant for floor planning, AfroDraft, BOQ, and
 * material-estimate routing. It never claims engineering sign-off.
 */
(function initConstructionWorkflow(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(root);
  } else {
    root.AfroToolsAIConstructionWorkflow = factory(root);
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function createConstructionWorkflow(root) {
  "use strict";

  var sourceConfidence = root && root.AfroTools && root.AfroTools.sourceConfidence || null;
  if (!sourceConfidence && typeof require === "function") {
    try {
      sourceConfidence = require("../lib/source-confidence.js");
    } catch (err) {
      sourceConfidence = null;
    }
  }

  var CITY_COUNTRIES = {
    lagos: ["Lagos", "Nigeria", "NG"],
    abuja: ["Abuja", "Nigeria", "NG"],
    "benin city": ["Benin City", "Nigeria", "NG"],
    ibadan: ["Ibadan", "Nigeria", "NG"],
    accra: ["Accra", "Ghana", "GH"],
    kumasi: ["Kumasi", "Ghana", "GH"],
    nairobi: ["Nairobi", "Kenya", "KE"],
    mombasa: ["Mombasa", "Kenya", "KE"],
    kigali: ["Kigali", "Rwanda", "RW"],
    johannesburg: ["Johannesburg", "South Africa", "ZA"],
    joburg: ["Johannesburg", "South Africa", "ZA"],
    "cape town": ["Cape Town", "South Africa", "ZA"],
    yaounde: ["Yaounde", "Cameroon", "CM"],
    douala: ["Douala", "Cameroon", "CM"],
  };

  var COUNTRY_ALIASES = {
    nigeria: ["Nigeria", "NG"],
    naija: ["Nigeria", "NG"],
    ghana: ["Ghana", "GH"],
    kenya: ["Kenya", "KE"],
    rwanda: ["Rwanda", "RW"],
    cameroon: ["Cameroon", "CM"],
    "south africa": ["South Africa", "ZA"],
  };

  var TOOL_ROUTES = {
    "afroplan-floor-planner": "/engineering/floor-planner/",
    afrodraft: "/engineering/afrodraft/",
    "building-materials": "/tools/building-materials/",
    "boq-generator": "/tools/boq-builder/",
    "concrete-calc": "/tools/concrete-mix/",
    "construction-budget": "/tools/construction-budget/",
    "land-size": "/tools/land-size/",
    "survey-cost": "/tools/survey-cost/",
    "building-permit": "/tools/building-permit/",
  };

  function text(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function normalize(value) {
    return text(value).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function escapeHtml(value) {
    return String(value === undefined || value === null ? "" : value).replace(/[&<>"']/g, function (ch) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch];
    });
  }

  function titleCase(value) {
    return text(value).replace(/\w\S*/g, function (word) {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    });
  }

  function toNumber(value) {
    if (value === undefined || value === null || value === "") return null;
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    var parsed = Number(String(value).replace(/,/g, "").match(/-?\d+(?:\.\d+)?/) && String(value).replace(/,/g, "").match(/-?\d+(?:\.\d+)?/)[0]);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function positiveNumber(value) {
    var parsed = toNumber(value);
    return parsed !== null && parsed > 0 ? parsed : null;
  }

  function firstAlias(clean, map) {
    var keys = Object.keys(map).sort(function (a, b) { return b.length - a.length; });
    for (var i = 0; i < keys.length; i += 1) {
      var key = keys[i];
      var pattern = new RegExp("(^|\\b)" + key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(\\b|$)", "i");
      if (pattern.test(clean)) return map[key];
    }
    return null;
  }

  function parseMoney(raw) {
    var value = String(raw || "");
    var symbol = value.match(/(?<currency>\$|USD|NGN|KES|KSH|GHS|ZAR|RWF|XAF|XOF|R)\s?(?<amount>[0-9][0-9,]*(?:\.\d+)?)(?<suffix>\s?[km])?/i);
    var word = value.match(/\b(?<amount>[0-9][0-9,]*(?:\.\d+)?)(?<suffix>\s?[km])?\s?(?<currency>usd|dollars|ngn|naira|kes|ksh|ghs|cedis?|zar|rand|rwf|frw|xaf|xof)\b/i);
    return moneyFromGroups(symbol && symbol.groups || word && word.groups);
  }

  function moneyFromGroups(groups) {
    if (!groups) return { amount: null, currency: "" };
    var amount = Number(String(groups.amount || "").replace(/,/g, ""));
    if (!Number.isFinite(amount)) return { amount: null, currency: "" };
    var suffix = normalize(groups.suffix || "");
    if (suffix === "k") amount *= 1000;
    if (suffix === "m") amount *= 1000000;
    return { amount: amount, currency: normalizeCurrency(groups.currency || "") };
  }

  function normalizeCurrency(value) {
    var clean = String(value || "").toUpperCase().replace(/[^A-Z$]/g, "");
    var aliases = {
      "$": "USD",
      USD: "USD",
      DOLLARS: "USD",
      NGN: "NGN",
      NAIRA: "NGN",
      KES: "KES",
      KSH: "KES",
      GHS: "GHS",
      CEDI: "GHS",
      CEDIS: "GHS",
      ZAR: "ZAR",
      RAND: "ZAR",
      R: "ZAR",
      RWF: "RWF",
      FRW: "RWF",
      XAF: "XAF",
      XOF: "XOF",
    };
    return aliases[clean] || clean;
  }

  function detectLocation(raw, source) {
    var clean = normalize(raw);
    var cityHit = firstAlias(clean, CITY_COUNTRIES);
    if (cityHit) {
      source.city = source.city || cityHit[0];
      source.country = source.country || cityHit[1];
      source.countryCode = source.countryCode || cityHit[2];
    }
    var countryHit = firstAlias(clean, COUNTRY_ALIASES);
    if (countryHit) {
      source.country = source.country || countryHit[0];
      source.countryCode = source.countryCode || countryHit[1];
    }
    return source;
  }

  function parsePlot(raw, source) {
    var value = String(raw || "");
    var dimensions = value.match(/\b([0-9]{1,4}(?:\.\d+)?)\s?(?:x|by)\s?([0-9]{1,4}(?:\.\d+)?)\s?(?:m|meters?|metres?|ft|feet)?\b/i);
    var area = value.match(/\b([0-9][0-9,]*(?:\.\d+)?)\s?(sqm|sq\s?m|m2|square meters?|square metres?|hectares?|ha|acres?|plots?)\b/i);
    if (dimensions) {
      var length = Number(dimensions[1]);
      var width = Number(dimensions[2]);
      if (Number.isFinite(length) && Number.isFinite(width)) {
        source.plotLength = source.plotLength || length;
        source.plotWidth = source.plotWidth || width;
        source.plotSize = source.plotSize || Math.round(length * width * 100) / 100;
        source.plotUnit = source.plotUnit || "sqm";
      }
    } else if (area) {
      source.plotSize = source.plotSize || Number(area[1].replace(/,/g, ""));
      source.plotUnit = source.plotUnit || normalizePlotUnit(area[2]);
    }
    return source;
  }

  function normalizePlotUnit(value) {
    var clean = normalize(value);
    if (/hectare|ha/.test(clean)) return "hectare";
    if (/acre/.test(clean)) return "acre";
    if (/plot/.test(clean)) return "plot";
    return "sqm";
  }

  function parseRooms(raw, source) {
    var value = String(raw || "");
    var clean = normalize(value);
    var bedroom = value.match(/\b([1-9][0-9]?)\s?[- ]?(?:bed|bedroom|bedrooms|br)\b/i) || value.match(/\b(one|two|three|four|five|six)\s?[- ]?(?:bed|bedroom|bedrooms)\b/i);
    if (bedroom) source.rooms = source.rooms || { bedrooms: wordNumber(bedroom[1]), raw: bedroom[0] };
    var roomCount = value.match(/\b([1-9][0-9]?)\s+(?:rooms?|classrooms?|shops?|offices?)\b/i);
    if (roomCount && !source.rooms) source.rooms = { count: Number(roomCount[1]), raw: roomCount[0] };
    if (!source.rooms && /\bsmall room|single room|one room|room self contain|studio\b/.test(clean)) source.rooms = { count: 1, raw: "small room" };
    if (!source.buildingType) {
      var building = value.match(/\b(bungalow|duplex|flat|apartment|house|room|shop|office|classroom|school|warehouse|clinic|restaurant|studio)\b/i);
      if (building) source.buildingType = normalizeBuildingType(building[1]);
    }
    return source;
  }

  function wordNumber(value) {
    var clean = normalize(value);
    var words = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 };
    return words[clean] || Number(value);
  }

  function normalizeBuildingType(value) {
    var clean = normalize(value);
    if (clean === "flat" || clean === "apartment") return "apartment";
    if (clean === "room" || clean === "studio") return "small room";
    return clean || "";
  }

  function detectMaterial(raw) {
    var clean = normalize(raw);
    if (/\bblocks?|sandcrete|cement blocks?\b/.test(clean)) return "sandcrete blocks";
    if (/\bcement|mortar|plaster\b/.test(clean)) return "cement";
    if (/\bconcrete|granite|gravel\b/.test(clean)) return "concrete";
    if (/\bbrick|burnt brick\b/.test(clean)) return "brick";
    if (/\bsteel|iron rods?|rebar\b/.test(clean)) return "reinforced concrete";
    if (/\btimber|wood\b/.test(clean)) return "timber";
    if (/\blaterite|earth|mud\b/.test(clean)) return "laterite";
    return "";
  }

  function detectOutput(raw) {
    var clean = normalize(raw);
    if (/\bcad|cad like|cad-like|dxf|technical drawing|afrodraft|draft\b/.test(clean)) return "CAD-like plan";
    if (/\bboq|bill of quantities|quantity takeoff|materials list\b/.test(clean)) return "BOQ";
    if (/\bblocks?|cement|material|materials|estimate\b/.test(clean)) return "material estimate";
    if (/\bchecklist|approval|permit|documents\b/.test(clean)) return "checklist";
    if (/\bsketch|draw|design|floor plan|layout|plan\b/.test(clean)) return "sketch";
    return "";
  }

  function detectWorkflowKind(raw, inputs) {
    var clean = normalize(raw);
    if (/\bcad|afrodraft|dxf|technical drawing\b/.test(clean) || inputs.outputDesired === "CAD-like plan") return "cad";
    if (/\bblocks?|cement|material estimate|concrete|mortar|plaster\b/.test(clean) || inputs.outputDesired === "material estimate") return "materials";
    if (/\bboq|bill of quantities|quantity takeoff\b/.test(clean) || inputs.outputDesired === "BOQ") return "boq";
    if (/\bplot size|land size|convert|hectare|acre\b/.test(clean) && !/\bfloor plan|house plan|bedroom|building\b/.test(clean)) return "land";
    if (/\bbudget|building cost|construction cost\b/.test(clean)) return "budget";
    return "floor_plan";
  }

  function normalizeInputs(query, inputs) {
    var raw = text(query);
    var source = Object.assign({}, inputs || {});
    detectLocation(raw, source);
    parsePlot(raw, source);
    parseRooms(raw, source);
    var money = parseMoney(raw);
    if (money.amount !== null && !source.budget) source.budget = money.amount;
    source.currency = normalizeCurrency(source.currency || money.currency) || source.currency || "";
    var material = detectMaterial(raw);
    if (material) source.materialPreference = source.materialPreference || material;
    var output = detectOutput(raw);
    if (output) source.outputDesired = source.outputDesired || output;
    source.buildingType = source.buildingType || inferBuildingType(source);
    source.workflowKind = source.workflowKind || detectWorkflowKind(raw, source);
    return normalizeStructuredInputs(source);
  }

  function normalizeStructuredInputs(inputs) {
    var source = Object.assign({}, inputs || {});
    source.city = source.city ? titleCase(source.city) : "";
    source.country = source.country ? titleCase(source.country) : "";
    if (!source.countryCode && source.country) {
      var countryHit = COUNTRY_ALIASES[normalize(source.country)];
      source.countryCode = countryHit && countryHit[1] || "";
    }
    source.plotSize = positiveNumber(source.plotSize);
    source.plotLength = positiveNumber(source.plotLength);
    source.plotWidth = positiveNumber(source.plotWidth);
    source.plotUnit = normalizePlotUnit(source.plotUnit || (source.plotSize ? "sqm" : ""));
    if (!source.plotSize && source.plotLength && source.plotWidth) source.plotSize = Math.round(source.plotLength * source.plotWidth * 100) / 100;
    source.rooms = normalizeRooms(source.rooms);
    source.budget = positiveNumber(source.budget);
    source.currency = normalizeCurrency(source.currency) || source.currency || "";
    source.buildingType = normalizeBuildingType(source.buildingType || inferBuildingType(source));
    source.materialPreference = text(source.materialPreference);
    source.outputDesired = text(source.outputDesired);
    source.workflowKind = source.workflowKind || detectWorkflowKind("", source);
    return source;
  }

  function normalizeRooms(value) {
    if (!value) return null;
    if (typeof value === "number") return { count: value, raw: value + " rooms" };
    if (typeof value === "string") {
      var source = {};
      parseRooms(value, source);
      return source.rooms || { raw: value };
    }
    var out = Object.assign({}, value);
    if (out.bedrooms !== undefined) out.bedrooms = positiveNumber(out.bedrooms);
    if (out.count !== undefined) out.count = positiveNumber(out.count);
    out.raw = text(out.raw || (out.bedrooms ? out.bedrooms + " bedrooms" : out.count ? out.count + " rooms" : ""));
    return out;
  }

  function inferBuildingType(inputs) {
    if (inputs && inputs.rooms && inputs.rooms.bedrooms) return inputs.rooms.bedrooms <= 2 ? "bungalow" : "house";
    if (inputs && inputs.rooms && inputs.rooms.count === 1) return "small room";
    return "";
  }

  function getMissingInputs(inputs) {
    var values = normalizeStructuredInputs(inputs || {});
    var missing = [];
    if (!values.country && !values.city) missing.push("country");
    if (values.workflowKind === "materials" && !values.rooms && !values.plotSize) missing.push("roomSize");
    if ((values.workflowKind === "floor_plan" || values.workflowKind === "cad" || values.workflowKind === "boq") && !values.plotSize) missing.push("plotSize");
    if ((values.workflowKind === "floor_plan" || values.workflowKind === "cad") && !values.rooms) missing.push("rooms");
    if (!values.outputDesired) missing.push("outputDesired");
    return missing;
  }

  function selectedToolFor(inputs) {
    if (inputs.workflowKind === "cad") return "afrodraft";
    if (inputs.workflowKind === "materials") return inputs.materialPreference === "concrete" ? "concrete-calc" : "building-materials";
    if (inputs.workflowKind === "boq") return "boq-generator";
    if (inputs.workflowKind === "land") return "land-size";
    if (inputs.workflowKind === "budget") return "construction-budget";
    return "afroplan-floor-planner";
  }

  function materialToolFor(inputs) {
    if (inputs.materialPreference === "concrete") return "concrete-calc";
    if (inputs.workflowKind === "boq") return "boq-generator";
    return "building-materials";
  }

  function buildConstructionPlan(inputs, options) {
    var normalized = normalizeInputs(options && options.query || "", inputs || {});
    var selectedToolId = selectedToolFor(normalized);
    var materialToolId = materialToolFor(normalized);
    var area = estimateArea(normalized);
    var materialEstimate = estimateMaterials(normalized, area);
    var sourceState = buildSourceState(normalized);
    var assumptions = buildAssumptions(normalized, area);
    var nextTools = buildNextTools(normalized, selectedToolId, materialToolId);
    var brief = buildBrief(normalized, selectedToolId, area);
    return {
      kind: "construction_assistant",
      inputs: normalized,
      workflowKind: normalized.workflowKind,
      planningBrief: brief,
      assumptions: assumptions,
      selectedToolId: selectedToolId,
      selectedRoute: TOOL_ROUTES[selectedToolId],
      materialEstimateToolId: materialToolId,
      materialEstimateRoute: TOOL_ROUTES[materialToolId],
      materialEstimate: materialEstimate,
      nextTools: nextTools,
      sourceState: sourceState,
      missingInputs: getMissingInputs(normalized),
      floorPlannerPrefillInputs: floorPlannerPrefill(normalized, area),
      afroDraftPrefillInputs: draftPrefill(normalized, area),
      materialPrefillInputs: materialPrefill(normalized, area, materialEstimate),
      boqPrefillInputs: boqPrefill(normalized, area),
      landSizePrefillInputs: landPrefill(normalized),
      checklist: approvalChecklist(normalized),
      warning: "Planning estimate only. AfroTools does not provide permit drawings, structural design, site supervision, or professional architectural/engineering sign-off. Confirm setbacks, soil, drainage, structure, fire safety, title, and building approvals with licensed local professionals and the relevant authority.",
    };
  }

  function estimateArea(inputs) {
    var bedrooms = inputs.rooms && inputs.rooms.bedrooms || 0;
    var roomCount = inputs.rooms && inputs.rooms.count || 0;
    var floorArea = 0;
    if (bedrooms) floorArea = bedrooms <= 1 ? 42 : bedrooms === 2 ? 82 : 82 + (bedrooms - 2) * 24;
    else if (roomCount) floorArea = roomCount <= 1 ? 13 : roomCount * 14;
    else floorArea = inputs.buildingType === "shop" ? 24 : 75;
    var plotSqm = plotToSqm(inputs.plotSize, inputs.plotUnit);
    if (plotSqm) {
      var maxFootprint = Math.max(18, Math.round(plotSqm * 0.45));
      floorArea = Math.min(floorArea, maxFootprint);
    }
    return {
      plotSqm: plotSqm,
      estimatedBuiltAreaSqm: Math.round(floorArea),
      coveragePercent: plotSqm ? Math.round((floorArea / plotSqm) * 100) : null,
    };
  }

  function plotToSqm(size, unit) {
    if (!size) return null;
    if (unit === "hectare") return size * 10000;
    if (unit === "acre") return size * 4046.86;
    if (unit === "plot") return size * 450;
    return size;
  }

  function estimateMaterials(inputs, area) {
    var builtArea = area.estimatedBuiltAreaSqm || 13;
    var singleRoom = inputs.workflowKind === "materials" && (!inputs.rooms || inputs.rooms.count === 1) && !inputs.plotSize;
    if (singleRoom) builtArea = 13;
    var wallArea = Math.round(builtArea * (singleRoom ? 3.4 : 2.9));
    var blockCount = Math.ceil((wallArea * 0.85 / 0.09) * 1.1);
    var mortarBags = Math.ceil(blockCount / 55);
    var plasterBags = Math.ceil(wallArea / 10);
    var slabBags = Math.ceil((builtArea * 0.1 * 7.5) || 0);
    return {
      basis: singleRoom ? "small room assumption, about 3.6m x 3.6m with 3m wall height" : "early built-area and wall-area planning ratios",
      estimatedBuiltAreaSqm: builtArea,
      wallAreaSqm: wallArea,
      blocks: blockCount,
      cementBagsForMasonry: mortarBags,
      cementBagsForPlaster: plasterBags,
      cementBagsForFloorSlab: slabBags,
      totalCementBagsPlanningRange: [Math.max(1, mortarBags + plasterBags), Math.max(2, mortarBags + plasterBags + slabBags)],
      wasteAllowancePercent: 10,
    };
  }

  function buildAssumptions(inputs, area) {
    var assumptions = [];
    if (inputs.city || inputs.country) assumptions.push("Location: " + [inputs.city, inputs.country].filter(Boolean).join(", ") + ".");
    if (area.plotSqm) assumptions.push("Plot area treated as about " + Math.round(area.plotSqm) + " sqm before setbacks and local planning rules.");
    if (inputs.rooms && inputs.rooms.bedrooms) assumptions.push("Room program interpreted as " + inputs.rooms.bedrooms + " bedroom(s), with basic living, kitchen, bathroom, and circulation space.");
    else if (inputs.rooms && inputs.rooms.count) assumptions.push("Room program interpreted as " + inputs.rooms.count + " room(s).");
    if (inputs.buildingType) assumptions.push("Building type: " + inputs.buildingType + ".");
    if (inputs.materialPreference) assumptions.push("Material preference: " + inputs.materialPreference + ".");
    if (inputs.budget) assumptions.push("Budget is user-entered and not validated against live supplier quotes.");
    assumptions.push("No soil test, survey plan, title check, structural span, roof form, or authority setback rule has been verified.");
    assumptions.push("Material quantities include rough waste allowances and should be remeasured from a final drawing.");
    return assumptions;
  }

  function buildBrief(inputs, toolId, area) {
    var place = [inputs.city, inputs.country].filter(Boolean).join(", ") || "your location";
    var program = inputs.rooms && inputs.rooms.bedrooms ? inputs.rooms.bedrooms + "-bedroom " + (inputs.buildingType || "home") : (inputs.rooms && inputs.rooms.raw || inputs.buildingType || "building");
    if (toolId === "afrodraft") return "Create a CAD-like drafting workspace for a " + program + " in " + place + ". Start with a simple room block-out, then add dimensions, doors, windows, notes, and export only after professional review.";
    if (toolId === "building-materials" || toolId === "concrete-calc") return "Estimate early blocks, cement, and related material quantities for " + program + " in " + place + ". Use this as a shopping-list starting point, then remeasure from final drawings.";
    if (toolId === "boq-generator") return "Prepare a BOQ-oriented construction planning pack for " + program + " in " + place + ", using early assumptions for substructure, walls, finishes, services, and contingency.";
    if (toolId === "land-size") return "Convert and sanity-check the plot size before layout work. Confirm boundary dimensions with a survey plan before design decisions.";
    return "Plan a simple " + program + " for " + place + (area.plotSqm ? " on about " + Math.round(area.plotSqm) + " sqm of land" : "") + ". Start with a concept sketch and route detailed quantities to the material and BOQ tools.";
  }

  function buildNextTools(inputs, selectedToolId, materialToolId) {
    var ids = [selectedToolId, materialToolId, "boq-generator", "land-size", "building-permit", "survey-cost"];
    if (inputs.outputDesired === "CAD-like plan") ids.splice(1, 0, "afrodraft");
    return unique(ids).map(function (id) {
      return {
        id: id,
        title: toolTitle(id),
        route: TOOL_ROUTES[id],
        reason: toolReason(id),
      };
    }).filter(function (tool) { return tool.route; });
  }

  function toolTitle(id) {
    return {
      "afroplan-floor-planner": "Floor Planner",
      afrodraft: "AfroDraft 2D CAD",
      "building-materials": "Building Material Cost Estimator",
      "boq-generator": "BOQ Builder",
      "concrete-calc": "Concrete Mix Calculator",
      "construction-budget": "Construction Budget Planner",
      "land-size": "Land Size Calculator",
      "survey-cost": "Land Survey Cost Estimator",
      "building-permit": "Building Permit Checklist",
    }[id] || id;
  }

  function toolReason(id) {
    return {
      "afroplan-floor-planner": "Sketch the room layout and export concept notes.",
      afrodraft: "Draw a CAD-like plan with dimensions and annotations.",
      "building-materials": "Estimate blocks, cement, roofing, tiles, and other material costs.",
      "boq-generator": "Turn assumptions into a BOQ-style cost structure.",
      "concrete-calc": "Estimate cement, sand, and aggregate for concrete.",
      "construction-budget": "Plan phase-by-phase construction budget pressure.",
      "land-size": "Convert plot units and dimensions before layout decisions.",
      "survey-cost": "Estimate survey and title-process costs.",
      "building-permit": "Check approval documents and local authority steps.",
    }[id] || "Open the relevant AfroTools construction tool.";
  }

  function buildSourceState(inputs) {
    var meta = [
      sourceMeta("construction-planning-estimates", "AfroTools construction planning heuristics", "estimate", [inputs.countryCode || "ALL"], "unknown", "estimated", "Early-stage layout and material rules. Not based on live supplier quotes or site inspection."),
      sourceMeta("user-entered-construction-inputs", "User-entered construction inputs", "user_input", [inputs.countryCode || "ALL"], "unknown", "user_entered", "Prompt and clarification values supplied by the user."),
    ];
    return meta.map(function (item) {
      if (!sourceConfidence || typeof sourceConfidence.normalizeDataSourceMeta !== "function") return item;
      try {
        return sourceConfidence.normalizeDataSourceMeta(item);
      } catch (err) {
        return item;
      }
    });
  }

  function sourceMeta(id, name, type, countryCodes, freshness, confidence, notes) {
    return {
      id: id,
      sourceName: name,
      sourceType: type,
      countryCodes: countryCodes,
      effectiveFrom: null,
      effectiveTo: null,
      lastCheckedAt: null,
      lastReviewedAt: null,
      freshnessStatus: freshness,
      confidence: confidence,
      notes: notes,
    };
  }

  function approvalChecklist(inputs) {
    var place = [inputs.city, inputs.country].filter(Boolean).join(", ") || "your local authority";
    return [
      "Confirm title, survey plan, boundary dimensions, setbacks, right of way, and drainage constraints.",
      "Ask a licensed architect or building designer to convert the concept into permit drawings.",
      "Ask a structural engineer to review foundations, columns, beams, slab, roof, soil, and spans.",
      "Confirm building approval requirements, fees, inspections, and penalties with " + place + ".",
      "Get supplier quotes before treating materials, labour, or BOQ totals as a budget.",
    ];
  }

  function floorPlannerPrefill(inputs, area) {
    return {
      country: inputs.country,
      city: inputs.city,
      plotSize: inputs.plotSize,
      plotUnit: inputs.plotUnit,
      buildingType: inputs.buildingType,
      rooms: inputs.rooms && (inputs.rooms.raw || inputs.rooms.bedrooms || inputs.rooms.count),
      estimatedBuiltAreaSqm: area.estimatedBuiltAreaSqm,
      outputDesired: inputs.outputDesired || "sketch",
    };
  }

  function draftPrefill(inputs, area) {
    return Object.assign({}, floorPlannerPrefill(inputs, area), {
      drawingMode: "concept-plan",
      exportIntent: "cad-like-plan",
    });
  }

  function materialPrefill(inputs, area, estimate) {
    return {
      country: inputs.country,
      city: inputs.city,
      buildingType: inputs.buildingType,
      floorAreaSqm: area.estimatedBuiltAreaSqm,
      wallAreaSqm: estimate.wallAreaSqm,
      materialPreference: inputs.materialPreference || "blocks and cement",
      rooms: inputs.rooms && (inputs.rooms.raw || inputs.rooms.bedrooms || inputs.rooms.count),
      budget: inputs.budget,
      currency: inputs.currency,
    };
  }

  function boqPrefill(inputs, area) {
    return {
      country: inputs.country,
      city: inputs.city,
      projectType: inputs.buildingType || "residential",
      floorAreaSqm: area.estimatedBuiltAreaSqm,
      plotSize: inputs.plotSize,
      plotUnit: inputs.plotUnit,
      budget: inputs.budget,
      currency: inputs.currency,
    };
  }

  function landPrefill(inputs) {
    return {
      country: inputs.country,
      city: inputs.city,
      plotSize: inputs.plotSize,
      plotUnit: inputs.plotUnit,
      length: inputs.plotLength,
      width: inputs.plotWidth,
    };
  }

  function unique(values) {
    var seen = {};
    return values.filter(function (value) {
      if (!value || seen[value]) return false;
      seen[value] = true;
      return true;
    });
  }

  function formatNumber(value, suffix) {
    if (value === undefined || value === null || value === "") return "Not set";
    var number = Number(value);
    var formatted = Number.isFinite(number) ? number.toLocaleString("en-US", { maximumFractionDigits: 0 }) : String(value);
    return formatted + (suffix || "");
  }

  function list(items) {
    return '<ul class="ai-list">' + (items || []).map(function (item) {
      return "<li>" + escapeHtml(item) + "</li>";
    }).join("") + "</ul>";
  }

  function renderConstructionPanel(plan) {
    if (!plan) return "";
    var estimate = plan.materialEstimate || {};
    var sourceRows = (plan.sourceState || []).map(function (source) {
      return '<span class="ai-source-pill">' + escapeHtml(source.sourceName || source.id) + " - " + escapeHtml(source.freshnessStatus || "unknown") + " - " + escapeHtml(source.confidence || "estimated") + "</span>";
    }).join("");
    var tools = (plan.nextTools || []).map(function (tool) {
      return '<a class="ai-small-button secondary" href="' + escapeHtml(tool.route) + '" data-construction-tool-link data-tool-id="' + escapeHtml(tool.id) + '">' + escapeHtml(tool.title) + '</a>';
    }).join("");
    return '<section class="ai-construction-panel" data-construction-workflow>' +
      '<div class="ai-workflow-panel-head"><div><span class="ai-kicker">Construction assistant</span><h4>Planning brief</h4></div><span class="ai-chip">Planning estimate only</span></div>' +
      '<p>' + escapeHtml(plan.planningBrief) + '</p>' +
      '<div class="ai-result-grid">' +
      '<div><strong>Suggested route</strong><span>' + escapeHtml(toolTitle(plan.selectedToolId)) + '</span></div>' +
      '<div><strong>Material route</strong><span>' + escapeHtml(toolTitle(plan.materialEstimateToolId)) + '</span></div>' +
      '<div><strong>Built area</strong><span>' + escapeHtml(formatNumber(estimate.estimatedBuiltAreaSqm, " sqm")) + '</span></div>' +
      '<div><strong>Blocks</strong><span>' + escapeHtml(formatNumber(estimate.blocks)) + '</span></div>' +
      '<div><strong>Cement bags</strong><span>' + escapeHtml((estimate.totalCementBagsPlanningRange || []).join(" to ") || "Not set") + '</span></div>' +
      '</div>' +
      '<div class="ai-mini-panel"><strong>Assumptions</strong>' + list(plan.assumptions) + '</div>' +
      '<div class="ai-mini-panel"><strong>Approval and safety checklist</strong>' + list(plan.checklist) + '</div>' +
      '<div class="ai-source-row" aria-label="Source confidence">' + sourceRows + '</div>' +
      '<div class="ai-actions">' + tools + '</div>' +
      '<div class="ai-warning" role="note">' + escapeHtml(plan.warning) + '</div>' +
      '</section>';
  }

  return {
    normalizeInputs: normalizeInputs,
    getMissingInputs: getMissingInputs,
    buildConstructionPlan: buildConstructionPlan,
    renderConstructionPanel: renderConstructionPanel,
    TOOL_ROUTES: TOOL_ROUTES,
  };
});
