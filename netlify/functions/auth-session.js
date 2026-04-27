/**
 * AfroTools — Secure Auth Session Proxy
 *
 * Handles login/signup/logout via Supabase and sets HttpOnly cookies
 * instead of exposing tokens in localStorage.
 *
 * Endpoints (via _redirects):
 *   POST /api/auth/login    — { email, password }
 *   POST /api/auth/signup   — { email, password, name, country }
 *   POST /api/auth/logout   — clears session cookie
 *   GET  /api/auth/session   — returns current user from cookie
 *   POST /api/auth/refresh  — refreshes token using refresh_token cookie
 *
 * Cookies set:
 *   afro_session  — access_token  (HttpOnly, Secure, SameSite=Lax, 1h)
 *   afro_refresh  — refresh_token (HttpOnly, Secure, SameSite=Lax, 30d)
 */

const { corsHeaders, corsResponse, getAllowedOrigin } = require('./utils/cors');

const SUPABASE_URL = process.env.SUPABASE_AUTH_URL || 'https://zpclagtgczsygrgztlts.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY_AUTH;
const IS_PROD = process.env.URL && process.env.URL.includes('afrotools.com');

// Cookie settings
const COOKIE_OPTS = {
  httpOnly: true,
  secure: true,
  sameSite: 'Lax',
  path: '/',
  domain: IS_PROD ? '.afrotools.com' : undefined,
};

function setCookie(name, value, maxAge) {
  var parts = [name + '=' + encodeURIComponent(value)];
  parts.push('HttpOnly');
  parts.push('Secure');
  parts.push('SameSite=Lax');
  parts.push('Path=/');
  if (IS_PROD) parts.push('Domain=.afrotools.com');
  if (maxAge !== undefined && maxAge !== null) parts.push('Max-Age=' + maxAge);
  return parts.join('; ');
}

function clearCookie(name) {
  return setCookie(name, '', 0);
}

function parseCookies(cookieHeader) {
  var cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach(function (c) {
    var parts = c.trim().split('=');
    if (parts.length >= 2) {
      cookies[parts[0].trim()] = decodeURIComponent(parts.slice(1).join('='));
    }
  });
  return cookies;
}

function jsonResponse(statusCode, body, extraHeaders, multiValueHeaders) {
  var headers = Object.assign({}, extraHeaders || {});
  headers['Content-Type'] = 'application/json';
  var response = { statusCode: statusCode, headers: headers, body: JSON.stringify(body) };
  if (multiValueHeaders && Object.keys(multiValueHeaders).length) {
    response.multiValueHeaders = multiValueHeaders;
  }
  return response;
}

function sessionCookieHeaders(session) {
  return {
    'Set-Cookie': [
      setCookie('afro_session', session.access_token, session.expires_in || 3600),
      setCookie('afro_refresh', session.refresh_token, 30 * 24 * 3600),
    ],
  };
}

function clearCookieHeaders() {
  return {
    'Set-Cookie': [
      clearCookie('afro_session'),
      clearCookie('afro_refresh'),
    ],
  };
}

function buildUser(supaUser) {
  if (!supaUser) return null;
  var meta = supaUser.user_metadata || {};
  return {
    id: supaUser.id,
    email: supaUser.email,
    name: meta.name || meta.full_name || supaUser.email.split('@')[0],
    country: meta.country || '',
    tier: meta.tier || 'free',
    createdAt: supaUser.created_at,
  };
}

