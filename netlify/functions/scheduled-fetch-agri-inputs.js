/**
 * AfroTools — Scheduled Agricultural Input Price Fetcher
 * Runs weekly (Thursday 3am) via Netlify Scheduled Functions.
 *
 * Sources:
 *  1. World Bank food production index (dated statistical context)
 *  2. World Bank fertilizer benchmarks, when dated observations are available
 *  3. Unreviewed reference input prices per country (not live market quotes)
 *
 * Writes to Netlify Blobs 'live-data' → key 'agri-inputs-latest'.
 */

const { runScraper, fetchWithRetry } = require('./_shared/scraper-base');
const { getData } = require('./_shared/data-store');
const agri = require('./_shared/agri-reference');

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
  var now = new Date().toISOString(), codes = Object.keys(INPUTS), food = {}, fertilizer = {};
  var externalSources = { food_production: { status: 'unavailable' }, fertilizer: { status: 'unavailable' } };
  // Query the twelve supported countries, rather than the first page of ALL.
  // Select the latest dated non-empty observation independently of row order.
  try {
    var url = 'https://api.worldbank.org/v2/country/' + codes.join(';') + '/indicator/' + agri.FOOD_INDICATOR + '?mrnev=5&format=json&per_page=1000';
    var rows = [], pages = 1;
    for (var page = 1; page <= pages; page++) {
      var res = await fetchWithRetry(url + '&page=' + page, { headers: { 'Accept': 'application/json' } });
      var json = await res.json();
      if (!Array.isArray(json) || !Array.isArray(json[1])) throw new Error('Invalid food production response');
      pages = Number(json[0]?.pages || 1);
      if (!Number.isInteger(pages) || pages < 1 || pages > 5) throw new Error('Unexpected food production pagination');
      rows = rows.concat(json[1]);
    }
    food = agri.latestFoodObservations(rows, codes, now);
    externalSources.food_production = { status: Object.keys(food).length === codes.length ? 'available' : 'partial',
      countries_with_observations: Object.keys(food).length, retrieved_at: now, source: url };
  } catch (e) { console.log('[agri] Food production context unavailable'); }

  // Reuse the existing official Pink Sheet collector, preserving its actual
  // observation month and source URL. Global benchmarks are not local quotes.
  try {
    var commoditySnapshot = await getData('commodity-prices-latest');
    fertilizer = agri.fertilizerBenchmarks(commoditySnapshot, now);
    externalSources.fertilizer = { status: Object.keys(fertilizer).length === 2 ? 'available' : Object.keys(fertilizer).length ? 'partial' : 'unavailable',
      metrics_with_observations: Object.keys(fertilizer).length, snapshot_collected_at: agri.iso(commoditySnapshot?.timestamp),
      source: 'World Bank Pink Sheet via commodity-prices-latest' };
  } catch (e) { console.log('[agri] Fertilizer benchmark context unavailable'); }

  var forexData = await getData('forex-latest');
  return { ...agri.buildSnapshot(INPUTS, food, fertilizer, forexData, now), external_sources: externalSources };
}

function transformAgriData(snapshot) {
  return snapshot;
}

exports.handler = async function(event) {
  return runScraper({
    id: 'agri-inputs',
    blobKey: 'agri-inputs-latest',
    metaKey: 'agriculture',
    sources: [{ name: 'AfroTools reference seed with optional World Bank context', fn: fetchAgriInputs }],
    transform: transformAgriData,
    validateOpts: { maxChangeRatio: 3.0 },
  });
};
