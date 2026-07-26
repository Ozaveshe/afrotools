(function (root, factory) {
  'use strict';

  var engine = factory();
  if (typeof module === 'object' && module.exports) module.exports = engine;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.binaryConverter = engine;
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var DIGITS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var MAX_INPUT_DIGITS = 512;

  function gcd(a, b) {
    var x = a < 0n ? -a : a;
    var y = b < 0n ? -b : b;
    while (y) {
      var next = x % y;
      x = y;
      y = next;
    }
    return x || 1n;
  }

  function digitValue(character) {
    return DIGITS.indexOf(String(character || '').toUpperCase());
  }

  function parseDigits(text, base) {
    var value = 0n;
    var radix = BigInt(base);
    for (var index = 0; index < text.length; index += 1) {
      var digit = digitValue(text[index]);
      if (digit < 0 || digit >= base) {
        throw new Error('Digit "' + text[index] + '" is not valid in base ' + base + '.');
      }
      value = (value * radix) + BigInt(digit);
    }
    return value;
  }

  function parse(value, base) {
    var radix = Number(base);
    if (!Number.isInteger(radix) || radix < 2 || radix > 36) {
      return { ok: false, error: 'Choose a whole-number base from 2 to 36.' };
    }

    var raw = String(value == null ? '' : value).trim();
    if (!raw) return { ok: false, error: 'Enter a number to convert.' };
    if (/\s/u.test(raw)) {
      return { ok: false, error: 'Remove spaces and digit-group separators from the input.' };
    }
    if (/^[-+]?0[bxo]/iu.test(raw)) {
      return { ok: false, error: 'Choose the input base instead of using a 0b, 0o, or 0x prefix.' };
    }

    var sign = 1n;
    if (raw[0] === '-' || raw[0] === '+') {
      if (raw[0] === '-') sign = -1n;
      raw = raw.slice(1);
    }
    if (!raw || raw === '.') return { ok: false, error: 'Enter at least one digit.' };
    if ((raw.match(/\./g) || []).length > 1) {
      return { ok: false, error: 'Use only one radix point.' };
    }

    var parts = raw.split('.');
    var integerText = parts[0] || '0';
    var fractionText = parts[1] || '';
    if ((integerText.length + fractionText.length) > MAX_INPUT_DIGITS) {
      return {
        ok: false,
        error: 'Keep the input to ' + MAX_INPUT_DIGITS + ' digits or fewer for responsive browser use.'
      };
    }

    try {
      var integer = parseDigits(integerText, radix);
      var denominator = BigInt(radix) ** BigInt(fractionText.length);
      var numerator = (integer * denominator) + (fractionText ? parseDigits(fractionText, radix) : 0n);
      numerator *= sign;
      var divisor = gcd(numerator, denominator);
      numerator /= divisor;
      denominator /= divisor;
      if (numerator === 0n) numerator = 0n;

      return {
        ok: true,
        base: radix,
        numerator: numerator,
        denominator: denominator,
        isInteger: denominator === 1n,
        isNegative: numerator < 0n,
        source: String(value).trim(),
        inputDigits: integerText.length + fractionText.length
      };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  function format(parsed, base, options) {
    if (!parsed || !parsed.ok) {
      return { ok: false, error: parsed && parsed.error ? parsed.error : 'Invalid number.' };
    }
    var radix = Number(base);
    if (!Number.isInteger(radix) || radix < 2 || radix > 36) {
      return { ok: false, error: 'Output base must be from 2 to 36.' };
    }

    var settings = options || {};
    var maxFractionDigits = Number.isInteger(settings.maxFractionDigits)
      ? Math.max(1, Math.min(128, settings.maxFractionDigits))
      : 32;
    var numerator = parsed.numerator;
    var negative = numerator < 0n;
    var absolute = negative ? -numerator : numerator;
    var integer = absolute / parsed.denominator;
    var remainder = absolute % parsed.denominator;
    var integerText = integer.toString(radix).toUpperCase();
    var fraction = [];
    var seen = new Map();
    var repeatStart = -1;

    while (remainder && fraction.length < maxFractionDigits) {
      var key = remainder.toString();
      if (seen.has(key)) {
        repeatStart = seen.get(key);
        break;
      }
      seen.set(key, fraction.length);
      remainder *= BigInt(radix);
      var digit = remainder / parsed.denominator;
      remainder %= parsed.denominator;
      fraction.push(DIGITS[Number(digit)]);
    }

    var exact = remainder === 0n;
    var repeating = repeatStart >= 0;
    var truncated = !exact && !repeating;
    var fractionText = fraction.join('');
    if (repeating) {
      fractionText = fractionText.slice(0, repeatStart)
        + '(' + fractionText.slice(repeatStart) + ')';
    } else if (truncated) {
      fractionText += '…';
    }
    var sign = negative && absolute !== 0n ? '-' : '';

    return {
      ok: true,
      base: radix,
      value: sign + integerText + (fractionText ? '.' + fractionText : ''),
      integer: sign + integerText,
      exact: exact,
      repeating: repeating,
      truncated: truncated,
      fractionDigits: fraction.length,
      note: exact
        ? 'Exact representation'
        : repeating
          ? 'Repeating digits are shown in parentheses'
          : 'Truncated after ' + maxFractionDigits + ' fractional digits'
    };
  }

  function convert(value, fromBase, outputBases, options) {
    var parsed = parse(value, fromBase);
    if (!parsed.ok) return { ok: false, error: parsed.error, parsed: parsed };
    var bases = Array.from(new Set(outputBases || [2, 8, 10, 16]));
    var outputs = bases.map(function (base) {
      return format(parsed, base, options);
    });
    var failed = outputs.find(function (output) { return !output.ok; });
    return failed
      ? { ok: false, error: failed.error, parsed: parsed }
      : { ok: true, parsed: parsed, outputs: outputs };
  }

  function twosComplement(value, width) {
    var bits = Number(width);
    var integer = typeof value === 'bigint' ? value : BigInt(value);
    if (![8, 16, 32, 64].includes(bits)) {
      return { ok: false, error: 'Width must be 8, 16, 32, or 64 bits.' };
    }
    var modulus = 1n << BigInt(bits);
    var minimum = -(1n << BigInt(bits - 1));
    var maximum = (1n << BigInt(bits - 1)) - 1n;
    if (integer < minimum || integer > maximum) {
      return {
        ok: false,
        error: integer.toString() + ' is outside the signed ' + bits + '-bit range.'
      };
    }
    var encoded = integer < 0n ? modulus + integer : integer;
    return {
      ok: true,
      width: bits,
      value: integer,
      bits: encoded.toString(2).padStart(bits, '0'),
      hex: encoded.toString(16).toUpperCase().padStart(bits / 4, '0')
    };
  }

  function parseSignedDecimal32(value, label) {
    var text = String(value == null ? '' : value).trim();
    if (!/^[+-]?\d+$/u.test(text)) {
      return { ok: false, error: (label || 'Value') + ' must be a decimal integer.' };
    }
    var integer = BigInt(text);
    if (integer < -2147483648n || integer > 2147483647n) {
      return { ok: false, error: (label || 'Value') + ' must fit a signed 32-bit integer.' };
    }
    return { ok: true, value: Number(integer) };
  }

  function bitwise32(aValue, bValue) {
    var a = parseSignedDecimal32(aValue, 'Operand A');
    var b = parseSignedDecimal32(bValue, 'Operand B');
    if (!a.ok) return a;
    if (!b.ok) return b;
    var values = [
      ['AND', a.value & b.value],
      ['OR', a.value | b.value],
      ['XOR', a.value ^ b.value],
      ['NOT A', ~a.value],
      ['A << 1', a.value << 1],
      ['A >> 1', a.value >> 1]
    ];
    return {
      ok: true,
      operations: values.map(function (entry) {
        return {
          name: entry[0],
          decimal: entry[1],
          unsignedBinary: (entry[1] >>> 0).toString(2).padStart(32, '0')
        };
      })
    };
  }

  function binaryArithmetic(aValue, bValue, operation) {
    var a = parse(aValue, 2);
    var b = parse(bValue, 2);
    if (!a.ok) return { ok: false, error: 'Binary A: ' + a.error };
    if (!b.ok) return { ok: false, error: 'Binary B: ' + b.error };
    if (!a.isInteger || !b.isInteger) {
      return { ok: false, error: 'Binary arithmetic accepts integers only.' };
    }
    var result = operation === 'subtract'
      ? a.numerator - b.numerator
      : a.numerator + b.numerator;
    return {
      ok: true,
      operation: operation === 'subtract' ? 'subtract' : 'add',
      a: a.numerator,
      b: b.numerator,
      result: result,
      binary: (result < 0n ? '-' : '') + (result < 0n ? -result : result).toString(2),
      decimal: result.toString()
    };
  }

  return {
    DIGITS: DIGITS,
    MAX_INPUT_DIGITS: MAX_INPUT_DIGITS,
    parse: parse,
    format: format,
    convert: convert,
    twosComplement: twosComplement,
    bitwise32: bitwise32,
    binaryArithmetic: binaryArithmetic
  };
});
