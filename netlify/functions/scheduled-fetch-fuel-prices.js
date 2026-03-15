/**
 * AfroTools Live Monitoring — Scheduled Fuel Price Fetcher
 * Runs every 6 hours via Netlify Scheduled Functions.
 *
 * For v1: GlobalPetrolPrices does not have a free API, so this function:
 *  - Reads from Netlify Blobs ('fuel-latest' in 'live-data' store)
 *  - If blob exists and is less than 7 days old, keeps it
 *  - Otherwise flags for manual update and re-caches the seed data
 *
 * The seed data in /data/fuel/latest.json IS the data for v1.
 */

const { getData, setData, updateMeta } = require('./_shared/data-store');

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

exports.handler = async function (event) {
  console.log('[fuel-fetch] Starting scheduled fuel price check...');

  const now = new Date();
  let data = null;
  let status = 'ok';

  // Try to read existing blob
  try {
    data = await getData('fuel-latest');
  } catch (err) {
    console.log(`[fuel-fetch] Could not read existing blob: ${err.message}`);
  }

  if (data && data.timestamp) {
    const dataAge = now.getTime() - new Date(data.timestamp).getTime();
    const daysSinceUpdate = Math.floor(dataAge / (24 * 60 * 60 * 1000));

    if (dataAge < SEVEN_DAYS_MS) {
      console.log(`[fuel-fetch] Cached fuel data is ${daysSinceUpdate} day(s) old — still fresh.`);

      await updateMeta('fuel', {
        last_fetch: now.toISOString(),
        source: 'cache',
        status: 'ok',
        data_age_days: daysSinceUpdate,
      });

      return { statusCode: 200, body: `Fuel data is fresh (${daysSinceUpdate} days old)` };
    }

    // Data is stale (>7 days)
    console.warn(`[fuel-fetch] Cached fuel data is ${daysSinceUpdate} day(s) old — STALE. Flagging for manual update.`);
    status = 'stale';
  } else {
    console.log('[fuel-fetch] No cached data found. Loading seed data...');
    status = 'seed';
  }

  // Load seed data from static files as fallback
  try {
    const seedData = await getData('fuel-latest');

    if (seedData) {
      // Re-cache with current timestamp to reset the staleness timer
      seedData.cached_at = now.toISOString();
      seedData._note = status === 'stale'
        ? 'Data is stale. Manual update from globalpetrolprices.com recommended.'
        : 'Loaded from seed data. Manual update from globalpetrolprices.com recommended.';

      await setData('fuel-latest', seedData);
      console.log(`[fuel-fetch] Seed/cached data re-written to Blobs.`);

      const countryCount = seedData.countries ? seedData.countries.length : 0;

      await updateMeta('fuel', {
        last_fetch: now.toISOString(),
        source: 'seed-data',
        status: status,
        countries_count: countryCount,
        needs_manual_update: status === 'stale',
      });

      return {
        statusCode: 200,
        body: `Fuel data loaded (${status}). ${countryCount} countries. Manual update recommended.`
      };
    }
  } catch (err) {
    console.error(`[fuel-fetch] Failed to load seed data: ${err.message}`);
  }

  // Complete failure
  await updateMeta('fuel', {
    last_fetch: now.toISOString(),
    source: 'none',
    status: 'error',
    error: 'No cached or seed data available',
  });

  return { statusCode: 500, body: 'Failed to load any fuel data' };
};
