(function () {
  'use strict';

  var engine = window.AfroTools && window.AfroTools.CryptoDcaReplay;
  var page = document.querySelector('[data-dca-replay]');
  if (!engine || !page) return;

  var lang = document.documentElement.lang === 'fr' ? 'fr' : 'en';
  var copy = {
    en: {
      loading: 'Requesting audited daily reference prices…',
      ready: 'Replay complete. Review the source receipt and missed rows before using the result.',
      error: 'The replay could not be completed.',
      sourceUnavailable: 'Historical prices are unavailable right now. No stale or estimated fallback was used.',
      results: 'Replay results',
      outlay: 'Gross cash outlay',
      costs: 'Modeled costs',
      acquired: 'Asset acquired',
      value: 'Value at last source price',
      change: 'Modeled change vs cash outlay',
      coverage: 'Schedule coverage',
      receipt: 'Source receipt',
      provider: 'Provider',
      requested: 'Requested UTC range',
      actual: 'Actual source range',
      fetched: 'Fetched at',
      granularity: 'Granularity',
      cache: 'Response cache',
      schedule: 'Schedule receipt',
      used: 'used',
      missed: 'missed',
      historyOpen: 'Hide purchase schedule',
      historyClosed: 'View purchase schedule',
      statusUsed: 'Used',
      statusMissed: 'Missed',
      noPrice: 'No eligible price',
      pdfTitle: 'AfroTools Historical Crypto DCA Replay',
      chartTitle: 'Modeled asset value at each used schedule event',
      chartDescription: 'An accessible line plot of modeled value using each event reference price. It is not a forecast.',
      pdfUnavailable: 'The local PDF library did not load. Use Print instead.',
      downloaded: 'Export created locally. No result data was uploaded.',
      fields: ['Event', 'Scheduled UTC date', 'Status', 'Reference UTC time', 'Reference price', 'Gross contribution', 'Percentage cost', 'Fixed cost', 'Acquisition cash', 'Units', 'Reason']
    },
    fr: {
      loading: 'Demande des prix de référence quotidiens contrôlés…',
      ready: 'Reconstitution terminée. Vérifiez le reçu de source et les lignes manquées avant d’utiliser le résultat.',
      error: 'La reconstitution n’a pas pu être terminée.',
      sourceUnavailable: 'Les prix historiques sont indisponibles. Aucun ancien prix ni aucune estimation de secours n’a été utilisé.',
      results: 'Résultats de la reconstitution',
      outlay: 'Décaissement brut',
      costs: 'Coûts modélisés',
      acquired: 'Actif acquis',
      value: 'Valeur au dernier prix source',
      change: 'Variation modélisée vs décaissement',
      coverage: 'Couverture du calendrier',
      receipt: 'Reçu de source',
      provider: 'Fournisseur',
      requested: 'Période UTC demandée',
      actual: 'Période source réelle',
      fetched: 'Récupéré le',
      granularity: 'Granularité',
      cache: 'Cache de réponse',
      schedule: 'Reçu du calendrier',
      used: 'utilisées',
      missed: 'manquées',
      historyOpen: 'Masquer le calendrier',
      historyClosed: 'Voir le calendrier',
      statusUsed: 'Utilisée',
      statusMissed: 'Manquée',
      noPrice: 'Aucun prix admissible',
      pdfTitle: 'AfroTools — Reconstitution historique DCA crypto',
      chartTitle: 'Valeur modélisée de l’actif à chaque opération utilisée',
      chartDescription: 'Courbe accessible de la valeur modélisée avec le prix de référence de chaque opération. Ce n’est pas une prévision.',
      pdfUnavailable: 'La bibliothèque PDF locale n’a pas chargé. Utilisez Imprimer.',
      downloaded: 'Export créé localement. Aucun résultat n’a été envoyé.',
      fields: ['Opération', 'Date UTC prévue', 'Statut', 'Heure UTC de référence', 'Prix de référence', 'Versement brut', 'Coût en pourcentage', 'Coût fixe', 'Montant investi', 'Unités', 'Motif']
    }
  }[lang];

  var form = document.getElementById('dca-replay-form');
  var status = document.getElementById('dca-status');
  var submit = document.getElementById('dca-submit');
  var empty = document.getElementById('dca-empty');
  var results = document.getElementById('dca-results');
  var summary = document.getElementById('dca-summary');
  var receipt = document.getElementById('dca-receipt-grid');
  var tableBody = document.getElementById('dca-history-body');
  var tableScroll = document.getElementById('dca-history-scroll');
  var disclosure = document.getElementById('dca-history-toggle');
  var chart = document.getElementById('dca-chart');
  var latest = null;

  function isoDate(date) {
    return date.toISOString().slice(0, 10);
  }

  function lastCompletedDay() {
    var now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - engine.DAY_MS);
  }

  function addDays(date, days) {
    return new Date(date.getTime() + days * engine.DAY_MS);
  }

  function setDateBounds() {
    var end = lastCompletedDay();
    var min = addDays(end, -364);
    var start = document.getElementById('dca-start');
    var endInput = document.getElementById('dca-end');
    start.min = isoDate(min);
    start.max = isoDate(addDays(end, -1));
    endInput.min = isoDate(min);
    endInput.max = isoDate(end);
    endInput.value = isoDate(end);
    if (!start.value || start.value < start.min || start.value > start.max) start.value = isoDate(addDays(end, -89));
  }

  function setStatus(message, state) {
    status.textContent = message;
    status.dataset.state = state || 'info';
  }

  function formatNumber(value, maximumFractionDigits) {
    return new Intl.NumberFormat(lang === 'fr' ? 'fr-FR' : 'en', {
      maximumFractionDigits: maximumFractionDigits == null ? 2 : maximumFractionDigits
    }).format(value);
  }

  function money(value, currency) {
    return new Intl.NumberFormat(lang === 'fr' ? 'fr-FR' : 'en', {
      style: 'currency',
      currency: currency.toUpperCase(),
      maximumFractionDigits: 2
    }).format(value);
  }

  function dateTime(value) {
    return new Intl.DateTimeFormat(lang === 'fr' ? 'fr-FR' : 'en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'UTC'
    }).format(new Date(value)) + ' UTC';
  }

  function appendText(parent, tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    node.textContent = text;
    parent.appendChild(node);
    return node;
  }

  function renderSummary(model, currency, symbol) {
    summary.replaceChildren();
    [
      [copy.outlay, money(model.totalOutlay, currency)],
      [copy.costs, money(model.totalCosts, currency)],
      [copy.acquired, formatNumber(model.totalUnits, 8) + ' ' + symbol],
      [copy.value, money(model.valueAtLastSourcePrice, currency)],
      [copy.change, (model.modeledChange >= 0 ? '+' : '') + money(model.modeledChange, currency), model.modeledChange >= 0 ? 'positive' : 'negative'],
      [copy.coverage, model.usedCount + '/' + model.expectedCount + ' · ' + model.missedCount + ' ' + copy.missed]
    ].forEach(function (item) {
      var card = document.createElement('div');
      card.className = 'dca-stat';
      appendText(card, 'div', 'dca-stat-label', item[0]);
      var value = appendText(card, 'div', 'dca-stat-value', item[1]);
      if (String(item[1]).length > 20) value.dataset.wrap = 'true';
      if (item[2]) value.dataset.tone = item[2];
      summary.appendChild(card);
    });
  }

  function receiptItem(label, value, link) {
    var wrapper = document.createElement('div');
    appendText(wrapper, 'dt', '', label);
    var dd = document.createElement('dd');
    if (link) {
      var anchor = document.createElement('a');
      anchor.href = link;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      anchor.textContent = value;
      dd.appendChild(anchor);
    } else dd.textContent = value;
    wrapper.appendChild(dd);
    receipt.appendChild(wrapper);
  }

  function renderReceipt(payload, model) {
    receipt.replaceChildren();
    receiptItem(copy.provider, payload.source.name + ' — ' + payload.source.attribution, payload.source.url);
    receiptItem(copy.requested, payload.request.from + ' → ' + payload.request.to);
    receiptItem(copy.actual, dateTime(payload.actualRange.from) + ' → ' + dateTime(payload.actualRange.to));
    receiptItem(copy.fetched, dateTime(payload.fetchedAt));
    receiptItem(copy.granularity, payload.granularity);
    receiptItem(copy.cache, payload.cache.toUpperCase());
    receiptItem(copy.schedule, model.expectedCount + ' · ' + model.usedCount + ' ' + copy.used + ' · ' + model.missedCount + ' ' + copy.missed);
  }

  function renderTable(model, currency, symbol) {
    tableBody.replaceChildren();
    model.rows.forEach(function (row) {
      var tr = document.createElement('tr');
      var values = row.status === 'used'
        ? [row.sequence, row.scheduledDate, copy.statusUsed, dateTime(row.referenceAt), money(row.referencePrice, currency), money(row.grossContribution, currency), money(row.percentageCost, currency), money(row.fixedCost, currency), money(row.acquisitionCash, currency), formatNumber(row.units, 8) + ' ' + symbol, '—']
        : [row.sequence, row.scheduledDate, copy.statusMissed, '—', '—', '—', '—', '—', '—', '—', copy.noPrice + ': ' + row.reason];
      values.forEach(function (value, index) {
        var td = document.createElement('td');
        td.textContent = String(value);
        if (row.status === 'missed' && (index === 2 || index === 10)) td.className = 'dca-missed';
        tr.appendChild(td);
      });
      tableBody.appendChild(tr);
    });
  }

  function renderChart(model, currency) {
    while (chart.lastChild) chart.removeChild(chart.lastChild);
    var used = model.rows.filter(function (row) { return row.status === 'used'; });
    chart.setAttribute('viewBox', '0 0 720 280');
    chart.setAttribute('role', 'img');
    chart.setAttribute('aria-labelledby', 'dca-chart-title dca-chart-desc');
    var ns = 'http://www.w3.org/2000/svg';
    var title = document.createElementNS(ns, 'title');
    title.id = 'dca-chart-title';
    title.textContent = copy.chartTitle;
    chart.appendChild(title);
    var desc = document.createElementNS(ns, 'desc');
    desc.id = 'dca-chart-desc';
    desc.textContent = copy.chartDescription;
    chart.appendChild(desc);
    if (!used.length) return;
    var cumulativeUnits = 0;
    var points = used.map(function (row) {
      cumulativeUnits += row.units;
      return { date: row.scheduledDate, value: cumulativeUnits * row.referencePrice };
    });
    var max = Math.max.apply(null, points.map(function (point) { return point.value; })) || 1;
    [40, 140, 240].forEach(function (y) {
      var line = document.createElementNS(ns, 'line');
      line.setAttribute('x1', '54'); line.setAttribute('x2', '700');
      line.setAttribute('y1', String(y)); line.setAttribute('y2', String(y));
      line.setAttribute('class', 'grid-line');
      chart.appendChild(line);
    });
    var coordinates = points.map(function (point, index) {
      var x = points.length === 1 ? 377 : 54 + index / (points.length - 1) * 646;
      var y = 240 - point.value / max * 200;
      return [x, y];
    });
    var area = document.createElementNS(ns, 'path');
    area.setAttribute('class', 'series-area');
    area.setAttribute('d', 'M ' + coordinates[0][0] + ' 240 L ' + coordinates.map(function (xy) { return xy.join(' '); }).join(' L ') + ' L ' + coordinates[coordinates.length - 1][0] + ' 240 Z');
    chart.appendChild(area);
    var path = document.createElementNS(ns, 'polyline');
    path.setAttribute('class', 'series-line');
    path.setAttribute('points', coordinates.map(function (xy) { return xy.join(','); }).join(' '));
    chart.appendChild(path);
    [[54, points[0].date], [700, points[points.length - 1].date]].forEach(function (label, index) {
      var text = document.createElementNS(ns, 'text');
      text.setAttribute('x', String(label[0]));
      text.setAttribute('y', '266');
      text.setAttribute('text-anchor', index ? 'end' : 'start');
      text.textContent = label[1];
      chart.appendChild(text);
    });
    var maxLabel = document.createElementNS(ns, 'text');
    maxLabel.setAttribute('x', '54');
    maxLabel.setAttribute('y', '28');
    maxLabel.textContent = money(max, currency);
    chart.appendChild(maxLabel);
  }

  function payloadFromForm() {
    var data = new FormData(form);
    return {
      asset: String(data.get('asset')),
      currency: String(data.get('currency')),
      startDate: String(data.get('startDate')),
      endDate: String(data.get('endDate')),
      frequency: String(data.get('frequency')),
      contribution: Number(data.get('contribution')),
      percentCost: Number(data.get('percentCost') || 0),
      fixedCost: Number(data.get('fixedCost') || 0)
    };
  }

  async function run(event) {
    event.preventDefault();
    if (!form.reportValidity()) return;
    var input = payloadFromForm();
    submit.disabled = true;
    submit.setAttribute('aria-busy', 'true');
    setStatus(copy.loading);
    try {
      var query = new URLSearchParams({
        asset: input.asset,
        currency: input.currency,
        from: input.startDate,
        to: input.endDate
      });
      var response = await fetch('/api/crypto-dca-history?' + query.toString(), {
        method: 'GET',
        headers: { Accept: 'application/json' },
        credentials: 'same-origin'
      });
      var payload = await response.json();
      if (!response.ok || payload.status !== 'fresh') throw new Error(payload.message || copy.sourceUnavailable);
      var model = engine.replay(input, payload.prices);
      var symbol = input.asset === 'bitcoin' ? 'BTC' : 'ETH';
      latest = { input: input, payload: payload, model: model, symbol: symbol };
      renderSummary(model, input.currency, symbol);
      renderReceipt(payload, model);
      renderTable(model, input.currency, symbol);
      renderChart(model, input.currency);
      empty.hidden = true;
      results.hidden = false;
      setStatus(copy.ready, 'success');
      document.getElementById('dca-results-title').focus({ preventScroll: true });
    } catch (error) {
      latest = null;
      results.hidden = true;
      empty.hidden = false;
      setStatus((error && error.message) || copy.error, 'error');
    } finally {
      submit.disabled = false;
      submit.removeAttribute('aria-busy');
    }
  }

  function exportObject() {
    return {
      product: 'Historical crypto DCA schedule replay',
      locale: lang,
      generatedAt: new Date().toISOString(),
      inputs: latest.input,
      sourceReceipt: {
        source: latest.payload.source,
        request: latest.payload.request,
        actualRange: latest.payload.actualRange,
        fetchedAt: latest.payload.fetchedAt,
        granularity: latest.payload.granularity,
        cache: latest.payload.cache
      },
      result: latest.model,
      methodology: 'Each scheduled UTC date uses the latest unused provider reference point at or before the end of that date, with a maximum 36-hour gap.',
      limitations: [
        'Historical daily reference prices are not execution quotes.',
        'The replay does not predict future returns or recommend an asset.',
        'Taxes, custody, platform availability and costs not entered by the user are excluded.'
      ]
    };
  }

  function download(blob, filename) {
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 0);
    setStatus(copy.downloaded, 'success');
  }

  function exportCsv() {
    if (!latest) return;
    var receiptFields = {
      provider: latest.payload.source.name,
      fetchedAt: latest.payload.fetchedAt,
      actualFrom: latest.payload.actualRange.from,
      actualTo: latest.payload.actualRange.to,
      granularity: latest.payload.granularity,
      limitation: 'Historical reference replay; not an execution quote, forecast or recommendation.'
    };
    var headers = copy.fields.concat(Object.keys(receiptFields));
    var rows = latest.model.rows.map(function (row) {
      var values = row.status === 'used'
        ? [row.sequence, row.scheduledDate, row.status, row.referenceAt, row.referencePrice, row.grossContribution, row.percentageCost, row.fixedCost, row.acquisitionCash, row.units, '']
        : [row.sequence, row.scheduledDate, row.status, '', '', '', '', '', '', '', row.reason];
      return values.concat(Object.keys(receiptFields).map(function (key) { return receiptFields[key]; }));
    });
    var csv = [headers].concat(rows).map(function (row) {
      return row.map(engine.csvCell).join(',');
    }).join('\r\n');
    download(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }), 'afrotools-crypto-dca-replay.csv');
  }

  function exportJson() {
    if (!latest) return;
    download(new Blob([JSON.stringify(exportObject(), null, 2)], { type: 'application/json;charset=utf-8' }), 'afrotools-crypto-dca-replay.json');
  }

  function exportPdf() {
    if (!latest) return;
    var JsPdf = window.jspdf && window.jspdf.jsPDF;
    if (!JsPdf) {
      setStatus(copy.pdfUnavailable, 'error');
      return;
    }
    var doc = new JsPdf({ unit: 'pt', format: 'a4' });
    var y = 42;
    function line(text, size, weight) {
      if (y > 790) { doc.addPage(); y = 42; }
      doc.setFont('helvetica', weight || 'normal');
      doc.setFontSize(size || 9);
      doc.splitTextToSize(String(text), 510).forEach(function (part) {
        doc.text(part, 42, y);
        y += (size || 9) + 4;
      });
    }
    line(copy.pdfTitle, 18, 'bold');
    line('Generated: ' + new Date().toISOString(), 9);
    line('Provider: ' + latest.payload.source.name + ' — ' + latest.payload.source.url, 10, 'bold');
    line('Requested UTC: ' + latest.payload.request.from + ' to ' + latest.payload.request.to);
    line('Actual source range: ' + latest.payload.actualRange.from + ' to ' + latest.payload.actualRange.to);
    line('Fetched at: ' + latest.payload.fetchedAt + ' | ' + latest.payload.granularity + ' | cache ' + latest.payload.cache);
    line('Gross outlay: ' + money(latest.model.totalOutlay, latest.input.currency) + ' | costs: ' + money(latest.model.totalCosts, latest.input.currency));
    line('Value at last source price: ' + money(latest.model.valueAtLastSourcePrice, latest.input.currency) + ' | modeled change: ' + money(latest.model.modeledChange, latest.input.currency));
    line('Schedule: ' + latest.model.expectedCount + ' expected, ' + latest.model.usedCount + ' used, ' + latest.model.missedCount + ' missed.', 10, 'bold');
    y += 5;
    latest.model.rows.forEach(function (row) {
      line(row.sequence + '. ' + row.scheduledDate + ' | ' + row.status + (row.status === 'used'
        ? ' | ' + row.referenceAt + ' | price ' + row.referencePrice + ' | gross ' + row.grossContribution + ' | costs ' + (row.percentageCost + row.fixedCost) + ' | units ' + row.units
        : ' | ' + row.reason), 8);
    });
    y += 6;
    line('Method: latest unused provider reference point at or before each scheduled UTC date; maximum gap 36 hours.', 9, 'bold');
    line('Limitations: historical daily reference prices are not execution quotes. This replay is not a forecast or recommendation. Taxes, custody, platform availability and unentered costs are excluded.', 9);
    doc.save('afrotools-crypto-dca-replay.pdf');
    setStatus(copy.downloaded, 'success');
  }

  form.addEventListener('submit', run);
  disclosure.addEventListener('click', function () {
    var open = disclosure.getAttribute('aria-expanded') === 'true';
    disclosure.setAttribute('aria-expanded', String(!open));
    disclosure.textContent = open ? copy.historyClosed : copy.historyOpen;
    tableScroll.hidden = open;
  });
  document.getElementById('dca-export-csv').addEventListener('click', exportCsv);
  document.getElementById('dca-export-json').addEventListener('click', exportJson);
  document.getElementById('dca-export-pdf').addEventListener('click', exportPdf);
  document.getElementById('dca-print').addEventListener('click', function () { if (latest) window.print(); });
  setDateBounds();
})();
