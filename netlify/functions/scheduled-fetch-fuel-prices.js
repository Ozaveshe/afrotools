/**
 * AfroTools — Scheduled Fuel Price Fetcher
 * Runs every 6 hours via Netlify Scheduled Functions.
 *
 * Sources (with fallback chain):
 *  1. GlobalPetrolPrices HTML scrape (via simple fetch — public pages)
 *  2. Oil Price API (backup — global benchmark prices)
 *  3. Seed data fallback (data/fuel/latest.json)
 *
 * Output shape matches existing data/fuel/latest.json:
 *   { timestamp, countries: [{ code, name, currency, region, petrol, diesel, lpg, ... }] }
 *
 * Writes to Netlify Blobs 'live-data' → key 'fuel-latest'.
 */

const { runScraper, fetchWithRetry } = require('./_shared/scraper-base');
const { getData } = require('./_shared/data-store');
const { projectNationalPumpPrices, zimbabweAggregateRow } = require('../../scripts/lib/fuel-country-reference');
const marketData = require('../../data/fuel/markets.json');

// All 54 African countries with GlobalPetrolPrices slugs
var COUNTRIES = [
  { code: 'DZ', name: 'Algeria', currency: 'DZD', region: 'north', slug: 'Algeria' },
  { code: 'AO', name: 'Angola', currency: 'AOA', region: 'central', slug: 'Angola' },
  { code: 'BJ', name: 'Benin', currency: 'XOF', region: 'west', slug: 'Benin' },
  { code: 'BW', name: 'Botswana', currency: 'BWP', region: 'south', slug: 'Botswana' },
  { code: 'BF', name: 'Burkina Faso', currency: 'XOF', region: 'west', slug: 'Burkina-Faso' },
  { code: 'BI', name: 'Burundi', currency: 'BIF', region: 'east', slug: 'Burundi' },
  { code: 'CV', name: 'Cabo Verde', currency: 'CVE', region: 'west', slug: 'Cape-Verde' },
  { code: 'CM', name: 'Cameroon', currency: 'XAF', region: 'central', slug: 'Cameroon' },
  { code: 'CF', name: 'Central African Republic', currency: 'XAF', region: 'central', slug: 'Central-African-Republic' },
  { code: 'TD', name: 'Chad', currency: 'XAF', region: 'central', slug: 'Chad' },
  { code: 'KM', name: 'Comoros', currency: 'KMF', region: 'east', slug: 'Comoros' },
  { code: 'CG', name: 'Congo', currency: 'XAF', region: 'central', slug: 'Republic-of-the-Congo' },
  { code: 'CD', name: 'DR Congo', currency: 'CDF', region: 'central', slug: 'Democratic-Republic-of-the-Congo' },
  { code: 'CI', name: "Côte d'Ivoire", currency: 'XOF', region: 'west', slug: 'Ivory-Coast' },
  { code: 'DJ', name: 'Djibouti', currency: 'DJF', region: 'east', slug: 'Djibouti' },
  { code: 'EG', name: 'Egypt', currency: 'EGP', region: 'north', slug: 'Egypt' },
  { code: 'GQ', name: 'Equatorial Guinea', currency: 'XAF', region: 'central', slug: 'Equatorial-Guinea' },
  { code: 'ER', name: 'Eritrea', currency: 'ERN', region: 'east', slug: 'Eritrea' },
  { code: 'SZ', name: 'Eswatini', currency: 'SZL', region: 'south', slug: 'Swaziland' },
  { code: 'ET', name: 'Ethiopia', currency: 'ETB', region: 'east', slug: 'Ethiopia' },
  { code: 'GA', name: 'Gabon', currency: 'XAF', region: 'central', slug: 'Gabon' },
  { code: 'GM', name: 'Gambia', currency: 'GMD', region: 'west', slug: 'Gambia' },
  { code: 'GH', name: 'Ghana', currency: 'GHS', region: 'west', slug: 'Ghana' },
  { code: 'GN', name: 'Guinea', currency: 'GNF', region: 'west', slug: 'Guinea' },
  { code: 'GW', name: 'Guinea-Bissau', currency: 'XOF', region: 'west', slug: 'Guinea-Bissau' },
  { code: 'KE', name: 'Kenya', currency: 'KES', region: 'east', slug: 'Kenya' },
  { code: 'LS', name: 'Lesotho', currency: 'LSL', region: 'south', slug: 'Lesotho' },
  { code: 'LR', name: 'Liberia', currency: 'LRD', region: 'west', slug: 'Liberia' },
  { code: 'LY', name: 'Libya', currency: 'LYD', region: 'north', slug: 'Libya' },
  { code: 'MG', name: 'Madagascar', currency: 'MGA', region: 'east', slug: 'Madagascar' },
  { code: 'MW', name: 'Malawi', currency: 'MWK', region: 'east', slug: 'Malawi' },
  { code: 'ML', name: 'Mali', currency: 'XOF', region: 'west', slug: 'Mali' },
  { code: 'MR', name: 'Mauritania', currency: 'MRU', region: 'west', slug: 'Mauritania' },
  { code: 'MU', name: 'Mauritius', currency: 'MUR', region: 'east', slug: 'Mauritius' },
  { code: 'MA', name: 'Morocco', currency: 'MAD', region: 'north', slug: 'Morocco' },
  { code: 'MZ', name: 'Mozambique', currency: 'MZN', region: 'east', slug: 'Mozambique' },
  { code: 'NA', name: 'Namibia', currency: 'NAD', region: 'south', slug: 'Namibia' },
  { code: 'NE', name: 'Niger', currency: 'XOF', region: 'west', slug: 'Niger' },
  { code: 'NG', name: 'Nigeria', currency: 'NGN', region: 'west', slug: 'Nigeria' },
  { code: 'RW', name: 'Rwanda', currency: 'RWF', region: 'east', slug: 'Rwanda' },
  { code: 'ST', name: 'São Tomé and Príncipe', currency: 'STN', region: 'central', slug: 'Sao-Tome-and-Principe' },
  { code: 'SN', name: 'Senegal', currency: 'XOF', region: 'west', slug: 'Senegal' },
  { code: 'SC', name: 'Seychelles', currency: 'SCR', region: 'east', slug: 'Seychelles' },
  { code: 'SL', name: 'Sierra Leone', currency: 'SLE', region: 'west', slug: 'Sierra-Leone' },
  { code: 'SO', name: 'Somalia', currency: 'SOS', region: 'east', slug: 'Somalia' },
  { code: 'ZA', name: 'South Africa', currency: 'ZAR', region: 'south', slug: 'South-Africa' },
  { code: 'SS', name: 'South Sudan', currency: 'SSP', region: 'east', slug: 'South-Sudan' },
  { code: 'SD', name: 'Sudan', currency: 'SDG', region: 'north', slug: 'Sudan' },
  { code: 'TZ', name: 'Tanzania', currency: 'TZS', region: 'east', slug: 'Tanzania' },
  { code: 'TG', name: 'Togo', currency: 'XOF', region: 'west', slug: 'Togo' },
  { code: 'TN', name: 'Tunisia', currency: 'TND', region: 'north', slug: 'Tunisia' },
  { code: 'UG', name: 'Uganda', currency: 'UGX', region: 'east', slug: 'Uganda' },
  { code: 'ZM', name: 'Zambia', currency: 'ZMW', region: 'south', slug: 'Zambia' },
  { code: 'ZW', name: 'Zimbabwe', currency: 'ZWG', region: 'south', slug: 'Zimbabwe' },
];

