/**
 * Shared CORS utility for Netlify functions
 * Restricts Access-Control-Allow-Origin to known AfroTools domains.
 *
 * Usage:
 *   const { corsHeaders, corsResponse } = require('./utils/cors');
 *   // In handler:
 *   const headers = corsHeaders(event);
 *   if (event.httpMethod === 'OPTIONS') return corsResponse(event);
 */

const ALLOWED_ORIGINS = [
  'https://afrotools.com',
  'https://www.afrotools.com',
];

// Also allow Netlify deploy previews and branch deploys
const ALLOWED_PATTERNS = [
  /^https:\/\/[a-z0-9-]+--afrotools\.netlify\.app$/,
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
];

function getAllowedOrigin(event) {
  var origin = (event.headers || {}).origin || (event.headers || {}).Origin || '';

  if (ALLOWED_ORIGINS.includes(origin)) return origin;

  for (var i = 0; i < ALLOWED_PATTERNS.length; i++) {
    if (ALLOWED_PATTERNS[i].test(origin)) return origin;
  }

  // Fallback: allow same-site requests (no origin header = not cross-origin)
  if (!origin) return 'https://afrotools.com';

  // Deny unknown origins by returning the canonical domain
  return 'https://afrotools.com';
}

function corsHeaders(event, extra) {
  var allowed = getAllowedOrigin(event);
  var base = {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key, x-admin-key, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
    'Content-Type': 'application/json',
  };
  if (extra) {
    Object.keys(extra).forEach(function(k) { base[k] = extra[k]; });
  }
  return base;
}

function corsResponse(event) {
  return {
    statusCode: 204,
    headers: corsHeaders(event),
    body: '',
  };
}

module.exports = { corsHeaders, corsResponse, getAllowedOrigin, ALLOWED_ORIGINS };
