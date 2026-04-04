/**
 * AfroTools Scraper Base — Shared Infrastructure for All Scrapers
 *
 * Provides:
 *  - fetchWithRetry()  — HTTP fetch with exponential backoff (3 attempts)
 *  - validateData()    — anomaly detection (rejects wild outliers vs previous data)
 *  - logRun()          — writes each scraper run to Supabase `scraper_runs` table
 *  - runScraper()      — orchestrates: try sources → validate → store → log
 *
 * Usage:
 *   const { runScraper } = require('./_shared/scraper-base');
 *   exports.handler = async (event) => runScraper({
 *     id: 'fuel-prices',
 *     blobKey: 'fuel-latest',
 *     sources: [{ name: 'GlobalPetrolPrices', fn: fetchFromGPP }],
 *     validate: (newData, oldData) => ({ valid: true }),
 *     transform: (raw) => ({ countries: [...], timestamp: new Date().toISOString() }),
 *   });
 */

const { setData, getData, updateMeta } = require('./data-store');

// ── Supabase client for logging ─────────────────────────────────────
const SUPABASE_URL = 'https://zpclagtgczsygrgztlts.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_DATA_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

async function supabaseInsert(table, row) {
  if (!SUPABASE_SERVICE_KEY) {
    console.warn('[scraper-base] No SUPABASE_SERVICE_ROLE_KEY — skipping DB log');
    return null;
  }
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(row),
    });
    if (!res.ok) {
      const text = await res.text();
      console.warn(`[scraper-base] Supabase insert failed: ${res.status} ${text}`);
    }
    return res.ok;
  } catch (err) {
    console.warn(`[scraper-base] Supabase insert error: ${err.message}`);
    return null;
  }
}

// ── Fetch with Retry ────────────────────────────────────────────────

/**
 * Fetch a URL with exponential backoff retries.
 * @param {string} url
 * @param {object} [opts] - fetch options + { retries, backoffMs }
 * @returns {Response}
 */
async function fetchWithRetry(url, opts = {}) {
  var retries = opts.retries || 3;
  var backoffMs = opts.backoffMs || 1000;

  for (var attempt = 1; attempt <= retries; attempt++) {
    try {
      var fetchOpts = Object.assign({}, opts);
      delete fetchOpts.retries;
      delete fetchOpts.backoffMs;

      var res = await fetch(url, fetchOpts);
      if (res.ok) return res;

      // Retry on 429 (rate limit) and 5xx errors
      if (res.status === 429 || res.status >= 500) {
        if (attempt < retries) {
          var delay = backoffMs * Math.pow(2, attempt - 1);
          console.log(`[scraper-base] HTTP ${res.status} from ${url} — retry ${attempt}/${retries} in ${delay}ms`);
          await sleep(delay);
          continue;
        }
      }

      throw new Error(`HTTP ${res.status} from ${url}`);
    } catch (err) {
      if (attempt === retries) throw err;
      var delay = backoffMs * Math.pow(2, attempt - 1);
      console.log(`[scraper-base] Error fetching ${url}: ${err.message} — retry ${attempt}/${retries} in ${delay}ms`);
      await sleep(delay);
    }
  }
}

function sleep(ms) {
  return new Promise(function(resolve) { setTimeout(resolve, ms); });
}

// ── Anomaly Detection ───────────────────────────────────────────────

/**
 * Default validator: compare numeric values against previous data.
 * Flags values that changed by more than the threshold multiplier.
 * @param {object} newData - New scraped data
 * @param {object} oldData - Previous blob data (may be null)
 * @param {object} [opts] - { maxChangeRatio: 3.0, fields: ['price', 'rate'] }
 * @returns {{ valid: boolean, warnings: string[] }}
 */
