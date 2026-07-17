/**
 * AfroTools — Scheduled Commodity Price Fetcher
 * Runs daily at 2am UTC via Netlify Scheduled Functions.
 *
 * Sources (with fallback chain):
 *  1. World Bank Pink Sheet XLSX (free, reliable, monthly data)
 *  2. Open commodity APIs (backup)
 *  3. Previous snapshot or static reference prices
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
const zlib = require('zlib');

const WORLD_BANK_COMMODITY_MARKETS_PAGE = 'https://www.worldbank.org/en/research/commodity-markets';
const WORLD_BANK_MONTHLY_XLSX_FALLBACK = 'https://thedocs.worldbank.org/en/doc/74e8be41ceb20fa0da750cda2f6b9e4e-0050012026/related/CMO-Historical-Data-Monthly.xlsx';

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

var WORLD_BANK_HEADER_MAP = {
  crude_oil: ['crude oil brent'],
  natural_gas: ['natural gas us'],
  gold: ['gold'],
  platinum: ['platinum'],
  copper: ['copper'],
  iron_ore: ['iron ore cfr spot'],
  cocoa: ['cocoa'],
  coffee_arabica: ['coffee arabica'],
  coffee_robusta: ['coffee robusta'],
  tea_mombasa: ['tea mombasa'],
  cotton: ['cotton a index'],
  sugar: ['sugar world'],
  wheat: ['wheat us hrw'],
  maize: ['maize'],
  rice: ['rice thai 5'],
  palm_oil: ['palm oil'],
  rubber: ['rubber rss3', 'rubber tsr20'],
  tobacco: ['tobacco us import u v'],
  phosphate: ['dap'],
  urea: ['urea'],
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
  var xlsxUrl = await getLatestWorldBankMonthlyUrl();
  var res = await fetchWithRetry(xlsxUrl, { retries: 2 });
  var workbook = Buffer.from(await res.arrayBuffer());
  var rows = parseWorldBankWorkbook(workbook);
  var parsed = extractWorldBankCommodities(rows);
  var commodities = parsed.commodities.map(function(commodity) {
    return Object.assign({}, commodity, {
      source: 'worldbank-cmo-xlsx',
      source_url: xlsxUrl,
      period: parsed.period,
    });
  });

  if (commodities.length < 5) {
    throw new Error('World Bank returned only ' + commodities.length + ' commodities');
  }

  return commodities;
}

/**
 * World Bank XLSX helper functions
 */
