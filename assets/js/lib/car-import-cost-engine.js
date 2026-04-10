(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.AfroCarImportCost = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var DEFAULT_FX = {
    USD: 1,
    NGN: 1535.5,
    KES: 129.45,
    GHS: 14.89,
    UGX: 3720,
    ZMW: 27.5,
    TZS: 2650
  };

  function num(value, fallback) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : (fallback || 0);
  }

  function round(value, places) {
    var factor = Math.pow(10, places == null ? 2 : places);
    return Math.round((num(value) + Number.EPSILON) * factor) / factor;
  }

  function clamp(value, min) {
    return Math.max(min == null ? 0 : min, num(value));
  }

  function normalizeText(value) {
    return String(value || "").trim().toLowerCase();
  }

  function upper(value, fallback) {
    return String(value || fallback || "").trim().toUpperCase();
  }

  function getCountryPack(data, countryCode) {
    var packs = data && data.countryRulePacks ? data.countryRulePacks : {};
    return packs[upper(countryCode, "NG")] || packs.NG;
  }

  function getFxRate(data, currency, inputFx) {
    var code = upper(currency, "USD");
    var fromInput = inputFx && inputFx[code];
    var fromData = data && data.fxRates && data.fxRates[code];
    return num(fromInput || fromData || DEFAULT_FX[code] || 1, 1);
  }

  function asOfDate(data, input) {
    return new Date(input && input.asOfDate || data && data.generatedAt || "2026-04-10T00:00:00Z");
  }

  function computeAge(input, data) {
    var date = asOfDate(data, input);
    var year = Math.trunc(num(input.year, date.getUTCFullYear()));
    var month = Math.trunc(num(input.firstRegistrationMonth || input.monthOfFirstRegistration, 1));
    var age = date.getUTCFullYear() - year;
    if (month > date.getUTCMonth() + 1) age -= 1;
    return Math.max(0, age);
  }

  function findValuationSeed(input, data) {
    var seeds = data && data.valuationSeeds || [];
    var make = normalizeText(input.make);
    var model = normalizeText(input.model);
    var year = Math.trunc(num(input.year, 0));
    var exact = seeds.find(function (seed) {
      return normalizeText(seed.make) === make && normalizeText(seed.model) === model && num(seed.year) === year;
    });
    if (exact) return exact;
    if (!make || !model) return null;
    return seeds.find(function (seed) {
      return normalizeText(seed.make) === make && normalizeText(seed.model) === model;
    }) || null;
  }

  function sourceMarket(data, id) {
    var markets = data && data.sourceMarkets || {};
    return markets[id] || markets.japan || { id: "japan", label: "Japan", defaultFreightUsd: {}, vehiclePriceMultiplier: 1 };
  }

  function defaultFreightUsd(input, pack, data) {
    var market = sourceMarket(data, input.sourceMarket);
    var byCountry = market.defaultFreightUsd || {};
    return num(input.freightUsd || input.freight || byCountry[pack.countryCode] || pack.customsBasisRules && pack.customsBasisRules.freightFallbackUsd, 0);
  }

  function normalizeInput(input, data) {
    input = input || {};
    var countryCode = upper(input.countryCode || input.country, "NG");
    var pack = getCountryPack(data, countryCode);
    var marketId = normalizeText(input.sourceMarket || "japan") || "japan";
    var seed = findValuationSeed(input, data);
    var market = sourceMarket(data, marketId);
    var fuelType = normalizeText(input.ev || input.isEv ? "ev" : input.fuelType || "petrol");
    if (fuelType === "electric") fuelType = "ev";
    var vehicleClass = normalizeText(input.vehicleClass || input.bodyType || seed && seed.vehicleClass || "sedan");
    var seedPrice = seed && seed.sourcePricesUsd && seed.sourcePricesUsd[marketId] || seed && seed.fobUsd ? num(seed.sourcePricesUsd && seed.sourcePricesUsd[marketId] || seed.fobUsd) * num(market.vehiclePriceMultiplier, 1) : 0;
    var mode = normalizeText(input.inputMode || input.valueMode || (input.cifUsd ? "cif" : input.fobUsd ? "fob" : seedPrice ? "make-model-year" : "purchase"));
    return {
      countryCode: countryCode,
      sourceMarket: marketId,
      sourceMarketLabel: market.label || marketId,
      inputMode: mode,
      outputMode: normalizeText(input.outputMode || "practical"),
      make: input.make || seed && seed.make || "",
      model: input.model || seed && seed.model || "",
      trim: input.trim || "",
      year: Math.trunc(num(input.year || seed && seed.year, asOfDate(data, input).getUTCFullYear())),
      firstRegistrationMonth: Math.trunc(num(input.firstRegistrationMonth || input.monthOfFirstRegistration, 1)),
      fuelType: fuelType,
      engineCc: Math.trunc(num(input.engineCc || seed && seed.engineCc, 0)),
      transmission: normalizeText(input.transmission || "automatic"),
      vehicleClass: vehicleClass,
      bodyType: normalizeText(input.bodyType || vehicleClass),
      driveSide: normalizeText(input.driveSide || input.steering || (pack.steeringRules && pack.steeringRules.required) || "right"),
      condition: normalizeText(input.condition || "used"),
      mileage: num(input.mileage, 0),
      purchasePriceUsd: num(input.purchasePriceUsd || input.purchasePrice || input.vehiclePriceUsd, seedPrice),
      fobUsd: num(input.fobUsd || input.fob, 0),
      cifUsd: num(input.cifUsd || input.cif, 0),
      customsValueUsd: num(input.customsValueUsd || input.customsValue, 0),
      freightUsd: num(input.freightUsd || input.freight, 0),
      insuranceUsd: num(input.insuranceUsd || input.insurance, 0),
      portCode: input.portCode || input.port || "",
      destinationCity: normalizeText(input.destinationCity || input.city || ""),
      delayDays: Math.max(0, Math.trunc(num(input.delayDays, 0))),
      storageDays: Math.max(0, Math.trunc(num(input.storageDays, 0))),
      clearingMode: normalizeText(input.clearingMode || "agent"),
      downPaymentPct: num(input.downPaymentPct, 0.25),
      financeAprPct: num(input.financeAprPct, 0.24),
      financeMonths: Math.trunc(num(input.financeMonths, 36)),
      localDealerPriceUsd: num(input.localDealerPriceUsd || input.localDealerPrice, 0),
      extraAgencyChargesUsd: num(input.extraAgencyChargesUsd, 0),
      fxRates: input.fxRates || null,
      valuationSeedId: seed && seed.id || null
    };
  }

  function resolveValueBasis(input, pack, data) {
    var rules = pack.customsBasisRules || {};
    var freight = defaultFreightUsd(input, pack, data);
    var insuranceRate = num(rules.insuranceRate, 0.012);
    var fob = 0;
    var insurance = num(input.insuranceUsd, 0);
    var cif = num(input.cifUsd, 0);
    var status = input.valuationSeedId ? "valuation-pack" : "manual";

    if (input.inputMode === "cif" && cif > 0) {
      if (!insurance) insurance = cif * insuranceRate;
      fob = Math.max(0, cif - freight - insurance);
    } else {
      fob = input.inputMode === "fob" && input.fobUsd > 0 ? input.fobUsd : input.purchasePriceUsd;
      if (input.fobUsd > 0) fob = input.fobUsd;
      if (!freight) freight = num(rules.freightFallbackUsd, 0);
      if (!insurance) insurance = (fob + freight) * insuranceRate;
      cif = fob + freight + insurance;
    }

    if (input.customsValueUsd > 0) {
      cif = input.customsValueUsd;
      status = "manual-customs-value";
    }

    return {
      fobUsd: round(fob),
      freightUsd: round(freight),
      insuranceUsd: round(insurance),
      cifUsd: round(cif),
      customsValueUsd: round(cif),
      basis: rules.basis || "CIF",
      valuationStatus: status
    };
  }

  function matchesConditions(conditions, input) {
    if (!conditions) return true;
    if (conditions.fuelTypes && conditions.fuelTypes.indexOf(input.fuelType) === -1) return false;
    if (conditions.vehicleClasses && conditions.vehicleClasses.indexOf(input.vehicleClass) === -1) return false;
    if (conditions.evOnly && input.fuelType !== "ev") return false;
    if (conditions.notEv && input.fuelType === "ev") return false;
    return true;
  }

  function tierMatches(tier, input, age) {
    if (!matchesConditions(tier.conditions, input)) return false;
    if (tier.vehicleClasses && tier.vehicleClasses.indexOf(input.vehicleClass) === -1) return false;
    if (tier.fuelTypes && tier.fuelTypes.indexOf(input.fuelType) === -1) return false;
    if (tier.minCc != null && input.engineCc < num(tier.minCc)) return false;
    if (tier.maxCc != null && input.engineCc > num(tier.maxCc)) return false;
    if (tier.minAge != null && age < num(tier.minAge)) return false;
    if (tier.maxAge != null && age > num(tier.maxAge)) return false;
    return true;
  }

  function findTier(tiers, input, age) {
    return (tiers || []).find(function (tier) { return tierMatches(tier, input, age); }) || null;
  }

  function resolveBase(component, ctx) {
    switch (component.base) {
      case "FOB":
        return ctx.valueBasis.fobUsd;
      case "CIF":
      case "customsValue":
        return ctx.valueBasis.customsValueUsd;
      case "customsValuePlusPriorOfficialTaxes":
      case "dutyInclusiveValue":
        return ctx.valueBasis.customsValueUsd + ctx.priorOfficialTaxesUsd;
      case "officialSubtotal":
        return ctx.officialSubtotalUsd;
      case "fixed":
        return 1;
      default:
        return ctx.valueBasis.customsValueUsd;
    }
  }

  function fixedAmountUsd(component, ctx, selected) {
    selected = selected || component;
    if (selected.amountUsd != null) return num(selected.amountUsd);
    if (selected.amountLocal != null) return num(selected.amountLocal) / ctx.fxRate;
    return 0;
  }

  function componentResult(component, ctx) {
    if (component.enabled === false || !matchesConditions(component.conditions, ctx.input)) return null;
    var input = ctx.input;
    var age = ctx.ageYears;
    var base = resolveBase(component, ctx);
    var amount = 0;
    var rate = component.rateOrFormula;
    var tier = null;

    if (component.type === "percentage") {
      amount = base * num(rate, 0);
    } else if (component.type === "fixed") {
      amount = fixedAmountUsd(component, ctx);
    } else if (component.type === "engine-based" || component.type === "tiered") {
      tier = findTier(component.tiers, input, age);
      if (!tier) return null;
      if (tier.amountUsd != null || tier.amountLocal != null) amount = fixedAmountUsd(component, ctx, tier);
      else amount = base * num(tier.rate, 0);
      rate = tier.rate;
    } else if (component.type === "age-based") {
      tier = findTier(component.tiers, input, age);
      if (!tier) return null;
      if (tier.amountUsd != null || tier.amountLocal != null) amount = fixedAmountUsd(component, ctx, tier);
      else amount = base * num(tier.rate, 0);
      rate = tier.rate;
    } else if (component.type === "schedule-lookup") {
      tier = findTier(component.schedule, input, age);
      if (tier) {
        if (tier.amountUsd != null || tier.amountLocal != null) amount = fixedAmountUsd(component, ctx, tier);
        else amount = base * num(tier.rate, 0);
        rate = tier.rate;
      } else if (component.fallback) {
        amount = base * num(component.fallback.rate, 0);
        rate = component.fallback.rate;
      }
    } else if (component.type === "formula") {
      amount = base * num(rate, 0);
    }

    amount = round(clamp(amount));
    if (!amount && !component.forceDisplay) return null;
    return {
      id: component.id,
      label: component.label,
      group: component.group || "officialTaxes",
      official: component.official !== false,
      amountUsd: amount,
      amountLocal: round(amount * ctx.fxRate, 0),
      baseUsd: round(base),
      rate: rate != null ? num(rate) : null,
      tierLabel: tier && tier.label || component.fallback && component.fallback.label || "",
      displayOrder: num(component.displayOrder, 999),
      notes: component.notes || ""
    };
  }

  function calculateComponents(components, ctx) {
    var items = [];
    (components || []).slice().sort(function (a, b) {
      return num(a.displayOrder, 999) - num(b.displayOrder, 999);
    }).forEach(function (component) {
      var item = componentResult(component, ctx);
      if (!item) return;
      items.push(item);
      if (item.group === "officialTaxes") ctx.priorOfficialTaxesUsd += item.amountUsd;
      if (item.official) ctx.officialSubtotalUsd += item.amountUsd;
    });
    return items;
  }

  function getPort(pack, input) {
    return (pack.ports || []).find(function (port) { return port.code === input.portCode; }) || (pack.ports || [])[0] || {};
  }

  function getCity(pack, input) {
    return (pack.cities || []).find(function (city) { return city.id === input.destinationCity; }) || (pack.cities || [])[0] || {};
  }

  function practicalItem(id, label, amountUsd, group, official, notes) {
    amountUsd = round(clamp(amountUsd));
    if (!amountUsd) return null;
    return {
      id: id,
      label: label,
      group: group || "practicalCosts",
      official: !!official,
      amountUsd: amountUsd,
      amountLocal: 0,
      notes: notes || ""
    };
  }

  function buildPracticalCosts(pack, input, ctx) {
    if (input.outputMode === "official") return [];
    var p = pack.practicalCostPresets || {};
    var port = getPort(pack, input);
    var city = getCity(pack, input);
    var clearing = input.clearingMode === "diy" ? p.diyClearingUsd : p.clearingAgentUsd;
    var chargeableDays = Math.max(input.storageDays, input.delayDays - num(port.freeStorageDays, 0), 0);
    var items = [
      practicalItem("terminal-handling", "Terminal handling", port.terminalHandlingUsd || p.terminalHandlingUsd, "practicalCosts", false, port.label),
      practicalItem("shipping-line", "Shipping-line and release charges", port.shippingLineChargesUsd || p.shippingLineChargesUsd, "practicalCosts", false, port.label),
      practicalItem("inspection", pack.inspectionRules && pack.inspectionRules.label || "Inspection and compliance", p.inspectionUsd, "practicalCosts", false, ""),
      practicalItem("clearing-agent", input.clearingMode === "diy" ? "DIY clearing processing estimate" : "Customs broker / clearing agent", clearing, "practicalCosts", false, ""),
      practicalItem("storage-demurrage", "Storage and demurrage risk", chargeableDays * (num(port.dailyStorageUsd, 0) + num(port.dailyDemurrageUsd, 0)), "practicalCosts", false, chargeableDays + " chargeable days"),
      practicalItem("inland-delivery", "Inland delivery to " + (city.label || "destination city"), city.inlandUsd, "inlandDelivery", false, "")
    ].filter(Boolean);

    if (pack.countryCode === "GH" && p.safeBondRentUsd) {
      items.push(practicalItem("safe-bond-rent", "Safe bond terminal handling / rent", p.safeBondRentUsd, "practicalCosts", false, ""));
    }
    if (pack.countryCode === "ZM") {
      items.push(practicalItem("extra-agency-charges", "Extra agency charges estimate", input.extraAgencyChargesUsd || p.extraAgencyChargesUsd, "practicalCosts", false, ""));
    }
    if (input.outputMode === "stress") {
      var subtotal = sum(items);
      items.push(practicalItem("stress-buffer", "Stress-test buffer", subtotal * num(p.bufferRate, 0.06), "practicalCosts", false, "Applies to practical costs only."));
    }
    items.forEach(function (item) { item.amountLocal = round(item.amountUsd * ctx.fxRate, 0); });
    return items;
  }

  function sum(items) {
    return round((items || []).reduce(function (acc, item) { return acc + num(item.amountUsd, 0); }, 0));
  }

  function checkEligibility(pack, input, data) {
    var age = computeAge(input, data);
    var warnings = [];
    if (!input.engineCc) {
      warnings.push({ code: "missing-engine-cc", severity: "warning", message: "Engine size is missing, so engine-based charges may use fallback logic or be omitted." });
    }
    if (!input.purchasePriceUsd && !input.fobUsd && !input.cifUsd && !input.customsValueUsd) {
      warnings.push({ code: "valuation-estimate", severity: "warning", message: "No declared price was supplied. The calculator used the closest valuation seed where available." });
    }
    if (pack.ageRules) {
      if (pack.ageRules.maxYearsExclusive != null && age >= num(pack.ageRules.maxYearsExclusive)) {
        warnings.push({ code: "age-ineligible", severity: "critical", message: pack.ageRules.message });
      } else if (pack.ageRules.maxYears != null && age > num(pack.ageRules.maxYears)) {
        warnings.push({ code: "age-ineligible", severity: "critical", message: pack.ageRules.message });
      } else if (pack.ageRules.message && age >= 8 && pack.countryCode !== "NG" && pack.countryCode !== "KE") {
        warnings.push({ code: "age-sensitive", severity: "info", message: pack.ageRules.message });
      }
    }
    if (pack.steeringRules && pack.steeringRules.required && input.driveSide && input.driveSide !== pack.steeringRules.required) {
      warnings.push({ code: "steering-ineligible", severity: "critical", message: pack.steeringRules.message });
    }
    if (pack.customsBasisRules && pack.customsBasisRules.valuationPackRequired && !input.valuationSeedId && !input.customsValueUsd) {
      warnings.push({ code: "valuation-pack-missing", severity: "warning", message: "This country is designed around official valuation tables. Result is an estimate until a valuation pack or customs value is supplied." });
    }
    return warnings;
  }

  function isStale(pack, data, input) {
    var threshold = num(data && data.staleAfterDays, 180);
    var date = asOfDate(data, input);
    return (pack.sourceNotes || []).some(function (source) {
      if (!source.lastVerified) return true;
      var verified = new Date(source.lastVerified + "T00:00:00Z");
      var ageDays = (date.getTime() - verified.getTime()) / 86400000;
      return ageDays > threshold;
    });
  }

  function buildSensitivity(result, ctx) {
    var totalUsd = result.totals.onRoadUsd;
    var fx = ctx.fxRate;
    var port = getPort(ctx.pack, ctx.input);
    var daily = num(port.dailyStorageUsd, 0) + num(port.dailyDemurrageUsd, 0);
    return {
      exchangeRate: [
        { label: "-5% FX", fxRate: round(fx * 0.95, 4), totalLocal: round(totalUsd * fx * 0.95, 0) },
        { label: "Current FX", fxRate: round(fx, 4), totalLocal: round(totalUsd * fx, 0) },
        { label: "+5% FX", fxRate: round(fx * 1.05, 4), totalLocal: round(totalUsd * fx * 1.05, 0) }
      ],
      delayDays: [0, 7, 14, 30].map(function (days) {
        return { days: days, extraUsd: round(days * daily), onRoadUsd: round(totalUsd + days * daily) };
      })
    };
  }

  function buildFinance(onRoadUsd, input) {
    var down = Math.min(0.95, Math.max(0, num(input.downPaymentPct, 0.25)));
    var months = Math.max(1, num(input.financeMonths, 36));
    var monthlyRate = num(input.financeAprPct, 0.24) / 12;
    var principal = onRoadUsd * (1 - down);
    var payment = monthlyRate ? principal * monthlyRate / (1 - Math.pow(1 + monthlyRate, -months)) : principal / months;
    return {
      downPaymentUsd: round(onRoadUsd * down),
      financedAmountUsd: round(principal),
      aprPct: round(num(input.financeAprPct, 0.24) * 100, 2),
      months: months,
      monthlyPaymentUsd: round(payment)
    };
  }

  function buildResale(onRoadUsd, input) {
    var low = onRoadUsd * 1.08;
    var high = onRoadUsd * 1.18;
    return {
      suggestedLowUsd: round(low),
      suggestedHighUsd: round(high),
      marginBandPct: "8-18%"
    };
  }

  function buildLocalComparator(result, input) {
    var imported = result.totals.onRoadUsd;
    var local = num(input.localDealerPriceUsd, 0) || imported * 1.16;
    var delta = local - imported;
    return {
      localDealerEstimateUsd: round(local),
      importSavingsUsd: round(delta),
      cheaperOption: delta > 0 ? "import" : "buy-locally",
      note: input.localDealerPriceUsd ? "Based on user-entered local dealer price." : "Uses a default local-dealer markup until live dealer feeds are connected."
    };
  }

  function buildScenarios(result, ctx) {
    var p = ctx.pack.practicalCostPresets || {};
    var total = result.totals.onRoadUsd;
    var buffer = num(p.bufferRate, 0.06);
    return [
      { id: "best", label: "Best case", totalUsd: round(total * 0.95), assumption: "Clean documents, no storage, slightly cheaper port extras." },
      { id: "normal", label: "Normal", totalUsd: round(total), assumption: "Current inputs and active rule pack." },
      { id: "painful", label: "Painful case", totalUsd: round(total * (1 + buffer) + 250), assumption: "FX slip, slower clearing, extra storage, and agent buffer." }
    ];
  }

  function calculate(input, data, options) {
    data = data || {};
    options = options || {};
    var normalized = normalizeInput(input, data);
    var pack = getCountryPack(data, normalized.countryCode);
    var fxRate = getFxRate(data, pack.currency, normalized.fxRates);
    var valueBasis = resolveValueBasis(normalized, pack, data);
    var ctx = {
      input: normalized,
      pack: pack,
      fxRate: fxRate,
      valueBasis: valueBasis,
      ageYears: computeAge(normalized, data),
      priorOfficialTaxesUsd: 0,
      officialSubtotalUsd: 0
    };
    var officialItems = calculateComponents(pack.taxComponents, ctx);
    var registrationItems = calculateComponents(pack.registrationComponents, ctx);
    var practicalItems = buildPracticalCosts(pack, normalized, ctx);
    var officialTaxes = officialItems.filter(function (item) { return item.group === "officialTaxes"; });
    var officialFees = officialItems.filter(function (item) { return item.group !== "officialTaxes"; });
    var registration = registrationItems;
    var warnings = checkEligibility(pack, normalized, data);
    if (isStale(pack, data, normalized)) warnings.push({ code: "stale-rule-pack", severity: "warning", message: "One or more source notes are older than the configured freshness threshold." });
    if (!valueBasis.freightUsd) warnings.push({ code: "missing-shipping", severity: "warning", message: "Shipping is zero or missing; totals can be materially understated." });

    var totals = {
      vehicleBaseUsd: valueBasis.fobUsd,
      freightUsd: valueBasis.freightUsd,
      marineInsuranceUsd: valueBasis.insuranceUsd,
      cifUsd: valueBasis.cifUsd,
      officialTaxesUsd: sum(officialTaxes),
      officialFeesUsd: sum(officialFees),
      practicalCostsUsd: sum(practicalItems.filter(function (item) { return item.group === "practicalCosts"; })),
      inlandDeliveryUsd: sum(practicalItems.filter(function (item) { return item.group === "inlandDelivery"; })),
      registrationUsd: sum(registration)
    };
    totals.totalLandedUsd = round(totals.cifUsd + totals.officialTaxesUsd + totals.officialFeesUsd + totals.practicalCostsUsd + totals.inlandDeliveryUsd);
    totals.onRoadUsd = round(totals.totalLandedUsd + totals.registrationUsd);
    Object.keys(totals).forEach(function (key) {
      totals[key.replace("Usd", "Local")] = round(totals[key] * fxRate, 0);
    });

    var result = {
      schemaVersion: data.schemaVersion || "2026-04-10.1",
      calculatedAt: new Date().toISOString(),
      input: normalized,
      country: { code: pack.countryCode, name: pack.countryName, slug: pack.slug, currency: pack.currency, flagLabel: pack.flagLabel },
      rulePack: { effectiveFrom: pack.effectiveFrom, effectiveTo: pack.effectiveTo, status: pack.status, confidence: pack.confidence, valuationMethod: pack.valuationMethod },
      fx: { baseCurrency: "USD", localCurrency: pack.currency, usdToLocal: fxRate },
      valueBasis: valueBasis,
      warnings: warnings,
      badges: [
        { label: "official", type: "official" },
        { label: pack.confidence || "estimate", type: "estimate" },
        { label: valueBasis.valuationStatus, type: "manual" }
      ],
      breakdowns: {
        customsValueBasis: [
          { id: "vehicle-base", label: "Vehicle base / FOB", amountUsd: valueBasis.fobUsd },
          { id: "freight", label: "Freight to port", amountUsd: valueBasis.freightUsd },
          { id: "marine-insurance", label: "Marine insurance", amountUsd: valueBasis.insuranceUsd },
          { id: "cif", label: "CIF / customs value", amountUsd: valueBasis.cifUsd }
        ],
        officialTaxes: officialTaxes,
        officialFees: officialFees,
        practicalCosts: practicalItems.filter(function (item) { return item.group === "practicalCosts"; }),
        inlandDelivery: practicalItems.filter(function (item) { return item.group === "inlandDelivery"; }),
        registration: registration,
        allItems: officialItems.concat(practicalItems, registration)
      },
      totals: totals,
      documents: pack.documents || [],
      sourceMetadata: pack.sourceNotes || [],
      disclaimers: pack.disclaimers || [],
      faqs: pack.faqs || [],
      copy: pack.copy || {},
      explanation: {
        summary: "The engine estimated FOB, freight, and insurance to build a customs value, applied the active country rule pack, added practical port costs when selected, then added registration/on-road costs.",
        trust: "Use this as a planning estimate. Final customs, port, clearing, registration, and FX outcomes can differ."
      }
    };

    result.sensitivity = buildSensitivity(result, ctx);
    result.finance = buildFinance(result.totals.onRoadUsd, normalized);
    result.resale = buildResale(result.totals.onRoadUsd, normalized);
    result.localComparator = buildLocalComparator(result, normalized);
    result.scenarios = buildScenarios(result, ctx);
    if (!options.skipCompare) result.sourceMarketCompare = buildSourceMarketCompare(normalized, data);
    return result;
  }

  function buildSourceMarketCompare(input, data) {
    var markets = data && data.sourceMarkets || {};
    return Object.keys(markets).map(function (marketId) {
      var market = markets[marketId];
      var next = {};
      Object.keys(input).forEach(function (key) { next[key] = input[key]; });
      next.sourceMarket = marketId;
      next.inputMode = input.inputMode === "cif" ? "purchase" : input.inputMode;
      if (marketId === "local-dealer") {
        var localDealerPrice = num(input.localDealerPriceUsd, 0) || num(input.purchasePriceUsd, 0) * num(market.vehiclePriceMultiplier, 1);
        if (!localDealerPrice && input.valuationSeedId) {
          var localSeed = (data.valuationSeeds || []).find(function (item) { return item.id === input.valuationSeedId; });
          localDealerPrice = localSeed && localSeed.sourcePricesUsd && localSeed.sourcePricesUsd[marketId] || num(localSeed && localSeed.fobUsd, 0) * num(market.vehiclePriceMultiplier, 1);
        }
        return {
          sourceMarket: marketId,
          label: market.label || marketId,
          freightUsd: 0,
          onRoadUsd: round(localDealerPrice),
          totalLandedUsd: round(localDealerPrice),
          warningCount: 0
        };
      }
      if (input.valuationSeedId) {
        var seed = (data.valuationSeeds || []).find(function (item) { return item.id === input.valuationSeedId; });
        if (seed && seed.sourcePricesUsd && seed.sourcePricesUsd[marketId]) next.purchasePriceUsd = seed.sourcePricesUsd[marketId];
      } else {
        next.purchasePriceUsd = num(input.purchasePriceUsd, 0) * num(market.vehiclePriceMultiplier, 1);
      }
      var result = calculate(next, data, { skipCompare: true });
      return {
        sourceMarket: marketId,
        label: market.label || marketId,
        freightUsd: result.valueBasis.freightUsd,
        onRoadUsd: result.totals.onRoadUsd,
        totalLandedUsd: result.totals.totalLandedUsd,
        warningCount: result.warnings.length
      };
    }).sort(function (a, b) { return a.onRoadUsd - b.onRoadUsd; });
  }

  function mergeData(core, countryPacks, fxRates) {
    var merged = {};
    core = core || {};
    Object.keys(core).forEach(function (key) { merged[key] = core[key]; });
    merged.countryRulePacks = {};
    (countryPacks || []).forEach(function (pack) {
      if (pack && pack.countryCode) merged.countryRulePacks[pack.countryCode] = pack;
    });
    if (fxRates) merged.fxRates = fxRates;
    return merged;
  }

  function formatMoney(amount, currency, locale) {
    try {
      return new Intl.NumberFormat(locale || "en", {
        style: "currency",
        currency: currency || "USD",
        maximumFractionDigits: currency === "USD" ? 0 : 0
      }).format(num(amount));
    } catch (error) {
      return (currency || "USD") + " " + Math.round(num(amount)).toLocaleString();
    }
  }

  return {
    normalizeInput: normalizeInput,
    calculate: calculate,
    mergeData: mergeData,
    formatMoney: formatMoney,
    _private: {
      computeAge: computeAge,
      resolveValueBasis: resolveValueBasis,
      componentResult: componentResult
    }
  };
});
