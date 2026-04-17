// netlify/functions/afropoints-leaderboard.js
// Build real leaderboard views for all-time, monthly, and weekly windows.

const SUPABASE_URL = process.env.SUPABASE_AUTH_URL || 'https://zpclagtgczsygrgztlts.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

function cors(event) {
  const origin = event.headers?.origin || '';
  const ok = origin === 'https://afrotools.com' ||
    origin === 'https://www.afrotools.com' ||
    origin.endsWith('.netlify.app') ||
    origin.startsWith('http://localhost') ||
    origin.startsWith('http://127.0.0.1');

  return {
    'Access-Control-Allow-Origin': ok ? origin : 'https://afrotools.com',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
    'Vary': 'Origin'
  };
}

function reply(statusCode, body, headers) {
  return { statusCode, headers, body: JSON.stringify(body) };
}

function buildDisplayName(userId) {
  return 'Contributor #' + String(userId || '').slice(0, 4);
}

function getScopeCountry(scope) {
  return typeof scope === 'string' && scope.startsWith('country:')
    ? scope.split(':')[1].toUpperCase()
    : null;
}

function getPeriodCutoff(period) {
  const now = new Date();
  if (period === 'weekly') {
    return new Date(Date.now() - 7 * 86400000).toISOString();
  }
  if (period === 'monthly') {
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
  }
  return null;
}

async function sbFetch(path, options) {
  const response = await fetch(SUPABASE_URL + '/rest/v1/' + path, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: 'Bearer ' + SUPABASE_KEY,
      'Content-Type': 'application/json',
      ...(options?.headers || {})
    }
  });

  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function fetchProfiles(scopeCountry, limit) {
  let query = 'points_profiles?select=user_id,total_earned,contributions_count,trust_score,rank,primary_country,primary_city&order=total_earned.desc&limit=' + limit;
  if (scopeCountry) query += '&primary_country=eq.' + scopeCountry;
  const rows = await sbFetch(query);
  return Array.isArray(rows) ? rows : [];
}

exports.handler = async function (event) {
  const headers = cors(event);

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'GET') return reply(405, { error: 'Method not allowed' }, headers);
  if (!SUPABASE_KEY) return reply(500, { error: 'Server not configured' }, headers);

  const params = event.queryStringParameters || {};
  const scope = params.scope || 'global';
  const period = params.period || 'all_time';
  const limit = Math.min(parseInt(params.limit, 10) || 50, 100);
  const scopeCountry = getScopeCountry(scope);

  try {
    const profiles = await fetchProfiles(scopeCountry, Math.max(limit, 250));
    if (period === 'all_time') {
      const entries = profiles.slice(0, limit).map(function (profile, index) {
        return {
          scope,
          user_id: profile.user_id,
          display_name: buildDisplayName(profile.user_id),
          rank_position: index + 1,
          total_points: profile.total_earned || 0,
          contributions_count: profile.contributions_count || 0,
          trust_score: profile.trust_score || 50,
          period,
          rank: profile.rank || 'newcomer',
          country: profile.primary_country,
          city: profile.primary_city
        };
      });
      return reply(200, entries, headers);
    }

    const cutoff = getPeriodCutoff(period);
    if (!cutoff) return reply(400, { error: 'Unsupported leaderboard period' }, headers);

    let contributionsQuery = 'contributions?select=user_id,country_code&status=eq.confirmed&submitted_at=gte.' + cutoff;
    if (scopeCountry) contributionsQuery += '&country_code=eq.' + scopeCountry;

    const contributions = await sbFetch(contributionsQuery);
    const positiveLedger = await sbFetch('points_ledger?select=user_id,amount,created_at&amount=gt.0&created_at=gte.' + cutoff);

    const profileMap = new Map();
    profiles.forEach(function (profile) {
      profileMap.set(profile.user_id, profile);
    });

    const contributionCounts = new Map();
    if (Array.isArray(contributions)) {
      contributions.forEach(function (entry) {
        contributionCounts.set(entry.user_id, (contributionCounts.get(entry.user_id) || 0) + 1);
      });
    }

    const pointsByUser = new Map();
    if (Array.isArray(positiveLedger)) {
      positiveLedger.forEach(function (entry) {
        if (!profileMap.has(entry.user_id)) return;
        pointsByUser.set(entry.user_id, (pointsByUser.get(entry.user_id) || 0) + (entry.amount || 0));
      });
    }

    const rankedUsers = new Set();
    contributionCounts.forEach(function (_, userId) { rankedUsers.add(userId); });
    pointsByUser.forEach(function (_, userId) { rankedUsers.add(userId); });

    const entries = Array.from(rankedUsers)
      .map(function (userId) {
        const profile = profileMap.get(userId) || {};
        return {
          scope,
          user_id: userId,
          display_name: buildDisplayName(userId),
          total_points: pointsByUser.get(userId) || 0,
          contributions_count: contributionCounts.get(userId) || 0,
          trust_score: profile.trust_score || 50,
          period,
          rank: profile.rank || 'newcomer',
          country: profile.primary_country,
          city: profile.primary_city
        };
      })
      .sort(function (left, right) {
        if (right.total_points !== left.total_points) return right.total_points - left.total_points;
        if (right.contributions_count !== left.contributions_count) return right.contributions_count - left.contributions_count;
        return Number(right.trust_score || 0) - Number(left.trust_score || 0);
      })
      .slice(0, limit)
      .map(function (entry, index) {
        return { ...entry, rank_position: index + 1 };
      });

    return reply(200, entries, headers);
  } catch (error) {
    console.error('AfroPoints leaderboard error:', error);
    return reply(500, { error: 'Internal server error' }, headers);
  }
};
