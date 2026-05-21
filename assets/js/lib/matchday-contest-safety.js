(function (root, factory) {
  'use strict';

  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
    return;
  }

  root.AfroTools = root.AfroTools || {};
  root.AfroTools.matchdayContestSafety = factory();
})(typeof globalThis !== 'undefined' ? globalThis : window, function () {
  'use strict';

  var RAW_SIGNAL_KEYS = ['ipAddress', 'ip', 'userAgent', 'deviceFingerprint', 'fingerprint', 'rawFingerprint'];

  function isLocked(lockDeadlineUtc, nowUtc) {
    if (!lockDeadlineUtc) return false;
    var deadline = new Date(lockDeadlineUtc).getTime();
    var now = nowUtc ? new Date(nowUtc).getTime() : Date.now();
    if (Number.isNaN(deadline) || Number.isNaN(now)) return false;
    return now >= deadline;
  }

  function validateSafetyRecord(record) {
    var errors = [];
    var value = record || {};
    RAW_SIGNAL_KEYS.forEach(function (key) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        errors.push('Raw sensitive signal is not allowed: ' + key);
      }
    });
    ['ipHash', 'userAgentHash', 'deviceSignalHash'].forEach(function (key) {
      if (value[key] && typeof value[key] !== 'string') {
        errors.push(key + ' must be a string hash');
      }
    });
    if (value.termsAcceptedAt && Number.isNaN(new Date(value.termsAcceptedAt).getTime())) {
      errors.push('termsAcceptedAt must be an ISO timestamp');
    }
    if (value.submittedAt && Number.isNaN(new Date(value.submittedAt).getTime())) {
      errors.push('submittedAt must be an ISO timestamp');
    }
    return { valid: errors.length === 0, errors: errors };
  }

  function canEditPrediction(entry, nowUtc) {
    if (!entry) return { allowed: false, reason: 'missing-entry' };
    if (entry.lockDeadlineUtc && isLocked(entry.lockDeadlineUtc, nowUtc)) {
      return { allowed: false, reason: 'locked-before-kickoff' };
    }
    if (entry.lockedAt) return { allowed: false, reason: 'server-locked' };
    return { allowed: true, reason: 'open' };
  }

  function signatureForPrediction(entry) {
    var prediction = entry && entry.prediction ? entry.prediction : entry;
    return JSON.stringify({
      matchPick: prediction && prediction.matchPick ? prediction.matchPick : null,
      groupQualifiers: prediction && prediction.groupQualifiers ? prediction.groupQualifiers : null,
      tournamentPicks: prediction && prediction.tournamentPicks ? prediction.tournamentPicks : null
    });
  }

  function clusterBy(entries, key) {
    var clusters = {};
    (entries || []).forEach(function (entry) {
      var value = typeof key === 'function' ? key(entry) : entry && entry[key];
      if (!value) return;
      clusters[value] = clusters[value] || [];
      clusters[value].push(entry.entryId || entry.userPredictionId || entry.userId || 'unknown');
    });
    return Object.keys(clusters).filter(function (clusterKey) {
      return clusters[clusterKey].length > 1;
    }).map(function (clusterKey) {
      return { signal: clusterKey, entryIds: clusters[clusterKey], count: clusters[clusterKey].length };
    });
  }

  function detectDuplicateSignals(entries) {
    return {
      ipHashClusters: clusterBy(entries, 'ipHash'),
      userAgentHashClusters: clusterBy(entries, 'userAgentHash'),
      deviceSignalHashClusters: clusterBy(entries, 'deviceSignalHash')
    };
  }

  function detectIdenticalPredictionPatterns(entries) {
    return clusterBy(entries, signatureForPrediction).filter(function (cluster) {
      return cluster.signal !== JSON.stringify({ matchPick: null, groupQualifiers: null, tournamentPicks: null });
    });
  }

  function buildLaunchGate(config) {
    var safety = config || {};
    var blockers = [];
    if (safety.serverSideLockRequired !== true) blockers.push('server-side-lock-required');
    if (safety.emailVerificationRequired !== true) blockers.push('email-verification-required');
    if (safety.oneAccountPerPerson !== true) blockers.push('one-account-per-person-policy-required');
    if (safety.adminReviewRequired !== true) blockers.push('admin-review-required');
    if (safety.manualWinnerVerificationRequired !== true) blockers.push('manual-winner-verification-required');
    if (safety.legalReviewStatus !== 'required-before-launch') blockers.push('legal-review-gate-required');
    return {
      blocked: true,
      blockers: blockers.length ? blockers : ['backend-enforcement-not-connected'],
      reason: 'Prize launch remains blocked until these controls are implemented server-side and legally reviewed.'
    };
  }

  return {
    RAW_SIGNAL_KEYS: RAW_SIGNAL_KEYS,
    isLocked: isLocked,
    validateSafetyRecord: validateSafetyRecord,
    canEditPrediction: canEditPrediction,
    signatureForPrediction: signatureForPrediction,
    detectDuplicateSignals: detectDuplicateSignals,
    detectIdenticalPredictionPatterns: detectIdenticalPredictionPatterns,
    buildLaunchGate: buildLaunchGate
  };
});
