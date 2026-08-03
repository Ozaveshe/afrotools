(function initSwahiliCassavaProcessing(root) {
  'use strict';

  var app = root.AfroTools = root.AfroTools || {};
  var config = root.__SW_AGRI_PAGE__ || {};
  var data = app.cassavaProcessing;
  var engine = app.CassavaProcessingEngine;
  var country = null;
  var latest = null;
  var priceKeys = config.priceKeys || {};

  function byId(id) { return document.getElementById(id); }
  function number(value) {
    return new Intl.NumberFormat('sw', { maximumFractionDigits: 1 }).format(Number(value) || 0);
  }
  function money(value) {
    return new Intl.NumberFormat('sw', {
      style: 'currency',
      currency: country.currency,
      maximumFractionDigits: 0
    }).format(Number(value) || 0);
  }
  function csvCell(value) {
    var text = String(value == null ? '' : value);
    return /[",\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
  }
  function setStatus(message, error) {
    var node = byId('actionStatus');
    node.textContent = message || '';
    node.style.color = error ? 'var(--agri-danger)' : 'var(--agri-good)';
  }
  function setActionsEnabled(enabled) {
    document.querySelectorAll('[data-result-action]').forEach(function (button) {
      button.disabled = !enabled;
    });
  }
  function clearResult(options) {
    latest = null;
    root.__SW_AGRI_TEST__.latest = null;
    byId('resultPanel').hidden = true;
    byId('emptyState').hidden = false;
    setActionsEnabled(false);
    if (!options || !options.keepStatus) setStatus('');
  }
  function supported(pathwayId) {
    return Number(country && country[priceKeys[pathwayId]]) > 0;
  }
  function firstSupported() {
    return Object.keys(config.pathways || {}).find(supported) || 'fufu_flour';
  }
  function updatePathway() {
    var pathwayId = byId('pathway').value;
    var pathway = data.pathways[pathwayId];
    var maintainedPrice = Number(country[priceKeys[pathwayId]]) || 0;
    byId('sellingPrice').value = maintainedPrice || '';
    byId('pathwayHelp').textContent = pathway
      ? 'Kiwango cha ubadilishaji kinachotumika: kilo ' + number(pathway.conversionRate)
        + ' za mizizi kwa kilo 1 ya bidhaa. Bei ya mauzo ya nchi hii '
        + (maintainedPrice > 0 ? 'imejazwa kama rejea inayoweza kubadilishwa.' : 'haijahifadhiwa; weka bei uliyothibitisha.')
      : '';
  }
  function initialise() {
    if (!data || !engine || !data.countries || !data.countries[config.countryCode]) {
      throw new Error('Injini au data ya usindikaji wa mihogo haipatikani.');
    }
    country = data.countries[config.countryCode];
    byId('rawPrice').value = country.fresh_cassava_per_tonne;
    byId('laborRate').value = country.labor_per_day;
    byId('pathway').value = firstSupported();
    byId('level').value = 'manual';
    byId('transport').value = 'no';
    byId('distance').disabled = true;
    updatePathway();
    clearResult();
  }
  function readInput() {
    return {
      pathwayId: byId('pathway').value,
      rawTonnes: Number(byId('rawTonnes').value),
      batchesPerMonth: Number(byId('batches').value),
      rawPricePerTonne: Number(byId('rawPrice').value),
      sellingPricePerKg: Number(byId('sellingPrice').value),
      laborPerDay: Number(byId('laborRate').value),
      processingLevel: byId('level').value,
      includeTransport: byId('transport').value === 'yes',
      distanceKm: Number(byId('distance').value)
    };
  }
  function fail(message, field) {
    clearResult({ keepStatus: true });
    byId('formError').textContent = message;
    setStatus('Hesabu haijafanywa. Sahihisha sehemu iliyoonyeshwa.', true);
    if (field) field.focus();
    return false;
  }
  function validate(input) {
    if (!Number.isFinite(input.rawTonnes) || input.rawTonnes < 0.1 || input.rawTonnes > 1000) {
      return fail('Weka kati ya tani 0.1 na 1,000 za mihogo mibichi kwa kundi.', byId('rawTonnes'));
    }
    if (!Number.isInteger(input.batchesPerMonth) || input.batchesPerMonth < 1 || input.batchesPerMonth > 100) {
      return fail('Weka idadi kamili ya makundi kati ya 1 na 100 kwa mwezi.', byId('batches'));
    }
    if (!Number.isFinite(input.rawPricePerTonne) || input.rawPricePerTonne <= 0) {
      return fail('Weka bei ya mihogo mibichi iliyo zaidi ya sifuri.', byId('rawPrice'));
    }
    if (!Number.isFinite(input.sellingPricePerKg) || input.sellingPricePerKg <= 0) {
      return fail('Weka bei ya mauzo kwa kilo iliyo zaidi ya sifuri.', byId('sellingPrice'));
    }
    if (!Number.isFinite(input.laborPerDay) || input.laborPerDay <= 0) {
      return fail('Weka gharama ya kazi kwa siku iliyo zaidi ya sifuri.', byId('laborRate'));
    }
    if (!['manual', 'semi_mechanized', 'mechanized'].includes(input.processingLevel)) {
      return fail('Chagua kiwango halali cha usindikaji.', byId('level'));
    }
    if (!Number.isFinite(input.distanceKm) || input.distanceKm < 0 || input.distanceKm > 5000) {
      return fail('Weka umbali kati ya km 0 na 5,000.', byId('distance'));
    }
    if (input.includeTransport && input.distanceKm <= 0) {
      return fail('Weka umbali ulio zaidi ya sifuri unapojumuisha usafiri.', byId('distance'));
    }
    return true;
  }
  function localisedResult(result) {
    return {
      mkondo: config.pathways[result.pathway],
      mihogoMibichiKg: result.rawKg,
      bidhaaKg: result.outputKg,
      kiwangoUbadilishaji: result.conversionRate,
      beiMauzoKwaKg: result.sellingPrice,
      mapato: result.revenue,
      gharama: result.costs,
      faidaKwaKundi: result.profitPerBatch,
      ukingoFaidaAsilimia: result.profitMarginPct,
      faidaKwaMwezi: result.monthlyProfit,
      faidaKwaMwaka: result.annualProfit,
      roiAsilimia: result.roi,
      sarafu: country.currency
    };
  }
  function reportObject() {
    if (!latest) return null;
    return {
      schemaVersion: 1,
      zana: 'faida-ya-usindikaji-mihogo',
      lugha: 'sw',
      nchi: { code: config.countryCode, jina: config.countryName },
      ingizo: latest.input,
      matokeo: localisedResult(latest.result),
      ulinganisho: latest.comparisons.map(function (result) {
        return {
          mkondo: config.pathways[result.pathway],
          faidaKwaKundi: result.profitPerBatch,
          ukingoFaidaAsilimia: result.profitMarginPct
        };
      }),
      chanzo: {
        lebo: config.sourceLabel,
        mapitio: config.dataReviewed,
        dataMojaKwaMoja: false
      },
      faragha: 'Hesabu hufanyika kwenye kivinjari hiki; hakuna ingizo linalotumwa kwa seva.'
    };
  }
  function reportText() {
    if (!latest) return '';
    var result = localisedResult(latest.result);
    var best = latest.comparisons.length ? config.pathways[latest.comparisons[0].pathway] : 'Haipatikani';
    return [
      'AfroTools - Faida ya usindikaji wa mihogo',
      'Nchi: ' + config.countryName + ' (' + config.countryCode + ')',
      'Mkondo: ' + result.mkondo,
      'Mihogo mibichi: ' + number(result.mihogoMibichiKg) + ' kg',
      'Bidhaa iliyopatikana: ' + number(result.bidhaaKg) + ' kg',
      'Mapato: ' + money(result.mapato),
      'Gharama zote: ' + money(result.gharama.total),
      'Faida kwa kundi: ' + money(result.faidaKwaKundi),
      'Ukingo wa faida: ' + number(result.ukingoFaidaAsilimia) + '%',
      'Faida kwa mwezi: ' + money(result.faidaKwaMwezi),
      'Faida kwa mwaka: ' + money(result.faidaKwaMwaka),
      'Mkondo bora wa kulinganisha: ' + best,
      '',
      'Chanzo: ' + config.sourceLabel,
      'Upya wa data: ' + config.dataReviewed + '; si data ya moja kwa moja.',
      'Kiwango cha uhakika: makadirio ya kupanga yanayotegemea bei, ubadilishaji, vifaa, maji, nishati na soko.',
      'Faragha: hesabu ya ndani ya kivinjari; hakuna ingizo linalotumwa kwa seva.'
    ].join('\n');
  }
  function render(result, comparisons) {
    byId('emptyState').hidden = true;
    byId('resultPanel').hidden = false;
    byId('profit').textContent = money(result.profitPerBatch);
    byId('profitLabel').textContent = result.isProfit ? 'Faida kwa kundi' : 'Hasara kwa kundi';
    byId('output').textContent = number(result.outputKg) + ' kg';
    byId('cost').textContent = money(result.costs.total);
    byId('revenue').textContent = money(result.revenue);
    byId('margin').textContent = number(result.profitMarginPct) + '%';
    byId('monthly').textContent = money(result.monthlyProfit);
    byId('annual').textContent = money(result.annualProfit);
    byId('comparison').textContent = comparisons.length
      ? 'Mkondo wenye faida kubwa zaidi kwa ingizo hili: ' + config.pathways[comparisons[0].pathway]
        + ' (' + money(comparisons[0].profitPerBatch) + ' kwa kundi).'
      : 'Hakuna mkondo mwingine wenye bei iliyohifadhiwa kwa nchi hii.';
    setActionsEnabled(true);
    setStatus('Makadirio yamekamilika kwenye kivinjari hiki.');
    byId('resultPanel').focus();
  }
  function calculate() {
    byId('formError').textContent = '';
    var input = readInput();
    if (!validate(input)) return null;
    var original = data.countries[config.countryCode];
    var adjusted = Object.assign({}, original, { labor_per_day: input.laborPerDay });
    var result;
    var comparisons;
    data.countries[config.countryCode] = adjusted;
    try {
      result = engine.calculate(input, config.countryCode);
      comparisons = engine.compareAll(input, config.countryCode);
    } finally {
      data.countries[config.countryCode] = original;
    }
    if (!result || result.error) return fail('Hesabu ya usindikaji haikukamilika. Kagua ingizo lako.', byId('rawTonnes'));
    latest = { input: input, result: result, comparisons: comparisons };
    root.__SW_AGRI_TEST__.latest = latest;
    render(result, comparisons);
    return result;
  }
  function download(content, type, filename) {
    var url = URL.createObjectURL(new Blob([content], { type: type }));
    var link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 0);
  }
  function createCsv() {
    var result = localisedResult(latest.result);
    return '\ufeff' + [
      ['nchi', 'code_nchi', 'mkondo', 'mihogo_mibichi_kg', 'bidhaa_kg', 'mapato', 'gharama_zote', 'faida_kundi', 'ukingo_faida_pct', 'sarafu', 'data_moja_kwa_moja'],
      [config.countryName, config.countryCode, result.mkondo, result.mihogoMibichiKg, result.bidhaaKg, result.mapato, result.gharama.total, result.faidaKwaKundi, result.ukingoFaidaAsilimia, result.sarafu, 'hapana']
    ].map(function (row) { return row.map(csvCell).join(','); }).join('\r\n');
  }
  async function runAction(action) {
    if (!latest) return setStatus('Fanya hesabu mpya kabla ya kutumia kitendo hiki.', true);
    var object = reportObject();
    var text = reportText();
    var slug = 'afrotools-mihogo-' + config.countryCode.toLowerCase();
    try {
      if (action === 'copy') {
        await navigator.clipboard.writeText(text);
        setStatus('Muhtasari umenakiliwa.');
      } else if (action === 'share') {
        var payload = { title: 'Faida ya usindikaji wa mihogo', text: text, url: location.href };
        if (navigator.share) {
          await navigator.share(payload);
          setStatus('Kidirisha cha kushiriki kimefunguliwa.');
        } else {
          await navigator.clipboard.writeText(payload.url + '\n\n' + payload.text);
          setStatus('Kushiriki kwa mfumo hakupatikani; kiungo na muhtasari vimenakiliwa.');
        }
      } else if (action === 'save') {
        localStorage.setItem(config.storageKey + ':' + config.countryCode, JSON.stringify(object));
        setStatus('Nakala imehifadhiwa kwenye kivinjari hiki.');
      } else if (action === 'json') {
        download(JSON.stringify(object, null, 2), 'application/json;charset=utf-8', slug + '.json');
        setStatus('Faili ya JSON imepakuliwa.');
      } else if (action === 'txt') {
        download('\ufeff' + text, 'text/plain;charset=utf-8', slug + '.txt');
        setStatus('Faili ya TXT imepakuliwa.');
      } else if (action === 'csv') {
        download(createCsv(), 'text/csv;charset=utf-8', slug + '.csv');
        setStatus('Faili ya CSV imepakuliwa.');
      } else if (action === 'pdf') {
        var JsPdf = root.jspdf && root.jspdf.jsPDF;
        if (!JsPdf) throw new Error('Maktaba ya PDF haipatikani.');
        var pdf = new JsPdf({ unit: 'pt', format: 'a4' });
        pdf.text(pdf.splitTextToSize(text, 500), 48, 58);
        pdf.save(slug + '.pdf');
        setStatus('Faili ya PDF imepakuliwa.');
      }
    } catch (error) {
      setStatus('Kitendo hakikukamilika: ' + (error && error.message ? error.message : 'jaribu tena.'), true);
    }
  }

  root.__SW_AGRI_TEST__ = {
    calculate: calculate,
    latest: null,
    reportObject: reportObject,
    reportText: reportText,
    engine: engine,
    data: data,
    invalidate: clearResult
  };

  document.addEventListener('DOMContentLoaded', function () {
    var form = byId('cassavaForm');
    try { initialise(); } catch (error) {
      byId('formError').textContent = error.message;
      console.error(error);
      return;
    }
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      calculate();
    });
    form.addEventListener('input', function () { clearResult(); byId('formError').textContent = ''; });
    form.addEventListener('change', function (event) {
      clearResult();
      byId('formError').textContent = '';
      if (event.target.id === 'pathway') updatePathway();
      if (event.target.id === 'transport') {
        byId('distance').disabled = event.target.value !== 'yes';
        if (event.target.value !== 'yes') byId('distance').value = '0';
      }
    });
    form.addEventListener('reset', function () {
      setTimeout(function () { initialise(); byId('rawTonnes').focus(); }, 0);
    });
    document.addEventListener('click', function (event) {
      var button = event.target.closest('[data-result-action]');
      if (button) runAction(button.dataset.resultAction);
    });
  });
})(window);
