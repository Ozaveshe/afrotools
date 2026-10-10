(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.TractorCalculatorEngine = api;
  }
}(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  function owns(object,key) { return !!object && typeof key === 'string' && Object.prototype.hasOwnProperty.call(object,key); }
  function finiteTree(value) { if(typeof value === 'number')return Number.isFinite(value);if(value && typeof value === 'object')return Object.keys(value).every(function(k){return finiteTree(value[k]);});return true; }

  function calculateBuy(input, equipment, hireRates) {
    var dieselPrice = hireRates ? (hireRates.diesel_per_litre || 0) : 0;
    var activeContractHa = input.doContract === false ? 0 : input.contractHa;
    var totalHaWork = (input.farmHa + activeContractHa) * input.passes;
    var capacity = equipment.areaCapacity_ha_per_day;
    var ploughCapacity = capacity ? (capacity.ploughing || 2) : 2;
    var hoursNeeded = (totalHaWork / (capacity && capacity.harvesting ? capacity.harvesting : ploughCapacity)) * 8;
    if (capacity && capacity.ploughing && capacity.harrowing && capacity.ridging) {
      var operations = ['ploughing', 'harrowing', 'ridging'].slice(0, input.passes);
      hoursNeeded = operations.reduce(function (hours, operation) {
        return hours + ((input.farmHa + activeContractHa) / capacity[operation]) * 8;
      }, 0);
    }
    var referenceAnnualHours = equipment.operatingHours_per_year || 600;
    var hoursPerYear = hoursNeeded;
    hoursPerYear = Math.max(hoursPerYear, 50);
    var annualFuel = equipment.fuelConsumption_L_hr * hoursPerYear * dieselPrice;
    var annualMaint = input.price * (equipment.annualMaintenance_pct / 100);
    var annualOp = annualFuel + annualMaint;
    var lifespan = equipment.lifespan_years || 15;
    var depRate = (1 - (equipment.resaleValue_pct_after_10yr || 30) / 100) / lifespan;
    var residual = Math.max(input.price * (1 - depRate * Math.min(input.years, lifespan)), input.price * 0.05);
    var totalCost = input.price + annualOp * input.years - residual;
    var ownHaYears = input.farmHa * input.years;
    var costPerHa = ownHaYears > 0 ? totalCost / ownHaYears : 0;
    var costPerHour = hoursPerYear * input.years > 0 ? totalCost / (hoursPerYear * input.years) : 0;
    return {
      capitalRequired: input.price,
      annualOp: annualOp,
      annualFuel: annualFuel,
      annualMaint: annualMaint,
      totalCost: totalCost,
      residual: residual,
      costPerHa: costPerHa,
      costPerHour: costPerHour,
      hoursPerYear: hoursPerYear,
      workloadHoursPerYear: hoursNeeded,
      referenceAnnualHours: referenceAnnualHours,
      exceedsReferenceAnnualHours: hoursNeeded > referenceAnnualHours,
      excessWorkloadHours: Math.max(0, hoursNeeded - referenceAnnualHours),
    };
  }

  function calculateHire(hireRates, farmHa, passes, equipmentKey) {
    if (!hireRates) return null;
    var key = equipmentKey || 'tractor_small';
    var rateFields;
    if (key === 'combine_harvester') rateFields = ['combine_per_ha'];
    else if (key === 'power_tiller') {
      // The single tiller quote has no verified multi-operation breakdown.
      if (passes !== 1) return null;
      rateFields = ['power_tiller_per_ha'];
    } else rateFields = ['tractor_ploughing_per_ha', 'tractor_harrowing_per_ha', 'tractor_ridging_per_ha'].slice(0, passes);
    if (rateFields.some(function (field) { return !Number.isFinite(hireRates[field]) || hireRates[field] < 0; })) return null;
    var annual = farmHa * rateFields.reduce(function (sum, field) { return sum + hireRates[field]; }, 0);
    if (key === 'combine_harvester') annual *= passes;
    return {
      capitalRequired: 0,
      annualCost: annual,
      costPerHa: annual / farmHa,
      availability: hireRates.availability || 'unknown',
      wait_time: hireRates.wait_time || '—',
      providers: hireRates.providers || '—',
      notes: hireRates.notes || '',
    };
  }

  function calculateLease(input, ownership) {
    var down = input.price * (input.downPct / 100);
    var principal = input.price - down;
    var months = input.term * 12;
    var periodMonths = Math.min(input.years * 12, months);
    var monthlyRate = input.rate / 100 / 12;
    var logRate = Math.log1p(monthlyRate);
    var monthly = monthlyRate === 0 ? principal / months : principal * monthlyRate / -Math.expm1(-months * logRate);
    var remainingMonths = months - periodMonths;
    var remainingBalance = remainingMonths === 0 ? 0 : monthlyRate === 0 ? principal * remainingMonths / months : monthly * -Math.expm1(-remainingMonths * logRate) / monthlyRate;
    var periodPayments = monthly * periodMonths;
    var principalRepaid = principal - remainingBalance;
    var periodInterest = Math.max(0, periodPayments - principalRepaid);
    var operatingCost = ownership ? ownership.annualOp * input.years : 0;
    var residual = ownership ? ownership.residual : 0;
    var totalCost = input.price + periodInterest + operatingCost - residual;
    var totalRepayments = down + monthly * months;
    return {
      capitalRequired: down,
      monthlyPayment: monthly,
      annualPayment: monthly * 12,
      totalCost: totalCost,
      costPerHa: totalCost / (input.farmHa * input.years),
      term: input.term,
      rate: input.rate,
      comparisonYears: input.years,
      paymentsWithinPeriod: periodPayments,
      paymentMonthsWithinPeriod: periodMonths,
      remainingBalance: remainingBalance,
      principalRepaidWithinPeriod: principalRepaid,
      interestWithinPeriod: periodInterest,
      operatingCostWithinPeriod: operatingCost,
      residualAtPeriodEnd: residual,
      totalRepayments: totalRepayments,
      totalInterest: Math.max(0, totalRepayments - input.price),
      financingModel: 'fully-amortizing-purchase',
      comparisonScope: 'Purchase price plus interest incurred and operating cost within comparison years, less modeled residual value. Remaining debt is retained, not forgiven.',
      contractAssumptions: 'Fixed rate, monthly repayments, ownership retained, no fees or balloon payment. Lease selection uses this purchase-financing model; verify actual lease ownership and end payments separately.'
    };
  }

  function breakEvenHa(buy, hire, years) {
    if (!hire || hire.costPerHa <= 0) return null;
    return (buy.totalCost / years) / hire.costPerHa;
  }

  function defaults(countryCode, equipmentKey, data) {
    var country = data && owns(data.countries,countryCode) && data.countries[countryCode];
    var equipment = data && owns(data.equipment,equipmentKey) && data.equipment[equipmentKey];
    var hire = data && data.hireRates && data.hireRates[countryCode];
    var finance = data && data.financing && data.financing[countryCode];
    if (!country) return { ok: false, status: 'unknown-country' };
    if (!equipment) return { ok: false, status: 'unknown-equipment' };
    var rateField = equipmentKey === 'combine_harvester' ? 'combine_per_ha' : equipmentKey === 'power_tiller' ? 'power_tiller_per_ha' : 'tractor_ploughing_per_ha';
    var defaultContractRate = hire && Number.isFinite(hire[rateField]) && hire[rateField] >= 0 ? hire[rateField] : null;
    var primary = finance && finance.options && finance.options[0];
    var secondary = finance && finance.options && finance.options[1];
    return {
      ok: true,
      status: 'ready',
      countryCode: countryCode,
      equipmentKey: equipmentKey,
      price: Math.round(equipment.purchasePrice_USD.typical * country.usdRate / 1000) * 1000,
      contractRate: defaultContractRate,
      contractRateAvailable: defaultContractRate !== null,
      financeRate: secondary ? secondary.rate_pct : (primary ? primary.rate_pct : 12),
      financeTerm: secondary ? secondary.term_years : (primary ? primary.term_years : 5),
      financeOption: primary || null,
      currency: country.currency,
      symbol: country.symbol,
      equipmentExamples: equipment.examples,
    };
  }

  function calculate(input, data) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) return {ok:false,status:'invalid-input'};
    var country = data && owns(data.countries,input.countryCode) && data.countries[input.countryCode];
    var equipment = data && owns(data.equipment,input.equipmentKey) && data.equipment[input.equipmentKey];
    var hireRates = data && data.hireRates && data.hireRates[input.countryCode];
    if (!country) return { ok: false, status: 'unknown-country' };
    if (!equipment) return { ok: false, status: 'unknown-equipment' };
    var fields = ['price', 'farmHa', 'passes', 'years', 'contractHa', 'contractRate', 'rate', 'term', 'downPct'];
    if (fields.some(function (field) { return !Number.isFinite(input[field]); })) return { ok: false, status: 'invalid-input' };
    if(input.price <= 0 || input.farmHa <= 0 || !Number.isInteger(input.passes) || input.passes < 1 || input.passes > 3 || !Number.isInteger(input.years) || input.years < 1 || input.contractHa < 0 || input.contractRate < 0 || input.rate < 0 || !Number.isInteger(input.term) || input.term < 1 || input.downPct < 0 || input.downPct > 100 || ['cash','loan','lease'].indexOf(input.financeType) < 0 || typeof input.doContract !== 'boolean') return {ok:false,status:'invalid-input'};
    var buy = calculateBuy(input, equipment, hireRates);
    var hire = calculateHire(hireRates, input.farmHa, input.passes, input.equipmentKey);
    var lease = input.financeType === 'lease' || input.financeType === 'loan' ? calculateLease(input, buy) : null;
    var costs = { buy: buy.totalCost, hire: hire ? hire.annualCost * input.years : null };
    if (lease) costs.lease = lease.totalCost;
    var availableOptions = Object.keys(costs).filter(function (key) { return costs[key] !== null; });
    var winner = availableOptions.reduce(function (left, right) { return costs[left] < costs[right] ? left : right; });
    var sorted = availableOptions.sort(function (left, right) { return costs[left] - costs[right]; });
    var second = sorted[1];
    var savings = second && costs[second] !== Infinity ? costs[second] - costs[winner] : 0;
    var annualContractIncome = input.doContract ? input.contractHa * input.contractRate : 0;
    var result = {
      ok: true,
      status: 'calculated',
      input: Object.assign({}, input),
      country: Object.assign({ code: input.countryCode }, country),
      equipment: Object.assign({ key: input.equipmentKey }, equipment),
      hireRates: hireRates || null,
      financing: data.financing && data.financing[input.countryCode] || null,
      buy: buy,
      hire: hire,
      hireStatus: hire ? 'reference-rate-available' : 'matching-rate-unavailable',
      operationScope: input.equipmentKey === 'combine_harvester' ? 'harvest-cycles-per-year' : 'ploughing-then-harrowing-then-ridging',
      lease: lease,
      costs: costs,
      winner: winner,
      savings: savings,
      breakEvenHa: breakEvenHa(buy, hire, input.years),
      contract: {
        enabled: Boolean(input.doContract),
        annualIncome: annualContractIncome,
        totalIncome: annualContractIncome * input.years,
        payoffYears: annualContractIncome > 0 ? input.price / annualContractIncome : null,
        netBuyCostPerYear: Math.max(buy.totalCost / input.years - annualContractIncome, 0),
      },
    };
    return finiteTree(result) ? result : {ok:false,status:'non-finite-result'};
  }

  return Object.freeze({
    calculateBuy: calculateBuy,
    calculateHire: calculateHire,
    calculateLease: calculateLease,
    breakEvenHa: breakEvenHa,
    defaults: defaults,
    calculate: calculate,
  });
}));
