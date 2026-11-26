'use strict';

const {status} = require('../../assets/js/lib/fuel-market-observations');

function productDate(row, type) {
  return row[type].observed_at || row[type].snapshot_date || row.last_updated;
}

// Dual-currency orders publish both prices directly. Never convert a historical
// snapshot (including a pre-ZiG ZWL figure) to construct an official rate.
function publishedDualCurrencyRow(original, market, now) {
  if (!market || !market.lpg_notice) return null;
  const records = [...market.fuels, market.lpg_notice];
  const references = {};
  const row = {...original};
  for (const type of ['petrol', 'diesel', 'lpg']) {
    const ref = records.find(item => item.fuel_type === type);
    const local = ref?.published_local_price;
    const unit = type === 'lpg' ? 'kg' : 'litre';
    if (!local || local.currency !== 'ZWG' || ref.currency !== 'USD' ||
        ref.unit !== unit || local.unit !== unit || !Number.isFinite(local.price) || !Number.isFinite(ref.price) ||
        local.price <= 0 || ref.price <= 0 ||
        ref.effective_date <= productDate(original,type) || ref.effective_date > now.slice(0,10)) return null;
    const age = (Date.parse(now) - Date.parse(ref.effective_date)) / 86400000;
    const historical = ref.valid_to ? now.slice(0,10) > ref.valid_to : age > 45;
    references[type] = {...ref, historical};
    row[type] = {price:local.price, usd:ref.price, unit:type === 'lpg' ? 'kg' : 'liter', observed_at:ref.effective_date};
  }
  row.currency = 'ZWG';
  row.references = references;
  row.lpgDateKnown = true;
  row.last_updated = records.map(ref => ref.effective_date).sort().at(-1);
  return row;
}

function countryPageRows(snapshot, marketData, now = new Date().toISOString()) {
  return snapshot.countries.map(original => {
    const row = {...original};
    const candidates = marketData.markets.filter(m => m.country_code === row.code && m.granularity === 'national');
    const dual = publishedDualCurrencyRow(original, candidates.find(m => m.lpg_notice), now);
    if (dual) {
      const weekly = candidates.find(m => m.market_id === 'zw-national-rbz-weekly');
      if (weekly) dual.weeklyMarketId = weekly.market_id;
      return dual;
    }
    for (const type of ['petrol', 'diesel']) {
      if (!row[type] || !['liter', 'litre'].includes(row[type].unit)) continue;
      const currentDate = productDate(original, type);
      const compatible = candidates.flatMap(m => m.fuels).filter(f =>
        f.fuel_type === type && f.currency === row.currency && f.unit === 'litre' &&
        f.effective_date > currentDate && status(f, now).valid);
      compatible.sort((a, b) => b.effective_date.localeCompare(a.effective_date) || b.last_verified_at.localeCompare(a.last_verified_at));
      const best = compatible[0];
      if (!best) {
        const item = row[type];
        if (item.observed_at && item.source_url && row.source === 'globalpetrolprices') {
          const ref = {fuel_type:type, price:item.price, currency:row.currency, unit:'litre', date_basis:'observation',
            effective_date:item.observed_at, last_verified_at:item.observed_at, source_name:'GlobalPetrolPrices',
            source_url:item.source_url, price_kind:'weekly-national-benchmark'};
          if (status(ref, now).valid) row.references = {...row.references, [type]:ref};
        }
        continue;
      }
      // A previously calculated USD equivalent belongs to the earlier observation.
      row[type] = {price: best.price, unit: 'liter', usd: null, observed_at: best.effective_date, source_url: best.source_url};
      row.references = {...row.references, [type]: {...best, historical: status(best, now).historical}};
    }
    if (row.references) {
      row.lpgDateKnown = Boolean(original.lpg?.observed_at || original.lpg?.snapshot_date);
      for (const type of ['petrol', 'diesel', 'lpg']) {
        if (!row[type] || row.references[type]) continue;
        row[type] = {...row[type], snapshot_date: productDate(original, type)};
      }
      row.last_updated = ['petrol', 'diesel', 'lpg'].filter(t => row[t]).map(t => productDate(row, t)).sort().at(-1);
    }
    return row;
  });
}

function sourceLine(row, type, lang, formatDate, escapeHtml) {
  if (!row.references) return '';
  const ref = row.references[type];
  const french = lang === 'fr';
  const date = formatDate(productDate(row, type));
  if (!ref) return escapeHtml((french ? 'Date du relevÃ© : ' : 'Dataset snapshot: ') + date);
  const kind = ref.price_kind || '';
  const label = kind === 'weekly-national-benchmark' ? (french ? 'Indice national hebdomadaire' : 'Weekly national benchmark')
    : kind.startsWith('regulated-') ? (french ? 'Tarif rÃ©glementÃ©' : 'Regulated retail price')
    : kind === 'official-national-retail' ? (french ? 'Prix publiÃ© par lâ€™autoritÃ©' : 'Authority-published retail price')
    : (french ? 'Prix national publiÃ©' : 'Reported national price');
  const dateLabel = ref.date_basis === 'effective' ? (french ? 'applicable le ' : 'effective ')
    : ref.date_basis === 'observation' ? (french ? 'observÃ© le ' : 'observed ') : (french ? 'relevÃ© du ' : 'snapshot ');
  const end = ref.valid_to ? (french ? ' Â· fin de pÃ©riode : ' : ' Â· period ends ') + formatDate(ref.valid_to) : '';
  const history = ref.historical ? (french ? 'Historique Â· ' : 'Historical Â· ') : '';
  return escapeHtml(history + label + ' Â· ' + dateLabel + date + end) + ' Â· <a href="' + escapeHtml(ref.source_url) + '">' + escapeHtml((french && ref.source_name_fr) || ref.source_name) + '</a>';
}

function regionalComparison(row, rows, fuel) {
  const item = row[fuel];
  if (!item || !(item.usd > 0) || !Number.isFinite(item.usd)) return null;
  const date = item.observed_at;
  if (!date) return null;
  const peers = rows.filter(other => other.code !== row.code && other.region === row.region && other[fuel] &&
    other[fuel].unit === item.unit && Number.isFinite(other[fuel].usd) && other[fuel].usd > 0 &&
    other[fuel].observed_at === date);
  if (peers.length < 2) return null;
  const average = peers.reduce((sum, other) => sum + other[fuel].usd, 0) / peers.length;
  return {date, count: peers.length, delta: (item.usd / average - 1) * 100};
}

function datedProperties(row, fuel, french) {
  if (!row.references) return [];
  const ref = row.references[fuel];
  const basis = ref?.date_basis;
  const label = basis === 'effective' ? (french ? 'Date dâ€™application' : 'Effective date')
    : basis === 'observation' ? (french ? 'Date dâ€™observation' : 'Observation date')
    : (french ? 'Date du relevÃ©' : 'Dataset snapshot date');
  const properties = [{'@type':'PropertyValue', name:label, value:productDate(row, fuel)}];
  if (ref) properties.push({'@type':'PropertyValue', name:'Source', value:ref.source_url});
  return properties;
}

module.exports = {countryPageRows, productDate, sourceLine, regionalComparison, datedProperties};
