const { getAllowedOrigin } = require('./utils/cors');
const { SUPABASE_URL, SUPABASE_KEY, sbRequest, cleanText } = require('./_shared/market-data');

function corsHeaders(event) {
  return {
    'Access-Control-Allow-Origin': getAllowedOrigin(event),
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
    'Vary': 'Origin'
  };
}

function reply(statusCode, body, headers) {
  return { statusCode, headers, body: JSON.stringify(body) };
}

function normalizeStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map(function (item) { return typeof item === 'string' ? item.trim() : ''; })
    .filter(Boolean)
    .filter(function (item, index, items) { return items.indexOf(item) === index; });
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
    const user = await res.json();
    return { id: user.id, email: user.email };
  } catch {
    return null;
  }
}

async function getProfile(userId) {
  const rows = await sbRequest('GET', 'points_profiles?user_id=eq.' + userId);
  if (Array.isArray(rows) && rows[0]) return rows[0];
  return {
    user_id: userId,
    total_earned: 0,
    total_spent: 0,
    current_balance: 0,
    contributions_count: 0,
    confirmations_count: 0,
    trust_score: 50,
    current_streak: 0,
    longest_streak: 0,
    rank: 'newcomer',
    badges: [],
    primary_country: null,
    primary_city: null,
    contributor_persona: null,
    regular_countries: [],
    regular_cities: [],
    regular_neighborhoods: [],
    regular_routes: [],
    coverage_categories: [],
    submission_frequency: null,
    payout_preference: null,
    proof_comfort: null,
    onboarding_completed_at: null
  };
}

exports.handler = async function (event) {
  const headers = corsHeaders(event);
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (!SUPABASE_KEY) return reply(500, { error: 'Server not configured' }, headers);

  const params = event.queryStringParameters || {};
  const action = params.action || 'profile';

  if (event.httpMethod === 'GET' && action === 'badges') {
    const badges = await sbRequest('GET', 'badges?select=*&order=category,name');
    return reply(200, badges, headers);
  }

  const user = await getUser(event);
  if (!user) return reply(401, { error: 'Authentication required' }, headers);

  try {
    if (event.httpMethod === 'GET') {
      if (action === 'profile' || action === 'onboarding') {
        return reply(200, await getProfile(user.id), headers);
      }

      if (action === 'activity') {
        const limit = Math.min(parseInt(params.limit, 10) || 10, 50);
        const ledger = await sbRequest('GET', 'points_ledger?user_id=eq.' + user.id + '&order=created_at.desc&limit=' + limit);
        return reply(200, ledger, headers);
      }

      if (action === 'contributions') {
        const limit = Math.min(parseInt(params.limit, 10) || 20, 100);
        const subtype = cleanText(params.subtype);
        let path = 'contributions?user_id=eq.' + user.id + '&order=submitted_at.desc&limit=' + limit;
        if (subtype) path += '&data_category=eq.' + encodeURIComponent(subtype);
        const contribs = await sbRequest('GET', path);
        return reply(200, contribs, headers);
      }

      return reply(400, { error: 'Unknown action' }, headers);
    }

    if (event.httpMethod !== 'POST') {
      return reply(405, { error: 'Method not allowed' }, headers);
    }

    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch {
      return reply(400, { error: 'Invalid JSON' }, headers);
    }

    if ((body.action || 'onboarding') !== 'onboarding') {
      return reply(400, { error: 'Unknown action' }, headers);
    }

    const existingProfile = await getProfile(user.id);
    const payload = {
      contributor_persona: cleanText(body.contributor_persona),
      regular_countries: normalizeStringArray(body.regular_countries),
      regular_cities: normalizeStringArray(body.regular_cities),
      regular_neighborhoods: normalizeStringArray(body.regular_neighborhoods),
      regular_routes: normalizeStringArray(body.regular_routes),
      coverage_categories: normalizeStringArray(body.coverage_categories),
      submission_frequency: cleanText(body.submission_frequency),
      payout_preference: cleanText(body.payout_preference),
      proof_comfort: cleanText(body.proof_comfort),
      onboarding_completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (existingProfile && existingProfile.created_at) {
      await sbRequest('PATCH', 'points_profiles?user_id=eq.' + user.id, payload, {
        Prefer: 'return=minimal'
      });
    } else {
      await sbRequest('POST', 'points_profiles', {
        user_id: user.id,
        total_earned: 0,
        total_spent: 0,
        current_balance: 0,
        contributions_count: 0,
        confirmations_count: 0,
        trust_score: 50,
        current_streak: 0,
        longest_streak: 0,
        rank: 'newcomer',
        badges: [],
        created_at: new Date().toISOString(),
        ...payload
      }, {
        Prefer: 'return=minimal'
      });
    }

    return reply(200, {
      success: true,
      profile: {
        ...existingProfile,
        ...payload,
        user_id: user.id
      }
    }, headers);
  } catch (error) {
    console.error('AfroPoints profile error:', error);
    return reply(500, { error: 'Internal server error' }, headers);
  }
};
