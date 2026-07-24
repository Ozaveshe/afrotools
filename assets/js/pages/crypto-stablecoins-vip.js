(function () {
  'use strict';

  var root = document.querySelector('[data-stablecoin-snapshot]');
  if (!root) return;
  var lang = document.documentElement.lang === 'fr' ? 'fr' : 'en';
  var copy = {
    en: {
      loading: 'Checking CoinGecko for a fresh stablecoin reference snapshot…',
      ready: function (count, currency) { return count + ' fresh provider rows are shown in USD and ' + currency + '. These are reference prices, not exchange quotes.'; },
      unavailable: 'Fresh provider data is unavailable. No cached, estimated or platform prices are shown.',
      rateLimited: 'CoinGecko is rate-limiting requests. Wait a moment, then refresh.',
      fresh: 'Fresh',
      unavailableState: 'Unavailable',
      cacheHit: '60-second function cache',
      cacheMiss: 'New provider response',
      exported: 'Snapshot downloaded with source, scope and time receipts.',
      noExport: 'Load a fresh snapshot before exporting.',
      labels: ['Asset', 'USD reference', 'Local reference', 'USD 24h change', 'USD peg distance', 'Provider updated']
    },
    fr: {
      loading: 'Vérification d’un instantané de référence récent auprès de CoinGecko…',
      ready: function (count, currency) { return count + ' lignes fournisseur récentes sont affichées en USD et ' + currency + '. Ce sont des prix de référence, pas des cotations d’échange.'; },
      unavailable: 'Les données récentes du fournisseur sont indisponibles. Aucun prix expiré, estimé ou de plateforme n’est affiché.',
      rateLimited: 'CoinGecko limite temporairement les requêtes. Patientez, puis actualisez.',
      fresh: 'Récent',
      unavailableState: 'Indisponible',
      cacheHit: 'Cache de fonction de 60 secondes',
      cacheMiss: 'Nouvelle réponse fournisseur',
      exported: 'Instantané téléchargé avec la source, la portée et les horodatages.',
      noExport: 'Chargez un instantané récent avant l’export.',
      labels: ['Actif', 'Référence USD', 'Référence locale', 'Variation USD sur 24 h', 'Écart à 1 USD', 'Mise à jour fournisseur']
    }
  }[lang];

  var state = { currency: 'ngn', rows: [], receipt: null, loading: false, timer: null };
  var els = {
    currency: root.querySelector('[data-currency]'),
    refresh: root.querySelector('[data-refresh]'),
    csv: root.querySelector('[data-export-csv]'),
    json: root.querySelector('[data-export-json]'),
    message: root.querySelector('[data-message]'),
    body: root.querySelector('[data-stablecoin-body]'),
    status: root.querySelector('[data-status]'),
    count: root.querySelector('[data-count]'),
    sourceTime: root.querySelector('[data-source-time]'),
    fetchedTime: root.querySelector('[data-fetched-time]'),
    cache: root.querySelector('[data-cache]')
  };
  var numberLocale = lang === 'fr' ? 'fr-FR' : 'en-GB';

  function formatMoney(value, currency) {
    var number = Number(value);
    if (!Number.isFinite(number)) return '—';
    return new Intl.NumberFormat(numberLocale, {
      style: 'currency',
      currency: currency,
      currencyDisplay: 'narrowSymbol',
      maximumFractionDigits: Math.abs(number) < 10 ? 6 : 2
    }).format(number);
  }

  function formatPercent(value, signed) {
    var number = Number(value);
    if (!Number.isFinite(number)) return '—';
    return (signed && number > 0 ? '+' : '') + number.toFixed(3) + '%';
  }

  function formatTime(value) {
    var date = new Date(value);
    if (!Number.isFinite(date.getTime())) return '—';
    return new Intl.DateTimeFormat(numberLocale, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZoneName: 'short'
    }).format(date);
  }

  function setMessage(text, tone) {
    els.message.textContent = text;
    els.message.dataset.tone = tone || 'info';
  }

  function setLoading(value) {
    state.loading = value;
    root.setAttribute('aria-busy', String(value));
    els.refresh.disabled = value;
    if (value) setMessage(copy.loading);
  }

  function setUnavailable(message) {
    state.rows = [];
    state.receipt = null;
    els.status.textContent = copy.unavailableState;
    els.status.className = 'sc-value sc-unavailable';
    els.count.textContent = '0';
    els.sourceTime.textContent = '—';
    els.fetchedTime.textContent = '—';
    els.cache.textContent = '—';
    setMessage(message || copy.unavailable, 'error');
    render();
  }

  function updateReceipt(payload) {
    els.status.textContent = copy.fresh;
    els.status.className = 'sc-value sc-fresh';
    els.count.textContent = String(payload.count);
    els.sourceTime.textContent = formatTime(payload.sourceUpdatedAt);
    els.fetchedTime.textContent = formatTime(payload.fetchedAt);
    els.cache.textContent = payload.cache === 'hit' ? copy.cacheHit : copy.cacheMiss;
  }

  function cell(label, value, className) {
    var td = document.createElement('td');
    td.dataset.label = label;
    td.textContent = value;
    if (className) td.className = className;
    return td;
  }

  function render() {
    els.body.textContent = '';
    state.rows.forEach(function (row) {
      var tr = document.createElement('tr');
      var asset = document.createElement('td');
      asset.dataset.label = copy.labels[0];
      asset.className = 'sc-asset';
      var strong = document.createElement('strong');
      var small = document.createElement('small');
      strong.textContent = row.symbol;
      small.textContent = row.name;
      asset.append(strong, small);
      var change = Number(row.usd24hChange);
      var peg = Number(row.pegDistancePercent);
      tr.append(
        asset,
        cell(copy.labels[1], formatMoney(row.usdPrice, 'USD')),
        cell(copy.labels[2], formatMoney(row.localPrice, state.currency.toUpperCase())),
        cell(copy.labels[3], formatPercent(change, true), Number.isFinite(change) ? (change >= 0 ? 'sc-positive' : 'sc-negative') : ''),
        cell(copy.labels[4], formatPercent(peg, true), Number.isFinite(peg) ? (Math.abs(peg) <= 0.1 ? 'sc-positive' : 'sc-negative') : ''),
        cell(copy.labels[5], formatTime(row.sourceUpdatedAt))
      );
      els.body.appendChild(tr);
    });
  }

  function scheduleRefresh() {
    window.clearTimeout(state.timer);
    if (document.hidden || !state.receipt) return;
    state.timer = window.setTimeout(load, 120000);
  }

  async function load() {
    if (state.loading) return;
    window.clearTimeout(state.timer);
    setLoading(true);
    try {
      var response = await fetch('/.netlify/functions/crypto-stablecoins?currency=' + encodeURIComponent(state.currency), {
        headers: { Accept: 'application/json' }
      });
      var payload = await response.json().catch(function () { return null; });
      if (!response.ok || !payload || payload.status !== 'fresh' || payload.scope !== 'provider_reference_not_exchange_quote' || !Array.isArray(payload.data)) {
        setUnavailable(response.status === 429 ? copy.rateLimited : copy.unavailable);
        return;
      }
      state.rows = payload.data;
      state.receipt = payload;
      updateReceipt(payload);
      setMessage(copy.ready(payload.count, payload.currency.toUpperCase()));
      render();
    } catch (error) {
      setUnavailable(copy.unavailable);
    } finally {
      setLoading(false);
      window.__stablecoinSnapshotReady = true;
      scheduleRefresh();
    }
  }

  function csvEscape(value) {
    var text = String(value == null ? '' : value);
    return /[",\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
  }

  function download(content, type, extension) {
    var blob = new Blob([content], { type: type });
    var url = URL.createObjectURL(blob);
    var anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'stablecoin-reference-' + state.currency + '-' + state.receipt.fetchedAt.slice(0, 19).replace(/[:T]/g, '-') + '.' + extension;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 0);
    setMessage(copy.exported);
  }

  function exportPayload() {
    if (!state.receipt) {
      setMessage(copy.noExport, 'error');
      return null;
    }
    return {
      schemaVersion: 1,
      title: 'AfroTools Stablecoin Reference Snapshot',
      scope: state.receipt.scope,
      source: state.receipt.source,
      quoteCurrency: state.receipt.currency.toUpperCase(),
      fetchedAt: state.receipt.fetchedAt,
      sourceUpdatedAt: state.receipt.sourceUpdatedAt,
      freshnessCeilingMinutes: state.receipt.freshnessCeilingMinutes,
      data: state.rows
    };
  }

  els.currency.addEventListener('change', function () {
    state.currency = els.currency.value;
    load();
  });
  els.refresh.addEventListener('click', load);
  els.csv.addEventListener('click', function () {
    var payload = exportPayload();
    if (!payload) return;
    var headers = ['scope', 'source', 'quote_currency', 'fetched_at', 'asset', 'symbol', 'usd_reference', 'local_reference', 'usd_24h_change_percent', 'usd_peg_distance_percent', 'provider_updated_at'];
    var rows = payload.data.map(function (row) {
      return [payload.scope, payload.source.name, payload.quoteCurrency, payload.fetchedAt, row.name, row.symbol, row.usdPrice, row.localPrice, row.usd24hChange, row.pegDistancePercent, row.sourceUpdatedAt].map(csvEscape).join(',');
    });
    download([headers.join(',')].concat(rows).join('\n'), 'text/csv;charset=utf-8', 'csv');
  });
  els.json.addEventListener('click', function () {
    var payload = exportPayload();
    if (payload) download(JSON.stringify(payload, null, 2) + '\n', 'application/json;charset=utf-8', 'json');
  });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) window.clearTimeout(state.timer);
    else if (state.receipt) load();
  });

  load();
}());