function stripHtml(html) {
  return String(html || '').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ').replace(/&#0?39;/g, "'").replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ').trim();
}

function countryKey(name) {
  return String(name).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z]/g, '');
}

function observationDate(value) {
  const match = /^(\d{1,2})-([a-z]{3})-(\d{4})$/i.exec(value);
  if (!match) return null;
  const month = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'].indexOf(match[2].toLowerCase());
  if (month < 0) return null;
  const date = new Date(Date.UTC(+match[3], month, +match[1]));
  if (date.getUTCDate() !== +match[1] || date.getTime() > Date.now()) return null;
  return date.toISOString().slice(0, 10);
}

// The detail page identifies both prices, both units and the observation date
// together. Its summary table may quote USD only and later tables contain history.
function numericPrice(value) {
  return /^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/.test(value) ? Number(value.replace(/,/g, '')) : NaN;
}

function parseLitreTable(html, identity, country, date) {
  const table = html.match(/<table\b[^>]*>[\s\S]*?<\/table>/i);
  if (!table) return null;
  const rows = Array.from(table[0].matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi), row =>
    Array.from(row[1].matchAll(/<(?:th|td)\b[^>]*>([\s\S]*?)<\/(?:th|td)>/gi), cell => stripHtml(cell[1])));
  if (!rows.length || countryKey(rows[0][0]) !== countryKey(identity[1] + ' ' + identity[2] + ' prices')) return null;
  const litre = rows[0].findIndex(label => /^lit(?:er|re)$/i.test(label));
  if (litre < 1) return null;
  const prices = {};
  for (const row of rows.slice(1)) {
    if (row[0] !== country.currency && row[0] !== 'USD') continue;
    if (Object.hasOwn(prices, row[0])) return null;
    prices[row[0]] = numericPrice(row[litre]);
  }
  const local = prices[country.currency], usd = prices.USD;
  return Number.isFinite(local) && local > 0 && Number.isFinite(usd) && usd > 0 ? { local, usd, observed_at: date } : null;
}

