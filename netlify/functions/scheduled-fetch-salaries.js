/**
 * AfroTools - Scheduled Salary Benchmark Fetcher
 * Runs weekly (Friday 3am) via Netlify Scheduled Functions.
 *
 * Sources:
 *  1. Live salary benchmark rows from Supabase when available
 *  2. Reference salary baselines with current forex conversion
 *
 * Output:
 *   {
 *     timestamp,
 *     countries: [{ code, name, sectors: [{ sector, median_usd, p25_usd, p75_usd }] }]
 *   }
 *
 * Writes to live_data_store key: salary-benchmarks-latest
 */

const { runScraper, fetchWithRetry } = require('./_shared/scraper-base');
const feeds = require('./_shared/reference-feeds');
const { conversionReceipt } = require('./_shared/reference-fx');
const { getData } = require('./_shared/data-store');

const SUPABASE_URL = 'https://zpclagtgczsygrgztlts.supabase.co';
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_DATA_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY;

const SECTORS = [
  'technology',
  'finance',
  'healthcare',
  'education',
  'oil_gas',
  'agriculture',
  'retail',
  'manufacturing',
  'government',
  'ngo',
];

const COUNTRY_NAMES = {
  NG: 'Nigeria',
  KE: 'Kenya',
  ZA: 'South Africa',
  GH: 'Ghana',
  EG: 'Egypt',
  ET: 'Ethiopia',
  TZ: 'Tanzania',
  RW: 'Rwanda',
  CI: "Cote d'Ivoire",
  MA: 'Morocco',
  UG: 'Uganda',
  SN: 'Senegal',
  CM: 'Cameroon',
};

const COUNTRY_CURRENCIES = {
  NG: 'NGN',
  KE: 'KES',
  ZA: 'ZAR',
  GH: 'GHS',
  EG: 'EGP',
  ET: 'ETB',
  TZ: 'TZS',
  RW: 'RWF',
  CI: 'XOF',
  MA: 'MAD',
  UG: 'UGX',
  SN: 'XOF',
  CM: 'XAF',
};

const REFERENCE_SALARIES = {
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

async function fetchCommunityBenchmarks() {
  if (!SUPABASE_KEY) return [];
  try {
    // Only aggregate columns needed by the typed observation contract.
    const fields = 'country_code,currency,role_category,experience_level,sample_size,median_gross,p25_gross,p75_gross,period,updated_at';
    const response = await fetchWithRetry(SUPABASE_URL+'/rest/v1/salary_benchmarks?select='+fields, {
      retries:1, timeoutMs:5000, headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+SUPABASE_KEY}});
    const rows = await response.json();
    return Array.isArray(rows) ? rows : [];
  } catch (_) {
    console.warn('[salaries] Community benchmark request or decoding failed');
    return [];
  }
}
async function fetchSalaryData() {
  const [forex,community] = await Promise.all([getData('forex-latest'),fetchCommunityBenchmarks()]);
  const now = new Date().toISOString();
  return Object.keys(REFERENCE_SALARIES).map(code => {
    const currency = COUNTRY_CURRENCIES[code];
    return {code,name:COUNTRY_NAMES[code],currency,source:'reference',...feeds.referenceFields(),
      last_updated:null,collected_at:now,conversion:conversionReceipt(forex,currency,feeds.options(now)),
      sectors:SECTORS.map(sector => {
        const median = REFERENCE_SALARIES[code][sector] ?? null;
        return {sector,currency,period:'monthly',...feeds.referenceFields(),median_usd:median,
          median_local:feeds.localAmount(median,currency,forex,now),p25_usd:null,p75_usd:null,sample_size:0,
          community_observations:feeds.communityObservations(community,code,sector,forex,now)};
      })};
  });
}
exports.handler = async function() {
  return runScraper({
    id: 'salary-benchmarks',
    blobKey: feeds.KEYS.salaries,
    metaKey: 'salaries',
    sourceType: 'reference',
    sources: [{name:'ReferenceAndSeparateCommunityObservations',fn:fetchSalaryData}],
    transform: countries => feeds.buildSnapshot('salaries',countries,new Date().toISOString()),
    validateOpts: {maxChangeRatio:3.0}
  });
};
