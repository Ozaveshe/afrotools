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
const { getData } = require('./_shared/data-store');

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

var REFERENCE_COMMODITIES = {
  crude_oil: 84,
  natural_gas: 2.4,
  gold: 2350,
  platinum: 980,
  copper: 8900,
  iron_ore: 106,
  cocoa: 8.5,
  coffee_arabica: 5.5,
  coffee_robusta: 4.2,
  tea_mombasa: 2.6,
  cotton: 1.9,
  sugar: 0.52,
  wheat: 265,
  maize: 220,
  rice: 430,
  palm_oil: 910,
  rubber: 1.7,
  tobacco: 4800,
  phosphate: 575,
  urea: 340,
};

/**
 * Source 1: World Bank Commodity Prices API
 * Uses the Pink Sheet data (updated monthly, sometimes more)
 * https://www.worldbank.org/en/research/commodity-markets
 */
async function fetchFromWorldBank() {
  // World Bank Commodity Prices — monthly Pink Sheet data
  // Use the simple indicator API for individual commodities
  var commodities = [];

  // Fetch key indicators individually (more reliable than batch)
  var indicators = [
    { wb: 'CRUDE_BRENT', indicator: 'EP.CPI.BREN', id: 'crude_oil' },
    { wb: 'GOLD', indicator: 'EP.CPI.GOLD', id: 'gold' },
  ];

  // Alternative: use the World Bank Commodity Markets page data
  // This CSV endpoint is more reliable than the JSON API
  var csvUrl = 'https://thedocs.worldbank.org/en/doc/5d903e848db1d1b83e0ec8f744e55570-0350012021/related/CMO-Historical-Data-Monthly.csv';

  try {
    var res = await fetchWithRetry(csvUrl, { retries: 2 });
    var csvText = await res.text();

    // Parse last row of CSV for most recent month's prices
    var lines = csvText.trim().split('\n');
    if (lines.length < 3) throw new Error('CSV too short');

    var headers = lines[0].split(',').map(function(h) { return h.trim().replace(/"/g, ''); });
    var lastRow = lines[lines.length - 1].split(',').map(function(v) { return v.trim().replace(/"/g, ''); });

    // Map CSV columns to our commodity IDs
    var csvMap = {
      'CRUDE_BRENT': 'crude_oil', 'NGAS_US': 'natural_gas', 'GOLD': 'gold',
      'PLATINUM': 'platinum', 'COPPER': 'copper', 'IRON_ORE': 'iron_ore',
      'COCOA': 'cocoa', 'COFFEE_ARABIC': 'coffee_arabica', 'COFFEE_ROBUS': 'coffee_robusta',
      'TEA_MOMBASA': 'tea_mombasa', 'COTTON_A_INDX': 'cotton', 'SUGAR_WLD': 'sugar',
      'WHEAT_US_HRW': 'wheat', 'MAIZE': 'maize', 'RICE_05': 'rice',
      'PALM_OIL': 'palm_oil', 'RUBBER1_MYSG': 'rubber', 'DAP': 'phosphate',
      'UREA_EE_BULK': 'urea',
    };

    headers.forEach(function(header, idx) {
      var id = csvMap[header];
      if (!id || !COMMODITY_MAP[id]) return;
      var value = parseFloat(lastRow[idx]);
      if (isNaN(value) || value <= 0) return;

      var def = COMMODITY_MAP[id];
      commodities.push({
        id: id, name: def.name, price: value,
        unit: def.unit, currency: 'USD', category: def.category,
        source: 'worldbank-cmo',
      });
    });
  } catch (e) {
    console.log('[commodity] WB CSV failed: ' + e.message);
  }

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

async function fetchReferenceFallback() {
  var previous = await getData('commodity-prices-latest');
  if (previous && Array.isArray(previous.commodities) && previous.commodities.length > 0) {
    return previous.commodities.map(function(commodity) {
      return Object.assign({}, commodity, { source: 'previous-snapshot' });
    });
  }

  return Object.keys(COMMODITY_MAP).map(function(id) {
    var def = COMMODITY_MAP[id];
    return {
      id: id,
      name: def.name,
      price: REFERENCE_COMMODITIES[id] || null,
      unit: def.unit,
      currency: 'USD',
      category: def.category,
      source: 'reference-fallback',
    };
  }).filter(function(commodity) {
    return typeof commodity.price === 'number' && commodity.price > 0;
  });
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
      { name: 'ReferenceFallback', fn: fetchReferenceFallback },
    ],
    transform: transformCommodityData,
    validate: validateCommodityPrices,
  });
};
