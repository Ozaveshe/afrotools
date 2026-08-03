(function initializeSwahiliSeedRate() {
  'use strict';

  var config = window.__SW_AGRI_PAGE__;
  var afroTools = window.AfroTools || {};
  var data = afroTools.countryData;
  var seedData = afroTools.seedData;
  var engine = afroTools.SeedRateEngine;
  var latest = null;

  function byId(id) { return document.getElementById(id); }
  function option(value, label) {
    var node = document.createElement('option');
    node.value = value;
    node.textContent = label;
    return node;
  }
  function number(value) {
    return new Intl.NumberFormat(config.locale, { maximumFractionDigits: 1 }).format(Number(value) || 0);
  }
  function money(value) {
    return new Intl.NumberFormat(config.locale, {
      style: 'currency', currency: data.currency, maximumFractionDigits: 0
    }).format(Number(value) || 0);
  }
  function cropName(value, fallback) { return config.cropNames[value] || fallback || value; }
  function status(message, error) {
    byId('actionStatus').textContent = message;
    byId('actionStatus').style.color = error ? 'var(--agri-danger)' : 'var(--agri-good)';
  }
  function setActions(enabled) {
    document.querySelectorAll('[data-result-action]').forEach(function (button) {
      button.disabled = !enabled;
    });
  }
  function clearResult(message) {
    latest = null;
    if (window.__SW_AGRI_TEST__) window.__SW_AGRI_TEST__.latest = null;
    byId('resultPanel').hidden = true;
    byId('emptyState').hidden = false;
    setActions(false);
    if (message) status(message, true);
  }
  function download(content, type, filename) {
    var url = URL.createObjectURL(new Blob([content], { type: type }));
    var anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 0);
  }
  function csvCell(value) {
    var text = String(value == null ? '' : value);
    return /[",\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
  }
  function refreshCropDefaults() {
    var crop = seedData[byId('crop').value] || {};
    var override = crop.countryOverrides && crop.countryOverrides[config.countryCode] || {};
    var spacing = override.spacing || crop.defaultSpacing || {};
    byId('method').innerHTML = '';
    (crop.plantingMethod || ['drilling']).forEach(function (method) {
      byId('method').appendChild(option(method, config.methods[method] || 'Njia iliyodumishwa'));
    });
    if (override.method) byId('method').value = override.method;
    byId('rowSpacing').value = spacing.row_cm || 100;
    byId('plantSpacing').value = spacing.plant_cm === 'continuous' ? 10 : spacing.plant_cm || 100;
    byId('seedsPerHole').value = override.seedsPerHole || crop.seedsPerHole || 1;
  }
  function initialize() {
    if (!config || !data || !seedData || !engine) throw new Error('Injini au data ya mbegu haipatikani.');
    data.crops.filter(function (crop) { return seedData[crop.id]; }).forEach(function (crop) {
      byId('crop').appendChild(option(crop.id, cropName(crop.id, crop.name)));
    });
    if (!byId('crop').options.length) throw new Error('Hakuna zao lenye mbinu ya mbegu kwa nchi hii.');
    byId('farmSize').value = data.agriStats.avgFarmSizeHa || 1;
    byId('quality').value = 'improved';
    byId('conditions').value = 'average';
    byId('intercrop').value = 'sole';
    refreshCropDefaults();
    setActions(false);
  }
  function input() {
    return {
      cropId: byId('crop').value,
      farmSizeHa: Number(byId('farmSize').value),
      seedQuality: byId('quality').value,
      fieldConditions: byId('conditions').value,
      intercrop: byId('intercrop').value,
      plantingMethod: byId('method').value,
      rowSpacing_cm: Number(byId('rowSpacing').value),
      plantSpacing_cm: Number(byId('plantSpacing').value),
      seedsPerHole: Number(byId('seedsPerHole').value)
    };
  }
  function validate(values) {
    var checks = [
      ['farmSizeHa', 'farmSize', 0.1, 'Weka ukubwa wa shamba wa angalau hekta 0.1.'],
      ['rowSpacing_cm', 'rowSpacing', 1, 'Nafasi kati ya mistari lazima iwe angalau sentimita 1.'],
      ['plantSpacing_cm', 'plantSpacing', 1, 'Nafasi kati ya mimea lazima iwe angalau sentimita 1.'],
      ['seedsPerHole', 'seedsPerHole', 1, 'Mbegu kwa shimo lazima iwe namba nzima ya angalau 1.']
    ];
    for (var index = 0; index < checks.length; index += 1) {
      var check = checks[index];
      var value = values[check[0]];
      var integerInvalid = check[0] === 'seedsPerHole' && !Number.isInteger(value);
      if (!Number.isFinite(value) || value < check[2] || integerInvalid) {
        byId('formError').textContent = check[3];
        clearResult();
        byId(check[1]).focus();
        return false;
      }
    }
    return true;
  }
  function displayResult() {
    if (!latest) return null;
    var result = latest.result;
    var vegetativeWeight = result.materialWeight || null;
    var quantity = result.propagation === 'seed'
      ? result.totalSeedKg
      : vegetativeWeight ? vegetativeWeight.total : result.totalPlants;
    var unit = result.propagation === 'seed'
      ? 'kg'
      : vegetativeWeight ? vegetativeWeight.unit : result.materialLabel || 'vipando';
    var perHa = result.propagation === 'seed'
      ? result.seedRateKgHa
      : vegetativeWeight ? vegetativeWeight.perHa : result.plantsPerHa;
    return {
      crop: cropName(latest.input.cropId), propagation: result.propagation,
      farmSizeHa: result.farmSizeHa, quantity: quantity, unit: unit,
      perHa: perHa, population: result.totalPlants || result.targetPopHa && Math.round(result.targetPopHa * result.farmSizeHa) || null,
      bags: result.numBags == null ? null : result.numBags,
      certifiedCost: result.costCertified == null ? null : result.costCertified,
      currency: result.currency || data.currency
    };
  }
  function report() {
    return latest ? {
      schemaVersion: 1,
      tool: 'seed-rate-calculator',
      language: 'sw',
      country: { code: config.countryCode, name: config.countryName },
      inputs: latest.input,
      result: latest.result,
      display: displayResult(),
      sources: { label: config.sourceLabel, reviewed: config.dataReviewed, live: false },
      confidence: 'planning-estimate',
      assumptions: ['Ubora wa mbegu', 'hali ya shamba', 'mchanganyiko wa mazao', 'nafasi ya kupanda', 'kipimo cha kifurushi kilichodumishwa'],
      privacy: { localOnly: true, sentToServer: false, sentToAI: false },
      ai: { route: config.ai.route, optional: true, modelConsentHandledOnSeparatePage: true }
    } : null;
  }
  function text() {
    var result = displayResult();
    if (!result) return '';
    return [
      'AfroTools - makadirio ya kiwango cha mbegu',
      'Nchi: ' + config.countryName + ' (' + config.countryCode + ')',
      'Zao: ' + result.crop,
      'Ukubwa wa shamba: ' + number(result.farmSizeHa) + ' ha',
      'Kiasi cha jumla: ' + number(result.quantity) + ' ' + result.unit,
      'Kiasi kwa hekta: ' + number(result.perHa) + ' ' + result.unit + '/ha',
      'Mifuko yenye kipimo: ' + (result.bags == null ? 'Haijaonyeshwa' : result.bags),
      'Gharama elekezi: ' + (result.certifiedCost == null ? 'Haijaonyeshwa' : money(result.certifiedCost)),
      '',
      'Vyanzo: ' + config.sourceLabel,
      'Uhalisia: rejea tuli ' + config.dataReviewed + '; hakuna data ya moja kwa moja.',
      'Uhakika: makadirio ya kupanga; thibitisha aina, uotaji, nafasi na kifurushi.',
      'Faragha: hesabu ya ndani; hakuna ingizo lililotumwa kwa seva au AI.'
    ].join('\n');
  }
  function calculate() {
    byId('formError').textContent = '';
    var values = input();
    if (!validate(values)) return null;
    var result = engine.calculate(values, seedData, config.countryCode, data);
    if (result.error) {
      byId('formError').textContent = 'Hesabu ya mbegu haikufaulu.';
      clearResult();
      return null;
    }
    latest = { input: values, result: result };
    window.__SW_AGRI_TEST__.latest = latest;
    var display = displayResult();
    byId('emptyState').hidden = true;
    byId('resultPanel').hidden = false;
    byId('totalMaterial').textContent = number(display.quantity);
    byId('materialUnit').textContent = display.unit + ' kwa jumla';
    byId('rate').textContent = number(display.perHa) + ' ' + display.unit + '/ha';
    byId('bags').textContent = display.bags == null ? 'Haijaonyeshwa' : display.bags;
    byId('population').textContent = display.population == null ? 'Haijaonyeshwa' : number(display.population);
    byId('cost').textContent = display.certifiedCost == null
      ? 'Hakuna bei ya mbegu iliyothibitishwa iliyodumishwa kwa mchanganyiko huu.'
      : 'Gharama elekezi ya mbegu iliyothibitishwa: ' + money(display.certifiedCost);
    byId('notes').textContent = 'Thibitisha aina, kiwango cha uotaji, lebo ya kifurushi na upatikanaji katika eneo lako.';
    setActions(true);
    status('Kiasi kimekokotolewa ndani ya kivinjari.');
    return result;
  }

  byId('seedForm').addEventListener('submit', function (event) {
    event.preventDefault();
    calculate();
  });
  byId('seedForm').addEventListener('reset', function () {
    setTimeout(function () {
      byId('formError').textContent = '';
      clearResult();
      refreshCropDefaults();
      status('Sehemu zimewekwa upya.');
    }, 0);
  });
  byId('crop').addEventListener('change', function () {
    refreshCropDefaults();
    if (latest) clearResult('Ingizo limebadilika; kokotoa tena kabla ya kutumia matokeo.');
  });
  byId('seedForm').addEventListener('input', function () {
    if (latest) clearResult('Ingizo limebadilika; kokotoa tena kabla ya kutumia matokeo.');
  });
  byId('seedForm').addEventListener('change', function (event) {
    if (event.target.id !== 'crop' && latest) clearResult('Ingizo limebadilika; kokotoa tena kabla ya kutumia matokeo.');
  });
  document.addEventListener('click', function (event) {
    var button = event.target.closest('[data-result-action]');
    if (!button) return;
    if (!latest) return status('Fanya hesabu halali kwanza.', true);
    var action = button.dataset.resultAction;
    var object = report();
    var plain = text();
    var slug = 'afrotools-kiwango-mbegu-' + config.countryCode.toLowerCase();
    if (action === 'copy') navigator.clipboard.writeText(plain).then(function () { status('Matokeo yamenakiliwa.'); });
    if (action === 'share') {
      if (navigator.share) navigator.share({ title: 'Kiwango cha mbegu - ' + config.countryName, text: plain, url: location.href }).catch(function (error) {
        if (error && error.name !== 'AbortError') status('Kushiriki hakupatikani.', true);
      });
      else navigator.clipboard.writeText(location.href + '\n\n' + plain).then(function () { status('Kiungo na matokeo yamenakiliwa.'); });
    }
    if (action === 'save') {
      try { localStorage.setItem(config.storageKey, JSON.stringify(object)); status('Matokeo yamehifadhiwa kwenye kifaa hiki.'); }
      catch (error) { status('Hifadhi ya kifaa imezuiwa.', true); }
    }
    if (action === 'txt') download('\ufeff' + plain, 'text/plain;charset=utf-8', slug + '.txt');
    if (action === 'json') download(JSON.stringify(object, null, 2), 'application/json;charset=utf-8', slug + '.json');
    if (action === 'csv') {
      var display = displayResult();
      var rows = [
        ['nchi', 'msimbo', 'zao', 'hekta', 'kiasi_jumla', 'kipimo', 'kiasi_kwa_hekta', 'mifuko', 'sarafu', 'data_moja_kwa_moja'],
        [config.countryName, config.countryCode, display.crop, display.farmSizeHa, display.quantity, display.unit, display.perHa, display.bags, display.currency, 'hapana']
      ];
      download('\ufeff' + rows.map(function (row) { return row.map(csvCell).join(','); }).join('\r\n'), 'text/csv;charset=utf-8', slug + '.csv');
    }
    if (action === 'pdf') {
      var Pdf = window.jspdf && window.jspdf.jsPDF;
      if (!Pdf) return status('PDF haipatikani.', true);
      var pdf = new Pdf({ unit: 'pt', format: 'a4' });
      pdf.text(pdf.splitTextToSize(plain.normalize('NFD').replace(/[\u0300-\u036f]/g, ''), 500), 48, 58);
      pdf.save(slug + '.pdf');
    }
    if (['txt', 'json', 'csv', 'pdf'].indexOf(action) !== -1) status('Faili limepakuliwa.');
  });

  window.__SW_AGRI_TEST__ = {
    calculate: calculate, latest: null, engine: engine, data: data,
    seedData: seedData, reportObject: report, displayResult: displayResult
  };
  try { initialize(); }
  catch (error) { byId('formError').textContent = error.message; console.error(error); }
}());
