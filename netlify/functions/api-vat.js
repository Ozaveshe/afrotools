/**
 * AfroVAT API — VAT Calculation Endpoint
 * POST: Calculate VAT (add to amount or extract from amount)
 * GET:  Country VAT info or list all supported countries
 * Auth: x-api-key header or api_key query param
 */
const { getStore } = require('@netlify/blobs');
const { getAllowedOrigin } = require('./utils/cors');
const { checkRateLimit, getRemaining } = require('./_shared/rate-limit');
const { getApiPlanLimit, normalizeApiTier } = require('./_shared/api-plans');

const CORS = {
  'Access-Control-Allow-Origin': 'https://afrotools.com',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
  'Content-Type': 'application/json'
};

/* ========================================================================
   Full African VAT Database — 54 countries
   ======================================================================== */
const VAT_DB = {
  NG: {
    name: 'Nigeria', currency: 'NGN', rate: 7.5, reducedRates: [],
    authority: 'Federal Inland Revenue Service (FIRS)',
    exemptions: ['Basic food items', 'Medical and pharmaceutical products', 'Educational materials', 'Baby products', 'Agricultural equipment'],
    notes: 'VAT increased from 5% to 7.5% effective February 2020.',
    lastUpdated: '2024-01-01', source: 'FIRS'
  },
  KE: {
    name: 'Kenya', currency: 'KES', rate: 16, reducedRates: [{ rate: 8, label: 'Petroleum products' }],
    authority: 'Kenya Revenue Authority (KRA)',
    exemptions: ['Unprocessed foodstuffs', 'Agricultural inputs', 'Medical equipment', 'Educational materials'],
    notes: 'Standard rate of 16%. Zero-rated supplies include exports and international transport.',
    lastUpdated: '2024-01-01', source: 'KRA'
  },
  ZA: {
    name: 'South Africa', currency: 'ZAR', rate: 15, reducedRates: [],
    authority: 'South African Revenue Service (SARS)',
    exemptions: ['19 basic food items (brown bread, maize meal, rice, etc.)', 'Fuel levy goods', 'International transport', 'Educational services'],
    notes: 'Increased from 14% to 15% in April 2018. Zero-rated basic foodstuffs protect low-income households.',
    lastUpdated: '2024-01-01', source: 'SARS'
  },
  GH: {
    name: 'Ghana', currency: 'GHS', rate: 21.9, reducedRates: [{ rate: 15, label: 'Standard VAT (before levies)' }],
    authority: 'Ghana Revenue Authority (GRA)',
    exemptions: ['Basic foodstuffs', 'Agricultural inputs', 'Medical supplies', 'Educational materials'],
    notes: 'Effective rate of 21.9% includes: 15% standard VAT + 2.5% NHIL + 2.5% GETFund + 1% COVID levy + 1% KWEF levy.',
    lastUpdated: '2024-01-01', source: 'GRA'
  },
  TZ: {
    name: 'Tanzania', currency: 'TZS', rate: 18, reducedRates: [],
    authority: 'Tanzania Revenue Authority (TRA)',
    exemptions: ['Unprocessed foodstuffs', 'Agricultural inputs', 'Medical services', 'Educational services'],
    notes: 'Standard rate of 18%. Special relief for agricultural sector.',
    lastUpdated: '2024-01-01', source: 'TRA'
  },
  RW: {
    name: 'Rwanda', currency: 'RWF', rate: 18, reducedRates: [],
    authority: 'Rwanda Revenue Authority (RRA)',
    exemptions: ['Basic foodstuffs', 'Agricultural inputs', 'Medical supplies', 'Educational materials'],
    notes: 'Standard rate of 18%. Strong digital tax infrastructure with EBM (Electronic Billing Machine) requirement.',
    lastUpdated: '2024-01-01', source: 'RRA'
  },
  UG: {
    name: 'Uganda', currency: 'UGX', rate: 18, reducedRates: [],
    authority: 'Uganda Revenue Authority (URA)',
    exemptions: ['Unprocessed foodstuffs', 'Agricultural inputs', 'Medical supplies', 'Educational materials', 'Financial services'],
    notes: 'Standard rate of 18%. Rental income is exempt from VAT.',
    lastUpdated: '2024-01-01', source: 'URA'
  },
  ET: {
    name: 'Ethiopia', currency: 'ETB', rate: 15, reducedRates: [],
    authority: 'Ministry of Revenue',
    exemptions: ['Basic foodstuffs', 'Medical supplies', 'Agricultural inputs', 'Educational materials', 'Financial services'],
    notes: 'Standard rate of 15%. Turnover Tax (TOT) of 2% applies to businesses below VAT threshold.',
    lastUpdated: '2024-01-01', source: 'Ministry of Revenue'
  },
  EG: {
    name: 'Egypt', currency: 'EGP', rate: 14, reducedRates: [{ rate: 5, label: 'Machinery and equipment' }],
    authority: 'Egyptian Tax Authority (ETA)',
    exemptions: ['Basic foodstuffs', 'Health services', 'Educational services', 'Banking and financial services'],
    notes: 'Standard rate of 14%. Table tax applies to certain goods at different rates.',
    lastUpdated: '2024-01-01', source: 'ETA'
  },
  MA: {
    name: 'Morocco', currency: 'MAD', rate: 20, reducedRates: [{ rate: 14, label: 'Transport, electricity' }, { rate: 10, label: 'Hotels, restaurants' }, { rate: 7, label: 'Basic necessities' }],
    authority: 'Direction Generale des Impots (DGI)',
    exemptions: ['Basic foodstuffs', 'Agricultural equipment', 'Medical services'],
    notes: 'Multiple reduced rates. Standard rate of 20%. Progressive reform underway to simplify rate structure.',
    lastUpdated: '2024-01-01', source: 'DGI'
  },
  DZ: {
    name: 'Algeria', currency: 'DZD', rate: 19, reducedRates: [{ rate: 9, label: 'Basic goods and services' }],
    authority: 'Direction Generale des Impots (DGI)',
    exemptions: ['Basic foodstuffs (bread, milk, cereals)', 'Medical products', 'Educational materials'],
    notes: 'Standard rate of 19% with reduced rate of 9% for essential goods.',
    lastUpdated: '2024-01-01', source: 'DGI'
  },
  TN: {
    name: 'Tunisia', currency: 'TND', rate: 19, reducedRates: [{ rate: 13, label: 'Certain services' }, { rate: 7, label: 'Basic necessities' }],
    authority: 'Direction Generale des Impots',
    exemptions: ['Basic foodstuffs', 'Medical services', 'Educational services'],
    notes: 'Standard rate of 19%. Three-tier rate structure.',
    lastUpdated: '2024-01-01', source: 'DGI Tunisia'
  },
  CM: {
    name: 'Cameroon', currency: 'XAF', rate: 19.25, reducedRates: [],
    authority: 'Direction Generale des Impots (DGI)',
    exemptions: ['Basic foodstuffs', 'Agricultural inputs', 'Medical supplies', 'Educational materials'],
    notes: 'Effective rate of 19.25% (17.5% VAT + 1.75% additional council tax surcharge).',
    lastUpdated: '2024-01-01', source: 'DGI Cameroon'
  },
  SN: {
    name: 'Senegal', currency: 'XOF', rate: 18, reducedRates: [],
    authority: 'Direction Generale des Impots et des Domaines (DGID)',
    exemptions: ['Basic foodstuffs', 'Agricultural inputs', 'Medical supplies', 'Educational materials'],
    notes: 'Standard rate of 18%. Member of WAEMU.',
    lastUpdated: '2024-01-01', source: 'DGID'
  },
  CI: {
    name: "Cote d'Ivoire", currency: 'XOF', rate: 18, reducedRates: [{ rate: 9, label: 'Milk, pasta, solar equipment' }],
    authority: 'Direction Generale des Impots (DGI)',
    exemptions: ['Basic foodstuffs', 'Agricultural inputs', 'Medical supplies'],
    notes: 'Standard rate of 18%. Reduced rate of 9% for selected essentials. Member of WAEMU.',
    lastUpdated: '2024-01-01', source: 'DGI Cote d\'Ivoire'
  },
  AO: {
    name: 'Angola', currency: 'AOA', rate: 14, reducedRates: [{ rate: 5, label: 'Basic food basket items' }, { rate: 7, label: 'Hotels and tourism' }],
    authority: 'Administracao Geral Tributaria (AGT)',
    exemptions: ['Medical services', 'Educational services', 'Financial services'],
    notes: 'VAT introduced in October 2019 at 14%. Replaced consumption tax.',
    lastUpdated: '2024-01-01', source: 'AGT'
  },
  CD: {
    name: 'Democratic Republic of the Congo', currency: 'CDF', rate: 16, reducedRates: [],
    authority: 'Direction Generale des Impots (DGI)',
    exemptions: ['Basic foodstuffs', 'Medical supplies', 'Educational materials', 'Agricultural inputs'],
    notes: 'Standard rate of 16%. Limited VAT infrastructure outside major cities.',
    lastUpdated: '2024-01-01', source: 'DGI DRC'
  },
  ZM: {
    name: 'Zambia', currency: 'ZMW', rate: 16, reducedRates: [],
    authority: 'Zambia Revenue Authority (ZRA)',
    exemptions: ['Basic foodstuffs', 'Agricultural inputs', 'Medical supplies', 'Educational materials', 'Fuel'],
    notes: 'Standard rate of 16%. Zero-rated exports and diplomatic supplies.',
    lastUpdated: '2024-01-01', source: 'ZRA'
  },
  ZW: {
    name: 'Zimbabwe', currency: 'ZWL', rate: 15, reducedRates: [],
    authority: 'Zimbabwe Revenue Authority (ZIMRA)',
    exemptions: ['Basic foodstuffs', 'Medical supplies', 'Educational materials', 'Agricultural inputs'],
    notes: 'Standard rate of 15%. Also accepts USD and other currencies for tax purposes.',
    lastUpdated: '2024-01-01', source: 'ZIMRA'
  },
  BW: {
    name: 'Botswana', currency: 'BWP', rate: 14, reducedRates: [],
    authority: 'Botswana Unified Revenue Service (BURS)',
    exemptions: ['Basic foodstuffs', 'Medical services', 'Educational services', 'Financial services', 'Residential rent'],
    notes: 'Standard rate of 14%. Well-administered VAT system.',
    lastUpdated: '2024-01-01', source: 'BURS'
  },
  NA: {
    name: 'Namibia', currency: 'NAD', rate: 15, reducedRates: [],
    authority: 'Namibia Revenue Agency (NamRA)',
    exemptions: ['Basic foodstuffs', 'Medical services', 'Educational services', 'Financial services'],
    notes: 'Standard rate of 15%. Zero-rated exports.',
    lastUpdated: '2024-01-01', source: 'NamRA'
  },
  MZ: {
    name: 'Mozambique', currency: 'MZN', rate: 16, reducedRates: [],
    authority: 'Autoridade Tributaria de Mocambique (AT)',
    exemptions: ['Basic foodstuffs', 'Agricultural inputs', 'Medical supplies', 'Educational materials'],
    notes: 'Standard rate of 16%.',
    lastUpdated: '2024-01-01', source: 'AT Mozambique'
  },
  MW: {
    name: 'Malawi', currency: 'MWK', rate: 16.5, reducedRates: [],
    authority: 'Malawi Revenue Authority (MRA)',
    exemptions: ['Basic foodstuffs', 'Medical supplies', 'Agricultural inputs', 'Educational materials'],
    notes: 'Standard rate of 16.5%.',
    lastUpdated: '2024-01-01', source: 'MRA'
  },
  MU: {
    name: 'Mauritius', currency: 'MUR', rate: 15, reducedRates: [],
    authority: 'Mauritius Revenue Authority (MRA)',
    exemptions: ['Basic foodstuffs', 'Medical services', 'Educational services', 'Financial services', 'Residential rent'],
    notes: 'Standard rate of 15%. Well-developed VAT system with broad base.',
    lastUpdated: '2024-01-01', source: 'MRA Mauritius'
  },
  MG: {
    name: 'Madagascar', currency: 'MGA', rate: 20, reducedRates: [],
    authority: 'Direction Generale des Impots',
    exemptions: ['Basic foodstuffs', 'Medical supplies', 'Agricultural inputs'],
    notes: 'Standard rate of 20%. One of the higher rates in Africa.',
    lastUpdated: '2024-01-01', source: 'DGI Madagascar'
  },
  DJ: {
    name: 'Djibouti', currency: 'DJF', rate: 10, reducedRates: [],
    authority: 'Direction des Impots',
    exemptions: ['Basic foodstuffs', 'Medical supplies'],
    notes: 'Standard rate of 10%.',
    lastUpdated: '2024-01-01', source: 'Direction des Impots'
  },
  SC: {
    name: 'Seychelles', currency: 'SCR', rate: 15, reducedRates: [],
    authority: 'Seychelles Revenue Commission (SRC)',
    exemptions: ['Basic foodstuffs', 'Medical services', 'Educational services'],
    notes: 'Standard rate of 15%.',
    lastUpdated: '2024-01-01', source: 'SRC'
  },
  SZ: {
    name: 'Eswatini', currency: 'SZL', rate: 15, reducedRates: [],
    authority: 'Eswatini Revenue Authority (ERA)',
    exemptions: ['Basic foodstuffs', 'Medical supplies', 'Agricultural inputs', 'Educational materials'],
    notes: 'Standard rate of 15%. Formerly known as Swaziland.',
    lastUpdated: '2024-01-01', source: 'ERA'
  },
  LS: {
    name: 'Lesotho', currency: 'LSL', rate: 15, reducedRates: [],
    authority: 'Lesotho Revenue Authority (LRA)',
    exemptions: ['Basic foodstuffs', 'Medical supplies', 'Agricultural inputs'],
    notes: 'Standard rate of 15%.',
    lastUpdated: '2024-01-01', source: 'LRA'
  },
  CV: {
    name: 'Cape Verde', currency: 'CVE', rate: 15, reducedRates: [],
    authority: 'Direccao Nacional de Receitas do Estado (DNRE)',
    exemptions: ['Basic foodstuffs', 'Medical supplies', 'Educational materials'],
    notes: 'Standard rate of 15%.',
    lastUpdated: '2024-01-01', source: 'DNRE'
  },
  LR: {
    name: 'Liberia', currency: 'LRD', rate: 10, reducedRates: [],
    authority: 'Liberia Revenue Authority (LRA)',
    exemptions: ['Basic foodstuffs', 'Medical supplies', 'Agricultural inputs'],
    notes: 'Goods and Services Tax (GST) at 10%.',
    lastUpdated: '2024-01-01', source: 'LRA Liberia'
  },
  SL: {
    name: 'Sierra Leone', currency: 'SLE', rate: 15, reducedRates: [],
    authority: 'National Revenue Authority (NRA)',
    exemptions: ['Basic foodstuffs', 'Medical supplies', 'Agricultural inputs', 'Educational materials'],
    notes: 'Goods and Services Tax (GST) at 15%.',
    lastUpdated: '2024-01-01', source: 'NRA Sierra Leone'
  },
  GM: {
    name: 'Gambia', currency: 'GMD', rate: 15, reducedRates: [],
    authority: 'Gambia Revenue Authority (GRA)',
    exemptions: ['Basic foodstuffs', 'Medical supplies', 'Agricultural inputs'],
    notes: 'Standard rate of 15%.',
    lastUpdated: '2024-01-01', source: 'GRA Gambia'
  },
  MR: {
    name: 'Mauritania', currency: 'MRU', rate: 16, reducedRates: [],
    authority: 'Direction Generale des Impots',
    exemptions: ['Basic foodstuffs', 'Medical supplies'],
    notes: 'Standard rate of 16%.',
    lastUpdated: '2024-01-01', source: 'DGI Mauritania'
  },
  BJ: {
    name: 'Benin', currency: 'XOF', rate: 18, reducedRates: [],
    authority: 'Direction Generale des Impots (DGI)',
    exemptions: ['Basic foodstuffs', 'Medical supplies', 'Agricultural inputs', 'Educational materials'],
    notes: 'Standard rate of 18%. Member of WAEMU.',
    lastUpdated: '2024-01-01', source: 'DGI Benin'
  },
  BF: {
    name: 'Burkina Faso', currency: 'XOF', rate: 18, reducedRates: [],
    authority: 'Direction Generale des Impots (DGI)',
    exemptions: ['Basic foodstuffs', 'Medical supplies', 'Agricultural inputs', 'Educational materials'],
    notes: 'Standard rate of 18%. Member of WAEMU.',
    lastUpdated: '2024-01-01', source: 'DGI Burkina Faso'
  },
  ML: {
    name: 'Mali', currency: 'XOF', rate: 18, reducedRates: [],
    authority: 'Direction Generale des Impots (DGI)',
    exemptions: ['Basic foodstuffs', 'Medical supplies', 'Agricultural inputs', 'Educational materials'],
    notes: 'Standard rate of 18%. Member of WAEMU.',
    lastUpdated: '2024-01-01', source: 'DGI Mali'
  },
  NE: {
    name: 'Niger', currency: 'XOF', rate: 19, reducedRates: [],
    authority: 'Direction Generale des Impots (DGI)',
    exemptions: ['Basic foodstuffs', 'Medical supplies', 'Agricultural inputs'],
    notes: 'Standard rate of 19%. Member of WAEMU.',
    lastUpdated: '2024-01-01', source: 'DGI Niger'
  },
  TG: {
    name: 'Togo', currency: 'XOF', rate: 18, reducedRates: [],
    authority: 'Office Togolais des Recettes (OTR)',
    exemptions: ['Basic foodstuffs', 'Medical supplies', 'Agricultural inputs', 'Educational materials'],
    notes: 'Standard rate of 18%. Member of WAEMU.',
    lastUpdated: '2024-01-01', source: 'OTR'
  },
  GN: {
    name: 'Guinea', currency: 'GNF', rate: 18, reducedRates: [],
    authority: 'Direction Nationale des Impots (DNI)',
    exemptions: ['Basic foodstuffs', 'Medical supplies', 'Agricultural inputs'],
    notes: 'Standard rate of 18%.',
    lastUpdated: '2024-01-01', source: 'DNI Guinea'
  },
  TD: {
    name: 'Chad', currency: 'XAF', rate: 18, reducedRates: [],
    authority: 'Direction Generale des Impots (DGI)',
    exemptions: ['Basic foodstuffs', 'Medical supplies', 'Agricultural inputs'],
    notes: 'Standard rate of 18%. Member of CEMAC.',
    lastUpdated: '2024-01-01', source: 'DGI Chad'
  },
  GA: {
    name: 'Gabon', currency: 'XAF', rate: 18, reducedRates: [{ rate: 10, label: 'Tourism, cement' }],
    authority: 'Direction Generale des Impots (DGI)',
    exemptions: ['Basic foodstuffs', 'Medical supplies', 'Educational materials'],
    notes: 'Standard rate of 18% with reduced rate of 10%. Member of CEMAC.',
    lastUpdated: '2024-01-01', source: 'DGI Gabon'
  },
  CG: {
    name: 'Republic of the Congo', currency: 'XAF', rate: 18.9, reducedRates: [{ rate: 5, label: 'Basic necessities' }],
    authority: 'Direction Generale des Impots (DGI)',
    exemptions: ['Basic foodstuffs', 'Medical supplies', 'Educational materials'],
    notes: 'Effective rate of 18.9% (18% + 0.9% surcharge). Member of CEMAC.',
    lastUpdated: '2024-01-01', source: 'DGI Congo'
  },
  GQ: {
    name: 'Equatorial Guinea', currency: 'XAF', rate: 15, reducedRates: [],
    authority: 'Ministerio de Hacienda y Presupuestos',
    exemptions: ['Basic foodstuffs', 'Medical supplies'],
    notes: 'Standard rate of 15%. Member of CEMAC.',
    lastUpdated: '2024-01-01', source: 'Ministry of Finance'
  },
  CF: {
    name: 'Central African Republic', currency: 'XAF', rate: 19, reducedRates: [],
    authority: 'Direction Generale des Impots (DGI)',
    exemptions: ['Basic foodstuffs', 'Medical supplies'],
    notes: 'Standard rate of 19%. Member of CEMAC.',
    lastUpdated: '2024-01-01', source: 'DGI CAR'
  },
  ST: {
    name: 'Sao Tome and Principe', currency: 'STN', rate: 15, reducedRates: [],
    authority: 'Direccao dos Impostos',
    exemptions: ['Basic foodstuffs', 'Medical supplies'],
    notes: 'Standard rate of 15%.',
    lastUpdated: '2024-01-01', source: 'Direccao dos Impostos'
  },
  SD: {
    name: 'Sudan', currency: 'SDG', rate: 17, reducedRates: [],
    authority: 'Taxation Chamber',
    exemptions: ['Basic foodstuffs', 'Medical supplies', 'Educational materials'],
    notes: 'Standard rate of 17%.',
    lastUpdated: '2024-01-01', source: 'Taxation Chamber'
  },
  SS: {
    name: 'South Sudan', currency: 'SSP', rate: 18, reducedRates: [],
    authority: 'National Revenue Authority (NRA)',
    exemptions: ['Basic foodstuffs', 'Medical supplies'],
    notes: 'Standard rate of 18%. VAT system still developing.',
    lastUpdated: '2024-01-01', source: 'NRA South Sudan'
  },
  BI: {
    name: 'Burundi', currency: 'BIF', rate: 18, reducedRates: [],
    authority: 'Office Burundais des Recettes (OBR)',
    exemptions: ['Basic foodstuffs', 'Medical supplies', 'Agricultural inputs', 'Educational materials'],
    notes: 'Standard rate of 18%.',
    lastUpdated: '2024-01-01', source: 'OBR'
  },
  KM: {
    name: 'Comoros', currency: 'KMF', rate: 10, reducedRates: [],
    authority: 'Direction Generale des Impots',
    exemptions: ['Basic foodstuffs', 'Medical supplies'],
    notes: 'Standard rate of 10%.',
    lastUpdated: '2024-01-01', source: 'DGI Comoros'
  },
  SO: {
    name: 'Somalia', currency: 'SOS', rate: 0, reducedRates: [],
    authority: 'Federal Government of Somalia',
    exemptions: [],
    notes: 'No formal VAT system currently in place. Sales tax applies to some goods.',
    lastUpdated: '2024-01-01', source: 'Federal Government'
  },
  ER: {
    name: 'Eritrea', currency: 'ERN', rate: 0, reducedRates: [],
    authority: 'Inland Revenue Department',
    exemptions: [],
    notes: 'No VAT system. Uses sales tax at varying rates.',
    lastUpdated: '2024-01-01', source: 'Inland Revenue Department'
  },
  LY: {
    name: 'Libya', currency: 'LYD', rate: 0, reducedRates: [],
    authority: 'Tax Authority of Libya',
    exemptions: [],
    notes: 'No VAT system currently in place.',
    lastUpdated: '2024-01-01', source: 'Tax Authority'
  }
};

