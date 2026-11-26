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

const INPUTS = agri.INPUTS;

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
    externalSources.food_production = { status: Object.keys(food).length === codes.length ? 'available' : Object.keys(food).length ? 'partial' : 'unavailable',
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
