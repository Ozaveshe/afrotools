(function (root, factory) {
  'use strict';
  var engine = factory();
  if (typeof module === 'object' && module.exports) module.exports = engine;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.kcseEngine = engine;
  }
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  var POINTS = { A: 12, 'A-': 11, 'B+': 10, B: 9, 'B-': 8, 'C+': 7, C: 6, 'C-': 5, 'D+': 4, D: 3, 'D-': 2, E: 1 };
  var AGGREGATE_BANDS = [
    { min: 81, grade: 'A' }, { min: 74, grade: 'A-' }, { min: 67, grade: 'B+' },
    { min: 60, grade: 'B' }, { min: 53, grade: 'B-' }, { min: 46, grade: 'C+' },
    { min: 39, grade: 'C' }, { min: 32, grade: 'C-' }, { min: 25, grade: 'D+' },
    { min: 18, grade: 'D' }, { min: 11, grade: 'D-' }, { min: 7, grade: 'E' }
  ];

  function gradePoints(grade) {
    return Object.prototype.hasOwnProperty.call(POINTS, grade) ? POINTS[grade] : null;
  }

  function aggregateGrade(sum) {
    for (var i = 0; i < AGGREGATE_BANDS.length; i++) {
      if (sum >= AGGREGATE_BANDS[i].min) return AGGREGATE_BANDS[i].grade;
    }
    return '';
  }

  function item(subject, grade, group) {
    var points = gradePoints(grade);
    return points === null ? null : { subject: subject, grade: grade, points: points, group: group };
  }

  function calculate(input) {
    input = input || {};
    var mathematics = item('Mathematics', input.mathematics, 'mandatory mathematics');
    var english = item('English', input.english, 'language');
    var kiswahili = item('Kiswahili', input.kiswahili, 'language');
    var others = (input.others || []).map(function (row, index) {
      var name = String(row && row.subject || '').trim() || ('Subject ' + (index + 4));
      return item(name, row && row.grade, 'remaining subject');
    }).filter(Boolean);
    var errors = [];
    if (!mathematics) errors.push('Enter the Mathematics grade.');
    if (!english && !kiswahili) errors.push('Enter at least one language grade: English or Kiswahili.');
    var bestLanguage = [english, kiswahili].filter(Boolean).sort(function (a, b) {
      return b.points - a.points || a.subject.localeCompare(b.subject);
    })[0] || null;
    var otherLanguage = bestLanguage && bestLanguage.subject === 'English' ? kiswahili : english;
    var remainingPool = others.slice();
    if (otherLanguage) remainingPool.push(otherLanguage);
    remainingPool.sort(function (a, b) {
      return b.points - a.points || a.subject.localeCompare(b.subject);
    });
    if (remainingPool.length < 5) errors.push('Enter at least five additional graded subjects after Mathematics and the selected language.');
    if (errors.length) return { ok: false, errors: errors };
    var bestFive = remainingPool.slice(0, 5);
    var counted = [mathematics, bestLanguage].concat(bestFive);
    var sum = counted.reduce(function (total, subject) { return total + subject.points; }, 0);
    var allEntered = [mathematics, english, kiswahili].concat(others).filter(Boolean);
    return {
      ok: true,
      counted: counted,
      allEntered: allEntered,
      excluded: allEntered.filter(function (candidate) { return counted.indexOf(candidate) === -1; }),
      bestLanguage: bestLanguage,
      bestFive: bestFive,
      aggregate: sum,
      meanPoints: sum / 7,
      meanGrade: aggregateGrade(sum)
    };
  }

  return {
    AGGREGATE_BANDS: AGGREGATE_BANDS,
    POINTS: POINTS,
    aggregateGrade: aggregateGrade,
    calculate: calculate,
    gradePoints: gradePoints
  };
});
