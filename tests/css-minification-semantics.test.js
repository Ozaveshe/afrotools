'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { parse, toPlainObject } = require('css-tree');
const { minifyCss } = require('../scripts/lib/css-minification');

const fixtures = [
  ['descendant pseudo selectors', ':root[data-theme="dark"] :where(.btn-primary, button[type="submit"]) { color: red; }'],
  ['quoted attribute spacing', '[style*="background: #fff"] { background: black; }'],
  ['positive CSS math', '.tooltip { bottom: calc(100% + 8px); }'],
  ['negative CSS math', '.panel { width: calc(100% - 2rem); }'],
  ['nested math with variables', '.panel { width: calc(var(--width) + calc(1px + 2%)); }'],
  ['quoted content punctuation', '.note::before { content: "a : b ; c + d /*literal*/"; }'],
  ['quoted content spaces', '.note::after { content: "two  spaces\\Aand a line"; }'],
  ['data URL contents', '.icon { background-image: url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\'></svg>"); }'],
  ['escaped selectors', '.money\\+tax :is(.one, .two) { padding: 1px; }'],
  ['comments between tokens', '.a/**/ .b { color: /**/ red; }'],
  ['custom property values', ':root { --label: "a : b"; --distance: calc(100% + 8px); }'],
  ['at rules and keyframes', '@media (min-width: 20px) { .a > .b { color: red; } } @keyframes move { from { left: 0; } to { left: calc(50% + 1px); } }']
];

for (const [name, source] of fixtures) {
  test('CSS compaction preserves ' + name, () => {
    const compact = minifyCss(source);
    assert.deepEqual(
      toPlainObject(parse(compact, { parseCustomProperty: false })),
      toPlainObject(parse(source, { parseCustomProperty: false })),
      'CSS node structure and values must stay equal after compaction'
    );
    assert.equal(minifyCss(compact), compact, 'compaction must be deterministic');
  });
}

test('CSS compaction reduces formatted CSS without losing math spacing', () => {
  const source = '/* Tooltip */\n.tooltip {\n  bottom: calc(100% + 8px);\n  color: red;\n}\n';
  const compact = minifyCss(source);
  assert(compact.length < source.length);
  assert(compact.includes('calc(100% + 8px)'));
  assert(!compact.includes('/* Tooltip */'));
});
