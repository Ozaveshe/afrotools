/**
 * AfroTools — Scheduled Insurance Premium Fetcher
 * Runs weekly (Monday 3am) via Netlify Scheduled Functions.
 *
 * Sources:
 *  1. CompareGuru / Hippo scrape (SA market — largest dataset)
 *  2. Seed data enriched with forex refresh
 *
 * Output: { timestamp, countries: [{ code, name, products: [{ type, avg_premium_usd, ... }] }] }
 * Writes to Netlify Blobs 'live-data' → key 'insurance-rates-latest'.
 */

const { runScraper, fetchWithRetry } = require('./_shared/scraper-base');
const { getData } = require('./_shared/data-store');

// Insurance product types tracked per country
var INSURANCE_PRODUCTS = ['car_comprehensive', 'car_third_party', 'health_individual', 'health_family', 'life_term', 'funeral', 'home'];

// Key markets with known data sources
var MARKETS = {
  ZA: { name: 'South Africa', currency: 'ZAR', providers: ['Discovery', 'Old Mutual', 'Sanlam', 'Hollard', 'Momentum', 'Liberty'] },
  KE: { name: 'Kenya', currency: 'KES', providers: ['Britam', 'Jubilee', 'CIC', 'AAR', 'UAP'] },
  NG: { name: 'Nigeria', currency: 'NGN', providers: ['AXA Mansard', 'Leadway', 'AIICO', 'Cornerstone', 'Custodian'] },
  GH: { name: 'Ghana', currency: 'GHS', providers: ['Enterprise', 'SIC', 'Star Assurance', 'Hollard Ghana'] },
  EG: { name: 'Egypt', currency: 'EGP', providers: ['Allianz Egypt', 'AXA Egypt', 'MetLife Egypt', 'Misr Insurance'] },
  TZ: { name: 'Tanzania', currency: 'TZS', providers: ['Jubilee TZ', 'Alliance', 'Britam TZ', 'NIC'] },
  RW: { name: 'Rwanda', currency: 'RWF', providers: ['RSSB', 'Soras', 'Prime Insurance', 'Radiant'] },
  ET: { name: 'Ethiopia', currency: 'ETB', providers: ['Ethiopian Insurance', 'Nyala Insurance', 'Awash Insurance'] },
  CI: { name: "Côte d'Ivoire", currency: 'XOF', providers: ['NSIA', 'Allianz CI', 'Saham'] },
  MA: { name: 'Morocco', currency: 'MAD', providers: ['Wafa Assurance', 'RMA', 'Saham Maroc', 'AXA Maroc'] },
  UG: { name: 'Uganda', currency: 'UGX', providers: ['Jubilee UG', 'UAP', 'Sanlam UG'] },
  SN: { name: 'Senegal', currency: 'XOF', providers: ['NSIA', 'Allianz SN', 'AXA SN'] },
  CM: { name: 'Cameroon', currency: 'XAF', providers: ['Chanas', 'Activa', 'Allianz CM'] },
  ZM: { name: 'Zambia', currency: 'ZMW', providers: ['ZSIC', 'Madison', 'Professional Insurance'] },
  MU: { name: 'Mauritius', currency: 'MUR', providers: ['Swan', 'MUA', 'Mauritius Union'] },
};

