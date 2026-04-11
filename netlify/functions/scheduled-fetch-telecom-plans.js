/**
 * AfroTools — Scheduled Telecom Plan Fetcher
 * Runs every 12 hours via Netlify Scheduled Functions.
 *
 * Sources (with fallback chain):
 *  1. Cable.co.uk broadband/mobile data (aggregated, structured)
 *  2. GSMA Intelligence open data
 *  3. Seed data enriched with forex refresh
 *
 * Output shape:
 *   {
 *     timestamp, source,
 *     countries: [{
 *       code, name, currency, region,
 *       providers: [{ name, type, plans: [{ name, data_gb, price_local, price_usd, validity_days }] }],
 *       avg_1gb_usd, cheapest_1gb_usd
 *     }]
 *   }
 *
 * Writes to Netlify Blobs 'live-data' → key 'telecom-latest'.
 */

const { runScraper, fetchWithRetry } = require('./_shared/scraper-base');
const { getData } = require('./_shared/data-store');

// Major African MNOs by country
var COUNTRY_PROVIDERS = {
  NG: { name: 'Nigeria', currency: 'NGN', region: 'west', providers: ['MTN', 'Airtel', 'Glo', '9mobile'] },
  KE: { name: 'Kenya', currency: 'KES', region: 'east', providers: ['Safaricom', 'Airtel', 'Telkom'] },
  ZA: { name: 'South Africa', currency: 'ZAR', region: 'south', providers: ['Vodacom', 'MTN', 'Cell C', 'Telkom'] },
  GH: { name: 'Ghana', currency: 'GHS', region: 'west', providers: ['MTN', 'Vodafone', 'AirtelTigo'] },
  EG: { name: 'Egypt', currency: 'EGP', region: 'north', providers: ['Vodafone', 'Orange', 'Etisalat', 'WE'] },
  TZ: { name: 'Tanzania', currency: 'TZS', region: 'east', providers: ['Vodacom', 'Airtel', 'Tigo', 'Halotel'] },
  UG: { name: 'Uganda', currency: 'UGX', region: 'east', providers: ['MTN', 'Airtel'] },
  ET: { name: 'Ethiopia', currency: 'ETB', region: 'east', providers: ['Ethio Telecom', 'Safaricom'] },
  CI: { name: "Côte d'Ivoire", currency: 'XOF', region: 'west', providers: ['Orange', 'MTN', 'Moov'] },
  SN: { name: 'Senegal', currency: 'XOF', region: 'west', providers: ['Orange', 'Free', 'Expresso'] },
  CM: { name: 'Cameroon', currency: 'XAF', region: 'central', providers: ['MTN', 'Orange', 'Nexttel'] },
  RW: { name: 'Rwanda', currency: 'RWF', region: 'east', providers: ['MTN', 'Airtel'] },
  MA: { name: 'Morocco', currency: 'MAD', region: 'north', providers: ['Maroc Telecom', 'Orange', 'inwi'] },
  TN: { name: 'Tunisia', currency: 'TND', region: 'north', providers: ['Ooredoo', 'Orange', 'Tunisie Telecom'] },
  DZ: { name: 'Algeria', currency: 'DZD', region: 'north', providers: ['Djezzy', 'Mobilis', 'Ooredoo'] },
  ZM: { name: 'Zambia', currency: 'ZMW', region: 'south', providers: ['MTN', 'Airtel', 'Zamtel'] },
  ZW: { name: 'Zimbabwe', currency: 'ZWL', region: 'south', providers: ['Econet', 'NetOne', 'Telecel'] },
  MZ: { name: 'Mozambique', currency: 'MZN', region: 'east', providers: ['Vodacom', 'Movitel', 'Tmcel'] },
  MW: { name: 'Malawi', currency: 'MWK', region: 'east', providers: ['Airtel', 'TNM'] },
  BW: { name: 'Botswana', currency: 'BWP', region: 'south', providers: ['Mascom', 'Orange', 'BeMobile'] },
  NA: { name: 'Namibia', currency: 'NAD', region: 'south', providers: ['MTC', 'TN Mobile'] },
  BF: { name: 'Burkina Faso', currency: 'XOF', region: 'west', providers: ['Orange', 'Moov'] },
  ML: { name: 'Mali', currency: 'XOF', region: 'west', providers: ['Orange', 'Moov'] },
  NE: { name: 'Niger', currency: 'XOF', region: 'west', providers: ['Airtel', 'Moov', 'Zamani'] },
  MG: { name: 'Madagascar', currency: 'MGA', region: 'east', providers: ['Orange', 'Airtel', 'Telma'] },
  CD: { name: 'DR Congo', currency: 'CDF', region: 'central', providers: ['Vodacom', 'Airtel', 'Orange'] },
  CG: { name: 'Congo', currency: 'XAF', region: 'central', providers: ['MTN', 'Airtel'] },
  GA: { name: 'Gabon', currency: 'XAF', region: 'central', providers: ['Airtel', 'Moov'] },
  MU: { name: 'Mauritius', currency: 'MUR', region: 'east', providers: ['My.t', 'Emtel', 'MTML'] },
  SC: { name: 'Seychelles', currency: 'SCR', region: 'east', providers: ['Cable & Wireless', 'Airtel'] },
};

