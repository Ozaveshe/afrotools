// netlify/functions/creator-split.js
// API for CreatorSplit royalty & collaboration splitter
// Handles server-side split management and sharing

exports.handler = async function(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  const path = event.path.replace('/.netlify/functions/creator-split', '');

  // GET /summary — split overview
  if (event.httpMethod === 'GET' && (!path || path === '/summary')) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Split management is performed client-side. This endpoint validates parameters for future server-side features.',
        _links: {
          dashboard: '/tools/creator-split/app.html',
          create: '/tools/creator-split/create.html'
        }
      })
    };
  }

  return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) };
};
