const { getAllowedOrigin } = require('./utils/cors');
const { getUserFromEvent } = require('./_shared/browser-session-auth');

const SUPABASE_URL = process.env.SUPABASE_AUTH_URL || 'https://zpclagtgczsygrgztlts.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_AUTH_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY;

function corsHeaders(event) {
  return {
    'Access-Control-Allow-Origin': getAllowedOrigin(event),
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
    'Cache-Control': 'private, no-store, max-age=0',
    'Vary': 'Origin, Authorization, Cookie'
  };
}

function reply(statusCode, body, headers, responseMeta) {
  const meta = responseMeta || {};
  const response = {
    statusCode,
    headers: Object.assign({}, headers, meta.headers || {}),
    body: JSON.stringify(body)
  };

  if (meta.multiValueHeaders && Object.keys(meta.multiValueHeaders).length) {
    response.multiValueHeaders = meta.multiValueHeaders;
  }

  return response;
}

function clampLimit(value, fallback, max) {
  const parsed = parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}

function defaultProfile(userId) {
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
    payout_details: {},
    payout_details_updated_at: null,
    proof_comfort: null,
    onboarding_completed_at: null
  };
}

async function sbGet(path) {
  const response = await fetch(SUPABASE_URL + '/rest/v1/' + path, {
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: 'Bearer ' + SUPABASE_SERVICE_KEY,
      'Content-Type': 'application/json'
    }
  });

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text || null;
  }

  if (!response.ok) {
    const detail = typeof data === 'string' ? data : JSON.stringify(data || {});
    throw new Error(detail || 'Supabase request failed');
  }

  return data;
}

function arrayOrEmpty(value) {
  return Array.isArray(value) ? value : [];
}

exports.handler = async function (event) {
  const headers = corsHeaders(event);

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'GET') return reply(405, { error: 'Method not allowed' }, headers);
  if (!SUPABASE_SERVICE_KEY) return reply(500, { error: 'Server not configured' }, headers);

  const authResult = await getUserFromEvent(event);
  const user = authResult && authResult.user ? authResult.user : null;
  const sessionResponse = authResult && authResult.sessionResponse ? authResult.sessionResponse : null;

  if (!user || !user.id) {
    return reply(401, { error: 'Authentication required' }, headers, sessionResponse);
  }

  const params = event.queryStringParameters || {};
  const activityLimit = clampLimit(params.activity_limit, 6, 20);
  const contributionLimit = clampLimit(params.contribution_limit, 6, 20);
  const cashoutLimit = clampLimit(params.cashout_limit, 20, 50);
  const userId = encodeURIComponent(user.id);

  try {
    const requests = await Promise.allSettled([
      sbGet('points_profiles?user_id=eq.' + userId + '&limit=1'),
      sbGet('points_ledger?user_id=eq.' + userId + '&order=created_at.desc&limit=' + activityLimit),
      sbGet('contributions?user_id=eq.' + userId + '&order=submitted_at.desc&limit=' + contributionLimit),
      sbGet('cashout_requests?user_id=eq.' + userId + '&order=created_at.desc&limit=' + cashoutLimit)
    ]);

    const profileRows = requests[0].status === 'fulfilled' ? arrayOrEmpty(requests[0].value) : [];
    const activity = requests[1].status === 'fulfilled' ? arrayOrEmpty(requests[1].value) : [];
    const contributions = requests[2].status === 'fulfilled' ? arrayOrEmpty(requests[2].value) : [];
    const cashouts = requests[3].status === 'fulfilled' ? arrayOrEmpty(requests[3].value) : [];
    const partial = requests.some(function (result) { return result.status === 'rejected'; });

    if (requests[0].status === 'rejected') {
      console.error('AfroPoints account profile fetch failed:', requests[0].reason);
      return reply(502, { error: 'AfroPoints profile unavailable' }, headers, sessionResponse);
    }

    return reply(200, {
      synced: true,
      partial,
      generated_at: new Date().toISOString(),
      profile: profileRows[0] || defaultProfile(user.id),
      activity,
      contributions,
      cashouts
    }, headers, sessionResponse);
  } catch (error) {
    console.error('AfroPoints account snapshot error:', error);
    return reply(500, { error: 'Internal server error' }, headers, sessionResponse);
  }
};
