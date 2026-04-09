/**
 * AfroEdu — unified student-state bridge.
 *
 * Reuses the existing EduProfileSync + /api/profile infrastructure and the
 * existing afro_tool_history activity feed used by /tools/education-hub/.
 *
 * Design: anonymous-first (everything written to localStorage), auth-gated
 * mirror to the profile backend. See ADR-001 for architectural rationale.
 *
 * Public API:
 *   AfroEdu.recordMock({aggregate, subjectScores, mode, subjects, durationSeconds, ungraded, outOf, pctCorrect})
 *   AfroEdu.recordPredicted({aggregate, subjectScores, subjects})
 *   AfroEdu.recordActivity(toolKey, label, extras?)
 *   AfroEdu.mirrorStreak(count)
 *   AfroEdu.prefillFromProfile(callback)       // async, safe for anon
 *   AfroEdu.bestMockAggregate()                 // from afrojamb-history
 *   AfroEdu.hasJambHistory()                    // bool
 *   AfroEdu.summary()                           // merged view for hub widgets
 */
(function (global) {
  "use strict";

  // ───────── Keys & constants ─────────
  var HISTORY_KEY        = "afrojamb-history";
  var FLASH_STATS_KEY    = "afrojamb-flash-stats";
  var LEGACY_FC_KEY      = "fc_streak";             // the key /tools/education-hub reads
  var ACTIVITY_KEY       = "afro_tool_history";     // Education Hub activity feed source
  var ACTIVITY_MAX       = 100;
  var SCORE_SOURCE_KEY   = "afroedu-jamb-source";   // precedence tracking
  var PRED_CACHE_KEY     = "afroedu-predicted";
  var PROFILE_CACHE_KEY  = "afroedu-profile-cache"; // local mirror of profile fields

  // Score source precedence: higher wins.
  var SOURCE_RANK = { "post-utme": 3, "cbt-mock": 2, "predictor": 1 };

  // ───────── Helpers ─────────
  function safeRead(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function safeWrite(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
  }
  function syncProfile(fields) {
    if (!fields || !Object.keys(fields).length) return;
    if (typeof EduProfileSync !== "undefined" && typeof EduProfileSync.update === "function") {
      EduProfileSync.update(fields);
    }
  }
  function pushActivityItem(item) {
    var list = safeRead(ACTIVITY_KEY, []);
    list.unshift(Object.assign({ timestamp: Date.now() }, item));
    if (list.length > ACTIVITY_MAX) list.length = ACTIVITY_MAX;
    safeWrite(ACTIVITY_KEY, list);
  }

  // ───────── Score precedence ─────────
  function getCurrentScoreSource() {
    try { return localStorage.getItem(SCORE_SOURCE_KEY) || null; } catch (e) { return null; }
  }
  function setScoreSource(source) {
    try { localStorage.setItem(SCORE_SOURCE_KEY, source); } catch (e) {}
  }
  function canOverwriteScore(newSource) {
    var current = getCurrentScoreSource();
    if (!current) return true;
    return (SOURCE_RANK[newSource] || 0) >= (SOURCE_RANK[current] || 0);
  }

  // ───────── History aggregation ─────────
  function bestMockAggregate() {
    var hist = safeRead(HISTORY_KEY, []);
    if (!hist.length) return 0;
    return hist.reduce(function (m, h) { return Math.max(m, h.aggregate || 0); }, 0);
  }
  function mockCount() {
    return (safeRead(HISTORY_KEY, []) || []).length;
  }
  function totalMockMinutes() {
    return Math.round((safeRead(HISTORY_KEY, []) || [])
      .reduce(function (s, h) { return s + (h.durationSeconds || 0); }, 0) / 60);
  }
  function lastMock() {
    var hist = safeRead(HISTORY_KEY, []);
    return hist.length ? hist[0] : null;
  }
  function hasJambHistory() {
    return mockCount() > 0 || !!safeRead(PRED_CACHE_KEY, null);
  }

  // ───────── Recorders (called by AfroJAMB tools) ─────────

  /**
   * Called after a CBT mock submission. The attempt itself is already stored
   * in afrojamb-history by jamb-cbt-engine — this just mirrors rollups to the
   * profile and pushes an activity row.
   */
  function recordMock(attempt) {
    if (!attempt) return;
    var newAgg = attempt.aggregate || 0;
    var currentBest = bestMockAggregate();      // post-write (already includes this mock)
    var count = mockCount();
    var minutes = totalMockMinutes();

    // Profile fields (only if this mock improved the best or it's the first time)
    var fields = {
      jamb_practice_count: count,
      jamb_total_study_minutes: minutes,
    };
    if (attempt.subjects && attempt.subjects.length) {
      fields.jamb_target_subjects = attempt.subjects;
    }
    if (newAgg > 0 && canOverwriteScore("cbt-mock")) {
      // Only write jamb_score if mock score is higher OR current source is also mock/predictor
      var prior = (safeRead(PROFILE_CACHE_KEY, {}) || {}).jamb_score || 0;
      if (newAgg >= prior) {
        fields.jamb_score = currentBest;
        fields.jamb_best_mock_score = currentBest;
        setScoreSource("cbt-mock");
      }
    }

    // Cache locally so anon users + cold starts still see their data
    var cache = safeRead(PROFILE_CACHE_KEY, {});
    Object.assign(cache, fields);
    safeWrite(PROFILE_CACHE_KEY, cache);

    syncProfile(fields);

    // Activity feed — uses the same 'tool' key as existing Education Hub mapping
    var modeLabel, modeLabelLower;
    if (attempt.mode === "quick") {
      modeLabel = "Quick Mock";
      modeLabelLower = "quick mock";
    } else if (attempt.mode === "subject") {
      modeLabel = "Single Subject";
      modeLabelLower = "single-subject mock";
    } else {
      modeLabel = "Full Mock";
      modeLabelLower = "full mock";
    }
    var detail = newAgg + "/400 · " + modeLabel;
    if (attempt.ungraded) detail += " · " + attempt.ungraded + " ungraded";
    pushActivityItem({
      tool: "jamb-cbt",
      label: "Took JAMB " + modeLabelLower,
      detail: detail,
      score: newAgg,
    });
  }

  /**
   * Called after the /jamb/score-predictor/ finishes. Lower precedence than
   * real CBT mocks — only updates jamb_score if it's still empty or already
   * came from a predictor run.
   */
  function recordPredicted(result) {
    if (!result) return;
    safeWrite(PRED_CACHE_KEY, {
      aggregate: result.aggregate,
      subjectScores: result.subjectScores,
      subjects: result.subjects,
      ts: Date.now(),
    });
    var fields = { jamb_predicted_score: result.aggregate };
    if (canOverwriteScore("predictor")) {
      fields.jamb_score = result.aggregate;
      setScoreSource("predictor");
    }
    if (result.subjects) fields.jamb_target_subjects = result.subjects;

    var cache = safeRead(PROFILE_CACHE_KEY, {});
    Object.assign(cache, fields);
    safeWrite(PROFILE_CACHE_KEY, cache);

    syncProfile(fields);
    pushActivityItem({
      tool: "jamb-score-predictor",
      label: "Ran JAMB score predictor",
      detail: "Projected " + result.aggregate + "/400",
      score: result.aggregate,
    });
  }

  /**
   * Called when jamb-aggregate calculator writes a real Post-UTME score.
   * This is the highest-precedence source — always overwrites.
   */
  function recordRealJambScore(score) {
    if (!score) return;
    setScoreSource("post-utme");
    var fields = { jamb_score: score };
    var cache = safeRead(PROFILE_CACHE_KEY, {});
    cache.jamb_score = score;
    safeWrite(PROFILE_CACHE_KEY, cache);
    syncProfile(fields);
    pushActivityItem({
      tool: "jamb-aggregate",
      label: "Saved JAMB aggregate score",
      detail: score + " (Post-UTME)",
      score: score,
    });
  }

  /**
   * Generic activity logger. Any tool can call this and it'll show up in
   * the Education Hub feed.
   */
  function recordActivity(toolKey, label, extras) {
    var item = { tool: toolKey, label: label };
    if (extras && typeof extras === "object") Object.assign(item, extras);
    pushActivityItem(item);
  }

  /**
   * Mirror AfroJAMB flashcard streak into both storage keys so the
   * Education Hub (which reads fc_streak) AND the AfroJAMB page (which
   * reads afrojamb-flash-stats) both see it.
   *
   * Writes the CURRENT streak value (not max) so a broken streak correctly
   * drops back to 1 on the Education Hub display.
   */
  function mirrorStreak(count) {
    if (count == null || isNaN(count) || count < 0) return;
    var n = Math.floor(count);
    try {
      var existing = safeRead(LEGACY_FC_KEY, {}) || {};
      existing.count = n;  // current streak, not max
      existing.best = Math.max(existing.best || 0, n);
      existing.updated_at = Date.now();
      safeWrite(LEGACY_FC_KEY, existing);
    } catch (e) {}
    // Also push to profile if logged in
    syncProfile({ jamb_streak_days: n });
    var cache = safeRead(PROFILE_CACHE_KEY, {});
    cache.jamb_streak_days = n;
    safeWrite(PROFILE_CACHE_KEY, cache);
  }

  // ───────── Reads (for pre-filling AfroJAMB UIs) ─────────

  /**
   * Returns a merged profile view combining:
   *   1. remote profile (if logged in) — highest priority
   *   2. local cache
   *   3. derived values from afrojamb-history
   * Always resolves with an object (possibly empty).
   */
  function prefillFromProfile(callback) {
    var cache = safeRead(PROFILE_CACHE_KEY, {});
    var derived = {
      jamb_score: Math.max(cache.jamb_score || 0, bestMockAggregate()),
      jamb_best_mock_score: bestMockAggregate(),
      jamb_practice_count: mockCount(),
      jamb_total_study_minutes: totalMockMinutes(),
    };
    var merged = Object.assign({}, derived, cache);

    // If logged in, try to fetch remote and merge on top
    if (typeof EduProfileSync !== "undefined" && typeof EduProfileSync.getProfile === "function") {
      try {
        var p = EduProfileSync.getProfile();
        if (p && typeof p.then === "function") {
          p.then(function (remote) {
            if (remote) merged = Object.assign({}, merged, remote);
            // Keep the best mock score even if remote has a lower number
            merged.jamb_best_mock_score = Math.max(merged.jamb_best_mock_score || 0, bestMockAggregate());
            callback && callback(merged);
          }).catch(function () { callback && callback(merged); });
          return;
        }
      } catch (e) { /* fall through */ }
    }
    callback && callback(merged);
  }

  /**
   * Synchronous summary for hero widgets that can't wait for async.
   * Uses local cache + derived history only.
   */
  function summary() {
    var cache = safeRead(PROFILE_CACHE_KEY, {});
    var last = lastMock();
    return {
      hasHistory: hasJambHistory(),
      bestMockAggregate: bestMockAggregate(),
      mockCount: mockCount(),
      totalMinutes: totalMockMinutes(),
      lastMockAt: last ? last.ts : null,
      lastMockAggregate: last ? last.aggregate : null,
      lastMockSubjects: last ? last.subjects : null,
      jambScore: cache.jamb_score || bestMockAggregate() || null,
      jambScoreSource: getCurrentScoreSource(),
      jambPredictedScore: cache.jamb_predicted_score || null,
      streakDays: cache.jamb_streak_days || 0,
    };
  }

  // ───────── Body attribute for CSS-only cross-tool affordances ─────────
  function markActiveJamb() {
    if (hasJambHistory() && document && document.body) {
      document.body.setAttribute("data-active-jamb", "true");
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", markActiveJamb);
  } else {
    markActiveJamb();
  }

  // ───────── Export ─────────
  global.AfroEdu = {
    recordMock: recordMock,
    recordPredicted: recordPredicted,
    recordRealJambScore: recordRealJambScore,
    recordActivity: recordActivity,
    mirrorStreak: mirrorStreak,
    prefillFromProfile: prefillFromProfile,
    bestMockAggregate: bestMockAggregate,
    hasJambHistory: hasJambHistory,
    summary: summary,
    // internals exposed for tests
    _safeRead: safeRead,
    _safeWrite: safeWrite,
    _getCurrentScoreSource: getCurrentScoreSource,
  };
})(typeof window !== "undefined" ? window : globalThis);
