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
 *   GET  /api/auth/session   — returns current user from cookie or verified Bearer token
 *   POST /api/auth/refresh  — refreshes token using refresh_token cookie
 *
 * Cookies set:
 *   afro_session  — access_token  (HttpOnly, Secure, SameSite=Lax, 1h)
 *   afro_refresh  — refresh_token (HttpOnly, Secure, SameSite=Lax, 30d)
 */

const { corsHeaders, corsResponse, getAllowedOrigin } = require('./utils/cors');
const { getMarketingSupabaseConfig } = require('./_shared/email-marketing-config');
const { sendLifecycleEmail } = require('./_shared/lifecycle-email');

const SUPABASE_URL = process.env.SUPABASE_AUTH_URL || 'https://zpclagtgczsygrgztlts.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY_AUTH;
const IS_PROD = process.env.URL && process.env.URL.includes('afrotools.com');
const MARKETING_SUPABASE = getMarketingSupabaseConfig();
const AUTH_UPSTREAM_TIMEOUT_MS = 12000;
const AUTH_UNAVAILABLE_MESSAGE = 'Sign-in service is temporarily unavailable. Please wait a moment and try again.';

// Cookie settings
const COOKIE_OPTS = {
  httpOnly: true,
  secure: true,
  sameSite: 'Lax',
  path: '/',
  domain: IS_PROD ? '.afrotools.com' : undefined,
};

function setCookie(name, value, maxAge, options) {
  options = options || {};
  var parts = [name + '=' + encodeURIComponent(value)];
  parts.push('HttpOnly');
  parts.push('Secure');
  parts.push('SameSite=Lax');
  parts.push('Path=/');
  var includeDomain = options.domain === undefined ? IS_PROD : !!options.domain;
  if (includeDomain) parts.push('Domain=.afrotools.com');
  if (maxAge !== undefined && maxAge !== null) parts.push('Max-Age=' + maxAge);
  if (maxAge === 0) parts.push('Expires=Thu, 01 Jan 1970 00:00:00 GMT');
  return parts.join('; ');
}

function clearCookie(name, options) {
  return setCookie(name, '', 0, options);
}

function clearCookieVariants(name) {
  var headers = [clearCookie(name, { domain: false })];
  if (IS_PROD) headers.push(clearCookie(name, { domain: true }));
  return headers;
}

