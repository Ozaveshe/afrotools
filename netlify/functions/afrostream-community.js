// netlify/functions/afrostream-community.js
// AfroStream — Public Community API (no admin auth needed)
// All submissions go to as_submissions with status='pending'
// Admin must approve before anything goes live
//
// POST   /api/community/submit          → submit creator/stream/news_tip/correction
// POST   /api/community/upvote          → upvote a creator
// GET    /api/community/upvotes/:id     → get upvote count for a creator
// GET    /api/community/my-submissions  → user's own submissions (auth required)
// GET    /api/community/leaderboard     → points leaderboard
// GET    /api/community/badges          → all badge definitions
// GET    /api/community/my-points       → user's points profile (auth required)

var SUPABASE_URL = 'https://zpclagtgczsygrgztlts.supabase.co';
var SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_DATA_SERVICE_ROLE_KEY;

function getCorsHeaders(event) {
  var origin = event.headers?.origin || '';
  var isAllowed =
    origin === 'https://afrotools.com' ||
    origin === 'https://www.afrotools.com' ||
    origin.endsWith('.netlify.app') ||
    origin.startsWith('http://localhost') ||
    origin.startsWith('http://127.0.0.1');
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : 'https://afrotools.com',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
    'Vary': 'Origin'
  };
}

async function sb(method, path, body) {
  var opts = {
    method: method,
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: 'Bearer ' + SUPABASE_SERVICE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    }
  };
  if (body) opts.body = JSON.stringify(body);
  var res = await fetch(SUPABASE_URL + '/rest/v1/' + path, opts);
  var text = await res.text();
  var data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(JSON.stringify(data) || 'Supabase ' + res.status);
  return data;
}

