(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.AfroToolsSickleInheritance = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var VALID = Object.freeze(['AA', 'AS', 'AC', 'SS', 'SC', 'CC']);
  var ORDER = Object.freeze({ A: 0, S: 1, C: 2 });
  var DISPLAY_ORDER = Object.freeze(['AA', 'AS', 'AC', 'SS', 'SC', 'CC']);
  var LABELS = Object.freeze({
    AA: 'HbAA pattern',
    AS: 'Sickle cell trait',
    AC: 'Haemoglobin C trait',
    SS: 'HbSS sickle cell disease',
    SC: 'HbSC sickle cell disease',
    CC: 'HbCC disease'
  });
  var CATEGORIES = Object.freeze({
    AA: 'A/A combination in this simplified model',
    AS: 'Trait pattern',
    AC: 'Trait pattern',
    SS: 'Sickle cell disease pattern',
    SC: 'Sickle cell disease pattern',
    CC: 'Haemoglobin C disease pattern'
  });

  function canonical(left, right) {
    return [left, right].sort(function (a, b) { return ORDER[a] - ORDER[b]; }).join('');
  }

  function calculate(first, second) {
    var errors = [];
    if (VALID.indexOf(first) === -1) errors.push({ field: 'result-one', message: 'Select the first confirmed result.' });
    if (VALID.indexOf(second) === -1) errors.push({ field: 'result-two', message: 'Select the second confirmed result.' });
    if (errors.length) return { ok: false, errors: errors };

    var cells = [
      canonical(first[0], second[0]),
      canonical(first[0], second[1]),
      canonical(first[1], second[0]),
      canonical(first[1], second[1])
    ];
    var counts = {};
    cells.forEach(function (genotype) { counts[genotype] = (counts[genotype] || 0) + 1; });
    var outcomes = DISPLAY_ORDER.filter(function (genotype) { return counts[genotype]; }).map(function (genotype) {
      return {
        genotype: genotype,
        probability: counts[genotype] * 25,
        label: LABELS[genotype],
        category: CATEGORIES[genotype]
      };
    });
    return {
      ok: true,
      first: first,
      second: second,
      allelesFirst: first.split(''),
      allelesSecond: second.split(''),
      cells: cells,
      outcomes: outcomes,
      totalProbability: outcomes.reduce(function (sum, outcome) { return sum + outcome.probability; }, 0)
    };
  }

  return Object.freeze({
    calculate: calculate,
    canonical: canonical,
    validGenotypes: VALID,
    labels: LABELS,
    categories: CATEGORIES
  });
});
