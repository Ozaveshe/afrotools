(function (window, document) {
  'use strict';
  var api = window.AfroAtlasResearch;
  var payload = window.AfroAtlasResearchData;
  if (!api || !payload || !window.AfroAtlas) return;
  var model = api.create(payload.snapshot, window.AfroAtlas, payload.identities);
  var esc = api.escapeHtml;
  var base = '/tools/afroatlas/';
  var storeKey = 'afroatlas_shortlist_v1';
  var region = 'all';
  var saved = [];
  try { saved = model.shortlist(JSON.parse(window.localStorage.getItem(storeKey) || '[]')); } catch (_) {}
  var currentBrief = '';

  function $(id) { return document.getElementById(id); }
  function status(message) {
    var element = $('aa-workbench-status') || $('aa-country-status') || $('aa-compare-status');
    if (element) element.textContent = message;
  }
  function track(action, metadata) {
    var retries = 0;
    function send() {
      var analytics = window.AfroTools && window.AfroTools.analytics;
      if (analytics && analytics.track) analytics.track('afroatlas_' + action, Object.assign({ tool_id: 'afroatlas' }, metadata || {}));
      else if (retries++ < 20) window.setTimeout(send, 250);
    }
    send();
  }
  function flag(country, className) {
    return window.AfroAtlasFlags ? window.AfroAtlasFlags.flagHtml(country.code, country.name, className || '') : '';
  }
  function options(africanOnly, selected) {
    return Object.values(model.countries).filter(function (country) { return !africanOnly || country.african; })
      .sort(function (a, b) { return a.name.localeCompare(b.name); }).map(function (country) {
        return '<option value="' + country.code + '"' + (country.code === selected ? ' selected' : '') + '>'
          + esc(country.name) + (country.african ? '' : ' · world reference') + '</option>';
      }).join('');
  }
  function download(text, filename, type) {
    var blob = new Blob([text], { type: type + ';charset=utf-8' });
    var url = window.URL.createObjectURL(blob);
    var anchor = document.createElement('a');
    anchor.href = url; anchor.download = filename;
    document.body.appendChild(anchor); anchor.click(); anchor.remove();
    window.setTimeout(function () { window.URL.revokeObjectURL(url); }, 1000);
  }
  function compareUrl(a, b) { return base + 'compare?a=' + encodeURIComponent(a) + '&b=' + encodeURIComponent(b); }
  function renderShortlist() {
    var tray = $('aa-shortlist');
    var restoreFocus = tray && tray.contains(document.activeElement);
    var focusedCode = restoreFocus && document.activeElement.getAttribute('data-aa-shortlist');
    document.querySelectorAll('[data-aa-shortlist]').forEach(function (button) {
      var code = button.getAttribute('data-aa-shortlist');
      var country = model.countries[code];
      if (!country || !country.african) return;
      var included = saved.indexOf(code) !== -1;
      button.hidden = false; button.setAttribute('aria-pressed', String(included));
      button.textContent = (included ? 'Remove ' : 'Shortlist ') + country.name;
    });
    if (!tray) return;
    if (!saved.length) {
      tray.innerHTML = '<p>Shortlist up to four countries to keep your research together. Saved on this browser.</p>';
      if (restoreFocus) { tray.setAttribute('tabindex', '-1'); tray.focus(); }
      return;
    }
    tray.innerHTML = '<h3>Your shortlist <span>(' + saved.length + '/4)</span></h3><ul class="aa-shortlist-list">'
      + saved.map(function (code) { var country = model.countries[code]; return '<li><a href="' + base + 'country/' + country.slug + '/">' + flag(country) + esc(country.name) + '</a><button class="btn btn-ghost" type="button" data-aa-shortlist="' + code + '" aria-label="Remove ' + esc(country.name) + ' from shortlist">Remove</button></li>'; }).join('')
      + '</ul><div class="aa-actions">' + (saved.length >= 2 ? '<a class="btn btn-primary" href="' + compareUrl(saved[0], saved[1]) + '">Compare first two countries</a>' : '')
      + '<button class="btn btn-secondary" id="aa-shortlist-csv" type="button">Download shortlist CSV</button><button class="btn btn-ghost" id="aa-shortlist-clear" type="button">Clear shortlist</button></div>';
    if (restoreFocus) {
      var next = focusedCode && tray.querySelector('[data-aa-shortlist="' + focusedCode + '"]');
      (next || tray.querySelector('[data-aa-shortlist]') || tray.querySelector('button')).focus();
    }
  }
  function saveShortlist(code) {
    if (!model.countries[code] || !model.countries[code].african) return;
    var existing = saved.indexOf(code);
    if (existing === -1 && saved.length >= 4) { status('Your shortlist has four countries. Remove one before adding another.'); return; }
    if (existing === -1) saved.push(code); else saved.splice(existing, 1);
    var persisted = false;
    try { window.localStorage.setItem(storeKey, JSON.stringify(saved)); persisted = true; } catch (_) {}
    renderShortlist();
    status((existing === -1 ? model.countries[code].name + ' shortlisted.' : model.countries[code].name + ' removed.')
      + (persisted ? ' Saved on this browser.' : ' Browser storage is unavailable; this selection lasts for this page visit.'));
    if (existing === -1) track('shortlist_save', { country_code: code, count: saved.length });
  }
  document.addEventListener('click', function (event) {
    var button = event.target.closest('[data-aa-shortlist]');
    if (button) { event.preventDefault(); saveShortlist(button.getAttribute('data-aa-shortlist')); return; }
    var csvButton = event.target.closest('[data-aa-csv]');
    if (csvButton) {
      var code = csvButton.getAttribute('data-aa-csv');
      if (model.countries[code]) { download(model.csv([code]), 'afroatlas-' + model.countries[code].slug + '.csv', 'text/csv'); track('data_export', { country_code: code, format: 'csv' }); status('CSV downloaded with observation years and source URLs.'); }
    }
    if (event.target.closest('#aa-shortlist-csv')) { download(model.csv(saved), 'afroatlas-shortlist.csv', 'text/csv'); track('data_export', { count: saved.length, format: 'csv' }); }
    if (event.target.closest('#aa-shortlist-clear')) {
      saved = [];
      try { window.localStorage.removeItem(storeKey); } catch (_) {}
      renderShortlist(); status('Shortlist cleared.');
    }
  });

  function renderDiscovery() {
    var grid = $('aa-grid'); if (!grid) return;
    var sort = $('aa-sort').value;
    var query = $('aa-search').value;
    var countries = model.discover({ query: query, region: region, sort: sort, resource: $('aa-resource').value });
    var pair = model.compareQuery(query);
    var hint = $('aa-compare-hint');
    hint.hidden = !pair;
    if (pair) hint.innerHTML = '<a class="btn btn-primary" href="' + compareUrl(pair.a, pair.b) + '">Compare ' + esc(model.countries[pair.a].name) + ' with ' + esc(model.countries[pair.b].name) + '</a>';
    $('aa-result-count').textContent = countries.length + ' countries' + (pair ? ' in your comparison' : '')
      + (sort !== 'name' ? ' · latest available ' + payload.snapshot.definitions[sort].label.toLowerCase() + '; years may vary' : '');
    grid.innerHTML = countries.map(function (country) {
      var metric = sort === 'name' ? 'gdp' : sort;
      var point = model.point(country.code, metric);
      var resources = Array.from(new Set(country.resources.map(function (row) { return window.AfroAtlas.RESOURCE_TYPES[row.type] ? window.AfroAtlas.RESOURCE_TYPES[row.type].label : row.type; }))).slice(0, 3).join(' · ');
      return '<article class="aa-card" data-aa-country="' + country.code + '"><a class="aa-country-link" href="' + base + 'country/' + country.slug + '/"><div class="aa-card-top">'
        + flag(country, 'aa-card-flag') + '<div class="aa-card-info"><h3 class="aa-card-name">' + esc(country.name) + '</h3><span class="aa-card-region">' + esc(country.region) + '</span></div></div>'
        + '<p class="aa-card-stat">' + payload.snapshot.definitions[metric].label + ' <strong>' + (point ? esc(api.format(metric, point.value, true)) + ' <small>(' + point.year + ')</small>' : 'N/A') + '</strong></p>'
        + '<p class="aa-card-res">' + esc(resources || 'Resource references limited') + '</p><span class="aa-open-label">Open country profile →</span></a>'
        + '<button class="btn btn-ghost aa-shortlist-button" type="button" data-aa-shortlist="' + country.code + '"></button></article>';
    }).join('') || '<div class="aa-empty"><p>No countries match these filters.</p><button class="btn btn-secondary" type="button" id="aa-reset-empty">Reset filters</button></div>';
    renderShortlist();
  }
  function resetFilters() {
    region = 'all'; $('aa-search').value = ''; $('aa-resource').value = '';
    document.querySelectorAll('[data-aa-region]').forEach(function (button) { button.setAttribute('aria-pressed', String(button.getAttribute('data-aa-region') === 'all')); });
    renderDiscovery();
  }
  if ($('aa-grid')) {
    $('aa-search').addEventListener('input', renderDiscovery);
    $('aa-search').addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        var pair = model.compareQuery(event.target.value);
        if (pair) window.location.assign(compareUrl(pair.a, pair.b));
      }
    });
    $('aa-sort').addEventListener('change', renderDiscovery);
    $('aa-resource').addEventListener('change', renderDiscovery);
    document.querySelectorAll('[data-aa-region]').forEach(function (button) {
      button.addEventListener('click', function () {
        region = button.getAttribute('data-aa-region');
        document.querySelectorAll('[data-aa-region]').forEach(function (other) { other.setAttribute('aria-pressed', String(other === button)); });
        renderDiscovery();
      });
    });
    $('aa-reset').addEventListener('click', resetFilters);
    $('aa-grid').addEventListener('click', function (event) { if (event.target.closest('#aa-reset-empty')) resetFilters(); });
    Object.keys(window.AfroAtlas.RESOURCE_TYPES).forEach(function (key) {
      var option = document.createElement('option'); option.value = key; option.textContent = window.AfroAtlas.RESOURCE_TYPES[key].label; $('aa-resource').appendChild(option);
    });
    var requestedResource = new URLSearchParams(window.location.search).get('resource');
    if (window.AfroAtlas.RESOURCE_TYPES[requestedResource]) $('aa-resource').value = requestedResource;
    document.querySelectorAll('[data-aa-preset]').forEach(function (button) {
      button.addEventListener('click', function () { $('aa-sort').value = button.getAttribute('data-aa-preset'); resetFilters(); });
    });
    renderDiscovery();
  }

  function buildBrief(userAction) {
    var country = $('aa-brief-country'); if (!country) return;
    if (!model.countries[country.value] || !model.countries[country.value].african) {
      $('aa-brief-text').value = '';
      $('aa-brief-status').textContent = 'Choose a country to build a brief.';
      $('aa-brief-profile').hidden = true;
      return false;
    }
    currentBrief = model.brief(country.value, $('aa-brief-angle').value);
    $('aa-brief-text').value = currentBrief;
    var notes = $('aa-brief-notes');
    if (notes && notes.value.trim()) $('aa-brief-text').value += '\n\nMy research notes (unverified):\n' + notes.value.trim();
    $('aa-brief-status').textContent = 'Brief ready with observation years, source URLs and questions to investigate.';
    $('aa-brief-profile').href = base + 'country/' + model.countries[country.value].slug + '/';
    $('aa-brief-profile').textContent = 'Open ' + model.countries[country.value].name + ' profile';
    $('aa-brief-profile').hidden = false;
    if (userAction) track('brief_generate', { country_code: country.value, purpose: $('aa-brief-angle').value });
    return true;
  }
  if ($('aa-brief-country')) {
    var requested = new URLSearchParams(window.location.search).get('country');
    var initial = model.resolve(requested, true) || 'NG';
    $('aa-brief-country').innerHTML = options(true, initial);
    $('aa-brief-angle').innerHTML = Object.keys(api.purposes).map(function (key) { return '<option value="' + key + '">' + api.purposes[key].label + '</option>'; }).join('');
    $('aa-brief-generate').addEventListener('click', function () { buildBrief(true); });
    $('aa-brief-country').addEventListener('change', function () { buildBrief(false); });
    $('aa-brief-angle').addEventListener('change', function () { buildBrief(false); });
    $('aa-brief-notes').addEventListener('input', function () { buildBrief(false); });
    $('aa-brief-download').addEventListener('click', function () {
      if (!buildBrief(false)) return;
      download($('aa-brief-text').value, 'afroatlas-' + model.countries[$('aa-brief-country').value].slug + '-brief.txt', 'text/plain');
      $('aa-brief-status').textContent = 'Research brief downloaded.'; track('brief_export', { country_code: $('aa-brief-country').value, format: 'txt' });
    });
    $('aa-brief-copy').addEventListener('click', function () {
      if (!buildBrief(false)) return;
      function unavailable() { $('aa-brief-text').focus(); $('aa-brief-text').select(); $('aa-brief-status').textContent = 'Clipboard unavailable. The brief is selected; use your browser’s Copy command.'; }
      if (!navigator.clipboard || !navigator.clipboard.writeText) { unavailable(); return; }
      navigator.clipboard.writeText($('aa-brief-text').value).then(function () { $('aa-brief-status').textContent = 'Research brief copied.'; track('brief_export', { country_code: $('aa-brief-country').value, format: 'copy' }); }).catch(unavailable);
    });
    buildBrief(false);
  }

  if ($('aa-country-page')) {
    var code = $('aa-country-page').getAttribute('data-aa-code');
    document.querySelectorAll('[data-aa-csv]').forEach(function (button) { button.hidden = false; });
    track('country_open', { country_code: code });
  }

  function comparisonSource(code) {
    return esc(model.countries[code].name) + ': ' + ['gdp', 'population', 'gdpPC'].map(function (key) {
      var point = model.point(code, key); var label = key === 'gdpPC' ? 'GDP/person' : key === 'gdp' ? 'GDP' : 'population';
      return point ? '<a href="' + point.source_url + '">' + label + ' ' + point.year + '</a>' : label + ' unavailable (2016–2025)';
    }).join(' · ');
  }
  function renderComparison() {
    var a = $('aa-sel-a').value; var b = $('aa-sel-b').value; var mode = $('aa-year-mode').value;
    if (a === b) { $('aa-comparison-title').textContent = 'Compare two countries'; $('aa-compare-status').textContent = 'Choose two different countries.'; $('aa-comparison-result').innerHTML = ''; return false; }
    var first = model.countries[a]; var second = model.countries[b];
    $('aa-comparison-title').textContent = first.name + ' vs ' + second.name;
    var rows = Object.keys(payload.snapshot.definitions).map(function (key) {
      var row = model.comparison(a, b, key, mode);
      var definition = payload.snapshot.definitions[key];
      function cell(point) { return point ? '<strong>' + esc(api.format(key, point.value, true)) + '</strong><a href="' + point.source_url + '">WDI ' + point.year + '</a>' : '<strong>N/A</strong><span>No observation</span>'; }
      var gap = '';
      if (row.comparable) {
        var difference = row.a.value - row.b.value;
        var amount = ['growth', 'electricity', 'internet'].includes(key)
          ? Math.abs(difference).toLocaleString('en-US', { maximumFractionDigits: 1 }) + ' percentage points'
          : api.format(key, Math.abs(difference), true);
        gap = difference === 0 ? 'Same value' : (difference > 0 ? first.name : second.name) + ' is ' + amount + ' higher';
      }
      return '<tr class="aa-cmp-metric"><th scope="row">' + definition.label + '<small>' + definition.unit + '</small></th><td><span class="aa-mobile-label" aria-hidden="true">' + esc(first.name) + '</span>' + cell(row.a) + '</td><td><span class="aa-mobile-label" aria-hidden="true">' + esc(second.name) + '</span>' + cell(row.b) + '</td><td class="aa-comparison-reading"><span class="aa-mobile-label" aria-hidden="true">Reading the difference</span>' + (row.comparable ? esc(row.note) + '<small>' + gap + '</small>' : 'No comparable pair<small>' + esc(row.note) + '</small>') + '</td></tr>';
    }).join('');
    var html = '<p class="aa-cmp-source-note">' + comparisonSource(a) + '; ' + comparisonSource(b) + '. All nine measures use the dated WDI snapshot.</p>'
      + '<div class="aa-table-wrap" tabindex="0" role="region" aria-label="Country comparison table"><table class="aa-data-table aa-comparison-table"><caption>' + esc(first.name) + ' and ' + esc(second.name) + ' · ' + (mode === 'latest' ? 'latest observations' : 'latest shared year per indicator') + '</caption>'
      + '<thead><tr><th scope="col">Indicator</th><th scope="col">' + flag(first) + esc(first.name) + '</th><th scope="col">' + flag(second) + esc(second.name) + '</th><th scope="col">Reading the difference</th></tr></thead><tbody>' + rows + '</tbody></table></div>'
      + '<p class="aa-data-note">Larger values are not an overall country score. GDP is nominal, real growth is an annual change, and national coverage does not describe local service quality. <a href="' + base + 'sources/">Read the comparison method</a>.</p>'
      + '<div class="aa-actions"><button class="btn btn-primary" id="aa-compare-csv" type="button">Download comparison CSV</button><button class="btn btn-secondary" id="aa-share-btn" type="button">Copy comparison link</button>'
      + [first, second].filter(function (country) { return country.african; }).map(function (country) { return '<a class="btn btn-secondary" href="' + base + 'country/' + country.slug + '/">' + esc(country.name) + ' profile</a>'; }).join('') + '</div>';
    $('aa-comparison-result').innerHTML = html;
    var url = compareUrl(a, b) + (mode === 'latest' ? '&mode=latest' : '');
    window.history.replaceState(null, '', url);
    $('aa-compare-status').textContent = 'Comparison ready. ' + (mode === 'latest' ? 'Different observation years are labeled.' : 'Each indicator uses its latest shared year where available.');
    $('aa-share-btn').addEventListener('click', function () {
      if (!navigator.clipboard || !navigator.clipboard.writeText) { status('Copy this URL from the address bar: ' + window.location.href); return; }
      navigator.clipboard.writeText(window.location.href).then(function () { status('Comparison link copied.'); track('comparison_share', { country_a: a, country_b: b }); }).catch(function () { status('Clipboard unavailable. Copy the URL from your address bar.'); });
    });
    $('aa-compare-csv').addEventListener('click', function () {
      // The export uses exactly the observations shown in the comparison, including matched years and honest gaps.
      var csv = [['indicator', 'unit', 'country_a', 'value_a', 'year_a', 'source_a', 'country_b', 'value_b', 'year_b', 'source_b', 'comparison_note', 'retrieved_at']];
      Object.keys(payload.snapshot.definitions).forEach(function (key) {
        var row = model.comparison(a, b, key, mode); var definition = payload.snapshot.definitions[key];
        csv.push([definition.label, definition.unit, first.name, row.a ? row.a.value : '', row.a ? row.a.year : '', row.a ? row.a.source_url : '', second.name, row.b ? row.b.value : '', row.b ? row.b.year : '', row.b ? row.b.source_url : '', row.note, payload.snapshot.retrieved_at]);
      });
      download(csv.map(function (row) { return row.map(function (cell) { return '"' + String(cell).replace(/"/g, '""') + '"'; }).join(','); }).join('\r\n'), 'afroatlas-' + a.toLowerCase() + '-vs-' + b.toLowerCase() + '.csv', 'text/csv');
      track('data_export', { country_a: a, country_b: b, format: 'csv' });
    });
    return true;
  }
  if ($('aa-compare-page')) {
    var params = new URLSearchParams(window.location.search);
    var a = model.resolve(params.get('a') || params.get('countryA')) || 'NG';
    var b = model.resolve(params.get('b') || params.get('countryB')) || 'KE';
    var invalid = (params.has('a') || params.has('countryA')) && !model.resolve(params.get('a') || params.get('countryA'))
      || (params.has('b') || params.has('countryB')) && !model.resolve(params.get('b') || params.get('countryB'));
    $('aa-sel-a').innerHTML = options(false, a); $('aa-sel-b').innerHTML = options(false, b);
    $('aa-year-mode').value = params.get('mode') === 'latest' ? 'latest' : 'common';
    $('aa-compare-form').addEventListener('submit', function (event) { event.preventDefault(); if (renderComparison()) track('compare_view', { country_a: $('aa-sel-a').value, country_b: $('aa-sel-b').value, year_mode: $('aa-year-mode').value }); });
    $('aa-year-mode').addEventListener('change', renderComparison);
    if (invalid) { $('aa-compare-status').textContent = 'This link contains an unknown country. Choose two countries to continue.'; }
    else { renderComparison(); if (a !== b) track('compare_view', { country_a: a, country_b: b, year_mode: $('aa-year-mode').value }); }
  }

  function renderRankings() {
    var key = $('aa-ranking-metric').value; var year = $('aa-ranking-year').value || null;
    var definition = payload.snapshot.definitions[key];
    var countries = model.discover({ sort: key, year: year }).filter(function (country) { return model.point(country.code, key, year); });
    $('aa-ranking-table').innerHTML = '<div class="aa-table-wrap" tabindex="0" role="region" aria-label="African country ranking table"><table class="aa-data-table"><caption>' + definition.label + ' · ' + (year || 'latest available observations') + '</caption><thead><tr><th scope="col">Rank</th><th scope="col">Country</th><th scope="col">Value</th><th scope="col">Year and source</th></tr></thead><tbody>'
      + countries.map(function (country, index) { var point = model.point(country.code, key, year); return '<tr><td>' + (index + 1) + '</td><th scope="row"><a href="' + base + 'country/' + country.slug + '/">' + esc(country.name) + '</a></th><td>' + esc(api.format(key, point.value, true)) + '</td><td><a href="' + point.source_url + '">' + point.year + ' · WDI</a></td></tr>'; }).join('') + '</tbody></table></div>';
    $('aa-ranking-status').textContent = countries.length + '/54 countries have an observation for this view. Missing observations are excluded, not ranked as zero.';
    var url = base + 'rankings?metric=' + key + (year ? '&year=' + year : '');
    window.history.replaceState(null, '', url);
    $('aa-ranking-download').onclick = function () { download(model.csv(countries.map(function (country) { return country.code; }), year), 'afroatlas-ranking-data.csv', 'text/csv'); track('data_export', { count: countries.length, metric: key, format: 'csv' }); };
  }
  if ($('aa-ranking-table')) {
    var rankParams = new URLSearchParams(window.location.search);
    var keys = Object.keys(payload.snapshot.definitions);
    $('aa-ranking-metric').innerHTML = keys.map(function (key) { return '<option value="' + key + '">' + payload.snapshot.definitions[key].label + '</option>'; }).join('');
    $('aa-ranking-metric').value = keys.includes(rankParams.get('metric')) ? rankParams.get('metric') : 'gdp';
    for (var year = payload.snapshot.last_year; year >= payload.snapshot.first_year; year -= 1) { var option = document.createElement('option'); option.value = String(year); option.textContent = String(year); $('aa-ranking-year').appendChild(option); }
    var requestedYear = Number(rankParams.get('year'));
    if (Number.isInteger(requestedYear) && requestedYear >= payload.snapshot.first_year && requestedYear <= payload.snapshot.last_year) $('aa-ranking-year').value = String(requestedYear);
    var oldResource = rankParams.get('resource');
    if (window.AfroAtlas.RESOURCE_TYPES[oldResource]) {
      var resourceNote = document.createElement('p');
      resourceNote.className = 'aa-data-note';
      resourceNote.innerHTML = 'Production rankings for ' + esc(window.AfroAtlas.RESOURCE_TYPES[oldResource].label.toLowerCase()) + ' need verified observation dates. <a href="' + base + '?resource=' + encodeURIComponent(oldResource) + '#countries">Explore countries with this resource reference</a>. The table below uses dated World Bank indicators.';
      $('aa-ranking-table').before(resourceNote);
    }
    $('aa-ranking-metric').addEventListener('change', renderRankings); $('aa-ranking-year').addEventListener('change', renderRankings);
    renderRankings();
  }
  renderShortlist();
}(window, document));
