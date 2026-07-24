(function () {
  'use strict';
  var form = document.getElementById('rfPlanner');
  if (!form || !window.RouteFaresEngine) return;
  var output = document.getElementById('rfResult');
  var status = document.getElementById('rfStatus');
  var lastResult = null;

  function value(name) { return form.elements[name].value; }
  function money(amount) {
    var currency = String(value('currency') || 'USD').toUpperCase();
    try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency, maximumFractionDigits: 2 }).format(amount); }
    catch (_) { return currency + ' ' + amount.toFixed(2); }
  }
  function resultText(result) {
    var route = value('route').trim() || 'Planned route';
    var change = result.changePercent == null ? 'Not compared' : (result.changePercent >= 0 ? '+' : '') + result.changePercent.toFixed(1) + '%';
    return [
      'Route fare budget: ' + route,
      'Total budget: ' + money(result.total),
      'Base travel cost: ' + money(result.base),
      'Contingency buffer: ' + money(result.buffer),
      'Rides planned: ' + result.totalRides,
      'Change from previous fare: ' + change,
      'Planning estimate only. Confirm the current fare and extras with the operator before travel.'
    ].join('\n');
  }
  function render(result) {
    lastResult = result;
    output.hidden = false;
    document.getElementById('rfTotal').textContent = money(result.total);
    document.getElementById('rfBase').textContent = money(result.base);
    document.getElementById('rfBuffer').textContent = money(result.buffer);
    document.getElementById('rfRides').textContent = String(result.totalRides);
    document.getElementById('rfDaily').textContent = money(result.daily);
    document.getElementById('rfChange').textContent = result.changePercent == null ? 'Not compared' : (result.changePercent >= 0 ? '+' : '') + result.changePercent.toFixed(1) + '%';
    status.textContent = 'Budget updated. Inputs remain on this device.';
    status.className = 'rf-status';
  }
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    try {
      render(window.RouteFaresEngine.calculate({
        fare: value('fare'), ridesPerDay: value('ridesPerDay'), days: value('days'),
        extraPerRide: value('extraPerRide'), bufferPercent: value('bufferPercent'), previousFare: value('previousFare')
      }));
    } catch (error) {
      output.hidden = true;
      status.textContent = error.message;
      status.className = 'rf-status rf-error';
    }
  });
  document.getElementById('rfCopy').addEventListener('click', function () {
    if (!lastResult) return;
    var text = resultText(lastResult);
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { status.textContent = 'Summary copied.'; }).catch(function () { status.textContent = 'Copy blocked. Select the result text instead.'; });
  });
  document.getElementById('rfDownload').addEventListener('click', function () {
    if (!lastResult) return;
    var blob = new Blob([resultText(lastResult)], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url; link.download = 'route-fare-budget.txt'; document.body.appendChild(link); link.click(); link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 0);
    status.textContent = 'Text summary downloaded.';
  });
  document.getElementById('rfPrint').addEventListener('click', function () { if (lastResult) window.print(); });

  function escapeHtml(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]; }); }
  function date(value) { var parsed = new Date(value); return Number.isNaN(parsed.getTime()) ? 'Date not supplied' : parsed.toLocaleDateString(); }
  async function loadFeed() {
    var feed = document.getElementById('rfFeed');
    var button = document.getElementById('rfRefresh');
    button.setAttribute('aria-busy', 'true'); button.disabled = true;
    feed.innerHTML = '<div class="rf-empty">Checking published observations…</div>';
    try {
      var response = await fetch('/api/transport-fares?limit=6');
      if (!response.ok) throw new Error('HTTP ' + response.status);
      var body = await response.json();
      var rows = Array.isArray(body.fares) ? body.fares : [];
      if (!rows.length) feed.innerHTML = '<div class="rf-empty">No published observations are available. Use a fare you have confirmed locally in the planner above.</div>';
      else feed.innerHTML = rows.map(function (row) {
        var route = row.route_name || [row.route_from, row.route_to].filter(Boolean).join(' to ') || 'Unnamed route';
        return '<article class="rf-observation"><h3>' + escapeHtml(route) + '</h3><p>' + escapeHtml(row.currency_code || '') + ' ' + escapeHtml(row.fare_amount || '') + ' · ' + escapeHtml(row.city || 'City not supplied') + '</p><div class="rf-meta"><span class="rf-pill">Observed ' + escapeHtml(date(row.observed_at)) + '</span><span class="rf-pill">Published community report</span></div></article>';
      }).join('');
    } catch (_) {
      feed.innerHTML = '<div class="rf-empty">Community observations are unavailable right now. The local budget planner still works; enter a fare confirmed with your operator.</div>';
    } finally { button.removeAttribute('aria-busy'); button.disabled = false; }
  }
  document.getElementById('rfRefresh').addEventListener('click', loadFeed);
  form.requestSubmit();
  loadFeed();
})();
