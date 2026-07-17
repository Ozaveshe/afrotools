const {
  normalizeSubtype,
  getSubtypeConfig,
  buildImportedSourceRecord,
  buildImportedDomainRecord,
  sbRequest
} = require('./market-data');

function buildMatchFilter(field, value) {
  if (value === null || value === undefined || value === '') return null;
  return field + '=eq.' + encodeURIComponent(String(value));
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

async function upsertSource(dataset, source) {
  const payload = buildImportedSourceRecord(dataset, source);
  const rows = await sbRequest(
    'POST',
    'market_data_sources?on_conflict=source_key',
    payload,
    { Prefer: 'resolution=merge-duplicates,return=representation' }
  );
  return ensureArray(rows)[0] || null;
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
  return ensureArray(rows)[0] || null;
}

async function finishRun(runId, patch) {
  if (!runId) return;
  await sbRequest('PATCH', 'market_data_source_runs?id=eq.' + runId, {
    ...patch,
    finished_at: new Date().toISOString()
  }, { Prefer: 'return=minimal' });
}

async function markSourceSuccess(sourceId) {
  if (!sourceId) return;
  await sbRequest('PATCH', 'market_data_sources?id=eq.' + sourceId, {
    last_success_at: new Date().toISOString(),
    last_error_at: null,
    updated_at: new Date().toISOString()
  }, { Prefer: 'return=minimal' });
}

async function markSourceFailure(sourceId) {
  if (!sourceId) return;
  await sbRequest('PATCH', 'market_data_sources?id=eq.' + sourceId, {
    last_error_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
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
    [
      buildMatchFilter('country_code', domainRecord.country_code),
      buildMatchFilter('provider_name', domainRecord.provider_name),
      buildMatchFilter('fee_type', domainRecord.fee_type),
      buildMatchFilter('amount_band', domainRecord.amount_band),
      buildMatchFilter('transaction_channel', domainRecord.transaction_channel),
      buildMatchFilter('customer_segment', domainRecord.customer_segment)
    ].filter(Boolean).forEach(function (item) {
      filters.push(item);
    });
  }

  if (subtype === 'remittance_quote') {
    [
      buildMatchFilter('provider_name', domainRecord.provider_name),
      buildMatchFilter('send_country', domainRecord.send_country),
      buildMatchFilter('receive_country', domainRecord.receive_country),
      buildMatchFilter('send_currency', domainRecord.send_currency),
      buildMatchFilter('receive_currency', domainRecord.receive_currency),
      buildMatchFilter('send_amount', domainRecord.send_amount),
      buildMatchFilter('payout_method', domainRecord.payout_method),
      buildMatchFilter('funding_method', domainRecord.funding_method)
    ].filter(Boolean).forEach(function (item) {
      filters.push(item);
    });
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

async function insertImportedRecords(dataset, sourceRow, records, options) {
  const table = getSubtypeConfig(dataset)?.table;
  if (!table) {
    throw new Error('No target table configured for dataset ' + dataset);
  }

  const publish = options?.publish !== false;
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

  return { inserted, published, skipped };
}

async function ingestDataset(dataset, source, records, options) {
  const normalizedDataset = normalizeSubtype(dataset) || dataset;
  const safeRecords = ensureArray(records);
  if (!normalizedDataset) throw new Error('dataset is required');
  if (!safeRecords.length) throw new Error('records array is required');

  const sourceRow = source?.id
    ? source
    : await upsertSource(normalizedDataset, source || {});
  if (!sourceRow?.id) {
    throw new Error('Failed to upsert source');
  }

  const run = await createRun(sourceRow.id, normalizedDataset, {
    publish: options?.publish !== false,
    requested_records: safeRecords.length,
    base_url: sourceRow.base_url || null,
    trigger: options?.trigger || 'manual',
    note: options?.note || null
  });

  try {
    const result = await insertImportedRecords(normalizedDataset, sourceRow, safeRecords, options);
    await markSourceSuccess(sourceRow.id);
    await finishRun(run?.id, {
      status: result.skipped.length ? 'partial' : 'success',
      records_seen: safeRecords.length,
      records_inserted: result.inserted,
      records_published: result.published,
      error_summary: result.skipped.length ? 'Skipped ' + result.skipped.length + ' invalid records' : null
    });
    return {
      source: sourceRow,
      run,
      records_seen: safeRecords.length,
      records_inserted: result.inserted,
      records_published: result.published,
      skipped: result.skipped
    };
  } catch (error) {
    await markSourceFailure(sourceRow.id);
    await finishRun(run?.id, {
      status: 'failed',
      records_seen: safeRecords.length,
      records_inserted: 0,
      records_published: 0,
      error_summary: error.message
    });
    throw error;
  }
}

async function listSummary(dataset) {
  const normalizedDataset = normalizeSubtype(dataset || '');
  const datasetFilter = normalizedDataset ? '&dataset=eq.' + encodeURIComponent(normalizedDataset) : '';
  const [sources, runs] = await Promise.all([
    sbRequest('GET', 'market_data_sources?select=*&order=updated_at.desc' + datasetFilter),
    sbRequest('GET', 'market_data_source_runs?select=*&order=started_at.desc&limit=20' + datasetFilter)
  ]);
  return {
    sources: ensureArray(sources),
    recent_runs: ensureArray(runs)
  };
}

async function listActiveSources(filters) {
  const parts = ['select=*', 'active=eq.true', 'order=source_key.asc'];
  const dataset = normalizeSubtype(filters?.dataset || '');
  if (dataset) parts.push('dataset=eq.' + encodeURIComponent(dataset));
  if (filters?.sourceKey) parts.push('source_key=eq.' + encodeURIComponent(filters.sourceKey));
  return ensureArray(await sbRequest('GET', 'market_data_sources?' + parts.join('&')));
}

module.exports = {
  upsertSource,
  createRun,
  finishRun,
  markSourceSuccess,
  markSourceFailure,
  supersedeCurrentRows,
  insertImportedRecords,
  ingestDataset,
  listSummary,
  listActiveSources
};
