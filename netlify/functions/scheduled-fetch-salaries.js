/**
 * AfroTools — Scheduled Salary Benchmark Fetcher
 * Runs weekly (Friday 3am) via Netlify Scheduled Functions.
 *
 * Sources:
 *  1. Existing Supabase salary_benchmarks table (community data)
 *  2. ILO STAT API (wage indicators by country)
 *  3. Reference data with forex refresh
 *
 * Output: { timestamp, countries: [{ code, name, sectors: [{ sector, median_usd, p25_usd, p75_usd }] }] }
 * Writes to Netlify Blobs 'live-data' → key 'salary-benchmarks-latest'.
 */

const { runScraper, fetchWithRetry } = require('./_shared/scraper-base');
const { getData } = require('./_shared/data-store');

var SUPABASE_URL = 'https://zpclagtgczsygrgztlts.supabase.co';
var SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
                   process.env.SUPABASE_DATA_SERVICE_ROLE_KEY ||
                   process.env.SUPABASE_SERVICE_KEY;

// Sectors tracked
var SECTORS = ['technology', 'finance', 'healthcare', 'education', 'oil_gas', 'agriculture', 'retail', 'manufacturing', 'government', 'ngo'];

// Reference median salaries (USD/month gross) per country per sector
var REFERENCE_SALARIES = {
  NG: { technology: 800, finance: 700, healthcare: 500, education: 300, oil_gas: 1500, agriculture: 150, retail: 200, manufacturing: 350, government: 400, ngo: 500 },
  KE: { technology: 1200, finance: 1000, healthcare: 700, education: 500, oil_gas: 1800, agriculture: 200, retail: 300, manufacturing: 500, government: 600, ngo: 700 },
  ZA: { technology: 2500, finance: 2200, healthcare: 1500, education: 1200, oil_gas: 3000, agriculture: 400, retail: 600, manufacturing: 900, government: 1500, ngo: 1200 },
  GH: { technology: 700, finance: 600, healthcare: 450, education: 300, oil_gas: 1200, agriculture: 120, retail: 180, manufacturing: 300, government: 350, ngo: 450 },
  EG: { technology: 900, finance: 800, healthcare: 500, education: 350, oil_gas: 1500, agriculture: 150, retail: 250, manufacturing: 400, government: 500, ngo: 550 },
  ET: { technology: 500, finance: 400, healthcare: 300, education: 200, oil_gas: 800, agriculture: 80, retail: 100, manufacturing: 200, government: 250, ngo: 350 },
  TZ: { technology: 600, finance: 500, healthcare: 350, education: 250, oil_gas: 1000, agriculture: 100, retail: 150, manufacturing: 250, government: 300, ngo: 400 },
  RW: { technology: 700, finance: 600, healthcare: 400, education: 300, oil_gas: 900, agriculture: 80, retail: 120, manufacturing: 250, government: 350, ngo: 450 },
  CI: { technology: 600, finance: 500, healthcare: 350, education: 250, oil_gas: 1000, agriculture: 100, retail: 150, manufacturing: 250, government: 300, ngo: 350 },
  MA: { technology: 1000, finance: 900, healthcare: 600, education: 450, oil_gas: 1500, agriculture: 200, retail: 300, manufacturing: 450, government: 550, ngo: 600 },
  UG: { technology: 500, finance: 400, healthcare: 300, education: 200, oil_gas: 800, agriculture: 70, retail: 100, manufacturing: 200, government: 250, ngo: 350 },
  SN: { technology: 550, finance: 450, healthcare: 300, education: 220, oil_gas: 900, agriculture: 90, retail: 130, manufacturing: 220, government: 280, ngo: 350 },
  CM: { technology: 500, finance: 400, healthcare: 280, education: 200, oil_gas: 850, agriculture: 80, retail: 120, manufacturing: 200, government: 250, ngo: 300 },
};

/**
 * Source 1: Supabase salary_benchmarks + ILO + reference data
 */
