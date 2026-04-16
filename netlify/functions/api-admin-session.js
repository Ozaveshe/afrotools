/**
 * AfroTools Admin Session API
 *
 * Validates the shared admin key used by Mission Control and admin sub-pages.
 *
 * GET  /api/admin-session  — validate x-admin-key header if present
 * POST /api/admin-session  — validate x-admin-key header or { adminKey }
 */

const { getAllowedOrigin } = require('./utils/cors');

function corsHeaders(event) {
  return {
    'Access-Control-Allow-Origin': getAllowedOrigin(event),
    'Access-Control-Allow-Headers': 'Content-Type, x-admin-key',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

exports.handler = async function(event) {
  var headers = corsHeaders(event);

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: headers, body: '' };
  }

  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' }, headers);
  }

  var secret = getAdminSecret();
  if (!secret) {
    return jsonResponse(500, { error: 'Admin secret not configured' }, headers);
  }

  var suppliedKey = getHeader(event, 'x-admin-key');

  if (!suppliedKey && event.httpMethod === 'POST' && event.body) {
    try {
      var body = JSON.parse(event.body);
      if (body && typeof body.adminKey === 'string') {
        suppliedKey = body.adminKey.trim();
      }
    } catch (err) {
      return jsonResponse(400, { error: 'Invalid JSON body' }, headers);
    }
  }

  if (!suppliedKey) {
    return jsonResponse(200, {
      authenticated: false,
      storage_key: 'admin_key',
      requires: 'x-admin-key',
      checked_at: new Date().toISOString(),
    }, headers);
  }

  if (suppliedKey !== secret) {
    return jsonResponse(401, {
      authenticated: false,
      error: 'Invalid admin key',
      checked_at: new Date().toISOString(),
    }, headers);
  }

  return jsonResponse(200, {
    authenticated: true,
    storage_key: 'admin_key',
    admin_surfaces: [
      '/mc-7a2f9x.html',
      '/admin/alerts.html',
      '/admin/review.html',
      '/tools/afrostream/admin.html',
    ],
    checked_at: new Date().toISOString(),
  }, headers);
};
