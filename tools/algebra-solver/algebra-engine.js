(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.AfroAlgebraEngine = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var EPSILON = 1e-10;
  var NUMBER = '(?:\\d+(?:\\.\\d*)?|\\.\\d+)';

  function nearZero(value) {
    return Math.abs(value) <= EPSILON;
  }

  function normalise(value) {
    return String(value || '')
      .replace(/[−–—]/g, '-')
      .replace(/²/g, '^2')
      .replace(/≥/g, '>=')
      .replace(/≤/g, '<=')
      .replace(/\s+/g, '');
  }

  function failure(message, code) {
    return { ok: false, error: message, code: code || 'invalid_expression' };
  }

  function splitTerms(expression) {
    if (!expression) return null;
    var source = /^[+-]/.test(expression) ? expression : '+' + expression;
    var terms = source.match(/[+-][^+-]+/g);
    return terms && terms.join('') === source ? terms : null;
  }

  function numericPart(value, fallback) {
    if (value == null || value === '') return fallback;
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : NaN;
  }

  function parseTerm(raw, allowed) {
    var sign = raw[0] === '-' ? -1 : 1;
    var body = raw.slice(1);
    var denominator;
    var match;
    var coefficient;

    if (!body) return failure('A sign must be followed by a term.');

    if (allowed.x2 && body.indexOf('x^2') >= 0) {
      match = body.match(new RegExp('^(' + NUMBER + ')?\\*?x\\^2(?:\\/(' + NUMBER + '))?$'));
      if (!match) return failure('Quadratic terms must look like x^2, -3x^2, or x^2/2.');
      coefficient = numericPart(match[1], 1);
      denominator = numericPart(match[2], 1);
      if (nearZero(denominator)) return failure('Division by zero is not allowed.', 'division_by_zero');
      return { ok: true, kind: 'x2', value: sign * coefficient / denominator };
    }

    if (allowed.x && body.indexOf('x') >= 0) {
      match = body.match(new RegExp('^(' + NUMBER + ')?\\*?x(?:\\/(' + NUMBER + '))?$'));
      if (!match) return failure('Linear x terms must look like x, -3x, 2*x, or x/2.');
      coefficient = numericPart(match[1], 1);
      denominator = numericPart(match[2], 1);
      if (nearZero(denominator)) return failure('Division by zero is not allowed.', 'division_by_zero');
      return { ok: true, kind: 'x', value: sign * coefficient / denominator };
    }

    if (allowed.y && body.indexOf('y') >= 0) {
      match = body.match(new RegExp('^(' + NUMBER + ')?\\*?y(?:\\/(' + NUMBER + '))?$'));
      if (!match) return failure('Linear y terms must look like y, -3y, 2*y, or y/2.');
      coefficient = numericPart(match[1], 1);
      denominator = numericPart(match[2], 1);
      if (nearZero(denominator)) return failure('Division by zero is not allowed.', 'division_by_zero');
      return { ok: true, kind: 'y', value: sign * coefficient / denominator };
    }

    match = body.match(new RegExp('^(' + NUMBER + ')(?:\\/(' + NUMBER + '))?$'));
    if (!match) {
      return failure('Use expanded numeric terms only. Parentheses, roots, functions, and powers above x^2 are not supported.');
    }
    coefficient = numericPart(match[1], NaN);
    denominator = numericPart(match[2], 1);
    if (!Number.isFinite(coefficient)) return failure('Every constant must be a valid number.');
    if (nearZero(denominator)) return failure('Division by zero is not allowed.', 'division_by_zero');
    return { ok: true, kind: 'constant', value: sign * coefficient / denominator };
  }

  function parseExpression(value, allowed) {
    var expression = normalise(value);
    if (!expression) return failure('Enter a non-empty expression.');
    if (/[^0-9xy.+\-*/^]/i.test(expression)) {
      return failure('Only numbers, x, y, +, -, *, /, and x^2 are supported.');
    }
    if (/[XY]/.test(expression)) expression = expression.toLowerCase();
    if (expression.indexOf('^') >= 0 && !allowed.x2) {
      return failure('This equation type supports only first-degree terms.');
    }
    var terms = splitTerms(expression);
    if (!terms) return failure('Terms must be separated with + or - signs.');

    var output = { x2: 0, x: 0, y: 0, constant: 0 };
    for (var index = 0; index < terms.length; index += 1) {
      var parsed = parseTerm(terms[index], allowed);
      if (!parsed.ok) return parsed;
      output[parsed.kind] += parsed.value;
    }
    return { ok: true, data: output };
  }

  function splitEquation(value) {
    var source = normalise(value);
    var parts = source.split('=');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      return failure('Use exactly one equals sign with an expression on each side.');
    }
    return { ok: true, left: parts[0], right: parts[1], source: source };
  }

  function parseLinear(value) {
    var relation = splitEquation(value);
    if (!relation.ok) return relation;
    var left = parseExpression(relation.left, { x: true });
    var right = parseExpression(relation.right, { x: true });
    if (!left.ok) return left;
    if (!right.ok) return right;
    var data = {
      a_left: left.data.x,
      b_left: left.data.constant,
      a_right: right.data.x,
      b_right: right.data.constant
    };
    data.a = data.a_left - data.a_right;
    data.rhs = data.b_right - data.b_left;
    data.original = relation.source;
    return { ok: true, data: data };
  }

  function parseQuadratic(value) {
    var relation = splitEquation(value);
    if (!relation.ok) return relation;
    var left = parseExpression(relation.left, { x2: true, x: true });
    var right = parseExpression(relation.right, { x2: true, x: true });
    if (!left.ok) return left;
    if (!right.ok) return right;
    return {
      ok: true,
      data: {
        a: left.data.x2 - right.data.x2,
        b: left.data.x - right.data.x,
        c: left.data.constant - right.data.constant
      }
    };
  }

  function parseSystemEquation(value) {
    var relation = splitEquation(value);
    if (!relation.ok) return relation;
    var left = parseExpression(relation.left, { x: true, y: true });
    var right = parseExpression(relation.right, { x: true, y: true });
    if (!left.ok) return left;
    if (!right.ok) return right;
    return {
      ok: true,
      data: {
        a: left.data.x - right.data.x,
        b: left.data.y - right.data.y,
        c: right.data.constant - left.data.constant
      }
    };
  }

  function parseSimultaneous(first, second) {
    var one = parseSystemEquation(first);
    if (!one.ok) return one;
    var two = parseSystemEquation(second);
    if (!two.ok) return two;
    return {
      ok: true,
      data: {
        a1: one.data.a,
        b1: one.data.b,
        c1: one.data.c,
        a2: two.data.a,
        b2: two.data.b,
        c2: two.data.c
      }
    };
  }

  function parseInequality(value) {
    var source = normalise(value);
    var matches = source.match(/>=|<=|>|</g);
    if (!matches || matches.length !== 1) {
      return failure('Use exactly one inequality sign: >, <, >=, or <=.');
    }
    var operator = matches[0];
    var parts = source.split(operator);
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      return failure('Put a linear expression on each side of the inequality.');
    }
    var left = parseExpression(parts[0], { x: true });
    var right = parseExpression(parts[1], { x: true });
    if (!left.ok) return left;
    if (!right.ok) return right;
    return {
      ok: true,
      data: {
        a: left.data.x - right.data.x,
        b: right.data.constant - left.data.constant,
        op: operator,
        leftExpr: parts[0],
        rightExpr: parts[1]
      }
    };
  }

  function solveLinear(value) {
    var parsed = parseLinear(value);
    if (!parsed.ok) return parsed;
    var data = parsed.data;
    if (nearZero(data.a)) {
      return { ok: true, type: nearZero(data.rhs) ? 'all-real' : 'none', parsed: data };
    }
    return { ok: true, type: 'one', x: data.rhs / data.a, parsed: data };
  }

  function solveQuadratic(value) {
    var parsed = parseQuadratic(value);
    if (!parsed.ok) return parsed;
    var data = parsed.data;
    if (nearZero(data.a)) {
      return failure('The x^2 coefficient is zero. Choose Linear for this equation.', 'not_quadratic');
    }
    var discriminant = data.b * data.b - 4 * data.a * data.c;
    if (nearZero(discriminant)) discriminant = 0;
    if (discriminant > 0) {
      var squareRoot = Math.sqrt(discriminant);
      return {
        ok: true,
        type: 'two-real',
        discriminant: discriminant,
        roots: [
          (-data.b + squareRoot) / (2 * data.a),
          (-data.b - squareRoot) / (2 * data.a)
        ],
        parsed: data
      };
    }
    if (discriminant === 0) {
      return {
        ok: true,
        type: 'repeated',
        discriminant: 0,
        roots: [-data.b / (2 * data.a)],
        parsed: data
      };
    }
    return {
      ok: true,
      type: 'complex',
      discriminant: discriminant,
      real: -data.b / (2 * data.a),
      imaginary: Math.sqrt(-discriminant) / Math.abs(2 * data.a),
      parsed: data
    };
  }

  function solveSimultaneous(first, second) {
    var parsed = parseSimultaneous(first, second);
    if (!parsed.ok) return parsed;
    var data = parsed.data;
    var determinant = data.a1 * data.b2 - data.a2 * data.b1;
    var determinantX = data.c1 * data.b2 - data.c2 * data.b1;
    var determinantY = data.a1 * data.c2 - data.a2 * data.c1;
    if (nearZero(determinant)) {
      return {
        ok: true,
        type: nearZero(determinantX) && nearZero(determinantY) ? 'infinite' : 'none',
        determinant: 0,
        determinantX: determinantX,
        determinantY: determinantY,
        parsed: data
      };
    }
    return {
      ok: true,
      type: 'unique',
      determinant: determinant,
      determinantX: determinantX,
      determinantY: determinantY,
      x: determinantX / determinant,
      y: determinantY / determinant,
      parsed: data
    };
  }

  function compare(left, operator, right) {
    if (operator === '>') return left > right;
    if (operator === '>=') return left >= right;
    if (operator === '<') return left < right;
    return left <= right;
  }

  function flipOperator(operator) {
    return operator === '>' ? '<' : operator === '<' ? '>' : operator === '>=' ? '<=' : '>=';
  }

  function solveInequality(value) {
    var parsed = parseInequality(value);
    if (!parsed.ok) return parsed;
    var data = parsed.data;
    if (nearZero(data.a)) {
      return {
        ok: true,
        type: compare(0, data.op, data.b) ? 'all-real' : 'none',
        parsed: data
      };
    }
    return {
      ok: true,
      type: 'boundary',
      boundary: data.b / data.a,
      operator: data.a < 0 ? flipOperator(data.op) : data.op,
      flipped: data.a < 0,
      parsed: data
    };
  }

  function residualQuadratic(coefficients, x) {
    return coefficients.a * x * x + coefficients.b * x + coefficients.c;
  }

  return {
    EPSILON: EPSILON,
    parseLinear: parseLinear,
    parseQuadratic: parseQuadratic,
    parseSimultaneous: parseSimultaneous,
    parseInequality: parseInequality,
    solveLinear: solveLinear,
    solveQuadratic: solveQuadratic,
    solveSimultaneous: solveSimultaneous,
    solveInequality: solveInequality,
    residualQuadratic: residualQuadratic,
    nearZero: nearZero
  };
});
