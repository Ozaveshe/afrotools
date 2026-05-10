(function () {
  'use strict';

  var CD = window.AfroTools && window.AfroTools.countryData;
  var FC_ALL = window.AfroTools && window.AfroTools.farmCosts;
  var FC = FC_ALL ? FC_ALL.NG : null;
  var ENG = window.AfroTools && window.AfroTools.FarmProfitEngine;
  var costLabels = {
    seeds: 'Iri',
    fertilizer: 'Taki',
    agrochemicals: 'Agrochemicals',
    labor: 'Aiki / labour',
    land: 'Fili',
    mechanization: 'Mechanization',
    irrigation: 'Ban ruwa',
    transport: 'Sufuri',
    marketingFees: 'Kudin kasuwa',
    middleman: 'Dan tsakani',
    storage: 'Ajiya',
    finance: 'Ribar loan',
    insurance: 'Insurance'
  };
  var scenarioLabels = {
    yieldUp25: 'Yield +25%',
    priceUp20: 'Farashi +20%',
    phLossHalved: 'Post-harvest loss ya ragu rabi',
    familyLabor100: '100% family labour',
    processBeforeSelling: 'Sarrafa kafin sayarwa'
  };

  function $(id) { return document.getElementById(id); }
  function fmtN(n, dec) {
    if (typeof n !== 'number' || isNaN(n)) return '0';
    return n.toLocaleString('en-NG', { maximumFractionDigits: dec !== undefined ? dec : 0 });
  }
  function fmtC(n) { return (CD.currencySymbol || '') + fmtN(n); }
  function fmtPct(n) { return (Math.round(n * 10) / 10) + '%'; }
  function cropName(c) { return c.name + (c.localNames && c.localNames.length ? ' (' + c.localNames[0] + ')' : ''); }

  window.updateLandFields = function () {
    var type = $('selLandType').value;
    $('landRentField').style.display = type === 'rented' || type === 'owned' ? 'block' : 'none';
    if (FC && FC.landCost && (type === 'rented' || type === 'owned')) {
      $('inpLandRent').value = FC.landCost.rental_perHa_perSeason || 0;
    }
  };
  window.updateMechFields = function () {
    var type = $('selMechType').value;
    $('tractorCostField').style.display = type === 'tractor' || type === 'animal' ? 'block' : 'none';
    if (FC && FC.mechanization && type === 'tractor') {
      $('inpTractorCost').value = FC.mechanization.tractorPloughing_perHa || 0;
    }
  };

  function init() {
    if (!CD || !FC || !ENG) {
      window.calculate = function () { alert('Data bai gama lodawa ba. Sake bude shafin.'); };
      return;
    }
    CD.crops.forEach(function (crop) {
      var option = document.createElement('option');
      option.value = crop.id;
      option.textContent = cropName(crop);
      $('selCrop').appendChild(option);
    });
    CD.regions.forEach(function (region) {
      var option = document.createElement('option');
      option.value = region.id;
      option.textContent = region.name;
      $('selRegion').appendChild(option);
    });
    var firstCrop = CD.crops[0];
    if (firstCrop) {
      $('inpYield').value = firstCrop.baseYieldPerHa || 1;
      $('inpPrice').value = firstCrop.localMarketPrice || 0;
    }
    $('inpFarm').value = CD.agriStats.avgFarmSizeHa || 1;
    $('inpManDays').value = FC.labor ? FC.labor.manDaysPerHa_simplified || 100 : 100;
    $('inpDailyWage').value = FC.labor ? FC.labor.dailyWageRate || 0 : 0;
    $('inpHerbicide').value = FC.agrochemicals ? FC.agrochemicals.herbicide_perHa || 0 : 0;
    $('inpPesticide').value = FC.agrochemicals ? FC.agrochemicals.pesticide_perHa || 0 : 0;
    $('inpTransportRate').value = FC.transport ? FC.transport.farmToMarket_perTonne_perKm || 0 : 0;
    $('inpMarketFees').value = FC.transport ? FC.transport.marketFees_percentOfSale || 3 : 3;
    $('inpLoanRate').value = FC.finance ? (FC.finance.govSchemeRate_percent || FC.finance.averageInterestRate_percent || 0) : 0;
    $('inpStorageCost').value = FC.storage && FC.storage.perTonne_perMonth ? FC.storage.perTonne_perMonth : 0;
    var phMap = { cereals: 'cereals', roots_tubers: 'roots_tubers', fruits_vegetables: 'fruits_vegetables', legumes: 'pulses', pulses: 'pulses', cash_crops: 'cereals' };
    var firstKey = phMap[firstCrop ? firstCrop.category : 'cereals'] || 'cereals';
    $('inpPhLoss').value = FC.storage && FC.storage.postHarvestLossRate ? FC.storage.postHarvestLossRate[firstKey] || 0 : 0;

    $('selCrop').addEventListener('change', function () {
      var crop = CD.crops.find(function (c) { return c.id === $('selCrop').value; });
      if (!crop) return;
      $('inpYield').value = crop.baseYieldPerHa || 1;
      $('inpPrice').value = crop.localMarketPrice || 0;
      var key = phMap[crop.category] || 'cereals';
      if (FC.storage && FC.storage.postHarvestLossRate) $('inpPhLoss').value = FC.storage.postHarvestLossRate[key] || 0;
    });
    $('selSelling').addEventListener('change', function () {
      $('exportPriceField').style.display = this.value === 'export' ? 'block' : 'none';
    });

    var stats = CD.agriStats;
    $('statsBar').innerHTML = [
      'Noma: ' + stats.gdpSharePercent + '% GDP',
      stats.laborForcePercent + '% workforce',
      fmtN(stats.arableLandHectares / 1000000, 1) + 'M ha arable'
    ].map(function (text) { return '<span class="ha-pill">' + text + '</span>'; }).join('');
    $('countryInfo').textContent = 'Nigeria source data ta nuna average farm size kusan ' + (stats.avgFarmSizeHa || 1) + ' ha, daily farm labour wage ' + fmtC(FC.labor ? FC.labor.dailyWageRate : 0) + ', da manyan food crops kamar ' + (stats.mainFoodCrops || []).slice(0, 5).join(', ') + '.';
  }

  function addRow(tbody, label, amount, pct, cls) {
    var tr = document.createElement('tr');
    tr.innerHTML = '<td>' + label + '</td><td class="' + (cls || '') + '">' + fmtC(amount) + '</td><td>' + (pct || '') + '</td>';
    tbody.appendChild(tr);
  }
  function addSection(tbody, label) {
    var tr = document.createElement('tr');
    tr.innerHTML = '<th colspan="3">' + label + '</th>';
    tbody.appendChild(tr);
  }
  function addTotal(tbody, label, amount, cls) {
    var tr = document.createElement('tr');
    tr.className = 'ha-total-row';
    tr.innerHTML = '<td>' + label + '</td><td class="' + (cls || '') + '">' + fmtC(amount) + '</td><td></td>';
    tbody.appendChild(tr);
  }

  window.calculate = function () {
    if (!ENG || !CD || !FC) {
      alert('Data bai gama lodawa ba. Sake bude shafin.');
      return;
    }
    var inputs = {
      cropId: $('selCrop').value,
      regionId: $('selRegion').value,
      farmSizeHa: parseFloat($('inpFarm').value) || 1,
      yieldPerHa: parseFloat($('inpYield').value) || 1,
      marketPricePerTonne: parseFloat($('inpPrice').value) || 0,
      sellingMethod: $('selSelling').value,
      exportPricePerTonne: parseFloat($('inpExportPrice').value) || 0,
      seedCost: parseFloat($('inpSeedCost').value) || 0,
      fertilizerCost: parseFloat($('inpFertilizerCost').value) || 0,
      herbicideCostPerHa: parseFloat($('inpHerbicide').value) || 0,
      pesticideCostPerHa: parseFloat($('inpPesticide').value) || 0,
      fungicideCostPerHa: 0,
      laborMode: 'simplified',
      laborManDaysPerHa: parseFloat($('inpManDays').value) || 100,
      laborDailyWage: parseFloat($('inpDailyWage').value) || 0,
      familyLaborPct: parseFloat($('rangeFamily').value) || 0,
      landType: $('selLandType').value,
      landRentPerHa: parseFloat($('inpLandRent').value) || 0,
      mechanizationType: $('selMechType').value,
      tractorCostPerHa: parseFloat($('inpTractorCost').value) || 0,
      irrigationCost: parseFloat($('inpIrrigationCost').value) || 0,
      distanceToMarket: parseFloat($('inpDistance').value) || 20,
      transportCostPerTonneKm: parseFloat($('inpTransportRate').value) || 0,
      marketFeesPct: parseFloat($('inpMarketFees').value) || 0,
      throughMiddleman: parseFloat($('inpMiddleman').value) > 0,
      middlemanCommissionPct: parseFloat($('inpMiddleman').value) || 0,
      storageMonths: parseFloat($('inpStorageMonths').value) || 0,
      storageCostPerTonneMonth: parseFloat($('inpStorageCost').value) || 0,
      loanAmount: parseFloat($('inpLoanAmount').value) || 0,
      loanInterestPct: parseFloat($('inpLoanRate').value) || 0,
      insurancePremiumPct: 0,
      postHarvestLossPct: parseFloat($('inpPhLoss').value) || 0
    };
    var result = ENG.calculate(inputs, CD, FC);
    if (result.error) {
      alert('Ba a iya lissafi ba. Duba data da ka shigar.');
      return;
    }
    $('resultsPanel').classList.add('on');
    $('resultsPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
    var hero = $('profitHero');
    hero.className = 'ha-result-hero ' + (result.isProfitable ? '' : 'warning');
    $('rNetProfit').textContent = fmtC(Math.abs(result.netProfit));
    $('rProfitLabel').textContent = result.isProfitable ? 'RIBAR NET' : 'ASARAR NET';
    $('rProfitSub').textContent = 'A hectare: ' + fmtC(Math.abs(result.profitPerHa)) + ' | ROI: ' + fmtPct(result.roi) + ' | Margin: ' + fmtPct(result.profitMargin);

    var tbody = document.querySelector('#summaryTable tbody');
    tbody.innerHTML = '';
    addSection(tbody, 'Kudin shiga');
    addRow(tbody, 'Kudin shiga gaba daya', result.grossRevenue, '', 'ha-positive');
    if (result.postHarvestLossPct > 0) addRow(tbody, 'Asarar bayan girbi (' + result.postHarvestLossPct + '%)', -result.postHarvestLossAmount, '', 'ha-negative');
    addTotal(tbody, 'Kudin shiga bayan asara', result.netRevenue, 'ha-positive');
    addSection(tbody, 'Kudade');
    Object.keys(costLabels).forEach(function (key) {
      var value = result.costs[key] || 0;
      if (value > 0) addRow(tbody, costLabels[key], value, result.costPcts[key] > 0 ? fmtPct(result.costPcts[key]) : '');
      if (key === 'labor' && result.costs.laborBreakdown) {
        if (result.costs.laborBreakdown.hired > 0) addRow(tbody, 'Maikata da aka biya', result.costs.laborBreakdown.hired, '');
        if (result.costs.laborBreakdown.family > 0) addRow(tbody, 'Kudin aikin yan gida', result.costs.laborBreakdown.family, '');
      }
    });
    addTotal(tbody, 'Jimillar kudade', result.totalCost, 'ha-negative');
    addTotal(tbody, result.isProfitable ? 'Ribar net' : 'Asarar net', result.netProfit, result.isProfitable ? 'ha-positive' : 'ha-negative');

    var metrics = [
      { value: fmtC(result.costOfProductionPerTonne), label: 'Kudin samarwa per tonne' },
      { value: fmtN(result.breakEvenYieldPerHa, 2) + ' t/ha', label: 'Break-even yield' },
      { value: fmtC(result.breakEvenPrice), label: 'Break-even price per tonne' },
      { value: fmtPct(result.roi), label: 'ROI' },
      { value: fmtPct(result.profitMargin), label: 'Margin na riba' },
      { value: fmtC(result.revenuePerHa), label: 'Kudin shiga per hectare' }
    ];
    $('metricsGrid').innerHTML = metrics.map(function (metric) {
      return '<div class="ha-metric"><div class="ha-metric-value">' + metric.value + '</div><div class="ha-metric-label">' + metric.label + '</div></div>';
    }).join('');

    $('scenarioGrid').innerHTML = Object.keys(result.scenarios).map(function (key) {
      var item = result.scenarios[key];
      var label = scenarioLabels[key] || item.label;
      var cls = item.netProfit >= 0 ? 'ha-positive' : 'ha-negative';
      var change = (item.change >= 0 ? '+' : '') + fmtC(item.change) + ' idan aka kwatanta da baseline';
      return '<div class="ha-agri-card"><small>Scenario</small><h3>' + label + '</h3><p class="' + cls + '">' + fmtC(item.netProfit) + '</p><p>' + change + '</p></div>';
    }).join('');
  };

  init();
})();
