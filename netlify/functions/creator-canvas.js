// netlify/functions/creator-canvas.js
// Supabase CRUD for CreatorCanvas — designs, templates, brand kits
// Uses the Auth/Profiles Supabase instance

const SUPABASE_URL = process.env.SUPABASE_AUTH_URL || 'https://zpclagtgczsygrgztlts.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_AUTH_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY || '';

function getCorsHeaders(event) {
  const origin = event.headers?.origin || '';
  const isAllowed =
    origin === 'https://afrotools.com' ||
    origin === 'https://www.afrotools.com' ||
    origin.endsWith('.netlify.app') ||
    origin.startsWith('http://localhost') ||
    origin.startsWith('http://127.0.0.1');
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : 'https://afrotools.com',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json',
    'Vary': 'Origin'
  };
}

exports.handler = async function(event) {
  const headers = getCorsHeaders(event);
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };

  if (!SUPABASE_KEY) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'SUPABASE_KEY not configured' }) };
  }

  const params = event.queryStringParameters || {};
  const action = params.action || 'list';

  try {
    // List designs for a user
    if (action === 'list' && params.user_id) {
      let url = `/rest/v1/creator_designs?user_id=eq.${params.user_id}&select=id,name,format,width,height,thumbnail_url,updated_at&order=updated_at.desc`;
      if (params.limit) url += `&limit=${parseInt(params.limit, 10) || 50}`;

      const res = await supaFetch(url);
      const data = await res.json();
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    }

    // Get single design with full canvas_data
    if (action === 'get' && params.id) {
      const res = await supaFetch(`/rest/v1/creator_designs?id=eq.${params.id}&select=*&limit=1`);
      const designs = await res.json();
      if (!designs.length) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Design not found' }) };
      return { statusCode: 200, headers, body: JSON.stringify(designs[0]) };
    }

    // Save design (upsert)
    if (action === 'save' && event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      if (!body.user_id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'user_id required' }) };

      const record = {
        user_id: body.user_id,
        name: body.name || 'Untitled Design',
        format: body.format || 'custom',
        width: body.width || 1080,
        height: body.height || 1080,
        canvas_data: body.canvas_data || {},
        thumbnail_url: body.thumbnail_url || null,
        updated_at: new Date().toISOString()
      };

      let method, url;
      if (body.id) {
        // Update existing
        method = 'PATCH';
        url = `/rest/v1/creator_designs?id=eq.${body.id}&user_id=eq.${body.user_id}`;
      } else {
        // Insert new
        method = 'POST';
        url = '/rest/v1/creator_designs';
        record.created_at = new Date().toISOString();
      }

      const res = await supaFetch(url, {
        method,
        body: JSON.stringify(record),
        returnRep: method === 'POST'
      });

      if (method === 'POST') {
        const data = await res.json();
        return { statusCode: 201, headers, body: JSON.stringify(Array.isArray(data) ? data[0] : data) };
      }
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    // Delete design
    if (action === 'delete' && params.id && params.user_id) {
      await supaFetch(`/rest/v1/creator_designs?id=eq.${params.id}&user_id=eq.${params.user_id}`, { method: 'DELETE' });
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    // Get brand kit
    if (action === 'brand' && params.user_id) {
      const res = await supaFetch(`/rest/v1/creator_brand_kits?user_id=eq.${params.user_id}&select=*&limit=1`);
      const kits = await res.json();
      return { statusCode: 200, headers, body: JSON.stringify(kits[0] || null) };
    }

    // Save brand kit (upsert)
    if (action === 'save-brand' && event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      if (!body.user_id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'user_id required' }) };

      const record = {
        user_id: body.user_id,
        colors: body.colors || [],
        primary_font: body.primary_font || 'DM Sans',
        secondary_font: body.secondary_font || 'Instrument Serif',
        logo_light_url: body.logo_light_url || null,
        logo_dark_url: body.logo_dark_url || null,
        updated_at: new Date().toISOString()
      };

      // Check if exists
      const existing = await supaFetch(`/rest/v1/creator_brand_kits?user_id=eq.${body.user_id}&select=id&limit=1`);
      const kits = await existing.json();

      if (kits.length) {
        await supaFetch(`/rest/v1/creator_brand_kits?id=eq.${kits[0].id}`, {
          method: 'PATCH',
          body: JSON.stringify(record)
        });
      } else {
        record.created_at = new Date().toISOString();
        await supaFetch('/rest/v1/creator_brand_kits', {
          method: 'POST',
          body: JSON.stringify(record)
        });
      }
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    // Dashboard stats
    if (action === 'stats' && params.user_id) {
      const res = await supaFetch(`/rest/v1/creator_designs?user_id=eq.${params.user_id}&select=id,format,updated_at`);
      const designs = await res.json();

      const formatCounts = {};
      designs.forEach(function(d) {
        formatCounts[d.format] = (formatCounts[d.format] || 0) + 1;
      });

      return {
        statusCode: 200, headers,
        body: JSON.stringify({ totalDesigns: designs.length, formatCounts })
      };
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid action. Use: list, get, save, delete, brand, save-brand, stats' }) };

  } catch(err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};

function supaFetch(path, options = {}) {
  const url = SUPABASE_URL + path;
  const fetchHeaders = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json'
  };
  if (options.method === 'PATCH') fetchHeaders.Prefer = 'return=minimal';
  if (options.returnRep) fetchHeaders.Prefer = 'return=representation';

  return fetch(url, {
    method: options.method || 'GET',
    headers: fetchHeaders,
    body: options.body || undefined
  });
}
