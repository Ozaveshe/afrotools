(function () {
  'use strict';

  var engine = window.AfroTools && window.AfroTools.FuelTrackerEngine;
  var state = { rows: [], usable: [], selected: null, result: null };
  var MAX_AGE_DAYS = 45;

  function byId(id) { return document.getElementById(id); }
  function escapeHtml(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]; }); }
  function number(value, digits) { return Number(value).toLocaleString('en-US', { maximumFractionDigits: digits == null ? 2 : digits }); }
  function money(value, currency) { try { return new Intl.NumberFormat('en', { style: 'currency', currency: currency || 'USD', maximumFractionDigits: 2 }).format(value); } catch (_) { return (currency || '') + ' ' + number(value, 2); } }
  function setStatus(message, warning) { var el = byId('fuel-data-status'); el.textContent = message; el.classList.toggle('warn', Boolean(warning)); }
  function selectedRow() { return state.rows.find(function (row) { return row.code === byId('fuel-country').value; }) || null; }
  function selectedFuel() { return byId('fuel-type').value; }
  function rowCheck(row) { return engine.rowUsability(row, selectedFuel(), new Date().toISOString(), MAX_AGE_DAYS); }

  function renderSelection() {
    var row = selectedRow();
    var check = rowCheck(row);
    state.selected = row;
    byId('fuel-price').value = check.usable ? check.localPrice : '';
    byId('fuel-currency').textContent = row ? row.currency + ' per ' + check.unit : 'local currency per litre';
    byId('fuel-date').textContent = row && row.last_updated ? row.last_updated : 'Unavailable';
    byId('fuel-source').hidden = !check.sourceUrl;
    if (check.sourceUrl) byId('fuel-source').href = check.sourceUrl;
    if (check.usable) {
      setStatus(row.name + ' ' + selectedFuel() + ' snapshot: ' + money(check.localPrice, row.currency) + ' per ' + check.unit + '. Dated ' + row.last_updated + ' (' + check.ageDays + ' days old). Third-party planning snapshot; verify the pump or supplier price.', false);
    } else {
      setStatus((row ? row.name + ': ' : '') + check.reason + ' The calculator will not prefill this value. Enter a price you verified locally if you still want a planning estimate.', true);
    }
    byId('fuel-calc').disabled = !row;
    state.result = null;
    byId('fuel-result').hidden = true;
  }

  function calculate() {
    var row = selectedRow();
    var result = engine.calculateGenerator({
      pricePerLitre: byId('fuel-price').value,
      litresPerHour: byId('fuel-rate').value,
      hoursPerDay: byId('fuel-hours').value,
      daysPerMonth: byId('fuel-days').value
    });
    var status = byId('fuel-calc-status');
    if (!result.ok) {
      status.textContent = result.errors.join(' ');
      byId('fuel-result').hidden = true;
      return;
    }
    var currency = row && row.currency || 'USD';
    state.result = Object.assign({}, result, { currency: currency, country: row ? row.name : '', fuel: selectedFuel(), price: Number(byId('fuel-price').value), rate: Number(byId('fuel-rate').value), hours: Number(byId('fuel-hours').value), days: Number(byId('fuel-days').value) });
    byId('fuel-monthly-cost').textContent = money(result.monthlyCost, currency);
    byId('fuel-daily-cost').textContent = money(result.dailyCost, currency);
    byId('fuel-monthly-litres').textContent = number(result.monthlyLitres, 1) + ' L';
    byId('fuel-annual-cost').textContent = money(result.annualCost, currency);
    byId('fuel-result').hidden = false;
    status.textContent = 'Planning estimate calculated locally in your browser.';
  }

  function summary() {
    var value = state.result;
    if (!value) return '';
    return [
      'AfroFuel generator planning estimate',
      'Country: ' + value.country,
      'Fuel: ' + value.fuel,
      'Price entered: ' + money(value.price, value.currency) + '/litre',
      'Consumption: ' + number(value.rate, 2) + ' L/hour',
      'Schedule: ' + number(value.hours, 2) + ' hours/day × ' + number(value.days, 0) + ' days/month',
      'Monthly fuel: ' + number(value.monthlyLitres, 1) + ' L',
      'Monthly cost: ' + money(value.monthlyCost, value.currency),
      'Annual cost: ' + money(value.annualCost, value.currency),
      'Formula: ' + value.formula,
      'Planning estimate only. Verify the local fuel price and your generator consumption.'
    ].join('\n');
  }

  function copySummary() {
    var text = summary();
    if (!text) return;
    var done = function () { byId('fuel-calc-status').textContent = 'Estimate copied.'; };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done).catch(function () { byId('fuel-calc-status').textContent = 'Copy was blocked. Select the result and copy it manually.'; });
    else byId('fuel-calc-status').textContent = 'Copy is unavailable in this browser.';
  }

  function downloadCsv() {
    if (!state.result) return;
    var value = state.result;
    var rows = [['field', 'value'], ['country', value.country], ['fuel', value.fuel], ['currency', value.currency], ['price_per_litre', value.price], ['litres_per_hour', value.rate], ['hours_per_day', value.hours], ['days_per_month', value.days], ['monthly_litres', value.monthlyLitres], ['monthly_cost', value.monthlyCost], ['annual_cost', value.annualCost], ['disclaimer', 'Planning estimate; verify local inputs.']];
    var csv = rows.map(function (row) { return row.map(function (cell) { return '"' + String(cell).replace(/"/g, '""') + '"'; }).join(','); }).join('\n');
    var link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    link.download = 'afrofuel-generator-estimate.csv';
    link.click();
    URL.revokeObjectURL(link.href);
    byId('fuel-calc-status').textContent = 'CSV downloaded.';
  }

  function renderTable() {
    var fuel = selectedFuel();
    var body = byId('fuel-table-body');
    var usable = state.rows.map(function (row) { return { row: row, check: engine.rowUsability(row, fuel, new Date().toISOString(), MAX_AGE_DAYS) }; }).filter(function (item) { return item.check.usable; });
    state.usable = usable;
    byId('fuel-coverage').textContent = usable.length + ' of ' + state.rows.length + ' rows meet the 45-day, numeric-price and row-source checks for ' + fuel + '.';
    body.innerHTML = usable.map(function (item) {
      var row = item.row; var check = item.check;
      return '<tr><td data-label="Country"><strong>' + escapeHtml(row.name) + '</strong><br><small>' + escapeHtml(row.code) + '</small></td><td data-label="Local snapshot">' + escapeHtml(money(check.localPrice, row.currency)) + '/' + escapeHtml(check.unit) + '</td><td data-label="USD comparison">' + escapeHtml(money(check.usdPrice, 'USD')) + '/' + escapeHtml(check.unit) + '</td><td data-label="Row date">' + escapeHtml(row.last_updated) + '</td><td data-label="Evidence"><a href="' + escapeHtml(check.sourceUrl) + '" rel="noopener noreferrer" target="_blank">Open source</a></td></tr>';
    }).join('') || '<tr><td colspan="5">No rows currently pass the display checks for this fuel type.</td></tr>';
  }

  function populate(payload) {
    state.rows = Array.isArray(payload && payload.countries) ? payload.countries : [];
    var select = byId('fuel-country');
    select.innerHTML = state.rows.slice().sort(function (a, b) { return a.name.localeCompare(b.name); }).map(function (row) { return '<option value="' + escapeHtml(row.code) + '">' + escapeHtml(row.name) + '</option>'; }).join('');
    if (state.rows.some(function (row) { return row.code === 'NG'; })) select.value = 'NG';
    byId('fuel-package-date').textContent = payload && payload.timestamp ? String(payload.timestamp).slice(0, 10) : 'Unavailable';
    renderSelection();
    renderTable();
  }

  function fail(message) {
    setStatus('Fuel snapshots are unavailable: ' + message + ' No prices or estimates have been prefilled.', true);
    byId('fuel-country').innerHTML = '<option value="">Unavailable</option>';
    byId('fuel-calc').disabled = true;
    byId('fuel-coverage').textContent = 'No usable rows.';
    byId('fuel-table-body').innerHTML = '<tr><td colspan="5">Fuel data unavailable.</td></tr>';
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!engine) return fail('calculation engine did not load');
    byId('fuel-country').addEventListener('change', renderSelection);
    byId('fuel-type').addEventListener('change', function () { renderSelection(); renderTable(); });
    byId('fuel-calc').addEventListener('click', calculate);
    byId('fuel-copy').addEventListener('click', copySummary);
    byId('fuel-csv').addEventListener('click', downloadCsv);
    byId('fuel-print').addEventListener('click', function () { if (state.result) window.print(); });
    fetch('/data/fuel/latest.json', { cache: 'no-store', credentials: 'same-origin' }).then(function (response) {
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return response.json();
    }).then(populate).catch(function (error) { fail(error && error.message ? error.message : 'request failed'); });
  });
}());
