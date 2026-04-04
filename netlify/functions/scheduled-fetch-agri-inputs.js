/**
 * AfroTools — Scheduled Agricultural Input Price Fetcher
 * Runs weekly (Thursday 3am) via Netlify Scheduled Functions.
 *
 * Sources:
 *  1. FAO STAT food price index
 *  2. World Bank fertilizer/ag commodity prices
 *  3. Reference data per country
 *
 * Writes to Netlify Blobs 'live-data' → key 'agri-inputs-latest'.
 */

const { runScraper, fetchWithRetry } = require('./_shared/scraper-base');
const { getData } = require('./_shared/data-store');

var INPUTS = {
  NG: { name: 'Nigeria', currency: 'NGN', inputs: { urea_50kg: 28000, npk_50kg: 32000, maize_seed_kg: 2500, rice_seed_kg: 3500, herbicide_l: 5000, insecticide_l: 6000 } },
  KE: { name: 'Kenya', currency: 'KES', inputs: { urea_50kg: 4500, npk_50kg: 5200, maize_seed_kg: 450, tea_seedling: 15, herbicide_l: 800, insecticide_l: 1200 } },
  GH: { name: 'Ghana', currency: 'GHS', inputs: { urea_50kg: 250, npk_50kg: 300, maize_seed_kg: 35, cocoa_seedling: 5, herbicide_l: 60, insecticide_l: 80 } },
  TZ: { name: 'Tanzania', currency: 'TZS', inputs: { urea_50kg: 85000, npk_50kg: 95000, maize_seed_kg: 6000, rice_seed_kg: 8000, herbicide_l: 15000 } },
  ET: { name: 'Ethiopia', currency: 'ETB', inputs: { urea_50kg: 3500, npk_50kg: 4200, wheat_seed_kg: 80, teff_seed_kg: 120, herbicide_l: 500 } },
  ZA: { name: 'South Africa', currency: 'ZAR', inputs: { urea_50kg: 650, npk_50kg: 750, maize_seed_kg: 180, herbicide_l: 200, insecticide_l: 300 } },
  CI: { name: "Côte d'Ivoire", currency: 'XOF', inputs: { urea_50kg: 18000, npk_50kg: 22000, cocoa_seedling: 250, herbicide_l: 3500 } },
  UG: { name: 'Uganda', currency: 'UGX', inputs: { urea_50kg: 150000, npk_50kg: 180000, maize_seed_kg: 8000, coffee_seedling: 3000, herbicide_l: 25000 } },
  RW: { name: 'Rwanda', currency: 'RWF', inputs: { urea_50kg: 35000, npk_50kg: 42000, maize_seed_kg: 2500, irish_potato_seed_kg: 500, herbicide_l: 5000 } },
  ZM: { name: 'Zambia', currency: 'ZMW', inputs: { urea_50kg: 900, npk_50kg: 1100, maize_seed_kg: 120, herbicide_l: 150 } },
  MW: { name: 'Malawi', currency: 'MWK', inputs: { urea_50kg: 65000, npk_50kg: 75000, maize_seed_kg: 5000, tobacco_seed_g: 15000, herbicide_l: 12000 } },
  SN: { name: 'Senegal', currency: 'XOF', inputs: { urea_50kg: 16000, npk_50kg: 20000, rice_seed_kg: 1200, groundnut_seed_kg: 800, herbicide_l: 3000 } },
};

async function fetchAgriInputs() {
  // Try FAO food price index
  var faoData = {};
  try {
    var url = 'https://api.worldbank.org/v2/country/ALL/indicator/AG.PRD.FOOD.XD?date=2022:2025&format=json&per_page=500';
    var res = await fetchWithRetry(url, { headers: { 'Accept': 'application/json' } });
    var json = await res.json();
    if (json && json[1]) {
      json[1].forEach(function(e) {
        if (e.value !== null && e.country) faoData[e.country.id] = e.value;
      });
    }
  } catch (e) { console.log('[agri] FAO/WB failed: ' + e.message); }

  // Try WB fertilizer prices (global)
  var fertPrices = {};
  try {
    var fertUrl = 'https://api.worldbank.org/v2/sources/47/country/WLD/series/UREA_EE_BULK;DAP/time/last?format=json&per_page=50';
    var fertRes = await fetchWithRetry(fertUrl, { headers: { 'Accept': 'application/json' } });
    var fertJson = await fertRes.json();
    var entries = (fertJson.source && fertJson.source[0] && fertJson.source[0].data) || [];
    entries.forEach(function(e) {
      if (e.series && e.value) fertPrices[e.series] = parseFloat(e.value);
    });
  } catch (e) { console.log('[agri] WB fertilizer failed: ' + e.message); }

  var forexData = await getData('forex-latest');
  var rates = (forexData && forexData.rates) || {};
  var now = new Date().toISOString().slice(0, 10);

  var countries = Object.keys(INPUTS).map(function(code) {
    var config = INPUTS[code];
    var fxRate = rates[config.currency] || 1;

    var inputs = Object.keys(config.inputs).map(function(key) {
      var localPrice = config.inputs[key];
      return {
        item: key,
        price_local: localPrice,
        price_usd: Math.round(localPrice / fxRate * 100) / 100,
        currency: config.currency,
      };
    });

    return {
      code: code,
      name: config.name,
      currency: config.currency,
      inputs: inputs,
      food_production_index: faoData[code] || null,
      global_urea_usd_mt: fertPrices['UREA_EE_BULK'] || null,
      global_dap_usd_mt: fertPrices['DAP'] || null,
      last_updated: now,
      source: 'reference-with-wb',
    };
  });

  return countries;
}

function transformAgriData(countries) {
  return { timestamp: new Date().toISOString(), countries: countries, record_count: countries.length };
}

exports.handler = async function(event) {
  return runScraper({
    id: 'agri-inputs',
    blobKey: 'agri-inputs-latest',
    metaKey: 'agriculture',
    sources: [{ name: 'MultiSource', fn: fetchAgriInputs }],
    transform: transformAgriData,
    validateOpts: { maxChangeRatio: 3.0 },
  });
};
