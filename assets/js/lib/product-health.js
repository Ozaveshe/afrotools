(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.productHealth = api;
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var STATUS = Object.freeze({
    OPERATIONAL: 'operational',
    PARTIAL: 'partial_coverage',
    DEGRADED: 'degraded',
    STALE: 'stale',
    UNAVAILABLE: 'temporarily_unavailable',
    UNKNOWN: 'unknown'
  });

  var LABELS = Object.freeze({
    operational: 'Operational',
    partial_coverage: 'Partial coverage',
    degraded: 'Degraded',
    stale: 'Stale',
    temporarily_unavailable: 'Temporarily unavailable',
    unknown: 'Unknown'
  });

  var RANK = Object.freeze({
    operational: 0,
    partial_coverage: 1,
    degraded: 2,
    stale: 3,
    temporarily_unavailable: 4,
    unknown: 5
  });

  function toIso(value) {
    if (!value) return null;
    var date = new Date(value);
    return Number.isFinite(date.getTime()) ? date.toISOString() : null;
  }

  function ageDays(value, now) {
    var iso = toIso(value);
    if (!iso) return null;
    var reference = now instanceof Date ? now : new Date(now || Date.now());
    return Math.max(0, Math.floor((reference.getTime() - new Date(iso).getTime()) / 86400000));
  }

  function normalizeStatus(value) {
    var key = String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
    if (['live', 'ok', 'healthy', 'current', 'operational'].includes(key)) return STATUS.OPERATIONAL;
    if (['limited', 'partial', 'partial_coverage', 'acceptable'].includes(key)) return STATUS.PARTIAL;
    if (['degraded', 'warning', 'error', 'failed'].includes(key)) return STATUS.DEGRADED;
    if (key === 'stale') return STATUS.STALE;
    if (['offline', 'unavailable', 'blocked', 'temporarily_unavailable'].includes(key)) return STATUS.UNAVAILABLE;
    return STATUS.UNKNOWN;
  }

  function worseStatus(left, right) {
    var a = normalizeStatus(left);
    var b = normalizeStatus(right);
    return RANK[a] >= RANK[b] ? a : b;
  }

  function deriveStatus(input, now) {
    input = input || {};
    var declared = normalizeStatus(input.declaredStatus);
    var verifiedAt = toIso(input.lastVerified);
    var age = ageDays(verifiedAt, now);
    var cadence = Number(input.cadenceDays);
    var hasCoverage = Number.isFinite(Number(input.coverageTotal)) && Number(input.coverageTotal) > 0;
    var verifiedCoverage = Number(input.coverageVerified);

    if (declared === STATUS.UNAVAILABLE || declared === STATUS.DEGRADED) return declared;
    if (!verifiedAt || age === null) return STATUS.UNKNOWN;
    if (Number.isFinite(cadence) && cadence > 0 && age > cadence) return STATUS.STALE;
    if (declared === STATUS.STALE) return STATUS.STALE;
    if (declared === STATUS.PARTIAL) return STATUS.PARTIAL;
    if (hasCoverage && (!Number.isFinite(verifiedCoverage) || verifiedCoverage < Number(input.coverageTotal))) {
      return STATUS.PARTIAL;
    }
    return STATUS.OPERATIONAL;
  }

  function isOperational(value) {
    return normalizeStatus(value) === STATUS.OPERATIONAL;
  }

  function safeReleaseMetadata(input) {
    input = input || {};
    var commit = /^[0-9a-f]{7,40}$/i.test(String(input.commit || '')) ? String(input.commit).toLowerCase() : null;
    var builtAt = toIso(input.built_at || input.builtAt);
    var context = ['production', 'deploy-preview', 'branch-deploy', 'local'].includes(input.context) ? input.context : 'local';
    return {
      context: context,
      production: context === 'production' && input.production === true,
      commit: commit,
      built_at: builtAt
    };
  }

  function containsUnsafePublicText(value) {
    var text = typeof value === 'string' ? value : JSON.stringify(value || '');
    return /(service[_-]?role|admin[_-]?(?:key|secret)|authorization\s*[:=]|bearer\s+[a-z0-9._-]{16,}|sb_secret_|eyJ[a-zA-Z0-9_-]{20,}\.)/i.test(text);
  }

  return Object.freeze({
    STATUS: STATUS,
    LABELS: LABELS,
    ageDays: ageDays,
    deriveStatus: deriveStatus,
    isOperational: isOperational,
    normalizeStatus: normalizeStatus,
    worseStatus: worseStatus,
    safeReleaseMetadata: safeReleaseMetadata,
    containsUnsafePublicText: containsUnsafePublicText,
    toIso: toIso
  });
});
