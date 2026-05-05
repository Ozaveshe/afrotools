/**
 * AfroTools — Public AfroData API v1
 * Unified router for all live data endpoints.
 *
 * Routes:
 *   GET /api/v1/forex?base=NGN&target=KES
 *   GET /api/v1/fuel?country=NG
 *   GET /api/v1/commodities?id=gold
 *   GET /api/v1/electricity?country=KE
 *   GET /api/v1/telecom?country=GH&provider=MTN
 *   GET /api/v1/health                         — data freshness summary
 *
 * Auth: x-api-key header. Free tier: 100 req/day. Paid API tiers are
 * manually activated as Growth, Pro, or Enterprise/custom plans.
 *
 * This is the public-facing API for third-party developers.
 * Individual endpoints (api-fuel.js, api-forex.js) continue to work
 * for internal tool pages.
 */

const { getOrFetch } = require('./_lib/cache');
const { getData } = require('./_shared/data-store');
const { validateApiKey } = require('./_shared/api-auth');

function jsonResp(statusCode, body, hdrs) {
  return { statusCode: statusCode, headers: hdrs, body: JSON.stringify(body) };
}

exports.handler = async function(event) {
  var CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=300, s-maxage=600',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }
  if (event.httpMethod !== 'GET') {
    return jsonResp(405, { error: 'Method not allowed' }, CORS);
  }

  // Parse route from path (needed for auth scope check)
  var path = String(event.path || '')
    .replace(/^\/\.netlify\/functions\/api-v1\/?/, '')
    .replace(/^\/?api\/v1\/?/, '')
    .replace(/^\/+/, '');
  var params = event.queryStringParameters || {};

  // Auth — uses api-auth module with Supabase key validation + tier enforcement
  var endpoint = path || 'health';
  var auth = await validateApiKey(event, endpoint);
  if (auth.error) {
    return jsonResp(auth.status, {
      error: auth.error,
      docs: 'https://afrotools.com/api/docs',
    }, CORS);
  }

  var hasValidKey = auth.tier !== 'free';

  // Route to handler
  switch (path) {
    case 'forex':
      return handleForex(params, CORS);
    case 'fuel':
      return handleFuel(params, CORS);
    case 'commodities':
      return handleCommodities(params, CORS);
    case 'electricity':
      return handleElectricity(params, CORS);
    case 'telecom':
      return handleTelecom(params, CORS);
    case 'insurance':
      return handleGeneric('insurance-rates-latest', 'countries', params, CORS);
    case 'property':
      return handleGeneric('property-prices-latest', 'countries', params, CORS);
    case 'salaries':
      return handleGeneric('salary-benchmarks-latest', 'countries', params, CORS);
    case 'stocks':
      return handleStocks(params, CORS);
    case 'shipping':
      return handleShipping(params, CORS);
    case 'rates':
      return handleGeneric('rates-latest', 'countries', params, CORS);
    case 'agriculture':
      return handleGeneric('agri-inputs-latest', 'countries', params, CORS);
    case 'crypto':
      return handleCrypto(params, CORS);
    case 'health':
      return handleHealth(CORS);
    case '':
      return jsonResp(200, {
        name: 'AfroData API',
        version: 'v1',
        endpoints: [
          '/api/v1/forex', '/api/v1/fuel', '/api/v1/commodities',
          '/api/v1/electricity', '/api/v1/telecom', '/api/v1/insurance',
          '/api/v1/property', '/api/v1/salaries', '/api/v1/stocks',
          '/api/v1/shipping', '/api/v1/rates', '/api/v1/agriculture',
          '/api/v1/crypto', '/api/v1/health',
        ],
        docs: 'https://afrotools.com/api/docs',
        rate_limit: hasValidKey ? (auth.daily_limit === -1 ? 'custom' : auth.daily_limit + '/day') : '100/day',
      }, CORS);
    default:
      return jsonResp(404, { error: 'Unknown endpoint: ' + path }, CORS);
  }
};

