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

// All 54 African countries with GlobalPetrolPrices slugs
var COUNTRIES = [
  { code: 'DZ', name: 'Algeria', currency: 'DZD', region: 'north', slug: 'Algeria' },
  { code: 'AO', name: 'Angola', currency: 'AOA', region: 'central', slug: 'Angola' },
  { code: 'BJ', name: 'Benin', currency: 'XOF', region: 'west', slug: 'Benin' },
  { code: 'BW', name: 'Botswana', currency: 'BWP', region: 'south', slug: 'Botswana' },
  { code: 'BF', name: 'Burkina Faso', currency: 'XOF', region: 'west', slug: 'Burkina-Faso' },
  { code: 'BI', name: 'Burundi', currency: 'BIF', region: 'east', slug: 'Burundi' },
  { code: 'CV', name: 'Cabo Verde', currency: 'CVE', region: 'west', slug: 'Cabo-Verde' },
  { code: 'CM', name: 'Cameroon', currency: 'XAF', region: 'central', slug: 'Cameroon' },
  { code: 'CF', name: 'Central African Republic', currency: 'XAF', region: 'central', slug: 'Central-African-Republic' },
  { code: 'TD', name: 'Chad', currency: 'XAF', region: 'central', slug: 'Chad' },
  { code: 'KM', name: 'Comoros', currency: 'KMF', region: 'east', slug: 'Comoros' },
  { code: 'CG', name: 'Congo', currency: 'XAF', region: 'central', slug: 'Republic-of-the-Congo' },
  { code: 'CD', name: 'DR Congo', currency: 'CDF', region: 'central', slug: 'Democratic-Republic-of-the-Congo' },
  { code: 'CI', name: "Côte d'Ivoire", currency: 'XOF', region: 'west', slug: 'Cote-d-Ivoire' },
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
  { code: 'ZW', name: 'Zimbabwe', currency: 'ZWL', region: 'south', slug: 'Zimbabwe' },
];

/**
 * Extract a numeric price from HTML text.
 * Looks for patterns like "1.234" or "1,234.56" near currency/unit context.
 */
function extractPrice(text) {
  if (!text) return null;
  // Remove thousand separators, grab the decimal number
  var cleaned = text.replace(/,/g, '').trim();
  var match = cleaned.match(/(\d+\.?\d*)/);
  return match ? parseFloat(match[1]) : null;
}

function stripHtml(html) {
  return String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#0?39;/g, "'")
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseCountryFuelTable(html, currency) {
  var anchoredHtml = String(html || '');
  var headingIndex = anchoredHtml.search(/<h1[^>]*>/i);
  if (headingIndex >= 0) anchoredHtml = anchoredHtml.slice(headingIndex);

  var tableMatch = anchoredHtml.match(/<table[^>]*>[\s\S]*?<\/table>/i);
  if (!tableMatch) return null;

  var rows = tableMatch[0].match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
  var values = {};

  rows.forEach(function(row) {
    var cells = row.match(/<(?:th|td)[^>]*>[\s\S]*?<\/(?:th|td)>/gi) || [];
    if (cells.length < 2) return;
    var label = stripHtml(cells[0]).replace(/^\W+/, '').toUpperCase();
    var literValue = extractPrice(stripHtml(cells[1]));
    if (!label || literValue === null) return;
    values[label] = literValue;
  });

  var local = values[String(currency || '').toUpperCase()] || null;
  var usd = values.USD || null;

  if (local === null && usd === null) return null;

  return { local: local, usd: usd };
}

function parseObservedDate(html) {
  var headingMatch = String(html || '').match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (!headingMatch) return null;

  var headingText = stripHtml(headingMatch[1]);
  var dateMatch = headingText.match(/(\d{2})-([A-Za-z]{3})-(\d{4})/);
  if (!dateMatch) return null;

  var monthMap = {
    Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
    Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
  };
  var month = monthMap[dateMatch[2]];
  if (!month) return null;

  return dateMatch[3] + '-' + month + '-' + dateMatch[1];
}

function isOlderThan(candidateDate, baselineDate) {
  if (!candidateDate || !baselineDate) return false;
  return candidateDate < baselineDate;
}

function getLatestDate(dates) {
  return dates.filter(Boolean).sort().slice(-1)[0] || null;
}

function buildFuelValue(scrapedFuel, existingFuel, existingUpdatedAt) {
  if (!scrapedFuel) {
    return { fuel: existingFuel || null, observedAt: null, reusedExisting: !!existingFuel };
  }

  if (isOlderThan(scrapedFuel.observed_at, existingUpdatedAt)) {
    return { fuel: existingFuel || null, observedAt: existingUpdatedAt || null, reusedExisting: !!existingFuel };
  }

  return {
    fuel: {
      price: scrapedFuel.local || scrapedFuel.usd,
      unit: 'liter',
      usd: scrapedFuel.usd,
      change: 'unknown',
      change_pct: 0,
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
  var parsed = parseCountryFuelTable(html, country.currency);
  if (!parsed) {
    throw new Error('Could not parse ' + fuelType + ' price for ' + country.code);
  }
  parsed.observed_at = parseObservedDate(html);
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

  var countries = (await mapWithConcurrency(COUNTRIES, 6, async function(c) {
    try {
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
      var lastUpdated = getLatestDate([
        petrolResult.observedAt,
        dieselResult.observedAt,
        existing && existing.last_updated,
      ]) || new Date().toISOString().slice(0, 10);

      return {
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
        source_url: 'https://www.globalpetrolprices.com/' + c.slug + '/gasoline_prices/',
        source_state: 'third_party_snapshot',
        official_verified: false,
      };
    } catch (err) {
      return null;
    }
  })).filter(Boolean);

  if (countries.length < 20) {
    throw new Error('GPP detail pages: only ' + countries.length + ' countries parsed');
  }

  return countries;
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