// Get authenticated user from Authorization header
async function getUser(event) {
  var auth = event.headers?.authorization || '';
  if (!auth.startsWith('Bearer ')) return null;
  var token = auth.replace('Bearer ', '');
  try {
    var res = await fetch(SUPABASE_URL + '/auth/v1/user', {
      headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: 'Bearer ' + token }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch(e) { return null; }
}

function hashIP(ip) {
  // Simple hash for rate limiting — not crypto-secure, just dedup
  var hash = 0;
  var str = (ip || 'unknown') + '_afrostream_salt';
  for (var i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return 'ip_' + Math.abs(hash).toString(36);
}

function ok(headers, data, code) {
  return { statusCode: code || 200, headers: headers, body: JSON.stringify({ success: true, data: data }) };
}

function err(headers, msg, code) {
  return { statusCode: code || 400, headers: headers, body: JSON.stringify({ error: msg }) };
}

// ── VALIDATION ─────────────────────────────────────────────────
var VALID_TYPES = ['creator', 'stream', 'news_tip', 'correction'];

var VALID_COUNTRIES = [
  'Nigeria','Kenya','Ghana','South Africa','Egypt','Tanzania','Cameroon','Ethiopia',
  'Senegal','Rwanda','Uganda','Morocco','Angola','Algeria','Tunisia',"Cote d'Ivoire",
  'DR Congo','Mozambique','Zimbabwe','Zambia','Botswana','Namibia','Mauritius','Libya','Gabon'
];

var COUNTRY_ALIASES = {
  NG: 'NG', NIGERIA: 'NG',
  KE: 'KE', KENYA: 'KE',
  GH: 'GH', GHANA: 'GH',
  ZA: 'ZA', 'SOUTH AFRICA': 'ZA',
  EG: 'EG', EGYPT: 'EG',
  TZ: 'TZ', TANZANIA: 'TZ',
  CM: 'CM', CAMEROON: 'CM',
  ET: 'ET', ETHIOPIA: 'ET',
  SN: 'SN', SENEGAL: 'SN',
  RW: 'RW', RWANDA: 'RW',
  UG: 'UG', UGANDA: 'UG',
  MA: 'MA', MOROCCO: 'MA',
  AO: 'AO', ANGOLA: 'AO',
  DZ: 'DZ', ALGERIA: 'DZ',
  TN: 'TN', TUNISIA: 'TN',
  CI: 'CI', "COTE D'IVOIRE": 'CI', 'COTE D IVOIRE': 'CI', "CÔTE D'IVOIRE": 'CI',
  CD: 'CD', 'DR CONGO': 'CD', 'DEMOCRATIC REPUBLIC OF CONGO': 'CD',
  MZ: 'MZ', MOZAMBIQUE: 'MZ',
  ZW: 'ZW', ZIMBABWE: 'ZW',
  ZM: 'ZM', ZAMBIA: 'ZM',
  BW: 'BW', BOTSWANA: 'BW',
  NA: 'NA', NAMIBIA: 'NA',
  MU: 'MU', MAURITIUS: 'MU',
  LY: 'LY', LIBYA: 'LY',
  GA: 'GA', GABON: 'GA'
};

function normalizeCountry(value) {
  var raw = String(value || '').trim();
  if (!raw) return '';
  var key = raw.toUpperCase().replace(/[’`]/g, "'").replace(/\s+/g, ' ');
  return COUNTRY_ALIASES[key] || '';
}

function countryKey(value) {
  return normalizeCountry(value) || String(value || '').trim().toUpperCase();
}

var VALID_PLATFORMS = ['youtube','twitch','tiktok','instagram','kick','rumble'];

function validateCreatorPayload(p) {
  if (!p.name || typeof p.name !== 'string' || p.name.length < 2) return 'Creator name required (min 2 chars)';
  var country = normalizeCountry(p.country);
  if (!country) return 'Valid African country required';
  p.country = country;
  if (p.primary_platform && !VALID_PLATFORMS.includes(p.primary_platform)) return 'Invalid platform';
  if (p.name.length > 100) return 'Name too long (max 100)';
  if (p.bio && p.bio.length > 500) return 'Bio too long (max 500)';
  return null;
}

function validateStreamPayload(p) {
  if (!p.creator_name || p.creator_name.length < 2) return 'Creator name required';
  if (!p.title || p.title.length < 3) return 'Stream title required (min 3 chars)';
  if (!p.stream_date) return 'Stream date required';
  if (!p.platform || !VALID_PLATFORMS.includes(p.platform)) return 'Valid platform required';
  if (p.country) {
    var country = normalizeCountry(p.country);
    if (!country) return 'Valid African country required';
    p.country = country;
  }
  if (p.title.length > 200) return 'Title too long (max 200)';
  return null;
}

function validateNewsTipPayload(p) {
  if (!p.title || p.title.length < 5) return 'Title required (min 5 chars)';
  if (!p.excerpt || p.excerpt.length < 10) return 'Excerpt required (min 10 chars)';
  if (!p.body || p.body.length < 20) return 'Body required (min 20 chars)';
  if (p.title.length > 200) return 'Title too long (max 200)';
  if (p.body.length > 5000) return 'Body too long (max 5000)';
  return null;
}

function validateCorrectionPayload(p) {
  if (!p.target_type || !['creator', 'stream', 'news'].includes(p.target_type)) return 'Must specify what to correct (creator/stream/news)';
  if (!p.target_id) return 'Must specify which item to correct';
  if (!p.description || p.description.length < 10) return 'Please describe the correction (min 10 chars)';
  if (p.description.length > 1000) return 'Description too long (max 1000)';
  return null;
}

// Sanitize: strip HTML tags from all string values
function sanitize(obj) {
  var clean = {};
  for (var key in obj) {
    if (typeof obj[key] === 'string') {
      clean[key] = obj[key].replace(/<[^>]*>/g, '').trim();
    } else {
      clean[key] = obj[key];
    }
  }
  return clean;
}

exports.handler = async function(event) {
  var headers = getCorsHeaders(event);
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: headers, body: '' };

  var path = event.path
    .replace(/^\/api\/community\/?/, '')
    .replace(/^\.netlify\/functions\/afrostream-community\/?/, '');
  var method = event.httpMethod;

  if (!SUPABASE_SERVICE_KEY) {
    return { statusCode: 500, headers: headers, body: JSON.stringify({ error: 'Server not configured' }) };
  }

  var body = {};
  try { body = event.body ? JSON.parse(event.body) : {}; } catch(e) {}

  var clientIP = event.headers?.['x-forwarded-for']?.split(',')[0]?.trim() || event.headers?.['client-ip'] || '';
  var ipHash = hashIP(clientIP);

  console.log('[afrostream-community] ' + method + ' /' + path);

  try {

    // ══════════════════════════════════════════════════════════════
    // SUBMIT (creator / stream / news_tip / correction)
    // ══════════════════════════════════════════════════════════════
    if (path === 'submit' && method === 'POST') {
      var type = body.type;
      if (!type || !VALID_TYPES.includes(type)) return err(headers, 'Invalid type. Use: ' + VALID_TYPES.join(', '));

      var payload = sanitize(body.payload || {});

      // Validate based on type
      var valError = null;
      if (type === 'creator') valError = validateCreatorPayload(payload);
      else if (type === 'stream') valError = validateStreamPayload(payload);
      else if (type === 'news_tip') valError = validateNewsTipPayload(payload);
      else if (type === 'correction') valError = validateCorrectionPayload(payload);
      if (valError) return err(headers, valError);

      // Get user if authenticated
      var user = await getUser(event);
      var userId = user ? user.id : null;
      var userEmail = user ? user.email : (body.email || null);
      var userName = body.user_name || (user ? (user.user_metadata?.display_name || user.email?.split('@')[0]) : 'Anonymous');

      // Rate limiting: max 5 submissions per IP per day
      var today = new Date().toISOString().slice(0, 10);
      var recentSubs = await sb('GET', 'as_submissions?ip_hash=eq.' + ipHash + '&created_at=gte.' + today + 'T00:00:00Z&select=id', null);
      if (recentSubs && recentSubs.length >= 5) {
        return err(headers, 'Daily submission limit reached (5/day). Try again tomorrow.', 429);
      }

      // Duplicate check for creators: same name + country within pending
      if (type === 'creator') {
        var dupeCheck = await sb('GET', 'as_submissions?type=eq.creator&status=eq.pending&select=id,payload', null);
        var isDupe = (dupeCheck || []).some(function(s) {
          var p = s.payload || {};
          return p.name && p.name.toLowerCase() === payload.name.toLowerCase() && countryKey(p.country) === countryKey(payload.country);
        });
        if (isDupe) return err(headers, 'This creator has already been submitted and is pending review.');
        // Also check existing creators
        var existingCreator = await sb('GET', 'as_creators?name=ilike.' + encodeURIComponent(payload.name) + '&country=eq.' + encodeURIComponent(payload.country) + '&select=id', null);
        if (existingCreator && existingCreator.length > 0) return err(headers, 'This creator already exists in our directory.');
      }

      // Insert submission
      var submission = await sb('POST', 'as_submissions', {
        user_id: userId,
        user_email: userEmail,
        user_name: userName,
        type: type,
        status: 'pending',
        payload: payload,
        ip_hash: ipHash
      });

      // Create/update points profile for authenticated users
      if (userId) {
        var existing = await sb('GET', 'as_points_profiles?user_id=eq.' + userId, null);
        if (!existing || existing.length === 0) {
          await sb('POST', 'as_points_profiles', {
            user_id: userId,
            display_name: userName,
            country: payload.country || null,
            submissions_count: 1
          });
        } else {
          await sb('PATCH', 'as_points_profiles?user_id=eq.' + userId, {
            submissions_count: (existing[0].submissions_count || 0) + 1,
            last_active: new Date().toISOString()
          });
        }
      }

      console.log('[afrostream-community] New submission: ' + type + ' from ' + userName);
      return ok(headers, { message: 'Submitted! Our team will review it shortly.', id: submission?.[0]?.id }, 201);
    }

    // ══════════════════════════════════════════════════════════════
    // UPVOTE a creator
    // ══════════════════════════════════════════════════════════════
    if (path === 'upvote' && method === 'POST') {
      var creatorId = body.creator_id;
      if (!creatorId) return err(headers, 'creator_id required');

      var user = await getUser(event);
      var userId = user ? user.id : null;

      // Check for existing vote
      var voteCheck = userId
        ? await sb('GET', 'as_upvotes?creator_id=eq.' + creatorId + '&user_id=eq.' + userId + '&select=id', null)
        : await sb('GET', 'as_upvotes?creator_id=eq.' + creatorId + '&ip_hash=eq.' + ipHash + '&select=id', null);

      if (voteCheck && voteCheck.length > 0) {
        return err(headers, 'You already voted for this creator');
      }

      await sb('POST', 'as_upvotes', {
        creator_id: parseInt(creatorId),
        user_id: userId,
        ip_hash: userId ? null : ipHash
      });

      // Get new count
      var allVotes = await sb('GET', 'as_upvotes?creator_id=eq.' + creatorId + '&select=id', null);
      var count = allVotes ? allVotes.length : 1;

      return ok(headers, { message: 'Vote recorded!', votes: count });
    }

    // ══════════════════════════════════════════════════════════════
    // GET upvote count for a creator
    // ══════════════════════════════════════════════════════════════
    var upvoteMatch = path.match(/^upvotes\/(\d+)$/);
    if (upvoteMatch && method === 'GET') {
      var cid = upvoteMatch[1];
      var votes = await sb('GET', 'as_upvotes?creator_id=eq.' + cid + '&select=id', null);
      return ok(headers, { creator_id: parseInt(cid), votes: votes ? votes.length : 0 });
    }

    // ══════════════════════════════════════════════════════════════
    // MY SUBMISSIONS (auth required)
    // ══════════════════════════════════════════════════════════════
    if (path === 'my-submissions' && method === 'GET') {
      var user = await getUser(event);
      if (!user) return err(headers, 'Sign in to view your submissions', 401);
      var mySubs = await sb('GET', 'as_submissions?user_id=eq.' + user.id + '&order=created_at.desc&limit=50', null);
      return ok(headers, mySubs);
    }

    // ══════════════════════════════════════════════════════════════
    // MY POINTS (auth required)
    // ══════════════════════════════════════════════════════════════
    if (path === 'my-points' && method === 'GET') {
      var user = await getUser(event);
      if (!user) return err(headers, 'Sign in to view your points', 401);
      var profile = await sb('GET', 'as_points_profiles?user_id=eq.' + user.id, null);
      var ledger = await sb('GET', 'as_points_ledger?user_id=eq.' + user.id + '&order=created_at.desc&limit=20', null);
      return ok(headers, {
        profile: profile?.[0] || null,
        recent_activity: ledger || []
      });
    }

    // ══════════════════════════════════════════════════════════════
    // PUBLIC LEADERBOARD
    // ══════════════════════════════════════════════════════════════
    if (path === 'leaderboard' && method === 'GET') {
      var country = event.queryStringParameters?.country || null;
      var query = 'as_points_profiles?order=total_points.desc&limit=50';
      if (country) query += '&country=eq.' + encodeURIComponent(country);
      var leaders = await sb('GET', query, null);
      return ok(headers, leaders);
    }

    // ══════════════════════════════════════════════════════════════
    // BADGES (public)
    // ══════════════════════════════════════════════════════════════
    if (path === 'badges' && method === 'GET') {
      var badges = await sb('GET', 'as_badges?order=id.asc', null);
      return ok(headers, badges);
    }

    return { statusCode: 404, headers: headers, body: JSON.stringify({ error: 'Endpoint not found', path: path }) };

  } catch(e) {
    console.error('[afrostream-community] Error:', e);
    return { statusCode: 500, headers: headers, body: JSON.stringify({ error: 'Internal server error', detail: e.message }) };
  }
};
