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
  function calculate(input, data) {
    var country = data && data.countries && data.countries[input.countryCode];
    if (!country) return { ok: false, status: 'missing-country' };
    var quantityTonnes = parseFloat(input.quantityTonnes);
    var harvestPricePerTonne = parseFloat(input.harvestPricePerTonne);
    var ltvPct = parseFloat(input.ltvPct);
    var annualRatePct = parseFloat(input.annualRatePct);
    var periodMonths = parseFloat(input.periodMonths);
    var storagePerTonneMonth = parseFloat(input.storagePerTonneMonth);
    var insuranceAnnualPct = parseFloat(input.insuranceAnnualPct);
    var handlingPerTonne = parseFloat(input.handlingPerTonne);
    var priceIncreasePct = parseFloat(input.priceIncreasePct);
    if (!quantityTonnes || quantityTonnes <= 0) return { ok: false, status: 'missing-quantity' };
    if (!harvestPricePerTonne || harvestPricePerTonne <= 0) return { ok: false, status: 'missing-price' };
    if (Number.isNaN(storagePerTonneMonth)) return { ok: false, status: 'missing-storage-cost' };
    if (Number.isNaN(handlingPerTonne)) return { ok: false, status: 'missing-handling-cost' };
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
    var harvestValue = quantityTonnes * harvestPricePerTonne;
    var wrsGain = netProceeds - harvestValue;
    var wrsGainPct = wrsGain / harvestValue * 100;
    var breakEvenIncreasePct = totalCost / harvestValue * 100;
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
      country: country,
      commodity: data.commodities && data.commodities[input.commodity] || null,
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
      harvestValue: harvestValue,
      wrsGain: wrsGain,
      wrsGainPct: wrsGainPct,
      breakEvenIncreasePct: breakEvenIncreasePct,
      profitable: wrsGain > 0,
    };
  }
  return { calculate: calculate };
}));
