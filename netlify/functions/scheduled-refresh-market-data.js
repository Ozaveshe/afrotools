const { getAllowedOrigin } = require('./utils/cors');
const { SUPABASE_URL, SUPABASE_KEY, normalizeSubtype } = require('./_shared/market-data');
const { refreshActiveMarketData } = require('./_shared/market-data-refresh');

function getHeader(event, headerName) {
  const headers = event?.headers || {};
  const expected = String(headerName || '').toLowerCase();
  for (const key of Object.keys(headers)) {
    if (key.toLowerCase() === expected) return headers[key];
  }
  return '';
}

function getAdminSecret() {
  return String(process.env.ADMIN_KEY || process.env.ADMIN_SECRET || '').trim().replace(/^['"]|['"]$/g, '');
}

function isScheduledInvocation(event) {
  return getHeader(event, 'x-nf-event') === 'schedule';
}

function corsHeaders(event) {
  return {
    'Access-Control-Allow-Origin': getAllowedOrigin(event),
    'Access-Control-Allow-Headers': 'Content-Type, x-admin-key',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
    Vary: 'Origin'
  };
}

function reply(statusCode, body, headers) {
  return {
    statusCode,
    headers,
    body: JSON.stringify(body)
  };
}

exports.handler = async function (event) {
  const headers = corsHeaders(event);

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  const scheduled = isScheduledInvocation(event);
  if (!scheduled && event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
    return reply(405, { error: 'Method not allowed' }, headers);
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return reply(500, { error: 'Supabase service key not configured' }, headers);
  }

  if (!scheduled) {
    const adminKey = getHeader(event, 'x-admin-key');
    const adminSecret = getAdminSecret();
    if (!adminKey || !adminSecret || adminKey !== adminSecret) {
      return reply(401, { error: 'Unauthorized' }, headers);
    }
  }

  let requestedDataset = normalizeSubtype(event.queryStringParameters?.dataset || '');
  let requestedSourceKey = event.queryStringParameters?.source_key || '';

  if (event.httpMethod === 'POST' && event.body) {
    try {
      const body = JSON.parse(event.body);
      requestedDataset = normalizeSubtype(body.dataset || '') || requestedDataset;
      requestedSourceKey = body.source_key || requestedSourceKey;
    } catch {
      return reply(400, { error: 'Invalid JSON' }, headers);
    }
  }

  const result = await refreshActiveMarketData({
    dataset: requestedDataset || null,
    sourceKey: requestedSourceKey || null,
    publish: true,
    trigger: scheduled ? 'netlify-schedule' : 'manual-refresh'
  });

  return reply(result.ok ? 200 : 207, {
    ok: result.ok,
    scheduled,
    dataset: requestedDataset || null,
    source_key: requestedSourceKey || null,
    ...result
  }, headers);
};