async function supaFetch(path, opts) {
  var url = SUPABASE_URL + path;
  var headers = Object.assign({
    apikey: SUPABASE_ANON_KEY,
    'Content-Type': 'application/json',
  }, opts.headers || {});
  var res = await fetch(url, {
    method: opts.method || 'GET',
    headers: headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  return { status: res.status, data: await res.json() };
}

exports.handler = async function (event) {
  var cors = corsHeaders(event);

  if (event.httpMethod === 'OPTIONS') {
    return corsResponse(event);
  }

  var pathParts = (event.path || '').split('/').filter(Boolean);
  var action = pathParts[pathParts.length - 1]; // login, signup, logout, session, refresh
  var requestHeaders = event.headers || {};
  var cookies = parseCookies(requestHeaders.cookie || requestHeaders.Cookie || '');

  if (!SUPABASE_ANON_KEY) {
    if (action === 'logout') {
      return jsonResponse(200, { ok: true }, Object.assign({}, cors), clearCookieHeaders());
    }
    if (action === 'session' && event.httpMethod === 'GET' && !cookies.afro_session && !cookies.afro_refresh) {
      return jsonResponse(200, { user: null, authenticated: false }, cors);
    }
    return jsonResponse(500, { error: 'Server config error: missing auth key' }, cors);
  }

  // ── LOGIN ──
  if (action === 'login' && event.httpMethod === 'POST') {
    var body;
    try { body = JSON.parse(event.body); } catch (e) {
      return jsonResponse(400, { error: 'Invalid JSON' }, cors);
    }
    if (!body.email || !body.password) {
      return jsonResponse(400, { error: 'Email and password required' }, cors);
    }

    var result = await supaFetch('/auth/v1/token?grant_type=password', {
      method: 'POST',
      body: { email: body.email.trim().toLowerCase(), password: body.password },
    });

    if (result.status !== 200 || !result.data.access_token) {
      var errMsg = (result.data && result.data.error_description) || (result.data && result.data.msg) || 'Invalid credentials';
      return jsonResponse(401, { ok: false, error: errMsg }, cors);
    }

    var session = result.data;
    var user = buildUser(session.user);

    var respHeaders = Object.assign({}, cors);
    return jsonResponse(200, { ok: true, user: user }, respHeaders, sessionCookieHeaders(session));
  }

  // ── SIGNUP ──
  if (action === 'signup' && event.httpMethod === 'POST') {
    var body;
    try { body = JSON.parse(event.body); } catch (e) {
      return jsonResponse(400, { error: 'Invalid JSON' }, cors);
    }
    if (!body.email || !body.password || body.password.length < 6) {
      return jsonResponse(400, { error: 'Email and password (min 6 chars) required' }, cors);
    }

    var result = await supaFetch('/auth/v1/signup', {
      method: 'POST',
      body: {
        email: body.email.trim().toLowerCase(),
        password: body.password,
        data: {
          name: body.name || body.email.split('@')[0],
          country: body.country || '',
          tier: 'free',
        },
      },
    });

    if (result.status >= 400 || (result.data && result.data.error)) {
      var errMsg = (result.data && result.data.error_description) || (result.data && result.data.msg) || 'Signup failed';
      return jsonResponse(result.status, { ok: false, error: errMsg }, cors);
    }

    var session = result.data;
    var user = buildUser(session.user);

    if (session.access_token) {
      var respHeaders = Object.assign({}, cors);
      return jsonResponse(200, { ok: true, user: user }, respHeaders, sessionCookieHeaders(session));
    }

    // If email confirmation required, user is returned but no session
    return jsonResponse(200, { ok: true, user: user, confirmEmail: true }, cors);
  }

  // ── LOGOUT ──
  if (action === 'logout') {
    var token = cookies.afro_session;
    if (token) {
      // Revoke token server-side
      await supaFetch('/auth/v1/logout', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token },
      }).catch(function () {});
    }

    var respHeaders = Object.assign({}, cors);
    return jsonResponse(200, { ok: true }, respHeaders, clearCookieHeaders());
  }

  // ── SESSION (get current user) ──
  if (action === 'session' && event.httpMethod === 'GET') {
    var token = cookies.afro_session;
    if (!token) {
      return jsonResponse(200, { user: null, authenticated: false }, cors);
    }

    var result = await supaFetch('/auth/v1/user', {
      headers: { Authorization: 'Bearer ' + token },
    });

    if (result.status === 200 && result.data && result.data.id) {
      return jsonResponse(200, { user: buildUser(result.data), authenticated: true }, cors);
    }

    // Token expired — try refresh
    var refreshToken = cookies.afro_refresh;
    if (refreshToken) {
      var refreshResult = await supaFetch('/auth/v1/token?grant_type=refresh_token', {
        method: 'POST',
        body: { refresh_token: refreshToken },
      });

      if (refreshResult.status === 200 && refreshResult.data.access_token) {
        var newSession = refreshResult.data;
        var respHeaders = Object.assign({}, cors);
        return jsonResponse(200, { user: buildUser(newSession.user), authenticated: true, refreshed: true }, respHeaders, sessionCookieHeaders(newSession));
      }
    }

    // Both tokens invalid — clear cookies
    var clearHeaders = Object.assign({}, cors);
    return jsonResponse(200, { user: null, authenticated: false }, clearHeaders, clearCookieHeaders());
  }

  // ── REFRESH ──
  if (action === 'refresh' && event.httpMethod === 'POST') {
    var refreshToken = cookies.afro_refresh;
    if (!refreshToken) {
      return jsonResponse(401, { error: 'No refresh token' }, cors);
    }

    var result = await supaFetch('/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      body: { refresh_token: refreshToken },
    });

    if (result.status === 200 && result.data.access_token) {
      var session = result.data;
      var respHeaders = Object.assign({}, cors);
      return jsonResponse(200, { ok: true, user: buildUser(session.user) }, respHeaders, sessionCookieHeaders(session));
    }

    var clearHeaders = Object.assign({}, cors);
    return jsonResponse(401, { error: 'Refresh failed' }, clearHeaders, clearCookieHeaders());
  }

  return jsonResponse(404, { error: 'Unknown auth endpoint: ' + action }, cors);
};
