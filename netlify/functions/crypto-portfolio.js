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
      error: 'cloud_portfolio_retired',
      message: 'Cloud portfolio storage is retired. Holdings are now kept only in the user’s browser.',
      route: '/crypto/portfolio/',
    }),
  };
};
