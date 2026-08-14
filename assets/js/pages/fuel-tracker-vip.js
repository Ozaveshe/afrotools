(function () {
  'use strict';

  var engine = window.AfroTools && window.AfroTools.FuelTrackerEngine;
  var MAX_AGE_DAYS = 45;
  var state = { payload: null, legacySnapshot: null, markets: [], selected: null, record: null };

  function byId(id) { return document.getElementById(id); }
  function escapeHtml(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]; }); }
  function money(value, currency) { try { return new Intl.NumberFormat('en', { style: 'currency', currency: currency, maximumFractionDigits: 2 }).format(value); } catch (_) { return currency + ' ' + Number(value).toLocaleString('en', { maximumFractionDigits: 2 }); } }
  function number(value, digits) { return Number(value).toLocaleString('en', { maximumFractionDigits: digits == null ? 2 : digits }); }
  function safeEvent(name, values) {
    var payload = Object.assign({ tool_id: 'fuel-tracker' }, values || {});
    if (window.AfroTools && window.AfroTools.analytics && typeof window.AfroTools.analytics.track === 'function') window.AfroTools.analytics.track(name, payload);
    else if (typeof window.gtag === 'function') window.gtag('event', name, payload);
  }
  function marketById(id) { return state.markets.find(function (market) { return market.market_id === id; }) || null; }
  function selectedFuel() { return byId('fuel-type').value; }
  function staleLimit() { return Number(state.payload && state.payload.stale_after_days) || MAX_AGE_DAYS; }

  function setLocationStatus(message, warning) {
    var element = byId('fuel-location-status');
    element.textContent = message;
    element.classList.toggle('warn', Boolean(warning));
  }

  function setMarketOptions(countryCode, preferredMarketId) {
    var options = state.markets.filter(function (market) { return market.country_code === countryCode; });
    byId('fuel-market').innerHTML = options.map(function (market) {
      return '<option value="' + escapeHtml(market.market_id) + '">' + escapeHtml(market.locality_name) + ' — ' + escapeHtml(engine.granularityLabel(market.granularity)) + '</option>';
    }).join('');
    if (preferredMarketId && options.some(function (market) { return market.market_id === preferredMarketId; })) byId('fuel-market').value = preferredMarketId;
    renderResult();
  }

  function unavailable(market, record, status) {
    state.selected = market;
    state.record = record;
    byId('fuel-result-granularity').textContent = market ? engine.granularityLabel(market.granularity, market.country_name) : 'Data unavailable';
    byId('fuel-result-place').textContent = market ? market.locality_name + ', ' + market.country_name : 'Fuel references unavailable';
    byId('fuel-result-confidence').textContent = status && status.stale ? 'Stale' : 'Unavailable';
    byId('fuel-result-confidence').className = 'fuel-confidence warn';
    byId('fuel-result-price').textContent = 'Price unavailable';
    byId('fuel-result-note').textContent = (status && status.reason || 'No matching fuel record.') + ' Enter a price you verified locally to calculate fill cost.';
    byId('fuel-result-comparison').textContent = 'No current same-market fuel comparison is available. Choose another supported market above or enter a verified local price.';
    byId('fuel-result-effective').textContent = record && record.effective_date || '—';
    byId('fuel-result-verified').textContent = record && record.last_verified_at || '—';
    byId('fuel-result-source').textContent = record && record.source_name || 'Unavailable';
    byId('fuel-result-source').removeAttribute('href');
    if (record && record.source_url) byId('fuel-result-source').href = record.source_url;
    byId('fuel-result-coverage').textContent = market && market.coverage_note || 'No maintained coverage.';
    byId('fuel-price').value = '';
    byId('fuel-price-help').textContent = (record && record.currency || 'Local currency') + ' per litre; no stale value was prefilled.';
    safeEvent('fuel_unavailable_shown', { market_id: market && market.market_id || 'none', country_code: market && market.country_code || 'none', fuel_type: selectedFuel(), data_granularity: market && market.granularity || 'none', reason: status && status.stale ? 'stale' : 'missing' });
  }

  function renderResult() {
    var market = marketById(byId('fuel-market').value);
    var record = engine.marketRecord(market, selectedFuel());
    var status = engine.recordStatus(record, new Date().toISOString(), staleLimit());
    if (!market || !record || !status.available) return unavailable(market, record, status);
    state.selected = market;
    state.record = record;
    byId('fuel-result-granularity').textContent = engine.granularityLabel(market.granularity, market.country_name);
    byId('fuel-result-place').textContent = market.locality_name + (market.granularity === 'national' ? '' : ', ' + market.country_name);
    byId('fuel-result-confidence').textContent = record.confidence + ' confidence';
    byId('fuel-result-confidence').className = 'fuel-confidence ' + record.confidence;
    byId('fuel-result-price').textContent = money(record.price, record.currency) + ' / ' + record.unit;
    byId('fuel-result-note').textContent = record.notes;
    var otherFuel = record.fuel_type === 'petrol' ? 'diesel' : 'petrol';
    var otherRecord = engine.marketRecord(market, otherFuel);
    var otherStatus = engine.recordStatus(otherRecord, new Date().toISOString(), staleLimit());
    if (otherStatus.available && otherRecord.currency === record.currency && otherRecord.unit === record.unit) {
      var difference = otherRecord.price - record.price;
      var direction = difference === 0 ? 'the same price as' : Math.abs(difference) + ' ' + record.currency + ' per ' + record.unit + (difference > 0 ? ' more than' : ' less than');
      byId('fuel-result-comparison').textContent = (otherFuel === 'petrol' ? 'Petrol / gasoline' : 'Diesel') + ' is ' + direction + ' this ' + record.fuel_type + ' reference in the same market.';
    } else {
      byId('fuel-result-comparison').textContent = 'No current same-market fuel comparison is available.';
    }
    byId('fuel-result-effective').textContent = record.effective_date;
    byId('fuel-result-verified').textContent = record.last_verified_at;
    byId('fuel-result-source').textContent = record.source_name;
    byId('fuel-result-source').href = record.source_url;
    byId('fuel-result-coverage').textContent = market.coverage_note;
    byId('fuel-price').value = record.price;
    byId('fuel-price-help').textContent = record.currency + ' per litre. Replace it if you have a newer local price.';
    safeEvent('fuel_localized_result_shown', { market_id: market.market_id, country_code: market.country_code, fuel_type: record.fuel_type, data_granularity: market.granularity, location_used: false, result_shown: true });
  }

  function useLocation() {
    safeEvent('fuel_location_requested', { location_used: true });
    setLocationStatus('Waiting for browser location permission…', false);
    if (!navigator.geolocation) {
      setLocationStatus('This browser does not support location. Choose a country and market manually.', true);
      safeEvent('fuel_location_unavailable', { reason: 'unsupported' });
      return;
    }
    navigator.geolocation.getCurrentPosition(function (position) {
      var nearest = engine.nearestMarket(state.markets, position.coords.latitude, position.coords.longitude);
      if (!nearest || !nearest.market || !Number.isFinite(nearest.distanceKm)) {
        setLocationStatus('No supported market could be matched. Choose manually.', true);
        safeEvent('fuel_location_unavailable', { reason: 'no_market' });
        return;
      }
      var market = nearest.market;
      byId('fuel-country').value = market.country_code;
      setMarketOptions(market.country_code, market.market_id);
      setLocationStatus('Matched locally to ' + market.locality_name + ' (' + number(nearest.distanceKm, 0) + ' km from its reference point). Your coordinates were not retained.', false);
      safeEvent('fuel_location_granted', { location_used: true, market_id: market.market_id, country_code: market.country_code, data_granularity: market.granularity });
    }, function (error) {
      var reason = error && error.code === 1 ? 'denied' : error && error.code === 3 ? 'timeout' : 'unavailable';
      setLocationStatus(reason === 'denied' ? 'Location permission was denied. Choose a country and market manually.' : 'Location could not be read. Choose a country and market manually.', true);
      safeEvent('fuel_location_denied', { location_used: true, reason: reason });
    }, { enableHighAccuracy: false, maximumAge: 300000, timeout: 10000 });
  }

  function toggleFillMode() {
    var tank = byId('fuel-fill-mode').value === 'tank';
    byId('fuel-quantity-field').hidden = tank;
    byId('fuel-tank-field').hidden = !tank;
    byId('fuel-level-field').hidden = !tank;
  }

  function calculateFill() {
    var result = engine.calculateFillCost({
      pricePerLitre: byId('fuel-price').value,
      mode: byId('fuel-fill-mode').value,
      unit: byId('fuel-unit').value,
      quantity: byId('fuel-quantity').value,
      tankSize: byId('fuel-tank-size').value,
      currentLevelPct: byId('fuel-current-level').value
    });
    if (!result.ok) {
      byId('fuel-fill-result').hidden = true;
      byId('fuel-fill-status').textContent = result.errors.join(' ');
      return;
    }
    var currency = state.record && state.record.currency || (byId('fuel-price-help').textContent.split(' ')[0] || 'USD');
    byId('fuel-fill-total').textContent = money(result.totalCost, currency);
    byId('fuel-fill-volume').textContent = number(result.inputAmount, 2) + ' ' + (result.inputUnit === 'gallon' ? 'US gallons' : 'litres') + ' = ' + number(result.litres, 2) + ' litres.';
    byId('fuel-fill-result').hidden = false;
    byId('fuel-fill-status').textContent = 'Fill cost calculated locally. Verify the pump price before paying.';
    safeEvent('fuel_fill_cost_completed', { market_id: state.selected && state.selected.market_id || 'manual', country_code: state.selected && state.selected.country_code || 'manual', fuel_type: selectedFuel(), input_unit: result.inputUnit, fill_mode: result.mode });
  }

  function renderCoverage() {
    var now = new Date().toISOString();
    var eligible = 0;
    var rows = [];
    state.markets.forEach(function (market) {
      (market.fuels || []).forEach(function (record) {
        var status = engine.recordStatus(record, now, staleLimit());
        if (status.available) eligible += 1;
        rows.push('<tr>'
          + '<td data-label="Market"><strong>' + escapeHtml(market.locality_name) + '</strong><br><small>' + escapeHtml(market.country_name) + '</small></td>'
          + '<td data-label="Coverage">' + escapeHtml(engine.granularityLabel(market.granularity, market.country_name)) + '</td>'
          + '<td data-label="Fuel">' + escapeHtml(record.fuel_type === 'petrol' ? 'Petrol / gasoline' : 'Diesel') + '</td>'
          + '<td data-label="Availability">' + escapeHtml(status.available ? 'Eligible' : status.stale ? 'Stale — unavailable' : 'Unavailable') + '</td>'
          + '<td data-label="Effective">' + escapeHtml(record.effective_date) + '</td>'
          + '<td data-label="Source"><a href="' + escapeHtml(record.source_url) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(record.source_name) + '</a></td>'
          + '</tr>');
      });
    });
    byId('fuel-table-body').innerHTML = rows.join('');
    byId('fuel-data-status').textContent = eligible + ' eligible record' + (eligible === 1 ? '' : 's') + ' in this maintained snapshot; ' + (rows.length - eligible) + ' stale or unavailable.';
  }

  function populate(payload) {
    var validation = engine.validateDataset(payload);
    if (!validation.valid) throw new Error(validation.errors[0]);
    state.payload = payload;
    state.markets = payload.markets;
    var countries = [];
    state.markets.forEach(function (market) { if (!countries.some(function (item) { return item.code === market.country_code; })) countries.push({ code: market.country_code, name: market.country_name }); });
    countries.sort(function (a, b) { return a.name.localeCompare(b.name); });
    byId('fuel-country').innerHTML = countries.map(function (country) { return '<option value="' + escapeHtml(country.code) + '">' + escapeHtml(country.name) + '</option>'; }).join('');
    byId('fuel-country').value = countries.some(function (country) { return country.code === 'NG'; }) ? 'NG' : countries[0].code;
    renderCoverage();
    setMarketOptions(byId('fuel-country').value);
  }

  function fail(error) {
    setLocationStatus('Fuel reference data could not be loaded. You can still enter a verified local price in the fill-cost calculator.', true);
    if (byId('fuel-data-status')) {
      byId('fuel-data-status').textContent = 'Fuel snapshot unavailable. Use a locally verified price in the calculator.';
      byId('fuel-data-status').classList.add('warn');
    }
    unavailable(null, null, { reason: error && error.message ? error.message : 'Request failed.' });
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!engine) return fail(new Error('Fuel engine did not load.'));
    byId('fuel-use-location').addEventListener('click', useLocation);
    byId('fuel-country').addEventListener('change', function () { setMarketOptions(this.value); safeEvent('fuel_country_selected', { country_code: this.value }); });
    byId('fuel-market').addEventListener('change', function () { renderResult(); safeEvent('fuel_market_selected', { market_id: this.value, country_code: byId('fuel-country').value }); });
    byId('fuel-type').addEventListener('change', function () { renderResult(); safeEvent('fuel_type_selected', { fuel_type: this.value, country_code: byId('fuel-country').value }); });
    byId('fuel-fill-mode').addEventListener('change', toggleFillMode);
    byId('fuel-fill-calc').addEventListener('click', calculateFill);
    fetch('/data/fuel/latest.json', { cache: 'no-store', credentials: 'same-origin' }).then(function (response) {
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return response.json();
    }).then(function (legacySnapshot) {
      state.legacySnapshot = legacySnapshot;
      return fetch('/data/fuel/markets.json', { cache: 'no-store', credentials: 'same-origin' });
    }).then(function (response) {
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return response.json();
    }).then(populate).catch(fail);
  });
}());
