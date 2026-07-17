const { getAllowedOrigin } = require('./utils/cors');
const {
  SUPABASE_URL,
  SUPABASE_KEY,
  normalizeSubtype,
  cleanText
} = require('./_shared/market-data');
const {
  ingestDataset,
  listSummary
} = require('./_shared/market-data-ingest');

function corsHeaders(event) {
  return {
    'Access-Control-Allow-Origin': getAllowedOrigin(event),
    'Access-Control-Allow-Headers': 'Content-Type, x-admin-key',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
    'Vary': 'Origin'
  };
}

function reply(statusCode, body, headers) {
  return { statusCode, headers, body: JSON.stringify(body) };
}

function getHeader(event, headerName) {
  const headers = event.headers || {};
  const expected = headerName.toLowerCase();
  for (const key of Object.keys(headers)) {
    if (key.toLowerCase() === expected) return headers[key];
  }
  return '';
}

function getAdminSecret() {
  return String(process.env.ADMIN_KEY || process.env.ADMIN_SECRET || '').trim().replace(/^['"]|['"]$/g, '');
}

exports.handler = async function (event) {
  const headers = corsHeaders(event);

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') return reply(405, { error: 'Method not allowed' }, headers);

  const adminKey = getHeader(event, 'x-admin-key');
  const adminSecret = getAdminSecret();
  if (!adminKey || !adminSecret || adminKey !== adminSecret) {
    return reply(401, { error: 'Unauthorized' }, headers);
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return reply(500, { error: 'Supabase service key not configured' }, headers);
  }

  if (event.httpMethod === 'GET') {
    const dataset = normalizeSubtype(event.queryStringParameters?.dataset || '');
    const summary = await listSummary(dataset);
    return reply(200, { ok: true, dataset: dataset || null, ...summary }, headers);
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return reply(400, { error: 'Invalid JSON' }, headers);
  }

  const dataset = normalizeSubtype(body.dataset || body.subtype || body.category || '');
  if (!dataset || !['fintech_fee', 'remittance_quote'].includes(dataset)) {
    return reply(400, { error: 'dataset must be fintech_fee or remittance_quote' }, headers);
  }

  const records = Array.isArray(body.records) ? body.records : [];
  if (!records.length) {
    return reply(400, { error: 'records array is required' }, headers);
  }

  try {
    const result = await ingestDataset(dataset, body.source || {}, records, {
      publish: body.publish !== false,
      trigger: 'api-market-data-ingest',
      note: cleanText(body.note)
    });

    return reply(200, {
      ok: true,
      dataset,
      source_id: result.source.id,
      records_seen: result.records_seen,
      records_inserted: result.records_inserted,
      records_published: result.records_published,
      skipped: result.skipped
    }, headers);
  } catch (error) {
    return reply(500, { error: 'Ingest failed', detail: error.message }, headers);
  }
};
