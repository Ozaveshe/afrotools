/**
 * AfroTools — Scraper Health Dashboard API
 * Returns health status of all scrapers from the scraper_health view.
 *
 * GET /api/scraper-health                — full health summary
 * GET /api/scraper-health?id=fuel-prices — single scraper
 *
 * Protected: requires x-admin-key header.
 */

const { getAllowedOrigin } = require('./utils/cors');

var SUPABASE_URL = process.env.SUPABASE_DATA_URL || process.env.SUPABASE_URL || 'https://zpclagtgczsygrgztlts.supabase.co';

function getHeader(event, headerName) {
  var headers = event.headers || {};
  var expected = headerName.toLowerCase();

  for (var key in headers) {
    if (Object.prototype.hasOwnProperty.call(headers, key) && key.toLowerCase() === expected) {
      return headers[key];
    }
  }

  return '';
}

exports.handler = async function(event) {
  var origin = getAllowedOrigin(event);
  var CORS = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'Content-Type, x-admin-key',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }

  // Admin-only endpoint
  var adminKey = getHeader(event, 'x-admin-key');
  if (!adminKey || adminKey !== (process.env.ADMIN_KEY || process.env.ADMIN_SECRET)) {
    return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  var serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_DATA_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!serviceKey) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'Service key not configured' }) };
  }

  var params = event.queryStringParameters || {};

  // Query the scraper_health view
  var url = SUPABASE_URL + '/rest/v1/scraper_health?select=*';
  if (params.id) {
    url += '&scraper_id=eq.' + encodeURIComponent(params.id);
  }
  url += '&order=last_run_at.desc';

  try {
    var res = await fetch(url, {
      headers: {
        'apikey': serviceKey,
        'Authorization': 'Bearer ' + serviceKey,
      },
    });

    if (!res.ok) {
      var errText = await res.text();
      return { statusCode: res.status, headers: CORS, body: JSON.stringify({ error: errText }) };
    }

    var scrapers = await res.json();

    // Calculate overall health
    var healthyCount = scrapers.filter(function(s) { return s.is_healthy; }).length;
    var overallHealth = 'healthy';
    if (healthyCount < scrapers.length * 0.5) overallHealth = 'critical';
    else if (healthyCount < scrapers.length) overallHealth = 'degraded';

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({
        overall_health: overallHealth,
        healthy_count: healthyCount,
        total_count: scrapers.length,
        scrapers: scrapers,
        checked_at: new Date().toISOString(),
      }),
    };
  } catch (err) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) };
  }
};