function parseCountryFuelQuote(html, country, fuelType) {
  const heading = String(html).match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  if (!heading) return null;
  const identity = stripHtml(heading[1]).match(/^(.+?) (gasoline|diesel) prices?(?:, liter)?, (\d{1,2}-[a-z]{3}-\d{4})$/i);
  const keys = [countryKey(country.name), countryKey(country.slug)];
  if (!identity || !keys.includes(countryKey(identity[1])) || identity[2].toLowerCase() !== fuelType) return null;
  const date = observationDate(identity[3]);
  if (!date) return null;
  const detail = html.slice(heading.index + heading[0].length);
  const content = stripHtml(detail);
  const quote = content.match(/\bThe current (gasoline price|price of diesel fuel) in (?:the )?(.{1,80}?) is ([A-Z]{3}) ([\d,.]+) per lit(?:er|re) or USD ([\d,.]+) per lit(?:er|re) (?:and was updated on|based on the latest update from) (\d{1,2}-[A-Za-z]{3}-\d{4})\b/);
  if (!quote) return parseLitreTable(detail, identity, country, date);
  if (countryKey(quote[2]) !== countryKey(identity[1]) ||
      (quote[1] === 'gasoline price' ? 'gasoline' : 'diesel') !== fuelType ||
      quote[3] !== country.currency || observationDate(quote[6]) !== date) return null;
  const local = numericPrice(quote[4]), usd = numericPrice(quote[5]);
  if (!Number.isFinite(local) || local <= 0 || !Number.isFinite(usd) || usd <= 0) return null;
  return { local, usd, observed_at: date };
}

function isOlderThan(candidateDate, baselineDate) {
  if (!candidateDate || !baselineDate) return false;
  return candidateDate < baselineDate;
}

function getLatestDate(dates) {
  return dates.filter(Boolean).sort().slice(-1)[0] || null;
}

function buildFuelValue(scrapedFuel, existingFuel, existingUpdatedAt) {
  var existingObservedAt = existingFuel && existingFuel.observed_at;
  // A USD equivalent is not a local-currency pump price. Keep the saved
  // product intact when its local replacement is unavailable or older.
  if (!scrapedFuel || !Number.isFinite(scrapedFuel.local) || scrapedFuel.local <= 0 ||
      isOlderThan(scrapedFuel.observed_at, existingObservedAt || existingUpdatedAt)) {
    return { fuel: existingFuel || null, observedAt: existingObservedAt || null, reusedExisting: !!existingFuel };
  }

  return {
    fuel: {
      price: scrapedFuel.local,
      unit: 'liter',
      usd: scrapedFuel.usd,
      change: 'unknown',
      change_pct: 0,
      observed_at: scrapedFuel.observed_at || null,
      source_url: scrapedFuel.source_url,
    },
    observedAt: scrapedFuel.observed_at || null,
    reusedExisting: false,
  };
}

async function fetchCountryFuelPrice(country, fuelType) {
  var url = 'https://www.globalpetrolprices.com/' + country.slug + '/' + fuelType + '_prices/';
  var res = await fetchWithRetry(url, {
    headers: {
      'User-Agent': 'AfroTools/1.0 (https://afrotools.com; data aggregation)',
      'Accept': 'text/html',
    },
  });
  var html = await res.text();
  var parsed = parseCountryFuelQuote(html, country, fuelType);
  if (!parsed) {
    throw new Error('Could not parse ' + fuelType + ' price for ' + country.code);
  }
  parsed.source_url = url;
  return parsed;
}

