/**
 * AfroTools — Profile Save API
 *
 * POST /api/profile — save profile data (requires auth token)
 * GET  /api/profile — get profile data (requires auth token)
 *
 * Uses the AUTH Supabase instance (zpclagtgczsygrgztlts) with service role key
 * to reliably update profiles without browser proxy/ad-blocker issues.
 */

const SUPABASE_AUTH_URL = 'https://zpclagtgczsygrgztlts.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwY2xhZ3RnY3pzeWdyZ3p0bHRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0NTg4MzIsImV4cCI6MjA4OTAzNDgzMn0._G-677vi2UTAhcU3t0aquvmd8lnQUBil53ok_Z623F0';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
};

function jsonResponse(statusCode, body) {
  return { statusCode, headers: CORS_HEADERS, body: JSON.stringify(body) };
}

async function getUserFromToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.replace('Bearer ', '');

  // Verify token by calling Supabase Auth API
  const res = await fetch(`${SUPABASE_AUTH_URL}/auth/v1/user`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) return null;
  const user = await res.json();
  return user && user.id ? user : null;
}

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  // Auth check
  const user = await getUserFromToken(event.headers['authorization'] || event.headers['Authorization']);
  if (!user) {
    return jsonResponse(401, { error: 'Unauthorized', synced: false });
  }

  const serviceKey = process.env.SUPABASE_AUTH_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!serviceKey) {
    return jsonResponse(500, { error: 'Server config error', synced: false });
  }

  // GET: fetch profile
  if (event.httpMethod === 'GET') {
    const res = await fetch(
      `${SUPABASE_AUTH_URL}/rest/v1/profiles?id=eq.${user.id}&select=*`,
      {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
      }
    );
    const data = await res.json();
    return jsonResponse(200, { profile: Array.isArray(data) && data[0] ? data[0] : null });
  }

  // POST: save profile
  if (event.httpMethod === 'POST') {
    let body;
    try { body = JSON.parse(event.body); } catch { return jsonResponse(400, { error: 'Invalid JSON' }); }

    // Sanitize — only allow known profile fields
    const allowed = [
      'name', 'country', 'phone', 'city', 'bio', 'job_title', 'company',
      'industry', 'company_size', 'experience_level', 'linkedin_url',
      'website_url', 'interests',
      // Education fields
      'education_level', 'institution', 'gpa_value', 'gpa_scale',
      'target_study_level', 'target_countries', 'target_fields',
      'ielts_overall', 'ielts_components', 'jamb_score', 'nationality'
    ];
    const profileData = {};
    allowed.forEach(function (key) {
      if (body[key] !== undefined) profileData[key] = body[key];
    });

    if (Object.keys(profileData).length === 0) {
      return jsonResponse(400, { error: 'No valid fields to update' });
    }

    // Use UPSERT (POST with on_conflict) so it works whether the row exists or not
    profileData.id = user.id;
    const res = await fetch(
      `${SUPABASE_AUTH_URL}/rest/v1/profiles`,
      {
        method: 'POST',
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation,resolution=merge-duplicates',
        },
        body: JSON.stringify(profileData),
      }
    );

    if (res.ok) {
      const updated = await res.json();
      return jsonResponse(200, { ok: true, synced: true, profile: updated[0] || null });
    }

    // If full upsert fails (columns don't exist), try basic fields only
    const basic = { id: user.id };
    if (profileData.name) basic.name = profileData.name;
    if (profileData.country) basic.country = profileData.country;

    if (Object.keys(basic).length > 1) {
      const fallback = await fetch(
        `${SUPABASE_AUTH_URL}/rest/v1/profiles`,
        {
          method: 'POST',
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            'Content-Type': 'application/json',
            Prefer: 'return=representation,resolution=merge-duplicates',
          },
          body: JSON.stringify(basic),
        }
      );
      if (fallback.ok) {
        return jsonResponse(200, { ok: true, synced: true, partial: true });
      }
    }

    const errText = await res.text();
    return jsonResponse(200, { ok: true, synced: false, error: errText });
  }

  return jsonResponse(405, { error: 'Method not allowed' });
};
