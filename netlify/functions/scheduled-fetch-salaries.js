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

const { runScraper } = require('./_shared/scraper-base');
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

function getRowSector(row) {
  if (!row || typeof row !== 'object') {
    return '';
  }

  if (typeof row.role_category === 'string' && row.role_category) {
    return row.role_category;
  }

  if (typeof row.sector === 'string' && row.sector) {
    return row.sector;
  }

  return '';
}

function getRowSampleSize(row) {
  return Math.max(0, parseInt(row && row.sample_size, 10) || 0);
}

function parsePositiveNumber(value) {
  const number = parseFloat(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function getUsdRate(rates, currency) {
  if (!currency || currency === 'USD') {
    return 1;
  }

  const rate = rates && rates[currency];
  return typeof rate === 'number' && rate > 0 ? rate : null;
}

function getRowMedianUsd(row, rates, fallbackCurrency) {
  const explicitUsd =
    parsePositiveNumber(row && row.monthly_gross_usd) ||
    parsePositiveNumber(row && row.median_gross_usd) ||
    parsePositiveNumber(row && row.median_usd);

  if (explicitUsd) {
    return explicitUsd;
  }

  const localGross =
    parsePositiveNumber(row && row.median_gross) ||
    parsePositiveNumber(row && row.monthly_gross) ||
    parsePositiveNumber(row && row.monthly_gross_local);
  const currency = String((row && row.currency) || fallbackCurrency || 'USD').toUpperCase();
  const usdRate = getUsdRate(rates, currency);

  if (!localGross || !usdRate) {
    return null;
  }

  return localGross / usdRate;
}

function getRowMedianLocal(row, rates, fallbackCurrency) {
  const localGross =
    parsePositiveNumber(row && row.median_gross) ||
    parsePositiveNumber(row && row.monthly_gross) ||
    parsePositiveNumber(row && row.monthly_gross_local);

  if (localGross) {
    return localGross;
  }

  const explicitUsd =
    parsePositiveNumber(row && row.monthly_gross_usd) ||
    parsePositiveNumber(row && row.median_gross_usd) ||
    parsePositiveNumber(row && row.median_usd);
  const currency = String((row && row.currency) || fallbackCurrency || 'USD').toUpperCase();
  const usdRate = getUsdRate(rates, currency);

  if (!explicitUsd || !usdRate) {
    return null;
  }

  return explicitUsd * usdRate;
}

function normalizeCommunityBenchmarks(rows) {
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows.filter(function(row) {
    return (
      row &&
      typeof row === 'object' &&
      typeof row.country_code === 'string' &&
      !!getRowSector(row) &&
      (!row.period || row.period === 'monthly')
    );
  });
}

async function fetchCommunityBenchmarks() {
  if (!SUPABASE_KEY) {
    return [];
  }

  try {
    const response = await fetch(SUPABASE_URL + '/rest/v1/salary_benchmarks?select=*', {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: 'Bearer ' + SUPABASE_KEY,
      },
    });

    if (!response.ok) {
      throw new Error('HTTP ' + response.status);
    }

    return normalizeCommunityBenchmarks(await response.json());
  } catch (error) {
    console.log('[salaries] Community benchmark fetch failed: ' + error.message);
    return [];
  }
}

function summarizeCommunitySector(rows, rates, fallbackCurrency) {
  const usdValues = rows
    .map(function(row) {
      return getRowMedianUsd(row, rates, fallbackCurrency);
    })
    .filter(function(value) {
      return Number.isFinite(value) && value > 0;
    });
  const localValues = rows
    .map(function(row) {
      return getRowMedianLocal(row, rates, fallbackCurrency);
    })
    .filter(function(value) {
      return Number.isFinite(value) && value > 0;
    });

  if (usdValues.length === 0) {
    return null;
  }

  const usdTotal = usdValues.reduce(function(sum, value) {
    return sum + value;
  }, 0);
  const localTotal = localValues.reduce(function(sum, value) {
    return sum + value;
  }, 0);

  return {
    medianUsd: Math.round(usdTotal / usdValues.length),
    medianLocal: localValues.length ? Math.round(localTotal / localValues.length) : null,
    sampleSize: rows.reduce(function(sum, row) {
      return sum + getRowSampleSize(row);
    }, 0),
  };
}

async function buildSalaryDataset(options) {
  const opts = options || {};
  const forexData = await getData('forex-latest');
  const rates =
    forexData && forexData.rates && typeof forexData.rates === 'object'
      ? forexData.rates
      : {};
  const communityData = Array.isArray(opts.communityData) ? opts.communityData : [];
  const now = new Date().toISOString().slice(0, 10);

  return Object.keys(REFERENCE_SALARIES).map(function(code) {
    const currency = COUNTRY_CURRENCIES[code] || 'USD';
    const fxRate =
      typeof rates[currency] === 'number' && rates[currency] > 0 ? rates[currency] : 1;
    let countryHasCommunityData = false;

    const sectors = SECTORS.map(function(sector) {
      let medianUsd = REFERENCE_SALARIES[code][sector] || null;
      let medianLocal = medianUsd ? Math.round(medianUsd * fxRate) : null;
      let sampleSize = 0;

      const matches = communityData.filter(function(row) {
        return row.country_code === code && getRowSector(row) === sector;
      });

      const summary = summarizeCommunitySector(matches, rates, currency);
      if (summary && summary.medianUsd > 0) {
        medianUsd = summary.medianUsd;
        medianLocal = summary.medianLocal || (medianUsd ? Math.round(medianUsd * fxRate) : null);
        sampleSize = summary.sampleSize;
        countryHasCommunityData = true;
      }

      return {
        sector: sector,
        median_usd: medianUsd,
        median_local: medianLocal,
        p25_usd: medianUsd ? Math.round(medianUsd * 0.65) : null,
        p75_usd: medianUsd ? Math.round(medianUsd * 1.45) : null,
        sample_size: sampleSize,
        currency: currency,
      };
    });

    return {
      code: code,
      name: COUNTRY_NAMES[code] || code,
      currency: currency,
      sectors: sectors,
      last_updated: now,
      source: countryHasCommunityData ? 'community-enriched' : 'reference-with-forex',
    };
  });
}

async function fetchSalaryData() {
  const communityData = await fetchCommunityBenchmarks();
  return buildSalaryDataset({ communityData: communityData });
}

async function fetchReferenceSalaryData() {
  return buildSalaryDataset({ communityData: [] });
}

function transformSalaryData(countries) {
  return {
    timestamp: new Date().toISOString(),
    countries: countries,
    record_count: Array.isArray(countries) ? countries.length : 0,
  };
}

exports.handler = async function() {
  return runScraper({
    id: 'salary-benchmarks',
    blobKey: 'salary-benchmarks-latest',
    metaKey: 'salaries',
    sources: [
      { name: 'CommunityReference', fn: fetchSalaryData },
      { name: 'ReferenceFallback', fn: fetchReferenceSalaryData },
    ],
    transform: transformSalaryData,
    validateOpts: { maxChangeRatio: 3.0 },
  });
};
