const SUPABASE_URL = process.env.SUPABASE_AUTH_URL || 'https://zpclagtgczsygrgztlts.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_AUTH_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_DATA_SERVICE_ROLE_KEY;

function getAllowedOrigin(event) {
  const origin = event && event.headers ? event.headers.origin || '' : '';
  const allowed = origin === 'https://afrotools.com' ||
    origin === 'https://www.afrotools.com' ||
    origin.endsWith('.netlify.app') ||
    origin.startsWith('http://localhost') ||
    origin.startsWith('http://127.0.0.1');
  return allowed ? origin : 'https://afrotools.com';
}

function corsHeaders(event, methods) {
  return {
    'Access-Control-Allow-Origin': getAllowedOrigin(event),
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': methods || 'GET, OPTIONS',
    'Content-Type': 'application/json',
    'Cache-Control': 'private, no-store, max-age=0',
    Vary: 'Origin, Authorization'
  };
}

function reply(statusCode, body, headers) {
  return {
    statusCode,
    headers,
    body: JSON.stringify(body)
  };
}

function parseLimit(value, fallback, max) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
}

function cleanText(value, maxLength) {
  return String(value == null ? '' : value)
    .trim()
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .slice(0, maxLength || 200);
}

async function supabaseRest(path, options) {
  if (!SUPABASE_KEY) {
    const error = new Error('Supabase service key is not configured.');
    error.code = 'SUPABASE_NOT_CONFIGURED';
    throw error;
  }

  const response = await fetch(SUPABASE_URL + '/rest/v1/' + path, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: 'Bearer ' + SUPABASE_KEY,
      'Content-Type': 'application/json',
      ...(options && options.headers ? options.headers : {})
    }
  });

  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  if (!response.ok) {
    const error = new Error('Supabase request failed.');
    error.status = response.status;
    error.body = body;
    throw error;
  }

  return body;
}

module.exports = {
  SUPABASE_KEY,
  cleanText,
  corsHeaders,
  parseLimit,
  reply,
  supabaseRest
};
