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

  function calculateBuy(input, equipment, hireRates) {
    var dieselPrice = hireRates ? (hireRates.diesel_per_litre || 0) : 0;
    var totalHaWork = (input.farmHa + input.contractHa) * input.passes;
    var capacity = equipment.areaCapacity_ha_per_day;
    var ploughCapacity = capacity ? (capacity.ploughing || 2) : 2;
    var hoursNeeded = (totalHaWork / ploughCapacity) * 8;
    var hoursPerYear = Math.min(hoursNeeded, equipment.operatingHours_per_year || 600);
    hoursPerYear = Math.max(hoursPerYear, 50);
    var annualFuel = equipment.fuelConsumption_L_hr * hoursPerYear * dieselPrice;
    var annualMaint = input.price * (equipment.annualMaintenance_pct / 100);
    var annualOp = annualFuel + annualMaint;
    var lifespan = equipment.lifespan_years || 15;
    var depRate = (1 - (equipment.resaleValue_pct_after_10yr || 30) / 100) / lifespan;
    var residual = Math.max(input.price * (1 - depRate * Math.min(input.years, lifespan)), input.price * 0.05);
    var totalCost = input.price + annualOp * input.years - residual;
    var ownHaYears = input.farmHa * input.passes * input.years;
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
    };
  }

  function calculateHire(hireRates, farmHa, passes) {
    if (!hireRates) return null;
    var plough = hireRates.tractor_ploughing_per_ha || 0;
    var harrow = hireRates.tractor_harrowing_per_ha || (plough * 0.72);
    var ridge = hireRates.tractor_ridging_per_ha || (plough * 0.80);
    var annual = 0;
    if (passes >= 1) annual += farmHa * plough;
    if (passes >= 2) annual += farmHa * harrow;
    if (passes >= 3) annual += farmHa * ridge;
    return {
      capitalRequired: 0,
      annualCost: annual,
      costPerHa: passes > 0 ? annual / farmHa : 0,
      availability: hireRates.availability || 'unknown',
      wait_time: hireRates.wait_time || '—',
      providers: hireRates.providers || '—',
      notes: hireRates.notes || '',
    };
  }

  function calculateLease(input) {
    var down = input.price * (input.downPct / 100);
    var principal = input.price - down;
    var months = input.term * 12;
    var monthlyRate = input.rate / 100 / 12;
    var monthly = monthlyRate === 0
      ? principal / months
      : principal * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);
    var totalPaid = monthly * months + down;
    var ownHaYears = input.farmHa * input.passes * input.years;
    return {
      capitalRequired: down,
      monthlyPayment: monthly,
      annualPayment: monthly * 12,
      totalCost: totalPaid,
      costPerHa: ownHaYears > 0 ? totalPaid / ownHaYears : 0,
      term: input.term,
      rate: input.rate,
    };
  }

  function breakEvenHa(buy, hire, years) {
    if (!hire || hire.costPerHa <= 0) return null;
    return (buy.totalCost / years) / hire.costPerHa;
  }

  function defaults(countryCode, equipmentKey, data) {
    var country = data && data.countries && data.countries[countryCode];
    var equipment = data && data.equipment && data.equipment[equipmentKey];
    var hire = data && data.hireRates && data.hireRates[countryCode];
    var finance = data && data.financing && data.financing[countryCode];
    if (!country) return { ok: false, status: 'unknown-country' };
    if (!equipment) return { ok: false, status: 'unknown-equipment' };
    var primary = finance && finance.options && finance.options[0];
    var secondary = finance && finance.options && finance.options[1];
    return {
      ok: true,
      status: 'ready',
      countryCode: countryCode,
      equipmentKey: equipmentKey,
      price: Math.round(equipment.purchasePrice_USD.typical * country.usdRate / 1000) * 1000,
      contractRate: hire ? (hire.tractor_ploughing_per_ha || 0) : 0,
      financeRate: secondary ? secondary.rate_pct : (primary ? primary.rate_pct : 12),
      financeTerm: secondary ? secondary.term_years : (primary ? primary.term_years : 5),
      financeOption: primary || null,
      currency: country.currency,
      symbol: country.symbol,
      equipmentExamples: equipment.examples,
    };
  }

  function calculate(input, data) {
    var country = data && data.countries && data.countries[input.countryCode];
    var equipment = data && data.equipment && data.equipment[input.equipmentKey];
    var hireRates = data && data.hireRates && data.hireRates[input.countryCode];
    if (!country) return { ok: false, status: 'unknown-country' };
    if (!equipment) return { ok: false, status: 'unknown-equipment' };
    var fields = ['price', 'farmHa', 'passes', 'years', 'contractHa', 'contractRate', 'rate', 'term', 'downPct'];
    if (fields.some(function (field) { return !Number.isFinite(input[field]); })) return { ok: false, status: 'invalid-input' };
    var buy = calculateBuy(input, equipment, hireRates);
    var hire = calculateHire(hireRates, input.farmHa, input.passes);
    var lease = input.financeType === 'lease' || input.financeType === 'loan' ? calculateLease(input) : null;
    var costs = { buy: buy.totalCost, hire: hire ? hire.annualCost * input.years : Infinity };
    if (lease) costs.lease = lease.totalCost;
    var winner = Object.keys(costs).reduce(function (left, right) { return costs[left] < costs[right] ? left : right; });
    var sorted = Object.keys(costs).sort(function (left, right) { return costs[left] - costs[right]; });
    var second = sorted[1];
    var savings = second && costs[second] !== Infinity ? costs[second] - costs[winner] : 0;
    var annualContractIncome = input.doContract ? input.contractHa * input.contractRate : 0;
    return {
      ok: true,
      status: 'calculated',
      input: Object.assign({}, input),
      country: Object.assign({ code: input.countryCode }, country),
      equipment: Object.assign({ key: input.equipmentKey }, equipment),
      hireRates: hireRates || null,
      financing: data.financing && data.financing[input.countryCode] || null,
      buy: buy,
      hire: hire,
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
