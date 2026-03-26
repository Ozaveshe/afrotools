/**
 * crop-insurance-engine.js
 * AfroTools Crop Insurance Premium Calculator Engine
 * Calculates gross premium, government subsidy, farmer cost, and payout scenarios
 */
!function () {
  'use strict';
  window.AfroTools = window.AfroTools || {};

  function fmt(n, sym) {
    if (!isFinite(n) || n == null) return (sym || '') + '0';
    return (sym || '') + Math.round(Math.abs(n)).toLocaleString('en-US');
  }

  function fmtDec(n, sym, decimals) {
    if (!isFinite(n) || n == null) return (sym || '') + '0';
    return (sym || '') + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: decimals || 2, maximumFractionDigits: decimals || 2 });
  }

  /**
   * calculate(inputs, countryData)
   *
   * inputs: {
   *   insureType: 'crops' | 'livestock'
   *   item: string (crop name or livestock type)
   *   farmSize: number (hectares) — for crops
   *   numAnimals: number — for livestock
   *   valuePerAnimal: number — custom value per head (optional, uses price table if blank)
   *   sumBasis: 'input_cost' | 'revenue' | 'custom'
   *   inputCostPerHa: number (if sumBasis === 'input_cost', can override default)
   *   expectedYield: number (tonnes/ha, if sumBasis === 'revenue')
   *   marketPrice: number (per tonne, if sumBasis === 'revenue', can override default)
   *   customAmount: number (if sumBasis === 'custom')
   *   programIndex: number (which program to calculate for, default 0)
   * }
   *
   * countryData: country object from window.AfroTools.cropInsuranceData.countries[CC]
   */
  function calculate(inputs, countryData) {
    var CD = countryData;
    if (!CD) return { error: true, message: 'No country data loaded.' };

    var sym = CD.symbol || '';
    var insureType = inputs.insureType || 'crops';
    var item = inputs.item || '';
    var programIndex = parseInt(inputs.programIndex) || 0;

    // ─── PROGRAMS ───────────────────────────────────────────────────────
    var programs = CD.programs || [];
    if (!programs.length) return { error: true, message: 'No insurance programs found for this country.' };
    // Clamp to valid index
    if (programIndex >= programs.length) programIndex = 0;
    var prog = programs[programIndex];

    // ─── SUM INSURED ────────────────────────────────────────────────────
    var sumInsured = 0;
    var farmSize = parseFloat(inputs.farmSize) || 1;
    var numAnimals = parseFloat(inputs.numAnimals) || 1;
    var sumBasis = inputs.sumBasis || 'input_cost';
    var basisLabel = '';

    if (insureType === 'crops') {
      if (sumBasis === 'input_cost') {
        var costPerHa = parseFloat(inputs.inputCostPerHa);
        if (!costPerHa && CD.inputCostPerHa && CD.inputCostPerHa[item]) {
          costPerHa = CD.inputCostPerHa[item];
        }
        if (!costPerHa) costPerHa = 0;
        sumInsured = costPerHa * farmSize;
        basisLabel = 'Input Cost Basis (' + sym + fmt(costPerHa) + '/ha × ' + farmSize + ' ha)';
      } else if (sumBasis === 'revenue') {
        var yieldPerHa = parseFloat(inputs.expectedYield);
        if (!yieldPerHa && CD.typicalYield && CD.typicalYield[item]) {
          yieldPerHa = CD.typicalYield[item];
        }
        if (!yieldPerHa) yieldPerHa = 1;
        var pricePerTonne = parseFloat(inputs.marketPrice);
        if (!pricePerTonne && CD.prices && CD.prices[item]) {
          pricePerTonne = CD.prices[item];
        }
        if (!pricePerTonne) pricePerTonne = 0;
        sumInsured = yieldPerHa * pricePerTonne * farmSize;
        basisLabel = 'Revenue Basis (' + yieldPerHa + ' t/ha × ' + sym + fmt(pricePerTonne) + '/t × ' + farmSize + ' ha)';
      } else {
        sumInsured = parseFloat(inputs.customAmount) || 0;
        basisLabel = 'Custom Amount';
      }
    } else {
      // livestock
      var valuePerAnimal = parseFloat(inputs.valuePerAnimal);
      if (!valuePerAnimal && CD.prices && CD.prices[item]) {
        valuePerAnimal = CD.prices[item];
      }
      if (!valuePerAnimal) valuePerAnimal = 0;
      sumInsured = valuePerAnimal * numAnimals;
      basisLabel = 'Livestock Value (' + numAnimals + ' × ' + sym + fmt(valuePerAnimal) + '/head)';
    }

    // ─── PREMIUM CALCULATION ─────────────────────────────────────────────
    var premiumRate = parseFloat(prog.premiumRate) || 5;
    var govSubsidyPct = parseFloat(prog.govSubsidy) || 0;
    var deductiblePct = parseFloat(prog.deductible) || 0;

    var grossPremium = sumInsured * (premiumRate / 100);
    var govSubsidyAmt = grossPremium * (govSubsidyPct / 100);
    var farmerPays = grossPremium - govSubsidyAmt;

    // Per hectare / per animal
    var premiumPerUnit = insureType === 'crops'
      ? (farmSize > 0 ? farmerPays / farmSize : 0)
      : (numAnimals > 0 ? farmerPays / numAnimals : 0);
    var unitLabel = insureType === 'crops' ? '/ha' : '/animal';

    // Premium as % of sum insured (farmer's effective rate)
    var effectiveRate = sumInsured > 0 ? (farmerPays / sumInsured) * 100 : 0;

    // ─── PAYOUT SCENARIOS ────────────────────────────────────────────────
    // Deductible applies first — first X% of loss is not covered
    function payoutAtLoss(lossPct) {
      var coveredLossPct = Math.max(0, lossPct - deductiblePct);
      var payout = sumInsured * (coveredLossPct / 100);
      return Math.max(0, payout);
    }

    var scenarios = [
      { label: '25% loss', lossPct: 25, payout: payoutAtLoss(25) },
      { label: '50% loss', lossPct: 50, payout: payoutAtLoss(50) },
      { label: '75% loss', lossPct: 75, payout: payoutAtLoss(75) },
      { label: 'Total loss (100%)', lossPct: 100, payout: payoutAtLoss(100) }
    ];

    // ─── BREAK-EVEN ANALYSIS ─────────────────────────────────────────────
    // Over N years, how many loss events justify the premium?
    var breakEvenYears = 10;
    var totalPremium10Yr = farmerPays * breakEvenYears;
    var avgPayoutNeeded = farmerPays; // per year you pay — if 1 major event in 10 years...
    var fullLossPayout = payoutAtLoss(100);
    var breakEvenEvents = fullLossPayout > 0
      ? Math.ceil(totalPremium10Yr / fullLossPayout)
      : null;

    // ─── RESULT ──────────────────────────────────────────────────────────
    return {
      // Input echo
      countryName: CD.name,
      sym: sym,
      currency: CD.currency,
      insureType: insureType,
      item: item,
      farmSize: farmSize,
      numAnimals: numAnimals,
      sumBasis: sumBasis,
      basisLabel: basisLabel,

      // Program used
      program: prog,
      programIndex: programIndex,
      allPrograms: programs,

      // Sum insured
      sumInsured: sumInsured,

      // Premium
      premiumRate: premiumRate,
      govSubsidyPct: govSubsidyPct,
      deductiblePct: deductiblePct,
      grossPremium: grossPremium,
      govSubsidyAmt: govSubsidyAmt,
      farmerPays: farmerPays,
      premiumPerUnit: premiumPerUnit,
      unitLabel: unitLabel,
      effectiveRate: effectiveRate,

      // Payout scenarios
      scenarios: scenarios,

      // Break-even
      totalPremium10Yr: totalPremium10Yr,
      breakEvenEvents: breakEvenEvents,

      // Formatted
      fSumInsured: fmt(sumInsured, sym),
      fGrossPremium: fmt(grossPremium, sym),
      fGovSubsidy: fmt(govSubsidyAmt, sym),
      fFarmerPays: fmt(farmerPays, sym),
      fPremiumPerUnit: fmt(premiumPerUnit, sym),
      fTotalPremium10Yr: fmt(totalPremium10Yr, sym),
      fEffectiveRate: effectiveRate.toFixed(2)
    };
  }

  window.AfroTools.CropInsuranceEngine = { calculate: calculate, fmt: fmt, fmtDec: fmtDec };
}();
