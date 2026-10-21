const SUPABASE_URL = process.env.SUPABASE_AUTH_URL || 'https://zpclagtgczsygrgztlts.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY_AUTH;
const IS_PROD = process.env.URL && process.env.URL.includes('afrotools.com');

function parseCookies(cookieHeader) {
  var cookies = {};
  if (!cookieHeader) return cookies;

  String(cookieHeader).split(';').forEach(function (part) {
    var segments = part.trim().split('=');
    if (segments.length < 2) return;
    cookies[segments[0].trim()] = decodeURIComponent(segments.slice(1).join('='));
  });

  return cookies;
}

function setCookie(name, value, maxAge) {
  var parts = [name + '=' + encodeURIComponent(value || '')];
  parts.push('HttpOnly');
  parts.push('Secure');
  parts.push('SameSite=Lax');
  parts.push('Path=/');
  if (IS_PROD) parts.push('Domain=.afrotools.com');
  if (maxAge) parts.push('Max-Age=' + maxAge);
  return parts.join('; ');
}

function buildSessionResponse(session) {
  if (!session || !session.access_token || !session.refresh_token) {
    return {
      headers: {},
      multiValueHeaders: {},
    };
  }

  return {
    headers: {},
    multiValueHeaders: {
      'Set-Cookie': [
        setCookie('afro_session', session.access_token, session.expires_in || 3600),
        setCookie('afro_refresh', session.refresh_token, 30 * 24 * 3600),
      ],
    },
  };
}

class AuthProviderUnavailable extends Error {
  constructor() { super('Authentication provider temporarily unavailable'); this.name = 'AuthProviderUnavailable'; }
}

async function fetchSupabase(path, options, context) {
  if (!SUPABASE_ANON_KEY) {
    if (context) throw new AuthProviderUnavailable();
    return { ok: false, status: 500, data: null };
  }

  var config = options || {};
  var response;
  var text;
  try {
    response = await fetch(SUPABASE_URL + path, {
      method: config.method || 'GET',
      headers: Object.assign({
        apikey: SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      }, config.headers || {}),
      body: config.body ? JSON.stringify(config.body) : undefined,
      ...(context ? { signal: context.controller.signal } : {}),
    });
    if (context && (response.status === 429 || response.status >= 500)) {
      context.controller.abort();
      throw new AuthProviderUnavailable();
    }
    text = await response.text();
  } catch (error) {
    if (context) throw new AuthProviderUnavailable();
    throw error;
  }
  var data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch (error) {
    data = text || null;
  }

  return {
    ok: response.ok,
    status: response.status,
    data: data,
  };
}

async function getUserFromAccessToken(token, context) {
  if (!token) return null;
  if (!SUPABASE_ANON_KEY) {
    if (context) throw new AuthProviderUnavailable();
    return null;
  }

  var result = await fetchSupabase('/auth/v1/user', {
    headers: {
      Authorization: 'Bearer ' + token,
    },
  }, context);

  if (!result.ok || !result.data || !result.data.id) return null;
  return result.data;
}

async function refreshSession(refreshToken, context) {
  if (!refreshToken) return null;
  if (!SUPABASE_ANON_KEY) {
    if (context) throw new AuthProviderUnavailable();
    return null;
  }

  var result = await fetchSupabase('/auth/v1/token?grant_type=refresh_token', {
    method: 'POST',
    body: {
      refresh_token: refreshToken,
    },
  }, context);

  if (!result.ok || !result.data || !result.data.access_token) return null;
  return result.data;
}

async function resolveUserFromEvent(event, context) {
  var headers = (event && event.headers) || {};
  var authHeader = headers.authorization || headers.Authorization || '';

  if (authHeader && authHeader.indexOf('Bearer ') === 0) {
    var bearerUser = await getUserFromAccessToken(authHeader.replace(/^Bearer\s+/, ''), context);
    if (bearerUser) {
      return {
        user: bearerUser,
        sessionResponse: {
          headers: {},
          multiValueHeaders: {},
        },
      };
    }
  }

  var cookies = parseCookies(headers.cookie || headers.Cookie || '');

  if (cookies.afro_session) {
    var cookieUser = await getUserFromAccessToken(cookies.afro_session, context);
    if (cookieUser) {
      return {
        user: cookieUser,
        sessionResponse: {
          headers: {},
          multiValueHeaders: {},
        },
      };
    }
  }

  if (cookies.afro_refresh) {
    var session = await refreshSession(cookies.afro_refresh, context);
    if (session && session.user && session.user.id) {
      return {
        user: session.user,
        sessionResponse: buildSessionResponse(session),
      };
    }
  }

  return {
    user: null,
    sessionResponse: {
      headers: {},
      multiValueHeaders: {},
    },
  };
}

// Only the two profile routes opt in. Other callers retain their existing contract.
async function getUserFromEvent(event, options) {
  if (!options || !options.requestBudget) return resolveUserFromEvent(event);
  try { return await options.requestBudget.wait(() => resolveUserFromEvent(event, options.requestBudget)); }
  catch (error) {
    if (!error || error.name !== 'ProfileRequestUnavailable') throw error;
    return { user: null, providerUnavailable: true, sessionResponse: { headers: {}, multiValueHeaders: {} } };
  }
}

module.exports = {
  getUserFromEvent,
};
