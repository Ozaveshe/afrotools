/**
 * AfroTools Admin Status API
 *
 * Consolidated backend/admin health for Mission Control.
 *
 * GET /api/admin-status — protected, requires x-admin-key
 */

const { getAllowedOrigin } = require('./utils/cors');

function getHeader(event, headerName) {
  var headers = event.headers || {};
  var expected = String(headerName || '').toLowerCase();

  for (var key in headers) {
    if (Object.prototype.hasOwnProperty.call(headers, key) && key.toLowerCase() === expected) {
      return headers[key];
    }
  }

  return '';
}

function getAdminSecret() {
  return process.env.ADMIN_KEY || process.env.ADMIN_SECRET || '';
}

function buildCors(event) {
  return {
    'Access-Control-Allow-Origin': getAllowedOrigin(event),
    'Access-Control-Allow-Headers': 'Content-Type, x-admin-key',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
    'Cache-Control': 'private, no-store',
  };
}

function jsonResponse(statusCode, body, headers) {
  return {
    statusCode: statusCode,
    headers: headers,
    body: JSON.stringify(body),
  };
}

function siteBaseUrl(event) {
  var host = getHeader(event, 'x-forwarded-host') || getHeader(event, 'host');
  var proto = getHeader(event, 'x-forwarded-proto') || 'https';
  if (host) return proto + '://' + host;
  return process.env.URL || process.env.DEPLOY_PRIME_URL || 'https://afrotools.com';
}

function formatEndpointPath(path) {
  return path.charAt(0) === '/' ? path : '/' + path;
}

async function fetchJson(url, options) {
  var started = Date.now();

  try {
    var res = await fetch(url, options || {});
    var text = await res.text();
    var data = null;

    try {
      data = text ? JSON.parse(text) : null;
    } catch (parseErr) {
      data = { raw: text || '' };
    }

    return {
      ok: res.ok,
      status: res.status,
      latency_ms: Date.now() - started,
      data: data,
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      latency_ms: Date.now() - started,
      error: err.message,
      data: null,
    };
  }
}

function classifyEndpoint(definition, result) {
  if (definition.expect === 'auth_required') {
    if (result.status === 401 || result.status === 403) {
      return {
        classification: 'protected',
        note: 'Auth required as expected',
      };
    }
    if (result.ok) {
      return {
        classification: 'working',
        note: 'Accessible without key',
      };
    }
    return {
      classification: 'broken',
      note: result.error || ('HTTP ' + result.status),
    };
  }

  if (!result.ok) {
    return {
      classification: 'broken',
      note: result.error || ('HTTP ' + result.status),
    };
  }

  var valid = true;
  if (typeof definition.isValid === 'function') {
    try {
      valid = definition.isValid(result.data);
    } catch (err) {
      valid = false;
    }
  }

  return {
    classification: valid ? 'working' : 'degraded',
    note: valid ? 'Response matched expected shape' : 'Response shape did not match expected payload',
  };
}

function buildFreshnessSummary(freshness) {
  var categories = freshness && freshness.categories ? freshness.categories : {};
  var keys = Object.keys(categories);
  var liveOk = 0;
  var stale = [];
  var offline = [];

  keys.forEach(function(key) {
    var status = categories[key] && categories[key].status;
    if (status === 'live' || status === 'ok') liveOk += 1;
    else if (status === 'stale') stale.push(key);
    else if (status === 'offline') offline.push(key);
  });

  return {
    total_count: keys.length,
    healthy_count: liveOk,
    stale_categories: stale,
    offline_categories: offline,
    overall_health: freshness && freshness.overall_health ? freshness.overall_health : 'offline',
  };
}

function buildScraperSummary(scraperHealth) {
  var scrapers = scraperHealth && Array.isArray(scraperHealth.scrapers) ? scraperHealth.scrapers : [];
  var unhealthy = scrapers.filter(function(scraper) {
    return !scraper.is_healthy;
  }).map(function(scraper) {
    return scraper.scraper_id || scraper.name || 'unknown-scraper';
  });

  return {
    total_count: scraperHealth && typeof scraperHealth.total_count === 'number' ? scraperHealth.total_count : scrapers.length,
    healthy_count: scraperHealth && typeof scraperHealth.healthy_count === 'number' ? scraperHealth.healthy_count : (scrapers.length - unhealthy.length),
    unhealthy_scrapers: unhealthy,
    overall_health: scraperHealth && scraperHealth.overall_health ? scraperHealth.overall_health : 'offline',
  };
}