/* ========================================================================
   Helpers
   ======================================================================== */

function respond(status, body, extra = {}) {
  return { statusCode: status, headers: { ...CORS, ...extra }, body: JSON.stringify(body) };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

async function validateApiKey(apiKey) {
  if (!apiKey) return { valid: false };

  // Sandbox keys use deterministic data and their own free-tier limits.
  if (apiKey.startsWith('afro_test_')) {
    const freeLimits = getApiPlanLimit('free');
    const key = 'sandbox:vat:' + apiKey;
    if (!checkRateLimit(key, freeLimits.day)) {
      return { valid: true, tier: 'sandbox', sandbox: true, remaining: 0, limit: freeLimits.day, resetAt: 'midnight UTC' };
    }
    return { valid: true, tier: 'sandbox', sandbox: true, remaining: getRemaining(key, freeLimits.day), limit: freeLimits.day };
  }

  try {
    const store = getStore('apikeys');
    const data = await store.get(apiKey, { type: 'json' });
    if (!data) return { valid: false };

    const tier = normalizeApiTier(data.tier || 'free');
    const limits = getApiPlanLimit(tier);
    const today = new Date().toISOString().split('T')[0];
    const month = today.slice(0, 7);

    if (!data.usage) data.usage = {};
    if (!data.usage[today]) data.usage[today] = 0;
    if (!data.usage[month]) data.usage[month] = 0;

    const dailyUsage = data.usage[today];
    const monthlyUsage = data.usage[month];

    if (limits.day !== -1 && dailyUsage >= limits.day) {
      return { valid: true, tier, remaining: 0, limit: limits.day, resetAt: 'midnight UTC' };
    }
    if (limits.month !== -1 && monthlyUsage >= limits.month) {
      return { valid: true, tier, remaining: 0, limit: limits.month, resetAt: 'end of month' };
    }

    data.usage[today] = dailyUsage + 1;
    data.usage[month] = monthlyUsage + 1;
    data.lastUsed = new Date().toISOString();
    await store.setJSON(apiKey, data);

    return {
      valid: true,
      tier,
      remaining: limits.day === -1 ? 999999 : limits.day - dailyUsage - 1,
      limit: limits.day
    };
  } catch (err) {
    console.error('Key validation error:', err.message);
    return { valid: false };
  }
}

/* ========================================================================
   Handler
   ======================================================================== */

exports.handler = async (event) => {
  CORS['Access-Control-Allow-Origin'] = getAllowedOrigin(event);
  /* ---- CORS preflight ---- */
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS };

  /* ---- Authenticate ---- */
  const apiKey =
    event.headers['x-api-key'] ||
    event.headers['X-Api-Key'] ||
    (event.queryStringParameters || {}).api_key;

  const auth = await validateApiKey(apiKey);

  if (!auth.valid) {
    return respond(401, {
      error: 'Invalid or missing API key',
      code: 'INVALID_API_KEY',
      docs: 'https://afrotools.com/docs/api/authentication'
    });
  }

  if (auth.remaining <= 0) {
    return respond(
      429,
      {
        error: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        limit: auth.limit,
        resetAt: auth.resetAt
      },
      { 'Retry-After': '3600' }
    );
  }

  /* ---- GET: country VAT info / list all ---- */
  if (event.httpMethod === 'GET') {
    const country = ((event.queryStringParameters || {}).country || '').toUpperCase();

    if (auth.sandbox) {
      const sandboxCountry = {
        code: 'NG',
        name: 'Nigeria Sandbox',
        currency: 'NGN',
        rate: 7.5,
        hasReducedRates: false,
        sandbox: true,
        data_policy: 'deterministic sandbox data'
      };
      if (!country) {
        return respond(200, { status: 'success', total: 1, countries: [sandboxCountry], sandbox: true });
      }
      return respond(200, {
        status: 'success',
        country: 'NG',
        name: 'Nigeria Sandbox',
        currency: 'NGN',
        rate: 7.5,
        reducedRates: [],
        authority: 'AfroTools Sandbox',
        exemptions: [],
        notes: 'Deterministic sandbox data for development.',
        lastUpdated: '2026-01-01',
        source: 'AfroTools sandbox data',
        sandbox: true,
        data_policy: 'deterministic sandbox data'
      });
    }

    if (!country) {
      // Return all countries with VAT summary
      const countries = Object.entries(VAT_DB).map(([code, c]) => ({
        code,
        name: c.name,
        currency: c.currency,
        rate: c.rate,
        hasReducedRates: c.reducedRates.length > 0
      }));
      return respond(200, {
        status: 'success',
        total: countries.length,
        countries
      });
    }

    const info = VAT_DB[country];
    if (!info) {
      return respond(404, {
        error: `Country '${country}' not supported`,
        code: 'INVALID_COUNTRY',
        supported: Object.keys(VAT_DB)
      });
    }

    return respond(200, {
      status: 'success',
      country: country,
      ...info
    });
  }

  /* ---- POST: calculate VAT ---- */
  if (event.httpMethod === 'POST') {
    let body;
    try {
      body = JSON.parse(event.body);
    } catch {
      return respond(400, { error: 'Invalid JSON body', code: 'INVALID_JSON' });
    }

    const { country, amount, operation, customRate } = body;

    if (auth.sandbox) {
      const numAmount = Number(amount || 1000);
      const vatAmount = round2(numAmount * 0.075);
      return respond(200, {
        status: 'success',
        country: String(country || 'NG').toUpperCase(),
        countryName: 'Nigeria Sandbox',
        operation: operation || 'add',
        amountExclusive: round2(numAmount),
        vatRate: 7.5,
        vatAmount,
        amountInclusive: round2(numAmount + vatAmount),
        currency: 'NGN',
        sandbox: true,
        data_policy: 'deterministic sandbox data',
        _meta: {
          api: 'AfroVAT',
          version: 'v1',
          timestamp: new Date().toISOString(),
          sandbox: true,
          docs: 'https://afrotools.com/docs/api/vat'
        }
      });
    }

    if (!country) {
      return respond(400, {
        error: 'Missing required field: country',
        code: 'MISSING_REQUIRED_FIELD'
      });
    }

    const countryCode = country.toUpperCase();
    const info = VAT_DB[countryCode];
    if (!info) {
      return respond(404, {
        error: `Country '${countryCode}' not supported`,
        code: 'INVALID_COUNTRY',
        supported: Object.keys(VAT_DB)
      });
    }

    if (amount === undefined || amount === null || isNaN(Number(amount))) {
      return respond(400, {
        error: 'Missing or invalid required field: amount (must be a number)',
        code: 'MISSING_REQUIRED_FIELD'
      });
    }

    const numAmount = Number(amount);
    if (numAmount < 0) {
      return respond(400, {
        error: 'Amount must be a positive number',
        code: 'INVALID_VALUE'
      });
    }

    // Use custom rate if provided, otherwise country standard rate
    const rate = (customRate !== undefined && customRate !== null) ? Number(customRate) : info.rate;
    if (isNaN(rate) || rate < 0) {
      return respond(400, {
        error: 'customRate must be a non-negative number',
        code: 'INVALID_VALUE'
      });
    }

    const op = (operation || 'add').toLowerCase();
    const startTime = Date.now();
    let result;

    if (op === 'add' || op === 'inclusive') {
      // Add VAT to the amount (amount is exclusive / net)
      const vatAmount = round2(numAmount * (rate / 100));
      const totalInclusive = round2(numAmount + vatAmount);
      result = {
        operation: 'add',
        amountExclusive: round2(numAmount),
        vatRate: rate,
        vatAmount,
        amountInclusive: totalInclusive,
        currency: info.currency
      };
    } else if (op === 'extract' || op === 'remove' || op === 'exclusive') {
      // Extract VAT from the amount (amount is inclusive / gross)
      const amountExclusive = round2(numAmount / (1 + rate / 100));
      const vatAmount = round2(numAmount - amountExclusive);
      result = {
        operation: 'extract',
        amountInclusive: round2(numAmount),
        vatRate: rate,
        vatAmount,
        amountExclusive,
        currency: info.currency
      };
    } else {
      return respond(400, {
        error: "Invalid operation. Use 'add' (amount is net, add VAT) or 'extract' (amount is gross, extract VAT).",
        code: 'INVALID_OPERATION'
      });
    }

    return respond(200, {
      status: 'success',
      country: countryCode,
      countryName: info.name,
      ...result,
      _meta: {
        api: 'AfroVAT',
        version: '1.0',
        timestamp: new Date().toISOString(),
        responseTime: `${Date.now() - startTime}ms`,
        sandbox: auth.sandbox || false,
        docs: 'https://afrotools.com/docs/api/vat'
      }
    });
  }

  /* ---- Anything else ---- */
  return respond(405, {
    error: 'Method not allowed. Use GET or POST.',
    code: 'METHOD_NOT_ALLOWED'
  });
};
