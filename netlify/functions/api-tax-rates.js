/**
 * AfroTools API — Tax Rates (static reference data)
 * GET /api/tax-rates                        — All countries
 * GET /api/tax-rates?country=NG             — Single country
 * GET /api/tax-rates?country=NG&type=paye   — PAYE only
 * GET /api/tax-rates?country=NG&type=vat    — VAT only
 *
 * Auth: x-api-key header or api_key query param
 */
var { validateApiKey, rateLimitHeaders, authErrorBody } = require('./utils/api-auth');
var engines = require('./_engines/index');
var { getAllowedOrigin } = require('./utils/cors');

var CORS = {
  'Access-Control-Allow-Origin': 'https://afrotools.com',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
  'Content-Type': 'application/json'
};

var PRODUCTION_DATA_POLICY = 'versioned AfroTools country tax reference data';

/* ---- VAT rates for all 54 countries ---- */
var VAT_RATES = {
  NG: { standard_rate: 0.075, authority: 'FIRS', year: '2026' },
  KE: { standard_rate: 0.16, authority: 'KRA', year: '2026' },
  ZA: { standard_rate: 0.15, authority: 'SARS', year: '2026' },
  GH: { standard_rate: 0.219, authority: 'GRA', year: '2026' },
  EG: { standard_rate: 0.14, authority: 'ETA', year: '2026' },
  TZ: { standard_rate: 0.18, authority: 'TRA', year: '2026' },
  RW: { standard_rate: 0.18, authority: 'RRA', year: '2026' },
  UG: { standard_rate: 0.18, authority: 'URA', year: '2026' },
  ET: { standard_rate: 0.15, authority: 'Ministry of Revenue', year: '2026' },
  MA: { standard_rate: 0.20, authority: 'DGI', year: '2026' },
  DZ: { standard_rate: 0.19, authority: 'DGI', year: '2026' },
  TN: { standard_rate: 0.19, authority: 'DGI', year: '2026' },
  CM: { standard_rate: 0.1925, authority: 'DGI', year: '2026' },
  SN: { standard_rate: 0.18, authority: 'DGID', year: '2026' },
  CI: { standard_rate: 0.18, authority: 'DGI', year: '2026' },
  AO: { standard_rate: 0.14, authority: 'AGT', year: '2026' },
  CD: { standard_rate: 0.16, authority: 'DGI', year: '2026' },
  ZM: { standard_rate: 0.16, authority: 'ZRA', year: '2026' },
  ZW: { standard_rate: 0.15, authority: 'ZIMRA', year: '2026' },
  BW: { standard_rate: 0.14, authority: 'BURS', year: '2026' },
  NA: { standard_rate: 0.15, authority: 'NamRA', year: '2026' },
  MZ: { standard_rate: 0.16, authority: 'AT', year: '2026' },
  MW: { standard_rate: 0.165, authority: 'MRA', year: '2026' },
  MU: { standard_rate: 0.15, authority: 'MRA', year: '2026' },
  MG: { standard_rate: 0.20, authority: 'DGI', year: '2026' },
  DJ: { standard_rate: 0.10, authority: 'Direction des Impots', year: '2026' },
  SC: { standard_rate: 0.15, authority: 'SRC', year: '2026' },
  SZ: { standard_rate: 0.15, authority: 'ERA', year: '2026' },
  LS: { standard_rate: 0.15, authority: 'LRA', year: '2026' },
  CV: { standard_rate: 0.15, authority: 'DNRE', year: '2026' },
  LR: { standard_rate: 0.10, authority: 'LRA', year: '2026' },
  SL: { standard_rate: 0.15, authority: 'NRA', year: '2026' },
  GM: { standard_rate: 0.15, authority: 'GRA', year: '2026' },
  MR: { standard_rate: 0.16, authority: 'DGI', year: '2026' },
  BJ: { standard_rate: 0.18, authority: 'DGI', year: '2026' },
  BF: { standard_rate: 0.18, authority: 'DGI', year: '2026' },
  ML: { standard_rate: 0.18, authority: 'DGI', year: '2026' },
  NE: { standard_rate: 0.19, authority: 'DGI', year: '2026' },
  TG: { standard_rate: 0.18, authority: 'OTR', year: '2026' },
  GN: { standard_rate: 0.18, authority: 'DNI', year: '2026' },
  TD: { standard_rate: 0.18, authority: 'DGI', year: '2026' },
  GA: { standard_rate: 0.18, authority: 'DGI', year: '2026' },
  CG: { standard_rate: 0.185, authority: 'DGI', year: '2026' },
  GQ: { standard_rate: 0.15, authority: 'DGI', year: '2026' },
  CF: { standard_rate: 0.19, authority: 'DGI', year: '2026' },
  ST: { standard_rate: 0.15, authority: 'DGI', year: '2026' },
  SD: { standard_rate: 0.17, authority: 'Taxation Chamber', year: '2026' },
  SS: { standard_rate: 0.18, authority: 'NRA', year: '2026' },
  BI: { standard_rate: 0.18, authority: 'OBR', year: '2026' },
  KM: { standard_rate: 0.10, authority: 'AGID', year: '2026' },
  SO: { standard_rate: 0.10, authority: 'FGS Revenue', year: '2026' },
  ER: { standard_rate: 0.05, authority: 'Inland Revenue', year: '2026' },
  LY: { standard_rate: 0.00, authority: 'Tax Authority', year: '2026' },
  GW: { standard_rate: 0.15, authority: 'DGI', year: '2026' }
};