function validateData(newData, oldData, opts) {
  var warnings = [];
  var maxRatio = (opts && opts.maxChangeRatio) || 3.0;

  if (!oldData) {
    return { valid: true, warnings: ['No previous data to compare — accepting as baseline'] };
  }

  // If both have a 'countries' array, compare per-country values
  if (Array.isArray(newData.countries) && Array.isArray(oldData.countries)) {
    var oldMap = {};
    oldData.countries.forEach(function(c) { oldMap[c.code || c.country] = c; });

    var anomalies = 0;
    newData.countries.forEach(function(c) {
      var code = c.code || c.country;
      var old = oldMap[code];
      if (!old) return;

      // Check all numeric fields
      Object.keys(c).forEach(function(key) {
        if (typeof c[key] !== 'number' || typeof old[key] !== 'number') return;
        if (old[key] === 0) return;

        var ratio = c[key] / old[key];
        if (ratio > maxRatio || ratio < 1 / maxRatio) {
          anomalies++;
          warnings.push(code + '.' + key + ': ' + old[key] + ' → ' + c[key] + ' (x' + ratio.toFixed(1) + ')');
        }
      });
    });

    // If more than 30% of countries have anomalies, reject the batch
    if (anomalies > newData.countries.length * 0.3) {
      return {
        valid: false,
        warnings: ['Too many anomalies (' + anomalies + '/' + newData.countries.length + '): ' + warnings.slice(0, 5).join('; ')],
      };
    }
  }

  return { valid: true, warnings: warnings };
}

// ── Run Logger ──────────────────────────────────────────────────────

/**
 * Log a scraper run to Supabase.
 * @param {string} scraperId - e.g. 'fuel-prices', 'telecom-mtn'
 * @param {string} status - 'ok' | 'stale' | 'error' | 'anomaly'
 * @param {object} details - { source, records_count, error_message }
 */
async function logRun(scraperId, status, details) {
  var row = {
    scraper_id: scraperId,
    status: status,
    source: (details && details.source) || null,
    records_count: (details && details.records_count) || 0,
    error_message: (details && details.error_message) || null,
    duration_ms: (details && details.duration_ms) || null,
    fetched_at: new Date().toISOString(),
  };

  // Log to console regardless
  console.log('[scraper-base] Run logged:', JSON.stringify(row));

  // Also persist to Supabase
  await supabaseInsert('scraper_runs', row);
}

// ── Main Orchestrator ───────────────────────────────────────────────

/**
 * Run a scraper end-to-end: try sources, validate, store, log.
 *
 * @param {object} config
 * @param {string} config.id          - Scraper identifier (e.g. 'fuel-prices')
 * @param {string} config.blobKey     - Netlify Blob key to write to (e.g. 'fuel-latest')
 * @param {string} config.metaKey     - Meta category key (e.g. 'fuel')
 * @param {Array}  config.sources     - [{ name, fn }] — each fn() returns raw data
 * @param {Function} [config.transform] - (rawData) => blob-ready data
 * @param {Function} [config.validate]  - (newData, oldData) => { valid, warnings }
 * @param {object} [config.validateOpts] - Options passed to default validateData()
 * @returns {{ statusCode, body }}
 */
