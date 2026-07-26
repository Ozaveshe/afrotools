(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.JambAggregateEngine = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function number(value) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function calculate(input) {
    var utme = number(input && input.utme);
    var postUtme = number(input && input.postUtme);
    var utmeWeight = number(input && input.utmeWeight);
    var postUtmeWeight = number(input && input.postUtmeWeight);
    var benchmark = input && input.benchmark !== '' ? number(input.benchmark) : null;

    if (utme === null || utme < 0 || utme > 400) {
      return { ok: false, error: 'UTME score must be between 0 and 400.' };
    }
    if (postUtme === null || postUtme < 0 || postUtme > 100) {
      return { ok: false, error: 'Post-UTME score must be between 0 and 100.' };
    }
    if (utmeWeight === null || postUtmeWeight === null || utmeWeight < 0 || postUtmeWeight < 0) {
      return { ok: false, error: 'Enter non-negative UTME and Post-UTME weights.' };
    }
    if (Math.abs((utmeWeight + postUtmeWeight) - 100) > 0.001) {
      return { ok: false, error: 'UTME and Post-UTME weights must add up to 100%.' };
    }
    if (benchmark !== null && (benchmark < 0 || benchmark > 100)) {
      return { ok: false, error: 'The published benchmark must be between 0 and 100.' };
    }

    var normalizedUtme = utme / 4;
    var utmeContribution = normalizedUtme * utmeWeight / 100;
    var postUtmeContribution = postUtme * postUtmeWeight / 100;
    var aggregate = utmeContribution + postUtmeContribution;

    return {
      ok: true,
      utme: utme,
      postUtme: postUtme,
      utmeWeight: utmeWeight,
      postUtmeWeight: postUtmeWeight,
      normalizedUtme: normalizedUtme,
      utmeContribution: utmeContribution,
      postUtmeContribution: postUtmeContribution,
      aggregate: aggregate,
      benchmark: benchmark,
      difference: benchmark === null ? null : aggregate - benchmark
    };
  }

  return { calculate: calculate };
}));