/* ---- Country name lookup ---- */
var COUNTRY_NAMES = {
  DZ:'Algeria',AO:'Angola',BJ:'Benin',BW:'Botswana',BF:'Burkina Faso',BI:'Burundi',
  CV:'Cabo Verde',CM:'Cameroon',CF:'Central African Republic',TD:'Chad',KM:'Comoros',
  CG:'Congo',CD:'DR Congo',CI:"Cote d'Ivoire",DJ:'Djibouti',EG:'Egypt',
  GQ:'Equatorial Guinea',ER:'Eritrea',SZ:'Eswatini',ET:'Ethiopia',GA:'Gabon',
  GM:'Gambia',GH:'Ghana',GN:'Guinea',GW:'Guinea-Bissau',KE:'Kenya',LS:'Lesotho',
  LR:'Liberia',LY:'Libya',MG:'Madagascar',MW:'Malawi',ML:'Mali',MR:'Mauritania',
  MU:'Mauritius',MA:'Morocco',MZ:'Mozambique',NA:'Namibia',NE:'Niger',NG:'Nigeria',
  RW:'Rwanda',ST:'Sao Tome and Principe',SN:'Senegal',SC:'Seychelles',
  SL:'Sierra Leone',SO:'Somalia',ZA:'South Africa',SS:'South Sudan',SD:'Sudan',
  TZ:'Tanzania',TG:'Togo',TN:'Tunisia',UG:'Uganda',ZM:'Zambia',ZW:'Zimbabwe'
};

var CURRENCIES = {
  DZ:'DZD',AO:'AOA',BJ:'XOF',BW:'BWP',BF:'XOF',BI:'BIF',CV:'CVE',CM:'XAF',
  CF:'XAF',TD:'XAF',KM:'KMF',CG:'XAF',CD:'CDF',CI:'XOF',DJ:'DJF',EG:'EGP',
  GQ:'XAF',ER:'ERN',SZ:'SZL',ET:'ETB',GA:'XAF',GM:'GMD',GH:'GHS',GN:'GNF',
  GW:'XOF',KE:'KES',LS:'LSL',LR:'LRD',LY:'LYD',MG:'MGA',MW:'MWK',ML:'XOF',
  MR:'MRU',MU:'MUR',MA:'MAD',MZ:'MZN',NA:'NAD',NE:'XOF',NG:'NGN',RW:'RWF',
  ST:'STN',SN:'XOF',SC:'SCR',SL:'SLE',SO:'SOS',ZA:'ZAR',SS:'SSP',SD:'SDG',
  TZ:'TZS',TG:'XOF',TN:'TND',UG:'UGX',ZM:'ZMW',ZW:'ZWL'
};

