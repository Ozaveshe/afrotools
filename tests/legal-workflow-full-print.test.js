'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require.resolve('../assets/js/src/legal-workflow-copilot.js'), 'utf8');
const marker = '    e = function() {';
assert(source.includes(marker));
let mirror, created = 0;
const attributes = new Map();
const output = { value: '<img src=x onerror=synthetic()>\nFull long report\nEND', insertAdjacentElement(where, element) { assert.equal(where, 'afterend'); assert.equal(element.attributes.get('data-clarity-mask'), 'True'); mirror = element; } };
const root = {
  querySelector(selector) { return selector === '[data-workflow-output]' ? output : mirror; },
  setAttribute(name, value) { attributes.set(name, value); },
  removeAttribute(name) { attributes.delete(name); }
};
const context = { window: {}, document: { readyState: 'loading', addEventListener() {}, createElement(tag) {
  assert.equal(tag, 'pre'); created++;
  const attributes = new Map();
  return { attributes, setAttribute(name, value) { attributes.set(name, value); }, set innerHTML(_) { throw Error('Print content must never use HTML'); }, remove() { mirror = undefined; } };
} }, console };
vm.runInNewContext(source.replace(marker, '    window.__printTest={prepare:prepareLocalPrint,clear:clearLocalPrint};\n' + marker), context);
const api = context.window.__printTest;
api.prepare(root);
assert.equal(mirror.textContent, output.value);
assert.equal(attributes.has('data-workflow-print-ready'), true);
output.value += '\nUPDATED';
api.prepare(root);
assert.equal(created, 1, 'Reuse a single mirror when native beforeprint follows explicit print');
assert.equal(mirror.textContent, output.value);
api.clear(root);
assert.equal(mirror, undefined);
assert.equal(attributes.has('data-workflow-print-ready'), false);
api.clear(root);
const css = fs.readFileSync(require.resolve('../assets/css/legal-enhancements.css'), 'utf8');
assert.match(css, /@media print/);
assert.match(css, /leg-workflow-print-mirror\{display:none\}/);
assert.match(css, /max-height:none!important/);
assert.match(css, /white-space:pre-wrap!important/);
assert.match(source, /window\.addEventListener\('beforeprint'/);
assert.match(source, /window\.addEventListener\('afterprint'/);
console.log('Legal print mirror retains literal text, reuses one node, cleans up and permits pagination');