async function getLatestWorldBankMonthlyUrl() {
  try {
    var page = await fetchWithRetry(WORLD_BANK_COMMODITY_MARKETS_PAGE, { retries: 2 });
    var html = (await page.text()).replace(/\\\//g, '/');
    var matches = html.match(/https?:[^"'<> ]+CMO-Historical-Data-Monthly\.xlsx/g) || [];
    if (matches.length > 0) return matches[0];
  } catch (err) {
    console.log('[commodity] WB page discovery failed: ' + err.message);
  }

  return WORLD_BANK_MONTHLY_XLSX_FALLBACK;
}

function parseWorldBankWorkbook(buffer) {
  var files = unzipXlsx(buffer);
  var sharedStrings = parseSharedStrings(files['xl/sharedStrings.xml']);
  var sheetNames = Object.keys(files).filter(function(name) {
    return /^xl\/worksheets\/sheet\d+\.xml$/.test(name);
  });

  var bestRows = null;
  sheetNames.forEach(function(name) {
    var rows = parseWorksheet(files[name], sharedStrings);
    var hasCommodityHeader = rows.some(function(row) {
      return row.some(function(cell) {
        return normalizeHeader(cell) === 'crude oil brent';
      });
    });
    if (hasCommodityHeader && (!bestRows || rows.length > bestRows.length)) {
      bestRows = rows;
    }
  });

  if (!bestRows) {
    throw new Error('World Bank workbook did not contain the monthly commodity sheet');
  }

  return bestRows;
}

function extractWorldBankCommodities(rows) {
  var headerIndex = rows.findIndex(function(row) {
    return row.some(function(cell) { return normalizeHeader(cell) === 'crude oil brent'; }) &&
      row.some(function(cell) { return normalizeHeader(cell) === 'gold'; });
  });
  if (headerIndex < 0) throw new Error('World Bank header row not found');

  var headers = rows[headerIndex];
  var headerLookup = {};
  headers.forEach(function(header, index) {
    var normalized = normalizeHeader(header);
    if (normalized) headerLookup[normalized] = index;
  });

  var columnById = {};
  Object.keys(WORLD_BANK_HEADER_MAP).forEach(function(id) {
    var aliases = WORLD_BANK_HEADER_MAP[id];
    for (var i = 0; i < aliases.length; i++) {
      if (typeof headerLookup[aliases[i]] === 'number') {
        columnById[id] = headerLookup[aliases[i]];
        return;
      }
    }
  });

  var latestRow = null;
  for (var rowIndex = rows.length - 1; rowIndex > headerIndex; rowIndex--) {
    var row = rows[rowIndex];
    if (!/^\d{4}M\d{2}$/.test(String(row[0] || '').trim())) continue;

    var numericCount = Object.keys(columnById).filter(function(id) {
      return parsePrice(row[columnById[id]]) !== null;
    }).length;
    if (numericCount >= 5) {
      latestRow = row;
      break;
    }
  }

  if (!latestRow) throw new Error('World Bank latest data row not found');

  var commodities = Object.keys(columnById).map(function(id) {
    var def = COMMODITY_MAP[id];
    var price = parsePrice(latestRow[columnById[id]]);
    if (!def || price === null) return null;
    return {
      id: id,
      name: def.name,
      price: price,
      unit: def.unit,
      currency: 'USD',
      category: def.category,
    };
  }).filter(Boolean);

  return { period: latestRow[0], commodities: commodities };
}

function unzipXlsx(buffer) {
  var files = {};
  var eocdOffset = -1;
  for (var i = buffer.length - 22; i >= Math.max(0, buffer.length - 70000); i--) {
    if (buffer.readUInt32LE(i) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset < 0) throw new Error('XLSX end-of-central-directory not found');

  var entryCount = buffer.readUInt16LE(eocdOffset + 10);
  var pointer = buffer.readUInt32LE(eocdOffset + 16);

  for (var entry = 0; entry < entryCount; entry++) {
    if (buffer.readUInt32LE(pointer) !== 0x02014b50) {
      throw new Error('Invalid XLSX central directory');
    }

    var method = buffer.readUInt16LE(pointer + 10);
    var compressedSize = buffer.readUInt32LE(pointer + 20);
    var nameLength = buffer.readUInt16LE(pointer + 28);
    var extraLength = buffer.readUInt16LE(pointer + 30);
    var commentLength = buffer.readUInt16LE(pointer + 32);
    var localOffset = buffer.readUInt32LE(pointer + 42);
    var name = buffer.slice(pointer + 46, pointer + 46 + nameLength).toString('utf8');

    var localNameLength = buffer.readUInt16LE(localOffset + 26);
    var localExtraLength = buffer.readUInt16LE(localOffset + 28);
    var start = localOffset + 30 + localNameLength + localExtraLength;
    var payload = buffer.slice(start, start + compressedSize);

    if (method === 0) files[name] = payload;
    else if (method === 8) files[name] = zlib.inflateRawSync(payload);
    else throw new Error('Unsupported XLSX compression method ' + method);

    pointer += 46 + nameLength + extraLength + commentLength;
  }

  return files;
}

function parseSharedStrings(file) {
  if (!file) return [];
  var xml = file.toString('utf8');
  return (xml.match(/<si>[\s\S]*?<\/si>/g) || []).map(function(si) {
    return stripXmlTags(si);
  });
}

function parseWorksheet(file, sharedStrings) {
  if (!file) return [];
  var xml = file.toString('utf8');
  return (xml.match(/<row\b[\s\S]*?<\/row>/g) || []).map(function(rowXml) {
    var row = [];
    var cells = rowXml.match(/<c\b[\s\S]*?<\/c>/g) || [];
    cells.forEach(function(cellXml) {
      var refMatch = cellXml.match(/\br="([A-Z]+\d+)"/);
      if (!refMatch) return;
      row[columnIndex(refMatch[1])] = parseCellValue(cellXml, sharedStrings);
    });
    return row;
  });
}

function parseCellValue(cellXml, sharedStrings) {
  var type = (cellXml.match(/\bt="([^"]+)"/) || [])[1];
  if (type === 'inlineStr') {
    var inline = (cellXml.match(/<is>([\s\S]*?)<\/is>/) || [])[1] || '';
    return stripXmlTags(inline);
  }

  var value = (cellXml.match(/<v>([\s\S]*?)<\/v>/) || [])[1];
  if (value == null) return '';
  if (type === 's') return sharedStrings[Number(value)] || '';
  return decodeXml(value);
}

function columnIndex(ref) {
  var letters = (ref.match(/^([A-Z]+)/) || [])[1] || '';
  var total = 0;
  for (var i = 0; i < letters.length; i++) {
    total = total * 26 + letters.charCodeAt(i) - 64;
  }
  return total - 1;
}

function stripXmlTags(value) {
  return decodeXml(String(value || '').replace(/<[^>]+>/g, ''));
}

function decodeXml(value) {
  return String(value || '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, function(_, hex) { return String.fromCharCode(parseInt(hex, 16)); })
    .replace(/&#(\d+);/g, function(_, dec) { return String.fromCharCode(parseInt(dec, 10)); });
}

function normalizeHeader(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\*\*/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function parsePrice(value) {
  var text = String(value == null ? '' : value).replace(/,/g, '').trim();
  if (!text || text === '...' || text.indexOf('...') !== -1) return null;
  var parsed = Number(text);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.round(parsed * 10000) / 10000;
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

  // Oil price from API Ninjas when a key is configured.
  if (process.env.API_NINJAS_KEY) {
    try {
      var oilRes = await fetchWithRetry('https://api.api-ninjas.com/v1/commodityprice?name=crude_oil', {
        headers: { 'X-Api-Key': process.env.API_NINJAS_KEY },
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
  }

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
    source: (commodities[0] && commodities[0].source) || 'unknown',
    period: (commodities[0] && commodities[0].period) || null,
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
