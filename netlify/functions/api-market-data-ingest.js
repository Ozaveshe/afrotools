const { getAllowedOrigin } = require('./utils/cors');
const {
  SUPABASE_URL,
  SUPABASE_KEY,
  cleanText,
  normalizeSubtype,
  getSubtypeConfig,
  buildImportedSourceRecord,
  buildImportedDomainRecord,
  sbRequest
} = require('./_shared/market-data');

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

function buildMatchFilter(field, value) {
  if (value === null || value === undefined || value === '') return null;
  return field + '=eq.' + encodeURIComponent(String(value));
}

async function upsertSource(dataset, source) {
  const payload = buildImportedSourceRecord(dataset, source);
  const rows = await sbRequest(
    'POST',
    'market_data_sources?on_conflict=source_key',
    payload,
    {
      Prefer: 'resolution=merge-duplicates,return=representation'
    }
  );
  return Array.isArray(rows) ? rows[0] : null;
}

async function createRun(sourceId, dataset, payload) {
  const rows = await sbRequest('POST', 'market_data_source_runs', {
    source_id: sourceId,
    dataset,
    status: 'running',
    payload,
    started_at: new Date().toISOString()
  }, {
    Prefer: 'return=representation'
  });
  return Array.isArray(rows) ? rows[0] : null;
}

async function finishRun(runId, patch) {
  if (!runId) return;
  await sbRequest('PATCH', 'market_data_source_runs?id=eq.' + runId, {
    ...patch,
    finished_at: new Date().toISOString()
  }, { Prefer: 'return=minimal' });
}

async function supersedeCurrentRows(dataset, sourceId, domainRecord) {
  const subtype = normalizeSubtype(dataset);
  const table = getSubtypeConfig(subtype)?.table;
  if (!table || !sourceId) return;

  const filters = [
    'source_id=eq.' + encodeURIComponent(sourceId),
    'is_public=eq.true'
  ];

  if (subtype === 'fintech_fee') {
    [buildMatchFilter('country_code', domainRecord.country_code),
      buildMatchFilter('provider_name', domainRecord.provider_name),
      buildMatchFilter('fee_type', domainRecord.fee_type),
      buildMatchFilter('amount_band', domainRecord.amount_band),
      buildMatchFilter('transaction_channel', domainRecord.transaction_channel)
    ].filter(Boolean).forEach(function (item) { filters.push(item); });
  }

  if (subtype === 'remittance_quote') {
    [buildMatchFilter('provider_name', domainRecord.provider_name),
      buildMatchFilter('send_country', domainRecord.send_country),
      buildMatchFilter('receive_country', domainRecord.receive_country),
      buildMatchFilter('send_currency', domainRecord.send_currency),
      buildMatchFilter('receive_currency', domainRecord.receive_currency),
      buildMatchFilter('send_amount', domainRecord.send_amount),
      buildMatchFilter('payout_method', domainRecord.payout_method),
      buildMatchFilter('funding_method', domainRecord.funding_method)
    ].filter(Boolean).forEach(function (item) { filters.push(item); });
  }

  if (filters.length <= 2) return;

  await sbRequest('PATCH', table + '?' + filters.join('&'), {
    is_public: false,
    expires_at: new Date().toISOString(),
    last_checked_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    review_status: 'superseded'
  }, { Prefer: 'return=minimal' });
}

async function listSummary(dataset) {
  const datasetFilter = dataset ? '&dataset=eq.' + encodeURIComponent(dataset) : '';
  const [sources, runs] = await Promise.all([
    sbRequest('GET', 'market_data_sources?select=*&order=updated_at.desc' + datasetFilter),
    sbRequest('GET', 'market_data_source_runs?select=*&order=started_at.desc&limit=20' + datasetFilter)
  ]);
  return {
    sources: Array.isArray(sources) ? sources : [],
    recent_runs: Array.isArray(runs) ? runs : []
  };
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

  const publish = body.publish !== false;
  let runId = null;

  try {
    const sourceRow = await upsertSource(dataset, body.source || {});
    if (!sourceRow?.id) {
      return reply(500, { error: 'Failed to upsert source' }, headers);
    }

    const run = await createRun(sourceRow.id, dataset, {
      publish,
      requested_records: records.length,
      base_url: sourceRow.base_url || null
    });
    runId = run?.id || null;

    const table = getSubtypeConfig(dataset)?.table;
    let inserted = 0;
    let published = 0;
    const skipped = [];

    for (let index = 0; index < records.length; index += 1) {
      const record = records[index];
      const domainRecord = buildImportedDomainRecord(dataset, sourceRow, record, { publish });
      if (!domainRecord || !domainRecord.country_code || !domainRecord.city) {
        skipped.push({ index, reason: 'invalid_record' });
        continue;
      }

      await supersedeCurrentRows(dataset, sourceRow.id, domainRecord);
      await sbRequest('POST', table, domainRecord, { Prefer: 'return=minimal' });
      inserted += 1;
      if (publish) published += 1;
    }

    await sbRequest('PATCH', 'market_data_sources?id=eq.' + sourceRow.id, {
      last_success_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, { Prefer: 'return=minimal' });

    await finishRun(runId, {
      status: skipped.length ? 'partial' : 'success',
      records_seen: records.length,
      records_inserted: inserted,
      records_published: published,
      error_summary: skipped.length ? 'Skipped ' + skipped.length + ' invalid records' : null
    });

    return reply(200, {
      ok: true,
      dataset,
      source_id: sourceRow.id,
      records_seen: records.length,
      records_inserted: inserted,
      records_published: published,
      skipped
    }, headers);
  } catch (error) {
    if (runId) {
      await finishRun(runId, {
        status: 'failed',
        records_seen: records.length,
        records_inserted: 0,
        records_published: 0,
        error_summary: error.message
      });
    }
    return reply(500, { error: 'Ingest failed', detail: error.message }, headers);
  }
};
