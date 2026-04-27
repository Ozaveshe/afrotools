const { getAllowedOrigin } = require('./utils/cors');
const { SUPABASE_URL, SUPABASE_KEY, sbRequest, cleanText } = require('./_shared/market-data');
const { checkRateLimit } = require('./_shared/rate-limit');

function headers(event) {
  return {
    'Access-Control-Allow-Origin': getAllowedOrigin(event),
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
    'Content-Type': 'application/json',
    'Vary': 'Origin'
  };
}

function reply(statusCode, body, responseHeaders) {
  return { statusCode, headers: responseHeaders, body: JSON.stringify(body) };
}

function normalizeStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map(function (item) { return typeof item === 'string' ? item.trim().slice(0, 80) : ''; })
    .filter(Boolean)
    .filter(function (item, index, items) { return items.indexOf(item) === index; })
    .slice(0, 20);
}

function cleanField(value, maxLength) {
  if (typeof value !== 'string') return null;
  var text = value.trim();
  if (!text) return null;
  return text.slice(0, maxLength || 255);
}

function cleanEmail(value) {
  var email = cleanField(value, 254);
  if (!email) return null;
  email = email.toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? email : null;
}

function clientIp(event) {
  var headers = event.headers || {};
  return String(
    headers['x-nf-client-connection-ip'] ||
    headers['client-ip'] ||
    headers['x-forwarded-for'] ||
    ''
  ).split(',')[0].trim() || 'unknown';
}

async function getUser(event) {
  const auth = event.headers?.authorization || event.headers?.Authorization || '';
  if (!auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  try {
    const res = await fetch(SUPABASE_URL + '/auth/v1/user', {
      headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + token }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function isAdmin(userId) {
  if (!userId) return false;
  const profiles = await sbRequest('GET', 'profiles?id=eq.' + userId + '&select=role');
  return Array.isArray(profiles) && profiles[0] && profiles[0].role === 'admin';
}

exports.handler = async function (event) {
  const responseHeaders = headers(event);
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: responseHeaders, body: '' };
  if (!SUPABASE_KEY) return reply(500, { error: 'Server not configured' }, responseHeaders);

  try {
    const user = await getUser(event);

    if (event.httpMethod === 'POST') {
      if (!checkRateLimit('data-buyer-leads:' + clientIp(event), 12)) {
        return reply(429, { error: 'Too many buyer requests. Please try again later.' }, responseHeaders);
      }

      let body;
      try {
        body = JSON.parse(event.body || '{}');
      } catch {
        return reply(400, { error: 'Invalid JSON' }, responseHeaders);
      }

      const company = cleanField(body.company, 160);
      const contactEmail = cleanEmail(body.contact_email);
      const useCase = cleanField(body.use_case, 2000);

      if (!body.consent) return reply(400, { error: 'Consent is required' }, responseHeaders);
      if (!company) return reply(400, { error: 'Company is required' }, responseHeaders);
      if (!contactEmail) return reply(400, { error: 'Valid contact email is required' }, responseHeaders);
      if (!useCase) return reply(400, { error: 'Use case is required' }, responseHeaders);

      const payload = {
        submitted_by: user ? user.id : null,
        company: company,
        contact_name: cleanField(body.contact_name, 150),
        contact_email: contactEmail,
        contact_phone: cleanField(body.contact_phone, 80),
        use_case: useCase,
        verticals: normalizeStringArray(body.verticals),
        countries: normalizeStringArray(body.countries),
        cities: normalizeStringArray(body.cities),
        cadence: cleanField(body.cadence, 40),
        delivery_format: cleanField(body.delivery_format, 40),
        budget_band: cleanField(body.budget_band, 40),
        consent: true,
        review_status: 'new',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await sbRequest('POST', 'data_buyer_leads', payload, {
        Prefer: 'return=minimal'
      });
      return reply(201, { success: true, message: 'Buyer request submitted' }, responseHeaders);
    }

    if (event.httpMethod === 'GET') {
      if (!user) return reply(401, { error: 'Authentication required' }, responseHeaders);

      const admin = await isAdmin(user.id);
      const params = event.queryStringParameters || {};
      const limit = Math.min(parseInt(params.limit, 10) || 25, 100);
      let path = 'data_buyer_leads?order=created_at.desc&limit=' + limit;
      if (!admin) {
        path += '&submitted_by=eq.' + user.id;
      } else if (cleanText(params.status)) {
        path += '&review_status=eq.' + encodeURIComponent(params.status);
      }

      const leads = await sbRequest('GET', path);
      return reply(200, { leads: Array.isArray(leads) ? leads : [] }, responseHeaders);
    }

    if (event.httpMethod === 'PATCH') {
      if (!user || !(await isAdmin(user.id))) {
        return reply(403, { error: 'Admin access required' }, responseHeaders);
      }

      const id = (event.queryStringParameters || {}).id;
      if (!id) return reply(400, { error: 'Missing id' }, responseHeaders);

      let body;
      try {
        body = JSON.parse(event.body || '{}');
      } catch {
        return reply(400, { error: 'Invalid JSON' }, responseHeaders);
      }

      const payload = {
        review_status: cleanText(body.review_status) || 'qualified',
        notes: cleanText(body.notes),
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await sbRequest('PATCH', 'data_buyer_leads?id=eq.' + id, payload, {
        Prefer: 'return=minimal'
      });
      return reply(200, { success: true }, responseHeaders);
    }

    return reply(405, { error: 'Method not allowed' }, responseHeaders);
  } catch (error) {
    console.error('Data buyer lead error:', error);
    return reply(500, { error: 'Internal server error' }, responseHeaders);
  }
};
