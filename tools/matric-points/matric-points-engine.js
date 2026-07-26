(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.MatricPointsEngine = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function levelFromPercentage(value) {
    var percentage = Number(value);
    if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) return null;
    if (percentage >= 80) return 7;
    if (percentage >= 70) return 6;
    if (percentage >= 60) return 5;
    if (percentage >= 50) return 4;
    if (percentage >= 40) return 3;
    if (percentage >= 30) return 2;
    return 1;
  }

  function calculate(input) {
    var rows = Array.isArray(input && input.results) ? input.results : [];
    var homeLanguage = String(input && input.homeLanguage || '');
    var learningLanguage = String(input && input.learningLanguage || '');
    var seen = new Set();
    var results = [];

    for (var i = 0; i < rows.length; i += 1) {
      var subject = String(rows[i] && rows[i].subject || '').trim();
      var percentage = Number(rows[i] && rows[i].percentage);
      if (!subject || !Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
        return { ok: false, error: 'Every subject needs a percentage between 0 and 100.' };
      }
      if (seen.has(subject)) return { ok: false, error: 'Each subject can appear only once.' };
      seen.add(subject);
      results.push({ subject: subject, percentage: percentage, level: levelFromPercentage(percentage) });
    }

    if (results.length < 7 || !seen.has('Life Orientation')) {
      return { ok: false, error: 'Enter seven NSC subjects, including Life Orientation.' };
    }
    if (!seen.has(homeLanguage)) return { ok: false, error: 'Select the Home Language from the entered subjects.' };
    if (!seen.has(learningLanguage)) return { ok: false, error: 'Select the institution language of learning and teaching from the entered subjects.' };

    var counted = results
      .filter(function (row) { return row.subject !== 'Life Orientation'; })
      .sort(function (a, b) { return b.level - a.level || b.percentage - a.percentage; })
      .slice(0, 6);
    if (counted.length < 6) return { ok: false, error: 'Enter at least six subjects besides Life Orientation.' };

    var home = results.find(function (row) { return row.subject === homeLanguage; });
    var lolt = results.find(function (row) { return row.subject === learningLanguage; });
    var passed40 = results.filter(function (row) { return row.percentage >= 40; }).length;
    var passed30 = results.filter(function (row) { return row.percentage >= 30; }).length;
    var nscPass = home.percentage >= 40 && passed40 >= 3 && passed30 >= 6;
    var recognised = results.filter(function (row) {
      return row.subject !== 'Life Orientation' && row.subject !== homeLanguage && row.subject !== learningLanguage;
    });
    var fourAt50 = results.filter(function (row) {
      return row.subject !== 'Life Orientation' && row.percentage >= 50;
    }).length >= 4;
    var fourAt40 = results.filter(function (row) {
      return row.subject !== 'Life Orientation' && row.percentage >= 40;
    }).length >= 4;

    var route = 'NSC requirements not met';
    if (nscPass && lolt.percentage >= 30) route = 'Higher Certificate minimum';
    if (nscPass && lolt.percentage >= 30 && fourAt40) route = 'Diploma minimum';
    if (nscPass && lolt.percentage >= 30 && fourAt50) route = "Bachelor's minimum";

    return {
      ok: true,
      results: results,
      counted: counted,
      planningIndex: counted.reduce(function (total, row) { return total + row.level; }, 0),
      route: route,
      nscPass: nscPass,
      homeLanguage: homeLanguage,
      learningLanguage: learningLanguage,
      homeLanguagePercentage: home.percentage,
      learningLanguagePercentage: lolt.percentage,
      passed40: passed40,
      passed30: passed30,
      fourAt40: fourAt40,
      fourAt50: fourAt50,
      recognisedCount: recognised.length
    };
  }

  return {
    levelFromPercentage: levelFromPercentage,
    calculate: calculate
  };
}));
