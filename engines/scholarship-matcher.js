var ScholarshipMatcher = (function () {
  'use strict';

  var WEIGHTS = {
    gpa: 0.4,
    ielts: 0.25,
    field: 0.15,
    destination: 0.1,
    level: 0.1
  };

  var GPA_NORMALIZERS = {
    '5.0': function (value) { return value * 0.8; },
    '4.0': function (value) { return value; },
    percentage: function (value) { return value / 25; },
    '20': function (value) { return value / 5; },
    '7.0': function (value) { return value * (4 / 7); }
  };

  var QUICK_PROFILE_KEY = 'afro-quick-edu-profile';

  function safeRead(storage, key) {
    try {
      var raw = storage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function safeWrite(storage, key, value) {
    try {
      storage.setItem(key, JSON.stringify(value));
    } catch (error) {
      /* ignore storage failures */
    }
  }

  function dispatchQuickProfileEvent(profile) {
    if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function' || typeof window.CustomEvent !== 'function') return;
    window.dispatchEvent(new CustomEvent('afroedu:quick-profile-updated', {
      detail: {
        profile: profile || null
      }
    }));
  }

  function normalizeGPA(value, scale) {
    if (!value || !scale) return null;
    var normalizer = GPA_NORMALIZERS[scale];
    if (!normalizer) return parseFloat(value);
    return Math.min(normalizer(parseFloat(value)), 4);
  }

  function scoreGpa(gpa, scholarship) {
    if (!scholarship.min_gpa_4 && !scholarship.min_gpa_5) {
      return { score: 1, required: null, yours: gpa, met: true, na: true };
    }

    if (!gpa) {
      return { score: 0, required: scholarship.min_gpa_4, yours: null, met: false, missing: true };
    }

    var required = scholarship.min_gpa_4 ? parseFloat(scholarship.min_gpa_4) : null;
    if (!required && scholarship.min_gpa_5) required = 0.8 * parseFloat(scholarship.min_gpa_5);

    var ratio = gpa / required;
    var met = ratio >= 1;
    return {
      score: Math.min(ratio, 1.2) / 1.2,
      required: required.toFixed(2),
      yours: gpa.toFixed(2),
      met: met
    };
  }

  function scoreIelts(ielts, scholarship) {
    if (!scholarship.min_ielts) {
      return { score: 1, required: null, yours: ielts, met: true, na: true };
    }

    if (!ielts) {
      return { score: 0, required: scholarship.min_ielts, yours: null, met: false, missing: true };
    }

    var required = parseFloat(scholarship.min_ielts);
    var ratio = parseFloat(ielts) / required;
    return {
      score: Math.min(ratio, 1.2) / 1.2,
      required: required.toFixed(1),
      yours: parseFloat(ielts).toFixed(1),
      met: ratio >= 1
    };
  }

  function scoreField(fields, scholarship) {
    if (!scholarship.fields || scholarship.fields.indexOf('any') !== -1) {
      return { score: 1, met: true, na: true };
    }

    if (!fields || !fields.length) {
      return { score: 0.5, met: false, missing: true };
    }

    var matched = fields.some(function (field) {
      return scholarship.fields.indexOf(field) !== -1;
    });

    return { score: matched ? 1 : 0, met: matched };
  }

  function scoreDestination(destinations, scholarship) {
    if (!scholarship.destinations) {
      return { score: 1, met: true, na: true };
    }

    if (!destinations || !destinations.length) {
      return { score: 0.5, met: false, missing: true };
    }

    if (scholarship.destinations.indexOf('global') !== -1) {
      return { score: 1, met: true };
    }

    var matched = destinations.some(function (destination) {
      return scholarship.destinations.indexOf(destination) !== -1;
    });

    return { score: matched ? 1 : 0.2, met: matched };
  }

  function scoreLevel(level, scholarship) {
    if (!scholarship.levels) {
      return { score: 1, met: true, na: true };
    }

    if (!level) {
      return { score: 0.5, met: false, missing: true };
    }

    var matched = scholarship.levels.indexOf(level) !== -1;
    return { score: matched ? 1 : 0, met: matched };
  }

  function categorize(score) {
    if (score >= 0.8) return 'Strong Match';
    if (score >= 0.6) return 'Good Match';
    if (score >= 0.4) return 'Possible';
    return 'Unlikely';
  }

  function categoryClass(category) {
    switch (category) {
      case 'Strong Match': return 'match-strong';
      case 'Good Match': return 'match-good';
      case 'Possible': return 'match-possible';
      default: return 'match-unlikely';
    }
  }

  function match(scholarships, studentProfile) {
    if (!scholarships || !studentProfile) return [];

    var normalizedGpa = normalizeGPA(studentProfile.gpa_value, studentProfile.gpa_scale);
    var ielts = studentProfile.ielts_overall ? parseFloat(studentProfile.ielts_overall) : null;
    var fields = studentProfile.target_fields || [];
    var destinations = studentProfile.target_countries || [];
    var level = studentProfile.target_study_level || null;

    if (!(normalizedGpa || ielts || fields.length || destinations.length || level)) return [];

    var results = scholarships.map(function (scholarship) {
      var details = {
        gpa: scoreGpa(normalizedGpa, scholarship),
        ielts: scoreIelts(ielts, scholarship),
        field: scoreField(fields, scholarship),
        destination: scoreDestination(destinations, scholarship),
        level: scoreLevel(level, scholarship)
      };

      var activeWeights = {};
      var totalWeight = 0;
      Object.keys(WEIGHTS).forEach(function (key) {
        if (!details[key].missing) {
          activeWeights[key] = WEIGHTS[key];
          totalWeight += WEIGHTS[key];
        }
      });

      if (totalWeight === 0) {
        return {
          scholarship: scholarship,
          score: 0.5,
          percent: 50,
          category: 'Possible',
          categoryClass: 'match-possible',
          met: [],
          unmet: [],
          details: details
        };
      }

      var score = 0;
      Object.keys(activeWeights).forEach(function (key) {
        score += details[key].score * (activeWeights[key] / totalWeight);
      });

      var met = [];
      var unmet = [];
      Object.keys(details).forEach(function (key) {
        if (details[key].na || details[key].missing) return;
        if (details[key].met) met.push(key);
        else unmet.push(key);
      });

      var category = categorize(score);
      return {
        scholarship: scholarship,
        score: score,
        percent: Math.round(100 * score),
        category: category,
        categoryClass: categoryClass(category),
        met: met,
        unmet: unmet,
        details: details
      };
    });

    results.sort(function (left, right) {
      return right.score - left.score;
    });

    return results;
  }

  function getQuickProfile() {
    if (typeof sessionStorage !== 'undefined') {
      var sessionProfile = safeRead(sessionStorage, QUICK_PROFILE_KEY);
      if (sessionProfile) return sessionProfile;
    }

    if (typeof localStorage !== 'undefined') {
      return safeRead(localStorage, QUICK_PROFILE_KEY);
    }

    return null;
  }

  function saveQuickProfile(profile) {
    if (typeof sessionStorage !== 'undefined') {
      safeWrite(sessionStorage, QUICK_PROFILE_KEY, profile);
    }
    if (typeof localStorage !== 'undefined') {
      safeWrite(localStorage, QUICK_PROFILE_KEY, profile);
    }
    dispatchQuickProfileEvent(profile);
  }

  function clearQuickProfile() {
    try {
      if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(QUICK_PROFILE_KEY);
    } catch (error) {}
    try {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(QUICK_PROFILE_KEY);
    } catch (error) {}
    dispatchQuickProfileEvent(null);
  }

  return {
    match: match,
    normalizeGPA: normalizeGPA,
    categorize: categorize,
    categoryClass: categoryClass,
    getQuickProfile: getQuickProfile,
    saveQuickProfile: saveQuickProfile,
    clearQuickProfile: clearQuickProfile
  };
})();
