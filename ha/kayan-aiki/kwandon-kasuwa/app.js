(function () {
  'use strict';

  document.getElementById('mdObservedAt').value = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  var latestStapleRows = [];
  var latestBasketBrief = '';

  function numberFrom(id, fallback) {
    var el = document.getElementById(id);
    var value = Number(el && el.value);
    return Number.isFinite(value) && value > 0 ? value : fallback;
  }
  function money(value, currency) {
    var amount = Number(value || 0);
    return (currency || '') + ' ' + amount.toLocaleString(undefined, { maximumFractionDigits: 0 });
  }
  function staplePrice(row) {
    var price = Number(row.price || row.price_amount || row.observed_price || 0);
    return Number.isFinite(price) ? price : 0;
  }
  function stapleCategory(row) {
    return String(row.product_category || row.category || '').toLowerCase();
  }
  function stapleName(row) {
    return String(row.product_name || row.item_name || '').toLowerCase();
  }
  function pickStaple(rows, matcher) {
    var matches = rows.filter(function (row) { return staplePrice(row) > 0 && matcher(row); }).sort(function (a, b) { return staplePrice(a) - staplePrice(b); });
    return matches[0] || null;
  }
  function buildBasketRows(rows, focus) {
    var picks = [];
    var add = function (label, matcher, multiplier) {
      var row = pickStaple(rows, matcher);
      if (row) picks.push({ label: label, row: row, multiplier: multiplier || 1 });
    };
    add('Babban carbohydrate', function (row) { return /rice|maize|garri|flour|yam|cassava|bread|cereal/.test(stapleName(row)) || /staple/.test(stapleCategory(row)); }, focus === 'calories' ? 1.4 : 1);
    add('Man girki ko fat', function (row) { return /oil|butter|margarine/.test(stapleName(row)); }, 0.35);
    add('Protein', function (row) { return /beans|egg|fish|meat|chicken|protein/.test(stapleName(row)) || /protein/.test(stapleCategory(row)); }, focus === 'protein' ? 1.2 : 0.7);
    add('Kayan miya / vegetables', function (row) { return /tomato|onion|pepper|vegetable|plantain|produce/.test(stapleName(row)) || /produce/.test(stapleCategory(row)); }, focus === 'school' ? 0.8 : 0.6);
    add('Household essential', function (row) { return /soap|detergent|toilet|salt|sugar|milk|household/.test(stapleName(row)) || /household/.test(stapleCategory(row)); }, focus === 'school' ? 1 : 0.5);
    return picks;
  }
  function renderStapleBasketPlanner(rows) {
    latestStapleRows = rows || latestStapleRows || [];
    var output = document.getElementById('basketPlanOutput');
    if (!output) return;
    var priced = latestStapleRows.filter(function (row) { return staplePrice(row) > 0; });
    if (!priced.length) {
      latestBasketBrief = 'Kwandon kasuwa: babu verified staple prices da aka loda don wannan filter.';
      output.className = 'ha-note-box';
      output.textContent = 'Ba a loda verified prices ba tukuna. Aika core items kamar rice/maize, oil, beans/eggs, vegetables da household essential.';
      return;
    }
    var household = numberFrom('basketHousehold', 4);
    var days = numberFrom('basketDays', 7);
    var budget = numberFrom('basketBudget', 0);
    var focusEl = document.getElementById('basketFocus');
    var focus = focusEl ? focusEl.value : 'balanced';
    var basket = buildBasketRows(priced, focus);
    var currency = (basket[0] && (basket[0].row.currency_code || basket[0].row.currency)) || (priced[0].currency_code || priced[0].currency || '');
    var scale = Math.max(0.5, household / 4) * Math.max(0.35, days / 7);
    var estimated = basket.reduce(function (sum, item) { return sum + (staplePrice(item.row) * item.multiplier * scale); }, 0);
    var buffer = estimated * 0.12;
    var total = estimated + buffer;
    var status = budget > 0 ? (total <= budget ? 'Ya shiga budget' : 'Budget gap: ' + money(total - budget, currency)) : 'Saka budget don ganin gap';
    var items = basket.map(function (item) { return item.label + ': ' + (item.row.product_name || 'item') + ' at ' + money(staplePrice(item.row), currency); });
    latestBasketBrief = 'Kwandon kasuwa ga mutane ' + household + ' / kwanaki ' + days + '. Estimate: ' + money(total, currency) + '. ' + status + '. Items: ' + items.join('; ');
    if (!basket.length) {
      output.className = 'ha-note-box';
      output.textContent = 'Prices suna nan, amma ba su rufe common basket items sosai ba. Aika product names da units kamar rice 1kg, oil 1L, beans 1kg, tomatoes basket, soap pack.';
      return;
    }
    output.className = '';
    output.innerHTML = '<div class="ha-metric-grid">' +
      '<div class="ha-metric"><div class="ha-metric-value">' + money(total, currency) + '</div><div class="ha-metric-label">Estimated basket</div></div>' +
      '<div class="ha-metric"><div class="ha-metric-value">' + money(buffer, currency) + '</div><div class="ha-metric-label">12% market buffer</div></div>' +
      '<div class="ha-metric"><div class="ha-metric-value">' + status + '</div><div class="ha-metric-label">Budget check</div></div>' +
      '</div><div class="ha-note-box" style="margin-top:12px;"><strong>Recommended shopping order:</strong> ' + items.join(' | ') + '</div>';
  }
  function copyBasketPlan() {
    if (!latestBasketBrief) renderStapleBasketPlanner(latestStapleRows);
    navigator.clipboard.writeText(latestBasketBrief).then(function () {
      window.MarketDataApp && window.MarketDataApp.showToast('An copy basket plan.', 'success');
    }).catch(function () {
      window.prompt('Copy basket plan', latestBasketBrief);
    });
  }
  function renderBasketQuality() {
    var box = document.getElementById('basketQuality');
    if (!box) return;
    var checks = [
      { id: 'report_product_name', label: 'item name' },
      { id: 'report_product_category', label: 'category' },
      { id: 'report_price', label: 'price' },
      { id: 'report_unit', label: 'unit' },
      { id: 'mdReportMerchant', label: 'market/store' },
      { id: 'mdProofUrl', label: 'proof URL ko receipt note' }
    ];
    var missing = checks.filter(function (check) {
      var el = document.getElementById(check.id);
      return !el || !String(el.value || '').trim();
    }).map(function (check) { return check.label; });
    var score = checks.length - missing.length;
    box.innerHTML = '<strong>Submission quality: ' + score + '/' + checks.length + '</strong><br>' +
      (missing.length ? 'Ƙara: ' + missing.join(', ') + '.' : 'Report ɗin ya cika sosai.') +
      '<ul class="ha-list"><li>Yi amfani da unit bayyananne kamar per kg, 1L bottle, crate, pack ko basket.</li><li>Fresh report da proof suna taimaka wajen rage rumor.</li></ul>';
  }
  document.addEventListener('input', function (event) {
    if (event.target && /^(basket|report_|mdReportMerchant|mdProofUrl)/.test(event.target.id || '')) {
      renderStapleBasketPlanner(latestStapleRows);
      renderBasketQuality();
    }
  });
  document.addEventListener('change', function (event) {
    if (event.target && /^(basket|report_|mdReportMerchant|mdProofUrl)/.test(event.target.id || '')) {
      renderStapleBasketPlanner(latestStapleRows);
      renderBasketQuality();
    }
  });
  var copyButton = document.getElementById('basketCopy');
  if (copyButton) copyButton.addEventListener('click', copyBasketPlan);

  window.MarketDataApp.mount({
    endpoint: '/api/staple-baskets',
    responseKey: 'recent_prices',
    subtype: 'staple_price',
    vertical: 'staple_basket',
    limit: 36,
    reportButtonLabel: 'Submit price',
    reportFields: [
      { key: 'product_name', label: 'Sunan item', type: 'text', required: true, placeholder: 'misali Rice 1kg' },
      { key: 'product_category', label: 'Category', type: 'select', required: true, options: ['Food Staples', 'Produce', 'Protein', 'Household', 'Other'] },
      { key: 'price', label: 'Observed price', type: 'number', required: true, min: 0 },
      { key: 'unit', label: 'Unit', type: 'text', required: true, placeholder: 'misali per kg, 1L bottle, basket' },
      { key: 'brand_name', label: 'Brand ko variety', type: 'text', required: false, placeholder: 'Optional' },
      { key: 'notes', label: 'Price context', type: 'textarea', required: false, placeholder: 'Cash price, bulk discount, scarcity, quality grade, ko promo note' }
    ],
    renderSummary: function (rows, data) {
      setTimeout(function () {
        renderStapleBasketPlanner(rows);
        renderBasketQuality();
      }, 0);
      var uniqueItems = {};
      rows.forEach(function (row) { if (row.product_name) uniqueItems[String(row.product_name).toLowerCase()] = true; });
      return '<div class="md-stat"><div class="md-stat-value">' + (data.snapshots || []).length + '</div><div class="md-stat-label">Basket snapshots</div></div>' +
        '<div class="md-stat"><div class="md-stat-value">' + rows.length + '</div><div class="md-stat-label">Recent verified prices</div></div>' +
        '<div class="md-stat"><div class="md-stat-value">' + Object.keys(uniqueItems).length + '</div><div class="md-stat-label">Distinct items</div></div>';
    },
    renderCard: function (row, helpers) {
      var unit = row.unit ? ' / ' + row.unit : '';
      var observed = row.observed_at ? new Date(row.observed_at).toLocaleDateString() : 'Recent';
      return '<article class="md-card"><h3>' + helpers.escapeHtml(row.product_name || 'Staple item') + '</h3>' +
        '<p>' + helpers.escapeHtml((row.market_name || row.merchant_name || 'Local market') + ' - ' + (row.city || '')) + '</p>' +
        '<div class="md-meta"><span class="md-pill">' + helpers.escapeHtml(row.currency_code || '') + ' ' + helpers.escapeHtml(row.price || '') + helpers.escapeHtml(unit) + '</span><span class="md-pill">' + helpers.escapeHtml(row.product_category || 'Staple') + '</span></div>' +
        '<div class="md-meta"><span class="md-pill">' + helpers.escapeHtml(row.country_code || '') + '</span><span class="md-pill">' + helpers.escapeHtml(observed) + '</span><span class="md-pill">' + (row.proof_url ? 'Proof linked' : 'Proof pending') + '</span></div></article>';
    }
  });
})();
