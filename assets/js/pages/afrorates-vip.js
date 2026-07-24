(function () {
  'use strict';

  var engine = window.AfroTools && window.AfroTools.AfroRatesVerified;
  var root = document.querySelector('[data-afrorates-app]');
  if (!root || !engine) return;

  var language = root.dataset.locale || 'en';
  var text = {
    en: {
      checking: 'Checking the API and committed snapshot evidence.',
      ready: 'Evidence-gated API response',
      fallback: 'Committed snapshot fallback',
      apiDetail: 'The API returned only rows that passed the strict policy-rate evidence gate.',
      fallbackDetail: 'The API was unavailable or invalid. The bundled snapshot passed the same browser-side evidence gate.',
      blocked: 'Rates withheld',
      blockedDetail: 'Neither the API nor the committed snapshot supplied a policy-rate row with complete recent official-source evidence.',
      rows: 'verified rows', withheld: 'withheld rows', candidate: 'candidate rows',
      searchEmpty: 'No verified rows match this search.',
      csvDone: 'Reviewed CSV downloaded locally.', pdfDone: 'Reviewed PDF generated locally.',
      pdfMissing: 'The PDF helper is unavailable. Nothing was uploaded; use print to save a PDF.',
      source: 'Official source', checked: 'Checked', annual: 'World Bank annual CPI', unavailable: 'Unavailable'
    },
    fr: {
      checking: 'Vérification de l’API et des preuves du fichier publié.',
      ready: 'Réponse API filtrée par les preuves',
      fallback: 'Repli sur le fichier publié',
      apiDetail: 'L’API n’a renvoyé que les lignes ayant franchi le contrôle strict des preuves.',
      fallbackDetail: 'L’API était indisponible ou invalide. Le fichier local a franchi le même contrôle dans le navigateur.',
      blocked: 'Taux masqués',
      blockedDetail: 'Ni l’API ni le fichier publié ne fournissent une ligne avec des preuves officielles récentes et complètes.',
      rows: 'lignes vérifiées', withheld: 'lignes masquées', candidate: 'lignes candidates',
      searchEmpty: 'Aucune ligne vérifiée ne correspond à cette recherche.',
      csvDone: 'CSV vérifié téléchargé localement.', pdfDone: 'PDF vérifié créé localement.',
      pdfMissing: 'Le module PDF est indisponible. Aucune donnée n’a été envoyée ; utilisez l’impression pour enregistrer en PDF.',
      source: 'Source officielle', checked: 'Vérifié', annual: 'IPC annuel Banque mondiale', unavailable: 'Indisponible'
    },
    sw: {
      checking: 'Inakagua API na ushahidi wa faili iliyochapishwa.',
      ready: 'Jibu la API lililochujwa kwa ushahidi',
      fallback: 'Faili iliyochapishwa imetumika',
      apiDetail: 'API imerudisha safu zilizopita tu ukaguzi mkali wa ushahidi wa kiwango cha sera.',
      fallbackDetail: 'API haikupatikana au haikuwa sahihi. Faili ya ndani imepita ukaguzi huohuo kwenye kivinjari.',
      blocked: 'Viwango vimefichwa',
      blockedDetail: 'API na faili iliyochapishwa hazikuwa na safu yenye ushahidi rasmi, kamili na wa karibuni.',
      rows: 'safu zilizohakikiwa', withheld: 'safu zilizofichwa', candidate: 'safu za awali',
      searchEmpty: 'Hakuna safu iliyohakikiwa inayolingana na utafutaji.',
      csvDone: 'CSV iliyohakikiwa imepakuliwa kwenye kifaa.', pdfDone: 'PDF iliyohakikiwa imetengenezwa kwenye kifaa.',
      pdfMissing: 'Kifaa cha PDF hakipatikani. Hakuna data iliyotumwa; tumia print kuhifadhi PDF.',
      source: 'Chanzo rasmi', checked: 'Imehakikiwa', annual: 'Mfumuko wa mwaka wa Benki ya Dunia', unavailable: 'Haipatikani'
    }
  }[language] || null;

  var state = { rows: [], candidates: 0, source: '', timestamp: '' };
  var params = new URLSearchParams(location.search);
  var requestedCountry = String(params.get('country') || '').toUpperCase();
  var status = document.getElementById('ar-status');
  var body = document.getElementById('ar-body');
  var search = document.getElementById('ar-search');
  var sort = document.getElementById('ar-sort');
  var empty = document.getElementById('ar-empty');
  var csv = document.getElementById('ar-csv');
  var pdf = document.getElementById('ar-pdf');
  var actionStatus = document.getElementById('ar-action-status');

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
    });
  }

  function setText(id, value) {
    var element = document.getElementById(id);
    if (element) element.textContent = value;
  }

  function normalizeApi(payload) {
    if (!payload || !Array.isArray(payload.countries)) throw new Error('Invalid rates API response');
    var rows = payload.countries;
    var candidates = payload.coverage && Number(payload.coverage.candidate_count);
    if (!Number.isFinite(candidates)) candidates = rows.length;
    var dataset = {
      timestamp: payload.timestamp,
      countries: rows,
      _verification: { verified_codes: rows.map(function (row) { return row.code; }) }
    };
    var verified = engine.selectVerified(dataset, { maxAgeDays: 45 });
    if (!verified.length || verified.length !== rows.length) throw new Error('API response did not pass the client evidence gate');
    return { rows: verified, candidates: candidates, timestamp: payload.timestamp || '' };
  }

  function normalizeSnapshot(payload) {
    if (!payload || !Array.isArray(payload.countries)) throw new Error('Invalid rates snapshot');
    var rows = engine.selectVerified(payload, { maxAgeDays: 45 });
    if (!rows.length) throw new Error('No snapshot rows passed the evidence gate');
    return { rows: rows, candidates: payload.countries.length, timestamp: payload.timestamp || '' };
  }

  function visibleRows() {
    var query = search.value.trim().toLowerCase();
    var rows = state.rows.filter(function (row) {
      return (row.name + ' ' + row.code + ' ' + row.central_bank + ' ' + row.policy_rate_name).toLowerCase().includes(query);
    });
    var mode = sort.value;
    rows.sort(function (a, b) {
      if (mode === 'rate-desc') return b.policy_rate - a.policy_rate;
      if (mode === 'rate-asc') return a.policy_rate - b.policy_rate;
      if (mode === 'gap-desc') return (b.illustrative_gap == null ? -Infinity : b.illustrative_gap) - (a.illustrative_gap == null ? -Infinity : a.illustrative_gap);
      return a.name.localeCompare(b.name, language);
    });
    return rows;
  }

  function renderRows() {
    var rows = visibleRows();
    body.innerHTML = rows.map(function (row) {
      var inflation = row.annual_inflation;
      var gap = row.illustrative_gap;
      return '<tr>' +
        '<td data-label="' + escapeHtml(root.dataset.labelCountry) + '"><strong>' + escapeHtml(row.name) + '</strong><small>' + escapeHtml(row.code) + ' · ' + escapeHtml(row.currency) + '</small></td>' +
        '<td data-label="' + escapeHtml(root.dataset.labelBank) + '">' + escapeHtml(row.central_bank) + '<small>' + escapeHtml(row.policy_rate_name) + '</small></td>' +
        '<td data-label="' + escapeHtml(root.dataset.labelRate) + '">' + row.policy_rate.toFixed(2) + '%</td>' +
        '<td data-label="' + escapeHtml(root.dataset.labelInflation) + '">' + (inflation ? inflation.value.toFixed(2) + '%<small>' + escapeHtml(text.annual) + ' · ' + escapeHtml(inflation.year) + '</small>' : escapeHtml(text.unavailable)) + '</td>' +
        '<td data-label="' + escapeHtml(root.dataset.labelGap) + '"><span class="ar-gap" data-sign="' + (gap != null && gap < 0 ? 'negative' : 'positive') + '">' + (gap == null ? escapeHtml(text.unavailable) : gap.toFixed(2) + ' pp') + '</span><small>' + escapeHtml(root.dataset.gapShort) + '</small></td>' +
        '<td data-label="' + escapeHtml(root.dataset.labelEvidence) + '"><a href="' + escapeHtml(row.policy_rate_source_url) + '" target="_blank" rel="noopener">' + escapeHtml(text.source) + '</a><small>' + escapeHtml(row.policy_rate_source_date) + ' · ' + escapeHtml(text.checked) + ' ' + escapeHtml(String(row.policy_rate_verified_at).slice(0, 10)) + '</small></td>' +
        '</tr>';
    }).join('');
    empty.hidden = rows.length !== 0;
    empty.textContent = text.searchEmpty;
  }

  function renderSummary() {
    var rates = state.rows.map(function (row) { return row.policy_rate; });
    var gaps = state.rows.map(function (row) { return row.illustrative_gap; }).filter(Number.isFinite);
    setText('ar-verified', String(state.rows.length));
    setText('ar-withheld', String(Math.max(0, state.candidates - state.rows.length)));
    setText('ar-range', rates.length ? Math.min.apply(null, rates).toFixed(2) + '%–' + Math.max.apply(null, rates).toFixed(2) + '%' : text.unavailable);
    setText('ar-gap-count', String(gaps.length));
  }

  function accept(normalized, source) {
    state.rows = normalized.rows;
    state.candidates = normalized.candidates;
    state.timestamp = normalized.timestamp;
    state.source = source;
    if (requestedCountry) {
      var requestedRow = state.rows.find(function (row) { return row.code === requestedCountry; });
      if (requestedRow) search.value = requestedRow.name;
      requestedCountry = '';
    }
    status.dataset.state = source === 'api' ? 'ready' : 'fallback';
    status.innerHTML = '<strong>' + escapeHtml(source === 'api' ? text.ready : text.fallback) + '</strong><p>' +
      escapeHtml(source === 'api' ? text.apiDetail : text.fallbackDetail) + ' ' +
      state.rows.length + ' ' + escapeHtml(text.rows) + '; ' + Math.max(0, state.candidates - state.rows.length) + ' ' + escapeHtml(text.withheld) + '.</p>';
    csv.disabled = false;
    pdf.disabled = false;
    renderSummary();
    renderRows();
  }

  function block() {
    state.rows = [];
    status.dataset.state = 'blocked';
    status.innerHTML = '<strong>' + escapeHtml(text.blocked) + '</strong><p>' + escapeHtml(text.blockedDetail) + '</p>';
    csv.disabled = true;
    pdf.disabled = true;
    renderSummary();
    renderRows();
  }

  function loadSnapshot() {
    return fetch('/data/rates/latest.json', { cache: 'no-store' }).then(function (response) {
      if (!response.ok) throw new Error('Snapshot unavailable');
      return response.json();
    }).then(function (payload) { accept(normalizeSnapshot(payload), 'snapshot'); });
  }

  function load() {
    status.innerHTML = '<strong>' + escapeHtml(text.checking) + '</strong>';
    if ((location.hostname === '127.0.0.1' || location.hostname === 'localhost') && !window.__AFRORATES_FORCE_API__) {
      loadSnapshot().catch(block);
      return;
    }
    fetch('/api/rates?metric=policy_rate', { headers: { Accept: 'application/json' } }).then(function (response) {
      if (!response.ok) throw new Error('API unavailable');
      return response.json();
    }).then(function (payload) { accept(normalizeApi(payload), 'api'); }).catch(function () {
      return loadSnapshot().catch(block);
    });
  }

  function csvCell(value) { return '"' + String(value == null ? '' : value).replace(/"/g, '""') + '"'; }
  csv.addEventListener('click', function () {
    var rows = [['Country', 'Code', 'Central bank', 'Policy rate (%)', 'Benchmark', 'Decision date', 'Verified date', 'Official source', 'World Bank annual CPI (%)', 'CPI year', 'Illustrative gap (pp)']];
    state.rows.forEach(function (row) {
      rows.push([row.name, row.code, row.central_bank, row.policy_rate.toFixed(2), row.policy_rate_name, row.policy_rate_source_date, String(row.policy_rate_verified_at).slice(0, 10), row.policy_rate_source_url, row.annual_inflation ? row.annual_inflation.value.toFixed(2) : '', row.annual_inflation ? row.annual_inflation.year : '', row.illustrative_gap == null ? '' : row.illustrative_gap.toFixed(2)]);
    });
    var blob = new Blob([rows.map(function (row) { return row.map(csvCell).join(','); }).join('\n')], { type: 'text/csv;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = 'afrorates-reviewed-policy-rates.csv';
    link.click();
    URL.revokeObjectURL(url);
    actionStatus.textContent = text.csvDone;
  });

  pdf.addEventListener('click', async function () {
    if (!window.AfroTools || !window.AfroTools.pdf) {
      actionStatus.textContent = text.pdfMissing;
      return;
    }
    await window.AfroTools.pdf.generate({
      toolId: 'afrorates', category: 'financial', title: root.dataset.pdfTitle,
      subtitle: root.dataset.pdfSubtitle, noGate: true, skipGate: true,
      heroStats: [[root.dataset.summaryVerified, String(state.rows.length)], [root.dataset.summaryWithheld, String(Math.max(0, state.candidates - state.rows.length))], [root.dataset.summarySnapshot, String(state.timestamp).slice(0, 10) || text.unavailable]],
      sections: [{ title: root.dataset.tableTitle, rows: state.rows.map(function (row) { return [row.name + ' · ' + row.policy_rate_name, row.policy_rate.toFixed(2) + '% · ' + row.policy_rate_source_date]; }) }],
      source: root.dataset.pdfSource,
      disclaimer: root.dataset.pdfDisclaimer
    });
    actionStatus.textContent = text.pdfDone;
  });

  search.addEventListener('input', renderRows);
  sort.addEventListener('change', renderRows);
  if (requestedCountry) search.value = requestedCountry;
  if (params.get('metric') === 'inflation') sort.value = 'gap-desc';
  load();
})();
