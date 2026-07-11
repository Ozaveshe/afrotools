/**
 * AfroTools API — Country Data
 * GET /api/countries           — All 54 African countries
 * GET /api/countries?code=NG   — Single country detail
 *
 * Auth: x-api-key header or api_key query param
 */
var { validateApiKey, rateLimitHeaders } = require('./utils/api-auth');
var engines = require('./_engines/index');
var { getAllowedOrigin } = require('./utils/cors');

var CORS = {
  'Access-Control-Allow-Origin': 'https://afrotools.com',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
  'Content-Type': 'application/json'
};

// Static data — cache aggressively: CDN 24hr, browser 12hr
var CACHE_HDRS = {
  'Cache-Control': 'public, max-age=43200, s-maxage=86400, stale-while-revalidate=86400',
  'CDN-Cache-Control': 'public, max-age=86400',
  'Vary': 'Accept-Encoding'
};

function respond(status, body, extra) {
  var hdrs = status === 200 ? Object.assign({}, CORS, CACHE_HDRS, extra || {}) : Object.assign({}, CORS, extra || {});
  return { statusCode: status, headers: hdrs, body: JSON.stringify(body) };
}

/* ---- Country database ---- */
var COUNTRIES = {
  DZ: { name:'Algeria', currency:'DZD', currencySymbol:'DA', region:'North Africa', population:45600000 },
  AO: { name:'Angola', currency:'AOA', currencySymbol:'Kz', region:'Southern Africa', population:36700000 },
  BJ: { name:'Benin', currency:'XOF', currencySymbol:'CFA', region:'West Africa', population:13700000 },
  BW: { name:'Botswana', currency:'BWP', currencySymbol:'P', region:'Southern Africa', population:2600000 },
  BF: { name:'Burkina Faso', currency:'XOF', currencySymbol:'CFA', region:'West Africa', population:23300000 },
  BI: { name:'Burundi', currency:'BIF', currencySymbol:'FBu', region:'East Africa', population:13200000 },
  CV: { name:'Cabo Verde', currency:'CVE', currencySymbol:'CVE', region:'West Africa', population:600000 },
  CM: { name:'Cameroon', currency:'XAF', currencySymbol:'FCFA', region:'Central Africa', population:28600000 },
  CF: { name:'Central African Republic', currency:'XAF', currencySymbol:'FCFA', region:'Central Africa', population:5500000 },
  TD: { name:'Chad', currency:'XAF', currencySymbol:'FCFA', region:'Central Africa', population:18300000 },
  KM: { name:'Comoros', currency:'KMF', currencySymbol:'CF', region:'East Africa', population:900000 },
  CG: { name:'Congo', currency:'XAF', currencySymbol:'FCFA', region:'Central Africa', population:6100000 },
  CD: { name:'DR Congo', currency:'CDF', currencySymbol:'FC', region:'Central Africa', population:102300000 },
  CI: { name:"Cote d'Ivoire", currency:'XOF', currencySymbol:'CFA', region:'West Africa', population:28200000 },
  DJ: { name:'Djibouti', currency:'DJF', currencySymbol:'Fdj', region:'East Africa', population:1100000 },
  EG: { name:'Egypt', currency:'EGP', currencySymbol:'E\u00a3', region:'North Africa', population:109300000 },
  GQ: { name:'Equatorial Guinea', currency:'XAF', currencySymbol:'FCFA', region:'Central Africa', population:1700000 },
  ER: { name:'Eritrea', currency:'ERN', currencySymbol:'Nfk', region:'East Africa', population:3700000 },
  SZ: { name:'Eswatini', currency:'SZL', currencySymbol:'E', region:'Southern Africa', population:1200000 },
  ET: { name:'Ethiopia', currency:'ETB', currencySymbol:'Br', region:'East Africa', population:126500000 },
  GA: { name:'Gabon', currency:'XAF', currencySymbol:'FCFA', region:'Central Africa', population:2400000 },
  GM: { name:'Gambia', currency:'GMD', currencySymbol:'D', region:'West Africa', population:2700000 },
  GH: { name:'Ghana', currency:'GHS', currencySymbol:'GH\u20b5', region:'West Africa', population:34100000 },
  GN: { name:'Guinea', currency:'GNF', currencySymbol:'FG', region:'West Africa', population:14200000 },
  GW: { name:'Guinea-Bissau', currency:'XOF', currencySymbol:'CFA', region:'West Africa', population:2100000 },
  KE: { name:'Kenya', currency:'KES', currencySymbol:'KSh', region:'East Africa', population:55100000 },
  LS: { name:'Lesotho', currency:'LSL', currencySymbol:'L', region:'Southern Africa', population:2300000 },
  LR: { name:'Liberia', currency:'LRD', currencySymbol:'L$', region:'West Africa', population:5400000 },
  LY: { name:'Libya', currency:'LYD', currencySymbol:'LD', region:'North Africa', population:7000000 },
  MG: { name:'Madagascar', currency:'MGA', currencySymbol:'Ar', region:'East Africa', population:30300000 },
  MW: { name:'Malawi', currency:'MWK', currencySymbol:'MK', region:'Southern Africa', population:20900000 },
  ML: { name:'Mali', currency:'XOF', currencySymbol:'CFA', region:'West Africa', population:22600000 },
  MR: { name:'Mauritania', currency:'MRU', currencySymbol:'UM', region:'West Africa', population:4800000 },
  MU: { name:'Mauritius', currency:'MUR', currencySymbol:'Rs', region:'East Africa', population:1300000 },
  MA: { name:'Morocco', currency:'MAD', currencySymbol:'MAD', region:'North Africa', population:37800000 },
  MZ: { name:'Mozambique', currency:'MZN', currencySymbol:'MT', region:'Southern Africa', population:33900000 },
  NA: { name:'Namibia', currency:'NAD', currencySymbol:'N$', region:'Southern Africa', population:2600000 },
  NE: { name:'Niger', currency:'XOF', currencySymbol:'CFA', region:'West Africa', population:26200000 },
  NG: { name:'Nigeria', currency:'NGN', currencySymbol:'\u20a6', region:'West Africa', population:230000000 },
  RW: { name:'Rwanda', currency:'RWF', currencySymbol:'RF', region:'East Africa', population:14100000 },
  ST: { name:'Sao Tome and Principe', currency:'STN', currencySymbol:'Db', region:'Central Africa', population:200000 },
  SN: { name:'Senegal', currency:'XOF', currencySymbol:'CFA', region:'West Africa', population:18100000 },
  SC: { name:'Seychelles', currency:'SCR', currencySymbol:'SR', region:'East Africa', population:100000 },
  SL: { name:'Sierra Leone', currency:'SLE', currencySymbol:'Le', region:'West Africa', population:8600000 },
  SO: { name:'Somalia', currency:'SOS', currencySymbol:'Sh', region:'East Africa', population:18100000 },
  ZA: { name:'South Africa', currency:'ZAR', currencySymbol:'R', region:'Southern Africa', population:60400000 },
  SS: { name:'South Sudan', currency:'SSP', currencySymbol:'SSP', region:'East Africa', population:11100000 },
  SD: { name:'Sudan', currency:'SDG', currencySymbol:'SDG', region:'North Africa', population:46900000 },
  TZ: { name:'Tanzania', currency:'TZS', currencySymbol:'TSh', region:'East Africa', population:65500000 },
  TG: { name:'Togo', currency:'XOF', currencySymbol:'CFA', region:'West Africa', population:9000000 },
  TN: { name:'Tunisia', currency:'TND', currencySymbol:'DT', region:'North Africa', population:12400000 },
  UG: { name:'Uganda', currency:'UGX', currencySymbol:'USh', region:'East Africa', population:48600000 },
  ZM: { name:'Zambia', currency:'ZMW', currencySymbol:'ZK', region:'Southern Africa', population:20600000 },
  ZW: { name:'Zimbabwe', currency:'ZWL', currencySymbol:'Z$', region:'Southern Africa', population:16700000 }
};

