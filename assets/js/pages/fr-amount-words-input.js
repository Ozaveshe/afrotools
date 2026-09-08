/* French input grammar for the two native NGN/GHS wording pages. */
(function (root) {
  'use strict';
  var engine = typeof module === 'object' && module.exports
    ? require('../engines/amount-words-input')
    : root.AfroTools.engines.amountWordsInput;

  function parse(raw, maximumMajor) {
    var input = String(raw == null ? '' : raw).trim();
    var invalid = 'Saisissez un montant positif ou nul, par exemple 1250.75 ou 1 250,75. Pour éviter toute ambiguïté, utilisez un point au-delà de deux décimales.';
    // Spaces must delimit complete thousands groups. A single comma followed
    // by three or more digits is ambiguous without such grouping.
    if (/[\s]/.test(input)) {
      if (!/^\d{1,3}(?:[ \u00a0\u202f]\d{3})+(?:[.,]\d+)?$/.test(input)) return { valid: false, error: invalid };
      input = input.replace(/[ \u00a0\u202f]/g, '').replace(',', '.');
    } else if (input.includes(',') && !input.includes('.')) {
      if (/^\d+,\d{1,2}$/.test(input)) input = input.replace(',', '.');
      else if (!/^\d{1,3}(?:,\d{3}){2,}$/.test(input)) return { valid: false, error: invalid };
    }
    var result = engine.parse(input, maximumMajor);
    if (!result.valid) {
      return {
        valid: false,
        error: result.error && result.error.startsWith('Maximum')
          ? 'Le montant maximal après arrondi est ' + maximumMajor.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ',99.'
          : invalid
      };
    }
    return result;
  }

  var api = { parse: parse };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AfroTools.frAmountWordsInput = api;
})(typeof window === 'undefined' ? this : window);
