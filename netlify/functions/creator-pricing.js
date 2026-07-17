// netlify/functions/creator-pricing.js
// Market data API for CreatorPricing tool
// GET /rates - returns rate data + comparisons
// POST /quote - deterministic quote planning response

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

  if (event.httpMethod === 'GET' && (!path || path === '/rates')) {
    const { craft, specialty, country, city, experience } = params;

    if (!craft || !country) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required parameters: craft, country' })
      };
    }

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

  if (event.httpMethod === 'POST' && path === '/quote') {
    let body;
    try {
      body = JSON.parse(event.body);
    } catch {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON body' }) };
    }

    const { craft, specialty, projectDescription, country, city, currency, budget, timeline } = body;
    if (!projectDescription) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing projectDescription' }) };
    }

    const text = String(projectDescription || '').trim();
    const complexity =
      text.length > 900 || /\b(strategy|campaign|retainer|multi[-\s]?platform|launch|brand system|ecommerce|motion|video)\b/i.test(text)
        ? 'high'
        : text.length > 320 || /\b(package|series|monthly|website|shoot|editing|design|copy)\b/i.test(text)
          ? 'medium'
          : 'low';
    const timelineRisk = /\b(urgent|today|tomorrow|24h|48h|same day|rush)\b/i.test(`${text} ${timeline || ''}`);
    const revisions = complexity === 'high' ? 3 : complexity === 'medium' ? 2 : 1;
    const depositPercent = timelineRisk ? 70 : complexity === 'high' ? 60 : 50;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        craft: craft || null,
        specialty: specialty || 'General',
        country: country || null,
        city: city || null,
        currency: currency || null,
        budget: budget || null,
        timeline: timeline || null,
        quoteType: 'deterministic',
        complexity,
        depositPercent,
        recommendedRevisions: revisions,
        lineItems: [
          { label: 'Discovery and brief review', weight: complexity === 'high' ? 15 : 10 },
          { label: 'Production and delivery', weight: complexity === 'high' ? 55 : 65 },
          { label: 'Revisions and handover', weight: complexity === 'high' ? 20 : 15 },
          { label: 'Admin, payment, and contingency', weight: 10 }
        ],
        notes: [
          timelineRisk ? 'Rush timing detected. Add a rush fee or increase the upfront deposit.' : 'Timeline appears standard. Keep delivery milestones clear.',
          'Confirm usage rights, file formats, payment schedule, and number of revision rounds before work starts.',
          'Use the client-side pricing engine for country and craft rate estimates, then attach this scope breakdown to the quote.'
        ],
        projectDescription
      })
    };
  }

  return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) };
};
