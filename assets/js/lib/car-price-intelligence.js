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

  function clamp(value, min, max) {
    return Math.max(min == null ? 0 : min, Math.min(max == null ? Number.MAX_SAFE_INTEGER : max, num(value)));
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

  function upper(value, fallback) {
    return String(value || fallback || "").trim().toUpperCase();
  }

  function sameModel(a, b) {
    var left = lc(a).split("/")[0].trim();
    var right = lc(b).split("/")[0].trim();
    return left === right || slug(left) === slug(right);
  }

  function array(value) {
    return Array.isArray(value) ? value : [];
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
    var key = upper(country, "NG");
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

  function vehicleAgeYears(vehicle, data) {
    var generated = new Date(data && data.generatedAt || Date.now());
    var year = num(vehicle && vehicle.year, generated.getUTCFullYear());
    return Math.max(0, generated.getUTCFullYear() - year);
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
    var latest = new Date(data && data.generatedAt || Date.now());
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
      country: { code: input.countryCode },
      fx: { baseCurrency: "USD", localCurrency: "USD", usdToLocal: 1 }
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

  function scoreBucket(score, thresholds, labels, fallback) {
    thresholds = thresholds || [30, 55, 75];
    labels = labels || ["low", "moderate", "elevated", "high"];
    if (score < thresholds[0]) return labels[0];
    if (score < thresholds[1]) return labels[1];
    if (score < thresholds[2]) return labels[2];
    return labels[3] || fallback || labels[labels.length - 1];
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
        warnings: landed.warnings,
        notes: sm.notes || ""
      };
    }).sort(function (a, b) { return a.landed.normal - b.landed.normal; });
  }

  function assetMap(data) {
    var map = {};
    array(data && data.mediaLibrary && data.mediaLibrary.assets).forEach(function (asset) {
      map[asset.id] = asset;
    });
    return map;
  }

  function normalizeMediaAsset(asset, binding, data) {
    if (!asset) return null;
    return {
      id: asset.id,
      imageUrl: asset.imageUrl,
      thumbUrl: asset.thumbUrl || asset.imageUrl,
      alt: asset.alt || "Car media asset",
      caption: binding && binding.caption || asset.caption || "",
      mediaType: binding && binding.mediaType || asset.mediaType || "hero",
      sourceType: asset.sourceType || "seed-placeholder",
      confidence: asset.confidence || "low",
      lastUpdated: asset.collectedAt || asset.lastUpdated || "",
      freshness: freshnessLabel(asset.collectedAt || asset.lastUpdated, data)
    };
  }

  function resolveMedia(data, vehicle, country, sourceMarket) {
    var library = data && data.mediaLibrary || {};
    var bindings = array(library.bindings);
    var assets = assetMap(data);
    var code = upper(countryCode(data, country), "NG");
    var matches = bindings.map(function (binding) {
      var score = 0;
      if (binding.status && binding.status !== "approved") return null;
      if (binding.vehicleId) {
        if (binding.vehicleId !== vehicle.id) return null;
        score += 50;
      }
      if (binding.countryCode) {
        if (upper(binding.countryCode) !== code) return null;
        score += 16;
      }
      if (binding.sourceMarket) {
        if (binding.sourceMarket !== sourceMarket) return null;
        score += 12;
      }
      if (binding.makeSlug) {
        if (binding.makeSlug !== vehicle.makeSlug) return null;
        score += 10;
      }
      if (binding.modelSlug) {
        if (binding.modelSlug !== vehicle.modelSlug) return null;
        score += 10;
      }
      if (binding.year != null) {
        if (num(binding.year) !== num(vehicle.year)) return null;
        score += 8;
      }
      if (binding.bodyType) {
        if (binding.bodyType !== vehicle.body) return null;
        score += 4;
      }
      score += binding.isPrimary ? 3 : 0;
      return {
        binding: binding,
        asset: assets[binding.assetId],
        score: score
      };
    }).filter(function (item) { return item && item.asset && item.asset.imageUrl; }).sort(function (a, b) {
      return b.score - a.score || (b.binding.isPrimary ? 1 : 0) - (a.binding.isPrimary ? 1 : 0) || num(a.binding.displayOrder, 999) - num(b.binding.displayOrder, 999);
    });

    var gallery = [];
    matches.forEach(function (item) {
      if (!gallery.some(function (existing) { return existing.id === item.asset.id; })) {
        gallery.push(normalizeMediaAsset(item.asset, item.binding, data));
      }
    });

    if (!gallery.length) {
      var fallback = assets["seed-generic-car-hero"] || array(library.assets)[0] || null;
      if (fallback) gallery.push(normalizeMediaAsset(fallback, { mediaType: "hero", isPrimary: true }, data));
    }

    var hero = gallery[0] || {
      id: "seed-fallback",
      imageUrl: "/assets/img/tools/car-loan.webp",
      thumbUrl: "/assets/img/tools/car-loan.webp",
      alt: "Generic car placeholder",
      caption: "Add a licensed vehicle image in Mission Control to replace this placeholder.",
      mediaType: "hero",
      sourceType: "seed-placeholder",
      confidence: "low",
      lastUpdated: "",
      freshness: "No update date"
    };

    return {
      hero: hero,
      gallery: gallery.slice(0, 4),
      confidence: lowestConfidence(gallery.map(function (item) { return item.confidence; })),
      freshness: hero.freshness,
      sourceType: hero.sourceType
    };
  }

  function computeMonthlyPayment(principalUsd, aprPct, months) {
    var monthlyRate = num(aprPct, 0) / 12;
    if (!principalUsd || !months) return 0;
    if (!monthlyRate) return round(principalUsd / months);
    return round(principalUsd * monthlyRate / (1 - Math.pow(1 + monthlyRate, -months)));
  }

  function buildFinancingOffers(data, context) {
    var offers = array(data && data.countryFinancingOffers && data.countryFinancingOffers[context.country.code]);
    var fx = context.landed && context.landed.normalResult && context.landed.normalResult.fx || {
      localCurrency: context.country.currency_code || "USD",
      usdToLocal: 1
    };
    var age = vehicleAgeYears(context.vehicle, data);
    var onRoadUsd = num(context.landed && context.landed.normal, 0);
    var mapped = offers.map(function (offer) {
      var months = num(offer.defaultTenureMonths || array(offer.tenuresMonths)[0], 24);
      var aprPct = num(offer.defaultAprPct, num(offer.aprPct, 0.24));
      var downPct = num(offer.defaultDownPaymentPct, num(offer.minDownPaymentPct, 0.25));
      var reasons = [];
      if (context.eligibilityStatus === "ineligible") reasons.push("Vehicle is not currently eligible under the import rules.");
      if (offer.maxVehicleAgeYears != null && age > num(offer.maxVehicleAgeYears)) reasons.push("Vehicle age is above this offer's typical financing band.");
      if (array(offer.vehicleClasses).length && array(offer.vehicleClasses).indexOf(context.vehicle.body) === -1) reasons.push("Vehicle body type falls outside the offer focus.");
      if (offer.minAmountUsd != null && onRoadUsd < num(offer.minAmountUsd)) reasons.push("Estimated on-road value is below the offer minimum.");
      if (offer.maxAmountUsd != null && onRoadUsd > num(offer.maxAmountUsd)) reasons.push("Estimated on-road value is above the offer ceiling.");
      var eligible = reasons.length === 0;
      var processingFeeUsd = round(onRoadUsd * num(offer.processingFeePct, 0));
      var financedAmountUsd = round(onRoadUsd * (1 - downPct));
      var monthlyUsd = computeMonthlyPayment(financedAmountUsd, aprPct, months);
      return {
        id: offer.id,
        provider: offer.provider,
        label: offer.label,
        countryCode: context.country.code,
        offerType: offer.offerType || "partner-estimate",
        aprPct: round(aprPct * 100, 2),
        aprRangePct: [round(num(offer.aprPct, aprPct) * 100, 2), round(num(offer.aprMaxPct, aprPct) * 100, 2)],
        downPaymentPct: round(downPct * 100, 2),
        processingFeePct: round(num(offer.processingFeePct, 0) * 100, 2),
        tenureMonths: months,
        availableTenures: array(offer.tenuresMonths),
        maxVehicleAgeYears: offer.maxVehicleAgeYears,
        maxAmountUsd: offer.maxAmountUsd,
        confidence: offer.confidence || "low",
        sourceType: offer.sourceType || "partner-estimate",
        note: offer.notes || "",
        ctaLabel: offer.ctaLabel || "Check finance fit",
        ctaUrl: offer.ctaUrl || ("/tools/car-loan/?country=" + context.country.slug + "&amount=" + Math.round(onRoadUsd) + "&months=" + months),
        eligible: eligible,
        reasons: reasons,
        downPaymentUsd: round(onRoadUsd * downPct),
        downPaymentLocal: round(onRoadUsd * downPct * num(fx.usdToLocal, 1), 0),
        financedAmountUsd: financedAmountUsd,
        financedAmountLocal: round(financedAmountUsd * num(fx.usdToLocal, 1), 0),
        monthlyPaymentUsd: monthlyUsd,
        monthlyPaymentLocal: round(monthlyUsd * num(fx.usdToLocal, 1), 0),
        processingFeeUsd: processingFeeUsd,
        processingFeeLocal: round(processingFeeUsd * num(fx.usdToLocal, 1), 0),
        localCurrency: fx.localCurrency || context.country.currency_code || "USD",
        freshness: freshnessLabel(offer.effectiveFrom || offer.lastUpdated || data.generatedAt, data)
      };
    });
    var eligibleOffers = mapped.filter(function (item) { return item.eligible; }).sort(function (a, b) {
      return a.monthlyPaymentUsd - b.monthlyPaymentUsd || a.downPaymentUsd - b.downPaymentUsd;
    });
    return {
      offers: mapped,
      bestOffer: eligibleOffers[0] || mapped[0] || null,
      localCurrency: fx.localCurrency || context.country.currency_code || "USD",
      usdToLocal: num(fx.usdToLocal, 1)
    };
  }

  function riskConfig(data) {
    var config = data && data.scoringModels && data.scoringModels.importRisk || {};
    return {
      baseScore: num(config.baseScore, 16),
      stalePenalty: num(config.stalePenalty, 10),
      riskyEligibilityPenalty: num(config.riskyEligibilityPenalty, 18),
      ineligiblePenalty: num(config.ineligiblePenalty, 46),
      lowConfidencePenalty: num(config.lowConfidencePenalty, 10),
      mediumConfidencePenalty: num(config.mediumConfidencePenalty, 4),
      wideGapPenalty: num(config.wideGapPenalty, 12),
      hugeGapPenalty: num(config.hugeGapPenalty, 18),
      delayPenalty: num(config.delayPenalty, 8),
      countryAdjustments: config.countryAdjustments || {},
      tagPenalties: config.tagPenalties || {}
    };
  }

  function buildImportRisk(data, context) {
    var config = riskConfig(data);
    var score = config.baseScore;
    var reasons = [];
    var age = vehicleAgeYears(context.vehicle, data);
    var stressfulGap = context.landed.normal ? (context.landed.painful - context.landed.normal) / context.landed.normal : 0;
    var delaySeries = context.landed.normalResult && context.landed.normalResult.sensitivity && context.landed.normalResult.sensitivity.delayDays || [];
    var longDelay = delaySeries.find(function (item) { return num(item.days) === 30; }) || delaySeries[delaySeries.length - 1] || null;
    var delayRatio = longDelay && context.landed.normal ? num(longDelay.extraUsd) / context.landed.normal : 0;
    var sourceConfidence = context.sourcePrice.confidence || "low";
    var localConfidence = context.localPrice.confidence || "low";
    var tagPenalties = config.tagPenalties;

    if (context.eligibilityStatus === "ineligible") {
      score += config.ineligiblePenalty;
      reasons.push({ label: "Eligibility block", weight: config.ineligiblePenalty, detail: "The active rule pack flags this vehicle as ineligible." });
    } else if (context.eligibilityStatus === "risky") {
      score += config.riskyEligibilityPenalty;
      reasons.push({ label: "Compliance warning", weight: config.riskyEligibilityPenalty, detail: "The active rule pack returned compliance warnings for this vehicle." });
    }

    array(context.vehicle.tags).forEach(function (tag) {
      if (tagPenalties[tag]) {
        score += num(tagPenalties[tag]);
        reasons.push({ label: "Vehicle profile", weight: num(tagPenalties[tag]), detail: "The seed pack tags this vehicle as " + tag.replace(/-/g, " ") + "." });
      }
    });

    if (age >= 10) {
      score += 6;
      reasons.push({ label: "Older vehicle", weight: 6, detail: "Older imports usually carry more compliance, condition, and resale uncertainty." });
    }

    if (sourceConfidence === "low" || localConfidence === "low" || context.landed.confidence === "low") {
      score += config.lowConfidencePenalty;
      reasons.push({ label: "Low-confidence data", weight: config.lowConfidencePenalty, detail: "One or more inputs still rely on thin or modelled datasets." });
    } else if (sourceConfidence === "medium" || localConfidence === "medium" || context.landed.confidence === "medium") {
      score += config.mediumConfidencePenalty;
      reasons.push({ label: "Estimated inputs", weight: config.mediumConfidencePenalty, detail: "This estimate mixes explicit data with modelled assumptions." });
    }

    if (context.freshness.pricePackStale) {
      score += config.stalePenalty;
      reasons.push({ label: "Stale dataset", weight: config.stalePenalty, detail: "At least one price dataset is past the preferred freshness threshold." });
    }

    if (stressfulGap >= 0.3) {
      score += config.hugeGapPenalty;
      reasons.push({ label: "Wide painful-case gap", weight: config.hugeGapPenalty, detail: "The painful-case scenario is materially above the normal landed estimate." });
    } else if (stressfulGap >= 0.15) {
      score += config.wideGapPenalty;
      reasons.push({ label: "Scenario sensitivity", weight: config.wideGapPenalty, detail: "Port delays, storage, and pricing shifts widen the landed range." });
    }

    if (delayRatio >= 0.08) {
      score += config.delayPenalty;
      reasons.push({ label: "Delay exposure", weight: config.delayPenalty, detail: "A month of additional delay materially changes the on-road outcome." });
    }

    score += num(config.countryAdjustments[context.country.code], 0);
    if (num(config.countryAdjustments[context.country.code], 0)) {
      reasons.push({ label: "Country operating friction", weight: num(config.countryAdjustments[context.country.code], 0), detail: "This country profile has extra operational variability baked into the risk score." });
    }

    score = clamp(score, 4, 96);
    reasons.sort(function (a, b) { return b.weight - a.weight; });
    var label = scoreBucket(score, [30, 55, 75], ["Low", "Moderate", "Elevated", "High"]);
    var summary = label + " import risk. " + (reasons[0] ? reasons[0].detail : "The current estimate does not show strong import-risk flags.");
    return {
      score: Math.round(score),
      label: label,
      summary: summary,
      reasons: reasons.slice(0, 4),
      confidence: lowestConfidence([context.landed.confidence, context.sourcePrice.confidence, context.localPrice.confidence])
    };
  }

  function liquidityConfig(data) {
    var config = data && data.scoringModels && data.scoringModels.liquidity || {};
    return {
      baseScore: num(config.baseScore, 34),
      bodyWeights: config.bodyWeights || {},
      tagWeights: config.tagWeights || {},
      lowConfidencePenalty: num(config.lowConfidencePenalty, 8),
      mediumConfidencePenalty: num(config.mediumConfidencePenalty, 3),
      sampleMultiplier: num(config.sampleMultiplier, 1.3),
      maxSampleBonus: num(config.maxSampleBonus, 24),
      narrowSpreadBonus: num(config.narrowSpreadBonus, 8),
      wideSpreadPenalty: num(config.wideSpreadPenalty, 10),
      countryAdjustments: config.countryAdjustments || {}
    };
  }

  function buildLiquidityScore(data, context) {
    var config = liquidityConfig(data);
    var score = config.baseScore;
    var reasons = [];
    var sampleSize = num(context.localPrice.sampleSize, num(data.countryMarketProfiles && data.countryMarketProfiles[context.country.code] && data.countryMarketProfiles[context.country.code].sampleSize, 0));
    var spread = context.localPrice.median ? (context.localPrice.max - context.localPrice.min) / context.localPrice.median : 0;
    var tagWeights = config.tagWeights;
    var bodyWeights = config.bodyWeights;
    var tagBonus = 0;

    if (sampleSize > 0) {
      var sampleBonus = Math.min(config.maxSampleBonus, round(sampleSize * config.sampleMultiplier));
      score += sampleBonus;
      reasons.push({ label: "Market sample depth", weight: sampleBonus, detail: "The local asking-price layer has enough samples to suggest active demand." });
    } else {
      reasons.push({ label: "Thin local sample", weight: 0, detail: "Liquidity is estimated from country-level market profiles rather than a strong local sample." });
    }

    if (bodyWeights[context.vehicle.body]) {
      score += num(bodyWeights[context.vehicle.body]);
      reasons.push({ label: "Body-type demand", weight: num(bodyWeights[context.vehicle.body]), detail: "This body type tends to turn over at a healthier pace in the target market." });
    }

    array(context.vehicle.tags).forEach(function (tag) {
      tagBonus += num(tagWeights[tag], 0);
    });
    if (tagBonus) {
      score += tagBonus;
      reasons.push({ label: "Vehicle demand profile", weight: tagBonus, detail: "The tag mix points to stronger local demand and easier resale." });
    }

    if (spread <= 0.35) {
      score += config.narrowSpreadBonus;
      reasons.push({ label: "Tight asking spread", weight: config.narrowSpreadBonus, detail: "Local asking prices cluster closely, which usually signals better liquidity." });
    } else if (spread >= 0.75) {
      score -= config.wideSpreadPenalty;
      reasons.push({ label: "Wide asking spread", weight: -config.wideSpreadPenalty, detail: "A wide local asking range suggests weaker price discovery and slower turnover." });
    }

    if (context.localPrice.confidence === "low" || context.landed.confidence === "low") {
      score -= config.lowConfidencePenalty;
      reasons.push({ label: "Low-confidence data", weight: -config.lowConfidencePenalty, detail: "Thin data makes the local exit picture less certain." });
    } else if (context.localPrice.confidence === "medium" || context.landed.confidence === "medium") {
      score -= config.mediumConfidencePenalty;
      reasons.push({ label: "Estimated local sample", weight: -config.mediumConfidencePenalty, detail: "Some of the local-market layer is modelled rather than directly sampled." });
    }

    if (context.importRisk.score >= 75) {
      score -= 12;
      reasons.push({ label: "High import risk drag", weight: -12, detail: "High import-risk friction tends to hurt the exit path and buyer confidence." });
    } else if (context.importRisk.score >= 55) {
      score -= 6;
      reasons.push({ label: "Elevated import risk drag", weight: -6, detail: "Operational friction can reduce buyer appetite on resale." });
    }

    score += num(config.countryAdjustments[context.country.code], 0);
    score = clamp(score, 8, 95);
    reasons.sort(function (a, b) { return Math.abs(b.weight) - Math.abs(a.weight); });
    var label = scoreBucket(score, [35, 55, 75], ["Slow", "Fair", "Healthy", "Strong"]);
    var summary = label + " liquidity. " + (reasons[0] ? reasons[0].detail : "The local pricing layer suggests average resale speed.");
    return {
      score: Math.round(score),
      label: label,
      summary: summary,
      reasons: reasons.slice(0, 4),
      confidence: lowestConfidence([context.localPrice.confidence, context.landed.confidence])
    };
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
    context.media = resolveMedia(data, vehicle, code, sourceMarket);
    context.importRisk = buildImportRisk(data, context);
    context.liquidity = buildLiquidityScore(data, context);
    context.financing = buildFinancingOffers(data, context);
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
    if (context.vehicle.cc && context.vehicle.cc[0]) params.set("engineCc", Math.round((num(context.vehicle.cc[0]) + num(context.vehicle.cc[1] || context.vehicle.cc[0])) / 2));
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
      financing: {
        bestOffer: context.financing.bestOffer,
        offerCount: context.financing.offers.length
      },
      importRisk: context.importRisk,
      liquidity: context.liquidity,
      media: {
        hero: context.media.hero,
        galleryCount: context.media.gallery.length
      },
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
      if (filters.fuel && array(vehicle.fuel).indexOf(filters.fuel) === -1) return false;
      if (filters.transmission && array(vehicle.transmissions).indexOf(filters.transmission) === -1) return false;
      if (filters.sourceMarket && array(vehicle.sources).indexOf(filters.sourceMarket) === -1) return false;
      if (filters.recommendation && ctx && ctx.recommendation.status !== filters.recommendation) return false;
      if (filters.eligibility && ctx && ctx.eligibilityStatus !== filters.eligibility) return false;
      if (filters.confidence && ctx && ctx.landed.confidence !== filters.confidence) return false;
      if (filters.maxLanded && ctx && ctx.landed.normal > num(filters.maxLanded)) return false;
      if (filters.maxLocal && ctx && ctx.localPrice.median > num(filters.maxLocal)) return false;
      if (filters.maxRisk && ctx && ctx.importRisk.score > num(filters.maxRisk)) return false;
      if (filters.minLiquidity && ctx && ctx.liquidity.score < num(filters.minLiquidity)) return false;
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
    resolveMedia: resolveMedia,
    buildFinancingOffers: buildFinancingOffers,
    buildImportRisk: buildImportRisk,
    buildLiquidityScore: buildLiquidityScore,
    formatMoney: formatMoney,
    _private: {
      recommend: recommend,
      eligibilityFromWarnings: eligibilityFromWarnings,
      importInput: importInput,
      computeMonthlyPayment: computeMonthlyPayment
    }
  };
});
