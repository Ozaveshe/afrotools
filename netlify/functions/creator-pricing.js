// netlify/functions/creator-pricing.js
// Market data API for CreatorPricing tool
// GET /rates — returns rate data + comparisons
// POST /quote — AI-generated quote breakdown

exports.handler = async function(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  const path = event.path.replace('/.netlify/functions/creator-pricing', '');
  const params = event.queryStringParameters || {};

  // GET /rates
  if (event.httpMethod === 'GET' && (!path || path === '/rates')) {
    const { craft, specialty, country, city, experience } = params;

    if (!craft || !country) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required parameters: craft, country' })
      };
    }

    // Return rate data structure (client-side engine does the actual calculation,
    // but this endpoint can serve cached/pre-computed data for SEO & sharing)
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        craft,
        specialty: specialty || 'General',
        country,
        city: city || null,
        experience: experience || 'established',
        source: 'engine',
        message: 'Rate calculation is performed client-side via creator-pricing-engine.js. This endpoint validates parameters and can serve pre-computed data for link previews.',
        _links: {
          calculator: '/tools/creator-pricing/app.html',
          quoter: '/tools/creator-pricing/quote.html'
        }
      })
    };
  }

  // POST /quote — proxy to AI advisor for quote generation
  if (event.httpMethod === 'POST' && path === '/quote') {
    let body;
    try {
      body = JSON.parse(event.body);
    } catch {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON body' }) };
    }

    const { craft, specialty, projectDescription, country, city } = body;
    if (!projectDescription) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing projectDescription' }) };
    }

    // Forward to ai-advisor function
    // In production, this would call the Anthropic API directly
    // For now, return a structured response indicating the client should use ai-advisor
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Use /.netlify/functions/ai-advisor with tool="creator-pricing" for AI quote generation.',
        craft,
        specialty,
        country,
        city,
        projectDescription
      })
    };
  }

  return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) };
};