async function mapWithConcurrency(items, concurrency, iteratee) {
  var results = new Array(items.length);
  var index = 0;

  async function worker() {
    while (index < items.length) {
      var currentIndex = index++;
      results[currentIndex] = await iteratee(items[currentIndex], currentIndex);
    }
  }

  var workers = [];
  var count = Math.min(concurrency, items.length);
  for (var i = 0; i < count; i++) workers.push(worker());
  await Promise.all(workers);
  return results;
}

/**
 * Source 1: GlobalPetrolPrices.com — Africa overview page
 * Fetches the overview page which lists all countries' petrol+diesel in USD/liter
 */
async function fetchFromGlobalPetrolPrices() {
  var previousData = await getData('fuel-latest');
  var previousMap = {};

  if (previousData && Array.isArray(previousData.countries)) {
    previousData.countries.forEach(function(country) {
      previousMap[country.code] = country;
    });
  }

  var observedProducts = 0;
  var countries = (await mapWithConcurrency(COUNTRIES, 6, async function(c) {
    try {
      if (c.code === 'ZW') {
        const previous = previousMap.ZW;
        const reviewed = zimbabweAggregateRow(previous, marketData);
        if (reviewed !== previous) return reviewed;
        // Preserve the whole original row if current records prevent a safe currency transition.
        if (previous && previous.currency !== c.currency) return previous;
      }
      var fuelResults = await Promise.all([
        fetchCountryFuelPrice(c, 'gasoline').catch(function() { return null; }),
        fetchCountryFuelPrice(c, 'diesel').catch(function() { return null; }),
      ]);

      var gasoline = fuelResults[0];
      var diesel = fuelResults[1];
      var existing = previousMap[c.code] || null;
      if (!gasoline && !diesel) return existing || null;

      var petrolResult = buildFuelValue(gasoline, existing && existing.petrol, existing && existing.last_updated);
      var dieselResult = buildFuelValue(diesel, existing && existing.diesel, existing && existing.last_updated);
      const acceptedPetrol = !!gasoline && !petrolResult.reusedExisting;
      const acceptedDiesel = !!diesel && !dieselResult.reusedExisting;
      if (!acceptedPetrol && !acceptedDiesel) return existing;
      observedProducts += Number(acceptedPetrol) + Number(acceptedDiesel);
      // A reused legacy price may only have a country snapshot date. Preserve
      // that date while the newly fetched sibling carries its own observation.
      const legacySibling = [petrolResult, dieselResult].some(item =>
        item.reusedExisting && !item.observedAt);
      var lastUpdated = legacySibling ? existing.last_updated : getLatestDate([
        petrolResult.observedAt,
        dieselResult.observedAt,
        existing && existing.last_updated,
      ]);

      // Country-level rollup is a snapshot date, not every product's date.
      return Object.assign({}, existing, {
        code: c.code,
        name: c.name,
        currency: c.currency,
        region: c.region,
        petrol: petrolResult.fuel,
        diesel: dieselResult.fuel,
        lpg: existing && existing.lpg ? existing.lpg : null,
        regulated: existing && typeof existing.regulated === 'boolean' ? existing.regulated : null,
        last_updated: lastUpdated,
        source: 'globalpetrolprices',
        source_url: gasoline ? gasoline.source_url : (existing && existing.source_url) || diesel.source_url,
        source_state: 'third_party_snapshot',
        official_verified: false,
      });
    } catch (err) {
      return null;
    }
  })).filter(Boolean);

  if (!observedProducts) throw new Error('GPP detail pages provided no usable dated local prices');
  if (countries.length < 20) {
    throw new Error('GPP detail pages: only ' + countries.length + ' countries parsed');
  }

  return countries.map(country => projectNationalPumpPrices(country, marketData));
}

/**
 * Source 2: Merge with seed data — use existing static data as baseline,
 * refresh what we can from free APIs
 */