exports.handler = async function(event) {
  var cors = buildCors(event);

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return jsonResponse(405, { error: 'Method not allowed' }, cors);
  }

  var suppliedKey = getHeader(event, 'x-admin-key');
  var secret = getAdminSecret();

  if (!secret || suppliedKey !== secret) {
    return jsonResponse(401, { error: 'Unauthorized' }, cors);
  }

  var baseUrl = siteBaseUrl(event);
  var adminHeaders = { 'x-admin-key': secret };

  var monitoredEndpoints = [
    {
      id: 'forex',
      name: 'Forex latest',
      path: '/api/forex?base=USD',
      area: 'live-data',
      isValid: function(data) { return !!(data && data.rates && data.rates.NGN); },
    },
    {
      id: 'fuel',
      name: 'Fuel NG',
      path: '/api/fuel?country=NG',
      area: 'live-data',
      isValid: function(data) { return !!(data && data.country && data.country.code === 'NG' && data.country.petrol); },
    },
    {
      id: 'rates',
      name: 'Rates NG',
      path: '/api/rates?country=NG',
      area: 'live-data',
      isValid: function(data) { return !!(data && data.country && data.country.code === 'NG'); },
    },
    {
      id: 'scholarships',
      name: 'Scholarships',
      path: '/api/scholarships?limit=1',
      area: 'content',
      isValid: function(data) { return !!(data && Array.isArray(data.scholarships)); },
    },
    {
      id: 'data-freshness',
      name: 'Data freshness',
      path: '/api/data-freshness',
      area: 'ops',
      isValid: function(data) { return !!(data && data.categories); },
    },
    {
      id: 'alerts-public',
      name: 'Alerts public',
      path: '/api/alerts',
      area: 'ops',
      isValid: function(data) { return !!(data && Array.isArray(data.alerts)); },
    },
    {
      id: 'api-gateway',
      name: 'API gateway',
      path: '/api/v1',
      area: 'dev-api',
      isValid: function(data) {
        return !!(data && data.name === 'AfroData API' && data.version === 'v1' && Array.isArray(data.endpoints));
      },
    },
    {
      id: 'countries-auth',
      name: 'Countries API',
      path: '/api/countries',
      area: 'dev-api',
      expect: 'auth_required',
    },
    {
      id: 'tax-rates-auth',
      name: 'Tax rates API',
      path: '/api/tax-rates?country=NG',
      area: 'dev-api',
      expect: 'auth_required',
    },
    {
      id: 'alerts-admin',
      name: 'Alerts admin',
      path: '/api/alerts?view=admin',
      area: 'admin',
      admin: true,
      isValid: function(data) { return !!(data && Array.isArray(data.alerts) && data.summary); },
    },
    {
      id: 'scraper-health',
      name: 'Scraper health',
      path: '/api/scraper-health',
      area: 'admin',
      admin: true,
      isValid: function(data) { return !!(data && Array.isArray(data.scrapers)); },
    },
    {
      id: 'gazette-review',
      name: 'Gazette review',
      path: '/api/gazette-review',
      area: 'admin',
      admin: true,
      isValid: function(data) { return !!(data && typeof data.gazette_count === 'number' && typeof data.review_count === 'number'); },
    },
  ];

  var endpointResults = await Promise.all(monitoredEndpoints.map(async function(definition) {
    var result = await fetchJson(baseUrl + formatEndpointPath(definition.path), {
      headers: definition.admin ? adminHeaders : {},
    });
    var verdict = classifyEndpoint(definition, result);

    return {
      id: definition.id,
      name: definition.name,
      path: definition.path,
      area: definition.area,
      status_code: result.status,
      latency_ms: result.latency_ms,
      classification: verdict.classification,
      note: verdict.note,
    };
  }));

  var endpointCounts = endpointResults.reduce(function(acc, endpoint) {
    acc[endpoint.classification] = (acc[endpoint.classification] || 0) + 1;
    return acc;
  }, { working: 0, protected: 0, degraded: 0, broken: 0 });

  var sourceResults = await Promise.all([
    fetchJson(baseUrl + '/api/data-freshness'),
    fetchJson(baseUrl + '/api/scraper-health', { headers: adminHeaders }),
    fetchJson(baseUrl + '/api/alerts?view=admin', { headers: adminHeaders }),
    fetchJson(baseUrl + '/api/gazette-review', { headers: adminHeaders }),
  ]);

  var freshness = sourceResults[0].ok ? sourceResults[0].data : null;
  var scraperHealth = sourceResults[1].ok ? sourceResults[1].data : null;
  var alerts = sourceResults[2].ok ? sourceResults[2].data : null;
  var review = sourceResults[3].ok ? sourceResults[3].data : null;

  var freshnessSummary = buildFreshnessSummary(freshness);
  var scraperSummary = buildScraperSummary(scraperHealth);
  var alertSummary = alerts && alerts.summary ? alerts.summary : { active: 0, expired: 0, inactive: 0, total: 0 };
  var reviewSummary = {
    gazette_count: review && typeof review.gazette_count === 'number' ? review.gazette_count : 0,
    review_count: review && typeof review.review_count === 'number' ? review.review_count : 0,
    total_queue: review ? (Number(review.gazette_count || 0) + Number(review.review_count || 0)) : 0,
  };

  var warnings = [];
  freshnessSummary.stale_categories.forEach(function(category) {
    warnings.push(category + ' freshness is stale.');
  });
  freshnessSummary.offline_categories.forEach(function(category) {
    warnings.push(category + ' freshness is offline.');
  });
  scraperSummary.unhealthy_scrapers.forEach(function(scraperId) {
    warnings.push(scraperId + ' scraper is unhealthy.');
  });
  endpointResults.filter(function(endpoint) {
    return endpoint.classification === 'broken' || endpoint.classification === 'degraded';
  }).forEach(function(endpoint) {
    warnings.push(endpoint.name + ' is ' + endpoint.classification + ' (' + endpoint.note + ').');
  });

  var overallHealth = 'healthy';
  if (endpointCounts.broken > 0 || freshnessSummary.offline_categories.length > 0) {
    overallHealth = 'critical';
  } else if (endpointCounts.degraded > 0 || freshnessSummary.stale_categories.length > 0 || scraperSummary.unhealthy_scrapers.length > 0) {
    overallHealth = 'degraded';
  }

  return jsonResponse(200, {
    checked_at: new Date().toISOString(),
    summary: {
      overall_health: overallHealth,
      endpoints: endpointCounts,
      freshness: freshnessSummary,
      scrapers: scraperSummary,
      alerts: alertSummary,
      review: reviewSummary,
    },
    freshness: freshness,
    scraper_health: scraperHealth,
    alerts: alerts,
    review: review,
    endpoint_checks: endpointResults,
    warnings: warnings,
  }, cors);
};