function setCookieVariants(name, value, maxAge) {
  var headers = [];
  if (IS_PROD) headers.push(clearCookie(name, { domain: false }));
  headers.push(setCookie(name, value, maxAge));
  return headers;
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

function getHeader(headers, name) {
  headers = headers || {};
  var wanted = String(name || '').toLowerCase();
  var keys = Object.keys(headers);
  for (var i = 0; i < keys.length; i++) {
    if (keys[i].toLowerCase() === wanted) return headers[keys[i]];
  }
  return '';
}

function getBearerToken(headers) {
  var auth = String(getHeader(headers, 'authorization') || '');
  var match = auth.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : '';
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

function rawRequestBody(event) {
  var body = event.body || '';
  if (event.isBase64Encoded) {
    try { return Buffer.from(body, 'base64').toString('utf8'); } catch (e) { return ''; }
  }
  return body;
}

function parseRequestBody(event) {
  var contentType = String((event.headers && (event.headers['content-type'] || event.headers['Content-Type'])) || '').toLowerCase();
  var raw = rawRequestBody(event);
  if (contentType.indexOf('application/x-www-form-urlencoded') !== -1 || contentType.indexOf('multipart/form-data') !== -1) {
    var formBody = {};
    try {
      var params = new URLSearchParams(raw);
      params.forEach(function (value, key) { formBody[key] = value; });
      return { body: formBody, isForm: true };
    } catch (e) {
      return { body: {}, isForm: true, error: 'Invalid form submission' };
    }
  }
  try {
    return { body: JSON.parse(raw || '{}'), isForm: false };
  } catch (e) {
    return { body: {}, isForm: false, error: 'Invalid JSON' };
  }
}

function safeRedirectTarget(value, fallback) {
  var target = String(value || '').trim();
  if (!target || target.charAt(0) !== '/' || target.indexOf('//') === 0 || target.indexOf('\\') !== -1) {
    return fallback || '/dashboard/';
  }
  return target;
}

function redirectResponse(location, extraHeaders, multiValueHeaders) {
  var headers = Object.assign({}, extraHeaders || {}, {
    Location: location,
    'Cache-Control': 'no-store',
  });
  var response = { statusCode: 303, headers: headers, body: '' };
  if (multiValueHeaders && Object.keys(multiValueHeaders).length) {
    response.multiValueHeaders = multiValueHeaders;
  }
  return response;
}

function authErrorResponse(mode, statusCode, message, cors, isForm, next) {
  if (isForm) {
    var location = '/auth/?mode=' + encodeURIComponent(mode || 'login') + '&error=' + encodeURIComponent(message || 'Auth failed');
    if (next) location += '&next=' + encodeURIComponent(safeRedirectTarget(next, '/dashboard/'));
    return redirectResponse(location, cors);
  }
  return jsonResponse(statusCode, { ok: false, error: message }, cors);
}

function authSuccessResponse(statusCode, body, cors, multiValueHeaders, isForm, next) {
  if (isForm) {
    return redirectResponse(safeRedirectTarget(next, '/dashboard/'), cors, multiValueHeaders);
  }
  return jsonResponse(statusCode, body, cors, multiValueHeaders);
}

function sessionCookieHeaders(session) {
  return {
    'Set-Cookie': [].concat(
      setCookieVariants('afro_session', session.access_token, session.expires_in || 3600),
      setCookieVariants('afro_refresh', session.refresh_token, 30 * 24 * 3600)
    ),
  };
}

function accessCookieHeaders(accessToken, maxAge) {
  return {
    'Set-Cookie': setCookieVariants('afro_session', accessToken, maxAge || 3600),
  };
}

function clearCookieHeaders() {
  return {
    'Set-Cookie': [].concat(
      clearCookieVariants('afro_session'),
      clearCookieVariants('afro_refresh')
    ),
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
  var controller = typeof AbortController === 'function' ? new AbortController() : null;
  var timeout = controller ? setTimeout(function () { controller.abort(); }, AUTH_UPSTREAM_TIMEOUT_MS) : null;

  try {
    var res = await fetch(url, {
      method: opts.method || 'GET',
      headers: headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      signal: controller ? controller.signal : undefined,
    });
    var data = null;
    try { data = await res.json(); } catch (e) { data = {}; }
    return { status: res.status, data: data || {} };
  } catch (error) {
    console.warn('[auth-session] Supabase Auth request unavailable:', error && error.name ? error.name : 'network-error');
    return {
      status: 503,
      data: { error_code: 'auth_upstream_unavailable', msg: AUTH_UNAVAILABLE_MESSAGE },
      unavailable: true,
    };
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

function authProviderError(result, fallbackStatus, fallbackMessage) {
  var status = Number(result && result.status) || fallbackStatus;
  var data = result && result.data ? result.data : {};

  if (status >= 500 || result && result.unavailable) {
    return { status: 503, message: AUTH_UNAVAILABLE_MESSAGE };
  }
  if (status === 429) {
    return { status: 429, message: 'Too many sign-in attempts. Please wait a moment and try again.' };
  }

  return {
    status: fallbackStatus,
    message: data.error_description || data.msg || data.message || fallbackMessage,
  };
}

async function profileEmailState(userId) {
  if (!userId || !MARKETING_SUPABASE.serviceKey) return null;
  try {
    var res = await fetch(
      MARKETING_SUPABASE.url + '/rest/v1/profiles?id=eq.' + encodeURIComponent(userId) + '&select=email_unsubscribe_token,email_digest_enabled,email_welcome_sent_at&limit=1',
      {
        headers: {
          apikey: MARKETING_SUPABASE.serviceKey,
          Authorization: 'Bearer ' + MARKETING_SUPABASE.serviceKey,
        },
      }
    );
    if (!res.ok) return null;
    var rows = await res.json();
    return rows && rows[0] ? rows[0] : null;
  } catch (e) {
    return null;
  }
}

async function markSignupWelcomeSent(userId) {
  if (!userId || !MARKETING_SUPABASE.serviceKey) return;
  try {
    await fetch(
      MARKETING_SUPABASE.url + '/rest/v1/profiles?id=eq.' + encodeURIComponent(userId),
      {
        method: 'PATCH',
        headers: {
          apikey: MARKETING_SUPABASE.serviceKey,
          Authorization: 'Bearer ' + MARKETING_SUPABASE.serviceKey,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({ email_welcome_sent_at: new Date().toISOString() }),
      }
    );
  } catch (e) {
    console.warn('[auth-session] welcome email status update skipped:', e && e.message ? e.message : e);
  }
}

async function sendSignupWelcome(user, body) {
  if (!user || !user.email) return;
  try {
    var state = await profileEmailState(user.id);
    if (state && (state.email_digest_enabled === false || state.email_welcome_sent_at)) return;
    var token = state && state.email_unsubscribe_token;
    var result = await sendLifecycleEmail('signup_welcome', {
      email: user.email,
      name: user.name || body.name || '',
      unsubscribeUrl: token ? 'https://afrotools.com/api/email/unsubscribe?token=' + encodeURIComponent(token) : '',
    });
    if (result.ok) await markSignupWelcomeSent(user.id);
  } catch (e) {
    console.warn('[auth-session] welcome email skipped:', e && e.message ? e.message : e);
  }
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
  var bearerToken = getBearerToken(requestHeaders);

  if (!SUPABASE_ANON_KEY) {
    if (action === 'logout') {
      return jsonResponse(200, { ok: true }, Object.assign({}, cors), clearCookieHeaders());
    }
    if (action === 'session' && event.httpMethod === 'GET' && !cookies.afro_session && !cookies.afro_refresh && !bearerToken) {
      return jsonResponse(200, { user: null, authenticated: false }, cors);
    }
    return jsonResponse(500, { error: 'Server config error: missing auth key' }, cors);
  }

  // ── LOGIN ──
  if (action === 'login' && event.httpMethod === 'POST') {
    var parsed = parseRequestBody(event);
    var body = parsed.body;
    var loginNext = safeRedirectTarget(body.next || body.redirect || '/dashboard/', '/dashboard/');
    if (parsed.error) {
      return authErrorResponse('login', 400, parsed.error, cors, parsed.isForm, loginNext);
    }
    if (!body.email || !body.password) {
      return authErrorResponse('login', 400, 'Email and password required', cors, parsed.isForm, loginNext);
    }

    var result = await supaFetch('/auth/v1/token?grant_type=password', {
      method: 'POST',
      body: { email: body.email.trim().toLowerCase(), password: body.password },
    });

    if (result.status !== 200 || !result.data.access_token) {
      var loginError = authProviderError(result, 401, 'Invalid credentials');
      return authErrorResponse('login', loginError.status, loginError.message, cors, parsed.isForm, loginNext);
    }

    var session = result.data;
    var user = buildUser(session.user);

    var respHeaders = Object.assign({}, cors);
    return authSuccessResponse(200, { ok: true, user: user }, respHeaders, sessionCookieHeaders(session), parsed.isForm, loginNext);
  }

  // ── SIGNUP ──
  if (action === 'signup' && event.httpMethod === 'POST') {
    var parsed = parseRequestBody(event);
    var body = parsed.body;
    var signupNext = safeRedirectTarget(body.next || body.redirect || '/dashboard/', '/dashboard/');
    if (parsed.error) {
      return authErrorResponse('signup', 400, parsed.error, cors, parsed.isForm, signupNext);
    }
    if (!body.email || !body.password || body.password.length < 6) {
      return authErrorResponse('signup', 400, 'Email and password (min 6 chars) required', cors, parsed.isForm, signupNext);
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
      var signupError = authProviderError(result, result.status || 400, 'Signup failed');
      return authErrorResponse('signup', signupError.status, signupError.message, cors, parsed.isForm, signupNext);
    }

    var session = result.data;
    var user = buildUser(session.user);
    if (!body.skipWelcome && !body.skip_welcome) {
      await sendSignupWelcome(user, body);
    }

    if (session.access_token) {
      var respHeaders = Object.assign({}, cors);
      return authSuccessResponse(200, { ok: true, user: user }, respHeaders, sessionCookieHeaders(session), parsed.isForm, signupNext);
    }

    // If email confirmation required, user is returned but no session
    if (parsed.isForm) {
      return redirectResponse('/auth/?mode=login&confirm=email&next=' + encodeURIComponent(signupNext), cors);
    }
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
    var token = cookies.afro_session || bearerToken;
    var tokenFromBearer = !!(!cookies.afro_session && bearerToken);
    if (!token) {
      return jsonResponse(200, { user: null, authenticated: false }, cors);
    }

    var result = await supaFetch('/auth/v1/user', {
      headers: { Authorization: 'Bearer ' + token },
    });

    if (result.status === 200 && result.data && result.data.id) {
      var user = buildUser(result.data);
      if (tokenFromBearer) {
        var bearerHeaders = Object.assign({}, cors);
        return jsonResponse(200, { user: user, authenticated: true, bridged: true }, bearerHeaders, accessCookieHeaders(token));
      }
      return jsonResponse(200, { user: user, authenticated: true }, cors);
    }

    if (tokenFromBearer) {
      return jsonResponse(401, { user: null, authenticated: false, error: 'Session token expired. Sign in again.' }, cors);
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
