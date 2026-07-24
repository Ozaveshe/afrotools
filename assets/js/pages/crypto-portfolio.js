(function () {
  'use strict';
  var root = document.querySelector('[data-crypto-portfolio]');
  var engine = window.AfroTools && window.AfroTools.CryptoPortfolioLots;
  if (!root || !engine) return;

  var lang = root.dataset.locale === 'fr' ? 'fr' : 'en';
  var words = {
    en: {
      loading: 'Requesting a fresh market snapshot…',
      ready: 'Fresh market snapshot loaded. Values can now be calculated.',
      unavailable: 'Fresh provider data is unavailable. All market-dependent values are withheld.',
      missing: 'One or more portfolio assets are absent from this fresh snapshot. All totals are withheld.',
      saved: 'Lot saved on this device.',
      removed: 'Lot removed.',
      reset: 'Portfolio cleared from this device.',
      importOk: 'Backup imported and validated.',
      importBad: 'This backup is invalid, too large, or contains unsupported values.',
      choose: 'Choose an asset',
      none: 'No lots yet. Add each acquisition as a separate lot.',
      partial: 'Partial P/L (known-cost lots)',
      complete: 'P/L (all lots have cost)',
      confirmReset: 'Export a backup first if needed. Permanently clear all local lots?',
      locked: 'Currency is locked while lots exist. Export and clear the portfolio before switching.',
      pdfMissing: 'The PDF library did not load. Please retry.',
      source: 'Source',
      fetched: 'Fetched',
      updated: 'Latest source update',
      ceiling: 'Freshness ceiling',
      minutes: 'minutes',
      planning: 'Planning snapshot only — not financial, tax or investment advice.'
    },
    fr: {
      loading: 'Demande d’un instantané de marché récent…',
      ready: 'Instantané récent chargé. Les valeurs peuvent être calculées.',
      unavailable: 'Les données récentes du fournisseur sont indisponibles. Toutes les valeurs dépendantes du marché sont masquées.',
      missing: 'Un ou plusieurs actifs sont absents de cet instantané récent. Tous les totaux sont masqués.',
      saved: 'Lot enregistré sur cet appareil.',
      removed: 'Lot supprimé.',
      reset: 'Portefeuille effacé de cet appareil.',
      importOk: 'Sauvegarde importée et validée.',
      importBad: 'Cette sauvegarde est invalide, trop volumineuse ou contient des valeurs non prises en charge.',
      choose: 'Choisir un actif',
      none: 'Aucun lot. Ajoutez chaque acquisition comme un lot distinct.',
      partial: 'P/L partiel (lots avec coût connu)',
      complete: 'P/L (coût connu pour tous les lots)',
      confirmReset: 'Exportez d’abord une sauvegarde si nécessaire. Effacer définitivement tous les lots locaux ?',
      locked: 'La devise est verrouillée tant que des lots existent. Exportez puis effacez le portefeuille pour la changer.',
      pdfMissing: 'La bibliothèque PDF ne s’est pas chargée. Réessayez.',
      source: 'Source',
      fetched: 'Récupéré',
      updated: 'Dernière mise à jour source',
      ceiling: 'Plafond de fraîcheur',
      minutes: 'minutes',
      planning: 'Instantané de planification uniquement — aucun conseil financier, fiscal ou d’investissement.'
    }
  }[lang];
  var key = 'afro-crypto-portfolio-v2';
  var portfolio = load();
  var market = null;
  var calculation = null;
  var importReturnFocus = null;
  var els = {};
  root.querySelectorAll('[data-el]').forEach(function (el) { els[el.dataset.el] = el; });

  function load() {
    try { return engine.normalizePortfolio(JSON.parse(localStorage.getItem(key) || '{}')); }
    catch (_) { return engine.normalizePortfolio({}); }
  }
  function persist() { localStorage.setItem(key, JSON.stringify(portfolio)); }
  function status(message, kind) {
    els.status.textContent = message;
    els.status.dataset.kind = kind || '';
  }
  function money(value) {
    return new Intl.NumberFormat(lang === 'fr' ? 'fr-FR' : 'en', {
      style: 'currency', currency: portfolio.currency, maximumFractionDigits: 2
    }).format(value);
  }
  function number(value) {
    return new Intl.NumberFormat(lang === 'fr' ? 'fr-FR' : 'en', { maximumFractionDigits: 8 }).format(value);
  }
  function time(value) {
    return new Intl.DateTimeFormat(lang === 'fr' ? 'fr-FR' : 'en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
  }
  function setText(el, value) { el.textContent = value; }
  function download(name, type, text) {
    var url = URL.createObjectURL(new Blob([text], { type: type }));
    var link = document.createElement('a'); link.href = url; link.download = name; link.click();
    setTimeout(function () { URL.revokeObjectURL(url); }, 500);
  }
  function marketAssets() {
    if (!market || !market.ok) return [];
    return Object.keys(market.rows).map(function (id) { return market.rows[id]; })
      .sort(function (a, b) { return a.name.localeCompare(b.name); });
  }
  function renderAssetOptions() {
    var current = els.asset.value;
    els.asset.replaceChildren();
    var placeholder = document.createElement('option');
    placeholder.value = ''; placeholder.textContent = words.choose; els.asset.appendChild(placeholder);
    marketAssets().forEach(function (asset) {
      var option = document.createElement('option');
      option.value = asset.id; option.textContent = asset.name + ' (' + asset.symbol + ')';
      els.asset.appendChild(option);
    });
    if ([].some.call(els.asset.options, function (option) { return option.value === current; })) els.asset.value = current;
  }
  function renderReceipt() {
    els.receipt.hidden = !(market && market.ok);
    if (!market || !market.ok) return;
    setText(els.source, market.receipt.source);
    setText(els.fetched, time(market.receipt.fetchedAt));
    setText(els.updated, time(market.receipt.sourceUpdatedAt));
    setText(els.ceiling, market.receipt.freshnessCeilingMinutes + ' ' + words.minutes);
  }
  function render() {
    els.currency.value = portfolio.currency;
    els.currency.disabled = portfolio.lots.length > 0;
    els.currencyHint.textContent = portfolio.lots.length ? words.locked : '';
    calculation = engine.calculate(portfolio, market);
    var canValue = calculation.ok;
    setText(els.totalValue, canValue ? money(calculation.totalValue) : '—');
    setText(els.knownCost, canValue ? money(calculation.knownCost) : '—');
    setText(els.pnl, canValue && calculation.knownCost > 0 ? money(calculation.partialPnl) : '—');
    setText(els.pnlLabel, canValue && calculation.costCoverage === 1 ? words.complete : words.partial);
    setText(els.coverage, canValue ? (calculation.costCoverage * 100).toFixed(1) + '%' : '—');
    els.body.replaceChildren();
    if (!portfolio.lots.length) {
      var emptyRow = document.createElement('tr');
      var empty = document.createElement('td'); empty.colSpan = 8; empty.className = 'cp-empty'; empty.textContent = words.none;
      emptyRow.appendChild(empty); els.body.appendChild(emptyRow); return;
    }
    portfolio.lots.forEach(function (lot) {
      var row = document.createElement('tr');
      var marketRow = market && market.ok ? market.rows[lot.assetId] : null;
      var lotValue = marketRow ? lot.quantity * marketRow.price : null;
      var pnl = marketRow && lot.cost != null ? lotValue - lot.cost : null;
      [
        lot.name + ' (' + lot.symbol + ')',
        number(lot.quantity),
        lot.cost == null ? '—' : money(lot.cost),
        marketRow ? money(marketRow.price) : '—',
        lotValue == null ? '—' : money(lotValue),
        pnl == null ? '—' : money(pnl),
        (lot.acquiredOn || '—') + (lot.label ? ' · ' + lot.label : '')
      ].forEach(function (value) { var cell = document.createElement('td'); cell.textContent = value; row.appendChild(cell); });
      var action = document.createElement('td'); var remove = document.createElement('button');
      remove.type = 'button'; remove.className = 'cp-btn'; remove.dataset.remove = lot.id;
      remove.textContent = lang === 'fr' ? 'Supprimer' : 'Remove'; action.appendChild(remove); row.appendChild(action);
      els.body.appendChild(row);
    });
  }
  async function refresh() {
    status(words.loading);
    market = null; render();
    try {
      var response = await fetch('/api/crypto/prices?currency=' + encodeURIComponent(portfolio.currency) + '&limit=100', {
        headers: { Accept: 'application/json' }
      });
      if (!response.ok) throw new Error('snapshot_unavailable');
      var normalized = engine.normalizeMarket(await response.json());
      if (!normalized.ok) throw new Error(normalized.error);
      market = normalized; renderAssetOptions(); renderReceipt(); render();
      if (!calculation.ok && calculation.error === 'missing_market_rows') status(words.missing, 'error');
      else status(words.ready, 'success');
    } catch (_) {
      market = null; renderAssetOptions(); renderReceipt(); render(); status(words.unavailable, 'error');
    }
  }
  function csv() {
    var receipt = market && market.ok ? market.receipt : {};
    var rows = [['Asset', 'Symbol', 'Quantity', 'All-in cost ' + portfolio.currency, 'Current price ' + portfolio.currency, 'Current value ' + portfolio.currency, 'Known-cost P/L ' + portfolio.currency, 'Acquired on', 'Label']];
    portfolio.lots.forEach(function (lot) {
      var row = market && market.ok ? market.rows[lot.assetId] : null;
      var value = row ? row.price * lot.quantity : '';
      rows.push([lot.name, lot.symbol, lot.quantity, lot.cost == null ? '' : lot.cost, row ? row.price : '', value, row && lot.cost != null ? value - lot.cost : '', lot.acquiredOn || '', lot.label]);
    });
    rows.push([]);
    rows.push(['Source', receipt.source || 'unavailable']);
    rows.push(['Fetched at', receipt.fetchedAt || '']);
    rows.push(['Source updated at', receipt.sourceUpdatedAt || '']);
    rows.push(['Cost coverage', calculation && calculation.ok ? (calculation.costCoverage * 100).toFixed(1) + '%' : 'unavailable']);
    rows.push(['Disclaimer', words.planning]);
    return rows.map(function (row) { return row.map(engine.csvCell).join(','); }).join('\r\n');
  }
  function pdf() {
    if (!window.jspdf || !window.jspdf.jsPDF) { status(words.pdfMissing, 'error'); return; }
    var doc = new window.jspdf.jsPDF();
    var y = 18; function line(text, gap) { doc.text(String(text), 14, y); y += gap || 7; }
    doc.setFontSize(17); line(lang === 'fr' ? 'Instantané du portefeuille crypto' : 'Crypto portfolio snapshot', 10);
    doc.setFontSize(10); line(words.planning, 9);
    line((lang === 'fr' ? 'Devise : ' : 'Currency: ') + portfolio.currency);
    line(words.source + ': ' + (market && market.ok ? market.receipt.source : 'unavailable'));
    if (market && market.ok) { line(words.fetched + ': ' + market.receipt.fetchedAt); line(words.updated + ': ' + market.receipt.sourceUpdatedAt); }
    line((lang === 'fr' ? 'Couverture des coûts : ' : 'Cost coverage: ') + (calculation && calculation.ok ? (calculation.costCoverage * 100).toFixed(1) + '%' : 'unavailable'), 9);
    portfolio.lots.forEach(function (lot) {
      if (y > 275) { doc.addPage(); y = 18; }
      var row = market && market.ok ? market.rows[lot.assetId] : null;
      line(lot.name + ' (' + lot.symbol + ') — ' + number(lot.quantity));
      line((lang === 'fr' ? 'Coût : ' : 'Cost: ') + (lot.cost == null ? 'unknown' : money(lot.cost)) + ' | ' + (lang === 'fr' ? 'Valeur : ' : 'Value: ') + (row ? money(row.price * lot.quantity) : 'unavailable'), 9);
    });
    doc.save('crypto-portfolio-' + portfolio.currency.toLowerCase() + '.pdf');
  }

  els.form.addEventListener('submit', function (event) {
    event.preventDefault();
    var asset = market && market.ok ? market.rows[els.asset.value] : null;
    var lot = engine.normalizeLot({
      assetId: asset && asset.id, symbol: asset && asset.symbol, name: asset && asset.name,
      quantity: els.quantity.value, cost: els.cost.value, acquiredOn: els.date.value, label: els.label.value
    });
    if (!lot || portfolio.lots.length >= engine.MAX_LOTS) {
      status(lang === 'fr' ? 'Vérifiez les champs du lot.' : 'Check the lot fields.', 'error'); return;
    }
    portfolio.lots.push(lot); persist(); els.form.reset(); render(); status(words.saved, 'success');
  });
  els.currency.addEventListener('change', function () {
    if (portfolio.lots.length) { els.currency.value = portfolio.currency; status(words.locked, 'error'); return; }
    portfolio.currency = els.currency.value; persist(); refresh();
  });
  els.body.addEventListener('click', function (event) {
    var button = event.target.closest('[data-remove]'); if (!button) return;
    portfolio.lots = portfolio.lots.filter(function (lot) { return lot.id !== button.dataset.remove; });
    persist(); render(); status(words.removed, 'success');
  });
  els.reset.addEventListener('click', function () {
    if (!portfolio.lots.length || !window.confirm(words.confirmReset)) return;
    portfolio = engine.normalizePortfolio({ currency: portfolio.currency, lots: [] }); persist(); render(); status(words.reset, 'success');
  });
  els.json.addEventListener('click', function () { download('crypto-portfolio-backup.json', 'application/json', JSON.stringify(portfolio, null, 2)); });
  els.csv.addEventListener('click', function () { download('crypto-portfolio.csv', 'text/csv;charset=utf-8', '\ufeff' + csv()); });
  els.pdf.addEventListener('click', pdf);
  els.print.addEventListener('click', function () { window.print(); });
  function closeImport() {
    els.importDialog.hidden = true;
    if (importReturnFocus) importReturnFocus.focus();
  }
  els.importOpen.addEventListener('click', function () {
    importReturnFocus = document.activeElement;
    els.importDialog.hidden = false;
    els.importText.focus();
  });
  els.importClose.addEventListener('click', closeImport);
  els.importApply.addEventListener('click', function () {
    var parsed = engine.parseImport(els.importText.value);
    if (!parsed.ok) { status(words.importBad, 'error'); return; }
    portfolio = parsed.portfolio; persist(); els.importText.value = ''; closeImport(); render(); refresh(); status(words.importOk, 'success');
  });
  els.importDialog.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') { closeImport(); return; }
    if (event.key !== 'Tab') return;
    var focusable = Array.prototype.slice.call(els.importDialog.querySelectorAll('textarea,button:not([disabled])'));
    if (!focusable.length) return;
    var first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  render(); refresh();
})();
