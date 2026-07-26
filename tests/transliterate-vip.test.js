'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const engine = require(path.join(ROOT, 'tools/transliterate/transliteration-engine.js'));
const html = fs.readFileSync(path.join(ROOT, 'tools/transliterate/index.html'), 'utf8');
const vip = fs.readFileSync(path.join(ROOT, 'tools/transliterate/transliteration-vip.js'), 'utf8');

test('reports the exact three mapping-table sizes and deterministic fixtures', () => {
  assert.deepEqual(engine.coverage, {
    geezBaseRows: 21,
    geezForms: 147,
    tifinaghTokens: 26,
    arabicTokens: 30
  });
  assert.equal(engine.convert('geez', 'selam'), 'ሰላም');
  assert.equal(engine.convert('tifinagh', 'azul'), 'ⴰⵣⵓⵍ');
  assert.equal(engine.convert('arabic', 'bint'), 'بِنت');
});

test('each mapping is demonstrably one-way and preserves unsupported characters', () => {
  assert.equal(engine.convert('geez', 'ha'), engine.convert('geez', 'haa'));
  assert.equal(engine.convert('tifinagh', 'u'), engine.convert('tifinagh', 'o'));
  assert.equal(engine.convert('arabic', 'a'), engine.convert('arabic', 'aa'));
  for (const script of ['geez', 'tifinagh', 'arabic']) {
    assert.deepEqual(engine.analyze(script, 'Cv!'), { output: 'Cv!', unsupportedLatin: ['c', 'v'] });
  }
});

test('route copy, limits and privacy are script-specific and honest', () => {
  assert.match(html, /Ethiopic mapping limit/);
  assert.match(html, /Neo-Tifinagh mapping limit/);
  assert.match(html, /Arabic-letter mapping limit/);
  assert.match(html, /cannot be safely reversed/);
  assert.match(vip, /not a vocabulary or pronunciation claim/);
  assert.match(vip, /raw input is not persisted or uploaded/);
  assert.doesNotMatch(vip, /localStorage|sessionStorage|fetch\(|console\./);
});
