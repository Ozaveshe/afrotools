(function initSwahiliFishFarming(root) {
  'use strict';

  var config = root.__SW_AGRI_PAGE__ || {};
  var data = root.AquaData;
  var engine = root.AquaROI;
  var costs = null;
  var latest = null;

  function byId(id) { return document.getElementById(id); }
  function number(value, digits) {
    return new Intl.NumberFormat('sw', { maximumFractionDigits: digits == null ? 2 : digits }).format(Number(value) || 0);
  }
  function money(value) {
    return new Intl.NumberFormat('sw', {
      style: 'currency', currency: costs.currency, maximumFractionDigits: 0
    }).format(Number(value) || 0);
  }
  function csvCell(value) {
    var text = String(value == null ? '' : value);
    return /[",\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
  }
  function option(value, label) {
    var node = document.createElement('option');
    node.value = value; node.textContent = label; return node;
  }
  function setStatus(message, error) {
    var node = byId('actionStatus');
    node.textContent = message || '';
    node.style.color = error ? 'var(--agri-danger)' : 'var(--agri-good)';
  }
  function setActionsEnabled(enabled) {
    document.querySelectorAll('[data-result-action]').forEach(function (button) { button.disabled = !enabled; });
  }
  function clearResult(options) {
    latest = null;
    root.__SW_AGRI_TEST__.latest = null;
    byId('resultPanel').hidden = true;
    byId('emptyState').hidden = false;
    setActionsEnabled(false);
    if (!options || !options.keepStatus) setStatus('');
  }
  function systemDefaults() {
    var system = byId('system').value;
    if (system === 'tarpaulin_tank') { byId('area').value = '5000'; byId('areaUnit').textContent = 'lita'; }
    else if (system === 'earthen_pond') { byId('area').value = '500'; byId('areaUnit').textContent = 'm²'; }
    else if (system === 'cage') { byId('area').value = '200'; byId('areaUnit').textContent = 'm²'; }
    else { byId('area').value = '100'; byId('areaUnit').textContent = 'm²'; }
  }
  function speciesDefaults() {
    var species = data.SPECIES[byId('species').value];
    if (!species) return;
    byId('months').value = String(species.growOutPeriod_months.typical);
    if (byId('species').value === 'trout') { byId('system').value = 'concrete_tank'; systemDefaults(); }
  }
  function initialise() {
    if (!data || !engine || !data.COSTS || !data.COSTS[config.countryCode]) {
      throw new Error('Injini au data ya ufugaji wa samaki haipatikani.');
    }
    costs = data.COSTS[config.countryCode];
    byId('species').innerHTML = '';
    costs.dominantSpecies.forEach(function (key) {
      byId('species').appendChild(option(key, config.species[key] || data.SPECIES[key].name));
    });
    byId('system').value = 'earthen_pond';
    byId('density').value = 'medium'; byId('management').value = 'average'; byId('target').value = 'typical';
    byId('cycles').value = '1'; byId('feed').value = 'local_float'; byId('processing').value = 'none';
    byId('laborDays').value = String(costs.labor_days_cycle); byId('familyLabor').value = '0';
    byId('infrastructure').value = 'no'; byId('water').value = 'surface';
    systemDefaults(); speciesDefaults(); byId('formError').textContent = ''; clearResult();
  }
  function readInput() {
    return {
      countryCode: config.countryCode, speciesId: byId('species').value, system: byId('system').value,
      pondArea: Number(byId('area').value), densityLevel: byId('density').value,
      managementLevel: byId('management').value, targetSizeLevel: byId('target').value,
      growPeriodMonths: Number(byId('months').value), cyclesPerYear: Number(byId('cycles').value),
      feedType: byId('feed').value, processingLevel: byId('processing').value, sellingMethod: 'fresh',
      hasExistingInfra: byId('infrastructure').value === 'yes', needsBorehole: byId('water').value === 'borehole',
      familyLaborPct: Number(byId('familyLabor').value), laborDays: Number(byId('laborDays').value)
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
    if (!data.SPECIES[input.speciesId] || costs.dominantSpecies.indexOf(input.speciesId) < 0) return fail('Chagua aina ya samaki inayopatikana kwa nchi hii.', byId('species'));
    if (!data.SYSTEMS[input.system]) return fail('Chagua mfumo halali wa ufugaji.', byId('system'));
    if (!Number.isFinite(input.pondArea) || input.pondArea < 1 || input.pondArea > 1000000) return fail('Weka eneo au ujazo kati ya 1 na 1,000,000.', byId('area'));
    if (!config.densities[input.densityLevel]) return fail('Chagua msongamano halali.', byId('density'));
    if (!config.management[input.managementLevel]) return fail('Chagua kiwango halali cha usimamizi.', byId('management'));
    if (!config.targets[input.targetSizeLevel]) return fail('Chagua ukubwa halali unaolengwa.', byId('target'));
    if (!Number.isInteger(input.growPeriodMonths) || input.growPeriodMonths < 1 || input.growPeriodMonths > 24) return fail('Weka muda kamili wa mzunguko kati ya mwezi 1 na miezi 24.', byId('months'));
    if (!Number.isInteger(input.cyclesPerYear) || input.cyclesPerYear < 1 || input.cyclesPerYear > 12) return fail('Weka mizunguko kamili kati ya 1 na 12 kwa mwaka.', byId('cycles'));
    if (!config.feeds[input.feedType] || costs.feed_per_kg[input.feedType] == null) return fail('Chagua aina halali ya chakula.', byId('feed'));
    if (!config.processing[input.processingLevel]) return fail('Chagua njia halali ya kuuza au kusindika.', byId('processing'));
    if (!Number.isInteger(input.laborDays) || input.laborDays < 0 || input.laborDays > 3660) return fail('Weka siku kamili za kazi kati ya 0 na 3,660.', byId('laborDays'));
    if (!Number.isFinite(input.familyLaborPct) || input.familyLaborPct < 0 || input.familyLaborPct > 100) return fail('Weka sehemu ya kazi ya familia kati ya 0% na 100%.', byId('familyLabor'));
    if (!['no', 'yes'].includes(byId('infrastructure').value)) return fail('Chagua hali halali ya miundombinu.', byId('infrastructure'));
    if (!['surface', 'borehole'].includes(byId('water').value)) return fail('Chagua chanzo halali cha maji.', byId('water'));
    return true;
  }
  function localisedResult(result) {
    return {
      ainaYaSamaki: config.species[latest.input.speciesId], mfumo: config.systems[latest.input.system],
      eneoAuUjazo: latest.input.pondArea, samakiWaliowekwa: result.fishStocked,
      samakiWaliovunwa: result.fishHarvested, uhaiAsilimia: result.survivalPct,
      mavunoKg: result.harvestKg, chakulaKg: result.feedKg, gharamaMzunguko: result.totalCostPerCycle,
      mapatoGhafi: result.revenue, faidaMzunguko: result.profitPerCycle, faidaMwaka: result.annualProfit,
      roiAsilimia: result.roiPct, mieziKurejesha: result.paybackMonths,
      gharamaKwaKg: result.costPerKg, sarafu: costs.currency
    };
  }
  function reportObject() {
    if (!latest) return null;
    return {
      schemaVersion: 1, zana: 'faida-ya-ufugaji-samaki', lugha: 'sw',
      nchi: { code: config.countryCode, jina: config.countryName }, ingizo: latest.input,
      matokeo: localisedResult(latest.result),
      chanzo: { lebo: config.sourceLabel, viungo: config.sourceLinks, mapitio: config.dataReviewed, kiwangoChaUhakika: config.confidence, dataMojaKwaMoja: false },
      faragha: 'Hesabu hufanyika kwenye kivinjari hiki; hakuna ingizo linalotumwa kwa seva.'
    };
  }
  function reportText() {
    if (!latest) return '';
    var result = localisedResult(latest.result);
    return [
      'AfroTools - Faida ya ufugaji wa samaki', 'Nchi: ' + config.countryName + ' (' + config.countryCode + ')',
      'Aina ya samaki: ' + result.ainaYaSamaki, 'Mfumo: ' + result.mfumo,
      'Samaki waliowekwa: ' + number(result.samakiWaliowekwa), 'Samaki waliovunwa: ' + number(result.samakiWaliovunwa),
      'Mavuno: ' + number(result.mavunoKg) + ' kg', 'Chakula: ' + number(result.chakulaKg) + ' kg',
      'Gharama kwa mzunguko: ' + money(result.gharamaMzunguko), 'Mapato ghafi: ' + money(result.mapatoGhafi),
      'Faida kwa mzunguko: ' + money(result.faidaMzunguko), 'Faida kwa mwaka: ' + money(result.faidaMwaka),
      'ROI: ' + (result.roiAsilimia == null ? 'Haihesabiki' : number(result.roiAsilimia) + '%'),
      '', 'Vyanzo vilivyotajwa: ' + config.sourceLabel,
      'FAO SOFIA: ' + config.sourceLinks.fao, 'WorldFish: ' + config.sourceLinks.worldFish,
      'Upya: ' + config.dataReviewed + '; si data ya moja kwa moja.',
      'Kiwango cha uhakika: ' + config.confidence,
      'Faragha: hesabu ya ndani ya kivinjari; hakuna ingizo linalotumwa kwa seva.'
    ].join('\n');
  }
  function render(result) {
    byId('emptyState').hidden = true; byId('resultPanel').hidden = false;
    byId('profit').textContent = money(result.profitPerCycle);
    byId('profitLabel').textContent = result.isProfit ? 'Faida kwa mzunguko' : 'Hasara kwa mzunguko';
    byId('harvest').textContent = number(result.harvestKg) + ' kg';
    byId('cost').textContent = money(result.totalCostPerCycle); byId('revenue').textContent = money(result.revenue);
    byId('roi').textContent = result.roiPct == null ? 'Haihesabiki' : number(result.roiPct) + '%';
    byId('stocked').textContent = number(result.fishStocked); byId('survival').textContent = result.survivalPct + '%';
    byId('feedSummary').textContent = 'Chakula kwa mzunguko: ' + number(result.feedKg) + ' kg (' + number(result.feedBags) + ' mifuko ya kg 25), kwa bei iliyohifadhiwa ya ' + money(result.feedPricePerKg) + '/kg.';
    setActionsEnabled(true); setStatus('Faida imekokotolewa kwenye kivinjari hiki.'); byId('resultPanel').focus();
  }
  function calculate() {
    byId('formError').textContent = '';
    var input = readInput();
    if (!validate(input)) return null;
    var result = engine.calculate(input);
    if (!result || result.error) return fail('Hesabu haikukamilika. Kagua ingizo na data ya nchi.', byId('species'));
    latest = { input: input, result: result }; root.__SW_AGRI_TEST__.latest = latest; render(result); return result;
  }
  function download(content, type, filename) {
    var url = URL.createObjectURL(new Blob([content], { type: type }));
    var link = document.createElement('a'); link.href = url; link.download = filename;
    document.body.appendChild(link); link.click(); link.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 0);
  }
  function createCsv() {
    var result = localisedResult(latest.result);
    return '\ufeff' + [
      ['nchi', 'code_nchi', 'aina_samaki', 'mfumo', 'samaki_waliowekwa', 'samaki_waliovunwa', 'mavuno_kg', 'chakula_kg', 'gharama_mzunguko', 'mapato_ghafi', 'faida_mzunguko', 'faida_mwaka', 'roi_asilimia', 'sarafu', 'data_moja_kwa_moja'],
      [config.countryName, config.countryCode, result.ainaYaSamaki, result.mfumo, result.samakiWaliowekwa, result.samakiWaliovunwa, result.mavunoKg, result.chakulaKg, result.gharamaMzunguko, result.mapatoGhafi, result.faidaMzunguko, result.faidaMwaka, result.roiAsilimia, result.sarafu, 'hapana']
    ].map(function (row) { return row.map(csvCell).join(','); }).join('\r\n');
  }
  async function runAction(action) {
    if (!latest) return setStatus('Kokotoa matokeo mapya kabla ya kutumia kitendo hiki.', true);
    var object = reportObject(), text = reportText(), slug = 'afrotools-ufugaji-samaki-' + config.countryCode.toLowerCase();
    try {
      if (action === 'copy') { await navigator.clipboard.writeText(text); setStatus('Muhtasari umenakiliwa.'); }
      else if (action === 'share') {
        var payload = { title: 'Faida ya ufugaji wa samaki', text: text, url: location.href };
        if (navigator.share) { await navigator.share(payload); setStatus('Kidirisha cha kushiriki kimefunguliwa.'); }
        else { await navigator.clipboard.writeText(payload.url + '\n\n' + payload.text); setStatus('Kushiriki kwa mfumo hakupatikani; kiungo na muhtasari vimenakiliwa.'); }
      } else if (action === 'save') { localStorage.setItem(config.storageKey + ':' + config.countryCode, JSON.stringify(object)); setStatus('Nakala imehifadhiwa kwenye kivinjari hiki.'); }
      else if (action === 'json') { download(JSON.stringify(object, null, 2), 'application/json;charset=utf-8', slug + '.json'); setStatus('Faili ya JSON imepakuliwa.'); }
      else if (action === 'txt') { download('\ufeff' + text, 'text/plain;charset=utf-8', slug + '.txt'); setStatus('Faili ya TXT imepakuliwa.'); }
      else if (action === 'csv') { download(createCsv(), 'text/csv;charset=utf-8', slug + '.csv'); setStatus('Faili ya CSV imepakuliwa.'); }
      else if (action === 'pdf') {
        var JsPdf = root.jspdf && root.jspdf.jsPDF;
        if (!JsPdf) throw new Error('Maktaba ya PDF haipatikani.');
        var pdf = new JsPdf({ unit: 'pt', format: 'a4' });
        pdf.text(pdf.splitTextToSize(text.normalize('NFD').replace(/[\u0300-\u036f]/g, ''), 500), 48, 58);
        pdf.save(slug + '.pdf'); setStatus('Faili ya PDF imepakuliwa.');
      }
    } catch (error) { setStatus('Kitendo hakikukamilika: ' + (error && error.message ? error.message : 'jaribu tena.'), true); }
  }

  root.__SW_AGRI_TEST__ = {
    calculate: calculate, latest: null, reportObject: reportObject, reportText: reportText,
    createCsv: createCsv, engine: engine, data: data, invalidate: clearResult
  };
  document.addEventListener('DOMContentLoaded', function () {
    var form = byId('fishForm');
    try { initialise(); } catch (error) { byId('formError').textContent = error.message; console.error(error); return; }
    byId('species').addEventListener('change', speciesDefaults);
    byId('system').addEventListener('change', systemDefaults);
    form.addEventListener('submit', function (event) { event.preventDefault(); calculate(); });
    form.addEventListener('input', function () { clearResult(); byId('formError').textContent = ''; });
    form.addEventListener('change', function () { clearResult(); byId('formError').textContent = ''; });
    form.addEventListener('reset', function () { setTimeout(function () { initialise(); byId('species').focus(); }, 0); });
    document.addEventListener('click', function (event) {
      var button = event.target.closest('[data-result-action]');
      if (button) runAction(button.dataset.resultAction);
    });
  });
})(window);
