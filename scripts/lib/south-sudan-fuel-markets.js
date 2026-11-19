'use strict';

const markets = require('../../data/fuel/markets.json').markets;

function southSudanMarketExamples(row, lang, escapeHtml) {
  if (row.code !== 'SS') return '';
  const fr = lang === 'fr';
  const locale = fr ? 'fr-FR' : 'en-GB';
  const number = new Intl.NumberFormat(locale);
  const month = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const finder = fr ? '/fr/tools/suivi-carburant/' : '/tools/fuel-tracker/';
  const locations = [
    ['ss-juba-konyokonyo', fr ? 'Djouba (marché de Konyokonyo)' : 'Juba (Konyokonyo market)'],
    ['ss-city-reference', 'Yambio']
  ];
  const items = [];
  for (const [id, name] of locations) {
    const market = markets.find(entry => entry.market_id === id && entry.country_code === 'SS');
    if (!market) continue;
    const lines = [];
    for (const type of ['petrol', 'diesel']) {
      const record = market.fuels.find(f => f.fuel_type === type && f.price_kind === 'market-survey' && f.currency === 'SSP' && f.unit === 'litre' && f.price > 0);
      if (!record) continue;
      const fuel = type === 'diesel' ? 'Diesel' : fr ? 'Essence' : 'Petrol';
      const date = month.format(new Date(record.effective_date));
      const estimate = number.format(record.price * 50);
      lines.push(`<a href="${finder}?country=SS&amp;market=${id}&amp;fuel=${type}">${fuel} · ${number.format(record.price)} SSP/L · 50 L = ${estimate} SSP</a> (${escapeHtml(date)})`);
    }
    if (lines.length) items.push(`<li><strong>${name}</strong><ul><li>${lines.join('</li><li>')}</li></ul></li>`);
  }
  if (!items.length) return '';
  const title = fr ? 'Prix relevés sur les marchés locaux' : 'Local market fuel prices';
  const intro = fr ? 'Le Programme alimentaire mondial (PAM) publie des moyennes mensuelles par marché. Choisissez un carburant pour ajuster votre budget.' : 'The World Food Programme reports monthly retail averages for each market. Choose a fuel to adjust your budget.';
  return `<section class="fuel-panel" aria-labelledby="ss-market-prices"><h2 id="ss-market-prices">${title}</h2><p>${intro}</p><ul>${items.join('')}</ul></section>`;
}

module.exports = {southSudanMarketExamples};