async function handleForex(params, CORS) {
  var { data } = await getOrFetch('forex-latest', 60000);
  if (!data) return jsonResp(503, { error: 'Forex data unavailable' }, CORS);

  var result = { timestamp: data.timestamp, base: data.base || 'USD' };
  var defaultBase = String(data.base || 'USD').toUpperCase();

  if (params.base && params.target) {
    var baseCode = params.base.toUpperCase();
    var targetCode = params.target.toUpperCase();
    var baseRate = baseCode === defaultBase ? 1 : data.rates[baseCode];
    var targetRate = targetCode === defaultBase ? 1 : data.rates[targetCode];
    if (!baseRate || !targetRate) return jsonResp(404, { error: 'Currency not found' }, CORS);
    result.pair = baseCode + '/' + targetCode;
    result.rate = Math.round((targetRate / baseRate) * 1000000) / 1000000;
  } else if (params.base) {
    var base = params.base.toUpperCase();
    var baseR = base === defaultBase ? 1 : data.rates[base];
    if (!baseR) return jsonResp(404, { error: 'Currency not found: ' + base }, CORS);
    var rates = {};
    Object.keys(data.rates).forEach(function(code) {
      rates[code] = Math.round((data.rates[code] / baseR) * 1000000) / 1000000;
    });
    if (base === defaultBase) rates[defaultBase] = 1;
    result.rates = rates;
  } else {
    result.rates = data.rates;
  }

  return jsonResp(200, result, CORS);
}

async function handleFuel(params, CORS) {
  var { data } = await getOrFetch('fuel-latest', 300000);
  if (!data) return jsonResp(503, { error: 'Fuel data unavailable' }, CORS);

  var countries = data.countries || [];

  if (params.country) {
    countries = countries.filter(function(c) { return c.code === params.country.toUpperCase(); });
    if (!countries.length) return jsonResp(404, { error: 'Country not found' }, CORS);
  }
  if (params.region) {
    countries = countries.filter(function(c) { return c.region === params.region.toLowerCase(); });
  }

  return jsonResp(200, { timestamp: data.timestamp, countries: countries, count: countries.length }, CORS);
}

async function handleCommodities(params, CORS) {
  var { data } = await getOrFetch('commodity-prices-latest', 300000);
  if (!data) return jsonResp(503, { error: 'Commodity data unavailable' }, CORS);

  var commodities = data.commodities || [];

  if (params.id) {
    commodities = commodities.filter(function(c) { return c.id === params.id; });
    if (!commodities.length) return jsonResp(404, { error: 'Commodity not found' }, CORS);
  }
  if (params.category) {
    commodities = commodities.filter(function(c) { return c.category === params.category; });
  }

  return jsonResp(200, { timestamp: data.timestamp, commodities: commodities, count: commodities.length }, CORS);
}

async function handleElectricity(params, CORS) {
  var { data } = await getOrFetch('electricity-latest', 600000);
  if (!data) return jsonResp(503, { error: 'Electricity data unavailable' }, CORS);

  var countries = data.countries || [];

  if (params.country) {
    countries = countries.filter(function(c) { return c.code === params.country.toUpperCase(); });
    if (!countries.length) return jsonResp(404, { error: 'Country not found' }, CORS);
  }
  if (params.region) {
    countries = countries.filter(function(c) { return c.region === params.region.toLowerCase(); });
  }

  return jsonResp(200, { timestamp: data.timestamp, countries: countries, count: countries.length }, CORS);
}

async function handleTelecom(params, CORS) {
  var { data } = await getOrFetch('telecom-latest', 300000);
  if (!data) return jsonResp(503, { error: 'Telecom data unavailable' }, CORS);

  var countries = data.countries || [];

  if (params.country) {
    countries = countries.filter(function(c) { return c.code === params.country.toUpperCase(); });
    if (!countries.length) return jsonResp(404, { error: 'Country not found' }, CORS);
  }
  if (params.provider) {
    var prov = params.provider.toLowerCase();
    countries = countries.filter(function(c) {
      return (c.providers || []).some(function(p) { return p.name.toLowerCase().includes(prov); });
    });
  }

  return jsonResp(200, { timestamp: data.timestamp, countries: countries, count: countries.length }, CORS);
}

