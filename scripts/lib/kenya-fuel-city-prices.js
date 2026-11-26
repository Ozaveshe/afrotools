'use strict';

function kenyaCityPrices(data, language, escapeHtml) {
  const french = language === 'fr';
  const labels = french ? {
    title: 'Prix plafonds par ville au Kenya', city: 'Ville', fuel: 'Carburant', price: 'Prix (KES/L)', period: 'Période', source: 'Source', petrol: 'Essence', diesel: 'Gazole', notice: 'Avis de l’EPRA', hint: 'Choisissez une ville pour calculer le coût d’un plein.', base: '/fr/tools/suivi-carburant/'
  } : {
    title: 'Maximum fuel prices by city in Kenya', city: 'City', fuel: 'Fuel', price: 'Price (KES/L)', period: 'Period', source: 'Source', petrol: 'Petrol', diesel: 'Diesel', notice: 'EPRA notice', hint: 'Choose a city to calculate the cost of a fill.', base: '/tools/fuel-tracker/'
  };
  const locale = french ? 'fr-FR' : 'en-KE';
  const formatPrice = new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formatDate = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  const lines = [];
  for (const market of data.markets || []) {
    if (market.country_code !== 'KE' || market.granularity !== 'city') continue;
    const href = labels.base + '?market=' + encodeURIComponent(market.market_id);
    for (const row of market.fuels || []) {
      if (!['petrol', 'diesel'].includes(row.fuel_type) || row.price_kind !== 'official-maximum-retail' ||
          row.currency !== 'KES' || row.unit !== 'litre' || !Number.isFinite(row.price) || row.price <= 0 ||
          !/^https:\/\/(?:www\.)?epra\.go\.ke\//i.test(row.source_url || '')) continue;
      const dates = [row.effective_date, row.valid_to];
      if (!dates.every(date => /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(date)) &&
          new Date(date).toISOString().slice(0, 10) === date) || dates[0] > dates[1]) continue;
      const period = dates.map(date => formatDate.format(new Date(date))).join(' – ');
      lines.push(`<tr><th scope="row"><a href="${href}&amp;fuel=${row.fuel_type}#fuel-finder">${escapeHtml(market.locality_name)}</a></th><td>${labels[row.fuel_type]}</td><td>${formatPrice.format(row.price)}</td><td>${period}</td><td><a href="${escapeHtml(row.source_url)}">${labels.notice}</a></td></tr>`);
    }
  }
  if (!lines.length) return '';
  const headings = [labels.city, labels.fuel, labels.price, labels.period, labels.source].map(label => `<th scope="col">${label}</th>`).join('');
  return `<div class="fuel-section" data-kenya-city-prices><h2>${labels.title}</h2><p>${labels.hint}</p><div style="overflow-x:auto"><table><thead><tr>${headings}</tr></thead><tbody>${lines.join('')}</tbody></table></div></div>`;
}

module.exports = { kenyaCityPrices };
