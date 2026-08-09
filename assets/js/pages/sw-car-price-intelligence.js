(function initSwCarPriceIntelligence() {
  'use strict';
  if (document.documentElement.lang !== 'sw' || location.pathname !== '/sw/zana/bei-na-akili-ya-gari/') return;

  var Price = window.AfroCarPriceIntelligence;
  var Import = window.AfroCarImportCost;
  var Gate = window.AfroCarPriceFreshnessGate;
  var form = document.getElementById('swCarFilters');
  if (!Price || !Import || !Gate || !form) return;

  var state = { data: null, importData: null, evidence: null, contexts: [], current: null, receipt: null };
  var WATCH_KEY = 'afrotools.sw.car-price.watchlist.v1';
  var $ = function byId(id) { return document.getElementById(id); };
  var names = {
    Nigeria: 'Nigeria', Kenya: 'Kenya', Ghana: 'Ghana', Uganda: 'Uganda', Zambia: 'Zambia', Tanzania: 'Tanzania',
    'South Africa': 'Afrika Kusini', Egypt: 'Misri', Morocco: 'Moroko', "Cote d'Ivoire": "Côte d'Ivoire",
    Senegal: 'Senegal', Cameroon: 'Kamerun', Ethiopia: 'Ethiopia', Rwanda: 'Rwanda', Angola: 'Angola',
    Algeria: 'Algeria', Tunisia: 'Tunisia', Mozambique: 'Msumbiji', Botswana: 'Botswana', Namibia: 'Namibia'
  };
  var labels = { sedan: 'Sedan', suv: 'SUV', pickup: 'Pick-up', hatchback: 'Hatchback', mpv: 'MPV', wagon: 'Wagon', coupe: 'Coupé', van: 'Van', truck: 'Lori' };

  function text(value) { return String(value == null ? '' : value); }
  function esc(value) { return text(value).replace(/[&<>"']/g, function replace(char) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]; }); }
  function uniq(values) { return values.filter(function unique(value, index) { return value && values.indexOf(value) === index; }); }
  function moneyBand(band) { return band.map(function round(value) { return '$' + Math.round(Number(value) || 0).toLocaleString('en-US'); }).join(' – '); }
  function dateLabel(value) { var date = new Date(value || ''); return Number.isNaN(date.getTime()) ? 'Tarehe haipo' : date.toISOString().slice(0, 10); }

  function option(value, label) { return '<option value="' + esc(value) + '">' + esc(label) + '</option>'; }
  function fillSelect(id, rows, initial) {
    var select = $(id);
    select.innerHTML = rows.map(function row(item) { return option(item[0], item[1]); }).join('');
    if (initial != null) select.value = initial;
  }

  function readWatchlist() {
    try { var parsed = JSON.parse(localStorage.getItem(WATCH_KEY) || '[]'); return Array.isArray(parsed) ? parsed : []; }
    catch (error) { return []; }
  }
  function writeWatchlist(rows) { try { localStorage.setItem(WATCH_KEY, JSON.stringify(rows.slice(0, 30))); } catch (error) {} }

  function loadJson(url) {
    return fetch(url, { cache: 'no-store', credentials: 'same-origin' }).then(function responseJson(response) {
      if (!response.ok) throw new Error('Faili ya ndani haikupatikana: ' + url);
      return response.json();
    });
  }

  function loadImportData() {
    return loadJson('/data/trade/car-import-cost-core.json').then(function coreLoaded(core) {
      var packs = Object.keys(core.countryPackFiles || {}).map(function loadPack(key) { return loadJson(core.countryPackFiles[key]); });
      return Promise.all(packs.concat([loadJson('/data/forex/latest.json')])).then(function merge(rows) {
        var fx = rows.pop();
        return Import.mergeData(core, rows, fx && fx.rates || {});
      });
    });
  }

  function populate() {
    var countries = Object.keys(state.data.countries).map(function countryRow(code) {
      var country = state.data.countries[code];
      return [country.slug, (names[country.name] || country.name) + ' (' + country.currency_code + ')'];
    });
    fillSelect('swCarCountry', countries, 'kenya');
    fillSelect('swCarMake', [['', 'Watengenezaji wote']].concat(uniq(state.data.vehicles.map(function vehicleMake(vehicle) { return vehicle.makeSlug + '|' + vehicle.make; })).map(function makeRow(value) { var parts = value.split('|'); return [parts[0], parts[1]]; })), '');
    fillSelect('swCarBody', [['', 'Aina zote']].concat(uniq(state.data.vehicles.map(function body(vehicle) { return vehicle.body; })).map(function bodyRow(value) { return [value, labels[value] || value]; })), '');
    fillSelect('swCarFuel', [['', 'Mafuta yote'], ['petrol', 'Petroli'], ['diesel', 'Dizeli'], ['hybrid', 'Mseto'], ['ev', 'Umeme']], '');
    fillSelect('swCarSource', [['', 'Vyanzo vyote'], ['japan', 'Japani'], ['uae', 'UAE'], ['uk', 'Uingereza'], ['south-africa', 'Afrika Kusini'], ['local-dealer', 'Muuzaji wa ndani']], '');
  }

  function validateFilters(filters) {
    var numeric = ['maxBudgetLocal', 'maxMonthlyLocal', 'maxRisk', 'minLiquidity'];
    var invalid = numeric.some(function invalidField(key) { return filters[key] !== '' && (!Number.isFinite(Number(filters[key])) || Number(filters[key]) < 0); });
    if (Number(filters.maxRisk) > 100 || Number(filters.minLiquidity) > 100) invalid = true;
    $('swCarError').textContent = invalid ? 'Sahihisha namba: tumia sifuri au zaidi, na alama ziwe kati ya 0 na 100.' : '';
    return !invalid;
  }

  function filtersFromForm() {
    var filters = {};
    new FormData(form).forEach(function each(value, key) { filters[key] = text(value).trim(); });
    return filters;
  }

  function contextAssessment(context) { return Gate.assess(state.data, context, state.evidence, new Date()); }

  function filteredContexts(filters) {
    var country = Price.getCountry(state.data, filters.country || 'kenya');
    var fx = state.importData.fxRates && state.importData.fxRates[country.currency_code] || 1;
    var engineFilters = {
      country: country.slug, q: filters.q, make: filters.make, body: filters.body, fuel: filters.fuel,
      sourceMarket: filters.sourceMarket, eligibility: filters.eligibility
    };
    if (filters.maxBudgetLocal) engineFilters.maxLanded = Number(filters.maxBudgetLocal) / fx;
    if (filters.maxRisk) engineFilters.maxRisk = Number(filters.maxRisk);
    if (filters.minLiquidity) engineFilters.minLiquidity = Number(filters.minLiquidity);
    var rows = Price.filterVehicles(state.data, engineFilters, state.importData);
    if (filters.maxMonthlyLocal) rows = rows.filter(function finance(row) {
      var offer = row._context && row._context.financing && row._context.financing.bestOffer;
      return offer && offer.monthlyPaymentLocal <= Number(filters.maxMonthlyLocal);
    });
    return rows.map(function context(row) { return row._context; });
  }

  function renderFreshness(assessment) {
    var box = $('swCarFreshness');
    box.innerHTML = '<strong>Data ya bei imepitwa na muda — hatua za bei zimezuiwa.</strong>'
      + '<span>Kifurushi: ' + esc(assessment.ages.dataset) + ' siku; chanzo: ' + esc(assessment.ages.source) + ' siku; soko la ndani: ' + esc(assessment.ages.local) + ' siku. Kikomo ni ' + esc(assessment.limitDays) + ' siku. Endpoints 3 kati ya 6 pia zinahitaji ukaguzi wa mikono.</span>';
  }

  function buildReceipt(context, assessment) { return Gate.evidenceRow(context, assessment); }

  function renderCurrent(context) {
    state.current = context;
    var assessment = contextAssessment(context);
    state.receipt = buildReceipt(context, assessment);
    renderFreshness(assessment);
    $('swCarVehicle').textContent = state.receipt.vehicle;
    $('swCarMarket').textContent = names[context.country.name] || context.country.name;
    $('swCarSourceBand').textContent = moneyBand(state.receipt.sourceBandUsd);
    $('swCarLocalBand').textContent = moneyBand(state.receipt.localBandUsd);
    $('swCarSourceDate').textContent = dateLabel(state.receipt.sourceCollectedAt) + ' · ' + context.sourcePrice.confidence;
    $('swCarLocalDate').textContent = dateLabel(state.receipt.localCollectedAt) + ' · ' + context.localPrice.confidence;
    $('swCarDecision').textContent = 'Pendekezo, gharama iliyofika, finance fit na hatua ya kununua zimezuiwa. Thibitisha nukuu ya sasa, ushuru, hali ya gari na gharama za bandari kabla ya kufanya uamuzi.';
    var hero = context.media && context.media.hero;
    $('swCarArtwork').src = hero && hero.imageUrl || '/assets/img/tools/car-price-intelligence.webp';
    $('swCarArtwork').alt = hero && hero.alt || ('Mchoro wa ' + state.receipt.vehicle);
    renderComparison(context);
    var watch = readWatchlist();
    $('swCarWatch').textContent = watch.some(function saved(row) { return row.vehicle === state.receipt.vehicle && row.countryCode === state.receipt.countryCode; }) ? 'Ipo kwenye orodha ya kifaa' : 'Ongeza kwenye orodha ya kifaa';
  }

  function renderComparison(context) {
    $('swCarCompare').innerHTML = context.sourceComparison.map(function source(row) {
      return '<tr><td>' + esc(row.label) + '</td><td>' + esc(moneyBand([row.price.min, row.price.median, row.price.max])) + '</td><td>' + esc(dateLabel(row.price.lastUpdated)) + '</td><td>' + esc(row.confidence) + '</td></tr>';
    }).join('');
  }

  function renderMatches(contexts) {
    state.contexts = contexts;
    var list = $('swCarMatches');
    if (!contexts.length) { list.innerHTML = '<li>Hakuna rekodi inayolingana. Weka vichujio upya.</li>'; return; }
    list.innerHTML = contexts.slice(0, 12).map(function match(context, index) {
      var assessment = contextAssessment(context);
      return '<li><strong>' + esc(context.vehicle.year + ' ' + context.vehicle.make + ' ' + context.vehicle.model) + '</strong><small>'
        + esc(names[context.country.name] || context.country.name) + ' · ' + esc(context.sourceMarket) + ' · chanzo ' + esc(dateLabel(assessment.sourceDate))
        + ' · ' + esc(context.sourcePrice.confidence) + ' · IMEZUIWA</small><button class="sw-car-button secondary" type="button" data-sw-car-select="' + index + '">Kagua rekodi</button></li>';
    }).join('');
    Array.prototype.forEach.call(list.querySelectorAll('[data-sw-car-select]'), function bind(button) {
      button.addEventListener('click', function select() { renderCurrent(contexts[Number(button.getAttribute('data-sw-car-select'))]); $('swCarResultTitle').focus && $('swCarResultTitle').focus(); });
    });
  }

  function run() {
    var filters = filtersFromForm();
    if (!validateFilters(filters)) {
      state.current = null;
      state.receipt = null;
      ['swCarVehicle', 'swCarMarket', 'swCarSourceBand', 'swCarLocalBand', 'swCarSourceDate', 'swCarLocalDate'].forEach(function blank(id) { $(id).textContent = '—'; });
      $('swCarCompare').innerHTML = '';
      $('swCarDecision').textContent = 'Hakuna rekodi halali ya kuonyesha.';
      $('swCarMatches').innerHTML = '';
      return;
    }
    var contexts = filteredContexts(filters);
    renderMatches(contexts);
    if (contexts[0]) renderCurrent(contexts[0]);
  }

  function csvEscape(value) { var raw = Array.isArray(value) ? value.join('|') : text(value); return /[",\r\n]/.test(raw) ? '"' + raw.replace(/"/g, '""') + '"' : raw; }
  function receiptText() {
    var row = state.receipt;
    return ['AfroTools — risiti ya ushahidi wa bei ya gari', 'Gari: ' + row.vehicle, 'Nchi: ' + row.country, 'Soko la chanzo: ' + row.sourceMarket,
      'Safu ya chanzo USD: ' + row.sourceBandUsd.join(' / '), 'Tarehe ya chanzo: ' + row.sourceCollectedAt,
      'Safu ya ndani USD: ' + row.localBandUsd.join(' / '), 'Tarehe ya ndani: ' + row.localCollectedAt,
      'Hali: IMEZUIWA — si bei ya sasa wala pendekezo.', row.disclaimer].join('\n');
  }
  function download(content, type, filename) {
    var link = document.createElement('a');
    var url = URL.createObjectURL(new Blob([content], { type: type }));
    link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove();
    setTimeout(function revoke() { URL.revokeObjectURL(url); }, 0);
  }
  function exportReceipt(format) {
    if (!state.receipt) { $('swCarExportStatus').textContent = 'Chagua rekodi kwanza.'; return; }
    if (format === 'json') download(JSON.stringify(state.receipt, null, 2), 'application/json', 'afrotools-ushahidi-bei-gari.json');
    if (format === 'txt') download(receiptText(), 'text/plain;charset=utf-8', 'afrotools-ushahidi-bei-gari.txt');
    if (format === 'csv') {
      var keys = Object.keys(state.receipt); var csv = keys.join(',') + '\n' + keys.map(function value(key) { return csvEscape(state.receipt[key]); }).join(',') + '\n';
      download(csv, 'text/csv;charset=utf-8', 'afrotools-ushahidi-bei-gari.csv');
    }
    $('swCarExportStatus').textContent = 'Risiti ya ' + format.toUpperCase() + ' imepakuliwa; ina hali ya data iliyozuiwa.';
  }

  form.addEventListener('submit', function submit(event) { event.preventDefault(); run(); });
  form.addEventListener('reset', function reset() { setTimeout(function afterReset() { $('swCarError').textContent = ''; $('swCarExportStatus').textContent = ''; run(); }, 0); });
  $('swCarWatch').addEventListener('click', function watch() {
    if (!state.receipt) return;
    var rows = readWatchlist();
    if (!rows.some(function saved(row) { return row.vehicle === state.receipt.vehicle && row.countryCode === state.receipt.countryCode; })) rows.push({ vehicle: state.receipt.vehicle, countryCode: state.receipt.countryCode, sourceDate: state.receipt.sourceCollectedAt });
    writeWatchlist(rows); $('swCarWatch').textContent = 'Ipo kwenye orodha ya kifaa';
  });
  $('swCarCopy').addEventListener('click', function copy() {
    if (!state.receipt) return;
    var value = receiptText();
    var fallback = function fallbackCopy() { var area = document.createElement('textarea'); area.value = value; area.setAttribute('readonly', ''); area.style.position = 'fixed'; area.style.left = '-9999px'; document.body.appendChild(area); area.select(); document.execCommand('copy'); area.remove(); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(value).catch(fallback); else fallback();
    $('swCarExportStatus').textContent = 'Risiti imenakiliwa.';
  });
  $('swCarJson').addEventListener('click', function json() { exportReceipt('json'); });
  $('swCarCsv').addEventListener('click', function csv() { exportReceipt('csv'); });
  $('swCarTxt').addEventListener('click', function txt() { exportReceipt('txt'); });

  Promise.all([loadJson('/data/cars/price-intelligence.json'), loadImportData(), loadJson('/data/cars/sw-car-price-source-evidence.json')])
    .then(function ready(rows) {
      state.data = rows[0]; state.importData = rows[1]; state.evidence = rows[2]; populate(); run();
      $('swCarSources').innerHTML = state.evidence.officialEndpoints.map(function source(row) {
        return '<li><a href="' + esc(row.url) + '" target="_blank" rel="nofollow noopener">' + esc(row.authority) + '</a> — ' + esc(row.reviewStatus) + ' (' + esc(row.httpStatus == null ? 'ukaguzi wa mikono' : row.httpStatus) + '). ' + esc(row.scope) + '</li>';
      }).join('');
    })
    .catch(function failed(error) {
      $('swCarFreshness').innerHTML = '<strong>Data haikupatikana; hakuna bei wala pendekezo linaloweza kutolewa.</strong>';
      $('swCarError').textContent = error && error.message || 'Hitilafu ya data ya ndani.';
    });
}());