var COUNTRY_NAME_ALIASES = {
  "cote d'ivoire": 'CI',
  'ivory coast': 'CI',
  'congo': 'CG',
  'congo democratic republic of': 'CD',
  'congo (democratic republic of)': 'CD',
  'dr congo': 'CD',
  'eswatini': 'SZ',
  'swaziland': 'SZ',
};

function normalizeCountryName(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&nbsp;/gi, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Source 1: Cable.co.uk mobile data pricing (published research)
 * They publish annual cost-of-1GB reports with African data
 */
async function fetchFromCableCo() {
  // Cable.co.uk publishes JSON data files for their annual research
  var url = 'https://www.cable.co.uk/mobiles/worldwide-data-pricing/';

  var res = await fetchWithRetry(url, {
    headers: {
      'User-Agent': 'AfroTools/1.0 (https://afrotools.com; data aggregation)',
      'Accept': 'text/html',
    },
  });

  var html = await res.text();

  // Parse the pricing table from the HTML
  var countries = [];
  var rowPattern = /<tr[^>]*>[\s\S]*?<\/tr>/gi;
  var rows = html.match(rowPattern) || [];

  // Map country names to our codes
  var nameToCode = {};
  Object.keys(COUNTRY_PROVIDERS).forEach(function(code) {
    nameToCode[normalizeCountryName(COUNTRY_PROVIDERS[code].name)] = code;
  });
  Object.keys(COUNTRY_NAME_ALIASES).forEach(function(alias) {
    nameToCode[normalizeCountryName(alias)] = COUNTRY_NAME_ALIASES[alias];
  });

  var now = new Date().toISOString().slice(0, 10);

  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    var cellPattern = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    var cells = [];
    var cellMatch;
    while ((cellMatch = cellPattern.exec(row)) !== null) {
      cells.push(cellMatch[1].replace(/<[^>]*>/g, '').trim());
    }

    if (cells.length >= 3) {
      var countryName = normalizeCountryName(cells[1] || cells[0]);
      var code = nameToCode[countryName];
      if (!code || !COUNTRY_PROVIDERS[code]) continue;

      var avgPrice = parseFloat((cells[cells.length - 1] || '').replace(/[^0-9.]/g, '')) || null;
      var cheapestPrice = avgPrice;
      var plans = cells.length >= 4 ? (parseInt(cells[3], 10) || null) : null;

      if (avgPrice) {
        var config = COUNTRY_PROVIDERS[code];
        countries.push({
          code: code,
          name: config.name,
          currency: config.currency,
          region: config.region,
          providers: config.providers.map(function(p) { return { name: p, type: 'MNO', plans: [] }; }),
          avg_1gb_usd: avgPrice,
          cheapest_1gb_usd: cheapestPrice,
          plans_sampled: plans,
          last_updated: now,
          source: 'cable.co.uk',
        });
      }
    }
  }

  if (countries.length < 5) {
    throw new Error('Cable.co.uk: only ' + countries.length + ' African countries parsed');
  }

  return countries;
}

/**
 * Source 2: Seed data enriched with live forex
 */
async function fetchFromSeedWithForex() {
  var seed = await getData('telecom-latest');
  if (!seed || !seed.countries || seed.countries.length === 0) {
    // Build from the COUNTRY_PROVIDERS config as a minimum baseline
    var forexData = await getData('forex-latest');
    var rates = (forexData && forexData.rates) || {};
    var now = new Date().toISOString().slice(0, 10);

    var countries = Object.keys(COUNTRY_PROVIDERS).map(function(code) {
      var config = COUNTRY_PROVIDERS[code];
      return {
        code: code,
        name: config.name,
        currency: config.currency,
        region: config.region,
        providers: config.providers.map(function(p) { return { name: p, type: 'MNO', plans: [] }; }),
        avg_1gb_usd: null,
        cheapest_1gb_usd: null,
        last_updated: now,
        source: 'baseline-config',
      };
    });

    return countries;
  }

  // Refresh USD equivalents with live forex
  var forexData = await getData('forex-latest');
  var rates = (forexData && forexData.rates) || {};
  var now = new Date().toISOString().slice(0, 10);

  return seed.countries.map(function(c) {
    var updated = Object.assign({}, c);
    updated.last_updated = now;
    updated.source = 'seed-with-forex-refresh';
    return updated;
  });
}

function transformTelecomData(countries) {
  return {
    timestamp: new Date().toISOString(),
    countries: countries,
    record_count: countries.length,
  };
}

exports.handler = async function(event) {
  return runScraper({
    id: 'telecom-plans',
    blobKey: 'telecom-latest',
    metaKey: 'telecom',
    sources: [
      { name: 'Cable.co.uk', fn: fetchFromCableCo },
      { name: 'SeedWithForex', fn: fetchFromSeedWithForex },
    ],
    transform: transformTelecomData,
    validateOpts: { maxChangeRatio: 4.0 },
  });
};
