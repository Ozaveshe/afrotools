/* AfroTools — Landed Cost Engine /engines/landed-cost-engine.js */
var LandedCostEngine = (function() {
  'use strict';

  function calculate(params) {
    // params: { fobUSD, freightUSD, insuranceUSD, destCountry, dutyRate, quantity, containerType, portCode, brokerFeeLocal, handlingLocal, haulageLocal, fxRate }
    var country = LANDED_COST_DATA[params.destCountry];
    if (!country) return null;

    var fob = parseFloat(params.fobUSD) || 0;
    var freight = parseFloat(params.freightUSD) || 0;
    var insurance = parseFloat(params.insuranceUSD) || (fob * 0.005); // default 0.5%
    var dutyRate = parseFloat(params.dutyRate) || 0;
    var qty = parseInt(params.quantity) || 1;
    var fxRate = parseFloat(params.fxRate) || 1;

    // Step 1: CIF
    var cif = fob + freight + insurance;

    // Step 2: Import Duty
    var importDuty = cif * (dutyRate / 100);

    // Step 3: Additional Levies
    var totalLevies = 0;
    var levyBreakdown = [];
    var ds = country.dutyStructure;
    (ds.levies || []).forEach(function(levy) {
      var base;
      if (levy.base === 'FOB') base = fob;
      else if (levy.base === 'CIF') base = cif;
      else if (levy.base === 'CIF+duty') base = cif + importDuty;
      else if (levy.base === 'duty') base = importDuty;
      else base = cif;
      var amount = base * (levy.rate / 100);
      totalLevies += amount;
      levyBreakdown.push({ name: levy.name, rate: levy.rate, base: levy.base, description: levy.description || '', amountUSD: amount });
    });

    // Step 4: VAT
    var vatBase = cif + importDuty + totalLevies;
    var vat = vatBase * (ds.vatRate / 100);

    // Step 5: Total customs cost (USD)
    var totalCustomsUSD = importDuty + totalLevies + vat;
    var totalDutyInclusiveUSD = cif + totalCustomsUSD;

    // Step 6: Local port / clearing charges (converted from local to USD)
    var brokerFeeUSD = (parseFloat(params.brokerFeeLocal) || 0) / fxRate;
    var handlingUSD = (parseFloat(params.handlingLocal) || 0) / fxRate;
    var haulageUSD = (parseFloat(params.haulageLocal) || 0) / fxRate;
    var localChargesUSD = brokerFeeUSD + handlingUSD + haulageUSD;

    // Step 7: Grand total
    var totalLandedUSD = totalDutyInclusiveUSD + localChargesUSD;
    var totalLandedLocal = totalLandedUSD * fxRate;

    // Effective rates
    var effectiveTaxRate = cif > 0 ? ((totalCustomsUSD / cif) * 100).toFixed(1) : '0';
    var perUnitUSD = qty > 0 ? (totalLandedUSD / qty) : totalLandedUSD;
    var perUnitLocal = perUnitUSD * fxRate;

    return {
      // Inputs
      fobUSD: fob, freightUSD: freight, insuranceUSD: insurance, cifUSD: cif,
      dutyRate: dutyRate, fxRate: fxRate, qty: qty,
      // Customs
      importDutyUSD: importDuty,
      levyBreakdown: levyBreakdown,
      totalLeviesUSD: totalLevies,
      vatRate: ds.vatRate, vatUSD: vat, vatBase: vatBase,
      totalCustomsUSD: totalCustomsUSD,
      // Local charges
      brokerFeeUSD: brokerFeeUSD, handlingUSD: handlingUSD, haulageUSD: haulageUSD,
      localChargesUSD: localChargesUSD,
      // Totals
      totalLandedUSD: totalLandedUSD,
      totalLandedLocal: totalLandedLocal,
      currency: country.currency, symbol: country.symbol || '',
      effectiveTaxRate: effectiveTaxRate,
      perUnitUSD: perUnitUSD, perUnitLocal: perUnitLocal,
      // Markup / P&L helpers
      getMarginAnalysis: function(sellPriceLocal) {
        var sp = parseFloat(sellPriceLocal) || 0;
        var profit = sp - perUnitLocal;
        var margin = sp > 0 ? ((profit / sp) * 100).toFixed(1) : 0;
        var markup = perUnitLocal > 0 ? ((profit / perUnitLocal) * 100).toFixed(1) : 0;
        var breakeven = perUnitLocal;
        return { sellPrice: sp, costPerUnit: perUnitLocal, profit: profit, margin: margin, markup: markup, breakeven: breakeven };
      }
    };
  }

  function getCountryPorts(countryCode) {
    var c = LANDED_COST_DATA[countryCode];
    return c ? c.ports : [];
  }

  function getDefaultBrokerFee(countryCode) {
    var c = LANDED_COST_DATA[countryCode];
    return c && c.customsBrokerFee ? c.customsBrokerFee.min : 0;
  }

  function getAllCountries() {
    return Object.keys(LANDED_COST_DATA).map(function(k) {
      return { code: k, name: LANDED_COST_DATA[k].name, flag: LANDED_COST_DATA[k].flag, currency: LANDED_COST_DATA[k].currency };
    });
  }

  return { calculate: calculate, getCountryPorts: getCountryPorts, getDefaultBrokerFee: getDefaultBrokerFee, getAllCountries: getAllCountries };
})();
