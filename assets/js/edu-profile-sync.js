var EduProfileSync = (function () {
  'use strict';

  var PROFILE_FIELDS = [
    'education_level',
    'institution',
    'gpa_value',
    'gpa_scale',
    'target_study_level',
    'target_countries',
    'target_fields',
    'ielts_overall',
    'ielts_components',
    'jamb_score',
    'nationality',
    'jamb_best_mock_score',
    'jamb_predicted_score',
    'jamb_practice_count',
    'jamb_total_study_minutes',
    'jamb_target_subjects',
    'jamb_target_universities',
    'jamb_target_courses',
    'jamb_weak_topics',
    'jamb_streak_days',
    'jamb_score_source',
    'graduation_date'
  ];

  var LOCAL_CACHE_KEY = 'afroedu-profile-cache';
  var PROFILE_EVENT = 'afroedu:profile-updated';
  var pendingPayload = null;
  var flushTimer = null;

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

  function dispatchProfileEvent(profile, payload, reason) {
    if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function' || typeof window.CustomEvent !== 'function') return;
    window.dispatchEvent(new CustomEvent(PROFILE_EVENT, {
      detail: {
        profile: profile || null,
        payload: payload || null,
        reason: reason || 'local'
      }
    }));
  }

  function sanitizePayload(input) {
    if (!input || typeof input !== 'object') return null;

    var payload = {};
    var hasFields = false;

    PROFILE_FIELDS.forEach(function (field) {
      if (input[field] !== undefined && input[field] !== null && input[field] !== '') {
        payload[field] = input[field];
        hasFields = true;
      }
    });

    return hasFields ? payload : null;
  }

  function mergeIntoCache(payload, reason) {
    if (!payload) return null;

    var cached = safeRead(LOCAL_CACHE_KEY, {}) || {};
    var next = Object.assign({}, cached, payload, {
      local_updated_at: Date.now()
    });

    safeWrite(LOCAL_CACHE_KEY, next);
    dispatchProfileEvent(next, payload, reason);
    return next;
  }

  function getTokenPromise() {
    if (!window.AfroAuth || typeof AfroAuth.isLoggedIn !== 'function' || !AfroAuth.isLoggedIn()) {
      return Promise.resolve(null);
    }

    if (typeof AfroAuth.getSessionTokenAsync === 'function') {
      return AfroAuth.getSessionTokenAsync().catch(function () { return null; });
    }

    if (typeof AfroAuth.getSessionToken === 'function') {
      try {
        return Promise.resolve(AfroAuth.getSessionToken());
      } catch (error) {
        return Promise.resolve(null);
      }
    }

    return Promise.resolve(null);
  }

  function flushRemote() {
    if (!pendingPayload) return;

    var payload = pendingPayload;
    pendingPayload = null;

    getTokenPromise().then(function (token) {
      if (!token) return;

      fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(payload)
      }).then(function () {
        console.log('[edu-sync] Profile updated:', Object.keys(payload).join(', '));
      }).catch(function () {
        /* silent failure keeps local cache intact */
      });
    }).catch(function () {
      /* silent */
    });
  }

  function queueRemoteSync(payload) {
    if (!payload) return;

    pendingPayload = Object.assign({}, pendingPayload || {}, payload);
    clearTimeout(flushTimer);
    flushTimer = setTimeout(flushRemote, 1000);
  }

  function update(input) {
    var payload = sanitizePayload(input);
    if (!payload) return;

    mergeIntoCache(payload, 'local');
    queueRemoteSync(payload);
  }

  function getCachedProfile() {
    return safeRead(LOCAL_CACHE_KEY, null);
  }

  function getProfile() {
    return getTokenPromise().then(function (token) {
      if (!token) return null;

      return fetch('/api/profile', {
        headers: {
          'Authorization': 'Bearer ' + token
        }
      }).then(function (response) {
        return response.json();
      }).then(function (data) {
        var profile = data && data.profile ? data.profile : null;
        if (profile) mergeIntoCache(profile, 'remote');
        return profile;
      }).catch(function () {
        return null;
      });
    });
  }

  return {
    update: update,
    getProfile: getProfile,
    getCachedProfile: getCachedProfile
  };
})();
