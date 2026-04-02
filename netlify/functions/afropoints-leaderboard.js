// netlify/functions/afropoints-leaderboard.js
// Serve and refresh leaderboard data

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://jbmhfpkzbgyeodsqhprx.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

function cors(event) {
  const origin = event.headers?.origin || '';
  const ok = origin === 'https://afrotools.com' || origin === 'https://www.afrotools.com' || origin.endsWith('.netlify.app') || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1');
  return { 'Access-Control-Allow-Origin': ok ? origin : 'https://afrotools.com', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Content-Type': 'application/json', 'Vary': 'Origin' };
}

function reply(s, b, h) { return { statusCode: s, headers: h, body: JSON.stringify(b) }; }

async function sbFetch(path, opts) {
  const res = await fetch(SUPABASE_URL + '/rest/v1/' + path, {
    ...opts,
    headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY, 'Content-Type': 'application/json', ...(opts?.headers || {}) }
  });
  const text = await res.text();
  try { return JSON.parse(text); } catch { return text; }
}

exports.handler = async function (event) {
  const headers = cors(event);
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'GET') return reply(405, { error: 'Method not allowed' }, headers);
  if (!SUPABASE_KEY) return reply(500, { error: 'Server not configured' }, headers);

  const params = event.queryStringParameters || {};
  const scope = params.scope || 'global';
  const period = params.period || 'all_time';
  const limit = Math.min(parseInt(params.limit) || 50, 100);

  try {
    // Try cache first
    const cached = await sbFetch(
      'leaderboard_cache?scope=eq.' + encodeURIComponent(scope) + '&period=eq.' + period + '&order=rank_position&limit=' + limit
    );

    if (Array.isArray(cached) && cached.length > 0) {
      // Check staleness (refresh if older than 1 hour)
      const refreshed = new Date(cached[0].refreshed_at);
      if (Date.now() - refreshed.getTime() < 3600000) {
        return reply(200, cached, headers);
      }
    }

    // Build fresh from points_profiles
    let query = 'points_profiles?select=user_id,total_earned,contributions_count,trust_score,rank,primary_country,primary_city&order=total_earned.desc&limit=' + limit;
    if (scope.startsWith('country:')) {
      query += '&primary_country=eq.' + scope.split(':')[1];
    }

    const profiles = await sbFetch(query);
    if (!Array.isArray(profiles)) return reply(200, [], headers);

    // Build leaderboard entries
    const entries = profiles.map(function (p, i) {
      return {
        scope: scope,
        user_id: p.user_id,
        display_name: 'Contributor #' + p.user_id.slice(0, 4),
        rank_position: i + 1,
        total_points: p.total_earned || 0,
        contributions_count: p.contributions_count || 0,
        trust_score: p.trust_score || 50,
        period: period,
        rank: p.rank || 'newcomer',
        country: p.primary_country,
        city: p.primary_city
      };
    });

    return reply(200, entries, headers);

  } catch (err) {
    console.error('AfroPoints leaderboard error:', err);
    return reply(500, { error: 'Internal server error' }, headers);
  }
};
