/* Exact decimal input for the English Ghana and Naira wording tools. */
(function (root) {
  'use strict';
  function parse(raw, maximumMajor) {
    var input = String(raw == null ? '' : raw).trim();
    if (!input) return { valid: false, empty: true, error: '' };
    if (!/^(?:\d+|\d{1,3}(?:,\d{3})+|)(?:\.\d*)?$/.test(input) || input === '.') {
      return { valid: false, error: 'Enter a non-negative number, such as 1,250.75. Use a dot for decimals and commas only between groups of three digits.' };
    }
    var parts = input.replace(/,/g, '').split('.');
    var major = (parts[0] || '0').replace(/^0+(?=\d)/, '');
    var decimal = parts[1] || '';
    if (major.length > maximumMajor.length) return tooLarge(maximumMajor);
    // Work in integer hundredths; binary floating point must never choose a cent.
    var minor = (decimal + '00').slice(0, 2);
    var units = BigInt(major) * 100n + BigInt(minor);
    if (decimal.length > 2 && decimal[2] >= '5') units += 1n;
    if (units > BigInt(maximumMajor) * 100n + 99n) return tooLarge(maximumMajor);
    major = String(units / 100n);
    minor = String(units % 100n).padStart(2, '0');
    return {
      valid: true, major: Number(major), minor: Number(minor),
      canonical: major + '.' + minor,
      figure: group(major) + '.' + minor,
      rounded: decimal.length > 2
    };
  }
  function group(major) { return major.replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function tooLarge(maximumMajor) {
    return { valid: false, error: 'Maximum supported amount is ' + group(maximumMajor) + '.99 after rounding.' };
  }
  var api = { parse: parse };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.engines = root.AfroTools.engines || {};
    root.AfroTools.engines.amountWordsInput = api;
  }
})(typeof window === 'undefined' ? this : window);
