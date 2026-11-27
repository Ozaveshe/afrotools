(() => {
  'use strict';
  const copy = JSON.parse(document.getElementById('fuel-labels').textContent);
  const engine = window.AfroTools.FuelTrackerEngine;
  const observations = window.AfroTools.FuelMarketObservations;
  const byId = id => document.getElementById(id);
  const product = byId('product'), market = byId('market'), price = byId('price');
  const reference = byId('reference'), history = byId('use-history'), total = byId('total');
  const money = new Intl.NumberFormat(document.documentElement.lang + '-NG', { style: 'currency', currency: 'NGN' });
  const number = new Intl.NumberFormat(document.documentElement.lang + '-NG', { maximumFractionDigits: 4 });
  let rows = [], choices = [], maxAge = 45, manualTouched = false, historicalAccepted = false;
  function label(row) {
    if (row.granularity === 'national') return copy.national;
    if (row.market_id === 'ng-abuja-nnpc-observed') return copy.abuja;
    return row.locality_name;
  }
  function current() { return choices.find(choice => choice.row.market_id === market.value); }
  function render() {
    const choice = current();
    historicalAccepted = false;
    total.textContent = '';
    price.value = '';
    price.readOnly = Boolean(choice);
    history.hidden = true;
    if (!choice) {
      reference.textContent = copy.manualHelp;
      return;
    }
    const { row, record, status } = choice;
    const dateLabel = { effective: copy.effective, observation: copy.observed, snapshot: copy.snapshot };
    const dates = record.date_basis === 'survey-period'
      ? copy.period + record.period_start + copy.until + record.period_end
      : (dateLabel[record.date_basis || 'effective'] || copy.date) + ': ' + record.effective_date;
    const source = document.createElement('a');
    source.href = record.source_url;
    source.textContent = copy.source;
    reference.replaceChildren(label(row) + '. ' + money.format(record.price) + copy.perLitre + dates
      + (record.date_basis !== 'snapshot' && record.last_verified_at ? copy.checked + record.last_verified_at : '')
      + (status.historical ? copy.oldNotice : copy.pumpMayDiffer), source);
    history.hidden = !status.historical;
    if (!status.historical) price.value = record.price;
  }
  function populate() {
    choices = rows.map(row => {
      const record = engine.marketRecord(row, product.value);
      return { row, record, status: observations.status(record, new Date().toISOString(), maxAge) };
    }).filter(choice => choice.status.valid && choice.record.currency === 'NGN');
    choices.sort((a, b) => Number(a.status.historical) - Number(b.status.historical)
      || Number(b.row.granularity === 'national') - Number(a.row.granularity === 'national')
      || b.record.effective_date.localeCompare(a.record.effective_date));
    const previousTotal = manualTouched && market.value === 'manual' ? total.textContent : '';
    const previousPrice = manualTouched && market.value === 'manual' ? price.value : '';
    market.replaceChildren(new Option(copy.manualOption, 'manual'));
    for (const choice of choices) {
      market.add(new Option(label(choice.row) + ' · ' + choice.record.effective_date, choice.row.market_id));
    }
    if (!manualTouched && choices.length) market.value = choices[0].row.market_id;
    render();
    if (previousPrice) { price.value = previousPrice; total.textContent = previousTotal; }
  }
  history.addEventListener('click', () => {
    const choice = current();
    if (!choice || !choice.status.historical) return;
    historicalAccepted = true;
    price.value = choice.record.price;
    history.hidden = true;
    byId('litres').focus();
  });
  market.addEventListener('change', () => { manualTouched = market.value === 'manual'; render(); });
  product.addEventListener('change', () => { manualTouched = false; populate(); });
  price.addEventListener('input', () => { manualTouched = true; total.textContent = ''; });
  byId('litres').addEventListener('input', () => { total.textContent = ''; });
  byId('fuel-form').addEventListener('submit', event => {
    event.preventDefault();
    const choice = current();
    if (choice && choice.status.historical && !historicalAccepted) {
      total.textContent = copy.confirmHistory;
      history.focus(); return;
    }
    const result = engine.calculateFillCost({ pricePerLitre: price.value, quantity: byId('litres').value, unit: 'litre' });
    if (!result.ok) { total.textContent = copy.invalid; return; }
    const basis = !choice ? copy.manualResult : (choice.status.historical ? copy.historical : copy.reported) + ' · ' + label(choice.row) + ' · ' + choice.record.effective_date;
    total.textContent = product.selectedOptions[0].text + ': ' + number.format(result.litres) + ' L × ' + money.format(result.pricePerLitre) + ' = ' + money.format(result.totalCost) + '. ' + basis + '.';
  });
  async function read(url) {
    try { const response = await fetch(url); return response.ok ? await response.json() : null; }
    catch { return null; }
  }
  Promise.all([read('/data/fuel/markets.json'), read('/data/fuel/latest.json')]).then(([catalog, latest]) => {
    maxAge = catalog && Number.isFinite(catalog.stale_after_days) ? catalog.stale_after_days : 45;
    rows = observations.merge(catalog && Array.isArray(catalog.markets) ? catalog.markets : [], latest)
      .filter(row => row.country_code === 'NG');
    populate();
    if (!choices.length) reference.textContent = copy.unavailable;
  });
})();
