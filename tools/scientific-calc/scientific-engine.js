(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.scientificEngine = api;
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var MAX_EXPRESSION_LENGTH = 512;
  var FUNCTIONS = new Set(['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'sqrt', 'cbrt', 'abs', 'exp', 'log', 'ln']);

  function tokenize(source) {
    var input = String(source == null ? '' : source).replace(/π/gu, 'pi');
    if (!input.trim()) throw new Error('Enter an expression.');
    if (input.length > MAX_EXPRESSION_LENGTH) throw new Error('Keep the expression to 512 characters or fewer.');
    var tokens = [];
    var index = 0;
    while (index < input.length) {
      var rest = input.slice(index);
      var whitespace = /^\s+/u.exec(rest);
      if (whitespace) { index += whitespace[0].length; continue; }
      var number = /^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/u.exec(rest);
      if (number) {
        var value = Number(number[0]);
        if (!Number.isFinite(value)) throw new Error('Use a finite numeric value.');
        tokens.push({ type: 'number', value: value, raw: number[0] });
        index += number[0].length;
        continue;
      }
      var identifier = /^[A-Za-z]+/u.exec(rest);
      if (identifier) {
        tokens.push({ type: 'identifier', value: identifier[0].toLowerCase() });
        index += identifier[0].length;
        continue;
      }
      var character = input[index];
      if ('+-*/%^!(),'.includes(character)) {
        tokens.push({ type: character, value: character });
        index += 1;
        continue;
      }
      throw new Error('Unsupported character: ' + character + '.');
    }
    tokens.push({ type: 'end', value: '' });
    return tokens;
  }

  function factorial(value) {
    if (!Number.isInteger(value) || value < 0) throw new Error('Factorial requires a non-negative whole number.');
    if (value > 170) throw new Error('Factorial supports whole numbers from 0 to 170.');
    var result = 1;
    for (var index = 2; index <= value; index += 1) result *= index;
    return result;
  }

  function applyFunction(name, value, angleMode) {
    var degrees = angleMode === 'DEG';
    var radians = degrees ? value * Math.PI / 180 : value;
    var result;
    if (name === 'sin') result = Math.sin(radians);
    else if (name === 'cos') result = Math.cos(radians);
    else if (name === 'tan') {
      if (Math.abs(Math.cos(radians)) < 1e-15) throw new Error('Tangent is undefined at this angle.');
      result = Math.tan(radians);
    } else if (name === 'asin') {
      result = Math.asin(value);
      if (degrees) result = result * 180 / Math.PI;
    } else if (name === 'acos') {
      result = Math.acos(value);
      if (degrees) result = result * 180 / Math.PI;
    } else if (name === 'atan') {
      result = Math.atan(value);
      if (degrees) result = result * 180 / Math.PI;
    } else if (name === 'sqrt') result = Math.sqrt(value);
    else if (name === 'cbrt') result = Math.cbrt(value);
    else if (name === 'abs') result = Math.abs(value);
    else if (name === 'exp') result = Math.exp(value);
    else if (name === 'log') result = Math.log10(value);
    else if (name === 'ln') result = Math.log(value);
    else throw new Error('Unsupported function: ' + name + '.');
    if (!Number.isFinite(result)) throw new Error('The expression is outside this function’s real, finite domain.');
    return result;
  }

  function Parser(tokens, angleMode) {
    this.tokens = tokens;
    this.position = 0;
    this.angleMode = angleMode === 'RAD' ? 'RAD' : 'DEG';
  }

  Parser.prototype.current = function () { return this.tokens[this.position]; };
  Parser.prototype.take = function (type) {
    if (this.current().type !== type) return false;
    this.position += 1;
    return true;
  };
  Parser.prototype.require = function (type, message) {
    if (!this.take(type)) throw new Error(message);
  };
  Parser.prototype.parse = function () {
    var value = this.additive();
    if (this.current().type !== 'end') {
      throw new Error('Unexpected token "' + this.current().value + '". Use an explicit operator between values.');
    }
    if (!Number.isFinite(value)) throw new Error('The expression does not have a finite real result.');
    return value;
  };
  Parser.prototype.additive = function () {
    var value = this.multiplicative();
    while (this.current().type === '+' || this.current().type === '-') {
      var operator = this.current().type;
      this.position += 1;
      var right = this.multiplicative();
      value = operator === '+' ? value + right : value - right;
    }
    return value;
  };
  Parser.prototype.multiplicative = function () {
    var value = this.unary();
    while (this.current().type === '*' || this.current().type === '/' || this.current().type === '%') {
      var operator = this.current().type;
      this.position += 1;
      var right = this.unary();
      if ((operator === '/' || operator === '%') && right === 0) throw new Error('Division or modulo by zero is not defined.');
      value = operator === '*' ? value * right : operator === '/' ? value / right : value % right;
    }
    return value;
  };
  Parser.prototype.unary = function () {
    if (this.take('+')) return this.unary();
    if (this.take('-')) return -this.unary();
    return this.power();
  };
  Parser.prototype.power = function () {
    var value = this.postfix();
    if (this.take('^')) value = Math.pow(value, this.unary());
    if (!Number.isFinite(value)) throw new Error('The power is outside the finite real-number range.');
    return value;
  };
  Parser.prototype.postfix = function () {
    var value = this.primary();
    while (this.take('!')) value = factorial(value);
    return value;
  };
  Parser.prototype.primary = function () {
    var token = this.current();
    if (token.type === 'number') {
      this.position += 1;
      return token.value;
    }
    if (token.type === 'identifier') {
      this.position += 1;
      if (token.value === 'pi') return Math.PI;
      if (token.value === 'e') return Math.E;
      if (!FUNCTIONS.has(token.value)) throw new Error('Unsupported name: ' + token.value + '.');
      this.require('(', 'Put the ' + token.value + ' argument in parentheses.');
      var argument = this.additive();
      this.require(')', 'Close the ' + token.value + ' parentheses.');
      return applyFunction(token.value, argument, this.angleMode);
    }
    if (this.take('(')) {
      var value = this.additive();
      this.require(')', 'Close every opening parenthesis.');
      return value;
    }
    throw new Error('Expected a number, constant, function, or opening parenthesis.');
  };

  function evaluate(expression, options) {
    try {
      var parser = new Parser(tokenize(expression), options && options.angleMode);
      return { ok: true, value: parser.parse(), angleMode: parser.angleMode };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  function format(value, significantDigits) {
    if (!Number.isFinite(value)) return 'Not defined';
    if (Object.is(value, -0) || Math.abs(value) < 1e-15) value = 0;
    var digits = Math.max(3, Math.min(15, significantDigits || 12));
    if (Number.isInteger(value) && Math.abs(value) < 1e15) return String(value);
    return Number(value.toPrecision(digits)).toString();
  }

  return {
    MAX_EXPRESSION_LENGTH: MAX_EXPRESSION_LENGTH,
    tokenize: tokenize,
    factorial: factorial,
    evaluate: evaluate,
    format: format
  };
}));
