(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.AfroTools = root.AfroTools || {};
  root.AfroTools.CryptoPortfolioLots = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var MAX_LOTS = 100;
  var MAX_IMPORT_BYTES = 100000;
  var CURRENCIES = ['NGN', 'ZAR'];

  function finitePositive(value) {
    var number = Number(value);
    return Number.isFinite(number) && number > 0 ? number : null;
  }

  function cleanText(value, maxLength) {
    return String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, maxLength);
  }

  function cleanDate(value, today) {
    if (!value) return null;
    var text = String(value);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
    return text <= (today || new Date().toISOString().slice(0, 10)) ? text : null;
  }

  function normalizeLot(raw, today) {
    raw = raw || {};
    var quantity = finitePositive(raw.quantity);
    var assetId = cleanText(raw.assetId, 80).toLowerCase();
    var symbol = cleanText(raw.symbol, 12).toUpperCase();
    var name = cleanText(raw.name, 80);
    if (!quantity || !assetId || !symbol || !name) return null;
    var cost = raw.cost === '' || raw.cost == null ? null : finitePositive(raw.cost);
    if (raw.cost !== '' && raw.cost != null && cost == null) return null;
    return {
      id: cleanText(raw.id, 80) || ('lot-' + Date.now() + '-' + Math.random().toString(36).slice(2, 9)),
      assetId: assetId,
      symbol: symbol,
      name: name,
      quantity: quantity,
      cost: cost,
      acquiredOn: cleanDate(raw.acquiredOn, today),
      label: cleanText(raw.label, 60)
    };
  }

  function normalizePortfolio(raw, today) {
    raw = raw || {};
    var currency = CURRENCIES.indexOf(String(raw.currency || '').toUpperCase()) >= 0
      ? String(raw.currency).toUpperCase()
      : 'NGN';
    var lots = Array.isArray(raw.lots) ? raw.lots.slice(0, MAX_LOTS).map(function (lot) {
      return normalizeLot(lot, today);
    }).filter(Boolean) : [];
    return { version: 1, currency: currency, lots: lots };
  }

  function parseImport(text, today) {
    if (typeof text !== 'string' || new TextEncoder().encode(text).length > MAX_IMPORT_BYTES) {
      return { ok: false, error: 'size' };
    }
    try {
      var parsed = JSON.parse(text);
      if (!parsed || parsed.version !== 1 || !CURRENCIES.includes(String(parsed.currency || '').toUpperCase()) || !Array.isArray(parsed.lots) || parsed.lots.length > MAX_LOTS) {
        return { ok: false, error: 'shape' };
      }
      var portfolio = normalizePortfolio(parsed, today);
      if (portfolio.lots.length !== parsed.lots.length) return { ok: false, error: 'lot' };
      return { ok: true, portfolio: portfolio };
    } catch (_) {
      return { ok: false, error: 'json' };
    }
  }

  function normalizeMarket(payload, nowMs) {
    var fetchedAt = Date.parse(payload && payload.fetchedAt);
    var sourceUpdatedAt = Date.parse(payload && (payload.latestSourceUpdatedAt || payload.sourceUpdatedAt));
    var ceiling = Number(payload && payload.freshnessCeilingMinutes);
    var now = Number.isFinite(nowMs) ? nowMs : Date.now();
    if (!payload || payload.status !== 'fresh' || !Array.isArray(payload.data) ||
        !Number.isFinite(fetchedAt) || !Number.isFinite(sourceUpdatedAt) ||
        !Number.isFinite(ceiling) || ceiling <= 0 ||
        now - sourceUpdatedAt > ceiling * 60000 || sourceUpdatedAt - now > 60000) {
      return { ok: false, error: 'stale_or_invalid' };
    }
    var rows = {};
    payload.data.forEach(function (raw) {
      var id = cleanText(raw && raw.id, 80).toLowerCase();
      var price = finitePositive(raw && (raw.currentPrice != null ? raw.currentPrice : raw.current_price));
      if (!id || !price) return;
      var changeRaw = raw.price_change_percentage_24h_in_currency != null
        ? raw.price_change_percentage_24h_in_currency
        : (raw.priceChangePercentage24h != null ? raw.priceChangePercentage24h : raw.price_change_percentage_24h);
      var change = Number(changeRaw);
      rows[id] = {
        id: id,
        symbol: cleanText(raw.symbol, 12).toUpperCase(),
        name: cleanText(raw.name, 80),
        price: price,
        change24h: Number.isFinite(change) ? change : null
      };
    });
    if (!Object.keys(rows).length) return { ok: false, error: 'empty' };
    return {
      ok: true,
      rows: rows,
      receipt: {
        source: cleanText(payload.source && payload.source.name ? payload.source.name : payload.source, 60) || 'CoinGecko',
        fetchedAt: new Date(fetchedAt).toISOString(),
        sourceUpdatedAt: new Date(sourceUpdatedAt).toISOString(),
        freshnessCeilingMinutes: ceiling
      }
    };
  }

  function calculate(portfolio, market) {
    portfolio = normalizePortfolio(portfolio);
    if (!market || !market.ok) return { ok: false, error: 'market_unavailable', assets: [] };
    var groups = {};
    portfolio.lots.forEach(function (lot) {
      var row = market.rows[lot.assetId];
      var key = lot.assetId;
      if (!groups[key]) groups[key] = {
        assetId: key, symbol: lot.symbol, name: lot.name, quantity: 0,
        knownCostQuantity: 0, knownCost: 0, lotCount: 0, missingMarket: !row
      };
      var group = groups[key];
      group.quantity += lot.quantity;
      group.lotCount += 1;
      if (lot.cost != null) {
        group.knownCostQuantity += lot.quantity;
        group.knownCost += lot.cost;
      }
    });
    var assets = Object.keys(groups).map(function (key) {
      var group = groups[key];
      var row = market.rows[key];
      if (!row) return group;
      group.price = row.price;
      group.change24h = row.change24h;
      group.value = group.quantity * row.price;
      group.knownCostValue = group.knownCostQuantity * row.price;
      group.partialPnl = group.knownCostValue - group.knownCost;
      group.costCoverage = group.quantity ? group.knownCostQuantity / group.quantity : 0;
      group.averageCost = group.knownCostQuantity ? group.knownCost / group.knownCostQuantity : null;
      return group;
    });
    var missing = assets.filter(function (asset) { return asset.missingMarket; });
    if (missing.length) return { ok: false, error: 'missing_market_rows', assets: assets, missingAssetIds: missing.map(function (asset) { return asset.assetId; }) };
    var totalValue = assets.reduce(function (sum, asset) { return sum + asset.value; }, 0);
    assets.forEach(function (asset) { asset.allocation = totalValue ? asset.value / totalValue : 0; });
    var knownCost = assets.reduce(function (sum, asset) { return sum + asset.knownCost; }, 0);
    var knownCostValue = assets.reduce(function (sum, asset) { return sum + asset.knownCostValue; }, 0);
    var totalQuantityValue = assets.reduce(function (sum, asset) { return sum + asset.value; }, 0);
    return {
      ok: true,
      assets: assets,
      totalValue: totalValue,
      knownCost: knownCost,
      knownCostValue: knownCostValue,
      partialPnl: knownCostValue - knownCost,
      costCoverage: totalQuantityValue ? knownCostValue / totalQuantityValue : 0
    };
  }

  function csvCell(value) {
    var text = String(value == null ? '' : value);
    if (/^[=+\-@]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  }

  return {
    MAX_LOTS: MAX_LOTS,
    MAX_IMPORT_BYTES: MAX_IMPORT_BYTES,
    normalizeLot: normalizeLot,
    normalizePortfolio: normalizePortfolio,
    normalizeMarket: normalizeMarket,
    calculate: calculate,
    parseImport: parseImport,
    csvCell: csvCell
  };
});
