'use strict';

// Only known operational labels and transport codes may enter diagnostics.
// Never serialize errors, URLs, headers, credentials or response bodies.
const DATASETS = new Set([
  'forex-latest', 'fuel-latest', 'rates-latest', 'commodity-prices-latest',
  'agri-inputs-latest', 'crypto-latest', 'electricity-latest',
  'insurance-rates-latest', 'property-prices-latest', 'salary-benchmarks-latest',
  'shipping-rates-latest', 'stock-indices-latest', 'telecom-latest',
  'meta', 'scraper_runs', 'data_confidence',
]);
const OPERATIONS = new Set([
  'supabase-read', 'supabase-write', 'supabase-insert', 'blob-read',
  'static-read', 'meta-update', 'failure-metadata', 'failure-log', 'fallback-refresh',
]);
const CODES = new Set([
  'ENOTFOUND', 'EAI_AGAIN', 'ECONNREFUSED', 'ECONNRESET', 'ENETUNREACH',
  'EHOSTUNREACH', 'ETIMEDOUT', 'UND_ERR_CONNECT_TIMEOUT',
  'UND_ERR_HEADERS_TIMEOUT', 'UND_ERR_BODY_TIMEOUT', 'UND_ERR_SOCKET',
  'CERT_HAS_EXPIRED', 'DEPTH_ZERO_SELF_SIGNED_CERT', 'SELF_SIGNED_CERT_IN_CHAIN',
  'UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'ERR_TLS_CERT_ALTNAME_INVALID',
]);

function storageDiagnostic(operation, dataset, error, status) {
  let code = 'UNKNOWN';
  if (Number.isInteger(status) && status >= 400 && status <= 599) {
    code = 'HTTP_' + status;
  } else if (error) {
    if (error.cause && CODES.has(error.cause.code)) code = error.cause.code;
    else if (CODES.has(error.code)) code = error.code;
    else if (error.name === 'AbortError') code = 'ABORTED';
    else if (error.name === 'TimeoutError') code = 'TIMEOUT';
  }
  return 'operation=' + (OPERATIONS.has(operation) ? operation : 'unlisted') +
    ' dataset=' + (DATASETS.has(dataset) ? dataset : 'unlisted') + ' code=' + code;
}

module.exports = { storageDiagnostic };
