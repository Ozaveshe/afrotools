// netlify/functions/afropoints-profile.js
// Get user's points profile, activity feed, and badges

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://jbmhfpkzbgyeodsqhprx.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

function cors(event) {
  const origin = event.headers?.origin || '';
  const ok = origin === 'https://afrotools.com' || origin === 'https://www.afrotools.com' || origin.endsWith('.netlify.app') || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1');
  return { 'Access-Control-Allow-Origin': ok ? origin : 'https://afrotools.com', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Content-Type': 'application/json', 'Vary': 'Origin' };
}

function reply(s, b, h) { return { statusCode: s, headers: h, body: JSON.stringify(b) }; }

async function getUser(event) {
  const auth = event.headers?.authorization || '';
  if (!auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  try {
    const res = await fetch(SUPABASE_URL + '/auth/v1/user', { headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + token } });
    if (!res.ok) return null;
    const user = await res.json();
    return { id: user.id, email: user.email };
  } catch { return null; }
}

async function sbGet(path) {
  const res = await fetch(SUPABASE_URL + '/rest/v1/' + path, {
    headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY }
  });
  return res.json();
}

exports.handler = async function (event) {
  const headers = cors(event);
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'GET') return reply(405, { error: 'Method not allowed' }, headers);
  if (!SUPABASE_KEY) return reply(500, { error: 'Server not configured' }, headers);

  const params = event.queryStringParameters || {};
  const action = params.action || 'profile';

  // Badges are public
  if (action === 'badges') {
    const badges = await sbGet('badges?select=*&order=category,name');
    return reply(200, badges, headers);
  }

  const user = await getUser(event);
  if (!user) return reply(401, { error: 'Authentication required' }, headers);

  try {
    if (action === 'profile') {
      const profiles = await sbGet('points_profiles?user_id=eq.' + user.id);
      if (!Array.isArray(profiles) || profiles.length === 0) {
        return reply(200, {
          user_id: user.id,
          total_earned: 0, total_spent: 0, current_balance: 0,
          contributions_count: 0, confirmations_count: 0,
          trust_score: 50, current_streak: 0, longest_streak: 0,
          rank: 'newcomer', badges: [], primary_country: null, primary_city: null
        }, headers);
      }
      return reply(200, profiles[0], headers);
    }

    if (action === 'activity') {
      const limit = parseInt(params.limit) || 10;
      const ledger = await sbGet('points_ledger?user_id=eq.' + user.id + '&order=created_at.desc&limit=' + limit);
      return reply(200, ledger, headers);
    }

    if (action === 'contributions') {
      const limit = parseInt(params.limit) || 20;
      const contribs = await sbGet('contributions?user_id=eq.' + user.id + '&order=submitted_at.desc&limit=' + limit);
      return reply(200, contribs, headers);
    }

    return reply(400, { error: 'Unknown action' }, headers);
  } catch (err) {
    console.error('AfroPoints profile error:', err);
    return reply(500, { error: 'Internal server error' }, headers);
  }
};
