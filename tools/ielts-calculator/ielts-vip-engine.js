(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.IELTSVipEngine = api;
}(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var TABLES = {
    listening: [
      [39, 9], [37, 8.5], [35, 8], [32, 7.5], [30, 7], [26, 6.5],
      [23, 6], [18, 5.5], [16, 5], [13, 4.5], [11, 4]
    ],
    academic: [
      [39, 9], [37, 8.5], [35, 8], [33, 7.5], [30, 7], [27, 6.5],
      [23, 6], [19, 5.5], [15, 5], [13, 4.5], [10, 4]
    ],
    general: [
      [40, 9], [39, 8.5], [37, 8], [36, 7.5], [34, 7], [32, 6.5],
      [30, 6], [27, 5.5], [23, 5], [19, 4.5], [15, 4]
    ]
  };

  function number(value) {
    if (value === '' || value === null || value === undefined) return null;
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function validBand(value) {
    var parsed = number(value);
    return parsed !== null && parsed >= 0 && parsed <= 9 && Number.isInteger(parsed * 2);
  }

  function calculateOverall(values) {
    var names = ['listening', 'reading', 'writing', 'speaking'];
    var scores = {};
    names.forEach(function (name) {
      scores[name] = number(values && values[name]);
      if (!validBand(scores[name])) throw new Error(name + ' must be a whole or half band from 0 to 9.');
    });
    var average = names.reduce(function (total, name) { return total + scores[name]; }, 0) / 4;
    return {
      scores: scores,
      average: average,
      overall: Math.round(average * 2) / 2,
      weakest: names.filter(function (name) {
        return scores[name] === Math.min.apply(null, names.map(function (key) { return scores[key]; }));
      })
    };
  }

  function rawEstimate(raw, section, mode) {
    var parsed = number(raw);
    if (parsed === null || !Number.isInteger(parsed) || parsed < 0 || parsed > 40) {
      return { valid: false, band: null, display: '—' };
    }
    var table = section === 'listening' ? TABLES.listening : TABLES[mode === 'general' ? 'general' : 'academic'];
    var band = null;
    for (var index = 0; index < table.length; index += 1) {
      if (parsed >= table[index][0]) {
        band = table[index][1];
        break;
      }
    }
    return {
      valid: true,
      band: band,
      display: band === null ? 'Below 4.0' : band.toFixed(1),
      estimateOnly: true
    };
  }

  function compare(overall, target) {
    var score = number(overall);
    var goal = number(target);
    if (!validBand(score) || !validBand(goal) || goal < 1) throw new Error('Choose a valid comparison target.');
    var gap = Math.max(0, goal - score);
    return {
      overall: score,
      target: goal,
      gap: gap,
      status: score >= goal ? 'at-or-above' : gap <= 0.5 ? 'within-half-band' : 'below'
    };
  }

  return {
    TABLES: TABLES,
    validBand: validBand,
    calculateOverall: calculateOverall,
    rawEstimate: rawEstimate,
    compare: compare
  };
}));
