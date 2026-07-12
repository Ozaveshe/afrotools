// netlify/functions/creator-kit.js
// API for CreatorKit — media kit persistence, share tokens, view tracking
// Uses the canonical AfroTools Supabase project for storage

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://zpclagtgczsygrgztlts.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
  'Content-Type': 'application/json'
};

async function supabaseFetch(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${options.token || SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': options.prefer || 'return=representation',
      ...options.headers
    }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase ${res.status}: ${text}`);
  }
  return res.json();
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  const path = event.path.replace('/.netlify/functions/creator-kit', '').replace(/^\//, '');
  const method = event.httpMethod;

  try {
    // GET /creator-kit/view/:token — public kit view (no auth required)
    if (method === 'GET' && path.startsWith('view/')) {
      const token = path.replace('view/', '');
      const kits = await supabaseFetch(
        `creator_kits?share_token=eq.${encodeURIComponent(token)}&select=*`,
        { method: 'GET' }
      );
      if (!kits || !kits.length) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Kit not found' }) };
      }

      // Increment view count (fire-and-forget)
      supabaseFetch(
        `rpc/increment_kit_views`,
        { method: 'POST', body: JSON.stringify({ kit_token: token }) }
      ).catch(() => {});

      return { statusCode: 200, headers, body: JSON.stringify(kits[0]) };
    }

    // Auth required for everything below
    const authHeader = event.headers.authorization || event.headers.Authorization || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Authentication required' }) };
    }

    // Verify user via Supabase
    const authRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${token}` }
    });
    if (!authRes.ok) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid token' }) };
    }
    const user = await authRes.json();
    const userId = user.id;

    // GET /creator-kit — list user's kits
    if (method === 'GET' && !path) {
      const kits = await supabaseFetch(
        `creator_kits?user_id=eq.${userId}&order=updated_at.desc`,
        { method: 'GET', token }
      );
      return { statusCode: 200, headers, body: JSON.stringify(kits) };
    }

    // POST /creator-kit — create or update kit
    if (method === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const kitData = {
        user_id: userId,
        template: body.template || 'bold',
        title: body.name || 'Untitled Kit',
        tagline: body.tagline || '',
        bio_short: body.bioShort || '',
        bio_medium: body.bioMedium || '',
        bio_long: body.bioLong || '',
        accent_color: body.accentColor || '#F5A623',
        font_pairing: body.fontPairing || 'default',
        social_links: body.socials || {},
        stats: body.stats || {},
        past_clients: body.clients ? body.clients.split('\n').filter(Boolean) : [],
        testimonials: body.testimonials || [],
        contact_email: body.contactEmail || '',
        contact_phone: body.contactPhone || '',
        contact_whatsapp: body.contactWhatsapp || '',
        booking_url: body.bookingUrl || '',
        cta_text: body.ctaText || "Let's Work Together",
        section_order: body.sectionOrder || ['hero','about','portfolio','stats','services','clients','testimonials','contact'],
        hidden_sections: body.hiddenSections || [],
        updated_at: new Date().toISOString()
      };

      // Upsert: if user has a kit, update it; otherwise create
      const existing = await supabaseFetch(
        `creator_kits?user_id=eq.${userId}&limit=1`,
        { method: 'GET', token }
      );

      let result;
      if (existing && existing.length) {
        result = await supabaseFetch(
          `creator_kits?id=eq.${existing[0].id}`,
          { method: 'PATCH', token, body: JSON.stringify(kitData) }
        );
      } else {
        result = await supabaseFetch(
          'creator_kits',
          { method: 'POST', token, body: JSON.stringify(kitData) }
        );
      }

      return { statusCode: 200, headers, body: JSON.stringify(result[0] || result) };
    }

    // POST /creator-kit/rate-card — save rate card
    if (method === 'POST' && path === 'rate-card') {
      const body = JSON.parse(event.body || '{}');
      const rcData = {
        user_id: userId,
        title: body.name || 'Rate Card',
        services: body.services || [],
        packages: body.packages || [],
        currency: body.currency || 'NGN',
        show_prices: body.showPrices !== false,
        accent_color: body.accentColor || '#F5A623',
        updated_at: new Date().toISOString()
      };

      const existing = await supabaseFetch(
        `creator_rate_cards?user_id=eq.${userId}&limit=1`,
        { method: 'GET', token }
      );

      let result;
      if (existing && existing.length) {
        result = await supabaseFetch(
          `creator_rate_cards?id=eq.${existing[0].id}`,
          { method: 'PATCH', token, body: JSON.stringify(rcData) }
        );
      } else {
        result = await supabaseFetch(
          'creator_rate_cards',
          { method: 'POST', token, body: JSON.stringify(rcData) }
        );
      }

      return { statusCode: 200, headers, body: JSON.stringify(result[0] || result) };
    }

    return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) };

  } catch (err) {
    console.error('creator-kit error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
