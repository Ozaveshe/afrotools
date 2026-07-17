const { createHmac } = require('crypto');

const SUPABASE_URL = process.env.SUPABASE_AUTH_URL || 'https://zpclagtgczsygrgztlts.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY_AUTH ||
  process.env.SUPABASE_ANON_KEY ||
  '';

function getHeader(headers, name) {
  headers = headers || {};
  const wanted = String(name || '').toLowerCase();
  const key = Object.keys(headers).find((item) => item.toLowerCase() === wanted);
  return key ? headers[key] : '';
}

function getBearerToken(event) {
  const auth = String(getHeader(event && event.headers, 'authorization') || '');
  const match = auth.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : '';
}

function verifyLegacyToken(token, secret) {
  if (!token || !secret || !token.includes('.')) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const expected = createHmac('sha256', secret).update(parts[0]).digest('base64url');
  if (parts[1] !== expected) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
    if (payload.exp && payload.exp < Date.now()) return null;
    return {
      userId: payload.userId || payload.sub || payload.id,
      email: payload.email || '',
      name: payload.name || '',
      emailVerified: payload.emailVerified !== false && payload.email_verified !== false,
      source: 'legacy'
    };
  } catch (err) {
    return null;
  }
}

function buildSupabaseUser(supaUser) {
  const metadata = supaUser.user_metadata || {};
  const provider = (supaUser.app_metadata && supaUser.app_metadata.provider) || '';
  const emailVerified = Boolean(
    supaUser.email_confirmed_at ||
    supaUser.confirmed_at ||
    supaUser.email_verified ||
    (provider && provider !== 'email')
  );
  return {
    userId: supaUser.id,
    email: supaUser.email || '',
    name: metadata.name || metadata.full_name || (supaUser.email || '').split('@')[0],
    emailVerified,
    source: 'supabase',
    raw: supaUser
  };
}

async function resolveAuthenticatedUser(event, options) {
  options = options || {};
  const token = getBearerToken(event);
  if (!token) {
    return { error: 'Sign in before managing API keys.', status: 401 };
  }

  const legacyUser = verifyLegacyToken(token, process.env.AUTH_SECRET);
  if (legacyUser && legacyUser.userId) {
    if (options.requireVerifiedEmail && !legacyUser.emailVerified) {
      return { error: 'Verify your email before creating API keys.', status: 403 };
    }
    return legacyUser;
  }

  if (!SUPABASE_ANON_KEY) {
    return { error: 'Auth is not configured for API key management.', status: 500 };
  }

  try {
    const res = await fetch(SUPABASE_URL + '/auth/v1/user', {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: 'Bearer ' + token
      }
    });

    if (!res.ok) {
      return { error: 'Session expired. Sign in again to manage API keys.', status: 401 };
    }

    const supaUser = await res.json();
    const user = buildSupabaseUser(supaUser);
    if (!user.userId) {
      return { error: 'Session could not be verified.', status: 401 };
    }
    if (options.requireVerifiedEmail && !user.emailVerified) {
      return { error: 'Verify your email before creating API keys.', status: 403 };
    }
    return user;
  } catch (err) {
    console.error('[supabase-session] verification failed:', err.message);
    return { error: 'Could not verify your session. Try again.', status: 503 };
  }
}

module.exports = { resolveAuthenticatedUser };
