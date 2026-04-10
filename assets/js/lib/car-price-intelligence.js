(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("./car-import-cost-engine.js"));
  } else {
    root.AfroCarPriceIntelligence = factory(root.AfroCarImportCost);
  }
})(typeof self !== "undefined" ? self : this, function (ImportEngine) {
  "use strict";

  var SOURCE_MARKETS = ["japan", "uae", "uk", "south-africa", "local-dealer"];

  function num(value, fallback) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : (fallback || 0);
  }

  function round(value, places) {
    var factor = Math.pow(10, places == null ? 2 : places);
    return Math.round((num(value) + Number.EPSILON) * factor) / factor;
  }

  function slug(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/\/.*/, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function lc(value) {
    return String(value || "").trim().toLowerCase();
  }

  function sameModel(a, b) {
    var left = lc(a).split("/")[0].trim();
    var right = lc(b).split("/")[0].trim();
    return left === right || slug(left) === slug(right);
  }

  function range(min, median, max, meta) {
    meta = meta || {};
    return {
      min: round(Math.max(0, num(min))),
      median: round(Math.max(0, num(median))),
      max: round(Math.max(0, num(max))),
      currency: meta.currency || "USD",
      confidence: meta.confidence || "low",
      sourceType: meta.sourceType || "modelled-estimate",
      sampleSize: meta.sampleSize || 0,
      lastUpdated: meta.lastUpdated || meta.collectedAt || "",
      notes: meta.notes || ""
    };
  }

  function vehicleBaseRange(vehicle) {
    var p = vehicle && vehicle.price || [0, 0, 0];
    return range(p[0], p[1], p[2], {
      confidence: vehicle && vehicle.confidence || "low",
      sourceType: "seed-price-pack",
      lastUpdated: vehicle && vehicle.lastUpdated
    });
  }

  function getCountry(data, country) {
    var countries = data && data.countries || {};
    var key = String(country || "").toUpperCase();
    if (countries[key]) return countries[key];
    var bySlug = Object.keys(countries).map(function (code) { return countries[code]; }).find(function (item) {
      return item.slug === slug(country) || item.code === key;
    });
    return bySlug || countries.NG;
  }

  function countryCode(data, country) {
    var found = getCountry(data, country);
    return found && found.code || "NG";
  }

  function vehicles(data) {
    return (data && data.vehicles || []).slice();
  }

  function findVehicle(data, params) {
    params = params || {};
    var make = slug(params.make || params.makeSlug);
    var model = slug(params.model || params.modelSlug);
    var year = Math.trunc(num(params.year, 0));
    return vehicles(data).find(function (vehicle) {
      return vehicle.makeSlug === make && vehicle.modelSlug === model && (!year || num(vehicle.year) === year);
    }) || vehicles(data).find(function (vehicle) {
      return vehicle.makeSlug === make && (!model || vehicle.modelSlug === model);
    }) || null;
  }

  function vehiclesForCountry(data, country) {
    var code = countryCode(data, country);
    return vehicles(data).map(function (vehicle) {
      var ctx = buildVehicleContext(data, null, { countryCode: code, vehicle: vehicle, sourceMarket: defaultSourceMarket(vehicle, code) });
      return Object.assign({}, vehicle, { _context: ctx });
    });
  }

  function defaultSourceMarket(vehicle, code) {
    if (!vehicle) return "japan";
    if (code === "ZM" && vehicle.sources && vehicle.sources.indexOf("south-africa") !== -1) return "south-africa";
    if ((code === "NG" || code === "GH") && vehicle.sources && vehicle.sources.indexOf("uae") !== -1 && vehicle.tags && vehicle.tags.indexOf("premium") !== -1) return "uae";
    return vehicle.sources && vehicle.sources[0] || "japan";
  }

  function explicitSourcePrice(data, vehicle, sourceMarket) {
    return (data.sourceMarketPrices || []).find(function (item) {
      return item.source_market === sourceMarket
        && slug(item.make) === vehicle.makeSlug
        && sameModel(item.model, vehicle.model)
        && num(item.year) === num(vehicle.year);
    }) || null;
  }

  function getSourcePrice(data, vehicle, sourceMarket) {
    sourceMarket = sourceMarket || defaultSourceMarket(vehicle);
    if (sourceMarket === "local-dealer") return getLocalPrice(data, vehicle, null);
    var explicit = explicitSourcePrice(data, vehicle, sourceMarket);
    if (explicit) {
      return range(explicit.min_price, explicit.median_price, explicit.max_price, {
        currency: explicit.currency,
        confidence: explicit.confidence,
        sourceType: explicit.source_type,
        lastUpdated: explicit.collected_at,
        notes: "Explicit source-market seed price pack."
      });
    }
    var market = data.sourceMarkets && data.sourceMarkets[sourceMarket] || {};
    var base = vehicleBaseRange(vehicle);
    var multiplier = num(market.priceMultiplier, 1);
    return range(base.min * multiplier, base.median * multiplier, base.max * multiplier, {
      confidence: market.confidence || base.confidence,
      sourceType: "market-multiplier-estimate",
      lastUpdated: vehicle.lastUpdated,
      notes: market.notes || "Estimated from the vehicle seed range and source-market multiplier."
    });
  }

  function explicitLocalPrice(data, vehicle, code) {
    return (data.localMarketPrices || []).find(function (item) {
      return (!code || item.country_code === code)
        && slug(item.make) === vehicle.makeSlug
        && sameModel(item.model, vehicle.model)
        && num(item.year) === num(vehicle.year);
    }) || null;
  }

  function getLocalPrice(data, vehicle, country) {
    var code = country ? countryCode(data, country) : "NG";
    var explicit = explicitLocalPrice(data, vehicle, code);
    if (explicit) {
      return range(explicit.min_ask, explicit.median_ask, explicit.max_ask, {
        currency: explicit.currency,
        confidence: explicit.confidence,
        sourceType: explicit.source_type,
        sampleSize: explicit.sample_size,
        lastUpdated: explicit.collected_at,
        notes: "Explicit local-market asking-price seed pack."
      });
    }
    var profile = data.countryMarketProfiles && data.countryMarketProfiles[code] || {};
    var base = vehicleBaseRange(vehicle);
    var multiplier = num(profile.localMultiplier, 1.85);
    var spread = num(profile.localSpread, 0.22);
    var median = base.median * multiplier;
    return range(median * (1 - spread), median, median * (1 + spread), {
      confidence: profile.confidence || "low",
      sourceType: profile.sourceType || "modelled-market-sample",
      sampleSize: profile.sampleSize || 0,
      lastUpdated: vehicle.lastUpdated,
      notes: "Modelled from the vehicle seed range because a precise local sample is not loaded."
    });
  }

  function isStale(dateString, generatedAt, thresholdDays) {
    if (!dateString) return true;
    var latest = new Date(generatedAt || Date.now());
    var date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return true;
    return (latest - date) / 86400000 > num(thresholdDays, 120);
  }

  function freshnessLabel(dateString, data) {
    if (!dateString) return "No update date";
    var latest = new Date(data.generatedAt || Date.now());
    var date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "No update date";
    var days = Math.max(0, Math.round((latest - date) / 86400000));
    return days === 0 ? "Updated today" : "Updated " + days + " days ago";
  }

  function importInput(data, vehicle, country, sourceMarket, sourcePrice, localPrice, overrides) {
    var c = getCountry(data, country);
    overrides = overrides || {};
    return Object.assign({
      countryCode: c.code,
      sourceMarket: sourceMarket || defaultSourceMarket(vehicle, c.code),
      inputMode: "purchase",
      outputMode: "practical",
      make: vehicle.make,
      model: vehicle.model.split("/")[0].trim(),
      trim: vehicle.trim || "",
      year: vehicle.year,
      firstRegistrationMonth: vehicle.firstRegistrationMonth || 12,
      fuelType: vehicle.fuel && vehicle.fuel[0] || "petrol",
      engineCc: Math.round((num(vehicle.cc && vehicle.cc[0], 0) + num(vehicle.cc && vehicle.cc[1], 0)) / 2),
      transmission: vehicle.transmissions && vehicle.transmissions[0] || "automatic",
      bodyType: vehicle.body,
      vehicleClass: vehicle.body,
      driveSide: c.requiredDriveSide === "right" ? "right" : "left",
      condition: "used",
      mileage: 85000,
      purchasePriceUsd: sourcePrice.median,
      localDealerPriceUsd: localPrice.median,
      destinationCity: c.defaultCity,
      delayDays: 7,
      storageDays: 3,
      clearingMode: "agent"
    }, overrides);
  }

  function calculateImport(importData, input, fallback) {
    if (ImportEngine && importData && typeof ImportEngine.calculate === "function") {
      return ImportEngine.calculate(input, importData, { skipCompare: true });
    }
    var base = num(input.purchasePriceUsd);
    var freight = num(input.freightUsd, 1200);
    var customs = (base + freight) * 0.72;
    var extras = 1400;
    var total = base + freight + customs + extras;
    return {
      input: input,
      warnings: fallback && fallback.warnings || [],
      totals: {
        vehicleBaseUsd: base,
        freightUsd: freight,
        marineInsuranceUsd: (base + freight) * 0.012,
        cifUsd: base + freight,
        officialTaxesUsd: customs,
        officialFeesUsd: 0,
        practicalCostsUsd: extras * 0.5,
        inlandDeliveryUsd: extras * 0.2,
        registrationUsd: extras * 0.3,
        totalLandedUsd: total - extras * 0.3,
        onRoadUsd: total
      },
      rulePack: { confidence: "fallback-estimate" },
      country: { code: input.countryCode }
    };
  }

  function estimateLandedRange(data, importData, vehicle, country, sourceMarket, options) {
    var code = countryCode(data, country);
    var local = getLocalPrice(data, vehicle, code);
    var source = getSourcePrice(data, vehicle, sourceMarket);
    var best = calculateImport(importData, importInput(data, vehicle, code, sourceMarket, source, local, {
      purchasePriceUsd: source.min,
      delayDays: 0,
      storageDays: 0
    }));
    var normal = calculateImport(importData, importInput(data, vehicle, code, sourceMarket, source, local, options));
    var painful = calculateImport(importData, importInput(data, vehicle, code, sourceMarket, source, local, {
      purchasePriceUsd: source.max,
      delayDays: 21,
      storageDays: 10
    }));
    return {
      sourcePrice: source,
      localPrice: local,
      best: round(best.totals.onRoadUsd),
      normal: round(normal.totals.onRoadUsd),
      painful: round(painful.totals.onRoadUsd),
      normalResult: normal,
      warnings: normal.warnings || [],
      sourceMarket: sourceMarket,
      confidence: lowestConfidence([source.confidence, local.confidence, normal.rulePack && normal.rulePack.confidence]),
      stale: isStale(source.lastUpdated, data.generatedAt, data.staleAfterDays) || isStale(local.lastUpdated, data.generatedAt, data.staleAfterDays)
    };
  }

  function confidenceScore(label) {
    if (label === "high") return 3;
    if (label === "medium") return 2;
    if (label === "low") return 1;
    return 1;
  }

  function lowestConfidence(values) {
    var labels = (values || []).filter(Boolean);
    if (!labels.length) return "low";
    return labels.sort(function (a, b) { return confidenceScore(a) - confidenceScore(b); })[0];
  }

  function eligibilityFromWarnings(warnings) {
    warnings = warnings || [];
    if (warnings.some(function (warning) { return /ineligible|prohibit/i.test(warning.code || warning.message || ""); })) return "ineligible";
    if (warnings.length) return "risky";
    return "eligible";
  }

  function recommend(context) {
    var landed = context.landed;
    var local = context.localPrice;
    var eligibility = context.eligibilityStatus;
    if (eligibility === "ineligible") {
      return {
        status: "too-risky",
        label: "Too risky to recommend",
        explanation: "This vehicle triggers an eligibility warning in the active country rule pack. Do not commit funds until the importer verifies the rule with an official source or licensed local agent."
      };
    }
    var ratio = local.median ? landed.normal / local.median : 1;
    var stale = landed.stale || context.rulePackStale || context.pricePackStale;
    var status = "borderline";
    if (ratio < 0.86 && !stale && eligibility === "eligible") status = "import-likely-cheaper";
    else if (ratio < 0.98) status = "import-better-spec";
    else if (ratio > 1.1) status = "buy-local";
    var labels = {
      "import-likely-cheaper": "Import likely cheaper",
      "import-better-spec": "Import only makes sense for better spec",
      "borderline": "Borderline",
      "buy-local": "Buying local likely better",
      "too-risky": "Too risky to recommend"
    };
    var explanation = "The normal landed estimate is " + Math.round(ratio * 100) + "% of the local median asking estimate. ";
    if (status === "import-likely-cheaper") explanation += "Import looks cheaper, but the buffer should still cover FX, storage, and valuation movement.";
    else if (status === "import-better-spec") explanation += "Import may make sense for a cleaner grade, better trim, or lower mileage rather than pure price savings.";
    else if (status === "buy-local") explanation += "Local asking prices appear competitive against the landed estimate, especially after delays and registration.";
    else explanation += "The price gap is not large enough to call confidently, so compare exact specs and recent quotes.";
    if (eligibility === "risky") explanation += " Compliance warnings make the decision more sensitive.";
    if (stale) explanation += " One or more datasets may be stale.";
    return { status: status, label: labels[status], explanation: explanation };
  }

  function buildSourceComparison(data, importData, vehicle, country) {
    var code = countryCode(data, country);
    return SOURCE_MARKETS.filter(function (market) {
      return market === "local-dealer" || (vehicle.sources || []).indexOf(market) !== -1;
    }).map(function (market) {
      if (market === "local-dealer") {
        var local = getLocalPrice(data, vehicle, code);
        return {
          sourceMarket: market,
          label: "Local dealer",
          price: local,
          transitDays: 0,
          landed: { best: local.min, normal: local.median, painful: local.max },
          confidence: local.confidence,
          warnings: []
        };
      }
      var landed = estimateLandedRange(data, importData, vehicle, code, market);
      var sm = data.sourceMarkets[market] || {};
      return {
        sourceMarket: market,
        label: sm.label || market,
        price: landed.sourcePrice,
        transitDays: sm.transitDays || 0,
        landed: { best: landed.best, normal: landed.normal, painful: landed.painful },
        confidence: landed.confidence,
        warnings: landed.warnings
      };
    }).sort(function (a, b) { return a.landed.normal - b.landed.normal; });
  }

  function buildVehicleContext(data, importData, params) {
    params = params || {};
    var vehicle = params.vehicle || findVehicle(data, params);
    if (!vehicle) return null;
    var code = countryCode(data, params.countryCode || params.country || "NG");
    var sourceMarket = params.sourceMarket || defaultSourceMarket(vehicle, code);
    var landed = estimateLandedRange(data, importData, vehicle, code, sourceMarket, params.overrides);
    var eligibilityStatus = eligibilityFromWarnings(landed.warnings);
    var context = {
      vehicle: vehicle,
      country: getCountry(data, code),
      sourceMarket: sourceMarket,
      sourcePrice: landed.sourcePrice,
      localPrice: landed.localPrice,
      landed: landed,
      eligibilityStatus: eligibilityStatus,
      sourceComparison: buildSourceComparison(data, importData, vehicle, code),
      freshness: {
        source: freshnessLabel(landed.sourcePrice.lastUpdated, data),
        local: freshnessLabel(landed.localPrice.lastUpdated, data),
        pricePackStale: landed.stale
      },
      sourceMetadata: data.sourceMetadata || [],
      faqs: data.faqs || [],
      relatedTools: data.relatedTools || [],
      countryContent: data.countryContent && data.countryContent[code] || {}
    };
    context.recommendation = recommend(context);
    context.calculatorUrl = buildCalculatorUrl(context);
    context.aiContext = buildAiContext(context);
    return context;
  }

  function buildCalculatorUrl(context) {
    var params = new URLSearchParams();
    params.set("country", context.country.code);
    params.set("source", context.sourceMarket);
    params.set("make", context.vehicle.make);
    params.set("model", context.vehicle.model.split("/")[0].trim());
    params.set("year", context.vehicle.year);
    params.set("price", Math.round(context.sourcePrice.median));
    return "/tools/car-import-cost/" + context.country.slug + "/?" + params.toString();
  }

  function buildAiContext(context) {
    return {
      tool: "car-price-intelligence",
      vehicle: {
        make: context.vehicle.make,
        model: context.vehicle.model,
        year: context.vehicle.year,
        trim: context.vehicle.trim,
        engineCcRange: context.vehicle.cc,
        bodyType: context.vehicle.body,
        fuelTypes: context.vehicle.fuel
      },
      country: context.country,
      sourceMarket: context.sourceMarket,
      sourcePrice: context.sourcePrice,
      landedCost: {
        best: context.landed.best,
        normal: context.landed.normal,
        painful: context.landed.painful,
        officialTaxesUsd: context.landed.normalResult.totals.officialTaxesUsd,
        practicalCostsUsd: context.landed.normalResult.totals.practicalCostsUsd,
        registrationUsd: context.landed.normalResult.totals.registrationUsd
      },
      localPrice: context.localPrice,
      recommendation: context.recommendation,
      eligibilityStatus: context.eligibilityStatus,
      warnings: context.landed.warnings,
      freshness: context.freshness,
      sources: context.sourceMetadata
    };
  }

  function filterVehicles(data, filters) {
    filters = filters || {};
    var code = countryCode(data, filters.countryCode || filters.country);
    var q = lc(filters.q || filters.search);
    return vehiclesForCountry(data, code).filter(function (vehicle) {
      var ctx = vehicle._context;
      if (q && lc(vehicle.make + " " + vehicle.model + " " + vehicle.year).indexOf(q) === -1) return false;
      if (filters.make && vehicle.makeSlug !== slug(filters.make)) return false;
      if (filters.model && vehicle.modelSlug !== slug(filters.model)) return false;
      if (filters.year && num(vehicle.year) !== num(filters.year)) return false;
      if (filters.body && vehicle.body !== filters.body) return false;
      if (filters.fuel && (vehicle.fuel || []).indexOf(filters.fuel) === -1) return false;
      if (filters.transmission && (vehicle.transmissions || []).indexOf(filters.transmission) === -1) return false;
      if (filters.sourceMarket && (vehicle.sources || []).indexOf(filters.sourceMarket) === -1) return false;
      if (filters.recommendation && ctx && ctx.recommendation.status !== filters.recommendation) return false;
      if (filters.eligibility && ctx && ctx.eligibilityStatus !== filters.eligibility) return false;
      if (filters.confidence && ctx && ctx.landed.confidence !== filters.confidence) return false;
      if (filters.maxLanded && ctx && ctx.landed.normal > num(filters.maxLanded)) return false;
      if (filters.maxLocal && ctx && ctx.localPrice.median > num(filters.maxLocal)) return false;
      return true;
    });
  }

  function parseCarsPath(pathname) {
    var parts = String(pathname || "").split("/").filter(Boolean);
    if (parts[0] !== "cars") return { type: "directory" };
    if (parts[1] === "compare") return { type: "compare" };
    if (parts[1] === "import-vs-local") {
      return { type: "import-vs-local", country: parts[2], make: parts[3], model: parts[4], year: parts[5] };
    }
    if (!parts[1]) return { type: "directory" };
    if (!parts[2]) return { type: "country", country: parts[1] };
    if (!parts[3]) return { type: "make", country: parts[1], make: parts[2] };
    if (!parts[4]) return { type: "model", country: parts[1], make: parts[2], model: parts[3] };
    return { type: "detail", country: parts[1], make: parts[2], model: parts[3], year: parts[4] };
  }

  function modelGroups(data, filters) {
    var list = filterVehicles(data, filters);
    var groups = {};
    list.forEach(function (vehicle) {
      var key = vehicle.makeSlug + "/" + vehicle.modelSlug;
      if (!groups[key]) groups[key] = { make: vehicle.make, makeSlug: vehicle.makeSlug, model: vehicle.model, modelSlug: vehicle.modelSlug, years: [], vehicles: [] };
      groups[key].years.push(vehicle.year);
      groups[key].vehicles.push(vehicle);
    });
    return Object.keys(groups).map(function (key) {
      var group = groups[key];
      group.years = group.years.sort(function (a, b) { return b - a; });
      return group;
    });
  }

  function formatMoney(amount, currency) {
    if (ImportEngine && ImportEngine.formatMoney) return ImportEngine.formatMoney(amount, currency || "USD");
    try {
      return new Intl.NumberFormat("en", { style: "currency", currency: currency || "USD", maximumFractionDigits: 0 }).format(num(amount));
    } catch (error) {
      return (currency || "USD") + " " + Math.round(num(amount)).toLocaleString();
    }
  }

  return {
    slug: slug,
    getCountry: getCountry,
    findVehicle: findVehicle,
    filterVehicles: filterVehicles,
    modelGroups: modelGroups,
    getSourcePrice: getSourcePrice,
    getLocalPrice: getLocalPrice,
    estimateLandedRange: estimateLandedRange,
    buildSourceComparison: buildSourceComparison,
    buildVehicleContext: buildVehicleContext,
    buildCalculatorUrl: buildCalculatorUrl,
    buildAiContext: buildAiContext,
    parseCarsPath: parseCarsPath,
    freshnessLabel: freshnessLabel,
    isStale: isStale,
    formatMoney: formatMoney,
    _private: { recommend: recommend, eligibilityFromWarnings: eligibilityFromWarnings, importInput: importInput }
  };
});
