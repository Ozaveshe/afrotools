'use strict';

const markets = require('../../data/fuel/markets.json');
const latest = require('../../data/fuel/latest.json');
const observations = require('../../assets/js/lib/fuel-market-observations');
const copy = require('../../assets/js/lib/fuel-market-copy');

const labels = {
  en: ['Fuel prices by country', 'Freshness assessed on', 'Confirm the price at your station.', 'Historical reference', 'Survey year'],
  fr: ['Prix des carburants par pays', 'Fraîcheur des données évaluée le', 'Confirmez le prix à la station.', 'Prix historique', 'Année de l’enquête'],
  sw: ['Bei za mafuta kwa nchi', 'Tarehe ya kutathmini usasisho wa bei', 'Thibitisha bei katika kituo chako.', 'Bei ya kihistoria', 'Mwaka wa utafiti'],
};

module.exports = function staticPrices(locale, escape) {
  const [heading, checked, advice, historical, surveyYear] = labels[locale];
  const t = key => copy.get(locale, key);
  const names = new Intl.DisplayNames([locale], { type: 'region' });
  const numbers = new Intl.NumberFormat(locale, { maximumFractionDigits: 6 });
  // Anchor the assessment to the data release. Rebuilding an identical checkout is repeatable.
  const asOf = [latest.timestamp.slice(0, 10), ...markets.markets.flatMap(m => m.fuels.map(r => r.last_verified_at))].sort().at(-1);
  const rows = observations.merge(markets.markets, latest, asOf);
  const countries = new Map(latest.countries.map(c => [c.code, []]));
  for (const market of rows) {
    if (!countries.has(market.country_code)) countries.set(market.country_code, []);
    countries.get(market.country_code).push(market);
  }

  function time(day) {
    return `<time datetime="${escape(day)}">${escape(day)}</time>`;
  }

  function product(record, state) {
    const dates = [];
    if (record.observation_year) dates.push(surveyYear + ' ' + escape(record.observation_year));
    if (record.date_basis === 'survey-period') {
      dates.push(t('surveyPeriod') + ' ' + time(record.period_start) + ' – ' + time(record.period_end));
    } else {
      const label = { observation: 'observed', snapshot: 'snapshotDate' }[record.date_basis] || 'effective';
      dates.push(t(label) + ' ' + time(record.effective_date));
    }
    if (record.valid_to) dates.push(t('validTo') + ' ' + time(record.valid_to));
    if (state.freshnessBasis === 'official-verification') dates.push(t('verified') + ' ' + time(record.last_verified_at));
    if (state.historical) dates.push(historical);
    if (record.price_kind === 'existing-stock-retail') dates.push(escape(t('existingStock')));
    const price = escape(record.currency) + ' ' + numbers.format(record.price) + '/L';
    return `<li><strong>${escape(t(record.fuel_type))} · ${price}</strong><br>${dates.join(' · ')} · ${escape(t(record.confidence))}<br><a href="${escape(record.source_url)}">${escape(record.source_name)}</a>${record.notes ? `<p lang="en">${escape(record.notes)}</p>` : ''}</li>`;
  }

  let opened = false;
  const groups = [...countries.keys()].sort((a, b) => names.of(a).localeCompare(names.of(b), locale)).map(code => {
    const available = [];
    const archived = [];
    const fuels = new Set();
    for (const m of countries.get(code)) {
      const current = [], previous = [];
      for (const record of m.fuels) {
        const state = observations.status(record, asOf, markets.stale_after_days);
        if (!state.valid) continue;
        fuels.add(record.fuel_type);
        (state.available ? current : previous).push(product(record, state));
      }
      if (current.length) available.push([m, current]);
      if (previous.length) archived.push([m, previous]);
    }
    // The interactive market selector puts available records first for each fuel.
    // Preserve source order within each tier, including markets with a mix of dates.
    const entries = [...available, ...archived].map(([m, items]) => {
      const scope = escape(t(m.granularity));
      const place = m.granularity === 'national' ? scope : escape(m.locality_name) + ' · ' + scope;
      return `<h3>${place}</h3>${m.coverage_note ? `<p lang="en">${escape(m.coverage_note)}</p>` : ''}<ul>${items.join('\n')}</ul>`;
    });
    const initiallyOpen = !opened && entries.length > 0;
    if (initiallyOpen) opened = true;
    const missing = ['petrol','diesel'].filter(fuel => !fuels.has(fuel))
      .map(fuel => `<p>${escape(t(fuel))} · ${escape(t('unavailable'))}</p>`);
    return `<details data-country="${escape(code)}"${initiallyOpen ? ' open' : ''}><summary>${escape(names.of(code))}</summary>${entries.concat(missing).join('\n')}</details>`;
  });
  return `<details id="fuel-static-reference" open><summary>${heading}</summary><p>${checked} ${time(asOf)}. ${advice}</p>${groups.join('\n')}</details>`;
};
