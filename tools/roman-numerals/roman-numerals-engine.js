(function (root, factory) {
  'use strict';

  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.romanNumerals = api;
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var TOKENS = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
    [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
  ];
  var VALUES = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  var DECIMAL_PATTERN = /^(?:[1-9]\d{0,3})$/;
  var ROMAN_PATTERN = /^[IVXLCDM]+$/i;
  var MAX_BATCH_ROWS = 200;

  function toRoman(value) {
    if (!Number.isInteger(value) || value < 1 || value > 3999) return null;
    var remaining = value;
    var output = '';
    for (var i = 0; i < TOKENS.length; i += 1) {
      while (remaining >= TOKENS[i][0]) {
        output += TOKENS[i][1];
        remaining -= TOKENS[i][0];
      }
    }
    return output;
  }

  function fromRoman(value) {
    var text = typeof value === 'string' ? value.trim().toUpperCase() : '';
    if (!text || !ROMAN_PATTERN.test(text)) return null;

    var total = 0;
    for (var i = 0; i < text.length; i += 1) {
      var current = VALUES[text[i]];
      var next = VALUES[text[i + 1]] || 0;
      total += current < next ? -current : current;
    }

    return total >= 1 && total <= 3999 && toRoman(total) === text ? total : null;
  }

  function explainDecimal(value) {
    if (!Number.isInteger(value) || value < 1 || value > 3999) return [];
    var remaining = value;
    var steps = [];
    for (var i = 0; i < TOKENS.length; i += 1) {
      var count = Math.floor(remaining / TOKENS[i][0]);
      if (!count) continue;
      var partValue = count * TOKENS[i][0];
      var symbols = TOKENS[i][1].repeat(count);
      steps.push({ value: partValue, symbols: symbols });
      remaining -= partValue;
    }
    return steps;
  }

  function convert(rawValue) {
    var raw = typeof rawValue === 'string' ? rawValue.trim() : String(rawValue == null ? '' : rawValue).trim();
    if (!raw) return { ok: false, empty: true, message: 'Enter a whole number from 1 to 3999 or a Roman numeral.' };

    if (DECIMAL_PATTERN.test(raw)) {
      var number = Number(raw);
      if (number > 3999) return { ok: false, inputType: 'decimal', message: 'Enter a whole number from 1 to 3999.' };
      var roman = toRoman(number);
      return {
        ok: true,
        inputType: 'decimal',
        input: raw,
        decimal: number,
        roman: roman,
        output: roman,
        equation: number + ' = ' + roman,
        steps: explainDecimal(number)
      };
    }

    if (ROMAN_PATTERN.test(raw)) {
      var decimal = fromRoman(raw);
      if (decimal === null) {
        return {
          ok: false,
          inputType: 'roman',
          message: 'That is not a conventional Roman numeral. Try a form such as IV, XL or MCMXCIX.'
        };
      }
      var canonical = raw.toUpperCase();
      return {
        ok: true,
        inputType: 'roman',
        input: canonical,
        decimal: decimal,
        roman: canonical,
        output: String(decimal),
        equation: canonical + ' = ' + decimal,
        steps: explainDecimal(decimal)
      };
    }

    return {
      ok: false,
      inputType: 'unknown',
      message: 'Use digits only for a whole number, or the letters I, V, X, L, C, D and M.'
    };
  }

  function convertBatch(rawText, limit) {
    var maxRows = Number.isInteger(limit) && limit > 0 ? limit : MAX_BATCH_ROWS;
    var rows = String(rawText == null ? '' : rawText)
      .split(/\r?\n/)
      .map(function (line) { return line.trim(); })
      .filter(Boolean);

    var accepted = rows.slice(0, maxRows).map(function (input) {
      return { input: input, result: convert(input) };
    });

    return {
      rows: accepted,
      totalRows: rows.length,
      truncated: rows.length > maxRows,
      limit: maxRows
    };
  }

  function checkQuizAnswer(direction, number, rawAnswer) {
    if (!Number.isInteger(number) || number < 1 || number > 3999) return false;
    var answer = String(rawAnswer == null ? '' : rawAnswer).trim();
    if (direction === 'toRoman') return fromRoman(answer) === number && answer.toUpperCase() === toRoman(number);
    if (direction === 'toDecimal') return DECIMAL_PATTERN.test(answer) && Number(answer) === number;
    return false;
  }

  return {
    MAX_BATCH_ROWS: MAX_BATCH_ROWS,
    toRoman: toRoman,
    fromRoman: fromRoman,
    explainDecimal: explainDecimal,
    convert: convert,
    convertBatch: convertBatch,
    checkQuizAnswer: checkQuizAnswer
  };
});
