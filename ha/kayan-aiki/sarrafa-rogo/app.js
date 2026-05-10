(function () {
  'use strict';

  var COUNTRY_CODE = 'NG';
  var Eng = window.AfroTools && window.AfroTools.CassavaProcessingEngine;
  var data = window.AfroTools && window.AfroTools.cassavaProcessing;
  var PW_NAMES = {
    garri: 'Garri',
    fufu_flour: 'Fufu / cassava flour',
    hqcf: 'HQCF',
    cassava_chips: 'Cassava chips',
    cassava_starch: 'Cassava starch'
  };
  var PW_DESCS = {
    garri: '4.5 kg roots -> 1 kg garri. Shelf life: 6-12 months. Mafi familiar a Najeriya.',
    fufu_flour: '3.5 kg roots -> 1 kg flour. Fermented, dried, milled.',
    hqcf: '4 kg roots -> 1 kg flour. Premium industrial market, amma flash dryer da quality control suna da muhimmanci.',
    cassava_chips: '3 kg roots -> 1 kg chips. Hanya mafi sauki, yawanci sun-dried.',
    cassava_starch: '5.5 kg roots -> 1 kg starch. Higher value, amma water da capital requirements sun fi yawa.'
  };
  var PW_PRICE_DEFAULTS = {
    garri: 800,
    fufu_flour: 700,
    hqcf: 600,
    cassava_chips: 300,
    cassava_starch: 1200
  };
  var stepMap = {
    Peeling: 'Bare rogo',
    Washing: 'Wankewa',
    'Peeling & Washing': 'Barewa da wankewa',
    Grating: 'Niƙa / grating',
    'Grating / Chipping': 'Grating / chipping',
    'Fermentation (2–4 days)': 'Fermentation (kwana 2-4)',
    'Pressing / Dewatering': 'Matse ruwa',
    Sieving: 'Tacewa',
    'Frying / Roasting': 'Soyawa / roasting',
    'Cooling & Packaging': 'Sanyaya da packaging',
    'Soaking / Fermentation': 'Jiƙa / fermentation',
    'Sieving (remove fibre)': 'Tacewa',
    Dewatering: 'Cire ruwa',
    'Sun drying (2–3 days)': 'Busarwa a rana',
    Milling: 'Niƙa',
    Packaging: 'Packaging',
    'Drying (flash dryer)': 'Busarwa da flash dryer',
    'Milling & Sieving': 'Niƙa da tacewa',
    'Chipping / Slicing': 'Yanka chips',
    'Sun drying (2–4 days)': 'Busarwa a rana',
    'Starch extraction (water washing)': 'Fitar da starch da ruwa',
    'Settling / Sedimentation': 'Settling',
    Drying: 'Busarwa',
    'Milling & Packaging': 'Niƙa da packaging'
  };
  var levelLabels = {
    manual: 'Manual',
    semi_mechanized: 'Semi-mechanised',
    mechanized: 'Fully mechanised'
  };

  function $(id) { return document.getElementById(id); }
  function fmt(n, sym) {
    sym = sym || '₦';
    if (!isFinite(n)) return sym + '0';
    return sym + Math.round(n).toLocaleString('en-NG');
  }
  function pct(value, total) {
    return total ? Math.round(value / total * 100) + '%' : '';
  }

  function onPathwayChange() {
    var pathway = $('selPathway').value;
    var box = $('pathwayInfo');
    if (pathway === 'compare') {
      box.style.display = 'none';
      return;
    }
    box.style.display = 'block';
    box.textContent = PW_DESCS[pathway] || '';
    if (PW_PRICE_DEFAULTS[pathway]) $('inpSellPrice').value = PW_PRICE_DEFAULTS[pathway];
    $('priceHint').textContent = 'An saka typical Nigeria market price na ' + (PW_NAMES[pathway] || pathway) + '. Ka gyara da farashin kasuwarka.';
  }
  function onLevelChange() {}
  window.onPathwayChange = onPathwayChange;
  window.onLevelChange = onLevelChange;

  function row(label, amount, pctValue, cls) {
    return '<tr><td>' + label + '</td><td class="' + (cls || '') + '">' + amount + '</td><td>' + (pctValue || '') + '</td></tr>';
  }
  function section(label) {
    return '<tr><th colspan="3">' + label + '</th></tr>';
  }

  function renderSingle(result, batches) {
    var sym = result.sym;
    var hero = $('profitHeroCard');
    hero.className = 'ha-result-hero ' + (result.isProfit ? '' : 'warning');
    $('rNetProfit').textContent = fmt(result.profitPerBatch, sym);
    $('rProfitLabel').textContent = 'RIBAR NET PER BATCH - ' + (PW_NAMES[result.pathway] || result.pathway).toUpperCase();
    $('rProfitSub').textContent = 'A wata: ' + fmt(result.monthlyProfit, sym) + ' (' + batches + ' batches) | A shekara: ' + fmt(result.annualProfit, sym);
    var C = result.costs;
    document.querySelector('#summaryTable tbody').innerHTML =
      section('Kudin shiga') +
      row('Output: ' + result.outputKg.toLocaleString('en-NG') + ' kg na ' + (PW_NAMES[result.pathway] || result.pathway), fmt(result.revenue, sym), '100%', 'ha-positive') +
      section('Kudin sarrafawa') +
      row('Raw cassava (' + result.rawKg.toLocaleString('en-NG') + ' kg roots)', fmt(C.rawMaterial, sym), pct(C.rawMaterial, result.revenue)) +
      row('Labour', fmt(C.labor, sym), pct(C.labor, result.revenue)) +
      (C.fuel ? row('Fuel / energy', fmt(C.fuel, sym), pct(C.fuel, result.revenue)) : '') +
      (C.water ? row('Water', fmt(C.water, sym), pct(C.water, result.revenue)) : '') +
      row('Packaging', fmt(C.packaging, sym), pct(C.packaging, result.revenue)) +
      row('Equipment depreciation', fmt(C.equipment, sym), pct(C.equipment, result.revenue)) +
      (C.transport ? row('Transport', fmt(C.transport, sym), pct(C.transport, result.revenue)) : '') +
      '<tr class="ha-total-row"><td>Jimillar cost</td><td>' + fmt(C.total, sym) + '</td><td>' + pct(C.total, result.revenue) + '</td></tr>' +
      section('Riba') +
      row('Ribar net / asara', fmt(result.profitPerBatch, sym), result.profitMarginPct + '%', result.isProfit ? 'ha-positive' : 'ha-negative');

    var metrics = [
      { value: fmt(result.profitPerBatch, sym), label: 'Profit per batch' },
      { value: fmt(result.monthlyProfit, sym), label: 'Profit a wata' },
      { value: fmt(result.annualProfit, sym), label: 'Profit a shekara' },
      { value: result.roi + '%', label: 'ROI per batch' },
      { value: result.outputKg.toLocaleString('en-NG') + ' kg', label: 'Output na product' },
      { value: result.paybackMonths ? result.paybackMonths + ' months' : 'N/A', label: 'Payback na equipment' }
    ];
    $('metricsGrid').innerHTML = metrics.map(function (metric) {
      return '<div class="ha-metric"><div class="ha-metric-value">' + metric.value + '</div><div class="ha-metric-label">' + metric.label + '</div></div>';
    }).join('');
  }

  function renderCompare(results, batches) {
    $('compareTbody').innerHTML = results.map(function (result, index) {
      return '<tr><td>' + (index + 1) + '</td><td>' + (PW_NAMES[result.pathway] || result.pathway) + '</td><td>' + result.outputKg.toLocaleString('en-NG') + '</td><td>' + fmt(result.revenue, result.sym) + '</td><td>' + fmt(result.costs.total, result.sym) + '</td><td class="' + (result.isProfit ? 'ha-positive' : 'ha-negative') + '">' + fmt(result.profitPerBatch, result.sym) + '</td><td>' + result.profitMarginPct + '%</td><td>' + fmt(result.monthlyProfit, result.sym) + '</td></tr>';
    }).join('');
    var best = results[0];
    $('compareReco').textContent = 'Shawara: ' + (PW_NAMES[best.pathway] || best.pathway) + ' ya fi bada profit a wannan volume da processing level. Estimate na wata ya dogara da ' + batches + ' batches.';
  }

  function renderSteps(pathway) {
    if (!data || !data.pathways[pathway]) {
      $('stepsContent').innerHTML = '';
      return;
    }
    var steps = data.pathways[pathway].processingSteps || [];
    $('stepsContent').innerHTML = '<div class="ha-table-wrap"><table class="ha-table"><thead><tr><th>Mataki</th><th>Labour hrs/t roots</th><th>Note</th></tr></thead><tbody>' + steps.map(function (step) {
      return '<tr><td>' + (stepMap[step.step] || step.step) + '</td><td>' + step.hrs + '</td><td>' + (step.note || '') + '</td></tr>';
    }).join('') + '</tbody></table></div>';
  }

  function renderEquip(pathway, level, sym) {
    if (!data || !data.pathways[pathway]) {
      $('equipContent').innerHTML = '';
      return;
    }
    var equip = data.pathways[pathway].equipment || {};
    var levels = ['manual', 'semi_mechanized', 'mechanized'];
    $('equipContent').innerHTML = '<div class="ha-table-wrap"><table class="ha-table"><thead><tr><th>Mataki</th><th>Cost USD</th><th>Capacity kg/day</th><th>Equipment</th></tr></thead><tbody>' + levels.map(function (key) {
      var item = equip[key];
      if (!item) return '';
      return '<tr><td>' + levelLabels[key] + (key === level ? ' (selected)' : '') + '</td><td>$' + item.cost_usd.toLocaleString('en-NG') + '</td><td>' + item.capacity_kg_day.toLocaleString('en-NG') + '</td><td>' + (item.items || '') + '</td></tr>';
    }).join('') + '</tbody></table></div>';
  }

  window.calculate = function () {
    if (!Eng || !data) {
      alert('Data bai gama lodawa ba. Sake bude shafin.');
      return;
    }
    var pathway = $('selPathway').value;
    var rawTonnes = parseFloat($('inpRawTonnes').value) || 1;
    var batches = parseFloat($('selBatches').value) || 12;
    var level = $('selLevel').value;
    var rawPrice = parseFloat($('inpCassavaPrice').value) || 80000;
    var sellPrice = parseFloat($('inpSellPrice').value) || 0;
    var laborDay = parseFloat($('inpLaborDay').value) || 3000;
    var distanceKm = parseFloat($('inpDistanceKm').value) || 0;
    var original = data.countries[COUNTRY_CODE];
    var copy = Object.assign({}, original, { labor_per_day: laborDay });
    data.countries[COUNTRY_CODE] = copy;
    $('resultsPanel').classList.add('on');
    $('compareCard').style.display = 'none';
    $('profitHeroCard').style.display = 'block';
    $('summaryCard').style.display = 'block';
    $('metricsCard').style.display = 'block';
    $('stepsCard').style.display = 'block';
    $('equipCard').style.display = 'block';
    if (pathway === 'compare') {
      var results = Eng.compareAll({
        rawTonnes: rawTonnes,
        batchesPerMonth: batches,
        processingLevel: level,
        rawPricePerTonne: rawPrice,
        includeTransport: distanceKm > 0,
        distanceKm: distanceKm
      }, COUNTRY_CODE);
      data.countries[COUNTRY_CODE] = original;
      if (!results.length) {
        alert('Ba a samu pathway data ba.');
        return;
      }
      $('profitHeroCard').style.display = 'none';
      $('summaryCard').style.display = 'none';
      $('metricsCard').style.display = 'none';
      $('stepsCard').style.display = 'none';
      $('equipCard').style.display = 'none';
      $('compareCard').style.display = 'block';
      renderCompare(results, batches);
    } else {
      var result = Eng.calculate({
        pathwayId: pathway,
        rawTonnes: rawTonnes,
        batchesPerMonth: batches,
        processingLevel: level,
        rawPricePerTonne: rawPrice,
        sellingPricePerKg: sellPrice,
        includeTransport: distanceKm > 0,
        distanceKm: distanceKm
      }, COUNTRY_CODE);
      data.countries[COUNTRY_CODE] = original;
      if (result.error) {
        alert('Ba a iya lissafi ba: ' + result.message);
        return;
      }
      renderSingle(result, batches);
      renderSteps(pathway);
      renderEquip(pathway, level, result.sym);
    }
    $('resultsPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  window.addEventListener('DOMContentLoaded', function () {
    $('selPathway').value = 'garri';
    onPathwayChange();
    if (data && data.countries && data.countries.NG) {
      $('inpCassavaPrice').value = data.countries.NG.fresh_cassava_per_tonne || 80000;
      $('inpLaborDay').value = data.countries.NG.labor_per_day || 3000;
    }
  });
})();
