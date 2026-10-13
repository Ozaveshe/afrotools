(function warehouseReceiptEngineModule(root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.WarehouseReceiptEngine = api;
  }
}(typeof window !== 'undefined' ? window : globalThis, function createWarehouseReceiptEngine() {
  'use strict';
  function number(value) {
    if (typeof value !== 'number' && typeof value !== 'string') return NaN;
    if (typeof value === 'string' && !value.trim()) return NaN;
    var n = Number(value);
    return Number.isFinite(n) ? n : NaN;
  }
  function owns(object, key) { return !!object && Object.prototype.hasOwnProperty.call(object, key); }
  function calculate(input, data) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) return { ok: false, status: 'invalid-input' };
    var country = data && owns(data.countries, input.countryCode) ? data.countries[input.countryCode] : null;
    if (!country) return { ok: false, status: 'missing-country' };
    var quantityTonnes = number(input.quantityTonnes);
    var harvestPricePerTonne = number(input.harvestPricePerTonne);
    var ltvPct = number(input.ltvPct);
    var annualRatePct = number(input.annualRatePct);
    var periodMonths = number(input.periodMonths);
    var storagePerTonneMonth = number(input.storagePerTonneMonth);
    var insuranceAnnualPct = number(input.insuranceAnnualPct);
    var handlingPerTonne = number(input.handlingPerTonne);
    var priceIncreasePct = number(input.priceIncreasePct);
    if (!quantityTonnes || quantityTonnes <= 0) return { ok: false, status: 'missing-quantity' };
    if (!harvestPricePerTonne || harvestPricePerTonne <= 0) return { ok: false, status: 'missing-price' };
    if (Number.isNaN(storagePerTonneMonth)) return { ok: false, status: 'missing-storage-cost' };
    if (Number.isNaN(handlingPerTonne)) return { ok: false, status: 'missing-handling-cost' };
    if (input.commodity != null && !owns(data.commodities, input.commodity)) return { ok: false, status: 'missing-commodity' };
    var nonnegative = [ltvPct, annualRatePct, storagePerTonneMonth, insuranceAnnualPct, handlingPerTonne];
    if (nonnegative.some(function (n) { return !Number.isFinite(n) || n < 0; })) return { ok: false, status: 'invalid-cost-or-rate' };
    if (ltvPct > 100) return { ok: false, status: 'invalid-ltv' };
    if (!Number.isFinite(periodMonths) || periodMonths <= 0) return { ok: false, status: 'invalid-period' };
    if (!Number.isFinite(priceIncreasePct) || priceIncreasePct < -100) return { ok: false, status: 'invalid-price-change' };
    var ltv = ltvPct / 100;
    var annualRate = annualRatePct / 100;
    var insuranceAnnual = insuranceAnnualPct / 100;
    var priceIncrease = priceIncreasePct / 100;
    var grainValue = quantityTonnes * harvestPricePerTonne;
    var loanAmount = grainValue * ltv;
    var interest = loanAmount * annualRate * (periodMonths / 12);
    var storageCost = quantityTonnes * storagePerTonneMonth * periodMonths;
    var insuranceCost = grainValue * insuranceAnnual * (periodMonths / 12);
    var handlingCost = quantityTonnes * handlingPerTonne;
    var totalCost = interest + storageCost + insuranceCost + handlingCost;
    var expectedPrice = harvestPricePerTonne * (1 + priceIncrease);
    var saleRevenue = quantityTonnes * expectedPrice;
    var netProceeds = saleRevenue - totalCost;
    var cashAfterRepayment = netProceeds - loanAmount;
    var harvestValue = quantityTonnes * harvestPricePerTonne;
    var wrsGain = netProceeds - harvestValue;
    var wrsGainPct = wrsGain / harvestValue * 100;
    var breakEvenIncreasePct = totalCost / harvestValue * 100;
    var values = [cashAfterRepayment, grainValue, loanAmount, interest, storageCost, insuranceCost, handlingCost, totalCost, expectedPrice, saleRevenue, netProceeds, harvestValue, wrsGain, wrsGainPct, breakEvenIncreasePct];
    if (values.some(function (n) { return !Number.isFinite(n); })) return { ok: false, status: 'numeric-overflow' };
    return {
      ok: true,
      status: 'calculated',
      input: {
        countryCode: input.countryCode,
        commodity: input.commodity || null,
        quantityTonnes: quantityTonnes,
        harvestPricePerTonne: harvestPricePerTonne,
        ltvPct: ltvPct,
        annualRatePct: annualRatePct,
        periodMonths: periodMonths,
        storagePerTonneMonth: storagePerTonneMonth,
        insuranceAnnualPct: insuranceAnnualPct,
        handlingPerTonne: handlingPerTonne,
        priceIncreasePct: priceIncreasePct,
      },
      // Export only display identity; legacy reference prose is not verified evidence.
      country: { name: country.name, currency: country.currency, symbol: country.symbol },
      assumptionStatus: 'illustrative-undated-user-confirmation-required',
      commodity: input.commodity != null && owns(data.commodities, input.commodity) ? { name: data.commodities[input.commodity].name } : null,
      grainValue: grainValue,
      loanAmount: loanAmount,
      interest: interest,
      storageCost: storageCost,
      insuranceCost: insuranceCost,
      handlingCost: handlingCost,
      totalCost: totalCost,
      expectedPrice: expectedPrice,
      saleRevenue: saleRevenue,
      netProceeds: netProceeds,
      principalRepayment: loanAmount,
      cashAfterRepayment: cashAfterRepayment,
      cashFlowBasis: "all-costs-deducted-at-sale",
      excludedCosts: ["unentered-taxes", "quality-or-quantity-losses", "other-unentered-fees"],
      harvestValue: harvestValue,
      wrsGain: wrsGain,
      wrsGainPct: wrsGainPct,
      breakEvenIncreasePct: breakEvenIncreasePct,
      profitable: wrsGain > 0,
    };
  }
  return { calculate: calculate };
}));
