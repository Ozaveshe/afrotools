(function initFrenchMiningParityEngine(root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.AfroToolsMiningPlanners = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function createFrenchMiningParityEngine() {
  'use strict';

  function invalid(field, code) {
    return { ok: false, field: field, code: code };
  }

  function finiteNumber(value) {
    if (value === null || value === undefined || value === '') return null;
    var number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function diamond(input) {
    var carat = finiteNumber(input.carat);
    var base = finiteNumber(input.base);
    var cut = finiteNumber(input.cut);
    var color = finiteNumber(input.color);
    var clarity = finiteNumber(input.clarity);
    var pWhole = finiteNumber(input.pWhole);
    var pIns = finiteNumber(input.pIns);
    var pResale = finiteNumber(input.pResale);
    if (!(carat > 0)) return invalid('carat', 'positive');
    if (!(base > 0)) return invalid('base', 'source_price');
    if ([cut, color, clarity, pWhole, pIns, pResale].some(function (value) { return value === null; })) {
      return invalid('pWhole', 'numeric');
    }
    var qualityFactor = cut * color * clarity;
    var retail = carat * base * qualityFactor;
    return {
      ok: true,
      qualityFactor: qualityFactor,
      baseValue: carat * base,
      retail: retail,
      wholesale: retail * pWhole / 100,
      insurance: retail * pIns / 100,
      resale: retail * pResale / 100
    };
  }

  function oilWell(input) {
    var fields = ['k', 'h', 'pe', 'pwf', 'mu', 'bo', 're', 'rw', 'skin', 'uptime', 'price', 'opex', 'roy'];
    var values = {};
    fields.forEach(function (field) { values[field] = finiteNumber(input[field]); });
    for (var i = 0; i < ['k', 'h', 'mu', 'bo', 're', 'rw'].length; i += 1) {
      var positiveField = ['k', 'h', 'mu', 'bo', 're', 'rw'][i];
      if (!(values[positiveField] > 0)) return invalid(positiveField, 'positive');
    }
    if (values.pe === null || values.pwf === null) return invalid('pe', 'pressures');
    if (values.pe <= values.pwf) return invalid('pe', 'pressure_order');
    if (values.re <= values.rw) return invalid('re', 'radius_order');
    if (!(values.price > 0)) return invalid('price', 'source_price');
    if (values.opex === null || values.opex < 0) return invalid('opex', 'non_negative');
    if (values.roy === null || values.roy < 0 || values.roy > 100) return invalid('roy', 'percentage');
    if (values.uptime === null || values.uptime <= 0 || values.uptime > 100) return invalid('uptime', 'uptime');
    var q = (0.00708 * values.k * values.h * (values.pe - values.pwf))
      / (values.mu * values.bo * (Math.log(values.re / values.rw) + values.skin));
    if (!(q > 0) || !Number.isFinite(q)) return invalid('skin', 'non_positive_flow');
    var annual = q * 365 * (values.uptime / 100);
    var gross = annual * values.price;
    var royalty = gross * values.roy / 100;
    var operating = annual * values.opex;
    return {
      ok: true,
      q: q,
      annual: annual,
      gross: gross,
      royalty: royalty,
      operating: operating,
      net: gross - royalty - operating
    };
  }

  function oilGas(input) {
    var vol = finiteNumber(input.vol);
    var price = finiteNumber(input.price);
    var directGross = finiteNumber(input.gross);
    var royaltyRate = finiteNumber(input.roy);
    var costs = finiteNumber(input.costs);
    var ceiling = finiteNumber(input.ceiling);
    var contractorShare = finiteNumber(input.conshare);
    var tax = finiteNumber(input.tax);
    var gross = directGross !== null && directGross > 0
      ? directGross
      : (vol > 0 && price > 0 ? vol * price : null);
    if (!(gross > 0)) return invalid('gross', 'gross_or_volume_price');
    if (royaltyRate === null || royaltyRate < 0 || royaltyRate > 100) return invalid('roy', 'percentage');
    if (costs === null || costs < 0) return invalid('costs', 'non_negative');
    if (ceiling === null || ceiling < 0 || ceiling > 100) return invalid('ceiling', 'percentage');
    if (contractorShare === null || contractorShare < 0 || contractorShare > 100) return invalid('conshare', 'percentage');
    if (tax === null || tax < 0 || tax > 100) return invalid('tax', 'percentage');
    var royalty = gross * royaltyRate / 100;
    var afterRoyalty = gross - royalty;
    var costOil = Math.min(costs, afterRoyalty * ceiling / 100);
    var unrecovered = costs - costOil;
    var profitOil = afterRoyalty - costOil;
    var contractorProfit = profitOil * contractorShare / 100;
    var governmentProfit = profitOil - contractorProfit;
    var taxAmount = contractorProfit * tax / 100;
    var contractorNet = costOil + contractorProfit - costs - taxAmount;
    var governmentTake = royalty + governmentProfit + taxAmount;
    return {
      ok: true,
      gross: gross,
      royalty: royalty,
      afterRoyalty: afterRoyalty,
      costOil: costOil,
      unrecovered: unrecovered,
      profitOil: profitOil,
      contractorProfit: contractorProfit,
      governmentProfit: governmentProfit,
      taxAmount: taxAmount,
      contractorNet: contractorNet,
      governmentTake: governmentTake,
      governmentPct: governmentTake / gross * 100
    };
  }

  function licence(input, country, licenceRecord) {
    if (!country || !licenceRecord) return invalid('country', 'selection');
    var years = finiteNumber(input.years);
    var oneOff = finiteNumber(input.oneOff);
    var annual = finiteNumber(input.annual);
    var area = finiteNumber(input.area);
    var areaUnits = { perKm2: true, perHa: true, perCadastralUnit: true };
    var basis = licenceRecord.annualBasis || null;
    var areaBased = !!areaUnits[basis];
    if (!(years >= 1)) return invalid('years', 'years');
    years = Math.floor(years);
    if (oneOff === null) return invalid('oneOff', 'missing_fee');
    if (oneOff < 0) return invalid('oneOff', 'non_negative');
    if (annual === null) return invalid('annual', 'missing_fee');
    if (annual < 0) return invalid('annual', 'non_negative');
    if (areaBased && !(area > 0)) return invalid('area', 'area');
    var oneOffTotal = oneOff;
    if (areaUnits[licenceRecord.oneOffBasis] && area > 0) oneOffTotal = oneOff * area;
    var annualRaw = areaBased ? annual * area : annual;
    var annualComputed = annualRaw;
    var floored = false;
    if (typeof licenceRecord.minAnnual === 'number' && annualComputed < licenceRecord.minAnnual) {
      annualComputed = licenceRecord.minAnnual;
      floored = true;
    }
    return {
      ok: true,
      years: years,
      area: area,
      basis: basis,
      areaBased: areaBased,
      oneOffTotal: oneOffTotal,
      annualRaw: annualRaw,
      annualComputed: annualComputed,
      floored: floored,
      total: oneOffTotal + annualComputed * years,
      symbol: country.symbol || ''
    };
  }

  function royalty(input, country) {
    if (!country) return invalid('country', 'selection');
    var gross = finiteNumber(input.gross);
    var rate = finiteNumber(input.rate);
    if (!(gross > 0)) return invalid('gross', 'positive');
    if (!(rate > 0)) return invalid('rate', 'missing_rate');
    if (rate > 100) return invalid('rate', 'percentage');
    var royaltyAmount = gross * rate / 100;
    var extraLevy = typeof country.extraLevyPct === 'number' && country.extraLevyPct > 0
      ? gross * country.extraLevyPct / 100
      : 0;
    return {
      ok: true,
      gross: gross,
      rate: rate,
      royalty: royaltyAmount,
      extraLevy: extraLevy,
      net: gross - royaltyAmount - extraLevy,
      symbol: country.symbol || ''
    };
  }

  function artisanal(input) {
    var qty = finiteNumber(input.qty);
    var formal = finiteNumber(input.formal);
    var informalPct = finiteNumber(input.informalPct);
    var costs = finiteNumber(input.costs);
    var team = finiteNumber(input.team);
    if (!(qty > 0)) return invalid('qty', 'positive');
    if (!(formal > 0)) return invalid('formal', 'source_price');
    if (informalPct === null || informalPct < 0 || informalPct > 100) return invalid('informalPct', 'percentage');
    if (costs === null || costs < 0) return invalid('costs', 'non_negative');
    if (!(team >= 1)) return invalid('team', 'team');
    team = Math.floor(team);
    var formalGross = qty * formal;
    var informalGross = qty * formal * (informalPct / 100);
    var gap = formalGross - informalGross;
    var netTotal = formalGross - costs;
    var netPerMiner = netTotal / team;
    return {
      ok: true,
      formalGross: formalGross,
      informalGross: informalGross,
      gap: gap,
      netTotal: netTotal,
      team: team,
      netPerMiner: netPerMiner,
      annualPerMiner: netPerMiner * 12
    };
  }

  return Object.freeze({
    diamond: diamond,
    oilWell: oilWell,
    oilGas: oilGas,
    licence: licence,
    royalty: royalty,
    artisanal: artisanal
  });
});
