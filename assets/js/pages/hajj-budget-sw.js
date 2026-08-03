(function () {
  'use strict';

  var engine = window.AfroTools && window.AfroTools.engines && window.AfroTools.engines.hajjBudget;
  if (!engine) return;

  var storageKey = 'afrotools:sw:hajj-budget:v1';
  var state = null;
  var status = document.getElementById('hb-status');
  var resultPanel = document.getElementById('hb-result');
  var currentExportIds = ['hb-copy', 'hb-json', 'hb-save', 'hb-pdf', 'hb-print'];
  var fieldIds = {
    origin: 'hb-origin', trip: 'hb-trip', travelers: 'hb-travelers', package: 'hb-package', days: 'hb-days', buffer: 'hb-buffer',
    quoteTravelers: 'hb-quote-travelers', packageCost: 'hb-package-cost', cashBudget: 'hb-cash-budget', quoteBuffer: 'hb-quote-buffer'
  };

  function element(id) { return document.getElementById(id); }
  function rawNumber(id) { var value = element(id).value.trim(); return value === '' ? NaN : Number(value); }
  function usd(value) { return new Intl.NumberFormat('sw-TZ', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value); }
  function setMetric(id, value, numeric) { var node = element(id); node.textContent = value; if (numeric === undefined) delete node.dataset.value; else node.dataset.value = String(numeric); }

  function setCurrentExports(enabled) {
    currentExportIds.forEach(function (id) { element(id).disabled = !enabled; });
    element('hb-open-saved').disabled = !localStorage.getItem(storageKey);
  }

  function clearResult(message) {
    state = null;
    resultPanel.hidden = true;
    ['hb-total', 'hb-per-traveler', 'hb-buffer-value', 'hb-subtotal', 'hb-line-one', 'hb-line-two'].forEach(function (id) { setMetric(id, '—'); });
    element('hb-mode').textContent = '';
    element('hb-formula-result').textContent = '—';
    setCurrentExports(false);
    if (message) status.textContent = message;
  }

  function presetInput() {
    return {
      origin: element('hb-origin').value,
      trip: element('hb-trip').value,
      travelers: rawNumber('hb-travelers'),
      package: element('hb-package').value,
      days: rawNumber('hb-days'),
      buffer: rawNumber('hb-buffer')
    };
  }

  function quoteInput() {
    return {
      travelers: rawNumber('hb-quote-travelers'),
      packageCost: rawNumber('hb-package-cost'),
      cashBudget: rawNumber('hb-cash-budget'),
      buffer: rawNumber('hb-quote-buffer')
    };
  }

  function render(result) {
    state = result;
    setMetric('hb-total', usd(result.total), result.total);
    setMetric('hb-per-traveler', usd(result.perTraveler), result.perTraveler);
    setMetric('hb-buffer-value', usd(result.contingencyValue), result.contingencyValue);
    setMetric('hb-subtotal', usd(result.subtotal), result.subtotal);
    if (result.mode === 'preset') {
      element('hb-mode').textContent = 'Mfano wa kifurushi';
      element('hb-line-one-label').textContent = 'Kifurushi kwa msafiri baada ya kigezo cha nchi';
      setMetric('hb-line-one', usd(result.basePackagePerTraveler), result.basePackagePerTraveler);
      element('hb-line-two-label').textContent = 'Chakula na matumizi ya ndani — mstari wa English owner';
      setMetric('hb-line-two', usd(result.dailyAllowanceOwnerRow), result.dailyAllowanceOwnerRow);
    } else {
      element('hb-mode').textContent = 'Nukuu iliyoandikwa';
      element('hb-line-one-label').textContent = 'Vifurushi vya wasafiri wote';
      setMetric('hb-line-one', usd(result.packageTotal), result.packageTotal);
      element('hb-line-two-label').textContent = 'Fedha na matumizi ya ndani ya wasafiri wote';
      setMetric('hb-line-two', usd(result.cashTotal), result.cashTotal);
    }
    element('hb-formula-result').textContent = result.ownerFormula;
    resultPanel.hidden = false;
    setCurrentExports(true);
    status.textContent = 'Makadirio mapya yamekokotolewa ndani ya kifaa. Thibitisha nukuu na masharti kabla ya malipo.';
    resultPanel.scrollIntoView({ block: 'nearest', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  function calculate(mode, event) {
    if (event) event.preventDefault();
    try { render(mode === 'preset' ? engine.estimatePreset(presetInput()) : engine.estimateWrittenQuote(quoteInput())); }
    catch (error) {
      clearResult('Pembejeo si halali. Tumia namba zilizo ndani ya mipaka iliyoonyeshwa, kisha ujaribu tena.');
      var target = element(fieldIds[error.field]);
      if (target) target.focus();
    }
  }

  function ensureResult() {
    if (state) return true;
    status.textContent = 'Kokotoa matokeo mapya kabla ya kuhifadhi, kunakili au kupakua.';
    return false;
  }

  function rows() {
    var mode = state.mode === 'preset' ? 'Mfano wa kifurushi' : 'Nukuu iliyoandikwa';
    return [
      ['Njia', mode],
      ['Jumla ya makadirio', usd(state.total)],
      ['Kwa kila msafiri', usd(state.perTraveler)],
      ['Akiba ya dharura', usd(state.contingencyValue)],
      ['Kabla ya akiba', usd(state.subtotal)],
      ['Hesabu', state.ownerFormula]
    ];
  }

  function payload() {
    return {
      schemaVersion: 1,
      tool: 'hajj-budget',
      locale: 'sw',
      reviewedOn: engine.reviewedOn,
      mode: state.mode,
      inputs: state.input,
      results: {
        total: state.total,
        perTraveler: state.perTraveler,
        contingencyValue: state.contingencyValue,
        subtotal: state.subtotal
      },
      ownerFormula: state.ownerFormula,
      sourceSnapshot: {
        owner: engine.owner,
        packageUsd: engine.packages,
        tripFactors: engine.tripFactors,
        dailyAllowanceUsd: engine.dailyAllowanceUsd,
        originMultipliers: Object.keys(engine.origins).reduce(function (map, key) { map[key] = engine.origins[key].multiplier; return map; }, {})
      },
      confidence: 'Juu kwa hesabu; chini kwa bei ya sasa isipokuwa mtumiaji ameweka nukuu ya sasa na kamili.',
      boundary: 'Makadirio ya kupanga pekee; si bei rasmi, booking, uamuzi wa visa, fatwa au hakikisho la safari.',
      privacy: 'Hesabu na exports zimefanyika ndani ya kifaa; hakuna data iliyotumwa kwa AI au seva.'
    };
  }

  function summary() {
    return ['Bajeti ya Hajj na Umrah — AfroTools', ''].concat(rows().map(function (row) { return row[0] + ': ' + row[1]; }), ['', 'Mpaka: Makadirio ya kupanga pekee; thibitisha bei, visa na mwendeshaji.', 'Faragha: Hakuna data iliyotumwa kwa AI au seva.']).join('\n');
  }

  async function copySummary() {
    if (!ensureResult()) return;
    try { await navigator.clipboard.writeText(summary()); status.textContent = 'Muhtasari umenakiliwa ndani ya kifaa.'; }
    catch (error) { status.textContent = 'Kunakili hakupatikani kwenye kivinjari hiki.'; }
  }

  function downloadJson() {
    if (!ensureResult()) return;
    var url = URL.createObjectURL(new Blob([JSON.stringify(payload(), null, 2)], { type: 'application/json' }));
    var link = document.createElement('a');
    link.href = url;
    link.download = 'bajeti-ya-hajj-na-umrah.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 0);
    status.textContent = 'JSON imepakuliwa ndani ya kifaa.';
  }

  async function downloadPdf() {
    if (!ensureResult()) return;
    try {
      if (!window.AfroTools || !window.AfroTools.pdf) throw new Error('PDF haipatikani kwenye kivinjari hiki.');
      await window.AfroTools.pdf.generate({
        noGate: true,
        skipGate: true,
        title: 'Bajeti ya Hajj na Umrah',
        subtitle: state.mode === 'preset' ? 'Mfano wa kifurushi wa English owner' : 'Lengo kutokana na nukuu iliyoandikwa',
        country: 'Hesabu ya ndani ya kifaa',
        toolId: 'hajj-budget',
        heroStats: rows().slice(1, 5).map(function (row) { return { label: row[0], value: row[1] }; }),
        sections: [
          { title: 'PEMBEJEO NA MATOKEO', rows: rows().map(function (row) { return { label: row[0], value: row[1] }; }) },
          { title: 'MPAKA WA UTHIBITISHO', rows: [{ label: 'Thibitisha mwenyewe', value: 'Bei, kilichojumuishwa, visa, afya, sera ya kurejesha fedha na uhalali wa mwendeshaji.' }] }
        ],
        disclaimer: 'Makadirio ya kupanga pekee; si bei rasmi, booking, uamuzi wa visa, fatwa au hakikisho la safari.'
      });
      status.textContent = 'PDF imetengenezwa ndani ya kifaa.';
    } catch (error) { status.textContent = error.message; }
  }

  function saveLocal() {
    if (!ensureResult()) return;
    localStorage.setItem(storageKey, JSON.stringify(payload()));
    setCurrentExports(true);
    status.textContent = 'Nakala imehifadhiwa kwenye kivinjari hiki pekee.';
  }

  function fillPreset(input) {
    element('hb-origin').value = input.origin;
    element('hb-trip').value = input.trip;
    element('hb-travelers').value = input.travelers;
    element('hb-package').value = input.package;
    element('hb-days').value = input.days;
    element('hb-buffer').value = input.buffer;
  }

  function fillQuote(input) {
    element('hb-quote-travelers').value = input.travelers;
    element('hb-package-cost').value = input.packageCost;
    element('hb-cash-budget').value = input.cashBudget;
    element('hb-quote-buffer').value = input.buffer;
  }

  function applyPayload(saved) {
    if (!saved || saved.schemaVersion !== 1 || saved.tool !== 'hajj-budget' || !saved.inputs) throw new Error('INVALID_BACKUP');
    if (saved.mode === 'preset') { fillPreset(saved.inputs); render(engine.estimatePreset(presetInput())); }
    else if (saved.mode === 'written-quote') { fillQuote(saved.inputs); render(engine.estimateWrittenQuote(quoteInput())); }
    else throw new Error('INVALID_MODE');
  }

  function openSaved() {
    try { applyPayload(JSON.parse(localStorage.getItem(storageKey))); status.textContent = 'Nakala ya ndani imefunguliwa na kukokotolewa upya.'; }
    catch (error) { clearResult('Hakuna nakala halali iliyohifadhiwa kwenye kivinjari hiki.'); }
  }

  function importJson(event) {
    var file = event.target.files && event.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try { applyPayload(JSON.parse(String(reader.result))); status.textContent = 'JSON imefunguliwa na kukokotolewa upya ndani ya kifaa.'; }
      catch (error) { clearResult('JSON hii si nakala halali ya zana hii.'); }
      event.target.value = '';
    };
    reader.readAsText(file);
  }

  function stale() { clearResult('Pembejeo zimebadilika. Kokotoa tena kabla ya kuhifadhi au kupakua.'); }

  element('hb-preset-form').addEventListener('submit', function (event) { calculate('preset', event); });
  element('hb-quote-form').addEventListener('submit', function (event) { calculate('written-quote', event); });
  element('hb-preset-form').addEventListener('input', stale);
  element('hb-quote-form').addEventListener('input', stale);
  element('hb-preset-form').addEventListener('reset', function () { window.setTimeout(function () { clearResult('Mfano umerudishwa. Kokotoa ili kupata matokeo mapya.'); }, 0); });
  element('hb-quote-form').addEventListener('reset', function () { window.setTimeout(function () { clearResult('Nukuu umerudishwa. Kokotoa ili kupata matokeo mapya.'); }, 0); });
  element('hb-copy').addEventListener('click', copySummary);
  element('hb-json').addEventListener('click', downloadJson);
  element('hb-save').addEventListener('click', saveLocal);
  element('hb-open-saved').addEventListener('click', openSaved);
  element('hb-pdf').addEventListener('click', downloadPdf);
  element('hb-print').addEventListener('click', function () { if (ensureResult()) window.print(); });
  element('hb-import-button').addEventListener('click', function () { element('hb-import').click(); });
  element('hb-import').addEventListener('change', importJson);
  element('hb-theme').addEventListener('change', function (event) { document.documentElement.dataset.theme = event.target.value; status.textContent = 'Mwonekano umebadilishwa bila kutuma data nje ya kifaa.'; });
  setCurrentExports(false);
})();
