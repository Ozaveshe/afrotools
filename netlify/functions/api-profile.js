/**
 * AfroTools — Profile Save API
 *
 * POST /api/profile — save profile data (requires auth session)
 * GET  /api/profile — get profile data (requires auth session)
 *
 * Uses the AUTH Supabase instance (zpclagtgczsygrgztlts) with service role key
 * to reliably update profiles without browser proxy/ad-blocker issues.
 */

const SUPABASE_AUTH_URL = process.env.SUPABASE_AUTH_URL || 'https://zpclagtgczsygrgztlts.supabase.co';
const { getAllowedOrigin } = require('./utils/cors');
const { getUserFromEvent } = require('./_shared/browser-session-auth');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://afrotools.com',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
  'Cache-Control': 'private, no-store, max-age=0',
  'Vary': 'Origin, Authorization, Cookie',
};

function jsonResponse(statusCode, body, responseMeta) {
  const meta = responseMeta || {};
  const response = {
    statusCode,
    headers: Object.assign({}, CORS_HEADERS, meta.headers || {}),
    body: JSON.stringify(body),
  };

  if (meta.multiValueHeaders && Object.keys(meta.multiValueHeaders).length) {
    response.multiValueHeaders = meta.multiValueHeaders;
  }

  return response;
}

exports.handler = async function (event) {
  CORS_HEADERS['Access-Control-Allow-Origin'] = getAllowedOrigin(event);
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  // Auth check. Supports both bearer tokens and secure session cookies.
  const authResult = await getUserFromEvent(event);
  const user = authResult && authResult.user ? authResult.user : null;
  const sessionResponse = authResult && authResult.sessionResponse ? authResult.sessionResponse : null;
  if (!user) {
    return jsonResponse(401, { error: 'Unauthorized', synced: false }, sessionResponse);
  }

  const serviceKey = process.env.SUPABASE_AUTH_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!serviceKey) {
    return jsonResponse(500, { error: 'Server config error', synced: false }, sessionResponse);
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
    return jsonResponse(200, { profile: Array.isArray(data) && data[0] ? data[0] : null }, sessionResponse);
  }

  // POST: save profile
  if (event.httpMethod === 'POST') {
    let body;
    try { body = JSON.parse(event.body); } catch { return jsonResponse(400, { error: 'Invalid JSON' }, sessionResponse); }

    // Sanitize — only allow known profile fields
    const allowed = [
      'name', 'country', 'phone', 'city', 'bio', 'job_title', 'company',
      'industry', 'company_size', 'experience_level', 'linkedin_url',
      'website_url', 'interests',
      // Onboarding & preferences
      'onboarding_completed', 'country_code', 'currency',
      'employment_type', 'preferred_tools', 'email_digest_enabled',
      'email_weekly_enabled',
      // Education fields
      'education_level', 'institution', 'gpa_value', 'gpa_scale',
      'target_study_level', 'target_countries', 'target_fields',
      'ielts_overall', 'ielts_components', 'jamb_score', 'nationality',
      // AfroJAMB / Education Hub fields
      'jamb_best_mock_score', 'jamb_predicted_score', 'jamb_practice_count',
      'jamb_total_study_minutes', 'jamb_target_subjects', 'jamb_target_universities',
      'jamb_target_courses', 'jamb_weak_topics', 'jamb_streak_days',
      'jamb_score_source', 'graduation_date'
    ];
    const profileData = {};
    allowed.forEach(function (key) {
      if (body[key] !== undefined) profileData[key] = body[key];
    });

    if (Object.keys(profileData).length === 0) {
      return jsonResponse(400, { error: 'No valid fields to update' }, sessionResponse);
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
      return jsonResponse(200, { ok: true, synced: true, profile: updated[0] || null }, sessionResponse);
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
        return jsonResponse(200, { ok: true, synced: true, partial: true }, sessionResponse);
      }
    }

    const errText = await res.text();
    return jsonResponse(200, { ok: false, synced: false, error: errText }, sessionResponse);
  }

  return jsonResponse(405, { error: 'Method not allowed' }, sessionResponse);
};
