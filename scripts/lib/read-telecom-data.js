'use strict';

const fs = require('node:fs');
const path = require('node:path');
const acorn = require('acorn');

const DEFAULT_DATASET = path.resolve(__dirname, '../../data/telecom/country-telecom-index.js');

// Node consumers need the archived initializer, never the browser live-overlay BOOT.
// Parse the entire source for syntax, then interpret only JSON-like data nodes.
// No eval, Function, VM, browser globals, fetch or other executable expressions.
function parseTelecomData(source) {
  const program = acorn.parse(source, { ecmaVersion: 'latest', sourceType: 'script' });
  const declarations = program.body.filter(node => node.type === 'VariableDeclaration')
    .flatMap(node => node.declarations)
    .filter(node => node.id.type === 'Identifier' && node.id.name === 'TELECOM_DATA');
  if (declarations.length !== 1) throw new Error('Expected exactly one top-level TELECOM_DATA initializer');

  function value(node) {
    if (!node) throw new Error('Missing Telecom data value');
    if (node.type === 'Literal') {
      if (node.value === null || typeof node.value === 'string' || typeof node.value === 'boolean') return node.value;
      if (typeof node.value === 'number' && Number.isFinite(node.value)) return node.value;
    }
    if (node.type === 'UnaryExpression' && ['!', '+', '-'].includes(node.operator)) {
      const operand = value(node.argument);
      if (node.operator === '!') return !operand;
      if (typeof operand === 'number') return node.operator === '-' ? -operand : operand;
    }
    if (node.type === 'ArrayExpression') return node.elements.map(value);
    if (node.type === 'ObjectExpression') {
      const result = {};
      for (const property of node.properties) {
        if (property.type !== 'Property' || property.kind !== 'init' || property.method || property.computed || property.shorthand) {
          throw new Error('Executable or computed Telecom data property is not supported');
        }
        const key = property.key.type === 'Identifier' ? property.key.name : value(property.key);
        if (!['string', 'number'].includes(typeof key) || key === '__proto__' || Object.hasOwn(result, key)) {
          throw new Error('Ambiguous Telecom data property is not supported');
        }
        result[key] = value(property.value);
      }
      return result;
    }
    throw new Error('Unsupported Telecom data expression: ' + node.type);
  }

  const data = value(declarations[0].init);
  if (!data || typeof data !== 'object' || Array.isArray(data) || typeof data.lastUpdated !== 'string' ||
      !data.countries || typeof data.countries !== 'object' || Array.isArray(data.countries)) {
    throw new Error('Telecom data requires the recorded lastUpdated and countries object');
  }
  return data;
}

function readTelecomData(filePath = DEFAULT_DATASET) {
  return parseTelecomData(fs.readFileSync(filePath, 'utf8'));
}

module.exports = { parseTelecomData, readTelecomData };
