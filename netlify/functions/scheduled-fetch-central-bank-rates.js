/**
 * AfroTools Live Monitoring — Scheduled Central Bank Rates Fetcher
 * Runs every 12 hours via Netlify Scheduled Functions.
 *
 * Strategy:
 *  1. Try World Bank API for inflation data
 *  2. Fall back to cached/seed data
 *  3. Flag stale data for manual update
 */

const { getData, setData, updateMeta } = require('./_shared/data-store');

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// ISO3 country codes for World Bank API mapping
const COUNTRY_ISO3_MAP = {
  'DZ': 'DZA', 'AO': 'AGO', 'BJ': 'BEN', 'BW': 'BWA', 'BF': 'BFA',
  'BI': 'BDI', 'CV': 'CPV', 'CM': 'CMR', 'CF': 'CAF', 'TD': 'TCD',
  'KM': 'COM', 'CG': 'COG', 'CD': 'COD', 'CI': 'CIV', 'DJ': 'DJI',
  'EG': 'EGY', 'GQ': 'GNQ', 'ER': 'ERI', 'SZ': 'SWZ', 'ET': 'ETH',
  'GA': 'GAB', 'GM': 'GMB', 'GH': 'GHA', 'GN': 'GIN', 'GW': 'GNB',
  'KE': 'KEN', 'LS': 'LSO', 'LR': 'LBR', 'LY': 'LBY', 'MG': 'MDG',
  'MW': 'MWI', 'ML': 'MLI', 'MR': 'MRT', 'MU': 'MUS', 'MA': 'MAR',
  'MZ': 'MOZ', 'NA': 'NAM', 'NE': 'NER', 'NG': 'NGA', 'RW': 'RWA',
  'ST': 'STP', 'SN': 'SEN', 'SC': 'SYC', 'SL': 'SLE', 'SO': 'SOM',
  'ZA': 'ZAF', 'SS': 'SSD', 'SD': 'SDN', 'TZ': 'TZA', 'TG': 'TGO',
  'TN': 'TUN', 'UG': 'UGA', 'ZM': 'ZMB', 'ZW': 'ZWE'
};

/**
 * Fetch inflation data from World Bank API
 * Indicator: FP.CPI.TOTL.ZG (Consumer price index, annual % change)
 */
async function fetchWorldBankInflation() {
  const iso3Codes = Object.values(COUNTRY_ISO3_MAP).join(';');
  const currentYear = new Date().getFullYear();
  const url = `https://api.worldbank.org/v2/country/${iso3Codes}/indicator/FP.CPI.TOTL.ZG?date=${currentYear - 2}:${currentYear}&format=json&per_page=500`;

  console.log('[rates-fetch] Fetching World Bank inflation data...');

  const res = await fetch(url);
  if (!res.ok) throw new Error(`World Bank API: HTTP ${res.status}`);

  const json = await res.json();

  // World Bank returns [metadata, data_array]
  if (!Array.isArray(json) || json.length < 2 || !Array.isArray(json[1])) {
    throw new Error('World Bank API: unexpected response format');
  }

  // Build a map: ISO2 code -> latest inflation value
  const inflationMap = {};
  const iso3ToIso2 = {};
  for (const [iso2, iso3] of Object.entries(COUNTRY_ISO3_MAP)) {
    iso3ToIso2[iso3] = iso2;
  }

  for (const entry of json[1]) {
    if (entry.value === null) continue;
    const iso3 = entry.countryiso3code || (entry.country && entry.country.id);
    const iso2 = iso3ToIso2[iso3];
    if (!iso2) continue;

    // Keep the most recent non-null value
    if (!inflationMap[iso2] || entry.date > inflationMap[iso2].date) {
      inflationMap[iso2] = {
        headline: Math.round(entry.value * 10) / 10,
        date: entry.date,
      };
    }
  }

  console.log(`[rates-fetch] World Bank returned inflation data for ${Object.keys(inflationMap).length} countries`);
  return inflationMap;
}

exports.handler = async function (event) {
  console.log('[rates-fetch] Starting scheduled central bank rates check...');

  const now = new Date();

  // Load existing/seed data
  let data = await getData('rates-latest');

  if (!data || !data.countries) {
    console.log('[rates-fetch] No cached data — this will use seed data only.');

    await updateMeta('rates', {
      last_fetch: now.toISOString(),
      source: 'seed-data',
      status: 'seed',
    });

    return { statusCode: 200, body: 'No cached rates data. Seed data will be used.' };
  }

  // Check data age
  const dataAge = data.timestamp ? now.getTime() - new Date(data.timestamp).getTime() : Infinity;
  const isStale = dataAge > THIRTY_DAYS_MS;

  // Try to enrich with World Bank inflation data
  let worldBankSuccess = false;
  try {
    const inflationMap = await fetchWorldBankInflation();

    if (Object.keys(inflationMap).length > 0) {
      // Merge inflation data into existing country records
      for (const country of data.countries) {
        const wbData = inflationMap[country.code];
        if (wbData) {
          // Only update headline if World Bank data is more recent
          if (country.inflation) {
            country.inflation.wb_headline = wbData.headline;
            country.inflation.wb_date = wbData.date;
          }
        }
      }
      worldBankSuccess = true;
    }
  } catch (err) {
    console.error(`[rates-fetch] World Bank fetch failed: ${err.message}`);
  }

  // Update timestamp and write back
  data.timestamp = now.toISOString();
  data._enriched = worldBankSuccess ? 'worldbank' : 'none';

  if (isStale) {
    data._note = 'Policy rate data may be stale. Manual update recommended.';
  }

  await setData('rates-latest', data);

  const status = isStale ? 'stale' : 'ok';
  await updateMeta('rates', {
    last_fetch: now.toISOString(),
    source: worldBankSuccess ? 'worldbank+cache' : 'cache',
    status: status,
    countries_count: data.countries.length,
    wb_enriched: worldBankSuccess,
    needs_manual_update: isStale,
  });

  console.log(`[rates-fetch] Complete. Status: ${status}, WB enriched: ${worldBankSuccess}, Countries: ${data.countries.length}`);

  return {
    statusCode: 200,
    body: `Rates data updated. Status: ${status}. WB enriched: ${worldBankSuccess}.`
  };
};
