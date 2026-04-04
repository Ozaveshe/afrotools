/**
 * AfroTools — Scheduled Commodity Price Fetcher
 * Runs daily at 2am UTC via Netlify Scheduled Functions.
 *
 * Sources (with fallback chain):
 *  1. World Bank Commodity Price API (free, reliable, ~monthly data)
 *  2. Frankfurter-style commodity endpoint (backup)
 *  3. Static reference prices from CommodityTradeData
 *
 * Output shape:
 *   {
 *     timestamp, source,
 *     commodities: [{ id, name, price, unit, currency, change_pct, source }],
 *     benchmarks: { brent, gold, ... }
 *   }
 *
 * Writes to Netlify Blobs 'live-data' → key 'commodity-prices-latest'.
 */

const { runScraper, fetchWithRetry } = require('./_shared/scraper-base');

// Commodity IDs we track — mapped to World Bank indicator codes
var COMMODITY_MAP = {
  crude_oil:       { wb: 'CRUDE_BRENT', name: 'Crude Oil (Brent)', unit: 'barrel', category: 'energy' },
  natural_gas:     { wb: 'NGAS_US',     name: 'Natural Gas (Henry Hub)', unit: 'MMBtu', category: 'energy' },
  gold:            { wb: 'GOLD',        name: 'Gold', unit: 'troy oz', category: 'metals' },
  platinum:        { wb: 'PLATINUM',    name: 'Platinum', unit: 'troy oz', category: 'metals' },
  copper:          { wb: 'COPPER',      name: 'Copper', unit: 'mt', category: 'metals' },
  iron_ore:        { wb: 'IRON_ORE',   name: 'Iron Ore', unit: 'dmtu', category: 'metals' },
  cocoa:           { wb: 'COCOA',       name: 'Cocoa', unit: 'kg', category: 'agriculture' },
  coffee_arabica:  { wb: 'COFFEE_ARABIC', name: 'Coffee (Arabica)', unit: 'kg', category: 'agriculture' },
  coffee_robusta:  { wb: 'COFFEE_ROBUS',  name: 'Coffee (Robusta)', unit: 'kg', category: 'agriculture' },
  tea_mombasa:     { wb: 'TEA_MOMBASA', name: 'Tea (Mombasa Auction)', unit: 'kg', category: 'agriculture' },
  cotton:          { wb: 'COTTON_A_INDX', name: 'Cotton (A Index)', unit: 'kg', category: 'agriculture' },
  sugar:           { wb: 'SUGAR_WLD',   name: 'Sugar (World)', unit: 'kg', category: 'agriculture' },
  wheat:           { wb: 'WHEAT_US_HRW', name: 'Wheat (US HRW)', unit: 'mt', category: 'agriculture' },
  maize:           { wb: 'MAIZE',       name: 'Maize (Corn)', unit: 'mt', category: 'agriculture' },
  rice:            { wb: 'RICE_05',     name: 'Rice (Thai 5%)', unit: 'mt', category: 'agriculture' },
  palm_oil:        { wb: 'PALM_OIL',   name: 'Palm Oil', unit: 'mt', category: 'agriculture' },
  rubber:          { wb: 'RUBBER1_MYSG', name: 'Rubber (SGP/MYS)', unit: 'kg', category: 'agriculture' },
  tobacco:         { wb: 'TOBACCO_US',  name: 'Tobacco (US import)', unit: 'mt', category: 'agriculture' },
  phosphate:       { wb: 'DAP',         name: 'DAP Fertilizer', unit: 'mt', category: 'chemicals' },
  urea:            { wb: 'UREA_EE_BULK', name: 'Urea', unit: 'mt', category: 'chemicals' },
};

/**
 * Source 1: World Bank Commodity Prices API
 * Uses the Pink Sheet data (updated monthly, sometimes more)
 * https://www.worldbank.org/en/research/commodity-markets
 */
async function fetchFromWorldBank() {
  // The WB Commodity API endpoint gives latest month's prices
  var url = 'https://api.worldbank.org/v2/country/WLD/indicator/';

  // Alternative: use the direct commodity prices endpoint
  var cmUrl = 'https://datacatalogapi.worldbank.org/dexapps/fao/commodityprices';

  // Use the simpler GEM Commodities API
  // This returns recent commodity prices in JSON
  var apiUrl = 'https://api.worldbank.org/v2/sources/47/country/WLD/series/' +
    Object.values(COMMODITY_MAP).map(function(c) { return c.wb; }).join(';') +
    '/time/last?format=json&per_page=500';

  var res = await fetchWithRetry(apiUrl, {
    headers: { 'Accept': 'application/json' },
  });

  var json = await res.json();

  // Parse the World Bank response format
  var commodities = [];
  var entries = (json.source && json.source[0] && json.source[0].data) || json[1] || [];

  var priceMap = {};
  for (var i = 0; i < entries.length; i++) {
    var entry = entries[i];
    var seriesCode = entry.series || (entry.indicator && entry.indicator.id);
    var value = parseFloat(entry.value);
    if (seriesCode && !isNaN(value)) {
      priceMap[seriesCode] = value;
    }
  }

  // Map back to our commodity IDs
  Object.keys(COMMODITY_MAP).forEach(function(id) {
    var def = COMMODITY_MAP[id];
    var price = priceMap[def.wb];
    if (price) {
      commodities.push({
        id: id,
        name: def.name,
        price: price,
        unit: def.unit,
        currency: 'USD',
        category: def.category,
        source: 'worldbank',
      });
    }
  });

  if (commodities.length < 5) {
    throw new Error('World Bank returned only ' + commodities.length + ' commodities');
  }

  return commodities;
}

