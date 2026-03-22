/**
 * AfroTools — Scholarship Matcher Engine
 *
 * Compares a student's academic profile against scholarship requirements
 * and produces match scores with detailed breakdowns.
 *
 * Usage:
 *   var results = ScholarshipMatcher.match(scholarships, studentProfile);
 *   // results = [{ scholarship, score, category, met, unmet, details }, ...]
 */
var ScholarshipMatcher = (function () {
  'use strict';

  // Weights for each match factor
  var WEIGHTS = {
    gpa: 0.40,
    ielts: 0.25,
    field: 0.15,
    destination: 0.10,
    level: 0.10
  };

  // GPA conversion helpers (approximate)
  var GPA_CONVERSIONS = {
    '5.0': function (v) { return v * 0.8; },            // 5.0 → 4.0 scale
    '4.0': function (v) { return v; },                   // already 4.0
    'percentage': function (v) { return v / 25; },       // 100% → 4.0
    '20': function (v) { return v / 5; },                // 20 → 4.0
    '7.0': function (v) { return v * (4 / 7); }          // 7.0 → 4.0 (Australian)
  };

  /**
   * Normalize a GPA value to 4.0 scale
   */
  function normalizeGPA(value, scale) {
    if (!value || !scale) return null;
    var fn = GPA_CONVERSIONS[scale];
    if (!fn) return parseFloat(value); // assume 4.0 if unknown
    var normalized = fn(parseFloat(value));
    return Math.min(normalized, 4.0); // cap at 4.0
  }

  /**
   * Score a single factor (0-1)
   */
  function scoreGPA(studentGPA4, scholarship) {
    if (!scholarship.min_gpa_4 && !scholarship.min_gpa_5) return { score: 1, required: null, yours: studentGPA4, met: true, na: true };
    if (!studentGPA4) return { score: 0, required: scholarship.min_gpa_4, yours: null, met: false, missing: true };

    var required = scholarship.min_gpa_4 ? parseFloat(scholarship.min_gpa_4) : null;
    if (!required && scholarship.min_gpa_5) {
      required = parseFloat(scholarship.min_gpa_5) * 0.8; // convert 5.0 to 4.0
    }

    var ratio = studentGPA4 / required;
    var met = ratio >= 1.0;
    return {
      score: Math.min(ratio, 1.2) / 1.2, // cap at 1.2x to normalize, give bonus for exceeding
      required: required.toFixed(2),
      yours: studentGPA4.toFixed(2),
      met: met
    };
  }

  function scoreIELTS(studentIELTS, scholarship) {
    if (!scholarship.min_ielts) return { score: 1, required: null, yours: studentIELTS, met: true, na: true };
    if (!studentIELTS) return { score: 0, required: scholarship.min_ielts, yours: null, met: false, missing: true };

    var required = parseFloat(scholarship.min_ielts);
    var ratio = parseFloat(studentIELTS) / required;
    var met = ratio >= 1.0;
    return {
      score: Math.min(ratio, 1.2) / 1.2,
      required: required.toFixed(1),
      yours: parseFloat(studentIELTS).toFixed(1),
      met: met
    };
  }

  function scoreField(targetFields, scholarship) {
    if (!scholarship.fields || scholarship.fields.indexOf('any') !== -1) return { score: 1, met: true, na: true };
    if (!targetFields || targetFields.length === 0) return { score: 0.5, met: false, missing: true };

    var overlap = false;
    for (var i = 0; i < targetFields.length; i++) {
      if (scholarship.fields.indexOf(targetFields[i]) !== -1) {
        overlap = true;
        break;
      }
    }
    return { score: overlap ? 1 : 0, met: overlap };
  }

  function scoreDestination(targetCountries, scholarship) {
    if (!scholarship.destinations) return { score: 1, met: true, na: true };
    if (!targetCountries || targetCountries.length === 0) return { score: 0.5, met: false, missing: true };

    // Check for 'global' match
    if (scholarship.destinations.indexOf('global') !== -1) return { score: 1, met: true };

    var overlap = false;
    for (var i = 0; i < targetCountries.length; i++) {
      if (scholarship.destinations.indexOf(targetCountries[i]) !== -1) {
        overlap = true;
        break;
      }
    }
    return { score: overlap ? 1 : 0.2, met: overlap };
  }

  function scoreLevel(targetLevel, scholarship) {
    if (!scholarship.levels) return { score: 1, met: true, na: true };
    if (!targetLevel) return { score: 0.5, met: false, missing: true };

    var met = scholarship.levels.indexOf(targetLevel) !== -1;
    return { score: met ? 1 : 0, met: met };
  }

  /**
   * Categorize a match score
   */
  function categorize(score) {
    if (score >= 0.80) return 'Strong Match';
    if (score >= 0.60) return 'Good Match';
    if (score >= 0.40) return 'Possible';
    return 'Unlikely';
  }

  /**
   * Get category CSS class
   */
  function categoryClass(category) {
    switch (category) {
      case 'Strong Match': return 'match-strong';
      case 'Good Match': return 'match-good';
      case 'Possible': return 'match-possible';
      default: return 'match-unlikely';
    }
  }

  /**
   * Match scholarships against a student profile
   *
   * @param {Array} scholarships — array of scholarship objects from API
   * @param {Object} profile — student profile:
   *   { gpa_value, gpa_scale, ielts_overall, target_study_level, target_countries, target_fields }
   * @returns {Array} — sorted array of { scholarship, score, category, categoryClass, met, unmet, details }
   */
  function match(scholarships, profile) {
    if (!scholarships || !profile) return [];

    var studentGPA4 = normalizeGPA(profile.gpa_value, profile.gpa_scale);
    var studentIELTS = profile.ielts_overall ? parseFloat(profile.ielts_overall) : null;
    var targetFields = profile.target_fields || [];
    var targetCountries = profile.target_countries || [];
    var targetLevel = profile.target_study_level || null;

    // Check if student has any data at all
    var hasAnyData = studentGPA4 || studentIELTS || targetFields.length || targetCountries.length || targetLevel;
    if (!hasAnyData) return [];

    var results = scholarships.map(function (s) {
      var details = {
        gpa: scoreGPA(studentGPA4, s),
        ielts: scoreIELTS(studentIELTS, s),
        field: scoreField(targetFields, s),
        destination: scoreDestination(targetCountries, s),
        level: scoreLevel(targetLevel, s)
      };

      // Redistribute weights: exclude factors where student has no data AND scholarship has no requirement
      var activeWeights = {};
      var totalWeight = 0;
      Object.keys(WEIGHTS).forEach(function (key) {
        // Skip factor if student has no data for it (missing=true)
        if (details[key].missing) return;
        activeWeights[key] = WEIGHTS[key];
        totalWeight += WEIGHTS[key];
      });

      // If no active weights, give a neutral score
      if (totalWeight === 0) {
        return {
          scholarship: s,
          score: 0.5,
          percent: 50,
          category: 'Possible',
          categoryClass: 'match-possible',
          met: [],
          unmet: [],
          details: details
        };
      }

      // Calculate weighted score
      var weightedScore = 0;
      Object.keys(activeWeights).forEach(function (key) {
        var normalizedWeight = activeWeights[key] / totalWeight;
        weightedScore += details[key].score * normalizedWeight;
      });

      // Collect met/unmet
      var met = [];
      var unmet = [];
      Object.keys(details).forEach(function (key) {
        if (details[key].na || details[key].missing) return;
        if (details[key].met) {
          met.push(key);
        } else {
          unmet.push(key);
        }
      });

      var category = categorize(weightedScore);

      return {
        scholarship: s,
        score: weightedScore,
        percent: Math.round(weightedScore * 100),
        category: category,
        categoryClass: categoryClass(category),
        met: met,
        unmet: unmet,
        details: details
      };
    });

    // Sort by score descending
    results.sort(function (a, b) { return b.score - a.score; });

    return results;
  }

  /**
   * Build a profile from sessionStorage quick-profile data
   */
  function getQuickProfile() {
    try {
      var raw = sessionStorage.getItem('afro-quick-edu-profile');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function saveQuickProfile(profile) {
    try {
      sessionStorage.setItem('afro-quick-edu-profile', JSON.stringify(profile));
    } catch (e) { console.warn('[ScholarshipMatcher] Failed to save profile:', e.message); }
  }

  function clearQuickProfile() {
    try {
      sessionStorage.removeItem('afro-quick-edu-profile');
    } catch (e) { }
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