async function handleHealth(CORS) {
  var meta = await getData('meta') || {};
  var now = Date.now();
  var categories = {};

  ['forex', 'fuel', 'commodities', 'electricity', 'telecom', 'insurance', 'property', 'salaries', 'stocks', 'shipping', 'rates', 'agriculture', 'crypto', 'gazette'].forEach(function(cat) {
    var m = meta[cat] || {};
    var age = m.last_fetch ? Math.round((now - new Date(m.last_fetch).getTime()) / 60000) : null;
    categories[cat] = {
      status: m.status || 'unknown',
      last_updated: m.last_fetch || null,
      age_minutes: age,
      source: m.source || null,
    };
  });

  return jsonResp(200, { status: 'operational', categories: categories, checked_at: new Date().toISOString() }, CORS);
}

// Generic handler for country-based datasets (insurance, property, salaries)
async function handleGeneric(blobKey, arrayField, params, CORS) {
  var { data } = await getOrFetch(blobKey, 600000);
  if (!data) return jsonResp(503, { error: 'Data temporarily unavailable' }, CORS);

  var items = data[arrayField] || data.countries || [];

  if (params.country) {
    items = items.filter(function(c) { return c.code === params.country.toUpperCase(); });
    if (!items.length) return jsonResp(404, { error: 'Country not found' }, CORS);
  }
  if (params.region) {
    items = items.filter(function(c) { return c.region === (params.region || '').toLowerCase(); });
  }

  return jsonResp(200, { timestamp: data.timestamp, data: items, count: items.length }, CORS);
}

async function handleStocks(params, CORS) {
  var { data } = await getOrFetch('stock-indices-latest', 60000);
  if (!data) return jsonResp(503, { error: 'Stock data unavailable' }, CORS);

  var indices = data.indices || [];

  if (params.exchange) {
    indices = indices.filter(function(i) { return i.exchange === params.exchange.toUpperCase(); });
    if (!indices.length) return jsonResp(404, { error: 'Exchange not found' }, CORS);
  }
  if (params.country) {
    indices = indices.filter(function(i) { return i.country === params.country.toUpperCase(); });
  }

  return jsonResp(200, { timestamp: data.timestamp, indices: indices, count: indices.length }, CORS);
}

async function handleShipping(params, CORS) {
  var { data } = await getOrFetch('shipping-rates-latest', 300000);
  if (!data) return jsonResp(503, { error: 'Shipping data unavailable' }, CORS);

  var result = { timestamp: data.timestamp };

  if (params.port) {
    var ports = (data.ports || []).filter(function(p) {
      return p.id === params.port.toLowerCase() || p.country === params.port.toUpperCase();
    });
    result.ports = ports;
    result.count = ports.length;
  } else if (params.route_to) {
    var routes = (data.routes || []).filter(function(r) {
      return r.destination_port === params.route_to.toLowerCase() ||
        r.destination_country === params.route_to.toUpperCase();
    });
    if (params.route_from) {
      routes = routes.filter(function(r) { return r.origin.toLowerCase() === params.route_from.toLowerCase(); });
    }
    result.routes = routes;
    result.count = routes.length;
  } else {
    result.ports = data.ports || [];
    result.routes = data.routes || [];
    result.port_count = (data.ports || []).length;
    result.route_count = (data.routes || []).length;
  }

  return jsonResp(200, result, CORS);
}

async function handleCrypto(params, CORS) {
  var { data } = await getOrFetch('crypto-latest', 60000);
  if (!data) return jsonResp(503, { error: 'Crypto data unavailable' }, CORS);

  var coins = data.coins || [];

  if (params.id) {
    coins = coins.filter(function(c) { return c.id === params.id; });
    if (!coins.length) return jsonResp(404, { error: 'Coin not found' }, CORS);
  }

  return jsonResp(200, { timestamp: data.timestamp, coins: coins, count: coins.length }, CORS);
}