/**
 * Source 2: Open commodity price APIs (various free sources)
 */
async function fetchFromOpenAPIs() {
  var commodities = [];

  // Gold price from metals.live (free, no key)
  try {
    var goldRes = await fetchWithRetry('https://api.metals.live/v1/spot/gold');
    var goldData = await goldRes.json();
    if (Array.isArray(goldData) && goldData.length > 0) {
      commodities.push({
        id: 'gold', name: 'Gold', price: goldData[0].price,
        unit: 'troy oz', currency: 'USD', category: 'metals', source: 'metals.live',
      });
    }
  } catch (e) { console.log('[commodity] Gold fetch failed: ' + e.message); }

  // Platinum
  try {
    var ptRes = await fetchWithRetry('https://api.metals.live/v1/spot/platinum');
    var ptData = await ptRes.json();
    if (Array.isArray(ptData) && ptData.length > 0) {
      commodities.push({
        id: 'platinum', name: 'Platinum', price: ptData[0].price,
        unit: 'troy oz', currency: 'USD', category: 'metals', source: 'metals.live',
      });
    }
  } catch (e) { console.log('[commodity] Platinum fetch failed: ' + e.message); }

  // Copper
  try {
    var cuRes = await fetchWithRetry('https://api.metals.live/v1/spot/copper');
    var cuData = await cuRes.json();
    if (Array.isArray(cuData) && cuData.length > 0) {
      commodities.push({
        id: 'copper', name: 'Copper', price: cuData[0].price,
        unit: 'mt', currency: 'USD', category: 'metals', source: 'metals.live',
      });
    }
  } catch (e) { console.log('[commodity] Copper fetch failed: ' + e.message); }

  // Oil price from a free API
  try {
    var oilRes = await fetchWithRetry('https://api.api-ninjas.com/v1/commodityprice?name=crude_oil', {
      headers: { 'X-Api-Key': process.env.API_NINJAS_KEY || '' },
    });
    if (oilRes.ok) {
      var oilData = await oilRes.json();
      if (oilData.price) {
        commodities.push({
          id: 'crude_oil', name: 'Crude Oil (Brent)', price: oilData.price,
          unit: 'barrel', currency: 'USD', category: 'energy', source: 'api-ninjas',
        });
      }
    }
  } catch (e) { console.log('[commodity] Oil fetch failed: ' + e.message); }

  if (commodities.length < 2) {
    throw new Error('Open APIs returned only ' + commodities.length + ' commodities');
  }

  return commodities;
}

/**
 * Transform raw commodity array into blob-ready format
 */
function transformCommodityData(commodities) {
  // Build benchmark object for quick lookups
  var benchmarks = {};
  commodities.forEach(function(c) {
    benchmarks[c.id] = c.price;
  });

  return {
    timestamp: new Date().toISOString(),
    commodities: commodities,
    benchmarks: benchmarks,
    record_count: commodities.length,
  };
}

/**
 * Custom validator: commodity prices can be volatile but not insane
 */
function validateCommodityPrices(newData, oldData) {
  var warnings = [];

  if (!oldData || !oldData.commodities) {
    return { valid: true, warnings: ['First run — no previous data'] };
  }

  var oldPrices = {};
  oldData.commodities.forEach(function(c) { oldPrices[c.id] = c.price; });

  var anomalies = 0;
  (newData.commodities || []).forEach(function(c) {
    var old = oldPrices[c.id];
    if (!old || old === 0) return;

    var ratio = c.price / old;
    // Commodities are volatile — allow up to 5x change before flagging
    if (ratio > 5 || ratio < 0.2) {
      anomalies++;
      warnings.push(c.id + ': $' + old + ' → $' + c.price);
    }
  });

  if (anomalies > newData.commodities.length * 0.5) {
    return { valid: false, warnings: warnings };
  }

  return { valid: true, warnings: warnings };
}

exports.handler = async function(event) {
  return runScraper({
    id: 'commodity-prices',
    blobKey: 'commodity-prices-latest',
    metaKey: 'commodities',
    sources: [
      { name: 'WorldBank', fn: fetchFromWorldBank },
      { name: 'OpenAPIs', fn: fetchFromOpenAPIs },
    ],
    transform: transformCommodityData,
    validate: validateCommodityPrices,
  });
};