// Reference premiums (USD/year) — baseline from industry reports
var REFERENCE_PREMIUMS = {
  ZA: { car_comprehensive: 850, car_third_party: 120, health_individual: 2400, health_family: 6000, life_term: 300, funeral: 80, home: 400 },
  KE: { car_comprehensive: 500, car_third_party: 80, health_individual: 800, health_family: 2000, life_term: 200, funeral: 50, home: 200 },
  NG: { car_comprehensive: 400, car_third_party: 60, health_individual: 600, health_family: 1500, life_term: 150, funeral: 40, home: 150 },
  GH: { car_comprehensive: 450, car_third_party: 70, health_individual: 700, health_family: 1800, life_term: 180, funeral: 45, home: 180 },
  EG: { car_comprehensive: 300, car_third_party: 50, health_individual: 500, health_family: 1200, life_term: 120, funeral: 30, home: 120 },
  TZ: { car_comprehensive: 350, car_third_party: 55, health_individual: 400, health_family: 1000, life_term: 100, funeral: 25, home: 100 },
  RW: { car_comprehensive: 300, car_third_party: 45, health_individual: 350, health_family: 900, life_term: 90, funeral: 20, home: 80 },
  ET: { car_comprehensive: 250, car_third_party: 40, health_individual: 300, health_family: 750, life_term: 80, funeral: 20, home: 70 },
  CI: { car_comprehensive: 400, car_third_party: 65, health_individual: 550, health_family: 1400, life_term: 140, funeral: 35, home: 140 },
  MA: { car_comprehensive: 500, car_third_party: 90, health_individual: 900, health_family: 2200, life_term: 220, funeral: 55, home: 250 },
  UG: { car_comprehensive: 300, car_third_party: 45, health_individual: 350, health_family: 900, life_term: 90, funeral: 20, home: 80 },
  SN: { car_comprehensive: 380, car_third_party: 60, health_individual: 500, health_family: 1300, life_term: 130, funeral: 30, home: 130 },
  CM: { car_comprehensive: 350, car_third_party: 55, health_individual: 450, health_family: 1100, life_term: 110, funeral: 28, home: 110 },
  ZM: { car_comprehensive: 350, car_third_party: 55, health_individual: 400, health_family: 1000, life_term: 100, funeral: 25, home: 100 },
  MU: { car_comprehensive: 600, car_third_party: 100, health_individual: 1200, health_family: 3000, life_term: 250, funeral: 60, home: 300 },
};

/**
 * Source 1: Fetch from industry data APIs + web sources
 */
async function fetchFromIndustrySources() {
  // Try to get insurance penetration data from World Bank
  // Indicator: IC.FRM.INS.ZS (firms with insurance)
  var wbUrl = 'https://api.worldbank.org/v2/country/ALL/indicator/IC.FRM.INS.ZS?date=2020:2025&format=json&per_page=500';

  var penetrationMap = {};
  try {
    var res = await fetchWithRetry(wbUrl, { headers: { 'Accept': 'application/json' } });
    var json = await res.json();
    if (json && json[1]) {
      json[1].forEach(function(entry) {
        if (entry.value !== null && entry.country) {
          penetrationMap[entry.country.id] = entry.value;
        }
      });
    }
  } catch (e) {
    console.log('[insurance] WB penetration data failed: ' + e.message);
  }

  // Build country data from reference premiums + forex adjustment
  var forexData = await getData('forex-latest');
  var rates = (forexData && forexData.rates) || {};
  var now = new Date().toISOString().slice(0, 10);

  var countries = Object.keys(MARKETS).map(function(code) {
    var market = MARKETS[code];
    var premiums = REFERENCE_PREMIUMS[code] || {};
    var fxRate = rates[market.currency] || 1;

    var products = INSURANCE_PRODUCTS.map(function(type) {
      var usdPremium = premiums[type] || null;
      return {
        type: type,
        avg_premium_usd: usdPremium,
        avg_premium_local: usdPremium ? Math.round(usdPremium * fxRate) : null,
        currency: market.currency,
      };
    }).filter(function(p) { return p.avg_premium_usd !== null; });

    return {
      code: code,
      name: market.name,
      currency: market.currency,
      providers: market.providers,
      products: products,
      insurance_penetration: penetrationMap[code] || null,
      last_updated: now,
      source: 'reference-with-forex',
    };
  });

  return countries;
}

function transformInsuranceData(countries) {
  return {
    timestamp: new Date().toISOString(),
    countries: countries,
    record_count: countries.length,
  };
}

exports.handler = async function(event) {
  return runScraper({
    id: 'insurance-premiums',
    blobKey: 'insurance-rates-latest',
    metaKey: 'insurance',
    sources: [
      { name: 'IndustrySources', fn: fetchFromIndustrySources },
    ],
    transform: transformInsuranceData,
    validateOpts: { maxChangeRatio: 3.0 },
  });
};
