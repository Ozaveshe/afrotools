(function () {
  'use strict';

  var COUNTRY_META = {
    CI: { name: "Côte d'Ivoire", currency: 'XOF' }, GH: { name: 'Ghana', currency: 'GHS' }, KE: { name: 'Kenya', currency: 'KES' },
    NG: { name: 'Nigeria', currency: 'NGN' }, SN: { name: 'Senegal', currency: 'XOF' }, TZ: { name: 'Tanzania', currency: 'TZS' },
    UG: { name: 'Uganda', currency: 'UGX' }, ZA: { name: 'South Africa', currency: 'ZAR' }, ZM: { name: 'Zambia', currency: 'ZMW' }
  };
  var dataset;
  var latestResult;
  var engine = window.AfroTools && window.AfroTools.engines && window.AfroTools.engines.electricityCost;
  var form = document.getElementById('electricityForm');
  if (!form || !engine) return;

  var country = document.getElementById('electricityCountry');
  var provider = document.getElementById('electricityProvider');
  var tariff = document.getElementById('electricityTariff');
  var amount = document.getElementById('electricityAmount');
  var custom = document.getElementById('electricityCustom');
  var customRate = document.getElementById('electricityCustomRate');
  var customFixed = document.getElementById('electricityCustomFixed');
  var percentDeduction = document.getElementById('electricityPercentDeduction');
  var fixedDeduction = document.getElementById('electricityFixedDeduction');
  var status = document.getElementById('electricityStatus');
  var result = document.getElementById('electricityResult');
  var sourceCard = document.getElementById('electricitySourceCard');
  var sourceLink = document.getElementById('electricitySource');
  var asOf = window.__AFROTOOLS_ELECTRICITY_AS_OF__ || new Date().toISOString().slice(0, 10);

  function track(name, params) {
    var analytics = window.AfroTools && window.AfroTools.analytics;
    if (analytics && typeof analytics.track === 'function') analytics.track(name, params || {});
  }

  function mode() {
    var selected = form.querySelector('input[name="electricityMode"]:checked');
    return selected ? selected.value : 'money_to_units';
  }

  function selectedRecord() {
    return dataset && dataset.records.find(function (record) { return record.tariff_id === tariff.value; });
  }

  function optionsFor(select, rows, valueKey, labelKey) {
    select.innerHTML = '';
    rows.forEach(function (row) {
      var option = document.createElement('option');
      option.value = row[valueKey];
      option.textContent = row[labelKey];
      select.appendChild(option);
    });
  }

  function countryState() {
    var rows = engine.recordsForCountry(dataset, country.value);
    var current = rows.filter(function (record) { return engine.recordStatus(record, asOf, dataset.default_freshness_days).available; });
    var stale = rows.length > 0 && current.length === 0;
    return { rows: rows, current: current, stale: stale };
  }

  function updateProviders() {
    var state = countryState();
    var providers = [];
    state.current.forEach(function (record) {
      if (!providers.some(function (item) { return item.provider_id === record.provider_id; })) providers.push(record);
    });
    optionsFor(provider, providers.length ? providers : [{ provider_id: '', provider_name: 'No verified provider available' }], 'provider_id', 'provider_name');
    provider.disabled = providers.length < 2;
    updateTariffs();
    custom.hidden = state.current.length > 0;
    if (state.current.length) {
      status.textContent = '';
      sourceCard.dataset.state = 'official';
    } else if (state.stale) {
      status.textContent = 'This tariff is no longer current enough for an automatic estimate. Enter a rate from a current bill or official notice instead.';
      sourceCard.dataset.state = 'stale';
      track('electricity_stale_data_shown', { country_code: country.value, market_state: 'stale' });
    } else {
      status.textContent = 'No current provider-and-class tariff is maintained for this country. Enter a current rate from your bill or official notice; it stays in this browser.';
      sourceCard.dataset.state = 'custom';
      track('electricity_unsupported_market', { country_code: country.value, market_state: 'unsupported' });
    }
    var meta = COUNTRY_META[country.value];
    document.querySelectorAll('[data-electricity-currency]').forEach(function (node) { node.textContent = meta.currency; });
    track('electricity_country_selected', { country_code: country.value, automatic_coverage: Boolean(state.current.length) });
    renderSource();
  }

  function updateTariffs() {
    var state = countryState();
    var rows = state.current.filter(function (record) { return !provider.value || record.provider_id === provider.value; });
    optionsFor(tariff, rows.length ? rows : [{ tariff_id: '', tariff_name: 'Use a custom local rate' }], 'tariff_id', 'tariff_name');
    tariff.disabled = rows.length === 0;
    renderSource();
  }

  function activeRecord() {
    var official = selectedRecord();
    if (official) return official;
    var meta = COUNTRY_META[country.value];
    return engine.customRateRecord({
      country_code: country.value, country_name: meta.name, currency: meta.currency,
      rate: customRate.value, fixed_charge: customFixed.value
    });
  }

  function renderSource() {
    var record = selectedRecord();
    if (!record) {
      sourceCard.dataset.state = countryState().stale ? 'stale' : 'custom';
      document.getElementById('electricitySourceTitle').textContent = countryState().stale ? 'Automatic estimate paused' : 'Custom-rate mode';
      document.getElementById('electricityFreshness').textContent = countryState().stale
        ? 'The stored official record failed its validity or verification window.'
        : 'No automatic tariff is claimed. Your rate is processed locally and is not saved.';
      sourceLink.hidden = true;
      return;
    }
    sourceCard.dataset.state = 'official';
    document.getElementById('electricitySourceTitle').textContent = record.provider_name + ' · ' + record.tariff_name;
    document.getElementById('electricityFreshness').textContent = 'Effective ' + record.effective_date + (record.valid_to ? ' to ' + record.valid_to : '') + ' · verified ' + record.last_verified_at + ' · ' + record.granularity.replace(/_/g, ' ') + ' · ' + record.confidence + ' confidence.';
    sourceLink.href = record.source_url;
    sourceLink.textContent = 'Open ' + record.source_name;
    sourceLink.hidden = false;
  }

  function deductions() {
    var rows = [];
    var percent = Number(percentDeduction.value);
    var fixed = Number(fixedDeduction.value);
    if (percent > 0) rows.push({ id: 'user_percent', label: 'User-entered percentage deduction', type: 'percent', value: percent });
    if (fixed > 0) rows.push({ id: 'user_fixed', label: 'User-entered fixed deduction', type: 'fixed', value: fixed });
    return rows;
  }

  function clearError() {
    status.textContent = '';
    [amount, customRate, customFixed, percentDeduction, fixedDeduction].forEach(function (input) { input.removeAttribute('aria-invalid'); });
  }

  function fail(input, message) {
    input.setAttribute('aria-invalid', 'true');
    status.textContent = message;
    result.hidden = true;
    input.focus();
  }

  function renderCalculation(record, calculation) {
    var isUnits = calculation.mode === 'money_to_units';
    var primary = isUnits ? calculation.units.toLocaleString(undefined, { maximumFractionDigits: 2 }) + ' kWh' : engine.formatMoney(calculation.total, record.currency);
    document.getElementById('electricityPrimaryLabel').textContent = isUnits ? 'Estimated prepaid units' : 'Estimated electricity bill';
    document.getElementById('electricityPrimary').textContent = primary;
    document.getElementById('electricityMetricOneLabel').textContent = isUnits ? 'Amount for energy' : 'Energy charge';
    document.getElementById('electricityMetricOne').textContent = engine.formatMoney(isUnits ? calculation.amount_for_energy : calculation.energy_charge, record.currency);
    document.getElementById('electricityMetricTwoLabel').textContent = isUnits ? 'Deductions' : 'Effective cost per kWh';
    document.getElementById('electricityMetricTwo').textContent = isUnits ? engine.formatMoney(calculation.deduction_total, record.currency) : engine.formatMoney(calculation.effective_rate, record.currency) + '/kWh';
    document.getElementById('electricityBreakdown').innerHTML = calculation.tier_breakdown.map(function (tier) {
      return '<li>' + tier.label + ': ' + tier.units.toLocaleString(undefined, { maximumFractionDigits: 2 }) + ' kWh × ' + engine.formatMoney(tier.rate, record.currency) + ' = ' + engine.formatMoney(tier.cost, record.currency) + '</li>';
    }).join('');
    document.getElementById('electricityAssumptions').textContent = record.notes + (record.status === 'custom' ? ' Custom rates are not verified by AfroTools.' : ' This is a planning estimate, not an official bill or token receipt.');
    result.hidden = false;
    renderSource();
    latestResult = calculation;
  }

  function calculate(event) {
    if (event) event.preventDefault();
    clearError();
    var value = Number(amount.value);
    if (!(value > 0)) return fail(amount, mode() === 'money_to_units' ? 'Enter a purchase amount greater than zero.' : 'Enter electricity units greater than zero.');
    var record = activeRecord();
    if (!record) return fail(customRate, 'Enter a current tariff rate greater than zero.');
    var official = record.status !== 'custom';
    if (official) {
      var freshness = engine.recordStatus(record, asOf, dataset.default_freshness_days);
      if (!freshness.available) {
        custom.hidden = false;
        return fail(customRate, 'This tariff is no longer current enough for an automatic estimate. Enter a current rate from your bill or official notice.');
      }
    }
    var calculation = mode() === 'money_to_units'
      ? engine.calculateUnits(record, value, { extra_deductions: deductions() })
      : engine.calculateBill(record, value);
    if (!calculation.ok) return fail(amount, calculation.error);
    renderCalculation(record, calculation);
    var payload = { country_code: country.value, provider_id: record.provider_id, tariff_id: record.tariff_id, customer_class: record.customer_class, source_state: official ? 'official' : 'custom', value_band: value < 100 ? 'under_100' : value < 1000 ? '100_999' : value < 10000 ? '1k_9k' : '10k_plus' };
    track(mode() === 'money_to_units' ? 'electricity_money_to_units_completed' : 'electricity_units_to_bill_completed', payload);
    if (!official) track('electricity_custom_rate_used', { country_code: country.value, currency: record.currency, mode: mode() });
  }

  country.addEventListener('change', updateProviders);
  provider.addEventListener('change', function () { updateTariffs(); track('electricity_provider_selected', { country_code: country.value, provider_id: provider.value }); });
  tariff.addEventListener('change', function () { renderSource(); var record = selectedRecord(); track('electricity_tariff_selected', { country_code: country.value, provider_id: provider.value, tariff_id: tariff.value, customer_class: record ? record.customer_class : 'custom' }); });
  form.addEventListener('submit', calculate);
  form.querySelectorAll('input[name="electricityMode"]').forEach(function (input) {
    input.addEventListener('change', function () {
      document.getElementById('electricityAmountLabel').textContent = mode() === 'money_to_units' ? 'Purchase amount' : 'Electricity units';
      document.getElementById('electricityAmountHelp').textContent = mode() === 'money_to_units' ? 'Enter the money paid for the token; do not enter a token or meter number.' : 'Enter monthly or billing-period consumption in kWh.';
      document.getElementById('electricityPrepaidFields').hidden = mode() !== 'money_to_units';
      result.hidden = true;
    });
  });
  sourceLink.addEventListener('click', function () { var record = selectedRecord(); track('electricity_source_opened', { country_code: country.value, provider_id: record ? record.provider_id : 'none', tariff_id: record ? record.tariff_id : 'none' }); });

  fetch('/data/energy/electricity-tariffs.json').then(function (response) {
    if (!response.ok) throw new Error('Tariff dataset unavailable');
    return response.json();
  }).then(function (value) {
    var validation = engine.validateDataset(value);
    if (!validation.valid) throw new Error(validation.errors.join(' '));
    dataset = value;
    var requested = new URLSearchParams(window.location.search).get('country');
    if (requested && COUNTRY_META[requested.toUpperCase()]) country.value = requested.toUpperCase();
    updateProviders();
    window.AFROTOOLS_ELECTRICITY_READY = true;
  }).catch(function () {
    status.textContent = 'The tariff dataset could not be loaded. Automatic estimates are unavailable; try again later.';
    form.querySelector('button[type="submit"]').disabled = true;
  });
}());
