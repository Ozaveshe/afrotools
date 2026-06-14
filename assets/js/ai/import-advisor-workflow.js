/**
 * AfroTools AI import advisor workflow.
 *
 * Deterministic first: extracts vehicle/product import details, asks for
 * missing price/freight/FX inputs, and produces a planning estimate without a
 * model provider. Browser builds expose window.AfroToolsAIImportAdvisorWorkflow;
 * tests/server tooling use CommonJS.
 */
(function initImportAdvisorWorkflow(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(root);
  } else {
    root.AfroToolsAIImportAdvisorWorkflow = factory(root);
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function createImportAdvisorWorkflow(root) {
  "use strict";

  var importEngine = root && root.AfroImportDutyNigeriaEngine || null;
  if (!importEngine && typeof require === "function") {
    try {
      importEngine = require("../engines/import-duty-nigeria-engine.js");
    } catch (err) {
      importEngine = null;
    }
  }

  var DESTINATION_COUNTRIES = {
    nigeria: "Nigeria",
    lagos: "Nigeria",
    apapa: "Nigeria",
    "tin can": "Nigeria",
    "tin-can": "Nigeria",
    ghana: "Ghana",
    tema: "Ghana",
    kenya: "Kenya",
    mombasa: "Kenya",
    "south africa": "South Africa",
    durban: "South Africa",
    cameroon: "Cameroon",
    douala: "Cameroon",
    tanzania: "Tanzania",
    uganda: "Uganda",
    zambia: "Zambia",
  };

  var ORIGIN_COUNTRIES = {
    china: "China",
    japan: "Japan",
    usa: "United States",
    "united states": "United States",
    america: "United States",
    uk: "United Kingdom",
    "united kingdom": "United Kingdom",
    dubai: "UAE",
    uae: "UAE",
    "united arab emirates": "UAE",
    germany: "Germany",
    canada: "Canada",
    korea: "South Korea",
  };

  var VEHICLE_MAKES = [
    "toyota",
    "honda",
    "mazda",
    "nissan",
    "hyundai",
    "kia",
    "lexus",
    "bmw",
    "mercedes",
    "mercedes-benz",
    "volkswagen",
    "vw",
    "ford",
    "mitsubishi",
    "suzuki",
    "peugeot",
  ];

  var PRODUCT_PATTERNS = [
    { key: "vehicle", label: "Vehicle", category: "vehicle", pattern: /\b(car|vehicle|toyota|honda|mazda|nissan|hyundai|kia|lexus|bmw|mercedes|volkswagen|vw|ford|mitsubishi|suzuki|peugeot|axio|camry|rav4|prado|corolla)\b/i },
    { key: "electronics", label: "Electronics", category: "electronics", pattern: /\b(phone|phones|laptop|laptops|computer|computers|tablet|electronics?|charger|appliance|tv|television)\b/i },
    { key: "clothing", label: "Clothing / textiles", category: "clothing", pattern: /\b(cloth|clothes|clothing|textile|textiles|fabric|fabrics|shoes|bags|garment|garments)\b/i },
    { key: "machinery", label: "Machinery", category: "machinery", pattern: /\b(machine|machinery|generator|equipment|tractor|industrial|compressor|pump|engine)\b/i },
    { key: "food", label: "Food / agriculture", category: "food", pattern: /\b(food|rice|wheat|maize|fish|oil|agric|agriculture|grain)\b/i },
    { key: "household", label: "Household goods", category: "household", pattern: /\b(furniture|household|mattress|kitchen|tiles|decor)\b/i },
  ];

  var FALLBACK_RATES = {
    vehicle: 0.35,
    electronics: 0.15,
    clothing: 0.2,
    machinery: 0.1,
    household: 0.1,
    food: 0.2,
    other: 0.1,
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

  function escapeRegex(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function firstAlias(textValue, map) {
    var keys = Object.keys(map).sort(function byLength(a, b) {
      return b.length - a.length;
    });
    for (var i = 0; i < keys.length; i += 1) {
      var key = keys[i];
      var pattern = new RegExp("(^|\\b)" + escapeRegex(key) + "(\\b|$)", "i");
      if (pattern.test(textValue)) return map[key];
    }
    return "";
  }

  function toNumber(value) {
    if (value === undefined || value === null || value === "") return null;
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    var match = String(value).replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
    if (!match) return null;
    var parsed = Number(match[0]);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function positiveNumber(value) {
    var parsed = toNumber(value);
    return parsed !== null && parsed >= 0 ? parsed : null;
  }

  function moneyFromMatch(match) {
    if (!match) return { amount: null, currency: "" };
    var amount = Number(String(match.amount || "").replace(/,/g, ""));
    if (!Number.isFinite(amount)) return { amount: null, currency: "" };
    var suffix = String(match.suffix || "").toLowerCase();
    if (suffix === "k") amount *= 1000;
    if (suffix === "m") amount *= 1000000;
    return { amount: amount, currency: normalizeCurrency(match.currency || "") };
  }

  function parseMoney(query) {
    var raw = String(query || "");
    var symbol = raw.match(/(?<currency>\$|USD|NGN|KES|GHS|ZAR|XAF|XOF)\s?(?<amount>[0-9][0-9,]*(?:\.\d+)?)(?<suffix>\s?[km])?/i);
    var word = raw.match(/\b(?<amount>[0-9][0-9,]*(?:\.\d+)?)(?<suffix>\s?[km])?\s?(?<currency>usd|dollars|ngn|naira|kes|ksh|ghs|zar|xaf|xof)\b/i);
    return moneyFromMatch(symbol && symbol.groups || word && word.groups);
  }

  function parseLabeledMoney(query, labels) {
    var labelPattern = labels.join("|");
    var after = new RegExp("\\b(?:" + labelPattern + ")\\s*(?:is|of|costs?|:)?\\s*(\\$|USD|NGN|KES|GHS|ZAR|XAF|XOF)?\\s?([0-9][0-9,]*(?:\\.\\d+)?)(\\s?[km])?", "i");
    var before = new RegExp("(\\$|USD|NGN|KES|GHS|ZAR|XAF|XOF)?\\s?([0-9][0-9,]*(?:\\.\\d+)?)(\\s?[km])?\\s*(?:for\\s+)?(?:the\\s+)?(?:" + labelPattern + ")\\b", "i");
    var match = String(query || "").match(after);
    if (match) return moneyFromMatch({ currency: match[1] || "", amount: match[2], suffix: match[3] || "" });
    match = String(query || "").match(before);
    if (match) return moneyFromMatch({ currency: match[1] || "", amount: match[2], suffix: match[3] || "" });
    return { amount: null, currency: "" };
  }

  function normalizeCurrency(value) {
    var clean = String(value || "").toUpperCase().replace(/[^A-Z$]/g, "");
    var aliases = {
      "$": "USD",
      USD: "USD",
      DOLLARS: "USD",
      DOLLAR: "USD",
      NGN: "NGN",
      NAIRA: "NGN",
      KES: "KES",
      KSH: "KES",
      GHS: "GHS",
      ZAR: "ZAR",
      XAF: "XAF",
      XOF: "XOF",
    };
    return aliases[clean] || (clean.length === 3 ? clean : "");
  }

  function inferProduct(query) {
    var raw = String(query || "");
    for (var i = 0; i < PRODUCT_PATTERNS.length; i += 1) {
      if (PRODUCT_PATTERNS[i].pattern.test(raw)) return PRODUCT_PATTERNS[i];
    }
    return { key: "other", label: "Other / manual", category: "other" };
  }

  function parseVehicle(query, source) {
    var raw = String(query || "");
    var make = text(source.make || source.vehicleMake || "");
    var model = text(source.model || source.vehicleModel || "");
    var year = text(source.year || source.vehicleYear || "");
    var makePattern = VEHICLE_MAKES.map(escapeRegex).join("|");
    var vehicle = raw.match(new RegExp("\\b(" + makePattern + ")\\s+([a-z0-9 -]{2,42}?)(?:\\s+(?:worth|valued|costing|from|into|to|in|with|for|shipping|freight|insurance|fx)\\b|[?.!,]|$)", "i"));
    if (vehicle) {
      if (!make) make = vehicle[1].replace(/^vw$/i, "Volkswagen");
      if (!model) model = text(vehicle[2]).replace(/\b(used|new)\b/gi, "").trim();
    }
    var category = text(source.itemCategory || source.vehicle || source.item || "");
    var vehicleFromCategory = category.match(new RegExp("^(" + makePattern + ")\\s+(.+)$", "i"));
    if (vehicleFromCategory) {
      if (!make) make = vehicleFromCategory[1].replace(/^vw$/i, "Volkswagen");
      if (!model) model = text(vehicleFromCategory[2]);
    }
    var yearMatch = raw.match(/\b(19[8-9]\d|20[0-3]\d)\b/);
    if (!year && yearMatch) year = yearMatch[1];
    var cc = positiveNumber(source.engineCc || source.engineSizeCc);
    var engineCc = raw.match(/\b([1-5][0-9]{2,3})\s?cc\b/i);
    var engineLitres = raw.match(/\b([1-6](?:\.\d)?)\s?l(?:itre|iter)?\b/i);
    if (cc === null && engineCc) cc = Number(engineCc[1]);
    if (cc === null && engineLitres) cc = Math.round(Number(engineLitres[1]) * 1000);
    return {
      make: titleCase(make),
      model: titleCase(model),
      year: year,
      engineCc: cc,
      itemCategory: text(source.itemCategory || "") || text([make, model].filter(Boolean).join(" ")),
    };
  }

  function titleCase(value) {
    var clean = text(value);
    if (!clean) return "";
    return clean.replace(/\b[a-z]/gi, function (ch) { return ch.toUpperCase(); });
  }

  function detectPort(query, source) {
    var clean = normalize(String(query || "") + " " + (source.port || source.arrivalPort || ""));
    if (/\btin\s*can\b|\btin-can\b/.test(clean)) return "tin-can";
    if (/\bapapa\b/.test(clean)) return "apapa";
    if (/\bonne?h\b|\bonne\b/.test(clean)) return "onneh";
    if (/\blagos airport\b|\bairport\b/.test(clean)) return "airport-lagos";
    return text(source.port || source.arrivalPort || "");
  }

  function normalizeInputs(query, inputs) {
    var raw = String(query || "");
    var clean = normalize(raw);
    var source = inputs || {};
    var product = inferProduct(raw);
    var vehicle = parseVehicle(raw, source);
    var genericMoney = parseMoney(raw);
    var purchase = parseLabeledMoney(raw, ["purchase price", "price", "value", "cost", "quote", "fob"]);
    var shipping = parseLabeledMoney(raw, ["shipping", "freight", "shipment"]);
    var insurance = parseLabeledMoney(raw, ["insurance"]);
    var fx = raw.match(/\b(?:fx|exchange rate|rate)\s*(?:is|of|:)?\s*([0-9][0-9,]*(?:\.\d+)?)\b/i);
    var destination = text(source.destinationCountry || source.country) || firstAlias(clean, DESTINATION_COUNTRIES);
    var origin = text(source.originCountry || "") || firstAlias(clean.replace(/\b(?:into|to)\s+nigeria\b/g, ""), ORIGIN_COUNTRIES);
    var mode = text(source.mode || source.importMode || "");
    if (!mode && product.key === "vehicle") mode = "car";
    if (!mode) mode = "goods";
    var itemCategory = text(source.itemCategory || source.productName || source.item || "");
    if (!itemCategory && product.key === "vehicle") itemCategory = vehicle.itemCategory;
    if (!itemCategory) {
      var itemMatch = raw.match(/\b(?:import|ship|bring)\s+(?:an?\s+|some\s+)?([a-z0-9 -]{3,48}?)(?:\s+(?:from|into|to|worth|valued|costing|with|for|shipping|freight|insurance)\b|[?.!,]|$)/i);
      itemCategory = itemMatch ? text(itemMatch[1]) : product.label;
    }
    var purchaseAmount = positiveNumber(source.purchasePrice || source.itemValue || source.value || source.cifValue);
    if (purchaseAmount === null) purchaseAmount = purchase.amount !== null ? purchase.amount : genericMoney.amount;
    var shippingAmount = positiveNumber(source.shippingCost || source.freight || source.shipping);
    if (shippingAmount === null) shippingAmount = shipping.amount;
    var insuranceAmount = positiveNumber(source.insuranceCost || source.insurance);
    if (insuranceAmount === null) insuranceAmount = insurance.amount;
    var fxRate = positiveNumber(source.fxRate || source.userFxRate);
    if (fxRate === null && fx) fxRate = positiveNumber(fx[1]);
    var currency = normalizeCurrency(source.currency || source.itemCurrency || purchase.currency || genericMoney.currency || "USD");
    return {
      mode: mode === "car" || mode === "vehicle" ? "car" : "goods",
      destinationCountry: destination,
      productCategory: product.category,
      productCategoryLabel: product.label,
      itemCategory: itemCategory,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      vehicleType: text(source.vehicleType || "") || (product.key === "vehicle" ? "sedan" : ""),
      engineCc: vehicle.engineCc,
      purchasePrice: purchaseAmount,
      itemValue: purchaseAmount,
      currency: currency,
      shippingCost: shippingAmount,
      insuranceCost: insuranceAmount,
      originCountry: origin,
      port: detectPort(raw, source),
      fxRate: fxRate,
    };
  }

  function hasValue(value) {
    return !(value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0));
  }

  function getMissingInputs(inputs) {
    var missing = [];
    if (!hasValue(inputs.destinationCountry)) missing.push("destinationCountry");
    if (!hasValue(inputs.itemCategory) || inputs.itemCategory === "Other / manual") missing.push("itemCategory");
    if (!hasValue(inputs.purchasePrice)) missing.push("purchasePrice");
    if (!hasValue(inputs.shippingCost)) missing.push("shippingCost");
    if (!hasValue(inputs.fxRate)) missing.push("fxRate");
    return missing;
  }

  function estimateWithEngine(inputs) {
    var engine = importEngine;
    if (!engine || typeof engine.calculate !== "function") return null;
    var category = inputs.mode === "car" ? "vehicle" : inputs.productCategory || "other";
    try {
      return engine.calculate({
        countryName: inputs.destinationCountry || "Nigeria",
        category: category,
        itemValue: inputs.purchasePrice || inputs.itemValue || 0,
        itemCurrency: inputs.currency || "USD",
        freight: inputs.shippingCost || 0,
        insurance: inputs.insuranceCost || 0,
        originCountry: inputs.originCountry || "",
        arrivalPort: inputs.port || "",
        vehicleType: inputs.vehicleType || "",
        vehicleMake: inputs.make || "",
        vehicleModel: inputs.model || "",
        vehicleYear: inputs.year || "",
        engineSize: inputs.engineCc || "",
        fxMode: inputs.fxRate ? "user" : "stored",
        fxRate: inputs.fxRate || 0,
      });
    } catch (err) {
      return null;
    }
  }

  function estimateFallback(inputs) {
    var category = inputs.mode === "car" ? "vehicle" : inputs.productCategory || "other";
    var fob = inputs.purchasePrice || inputs.itemValue || 0;
    var freight = inputs.shippingCost || 0;
    var insurance = inputs.insuranceCost || 0;
    var cif = round(fob + freight + insurance);
    var rate = FALLBACK_RATES[category] === undefined ? FALLBACK_RATES.other : FALLBACK_RATES[category];
    var duty = round(cif * rate);
    var levies = round(cif * 0.015 + duty * 0.07);
    var vat = round((cif + duty + levies) * 0.075);
    var clearing = inputs.mode === "car" ? 0 : 0;
    var total = round(cif + duty + levies + vat + clearing);
    var fxRate = inputs.fxRate || 1600;
    return {
      category: category,
      categoryKey: category,
      fob: round(fob),
      freight: round(freight),
      insurance: round(insurance),
      cif: cif,
      duty: duty,
      totalLevies: levies,
      vat: vat,
      portHandling: 0,
      clearingAgent: clearing,
      totalUSD: total,
      totalLocal: round(total * fxRate),
      rate: fxRate,
      confidence: { status: "needs_review", label: "Planning estimate", needsReview: 1, estimates: 1, userInputs: 0 },
      whatThisMeans: {
        biggestCostDriver: "CIF value is the biggest visible cost driver in this estimate.",
        verify: ["HS classification", "customs value", "duty rate", "VAT treatment", "levies or surcharges", "customs FX rate", "port or terminal charges", "clearing-agent quote"],
        clearingAgentAdvice: "Final payable costs may differ from this planning estimate.",
      },
      disclaimer: "Import costs can change. AfroTools provides planning estimates only. Final customs duty, taxes, levies, port charges, exchange rates, and clearing costs are set by official authorities, service providers, or licensed professionals.",
    };
  }

  function round(value) {
    return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
  }

  function formatMoney(value, currency) {
    var amount = Number(value || 0);
    return (currency || "USD") + " " + amount.toLocaleString("en-US", { maximumFractionDigits: 2 });
  }

  function sentence(items, fallback) {
    var values = (items || []).map(text).filter(Boolean);
    return values.length ? values.join("; ") : fallback;
  }

  function buildAdvisorPlan(inputs, options) {
    var normalized = normalizeInputs(options && options.query || "", inputs || {});
    var estimate = estimateWithEngine(normalized) || estimateFallback(normalized);
    var missing = getMissingInputs(normalized);
    var hasEstimateInputs = hasValue(normalized.purchasePrice) || hasValue(normalized.shippingCost) || hasValue(normalized.fxRate);
    var totalLabel = estimate.totalUSD ? formatMoney(estimate.totalUSD, "USD") : "Add price and freight";
    var localLabel = estimate.totalLocal ? formatMoney(estimate.totalLocal, "NGN") : "Add FX rate";
    var vehicleTitle = sentence([normalized.year, normalized.make, normalized.model], "");
    var itemTitle = vehicleTitle || normalized.itemCategory || normalized.productCategoryLabel || "Import item";
    return {
      type: "import_advisor",
      mode: normalized.mode,
      inputs: normalized,
      missingInputs: missing,
      goalSummary: "Plan " + itemTitle + " into " + (normalized.destinationCountry || "your destination country") + ".",
      estimate: estimate,
      estimateStatus: hasEstimateInputs ? "Planning estimate" : "Needs price inputs",
      metrics: [
        { label: "CIF", value: estimate.cif ? formatMoney(estimate.cif, "USD") : "Add price/freight", tone: "primary" },
        { label: "Duty/tax estimate", value: estimate.duty || estimate.vat || estimate.totalLevies ? formatMoney((estimate.duty || 0) + (estimate.vat || 0) + (estimate.totalLevies || 0), "USD") : "Needs inputs", tone: "estimate" },
        { label: "Port/clearing estimate", value: estimate.portHandling || estimate.clearingAgent ? formatMoney((estimate.portHandling || 0) + (estimate.clearingAgent || 0), "USD") : "Quote needed", tone: "estimate" },
        { label: "Total landed cost", value: totalLabel + (estimate.totalLocal ? " / " + localLabel : ""), tone: "total" },
      ],
      assumptions: [
        "CIF is purchase price plus shipping/freight plus insurance.",
        normalized.fxRate ? "Uses your FX rate for local-currency planning." : "Uses stored planning FX only where the existing import-duty engine has one.",
        "Duty, VAT, levies, port, and clearing lines are planning estimates unless entered from a quote.",
        normalized.mode === "car" ? "Vehicle age, customs valuation, model trim, and engine size can materially change the final assessment." : "HS classification can materially change the final assessment.",
      ],
      sourceConfidence: [
        "Reviewed AfroTools import-duty planning assumptions.",
        "User-entered price, shipping, insurance, and FX are not independently verified.",
        "No final customs assessment is implied.",
      ],
      checklist: estimate.whatThisMeans && estimate.whatThisMeans.verify || ["HS classification", "customs value", "duty rate", "VAT treatment", "customs FX rate", "port or clearing quote"],
      warning: "Planning estimate only; final customs assessment may differ. Confirm with customs or a licensed clearing professional before payment.",
      importPrefillInputs: {
        mode: normalized.mode,
        destinationCountry: normalized.destinationCountry,
        productCategory: normalized.productCategory,
        itemCategory: normalized.itemCategory,
        purchasePrice: normalized.purchasePrice,
        itemValue: normalized.itemValue,
        currency: normalized.currency,
        shippingCost: normalized.shippingCost,
        insuranceCost: normalized.insuranceCost,
        originCountry: normalized.originCountry,
        port: normalized.port,
        fxRate: normalized.fxRate,
        year: normalized.year,
        make: normalized.make,
        model: normalized.model,
        vehicleType: normalized.vehicleType,
        engineCc: normalized.engineCc,
      },
      carWorkspaceUrl: normalized.destinationCountry === "Nigeria" ? "/tools/car-import-cost/nigeria/" : "/tools/car-import-cost/",
    };
  }

  function renderTool(tool) {
    return '<a class="ai-import-tool" href="' + escapeHtml(tool.route) + '">' +
      '<strong>' + escapeHtml(tool.title) + '</strong><span>' + escapeHtml(tool.reason) + '</span></a>';
  }

  function renderImportAdvisorPanel(plan) {
    if (!plan) return "";
    var metrics = plan.metrics.map(function (metric) {
      return '<div><strong>' + escapeHtml(metric.label) + '</strong><p>' + escapeHtml(metric.value) + '</p></div>';
    }).join("");
    var assumptions = plan.assumptions.map(function (item) {
      return "<li>" + escapeHtml(item) + "</li>";
    }).join("");
    var source = plan.sourceConfidence.map(function (item) {
      return "<li>" + escapeHtml(item) + "</li>";
    }).join("");
    var checklist = plan.checklist.map(function (item) {
      return "<li>" + escapeHtml(item) + "</li>";
    }).join("");
    var tools = [
      { title: "Import Duty Calculator", route: "/tools/import-duty/", reason: "Open the flagship landed-cost calculator with safe session prefill." },
      { title: "Car Import Cost Workspace", route: plan.carWorkspaceUrl, reason: "Use the deeper vehicle planning workspace for route and market scenarios." },
      { title: "Car Price Directory", route: "/cars/", reason: "Check car-market pages and source-market comparisons where available." },
      { title: "Currency Tools", route: "/tools/currency-converter/", reason: "Review FX impact before paying a supplier or clearing agent." },
    ].map(renderTool).join("");
    return '<section class="ai-import-plan" data-import-advisor>' +
      '<div class="ai-import-head"><div><h4>Import advisor estimate</h4><p>' + escapeHtml(plan.goalSummary) + '</p></div><span>' + escapeHtml(plan.estimateStatus) + '</span></div>' +
      '<div class="ai-import-grid">' + metrics + '</div>' +
      '<div class="ai-import-section"><strong>How this was calculated</strong><ul>' + assumptions + '</ul></div>' +
      '<div class="ai-import-section ai-import-warning"><strong>Source confidence</strong><ul>' + source + '</ul></div>' +
      '<div class="ai-import-section"><strong>Official verification checklist</strong><ol>' + checklist + '</ol></div>' +
      '<div class="ai-import-section"><strong>Matching AfroTools</strong><div class="ai-import-tools">' + tools + '</div></div>' +
      '<div class="ai-import-actions">' +
      '<a class="ai-small-button primary" href="/tools/import-duty/?source=ask&prefill=1" data-import-duty-link>Open Import Duty with prefill</a>' +
      '<a class="ai-small-button secondary" href="' + escapeHtml(plan.carWorkspaceUrl) + '" data-car-import-link>Open car workspace</a>' +
      '<button class="ai-small-button secondary" type="button" data-workflow-export="pdf" data-workflow-export-kind="import">PDF brief</button>' +
      '<button class="ai-small-button secondary" type="button" data-workflow-export="copy" data-workflow-export-kind="import">Copy checklist</button>' +
      '<a class="ai-small-button secondary" href="#" data-workflow-export="whatsapp" data-workflow-export-kind="import">WhatsApp summary</a>' +
      '<button class="ai-small-button secondary" type="button" data-workflow-export="json" data-workflow-export-kind="import">JSON</button>' +
      '<a class="ai-small-button secondary" href="#" data-workflow-export="email" data-workflow-export-kind="import">Email text</a>' +
      '<span class="ai-import-note">' + escapeHtml(plan.warning) + '</span>' +
      '<span class="ai-panel-status" data-workflow-export-status></span>' +
      '</div>' +
      '</section>';
  }

  return {
    normalizeInputs: normalizeInputs,
    getMissingInputs: getMissingInputs,
    buildAdvisorPlan: buildAdvisorPlan,
    renderImportAdvisorPanel: renderImportAdvisorPanel,
    formatMoney: formatMoney,
  };
});
