(function initSwahiliGreenhouse(root) {
  'use strict';

  var config = root.__SW_AGRI_PAGE__ || {};
  var data = root.GREENHOUSE_DATA;
  var engine = root.GHEngine;
  var country = null;
  var latest = null;

  function byId(id) { return document.getElementById(id); }
  function number(value, digits) {
    return new Intl.NumberFormat('sw', { maximumFractionDigits: digits == null ? 1 : digits }).format(Number(value) || 0);
  }
  function money(value) {
    return new Intl.NumberFormat('sw', {
      style: 'currency', currency: country.currency, maximumFractionDigits: 0
    }).format(Number(value) || 0);
  }
  function csvCell(value) {
    var text = String(value == null ? '' : value);
    return /[",\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
  }
  function option(value, label) {
    var node = document.createElement('option');
    node.value = value;
    node.textContent = label;
    return node;
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
  function populateCrops() {
    var select = byId('crop');
    select.innerHTML = '';
    engine.availableCrops(config.countryCode).forEach(function (crop) {
      select.appendChild(option(crop.id, config.crops[crop.id] || crop.name));
    });
  }
  function initialise() {
    if (!engine || !data || !data.countries || !data.countries[config.countryCode]) {
      throw new Error('Injini au data ya greenhouse haipatikani.');
    }
    country = data.countries[config.countryCode];
    byId('type').value = 'steel_polythene';
    byId('area').value = '500';
    byId('cycles').value = '2';
    byId('water').value = 'surface';
    byId('setup').value = 'new';
    populateCrops();
    byId('formError').textContent = '';
    clearResult();
  }
  function readInput() {
    return {
      countryCode: config.countryCode,
      greenhouseType: byId('type').value,
      area: Number(byId('area').value),
      crop: byId('crop').value,
      cyclesPerYear: Number(byId('cycles').value),
      waterSource: byId('water').value,
      isNewSetup: byId('setup').value === 'new'
    };
  }
  function fail(message, field) {
    clearResult({ keepStatus: true });
    byId('formError').textContent = message;
    setStatus('Matokeo hayajakokotolewa. Sahihisha sehemu iliyoonyeshwa.', true);
    if (field) field.focus();
    return false;
  }
  function validate(input) {
    if (!data.types[input.greenhouseType]) return fail('Chagua aina halali ya greenhouse.', byId('type'));
    if (!country.crops[input.crop]) return fail('Chagua zao linalopatikana kwa nchi hii.', byId('crop'));
    if (!Number.isFinite(input.area) || input.area < 10 || input.area > 1000000) {
      return fail('Weka eneo kati ya m² 10 na 1,000,000.', byId('area'));
    }
    if (!Number.isInteger(input.cyclesPerYear) || input.cyclesPerYear < 1 || input.cyclesPerYear > 12) {
      return fail('Weka mizunguko kamili kati ya 1 na 12 kwa mwaka.', byId('cycles'));
    }
    if (!config.water[input.waterSource]) return fail('Chagua chanzo halali cha maji.', byId('water'));
    if (byId('setup').value !== 'new' && byId('setup').value !== 'existing') {
      return fail('Chagua hali halali ya ujenzi.', byId('setup'));
    }
    return true;
  }
  function localisedResult(result) {
    return {
      aina: config.types[latest.input.greenhouseType], zao: config.crops[latest.input.crop],
      eneoM2: result.area, mizungukoKwaMwaka: result.cycles,
      gharamaKuanzisha: result.setup.total, gharamaKuendeshaMwaka: result.running.total,
      mavunoKg: result.revenue.yieldKg, mapatoChini: result.revenue.low,
      mapatoKati: result.revenue.mid, mapatoJuu: result.revenue.high,
      faidaHalisi: result.netProfit, roiAsilimia: result.roi,
      kurejeshaMiaka: Number.isFinite(result.payback) ? result.payback : null,
      kiwangoKufidiaKg: result.breakEvenKg, sarafu: country.currency
    };
  }
  function reportObject() {
    if (!latest) return null;
    return {
      schemaVersion: 1, zana: 'gharama-za-greenhouse', lugha: 'sw',
      nchi: { code: config.countryCode, jina: config.countryName },
      ingizo: latest.input, matokeo: localisedResult(latest.result),
      chanzo: {
        lebo: config.sourceLabel, kiungo: config.sourceHref, mapitio: config.dataReviewed,
        kiwangoChaUhakika: config.confidence, dataMojaKwaMoja: false
      },
      faragha: 'Hesabu hufanyika kwenye kivinjari hiki; hakuna ingizo linalotumwa kwa seva.'
    };
  }
  function reportText() {
    if (!latest) return '';
    var result = localisedResult(latest.result);
    return [
      'AfroTools - Gharama na faida ya greenhouse',
      'Nchi: ' + config.countryName + ' (' + config.countryCode + ')',
      'Aina: ' + result.aina, 'Zao: ' + result.zao,
      'Eneo: ' + number(result.eneoM2) + ' m²',
      'Mizunguko kwa mwaka: ' + result.mizungukoKwaMwaka,
      'Gharama za kuanzisha: ' + money(result.gharamaKuanzisha),
      'Gharama za mwaka: ' + money(result.gharamaKuendeshaMwaka),
      'Mavuno ya mwaka: ' + number(result.mavunoKg) + ' kg',
      'Mapato ya chini: ' + money(result.mapatoChini),
      'Mapato ya kati: ' + money(result.mapatoKati),
      'Mapato ya juu: ' + money(result.mapatoJuu),
      'Faida halisi ya mwaka: ' + money(result.faidaHalisi),
      'ROI: ' + number(result.roiAsilimia) + '%',
      'Muda wa kurejesha gharama: ' + (result.kurejeshaMiaka == null ? 'Hauhesabiki' : number(result.kurejeshaMiaka) + ' miaka'),
      '', 'Vyanzo vilivyotajwa: ' + config.sourceLabel,
      'Kiungo rasmi cha FAOSTAT: ' + config.sourceHref,
      'Upya: marejeo ya ' + config.dataReviewed + '; si data ya moja kwa moja.',
      'Kiwango cha uhakika: ' + config.confidence,
      'Faragha: hesabu ya ndani ya kivinjari; hakuna ingizo linalotumwa kwa seva.'
    ].join('\n');
  }
  function render(result) {
    byId('emptyState').hidden = true;
    byId('resultPanel').hidden = false;
    byId('profit').textContent = money(result.netProfit);
    byId('setupCost').textContent = money(result.setup.total);
    byId('running').textContent = money(result.running.total);
    byId('yield').textContent = number(result.revenue.yieldKg) + ' kg';
    byId('revenue').textContent = money(result.revenue.mid);
    byId('roi').textContent = number(result.roi) + '%';
    byId('payback').textContent = Number.isFinite(result.payback) ? number(result.payback) + ' miaka' : 'Hauhesabiki';
    byId('scenarios').textContent = 'Mapato kwa bei za nchi zilizohifadhiwa — chini: ' + money(result.revenue.low)
      + '; kati: ' + money(result.revenue.mid) + '; juu: ' + money(result.revenue.high) + '.';
    setActionsEnabled(true);
    setStatus('Gharama na faida zimekokotolewa kwenye kivinjari hiki.');
    byId('resultPanel').focus();
  }
  function calculate() {
    byId('formError').textContent = '';
    var input = readInput();
    if (!validate(input)) return null;
    var result = engine.calculate(input);
    if (!result) return fail('Mchanganyiko huu wa nchi na zao haupo kwenye data iliyohifadhiwa.', byId('crop'));
    latest = { input: input, result: result };
    root.__SW_AGRI_TEST__.latest = latest;
    render(result);
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
      ['nchi', 'code_nchi', 'aina', 'zao', 'eneo_m2', 'mizunguko_mwaka', 'gharama_kuanzisha', 'gharama_mwaka', 'mavuno_kg', 'mapato_kati', 'faida_halisi', 'roi_asilimia', 'sarafu', 'data_moja_kwa_moja'],
      [config.countryName, config.countryCode, result.aina, result.zao, result.eneoM2, result.mizungukoKwaMwaka, result.gharamaKuanzisha, result.gharamaKuendeshaMwaka, result.mavunoKg, result.mapatoKati, result.faidaHalisi, result.roiAsilimia, result.sarafu, 'hapana']
    ].map(function (row) { return row.map(csvCell).join(','); }).join('\r\n');
  }
  async function runAction(action) {
    if (!latest) return setStatus('Kokotoa matokeo mapya kabla ya kutumia kitendo hiki.', true);
    var object = reportObject();
    var text = reportText();
    var slug = 'afrotools-greenhouse-' + config.countryCode.toLowerCase();
    try {
      if (action === 'copy') {
        await navigator.clipboard.writeText(text);
        setStatus('Muhtasari umenakiliwa.');
      } else if (action === 'share') {
        var payload = { title: 'Gharama na faida ya greenhouse', text: text, url: location.href };
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
        pdf.text(pdf.splitTextToSize(text.normalize('NFD').replace(/[\u0300-\u036f]/g, ''), 500), 48, 58);
        pdf.save(slug + '.pdf');
        setStatus('Faili ya PDF imepakuliwa.');
      }
    } catch (error) {
      setStatus('Kitendo hakikukamilika: ' + (error && error.message ? error.message : 'jaribu tena.'), true);
    }
  }

  root.__SW_AGRI_TEST__ = {
    calculate: calculate, latest: null, reportObject: reportObject, reportText: reportText,
    createCsv: createCsv, engine: engine, data: data, invalidate: clearResult
  };

  document.addEventListener('DOMContentLoaded', function () {
    var form = byId('greenhouseForm');
    try { initialise(); } catch (error) {
      byId('formError').textContent = error.message;
      console.error(error);
      return;
    }
    form.addEventListener('submit', function (event) { event.preventDefault(); calculate(); });
    form.addEventListener('input', function () { clearResult(); byId('formError').textContent = ''; });
    form.addEventListener('change', function () { clearResult(); byId('formError').textContent = ''; });
    form.addEventListener('reset', function () {
      setTimeout(function () { initialise(); byId('type').focus(); }, 0);
    });
    document.addEventListener('click', function (event) {
      var button = event.target.closest('[data-result-action]');
      if (button) runAction(button.dataset.resultAction);
    });
  });
})(window);