function respond(status, body, extra) {
  return { statusCode: status, headers: Object.assign({}, CORS, extra || {}), body: JSON.stringify(body) };
}

function buildCountryData(code) {
  var engine = engines.get(code);
  var vat = VAT_RATES[code];
  var result = {
    country: code,
    country_name: COUNTRY_NAMES[code] || code,
    currency: CURRENCIES[code] || 'USD',
    tax_authority: (vat && vat.authority) || (engine && engine.source) || 'Unknown',
    sandbox: false,
    data_policy: PRODUCTION_DATA_POLICY
  };

  // PAYE data from engine
  if (engine) {
    var opts = engine.getOptions ? engine.getOptions() : {};
    result.paye = {
      regimes: engine.regimes || ['STANDARD'],
      options: opts,
      year: engine.lastUpdated ? engine.lastUpdated.slice(0, 4) : '2026',
      source: engine.source
    };
  }

  // VAT data
  if (vat) {
    result.vat = {
      standard_rate: vat.standard_rate,
      currency: CURRENCIES[code] || 'USD',
      year: vat.year
    };
  }

  return result;
}

function sandboxTaxRates(country, type) {
  var base = {
    country: 'NG',
    country_name: 'Nigeria Sandbox',
    currency: 'NGN',
    tax_authority: 'AfroTools Sandbox',
    sandbox: true,
    data_policy: 'deterministic sandbox data'
  };
  if (type !== 'vat') {
    base.paye = {
      regimes: ['SANDBOX_2026'],
      options: { pension: true },
      year: '2026',
      source: 'AfroTools sandbox data'
    };
  }
  if (type !== 'paye') {
    base.vat = {
      standard_rate: 0.075,
      currency: 'NGN',
      year: '2026'
    };
  }
  if (country) return base;
  return { countries: [base], total: 1, sandbox: true, data_policy: 'deterministic sandbox data' };
}

exports.handler = async function(event) {
  CORS['Access-Control-Allow-Origin'] = getAllowedOrigin(event);
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS };
  if (event.httpMethod !== 'GET') return respond(405, { error: 'Method not allowed' });

  /* ---- Auth ---- */
  var auth = await validateApiKey(event, 'tax:rates');
  if (!auth.valid) return respond(auth.status || 401, authErrorBody(auth));

  var rlHeaders = rateLimitHeaders(auth);
  var params = event.queryStringParameters || {};
  var country = (params.country || '').toUpperCase();
  var type = (params.type || '').toLowerCase();

  if (auth.sandbox) {
    return respond(200, sandboxTaxRates(country, type), rlHeaders);
  }

  /* ---- Single country ---- */
  if (country) {
    if (!COUNTRY_NAMES[country]) {
      return respond(404, { error: 'Country not found', code: 'INVALID_COUNTRY', supported: Object.keys(COUNTRY_NAMES).sort() }, rlHeaders);
    }

    var data = buildCountryData(country);

    // Filter by type
    if (type === 'paye') { delete data.vat; }
    if (type === 'vat') { delete data.paye; }

    return respond(200, data, rlHeaders);
  }

  /* ---- All countries ---- */
  var countries = Object.keys(COUNTRY_NAMES).sort().map(function(code) {
    var entry = { country: code, country_name: COUNTRY_NAMES[code], currency: CURRENCIES[code] };
    if (type !== 'vat') {
      var engine = engines.get(code);
      if (engine) entry.has_paye = true;
    }
    if (type !== 'paye') {
      var vat = VAT_RATES[code];
      if (vat) entry.vat_rate = vat.standard_rate;
    }
    return entry;
  });

  return respond(200, {
    countries: countries,
    total: countries.length,
    sandbox: false,
    data_policy: PRODUCTION_DATA_POLICY
  }, rlHeaders);
};
