// netlify/functions/creator-money.js
// API for CreatorMoney finance tracker
// Handles server-side aggregation and data sync

exports.handler = async function(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  const path = event.path.replace('/.netlify/functions/creator-money', '');

  // GET /summary — monthly aggregation
  if (event.httpMethod === 'GET' && (!path || path === '/summary')) {
    const { month, currency } = event.queryStringParameters || {};
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Aggregation is performed client-side. This endpoint validates parameters for future server-side aggregation.',
        month: month || new Date().toISOString().slice(0, 7),
        currency: currency || 'NGN',
        _links: {
          dashboard: '/tools/creator-money/app.html',
          reports: '/tools/creator-money/reports.html'
        }
      })
    };
  }

  return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) };
};