function getToolsAvailable(code) {
  var tools = [];
  if (engines.get(code)) tools.push('paye');
  tools.push('vat'); // All countries have VAT data
  tools.push('fx');  // FX available for all
  return tools;
}

function sandboxCountries(code) {
  var entry = {
    code: 'NG',
    name: 'Nigeria Sandbox',
    currency: 'NGN',
    currency_symbol: 'NGN',
    region: 'West Africa',
    population: 230000000,
    tools_available: ['paye', 'vat', 'fx'],
    sandbox: true,
    data_policy: 'deterministic sandbox data'
  };
  if (code) return entry;
  return { countries: [entry], total: 1, sandbox: true, data_policy: 'deterministic sandbox data' };
}

exports.handler = async function(event) {
  CORS['Access-Control-Allow-Origin'] = getAllowedOrigin(event);
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS };
  if (event.httpMethod !== 'GET') return respond(405, { error: 'Method not allowed' });

  /* ---- Auth ---- */
  var auth = await validateApiKey(event, 'countries');
  if (!auth.valid) return respond(auth.status || 401, { error: auth.error });

  var rlHeaders = rateLimitHeaders(auth);
  var params = event.queryStringParameters || {};
  var code = (params.code || '').toUpperCase();

  if (auth.sandbox) {
    return respond(200, sandboxCountries(code), rlHeaders);
  }

  /* ---- Single country ---- */
  if (code) {
    var c = COUNTRIES[code];
    if (!c) {
      return respond(404, { error: 'Country not found', code: 'INVALID_COUNTRY', supported: Object.keys(COUNTRIES).sort() }, rlHeaders);
    }

    return respond(200, {
      code: code,
      name: c.name,
      currency: c.currency,
      currency_symbol: c.currencySymbol,
      region: c.region,
      population: c.population,
      tools_available: getToolsAvailable(code)
    }, rlHeaders);
  }

  /* ---- All countries ---- */
  var list = Object.keys(COUNTRIES).sort().map(function(k) {
    var c = COUNTRIES[k];
    return {
      code: k,
      name: c.name,
      currency: c.currency,
      currency_symbol: c.currencySymbol,
      region: c.region,
      population: c.population,
      tools_available: getToolsAvailable(k)
    };
  });

  return respond(200, { countries: list, total: list.length }, rlHeaders);
};
