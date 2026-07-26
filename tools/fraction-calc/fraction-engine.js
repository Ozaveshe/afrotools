(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.fractionEngine = api;
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var OPERATIONS = {
    add: { symbol: '+', label: 'add' },
    sub: { symbol: '\u2212', label: 'subtract' },
    mul: { symbol: '\u00d7', label: 'multiply' },
    div: { symbol: '\u00f7', label: 'divide' }
  };

  function abs(value) {
    return value < 0n ? -value : value;
  }

  function gcd(left, right) {
    var a = abs(left);
    var b = abs(right);
    while (b !== 0n) {
      var remainder = a % b;
      a = b;
      b = remainder;
    }
    return a;
  }

  function normalise(numerator, denominator) {
    if (denominator < 0n) return { n: -numerator, d: -denominator };
    return { n: numerator, d: denominator };
  }

  function simplify(numerator, denominator) {
    var normal = normalise(numerator, denominator);
    if (normal.n === 0n) return { n: 0n, d: 1n };
    var divisor = gcd(normal.n, normal.d);
    return { n: normal.n / divisor, d: normal.d / divisor };
  }

  function formatFraction(numerator, denominator) {
    return denominator === 1n ? String(numerator) : String(numerator) + '/' + String(denominator);
  }

  function formatMixed(numerator, denominator) {
    var fraction = simplify(numerator, denominator);
    if (fraction.d === 1n || abs(fraction.n) < fraction.d) {
      return formatFraction(fraction.n, fraction.d);
    }
    var whole = fraction.n / fraction.d;
    var remainder = abs(fraction.n % fraction.d);
    return String(whole) + ' ' + String(remainder) + '/' + String(fraction.d);
  }

  function formatRational(numerator, denominator, places) {
    var negative = numerator < 0n;
    var unsigned = abs(numerator);
    var scale = 10n ** BigInt(places);
    var scaled = unsigned * scale;
    var quotient = scaled / denominator;
    var remainder = scaled % denominator;
    var exact = remainder === 0n;

    if (remainder * 2n >= denominator) quotient += 1n;

    var whole = quotient / scale;
    var fraction = String(quotient % scale).padStart(places, '0').replace(/0+$/, '');
    var text = (negative && quotient !== 0n ? '-' : '') + String(whole);
    if (fraction) text += '.' + fraction;
    return { text: text, approximate: !exact };
  }

  function parseInteger(value, field, optional) {
    var text = String(value == null ? '' : value).trim();
    if (!text) {
      if (optional) return { ok: true, value: 0n, empty: true };
      return { ok: false, field: field, error: 'Enter ' + field + '.' };
    }
    if (!/^[+-]?\d+$/.test(text)) {
      return { ok: false, field: field, error: field + ' must be a whole number.' };
    }
    if (text.replace(/^[+-]/, '').length > 30) {
      return { ok: false, field: field, error: field + ' is too large. Use at most 30 digits.' };
    }
    return { ok: true, value: BigInt(text), empty: false };
  }

  function parseOperand(input, position) {
    var prefix = position === 1 ? 'First' : 'Second';
    var whole = parseInteger(input.whole, prefix + ' whole number', true);
    if (!whole.ok) return whole;
    var numerator = parseInteger(input.numerator, prefix + ' numerator', false);
    if (!numerator.ok) return numerator;
    var denominator = parseInteger(input.denominator, prefix + ' denominator', false);
    if (!denominator.ok) return denominator;
    if (denominator.value === 0n) {
      return { ok: false, field: prefix + ' denominator', error: prefix + ' denominator cannot be zero.' };
    }
    if (denominator.value < 0n) {
      return { ok: false, field: prefix + ' denominator', error: prefix + ' denominator must be positive. Put the minus sign on the numerator or whole number.' };
    }
    if (!whole.empty && whole.value !== 0n && numerator.value < 0n) {
      return { ok: false, field: prefix + ' numerator', error: 'For a mixed number, keep the numerator non-negative and put the minus sign on the whole number.' };
    }

    var improperNumerator;
    if (!whole.empty && whole.value !== 0n) {
      var sign = whole.value < 0n ? -1n : 1n;
      improperNumerator = sign * (abs(whole.value) * denominator.value + numerator.value);
    } else {
      improperNumerator = numerator.value;
    }

    return {
      ok: true,
      fraction: { n: improperNumerator, d: denominator.value },
      wasMixed: !whole.empty && whole.value !== 0n,
      display: (!whole.empty && whole.value !== 0n)
        ? String(whole.value) + ' ' + String(numerator.value) + '/' + String(denominator.value)
        : formatFraction(numerator.value, denominator.value)
    };
  }

  function calculate(input) {
    input = input || {};
    var operation = OPERATIONS[input.operation];
    if (!operation) return { ok: false, field: 'Operation', error: 'Choose a supported operation.' };

    var left = parseOperand(input.left || {}, 1);
    if (!left.ok) return left;
    var right = parseOperand(input.right || {}, 2);
    if (!right.ok) return right;
    if (input.operation === 'div' && right.fraction.n === 0n) {
      return { ok: false, field: 'Second numerator', error: 'Cannot divide by zero.' };
    }

    var a = left.fraction;
    var b = right.fraction;
    var rawNumerator;
    var rawDenominator;
    var steps = [];

    if (left.wasMixed) {
      steps.push('Convert ' + left.display + ' to the improper fraction ' + formatFraction(a.n, a.d) + '.');
    }
    if (right.wasMixed) {
      steps.push('Convert ' + right.display + ' to the improper fraction ' + formatFraction(b.n, b.d) + '.');
    }

    if (input.operation === 'add' || input.operation === 'sub') {
      var commonDenominator = (a.d / gcd(a.d, b.d)) * b.d;
      var leftMultiplier = commonDenominator / a.d;
      var rightMultiplier = commonDenominator / b.d;
      var adjustedLeft = a.n * leftMultiplier;
      var adjustedRight = b.n * rightMultiplier;
      steps.push('Use the least common denominator ' + String(commonDenominator) + '.');
      steps.push('Rewrite the fractions as ' + formatFraction(adjustedLeft, commonDenominator) + ' and ' + formatFraction(adjustedRight, commonDenominator) + '.');
      rawNumerator = input.operation === 'add'
        ? adjustedLeft + adjustedRight
        : adjustedLeft - adjustedRight;
      rawDenominator = commonDenominator;
      steps.push((input.operation === 'add' ? 'Add' : 'Subtract') + ' the numerators: ' +
        String(adjustedLeft) + ' ' + operation.symbol + ' ' + String(adjustedRight) +
        ' = ' + String(rawNumerator) + '.');
    } else if (input.operation === 'mul') {
      rawNumerator = a.n * b.n;
      rawDenominator = a.d * b.d;
      steps.push('Multiply the numerators: ' + String(a.n) + ' \u00d7 ' + String(b.n) + ' = ' + String(rawNumerator) + '.');
      steps.push('Multiply the denominators: ' + String(a.d) + ' \u00d7 ' + String(b.d) + ' = ' + String(rawDenominator) + '.');
    } else {
      rawNumerator = a.n * b.d;
      rawDenominator = a.d * b.n;
      steps.push('Use the reciprocal of the second fraction: ' + formatFraction(b.d, b.n) + '.');
      steps.push('Multiply: ' + formatFraction(a.n, a.d) + ' \u00d7 ' + formatFraction(b.d, b.n) + ' = ' + formatFraction(rawNumerator, rawDenominator) + '.');
    }

    var raw = normalise(rawNumerator, rawDenominator);
    var reduced = simplify(raw.n, raw.d);
    var divisor = gcd(raw.n, raw.d);
    if (divisor > 1n) {
      steps.push('Divide numerator and denominator by their GCD, ' + String(divisor) + ', to simplify to ' + formatFraction(reduced.n, reduced.d) + '.');
    } else {
      steps.push('The result is already in simplest form.');
    }

    var decimal = formatRational(reduced.n, reduced.d, 10);
    var percentage = formatRational(reduced.n * 100n, reduced.d, 8);

    return {
      ok: true,
      expression: left.display + ' ' + operation.symbol + ' ' + right.display,
      operation: operation.label,
      raw: { n: raw.n, d: raw.d, text: formatFraction(raw.n, raw.d) },
      simplified: { n: reduced.n, d: reduced.d, text: formatFraction(reduced.n, reduced.d) },
      mixed: formatMixed(reduced.n, reduced.d),
      decimal: decimal,
      percentage: { text: percentage.text + '%', approximate: percentage.approximate },
      steps: steps
    };
  }

  return {
    calculate: calculate,
    gcd: gcd,
    simplify: simplify,
    formatMixed: formatMixed,
    formatRational: formatRational
  };
});