async function runScraper(config) {
  var id = config.id;
  var blobKey = config.blobKey;
  var metaKey = config.metaKey || blobKey.replace('-latest', '');
  var sources = config.sources;
  var transform = config.transform || function(d) { return d; };
  var validate = config.validate || null;

  var startTime = Date.now();

  console.log('[' + id + '] Starting scheduled scrape...');

  // Step 1: Try each source in order
  var rawData = null;
  var usedSource = null;

  for (var i = 0; i < sources.length; i++) {
    var source = sources[i];
    try {
      console.log('[' + id + '] Trying source: ' + source.name);
      rawData = await source.fn();
      usedSource = source.name;
      console.log('[' + id + '] Success from ' + source.name);
      break;
    } catch (err) {
      console.error('[' + id + '] ' + source.name + ' failed: ' + err.message);
    }
  }

  var durationMs = Date.now() - startTime;

  // All sources failed
  if (!rawData) {
    console.warn('[' + id + '] All sources failed.');
    await logRun(id, 'error', {
      error_message: 'All sources failed',
      duration_ms: durationMs,
    });
    await updateMeta(metaKey, {
      status: 'stale',
      error: 'All sources failed',
      last_attempt: new Date().toISOString(),
    });
    return { statusCode: 500, body: id + ': all sources failed' };
  }

  // Step 2: Transform
  var newData;
  try {
    newData = transform(rawData);
  } catch (err) {
    await logRun(id, 'error', {
      source: usedSource,
      error_message: 'Transform failed: ' + err.message,
      duration_ms: durationMs,
    });
    return { statusCode: 500, body: id + ': transform error — ' + err.message };
  }

  // Step 3: Validate against previous data
  var oldData = await getData(blobKey);
  var validation;
  if (validate) {
    validation = validate(newData, oldData);
  } else {
    validation = validateData(newData, oldData, config.validateOpts || {});
  }

  if (validation.warnings && validation.warnings.length > 0) {
    console.warn('[' + id + '] Validation warnings: ' + validation.warnings.join('; '));
  }

  if (!validation.valid) {
    await logRun(id, 'anomaly', {
      source: usedSource,
      error_message: 'Anomaly detected: ' + (validation.warnings || []).join('; '),
      duration_ms: durationMs,
    });
    await updateMeta(metaKey, {
      status: 'anomaly',
      error: 'Data rejected — anomaly detected',
      last_attempt: new Date().toISOString(),
      anomaly_details: (validation.warnings || []).slice(0, 5),
    });
    // Keep old data, don't overwrite
    return { statusCode: 200, body: id + ': anomaly detected, old data retained' };
  }

  // Step 4: Write to Blobs
  var recordCount = 0;
  if (Array.isArray(newData.countries)) recordCount = newData.countries.length;
  else if (Array.isArray(newData.commodities)) recordCount = newData.commodities.length;
  else if (newData.rates) recordCount = Object.keys(newData.rates).length;
  else if (Array.isArray(newData.providers)) recordCount = newData.providers.length;

  var written = await setData(blobKey, newData);

  // Step 5: Write confidence scores (fire-and-forget)
  var sourceType = 'scraper';
  if (usedSource && usedSource.toLowerCase().includes('api')) sourceType = 'api';
  if (usedSource && usedSource.toLowerCase().includes('seed')) sourceType = 'manual';
  if (usedSource && usedSource.toLowerCase().includes('community')) sourceType = 'community';

  var confidence = sourceType === 'api' ? 0.9 : sourceType === 'scraper' ? 0.7 : sourceType === 'community' ? 0.6 : 0.5;
  logConfidence(metaKey, usedSource, sourceType, confidence, recordCount);

  // Step 6: Update meta
  var now = new Date().toISOString();
  await updateMeta(metaKey, {
    last_fetch: now,
    source: usedSource,
    status: written ? 'ok' : 'write-failed',
    records_count: recordCount,
    confidence: confidence,
    source_type: sourceType,
  });

  // Step 7: Log the run
  await logRun(id, written ? 'ok' : 'error', {
    source: usedSource,
    records_count: recordCount,
    error_message: written ? null : 'Blob write failed',
    duration_ms: Date.now() - startTime,
  });

  console.log('[' + id + '] Complete. Source: ' + usedSource + ', Records: ' + recordCount);
  return { statusCode: 200, body: id + ': updated from ' + usedSource + ' (' + recordCount + ' records)' };
}

// ── Confidence Score Logger ─────────────────────────────────────────

/**
 * Log a confidence score for scraped data (fire-and-forget).
 */
function logConfidence(category, sourceName, sourceType, confidence, recordCount) {
  var row = {
    category: category,
    country_code: null,
    metric: category + '_batch',
    value: recordCount,
    confidence: confidence,
    source_type: sourceType,
    source_name: sourceName,
    verified_by_count: 0,
    flagged: false,
  };

  supabaseInsert('data_confidence', row);
}

module.exports = {
  fetchWithRetry,
  validateData,
  logRun,
  logConfidence,
  runScraper,
  sleep,
};
