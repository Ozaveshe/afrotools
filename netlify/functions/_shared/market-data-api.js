const { validateApiKey } = require('./api-auth');
const { getAllowedOrigin } = require('../utils/cors');
const { SUPABASE_URL, SUPABASE_KEY, cleanText } = require('./market-data');

function jsonResponse(statusCode, body, headers) {
  return {
    statusCode,
    headers,
    body: JSON.stringify(body)
  };
}

function buildHeaders(event) {
  return {
    'Access-Control-Allow-Origin': getAllowedOrigin(event),
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
    'Vary': 'Origin'
  };
}

function appendFilter(filters, field, value, operator) {
  if (!value && value !== 0) return;
  filters.push(field + '=' + (operator || 'eq') + '.' + encodeURIComponent(String(value)));
}

async function queryRows(path) {
  const response = await fetch(SUPABASE_URL + '/rest/v1/' + path, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: 'Bearer ' + SUPABASE_KEY
    }
  });
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return [];
  }
}

async function handleMarketDataRequest(event, config) {
  const headers = buildHeaders(event);
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'GET') return jsonResponse(405, { error: 'Method not allowed' }, headers);

  const auth = await validateApiKey(event, config.authScope || config.endpoint);
  if (auth.error) {
    return jsonResponse(auth.status || 401, { error: auth.error }, headers);
  }

  const params = event.queryStringParameters || {};
  const filters = [].concat(config.baseFilters || []);
  const limit = Math.min(parseInt(params.limit, 10) || config.defaultLimit || 50, config.maxLimit || 100);
  const order = config.order || 'observed_at.desc';
  const freshnessField = config.freshnessField || 'expires_at';
  const requireFresh = config.requireFresh !== false;

  const country = cleanText(params.country || params.country_code);
  const city = cleanText(params.city);
  const provider = cleanText(params.provider);

  if (country) appendFilter(filters, config.countryField || 'country_code', country.toUpperCase());
  if (city) appendFilter(filters, config.cityField || 'city', city);
  if (provider && config.providerField) appendFilter(filters, config.providerField, provider);

  if (requireFresh && freshnessField) {
    filters.push('or=(' + freshnessField + '.is.null,' + freshnessField + '.gte.' + encodeURIComponent(new Date().toISOString()) + ')');
  }

  if (typeof config.extendFilters === 'function') {
    config.extendFilters(filters, params, appendFilter);
  }

  const path = [
    config.table + '?select=' + encodeURIComponent(config.select || '*'),
    ...filters,
    'order=' + encodeURIComponent(order),
    'limit=' + limit
  ].join('&');

  const rows = await queryRows(path);
  const data = Array.isArray(rows) ? rows : [];

  return jsonResponse(200, {
    ok: true,
    count: data.length,
    filters: {
      country: country || null,
      city: city || null,
      provider: provider || null
    },
    summary: typeof config.summarize === 'function' ? config.summarize(data, params) : null,
    [config.responseKey || 'rows']: typeof config.mapRows === 'function' ? config.mapRows(data) : data
  }, {
    ...headers,
    'Cache-Control': 'public, max-age=300, s-maxage=900, stale-while-revalidate=1800'
  });
}

module.exports = {
  handleMarketDataRequest,
  buildHeaders,
  jsonResponse,
  queryRows
};
