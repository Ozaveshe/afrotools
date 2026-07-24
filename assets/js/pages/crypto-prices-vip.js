(function () {
  'use strict';

  var root = document.querySelector('[data-crypto-prices]');
  if (!root) return;

  var lang = document.documentElement.lang === 'fr' ? 'fr' : 'en';
  var copy = {
    en: {
      loading: 'Checking CoinGecko for a fresh market snapshot…',
      ready: function (count, currency) {
        return count + ' fresh market rows are shown in ' + currency + '. Values are indicative, not exchange quotes.';
      },
      unavailable: 'Fresh provider data is unavailable. No cached or estimated prices are shown.',
      rateLimited: 'CoinGecko is rate-limiting requests. Wait a moment, then refresh.',
      empty: 'No coins match this search.',
      row: 'Details',
      hide: 'Hide',
      rank: 'Rank',
      coin: 'Coin',
      price: 'Price',
      day: '24-hour change',
      week: '7-day change',
      marketCap: 'Market cap',
      volume: '24-hour volume',
      trend: '7-day trend',
      action: 'Details',
      ath: 'All-time high',
      atl: 'All-time low',
      supply: 'Circulating supply',
      providerTime: 'Provider updated',
      exported: 'Snapshot downloaded with source and time receipts.',
      noExport: 'Load a fresh snapshot before exporting.',
      cached: '60-second function cache',
      direct: 'New provider response'
    },
    fr: {
      loading: 'Vérification d’un instantané récent auprès de CoinGecko…',
      ready: function (count, currency) {
        return count + ' lignes de marché récentes sont affichées en ' + currency + '. Valeurs indicatives, pas des cotations d’échange.';
      },
      unavailable: 'Les données récentes du fournisseur sont indisponibles. Aucun prix en cache ou estimé n’est affiché.',
      rateLimited: 'CoinGecko limite temporairement les requêtes. Patientez, puis actualisez.',
      empty: 'Aucun actif ne correspond à cette recherche.',
      row: 'Détails',
      hide: 'Masquer',
      rank: 'Rang',
      coin: 'Actif',
      price: 'Prix',
      day: 'Variation sur 24 h',
      week: 'Variation sur 7 jours',
      marketCap: 'Capitalisation',
      volume: 'Volume sur 24 h',
      trend: 'Tendance sur 7 jours',
      action: 'Détails',
      ath: 'Plus haut historique',
      atl: 'Plus bas historique',
      supply: 'Offre en circulation',
      providerTime: 'Mise à jour fournisseur',
      exported: 'Instantané téléchargé avec la source et les horodatages.',
      noExport: 'Chargez un instantané récent avant l’export.',
      cached: 'Cache de fonction de 60 secondes',
      direct: 'Nouvelle réponse fournisseur'
    }
  }[lang];

  var state = {
    rows: [],
    receipt: null,
    currency: 'ngn',
    query: '',
    sort: 'market_cap_rank',
    direction: 'asc',
    loading: false,
    expanded: null,
    timer: null
  };

  var els = {
    currency: root.querySelector('[data-currency]'),
    search: root.querySelector('[data-search]'),
    refresh: root.querySelector('[data-refresh]'),
    csv: root.querySelector('[data-export-csv]'),
    json: root.querySelector('[data-export-json]'),
    message: root.querySelector('[data-message]'),
    body: root.querySelector('[data-price-body]'),
    table: root.querySelector('[data-price-table]'),
    status: root.querySelector('[data-status]'),
    count: root.querySelector('[data-count]'),
    sourceTime: root.querySelector('[data-source-time]'),
    fetchedTime: root.querySelector('[data-fetched-time]'),
    cache: root.querySelector('[data-cache]')
  };

  var numberLocale = lang === 'fr' ? 'fr-FR' : 'en-GB';

  function safeNumber(value) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function formatMoney(value, compact) {
    var number = safeNumber(value);
    if (number == null) return '—';
    try {
      return new Intl.NumberFormat(numberLocale, {
        style: 'currency',
        currency: state.currency.toUpperCase(),
        currencyDisplay: 'narrowSymbol',
        notation: compact ? 'compact' : 'standard',
        maximumFractionDigits: compact ? 2 : (Math.abs(number) < 1 ? 6 : 2)
      }).format(number);
    } catch (error) {
      return state.currency.toUpperCase() + ' ' + number.toLocaleString(numberLocale);
    }
  }

  function formatCount(value) {
    var number = safeNumber(value);
    return number == null ? '—' : new Intl.NumberFormat(numberLocale, {
      notation: 'compact',
      maximumFractionDigits: 2
    }).format(number);
  }

  function formatChange(value) {
    var number = safeNumber(value);
    return number == null ? '—' : (number > 0 ? '+' : '') + number.toFixed(2) + '%';
  }

  function formatTime(value) {
    var date = new Date(value);
    if (!Number.isFinite(date.getTime())) return '—';
    return new Intl.DateTimeFormat(numberLocale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    }).format(date);
  }

  function setMessage(text, tone) {
    els.message.textContent = text;
    els.message.dataset.tone = tone || 'info';
  }

  function setLoading(loading) {
    state.loading = loading;
    root.setAttribute('aria-busy', String(loading));
    els.refresh.disabled = loading;
    if (loading) setMessage(copy.loading);
  }

  function setUnavailable(message) {
    state.rows = [];
    state.receipt = null;
    els.status.textContent = lang === 'fr' ? 'Indisponible' : 'Unavailable';
    els.status.className = 'cp-status-value cp-unavailable';
    els.count.textContent = '0';
    els.sourceTime.textContent = '—';
    els.fetchedTime.textContent = '—';
    els.cache.textContent = '—';
    setMessage(message || copy.unavailable, 'error');
    render();
  }

  function updateReceipt(receipt) {
    els.status.textContent = lang === 'fr' ? 'Récent' : 'Fresh';
    els.status.className = 'cp-status-value cp-fresh';
    els.count.textContent = String(receipt.count);
    els.sourceTime.textContent = formatTime(receipt.sourceUpdatedAt);
    els.fetchedTime.textContent = formatTime(receipt.fetchedAt);
    els.cache.textContent = receipt.cache === 'hit' ? copy.cached : copy.direct;
  }

  async function load() {
    if (state.loading) return;
    setLoading(true);
    window.clearTimeout(state.timer);

    try {
      var response = await fetch('/.netlify/functions/crypto-prices?currency=' +
        encodeURIComponent(state.currency) + '&limit=100', {
        headers: { Accept: 'application/json' }
      });
      var payload = await response.json().catch(function () { return null; });

      if (!response.ok || !payload || payload.status !== 'fresh' || !Array.isArray(payload.data)) {
        setUnavailable(response.status === 429 ? copy.rateLimited : copy.unavailable);
        return;
      }

      state.rows = payload.data;
      state.receipt = payload;
      state.expanded = null;
      updateReceipt(payload);
      setMessage(copy.ready(payload.count, payload.currency.toUpperCase()));
      render();
    } catch (error) {
      setUnavailable(copy.unavailable);
    } finally {
      setLoading(false);
      window.__cryptoPricesReady = true;
      scheduleRefresh();
    }
  }

  function scheduleRefresh() {
    window.clearTimeout(state.timer);
    if (document.hidden || !state.receipt) return;
    state.timer = window.setTimeout(load, 120000);
  }

  function sortedRows() {
    var query = state.query.trim().toLowerCase();
    return state.rows.filter(function (row) {
      return !query ||
        String(row.name || '').toLowerCase().indexOf(query) !== -1 ||
        String(row.symbol || '').toLowerCase().indexOf(query) !== -1;
    }).slice().sort(function (a, b) {
      var left = a[state.sort];
      var right = b[state.sort];
      if (typeof left === 'string' || typeof right === 'string') {
        left = String(left || '');
        right = String(right || '');
        return state.direction === 'asc' ? left.localeCompare(right) : right.localeCompare(left);
      }
      left = safeNumber(left);
      right = safeNumber(right);
      left = left == null ? Number.NEGATIVE_INFINITY : left;
      right = right == null ? Number.NEGATIVE_INFINITY : right;
      return state.direction === 'asc' ? left - right : right - left;
    });
  }

  function td(label, value, className) {
    var cell = document.createElement('td');
    cell.dataset.label = label;
    if (className) cell.className = className;
    if (value instanceof Node) cell.appendChild(value);
    else cell.textContent = value;
    return cell;
  }

  function drawSparkline(canvas, prices) {
    if (!Array.isArray(prices) || prices.length < 2) {
      canvas.setAttribute('aria-label', lang === 'fr' ? 'Tendance indisponible' : 'Trend unavailable');
      return;
    }

    var clean = prices.map(safeNumber).filter(function (value) { return value != null; });
    if (clean.length < 2) return;
    var context = canvas.getContext('2d');
    var ratio = window.devicePixelRatio || 1;
    var width = 96;
    var height = 34;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    context.scale(ratio, ratio);
    var min = Math.min.apply(null, clean);
    var max = Math.max.apply(null, clean);
    var range = max - min || 1;
    var up = clean[clean.length - 1] >= clean[0];
    context.beginPath();
    context.strokeStyle = up ? '#159264' : '#c84b4b';
    context.lineWidth = 1.75;
    clean.forEach(function (value, index) {
      var x = index / (clean.length - 1) * width;
      var y = height - 2 - ((value - min) / range * (height - 4));
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    });
    context.stroke();
    canvas.setAttribute('aria-label', (lang === 'fr' ? 'Tendance sur sept jours pour ' : 'Seven-day trend for ') + clean.length + ' points');
  }

  function detailRow(row) {
    var detail = document.createElement('tr');
    detail.className = 'cp-detail-row';
    detail.hidden = state.expanded !== row.id;
    detail.id = 'detail-' + row.id;
    var cell = document.createElement('td');
    cell.colSpan = 9;
    var list = document.createElement('dl');
    list.className = 'cp-detail';
    [
      [copy.ath, formatMoney(row.ath)],
      [copy.atl, formatMoney(row.atl)],
      [copy.supply, formatCount(row.circulating_supply)],
      [copy.providerTime, formatTime(row.last_updated)]
    ].forEach(function (item) {
      var wrap = document.createElement('div');
      var term = document.createElement('dt');
      var description = document.createElement('dd');
      term.textContent = item[0];
      description.textContent = item[1];
      wrap.append(term, description);
      list.appendChild(wrap);
    });
    cell.appendChild(list);
    detail.appendChild(cell);
    return detail;
  }

  function marketRow(row) {
    var tr = document.createElement('tr');
    tr.className = 'cp-market-row';

    var coinWrap = document.createElement('div');
    coinWrap.className = 'cp-coin';
    var image = document.createElement('img');
    image.alt = '';
    image.loading = 'lazy';
    image.width = 34;
    image.height = 34;
    image.src = '/.netlify/functions/crypto-image?url=' + encodeURIComponent(row.image || '');
    image.addEventListener('error', function () {
      image.src = '/assets/img/logo-mark.svg';
    }, { once: true });
    var nameWrap = document.createElement('span');
    var name = document.createElement('strong');
    var symbol = document.createElement('small');
    name.textContent = row.name;
    symbol.textContent = String(row.symbol || '').toUpperCase();
    nameWrap.append(name, symbol);
    coinWrap.append(image, nameWrap);

    var change24 = safeNumber(row.price_change_percentage_24h_in_currency);
    var change7 = safeNumber(row.price_change_percentage_7d_in_currency);
    var spark = document.createElement('canvas');
    spark.className = 'cp-sparkline';
    spark.setAttribute('role', 'img');

    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'cp-detail-button';
    button.textContent = state.expanded === row.id ? copy.hide : copy.row;
    button.setAttribute('aria-expanded', String(state.expanded === row.id));
    button.setAttribute('aria-controls', 'detail-' + row.id);
    button.addEventListener('click', function () {
      state.expanded = state.expanded === row.id ? null : row.id;
      render();
      if (state.expanded === row.id) {
        var target = root.querySelector('[aria-controls="detail-' + CSS.escape(row.id) + '"]');
        if (target) target.focus();
      }
    });

    tr.append(
      td(copy.rank, String(row.market_cap_rank || '—')),
      td(copy.coin, coinWrap),
      td(copy.price, formatMoney(row.current_price)),
      td(copy.day, formatChange(change24), change24 == null ? '' : (change24 >= 0 ? 'cp-positive' : 'cp-negative')),
      td(copy.week, formatChange(change7), change7 == null ? '' : (change7 >= 0 ? 'cp-positive' : 'cp-negative')),
      td(copy.marketCap, formatMoney(row.market_cap, true)),
      td(copy.volume, formatMoney(row.total_volume, true)),
      td(copy.trend, spark),
      td(copy.action, button)
    );

    window.requestAnimationFrame(function () {
      drawSparkline(spark, row.sparkline_in_7d && row.sparkline_in_7d.price);
    });
    return tr;
  }

  function render() {
    els.body.replaceChildren();
    var rows = sortedRows();
    if (!rows.length) {
      var emptyRow = document.createElement('tr');
      var emptyCell = document.createElement('td');
      emptyCell.colSpan = 9;
      emptyCell.className = 'cp-empty';
      emptyCell.textContent = state.rows.length ? copy.empty : copy.unavailable;
      emptyRow.appendChild(emptyCell);
      els.body.appendChild(emptyRow);
      return;
    }

    var fragment = document.createDocumentFragment();
    rows.forEach(function (row) {
      fragment.append(marketRow(row), detailRow(row));
    });
    els.body.appendChild(fragment);
  }

  function updateSortButtons() {
    root.querySelectorAll('[data-sort]').forEach(function (button) {
      var active = button.dataset.sort === state.sort;
      button.setAttribute('aria-sort', active ? (state.direction === 'asc' ? 'ascending' : 'descending') : 'none');
    });
  }

  function exportPayload() {
    if (!state.receipt || !state.rows.length) {
      setMessage(copy.noExport, 'error');
      return null;
    }
    return {
      status: state.receipt.status,
      source: state.receipt.source,
      currency: state.receipt.currency,
      fetchedAt: state.receipt.fetchedAt,
      sourceUpdatedAt: state.receipt.sourceUpdatedAt,
      latestSourceUpdatedAt: state.receipt.latestSourceUpdatedAt,
      freshnessCeilingMinutes: state.receipt.freshnessCeilingMinutes,
      count: state.receipt.count,
      data: state.rows
    };
  }

  function download(content, type, extension) {
    var blob = new Blob([content], { type: type });
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'afrotools-crypto-' + state.currency + '-' +
      new Date(state.receipt.fetchedAt).toISOString().replace(/[:.]/g, '-') + '.' + extension;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(function () { URL.revokeObjectURL(link.href); }, 0);
    setMessage(copy.exported);
  }

  function exportJson() {
    var payload = exportPayload();
    if (payload) download(JSON.stringify(payload, null, 2), 'application/json', 'json');
  }

  function csvCell(value) {
    return '"' + String(value == null ? '' : value).replace(/"/g, '""') + '"';
  }

  function exportCsv() {
    var payload = exportPayload();
    if (!payload) return;
    var lines = [
      ['source', payload.source.name],
      ['currency', payload.currency.toUpperCase()],
      ['fetched_at', payload.fetchedAt],
      ['source_updated_at_oldest', payload.sourceUpdatedAt],
      ['source_updated_at_latest', payload.latestSourceUpdatedAt],
      ['freshness_ceiling_minutes', payload.freshnessCeilingMinutes],
      [],
      ['rank', 'id', 'name', 'symbol', 'current_price', 'change_24h_percent', 'change_7d_percent', 'market_cap', 'volume_24h', 'provider_updated_at']
    ];
    payload.data.forEach(function (row) {
      lines.push([
        row.market_cap_rank, row.id, row.name, row.symbol, row.current_price,
        row.price_change_percentage_24h_in_currency,
        row.price_change_percentage_7d_in_currency,
        row.market_cap, row.total_volume, row.last_updated
      ]);
    });
    download(lines.map(function (line) { return line.map(csvCell).join(','); }).join('\r\n'), 'text/csv;charset=utf-8', 'csv');
  }

  els.currency.addEventListener('change', function () {
    state.currency = els.currency.value;
    load();
  });
  els.search.addEventListener('input', function () {
    state.query = els.search.value;
    render();
  });
  els.refresh.addEventListener('click', load);
  els.csv.addEventListener('click', exportCsv);
  els.json.addEventListener('click', exportJson);
  root.querySelectorAll('[data-sort]').forEach(function (button) {
    button.addEventListener('click', function () {
      var key = button.dataset.sort;
      if (state.sort === key) state.direction = state.direction === 'asc' ? 'desc' : 'asc';
      else {
        state.sort = key;
        state.direction = key === 'name' || key === 'market_cap_rank' ? 'asc' : 'desc';
      }
      updateSortButtons();
      render();
    });
  });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) window.clearTimeout(state.timer);
    else scheduleRefresh();
  });

  updateSortButtons();
  render();
  load();
})();
