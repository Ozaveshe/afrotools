var { getAllowedOrigin } = require('./utils/cors');
var { authenticateSalaryPadiServiceKey, serviceRateLimitHeaders } = require('./_shared/salarypadi-service-auth');
var { salaryPadiCatalog, catalogEtag } = require('./_shared/tool-catalog');

function header(event, name) {
  var headers = event.headers || {};
  var wanted = name.toLowerCase();
  var key = Object.keys(headers).find(function (item) { return item.toLowerCase() === wanted; });
  return key ? String(headers[key] || '') : '';
}

function baseHeaders(event, extra) {
  return Object.assign({
    'Access-Control-Allow-Origin': getAllowedOrigin(event),
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key, If-None-Match',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'private, max-age=300, stale-while-revalidate=600',
    'Vary': 'Origin, x-api-key, If-None-Match',
  }, extra || {});
}

function respond(event, statusCode, body, extraHeaders) {
  var headers = Object.assign({}, extraHeaders || {});
  if (statusCode !== 200 && statusCode !== 304 && !headers['Cache-Control']) {
    headers['Cache-Control'] = 'no-store';
  }
  return {
    statusCode: statusCode,
    headers: baseHeaders(event, headers),
    body: body === null ? '' : JSON.stringify(body),
  };
}

function isHealthPath(event) {
  return String(event.path || '').replace(/\/+$/, '').endsWith('/catalog/health');
}

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') return respond(event, 204, null);
  if (event.httpMethod !== 'GET') {
    return respond(event, 405, { error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' }, { Allow: 'GET, OPTIONS' });
  }

  var auth = await authenticateSalaryPadiServiceKey(event, 'catalog:tools');
  if (!auth) {
    return respond(event, 401, { error: 'A valid SalaryPadi service key is required', code: 'INVALID_SERVICE_KEY' });
  }
  if (!auth.valid) {
    var denialCode = auth.status === 429
      ? 'RATE_LIMIT_EXCEEDED'
      : auth.status === 503
        ? 'SERVICE_QUOTA_UNAVAILABLE'
        : 'SERVICE_SCOPE_DENIED';
    return respond(event, auth.status, {
      error: auth.error,
      code: denialCode,
    }, Object.assign(serviceRateLimitHeaders(auth), auth.retryAfter ? { 'Retry-After': String(auth.retryAfter) } : {}));
  }

  var catalog;
  try {
    catalog = salaryPadiCatalog();
  } catch (_) {
    return respond(event, 503, { error: 'Tool catalog metadata failed validation', code: 'CATALOG_INVALID' }, serviceRateLimitHeaders(auth));
  }

  if (isHealthPath(event)) {
    return respond(event, 200, {
      status: 'operational',
      schemaVersion: catalog.schemaVersion,
      product: catalog.product,
      category: catalog.category,
      publishedToolCount: catalog.count,
      lastVerified: catalog.lastVerified,
    }, serviceRateLimitHeaders(auth));
  }

  var params = event.queryStringParameters || {};
  if (params.product !== 'salarypadi' || params.category !== 'career') {
    return respond(event, 400, {
      error: 'Supported query: product=salarypadi&category=career',
      code: 'UNSUPPORTED_CATALOG_QUERY',
    }, serviceRateLimitHeaders(auth));
  }

  var etag = catalogEtag(catalog);
  var responseHeaders = Object.assign({ ETag: etag }, serviceRateLimitHeaders(auth));
  if (header(event, 'if-none-match') === etag) return respond(event, 304, null, responseHeaders);
  return respond(event, 200, catalog, responseHeaders);
};
