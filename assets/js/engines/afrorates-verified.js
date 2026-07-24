(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.AfroRatesVerified = api;
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var OFFICIAL_HOSTS = Object.freeze([
    'cbn.gov.ng',
    'centralbank.go.ke',
    'resbank.co.za',
    'bceao.int',
    'bkam.ma'
  ]);
  var MAX_FUTURE_SKEW_MS = 5 * 60 * 1000;

  function finiteNumber(value) {
    return typeof value === 'number' && Number.isFinite(value);
  }

  function ageDays(value, now) {
    var date = new Date(value);
    var reference = now ? new Date(now) : new Date();
    if (!Number.isFinite(date.getTime()) || !Number.isFinite(reference.getTime())) return Infinity;
    if (date.getTime() > reference.getTime() + MAX_FUTURE_SKEW_MS) return Infinity;
    return Math.max(0, Math.floor((reference.getTime() - date.getTime()) / 86400000));
  }

  function isNotFuture(value, now) {
    var date = new Date(value);
    var reference = now ? new Date(now) : new Date();
    return Number.isFinite(date.getTime()) && Number.isFinite(reference.getTime()) && date.getTime() <= reference.getTime() + MAX_FUTURE_SKEW_MS;
  }

  function isOfficialUrl(value) {
    try {
      var url = new URL(value);
      var host = url.hostname.toLowerCase().replace(/^www\./, '');
      return url.protocol === 'https:' && OFFICIAL_HOSTS.some(function (allowed) {
        return host === allowed || host.endsWith('.' + allowed);
      });
    } catch (_) {
      return false;
    }
  }

  function verifiedCodes(dataset) {
    var codes = dataset && dataset._verification && dataset._verification.verified_codes;
    return new Set(Array.isArray(codes) ? codes.map(function (code) { return String(code).toUpperCase(); }) : []);
  }

  function isVerifiedPolicyRow(row, dataset, options) {
    var maxAgeDays = options && finiteNumber(options.maxAgeDays) ? options.maxAgeDays : 45;
    var now = options && options.now;
    var codes = verifiedCodes(dataset);
    return Boolean(
      row &&
      codes.has(String(row.code || '').toUpperCase()) &&
      finiteNumber(row.policy_rate) &&
      row.policy_rate >= 0 &&
      row.policy_rate <= 100 &&
      /^\d{4}-\d{2}-\d{2}$/.test(String(row.policy_rate_source_date || '')) &&
      isNotFuture(row.policy_rate_source_date, now) &&
      isOfficialUrl(row.policy_rate_source_url) &&
      ageDays(row.policy_rate_verified_at, now) <= maxAgeDays
    );
  }

  function annualInflation(row) {
    var inflation = row && row.inflation;
    if (!inflation || !finiteNumber(inflation.wb_headline)) return null;
    var year = String(inflation.wb_date || '').slice(0, 4);
    if (!/^\d{4}$/.test(year)) return null;
    return { value: inflation.wb_headline, year: year, source: inflation.wb_source || 'World Bank annual CPI' };
  }

  function selectVerified(dataset, options) {
    var candidates = dataset && Array.isArray(dataset.countries) ? dataset.countries : [];
    if (dataset && dataset.timestamp && !isNotFuture(dataset.timestamp, options && options.now)) return [];
    return candidates.filter(function (row) {
      return isVerifiedPolicyRow(row, dataset, options);
    }).map(function (row) {
      var inflation = annualInflation(row);
      return {
        code: String(row.code || '').toUpperCase(),
        name: String(row.name || row.code || ''),
        region: String(row.region || ''),
        currency: String(row.currency || ''),
        central_bank: String(row.central_bank || ''),
        policy_rate: row.policy_rate,
        policy_rate_name: String(row.policy_rate_name || 'Policy rate'),
        policy_rate_source_url: row.policy_rate_source_url,
        policy_rate_source_date: row.policy_rate_source_date,
        policy_rate_verified_at: row.policy_rate_verified_at,
        annual_inflation: inflation,
        illustrative_gap: inflation ? row.policy_rate - inflation.value : null
      };
    });
  }

  function coverage(dataset, options) {
    var candidateCount = dataset && Array.isArray(dataset.countries) ? dataset.countries.length : 0;
    var rows = selectVerified(dataset, options);
    return {
      candidate_count: candidateCount,
      verified_policy_count: rows.length,
      withheld_policy_count: Math.max(0, candidateCount - rows.length),
      partial: rows.length !== candidateCount
    };
  }

  return Object.freeze({
    OFFICIAL_HOSTS: OFFICIAL_HOSTS,
    MAX_FUTURE_SKEW_MS: MAX_FUTURE_SKEW_MS,
    ageDays: ageDays,
    isNotFuture: isNotFuture,
    isOfficialUrl: isOfficialUrl,
    isVerifiedPolicyRow: isVerifiedPolicyRow,
    annualInflation: annualInflation,
    selectVerified: selectVerified,
    coverage: coverage
  });
});