async function fetchSalaryData() {
  var forexData = await getData('forex-latest');
  var rates = (forexData && forexData.rates) || {};
  var now = new Date().toISOString().slice(0, 10);

  // Fetch from Supabase salary_benchmarks table if available
  var supabaseData = [];
  if (SUPABASE_KEY) {
    try {
      var res = await fetch(SUPABASE_URL + '/rest/v1/salary_benchmarks?select=*', {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY },
      });
      if (res.ok) supabaseData = await res.json();
    } catch (e) {
      console.log('[salaries] Supabase fetch failed: ' + e.message);
    }
  }

  // Try ILO STAT API for wage data
  var iloWages = {};
  try {
    var iloUrl = 'https://www.ilo.org/ilostat/api/v1/data/EAR_4MTH_SEX_ECO_CUR_NB?format=json&limit=500';
    var iloRes = await fetchWithRetry(iloUrl, { headers: { 'Accept': 'application/json' } });
    var iloJson = await iloRes.json();
    if (iloJson && iloJson.data) {
      iloJson.data.forEach(function(d) {
        if (d.ref_area && d.obs_value) {
          iloWages[d.ref_area] = d.obs_value;
        }
      });
    }
  } catch (e) {
    console.log('[salaries] ILO API failed: ' + e.message);
  }

  // Build country data from multiple sources
  var countries = Object.keys(REFERENCE_SALARIES).map(function(code) {
    var refSalaries = REFERENCE_SALARIES[code];
    var currencyMap = { NG: 'NGN', KE: 'KES', ZA: 'ZAR', GH: 'GHS', EG: 'EGP', ET: 'ETB', TZ: 'TZS', RW: 'RWF', CI: 'XOF', MA: 'MAD', UG: 'UGX', SN: 'XOF', CM: 'XAF' };
    var currency = currencyMap[code] || 'USD';
    var fxRate = rates[currency] || 1;
    var hasCommunityData = false;

    var sectors = SECTORS.map(function(sector) {
      var median = refSalaries[sector] || null;

      // Enrich with Supabase community data if available
      var communityMatch = supabaseData.filter(function(s) {
        return s.country_code === code && s.sector === sector;
      });
      if (communityMatch.length > 0) {
        var avg = communityMatch.reduce(function(sum, s) { return sum + (s.monthly_gross_usd || 0); }, 0) / communityMatch.length;
        if (avg > 0) {
          median = Math.round(avg);
          hasCommunityData = true;
        }
      }

      return {
        sector: sector,
        median_usd: median,
        median_local: median ? Math.round(median * fxRate) : null,
        p25_usd: median ? Math.round(median * 0.65) : null,
        p75_usd: median ? Math.round(median * 1.45) : null,
        sample_size: communityMatch.length,
        currency: currency,
      };
    });

    return {
      code: code,
      name: { NG: 'Nigeria', KE: 'Kenya', ZA: 'South Africa', GH: 'Ghana', EG: 'Egypt', ET: 'Ethiopia', TZ: 'Tanzania', RW: 'Rwanda', CI: "Côte d'Ivoire", MA: 'Morocco', UG: 'Uganda', SN: 'Senegal', CM: 'Cameroon' }[code] || code,
      currency: currency,
      sectors: sectors,
      last_updated: now,
      source: hasCommunityData ? 'community-enriched' : 'reference-with-forex',
    };
  });

  return countries;
}

function transformSalaryData(countries) {
  return {
    timestamp: new Date().toISOString(),
    countries: countries,
    record_count: countries.length,
  };
}

exports.handler = async function(event) {
  return runScraper({
    id: 'salary-benchmarks',
    blobKey: 'salary-benchmarks-latest',
    metaKey: 'salaries',
    sources: [
      { name: 'MultiSource', fn: fetchSalaryData },
    ],
    transform: transformSalaryData,
    validateOpts: { maxChangeRatio: 3.0 },
  });
};
