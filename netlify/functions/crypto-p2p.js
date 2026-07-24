/**
 * Retired P2P rate endpoint.
 *
 * AfroTools no longer republishes third-party P2P advertisements as comparable
 * rates because amount, payment method, limits, merchant state and executable
 * availability cannot be verified consistently. Keep this stable 410 response
 * so existing clients fail closed without contacting an upstream provider.
 */
const { getAllowedOrigin } = require('./utils/cors');

function response(event) {
  return {
    statusCode: 410,
    headers: {
      'Access-Control-Allow-Origin': getAllowedOrigin(event),
      'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
    },
    body: JSON.stringify({
      error: 'p2p_rate_endpoint_retired',
      status: 'retired',
      message: 'AfroTools no longer publishes aggregated P2P rates. Compare executable quotes you obtain directly using the local worksheet.',
      replacement: '/crypto/p2p-rates/',
    }),
  };
}

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    const retired = response(event);
    return { statusCode: 204, headers: retired.headers, body: '' };
  }
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: response(event).headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }
  return response(event);
};
