const { getAllowedOrigin } = require('./utils/cors');
const { getAuthClient } = require('./_shared/scholarship-platform');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://afrotools.com',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json'
};

function jsonResponse(statusCode, body) {
  return {
    statusCode: statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(body)
  };
}

function toPositiveInteger(value, fallback, max) {
  const parsed = parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max || parsed);
}

function hasAwardValue(row) {
  return !!(row && (
    row.award_value_min != null ||
    row.award_value_max != null ||
    String(row.award_value_text || '').trim()
  ));
}

function buildKey(row) {
  return String(
    row.official_url ||
    row.source_url ||
    row.title ||
    row.slug ||
    ''
  ).trim().toLowerCase();
}

function normalizeRow(row) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.title,
    title: row.title,
    provider: row.provider || '',
    application_url: row.official_url || row.source_url || '',
    info_url: row.official_url || row.source_url || '',
    source_url: row.source_url || row.official_url || '',
    official_url: row.official_url || row.source_url || '',
    key: buildKey(row),
    award_value_min: row.award_value_min,
    award_value_max: row.award_value_max,
    award_value_currency: row.award_value_currency || '',
    award_value_period: row.award_value_period || '',
    award_value_text: row.award_value_text || '',
    award_components: Array.isArray(row.award_components) ? row.award_components : [],
    award_value_confidence: row.award_value_confidence || '',
    award_value_source_url: row.award_value_source_url || row.official_url || row.source_url || '',
    award_value_last_checked_at: row.award_value_last_checked_at || null
  };
}

exports.handler = async function (event) {
  CORS_HEADERS['Access-Control-Allow-Origin'] = getAllowedOrigin(event);

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  const client = getAuthClient();
  if (!client) {
    return jsonResponse(503, {
      error: 'Scholarship value service unavailable',
      detail: 'Supabase auth client is not configured'
    });
  }

  const params = event.queryStringParameters || {};
  const limit = toPositiveInteger(params.limit, 300, 600);

  const { data, error } = await client
    .from('scholarships')
    .select([
      'id',
      'slug',
      'title',
      'provider',
      'source_url',
      'official_url',
      'award_value_min',
      'award_value_max',
      'award_value_currency',
      'award_value_period',
      'award_value_text',
      'award_components',
      'award_value_confidence',
      'award_value_source_url',
      'award_value_last_checked_at',
      'is_featured',
      'deadline_date'
    ].join(','))
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .order('deadline_date', { ascending: true, nullsFirst: false })
    .order('title', { ascending: true })
    .limit(limit);

  if (error) {
    return jsonResponse(500, {
      error: 'Failed to load scholarship values',
      detail: error.message
    });
  }

  const rows = (data || []).filter(hasAwardValue).map(normalizeRow);

  return jsonResponse(200, {
    items: rows,
    count: rows.length,
    totalScanned: (data || []).length,
    valueCoverage: rows.length + '/' + (data || []).length,
    source: 'public.scholarships.award_value_*'
  });
};