async function fetchFromSeedWithForexUpdate() {
  // Load existing seed data
  var seed = await getData('fuel-latest');
  if (!seed || !seed.countries || seed.countries.length === 0) {
    throw new Error('No seed data available');
  }

  // Fetch current forex rates to recalculate USD equivalents
  var forexData = await getData('forex-latest');
  var rates = (forexData && forexData.rates) || {};

  var refreshedAt = new Date().toISOString();
  var countries = seed.countries.map(function(c) {
    const reviewed = projectNationalPumpPrices(zimbabweAggregateRow(c, marketData), marketData, refreshedAt);
    if (reviewed !== c || (c.code === 'ZW' && c.official_verified === true)) return reviewed;
    var updated = Object.assign({}, c);
    updated.last_updated = c.last_updated || '';
    updated.source = c.source || 'static-seed';
    updated.source_state = 'static_seed_forex_only';
    updated.source_note = 'Static seed reused; local fuel price date was preserved. USD equivalents may be recalculated from forex only.';
    updated.forex_refreshed_at = refreshedAt;
    updated.official_verified = c.official_verified === true;

    // Update USD prices using live forex if available
    if (rates[c.currency] && c.petrol && c.petrol.price) {
      updated.petrol = Object.assign({}, c.petrol, {
        usd: Math.round(c.petrol.price / rates[c.currency] * 100) / 100,
      });
    }
    if (rates[c.currency] && c.diesel && c.diesel.price) {
      updated.diesel = Object.assign({}, c.diesel, {
        usd: Math.round(c.diesel.price / rates[c.currency] * 100) / 100,
      });
    }

    return updated;
  });

  return countries;
}

/**
 * Transform raw country array into blob-ready format.
 * Also calculates change_pct against previous data.
 */
function transformFuelData(countries) {
  var sources = Array.from(new Set(countries.map(function(country) {
    return country && country.source ? country.source : 'unknown';
  })));
  var sourceStates = Array.from(new Set(countries.map(function(country) {
    return country && country.source_state ? country.source_state : 'unspecified';
  })));
  var officialVerifiedCount = countries.filter(function(country) {
    return country && country.official_verified === true;
  }).length;

  return {
    schemaVersion: 1,
    timestamp: new Date().toISOString(),
    countries: countries,
    source: sources.length === 1 ? sources[0] : 'mixed',
    source_state: sourceStates.length === 1 ? sourceStates[0] : 'mixed',
    official_verified_count: officialVerifiedCount,
    source_note: officialVerifiedCount
      ? 'Rows marked official_verified=true have regulator-backed source evidence.'
      : 'No row is marked as an official regulator fuel price in this snapshot.',
    record_count: countries.length,
  };
}

function validateFuelData(nextData) {
  if (!nextData || !Array.isArray(nextData.countries)) {
    return { valid: false, reason: 'Fuel data must contain a countries array' };
  }
  if (nextData.countries.length < 20) {
    return { valid: false, reason: 'Fuel data has too few country rows' };
  }

  var badRows = nextData.countries.filter(function(country) {
    var petrol = country && country.petrol;
    var diesel = country && country.diesel;
    return !country ||
      !country.code ||
      !petrol ||
      !diesel ||
      !Number.isFinite(Number(petrol.price)) ||
      !Number.isFinite(Number(diesel.price)) ||
      Number(petrol.price) <= 0 ||
      Number(diesel.price) <= 0;
  });

  if (badRows.length) {
    return { valid: false, reason: badRows.length + ' fuel rows have missing or invalid nested prices' };
  }

  var today = new Date().toISOString().slice(0, 10);
  var misleadingSeedRows = nextData.countries.filter(function(country) {
    return country &&
      country.source_state === 'static_seed_forex_only' &&
      country.last_updated === today &&
      country.official_verified !== true;
  });

  if (misleadingSeedRows.length) {
    return {
      valid: false,
      reason: 'Seed fallback cannot stamp current dates on unverified local fuel prices',
    };
  }

  return { valid: true };
}

exports.handler = async function(event) {
  if (event?.blobs) require('./_shared/connect-data-blobs')(event);
  return runScraper({
    id: 'fuel-prices',
    blobKey: 'fuel-latest',
    metaKey: 'fuel',
    sources: [
      { name: 'GlobalPetrolPrices', fn: fetchFromGlobalPetrolPrices },
      { name: 'SeedWithForex', fn: fetchFromSeedWithForexUpdate },
    ],
    transform: transformFuelData,
    validate: validateFuelData,
    validateOpts: { maxChangeRatio: 5.0 },
  });
};
