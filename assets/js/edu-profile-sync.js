/**
 * AfroTools — Education Profile Sync
 *
 * Lightweight helper that auto-saves education data (GPA, IELTS, JAMB)
 * to the user's profile when they use education tools.
 *
 * Usage: EduProfileSync.update({ gpa_value: 3.5, gpa_scale: '4.0' });
 */
var EduProfileSync = (function () {
  'use strict';

  var VALID_FIELDS = [
    'education_level', 'institution', 'gpa_value', 'gpa_scale',
    'target_study_level', 'target_countries', 'target_fields',
    'ielts_overall', 'ielts_components', 'jamb_score', 'nationality'
  ];

  // Debounce to avoid rapid-fire saves
  var _pending = null;
  var _timer = null;

  function update(fields) {
    if (!fields || typeof fields !== 'object') return;

    // Only keep valid education fields
    var clean = {};
    var hasData = false;
    VALID_FIELDS.forEach(function (key) {
      if (fields[key] !== undefined && fields[key] !== null && fields[key] !== '') {
        clean[key] = fields[key];
        hasData = true;
      }
    });
    if (!hasData) return;

    // Merge with any pending update
    _pending = Object.assign(_pending || {}, clean);

    // Debounce: wait 1s before sending
    clearTimeout(_timer);
    _timer = setTimeout(function () {
      _flush();
    }, 1000);
  }

  function _flush() {
    if (!_pending) return;
    var data = _pending;
    _pending = null;

    // Check login
    if (!window.AfroAuth || typeof AfroAuth.isLoggedIn !== 'function' || !AfroAuth.isLoggedIn()) return;

    // Get token
    var tokenPromise;
    if (typeof AfroAuth.getSessionTokenAsync === 'function') {
      tokenPromise = AfroAuth.getSessionTokenAsync();
    } else if (typeof AfroAuth.getSessionToken === 'function') {
      tokenPromise = Promise.resolve(AfroAuth.getSessionToken());
    } else {
      return;
    }

    tokenPromise.then(function (token) {
      if (!token) return;
      fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(data)
      }).then(function () {
        console.log('[edu-sync] Profile updated:', Object.keys(data).join(', '));
      }).catch(function () {
        // Silent fail — non-critical
      });
    }).catch(function () { });
  }

  /**
   * Fetch current education profile data.
   * Returns a Promise resolving to the profile object or null.
   */
  function getProfile() {
    if (!window.AfroAuth || typeof AfroAuth.isLoggedIn !== 'function' || !AfroAuth.isLoggedIn()) {
      return Promise.resolve(null);
    }

    var tokenPromise;
    if (typeof AfroAuth.getSessionTokenAsync === 'function') {
      tokenPromise = AfroAuth.getSessionTokenAsync();
    } else if (typeof AfroAuth.getSessionToken === 'function') {
      tokenPromise = Promise.resolve(AfroAuth.getSessionToken());
    } else {
      return Promise.resolve(null);
    }

    return tokenPromise.then(function (token) {
      if (!token) return null;
      return fetch('/api/profile', {
        headers: { 'Authorization': 'Bearer ' + token }
      }).then(function (res) {
        return res.json();
      }).then(function (data) {
        return data.profile || null;
      });
    }).catch(function () {
      return null;
    });
  }

  return {
    update: update,
    getProfile: getProfile
  };
})();
