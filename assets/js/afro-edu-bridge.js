(function (root) {
  'use strict';

  var JAMB_HISTORY_KEY = 'afrojamb-history';
  var FLASHCARD_STREAK_KEY = 'fc_streak';
  var ACTIVITY_KEY = 'afro_tool_history';
  var SCORE_SOURCE_KEY = 'afroedu-jamb-source';
  var PREDICTED_KEY = 'afroedu-predicted';
  var PROFILE_CACHE_KEY = 'afroedu-profile-cache';
  var COCKPIT_KEY = 'afroedu-cockpit-state';

  var SOURCE_PRIORITY = {
    'post-utme': 3,
    'cbt-mock': 2,
    predictor: 1
  };

  function safeRead(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function safeWrite(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      /* ignore localStorage failures */
    }
  }

  function pushProfileUpdate(payload) {
    if (!payload || !Object.keys(payload).length) return;
    if (typeof EduProfileSync !== 'undefined' && typeof EduProfileSync.update === 'function') {
      EduProfileSync.update(payload);
    }
  }

  function recordActivity(tool, label, meta) {
    var history = safeRead(ACTIVITY_KEY, []);
    var entry = Object.assign({
      tool: tool,
      label: label,
      timestamp: Date.now()
    }, meta || {});

    history.unshift(entry);
    if (history.length > 100) history.length = 100;
    safeWrite(ACTIVITY_KEY, history);
  }

  function getCurrentScoreSource() {
    try {
      return localStorage.getItem(SCORE_SOURCE_KEY) || null;
    } catch (error) {
      return null;
    }
  }

  function setCurrentScoreSource(source) {
    try {
      localStorage.setItem(SCORE_SOURCE_KEY, source);
    } catch (error) {
      /* ignore */
    }
  }

  function canPromoteSource(candidate) {
    var current = getCurrentScoreSource();
    return !current || (SOURCE_PRIORITY[candidate] || 0) >= (SOURCE_PRIORITY[current] || 0);
  }

  function getBestMockAggregate() {
    var history = safeRead(JAMB_HISTORY_KEY, []);
    if (!history.length) return 0;

    return history.reduce(function (best, item) {
      return Math.max(best, item.aggregate || 0);
    }, 0);
  }

  function getMockCount() {
    return (safeRead(JAMB_HISTORY_KEY, []) || []).length;
  }

  function getTotalStudyMinutes() {
    return Math.round((safeRead(JAMB_HISTORY_KEY, []) || []).reduce(function (minutes, item) {
      return minutes + (item.durationSeconds || 0);
    }, 0) / 60);
  }

  function hasJambHistory() {
    return getMockCount() > 0 || !!safeRead(PREDICTED_KEY, null);
  }

  function markJambState() {
    if (!document || !document.body) return;
    if (hasJambHistory()) document.body.setAttribute('data-active-jamb', 'true');
  }

  function ensureCockpitState(raw) {
    var state = raw && typeof raw === 'object' ? raw : {};
    return {
      universities: Array.isArray(state.universities) ? state.universities : [],
      destinations: Array.isArray(state.destinations) ? state.destinations : [],
      deadlines: Array.isArray(state.deadlines) ? state.deadlines : [],
      budgetSignals: Array.isArray(state.budgetSignals) ? state.budgetSignals : []
    };
  }

  function getCockpitState() {
    return ensureCockpitState(safeRead(COCKPIT_KEY, null));
  }

  function saveCockpitState(state) {
    safeWrite(COCKPIT_KEY, ensureCockpitState(state));
  }

  function slugify(value, fallback) {
    var base = String(value || fallback || 'item')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return base || fallback || 'item';
  }

  function upsertCockpitItem(collection, item, builder) {
    if (!item || !collection) return null;

    var state = getCockpitState();
    var list = state[collection] || [];
    var built = builder(item);
    if (!built || !built.id) return null;

    var index = list.findIndex(function (entry) {
      return entry.id === built.id;
    });

    if (index >= 0) {
      list[index] = Object.assign({}, list[index], built, { updatedAt: Date.now() });
    } else {
      list.unshift(Object.assign({ savedAt: Date.now(), updatedAt: Date.now() }, built));
    }

    if (list.length > 12) list.length = 12;
    state[collection] = list;
    saveCockpitState(state);
    return built;
  }

  function removeCockpitItem(collection, id) {
    if (!collection || !id) return;
    var state = getCockpitState();
    state[collection] = (state[collection] || []).filter(function (entry) {
      return entry.id !== id;
    });
    saveCockpitState(state);
  }

  function buildUniversity(item) {
    return {
      id: item.id || slugify((item.name || '') + '-' + (item.country || ''), 'university'),
      name: item.name || 'Saved university',
      country: item.country || '',
      rank: item.rank || null,
      fees: item.fees || null,
      feesLabel: item.feesLabel || '',
      type: item.type || '',
      students: item.students || null,
      scholarship: item.scholarship === true,
      strengths: Array.isArray(item.strengths) ? item.strengths.slice(0, 5) : [],
      fitLabel: item.fitLabel || '',
      fitScore: item.fitScore || null,
      fitReasons: Array.isArray(item.fitReasons) ? item.fitReasons.slice(0, 3) : [],
      tradeoffs: Array.isArray(item.tradeoffs) ? item.tradeoffs.slice(0, 2) : [],
      href: item.href || '/tools/university-ranking/',
      note: item.note || '',
      source: item.source || 'education-hub'
    };
  }

  function buildDestination(item) {
    return {
      id: item.id || slugify(item.name || item.destination || 'destination', 'destination'),
      name: item.name || item.destination || 'Saved destination',
      reason: item.reason || '',
      source: item.source || 'education-hub',
      studyLevel: item.studyLevel || '',
      field: item.field || '',
      href: item.href || '/tools/study-abroad-cost/'
    };
  }

  function buildBudgetSignal(item) {
    var destinationId = slugify(item.destination || item.name || 'budget-signal', 'budget-signal');
    var levelId = slugify(item.level || 'level', 'level');
    return {
      id: item.id || destinationId + '-' + levelId,
      destination: item.destination || 'Destination',
      level: item.level || '',
      field: item.field || '',
      years: item.years || null,
      annualTotal: item.annualTotal || null,
      totalCost: item.totalCost || null,
      firstYearTotal: item.firstYearTotal || null,
      upfrontCost: item.upfrontCost || null,
      scholarshipOffset: item.scholarshipOffset || null,
      scholarshipMode: item.scholarshipMode || '',
      comparisonLabel: item.comparisonLabel || '',
      currency: item.currency || '',
      href: item.href || '/tools/study-abroad-cost/',
      note: item.note || '',
      source: item.source || 'study-abroad-cost'
    };
  }

  function buildDeadline(item) {
    return {
      id: item.id || slugify((item.title || '') + '-' + (item.date || ''), 'deadline'),
      title: item.title || 'Deadline',
      date: item.date || '',
      route: item.route || '',
      href: item.href || '',
      note: item.note || '',
      source: item.source || 'education-hub'
    };
  }

  function recordMock(result) {
    if (!result) return;

    var aggregate = result.aggregate || 0;
    var bestMock = getBestMockAggregate();
    var payload = {
      jamb_practice_count: getMockCount(),
      jamb_total_study_minutes: getTotalStudyMinutes()
    };

    if (result.subjects && result.subjects.length) {
      payload.jamb_target_subjects = result.subjects;
    }

    if (aggregate > 0 && canPromoteSource('cbt-mock') && aggregate >= ((safeRead(PROFILE_CACHE_KEY, {}) || {}).jamb_score || 0)) {
      payload.jamb_score = bestMock;
      payload.jamb_best_mock_score = bestMock;
      setCurrentScoreSource('cbt-mock');
    }

    var profile = safeRead(PROFILE_CACHE_KEY, {});
    Object.assign(profile, payload);
    safeWrite(PROFILE_CACHE_KEY, profile);
    pushProfileUpdate(payload);

    var modeLabel = 'Full Mock';
    var modeKey = 'full mock';
    if (result.mode === 'quick') {
      modeLabel = 'Quick Mock';
      modeKey = 'quick mock';
    } else if (result.mode === 'subject') {
      modeLabel = 'Single Subject';
      modeKey = 'single-subject mock';
    }

    var detail = aggregate + '/400 · ' + modeLabel;
    if (result.ungraded) detail += ' · ' + result.ungraded + ' ungraded';

    recordActivity('jamb-cbt', 'Took JAMB ' + modeKey, {
      detail: detail,
      score: aggregate
    });
  }

  function recordPredicted(result) {
    if (!result) return;

    safeWrite(PREDICTED_KEY, {
      aggregate: result.aggregate,
      subjectScores: result.subjectScores,
      subjects: result.subjects,
      ts: Date.now()
    });

    var payload = { jamb_predicted_score: result.aggregate };
    if (canPromoteSource('predictor')) {
      payload.jamb_score = result.aggregate;
      setCurrentScoreSource('predictor');
    }
    if (result.subjects) payload.jamb_target_subjects = result.subjects;

    var profile = safeRead(PROFILE_CACHE_KEY, {});
    Object.assign(profile, payload);
    safeWrite(PROFILE_CACHE_KEY, profile);
    pushProfileUpdate(payload);

    recordActivity('jamb-score-predictor', 'Ran JAMB score predictor', {
      detail: 'Projected ' + result.aggregate + '/400',
      score: result.aggregate
    });
  }

  function recordRealJambScore(score) {
    if (!score) return;

    setCurrentScoreSource('post-utme');
    var payload = { jamb_score: score };
    var profile = safeRead(PROFILE_CACHE_KEY, {});
    profile.jamb_score = score;
    safeWrite(PROFILE_CACHE_KEY, profile);
    pushProfileUpdate(payload);

    recordActivity('jamb-aggregate', 'Saved JAMB aggregate score', {
      detail: score + ' (Post-UTME)',
      score: score
    });
  }

  function mirrorStreak(value) {
    if (value === null || value === undefined || isNaN(value) || value < 0) return;

    var streak = Math.floor(value);
    var stats = safeRead(FLASHCARD_STREAK_KEY, {}) || {};
    stats.count = streak;
    stats.best = Math.max(stats.best || 0, streak);
    stats.updated_at = Date.now();
    safeWrite(FLASHCARD_STREAK_KEY, stats);

    pushProfileUpdate({ jamb_streak_days: streak });

    var profile = safeRead(PROFILE_CACHE_KEY, {});
    profile.jamb_streak_days = streak;
    safeWrite(PROFILE_CACHE_KEY, profile);
  }

  function prefillFromProfile(callback) {
    var cache = safeRead(PROFILE_CACHE_KEY, {});
    var summary = {
      jamb_score: Math.max(cache.jamb_score || 0, getBestMockAggregate()),
      jamb_best_mock_score: getBestMockAggregate(),
      jamb_practice_count: getMockCount(),
      jamb_total_study_minutes: getTotalStudyMinutes()
    };

    var merged = Object.assign({}, summary, cache);
    if (typeof EduProfileSync !== 'undefined' && typeof EduProfileSync.getProfile === 'function') {
      try {
        var request = EduProfileSync.getProfile();
        if (request && typeof request.then === 'function') {
          request.then(function (profile) {
            if (profile) merged = Object.assign({}, merged, profile);
            merged.jamb_best_mock_score = Math.max(merged.jamb_best_mock_score || 0, getBestMockAggregate());
            if (callback) callback(merged);
          }).catch(function () {
            if (callback) callback(merged);
          });
          return;
        }
      } catch (error) {
        /* fall through to callback */
      }
    }

    if (callback) callback(merged);
  }

  function summary() {
    var history = safeRead(JAMB_HISTORY_KEY, []);
    var latest = history.length ? history[0] : null;
    var profile = safeRead(PROFILE_CACHE_KEY, {});

    return {
      hasHistory: hasJambHistory(),
      bestMockAggregate: getBestMockAggregate(),
      mockCount: getMockCount(),
      totalMinutes: getTotalStudyMinutes(),
      lastMockAt: latest ? latest.ts : null,
      lastMockAggregate: latest ? latest.aggregate : null,
      lastMockSubjects: latest ? latest.subjects : null,
      jambScore: profile.jamb_score || getBestMockAggregate() || null,
      jambScoreSource: getCurrentScoreSource(),
      jambPredictedScore: profile.jamb_predicted_score || null,
      streakDays: profile.jamb_streak_days || 0
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', markJambState);
  } else {
    markJambState();
  }

  root.AfroEdu = {
    recordMock: recordMock,
    recordPredicted: recordPredicted,
    recordRealJambScore: recordRealJambScore,
    recordActivity: recordActivity,
    mirrorStreak: mirrorStreak,
    prefillFromProfile: prefillFromProfile,
    bestMockAggregate: getBestMockAggregate,
    hasJambHistory: hasJambHistory,
    summary: summary,
    getCockpitState: getCockpitState,
    saveCockpitState: saveCockpitState,
    saveUniversity: function (item) {
      return upsertCockpitItem('universities', item, buildUniversity);
    },
    removeUniversity: function (id) {
      removeCockpitItem('universities', id);
    },
    saveDestination: function (item) {
      return upsertCockpitItem('destinations', item, buildDestination);
    },
    removeDestination: function (id) {
      removeCockpitItem('destinations', id);
    },
    saveBudgetSignal: function (item) {
      return upsertCockpitItem('budgetSignals', item, buildBudgetSignal);
    },
    removeBudgetSignal: function (id) {
      removeCockpitItem('budgetSignals', id);
    },
    saveDeadline: function (item) {
      return upsertCockpitItem('deadlines', item, buildDeadline);
    },
    removeDeadline: function (id) {
      removeCockpitItem('deadlines', id);
    },
    _safeRead: safeRead,
    _safeWrite: safeWrite,
    _getCurrentScoreSource: getCurrentScoreSource
  };
})('undefined' !== typeof window ? window : globalThis);
