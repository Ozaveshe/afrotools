const { getAllowedOrigin } = require('./utils/cors');

function headers(event) {
  return {
    'Access-Control-Allow-Origin': getAllowedOrigin(event),
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
  };
}

exports.handler = async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: headers(event), body: '' };
  }
  return {
    statusCode: 410,
    headers: headers(event),
    body: JSON.stringify({
      status: 'retired',
      error: 'crypto_advisor_retired',
      message: 'The portfolio advisor is retired. The local worksheet does not recommend assets or allocations.',
      route: '/crypto/portfolio/',
    }),
  };
};
