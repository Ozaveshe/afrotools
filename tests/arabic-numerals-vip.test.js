'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const engine = require(path.join(ROOT, 'tools/arabic-numerals/arabic-numerals-engine.js'));
const html = fs.readFileSync(path.join(ROOT, 'tools/arabic-numerals/index.html'), 'utf8');
const vip = fs.readFileSync(path.join(ROOT, 'tools/arabic-numerals/arabic-numerals-vip.js'), 'utf8');

test('maps all ten characters in three distinct digit families', () => {
  assert.equal(engine.WESTERN, '0123456789');
  assert.equal(engine.ARABIC_INDIC, '٠١٢٣٤٥٦٧٨٩');
  assert.equal(engine.EASTERN_ARABIC_INDIC, '۰۱۲۳۴۵۶۷۸۹');
  assert.equal(engine.convertDigits(engine.WESTERN, 'arabic-indic'), engine.ARABIC_INDIC);
  assert.equal(engine.convertDigits(engine.WESTERN, 'eastern-arabic-indic'), engine.EASTERN_ARABIC_INDIC);
  assert.equal(engine.toWestern(engine.ARABIC_INDIC + engine.EASTERN_ARABIC_INDIC), engine.WESTERN + engine.WESTERN);
});

test('preserves leading zeros, punctuation, surrounding text and logical order', () => {
  const fixture = 'Ref 007 / ١٢ / ۴۵, A-9';
  assert.equal(engine.convertDigits(fixture, 'western'), 'Ref 007 / 12 / 45, A-9');
  assert.equal(engine.convertDigits(fixture, 'arabic-indic'), 'Ref ٠٠٧ / ١٢ / ٤٥, A-٩');
  assert.equal(engine.convertDigits(fixture, 'eastern-arabic-indic'), 'Ref ۰۰۷ / ۱۲ / ۴۵, A-۹');
  assert.deepEqual(engine.detectFamilies(fixture), ['western', 'arabic-indic', 'eastern-arabic-indic']);
});

test('active route contract is digit-shape conversion only and local', () => {
  assert.match(html, /not Arabic-language translation/i);
  assert.match(html, /U\+0030–U\+0039/);
  assert.match(html, /data-legacy-converter-disabled/);
  assert.match(vip, /surrounding text or logical order/);
  assert.match(vip, /No raw input is persisted|no raw input is persisted/i);
  assert.doesNotMatch(vip, /localStorage|sessionStorage|fetch\(|console\./);
});
