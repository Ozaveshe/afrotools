/**
 * CreatorPage — Netlify Function
 * CRUD for creator_pages, creator_page_blocks, creator_page_products, creator_page_analytics
 */

const SUPABASE_URL = process.env.SUPABASE_AUTH_URL || 'https://zpclagtgczsygrgztlts.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY_AUTH || '';

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
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Content-Type': 'application/json',
    'Vary': 'Origin'
  };
}

function sbFetch(path, opts) {
  opts = opts || {};
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: opts.method || 'GET',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: opts.prefer || 'return=representation',
      ...opts.headers
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });
}

exports.handler = async function (event) {
  const headers = getCorsHeaders(event);
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (!SUPABASE_KEY) return { statusCode: 500, headers, body: JSON.stringify({ error: 'SUPABASE_KEY not configured' }) };

  const params = event.queryStringParameters || {};
  const action = params.action || (event.httpMethod === 'POST' ? 'post-action' : 'list');

  try {
    // ── GET: Fetch page by ID, username, or share_token ──
    if (action === 'get-page' && params.id) {
      const id = params.id;
      // Try username first, then share_token, then UUID
      let filter = /^[a-zA-Z0-9_-]+$/.test(id) && id.length < 40
        ? `username=eq.${id}`
        : `id=eq.${id}`;

      let res = await sbFetch(`creator_pages?${filter}&select=*&limit=1`);
      let pages = await res.json();

      if (!pages.length && id.length < 40) {
        res = await sbFetch(`creator_pages?share_token=eq.${id}&select=*&limit=1`);
        pages = await res.json();
      }

      if (!pages.length) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Page not found' }) };

      const page = pages[0];

      // Fetch blocks and products in parallel
      const [blocksRes, productsRes] = await Promise.all([
        sbFetch(`creator_page_blocks?page_id=eq.${page.id}&select=*&order=sort_order.asc`),
        sbFetch(`creator_page_products?page_id=eq.${page.id}&select=*&is_active=eq.true&order=created_at.asc`)
      ]);

      page.blocks = await blocksRes.json();
      page.products = await productsRes.json();

      return { statusCode: 200, headers, body: JSON.stringify(page) };
    }

    // ── GET: List user pages ──
    if (action === 'list' && params.user_id) {
      const res = await sbFetch(`creator_pages?user_id=eq.${params.user_id}&select=*&order=created_at.desc`);
      return { statusCode: 200, headers, body: JSON.stringify(await res.json()) };
    }

    // ── GET: Analytics ──
    if (action === 'analytics' && params.page_id) {
      let url = `creator_page_analytics?page_id=eq.${params.page_id}&select=*&order=created_at.desc`;
      if (params.limit) url += `&limit=${parseInt(params.limit, 10) || 100}`;
      const res = await sbFetch(url);
      return { statusCode: 200, headers, body: JSON.stringify(await res.json()) };
    }

    // ── GET: Subscribers ──
    if (action === 'subscribers' && params.page_id) {
      const res = await sbFetch(`creator_page_subscribers?page_id=eq.${params.page_id}&select=*&order=subscribed_at.desc`);
      return { statusCode: 200, headers, body: JSON.stringify(await res.json()) };
    }

    // ── POST actions ──
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const postAction = body.action || action;

      // Save page
      if (postAction === 'save-page' && body.page) {
        const page = body.page;
        page.updated_at = new Date().toISOString();
        let res;
        if (page.id) {
          const { blocks, products, analytics, ...pageData } = page;
          res = await sbFetch(`creator_pages?id=eq.${page.id}`, { method: 'PATCH', body: pageData });
        } else {
          res = await sbFetch('creator_pages', { method: 'POST', body: page });
        }
        return { statusCode: res.ok ? 200 : 400, headers, body: JSON.stringify(await res.json()) };
      }

      // Save block
      if (postAction === 'save-block' && body.block) {
        const block = body.block;
        let res;
        if (block.id) {
          res = await sbFetch(`creator_page_blocks?id=eq.${block.id}`, { method: 'PATCH', body: block });
        } else {
          res = await sbFetch('creator_page_blocks', { method: 'POST', body: block });
        }
        return { statusCode: res.ok ? 200 : 400, headers, body: JSON.stringify(await res.json()) };
      }

      // Delete block
      if (postAction === 'delete-block' && body.id) {
        await sbFetch(`creator_page_blocks?id=eq.${body.id}`, { method: 'DELETE' });
        return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
      }

      // Save product
      if (postAction === 'save-product' && body.product) {
        const product = body.product;
        let res;
        if (product.id) {
          res = await sbFetch(`creator_page_products?id=eq.${product.id}`, { method: 'PATCH', body: product });
        } else {
          res = await sbFetch('creator_page_products', { method: 'POST', body: product });
        }
        return { statusCode: res.ok ? 200 : 400, headers, body: JSON.stringify(await res.json()) };
      }

      // Track analytics event
      if (postAction === 'track' && body.event) {
        const res = await sbFetch('creator_page_analytics', { method: 'POST', body: body.event });
        return { statusCode: 200, headers, body: JSON.stringify({ tracked: true }) };
      }

      // Email subscribe
      if (postAction === 'subscribe' && body.page_id && body.email) {
        const res = await sbFetch('creator_page_subscribers', {
          method: 'POST',
          body: { page_id: body.page_id, email: body.email },
          headers: { Prefer: 'return=minimal' }
        });
        return { statusCode: 200, headers, body: JSON.stringify({ subscribed: true }) };
      }

      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Unknown POST action' }) };
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid action' }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
