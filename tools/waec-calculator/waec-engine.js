(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.WAECPlannerEngine = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var GRADES = {
    A1: { points: 1, label: 'Excellent' },
    B2: { points: 2, label: 'Very good' },
    B3: { points: 3, label: 'Good' },
    C4: { points: 4, label: 'Credit' },
    C5: { points: 5, label: 'Credit' },
    C6: { points: 6, label: 'Credit' },
    D7: { points: 7, label: 'Pass' },
    E8: { points: 8, label: 'Pass' },
    F9: { points: 9, label: 'Fail' }
  };

  function cleanRows(rows) {
    return (Array.isArray(rows) ? rows : []).map(function (row) {
      var grade = String((row && row.grade) || '').toUpperCase();
      return {
        name: String((row && row.name) || '').trim(),
        grade: GRADES[grade] ? grade : '',
        compulsory: Boolean(row && row.compulsory),
        role: row && row.role ? String(row.role) : ''
      };
    }).filter(function (row) {
      return row.name || row.grade;
    });
  }

  function scoredRows(rows) {
    var completed = cleanRows(rows).filter(function (row) {
      return row.name && row.grade;
    }).map(function (row) {
      return Object.assign({}, row, { points: GRADES[row.grade].points });
    });
    var names = new Map();
    var duplicates = new Set();
    function key(row) { return row.name.toLowerCase().replace(/\s+/g, ' '); }
    completed.forEach(function (row) {
      var name = key(row);
      if (names.has(name)) duplicates.add(name);
      else names.set(name, row.name);
    });
    return {
      distinct: completed.filter(function (row) { return !duplicates.has(key(row)); }),
      duplicates: Array.from(duplicates, function (name) { return names.get(name); })
    };
  }

  function creditCount(rows) {
    return rows.filter(function (row) {
      return row.points <= 6;
    }).length;
  }

  function findSubject(rows, name) {
    var target = name.toLowerCase();
    return rows.find(function (row) {
      return row.name.toLowerCase() === target;
    });
  }

  function subjectCreditCheck(rows, name, duplicates) {
    var row = findSubject(rows, name);
    if (!row) {
      var repeated = duplicates.some(function (duplicate) { return duplicate.toLowerCase() === name.toLowerCase(); });
      return {label: name + (repeated ? ': enter the subject once' : ': enter a grade'), pass: false};
    }
    var pass = row.points <= 6;
    return {label: name + ' (' + row.grade + '): ' + (pass ? 'credit recorded' : 'below credit level'), pass: pass};
  }

  function calculateNigeria(rows) {
    var assessment = scoredRows(rows);
    var scored = assessment.distinct;
    var selected = scored.slice().sort(function (a, b) {
      return a.points - b.points;
    }).slice(0, 5);
    return {
      duplicates: assessment.duplicates,
      system: 'ng-waec-neco',
      metricLabel: 'Best-five planning index',
      value: !assessment.duplicates.length && selected.length === 5 ? selected.reduce(function (sum, row) {
        return sum + row.points;
      }, 0) : null,
      selected: selected,
      entered: scored.length,
      credits: creditCount(scored),
      complete: !assessment.duplicates.length && selected.length === 5,
      checks: [
        { label: 'Credit-level results: ' + creditCount(scored) + ' (five needed)', pass: creditCount(scored) >= 5 },
        subjectCreditCheck(scored, 'English Language', assessment.duplicates),
        subjectCreditCheck(scored, 'Mathematics', assessment.duplicates)
      ],
      note: 'This index organises results; it is not an official Nigerian admission aggregate or eligibility decision.'
    };
  }

  function calculateGhana(rows, pathway) {
    var assessment = scoredRows(rows);
    var scored = assessment.distinct;
    var programmeCore = pathway === 'non-science' ? 'Social Studies' : 'Integrated Science';
    var coreNames = ['English Language', 'Core Mathematics', programmeCore];
    var core = coreNames.map(function (name) {
      return findSubject(scored, name);
    }).filter(Boolean);
    var excludedCoreNames = new Set([
      'english language',
      'core mathematics',
      'integrated science',
      'social studies'
    ]);
    var electives = scored.filter(function (row) {
      return !excludedCoreNames.has(row.name.toLowerCase());
    }).sort(function (a, b) {
      return a.points - b.points;
    }).slice(0, 3);
    var selected = core.concat(electives);
    var complete = !assessment.duplicates.length && core.length === 3 && electives.length === 3;
    return {
      duplicates: assessment.duplicates,
      system: 'gh-wassce',
      metricLabel: 'Ghana WASSCE planning aggregate',
      value: complete ? selected.reduce(function (sum, row) {
        return sum + row.points;
      }, 0) : null,
      selected: selected,
      entered: scored.length,
      credits: creditCount(scored),
      complete: complete,
      checks: coreNames.map(function (name) {
        return subjectCreditCheck(scored, name, assessment.duplicates);
      }).concat([
        { label: 'Elective credits needed: three', pass: electives.filter(function (row) { return row.points <= 6; }).length === 3 }
      ]),
      note: 'Programme and institution rules still decide which subjects count and the maximum accepted aggregate.'
    };
  }

  return {
    grades: GRADES,
    calculateNigeria: calculateNigeria,
    calculateGhana: calculateGhana
  };
});
