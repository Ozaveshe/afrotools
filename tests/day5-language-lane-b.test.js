'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const route = (id) => fs.readFileSync(path.join(ROOT, 'tools', id, 'index.html'), 'utf8');

function phraseRows(id) {
  const html = route(id);
  const match = html.match(/var PHRASES=(\[[\s\S]*?\]);\s*var activeCat/);
  assert.ok(match, `${id} exposes its local phrase table`);
  const context = {};
  vm.runInNewContext(`PHRASES=${match[1]}`, context);
  return context.PHRASES;
}

test('Amharic contract uses the real 106-row Ethiopic dataset', () => {
  const rows = phraseRows('amharic-translator');
  assert.equal(rows.length, 106);
  assert.equal(new Set(rows.map((row) => row.cat)).size, 14);
  assert.deepEqual(
    JSON.parse(JSON.stringify(rows.find((row) => row.en === 'Hello'))),
    { en: 'Hello', lang: 'ሰላም', roman: 'Selam', pron: 'seh-LAHM', cat: 'Greetings' }
  );
  assert.match(route('amharic-translator'), /106 fixed English–Amharic phrase rows/);
});

test('isiZulu contract uses the real 132-row dataset and bounded click guidance', () => {
  const rows = phraseRows('zulu-translator');
  assert.equal(rows.length, 132);
  assert.equal(new Set(rows.map((row) => row.cat)).size, 15);
  assert.equal(rows.find((row) => row.en === 'Hello').lang, 'Sawubona');
  assert.match(route('zulu-translator'), /Written analogies cannot teach voicing, aspiration, nasalisation or tone/);
});

test('digit engine distinguishes Arabic-Indic and Eastern Arabic-Indic shapes', () => {
  const engine = require('../tools/arabic-numerals/arabic-numerals-engine.js');
  assert.equal(engine.convertDigits('Invoice 12', 'arabic-indic'), 'Invoice ١٢');
  assert.equal(engine.convertDigits('Invoice 12', 'eastern-arabic-indic'), 'Invoice ۱۲');
  assert.equal(engine.toWestern('رقم ١٢ و ۳۴'), 'رقم 12 و 34');
  assert.deepEqual(engine.detectFamilies('1 ٢ ۳'), ['western', 'arabic-indic', 'eastern-arabic-indic']);
});

test('transliteration fixtures stay script-specific and one-way', () => {
  const engine = require('../tools/transliterate/transliteration-engine.js');
  assert.equal(engine.coverage.geezBaseRows, 21);
  assert.equal(engine.coverage.geezForms, 147);
  assert.equal(engine.coverage.tifinaghTokens, 26);
  assert.equal(engine.coverage.arabicTokens, 30);
  assert.equal(engine.convert('geez', 'selam'), 'ሰላም');
  assert.equal(engine.convert('tifinagh', 'azul'), 'ⴰⵣⵓⵍ');
  assert.equal(engine.convert('arabic', 'salam'), 'سالام');
  assert.match(route('transliterate'), /not translations or verified orthography/);
  const options = [...route('transliterate').matchAll(/<option value="([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(options, ['geez', 'tifinagh']);
  assert.doesNotMatch(route('transliterate'), /<option value="(?:nko|vai)"/);
});

test('assigned routes have local delivery, canonical metadata, checked limits and no route CDN', () => {
  for (const id of ['amharic-translator', 'zulu-translator', 'arabic-numerals', 'transliterate']) {
    const html = route(id);
    assert.match(html, new RegExp(`<link rel="canonical" href="https://afrotools.com/tools/${id}/">`));
    assert.match(html, /application\/ld\+json/);
    assert.doesNotMatch(html, /fonts\.googleapis\.com|cdn\.jsdelivr\.net/);
  }
  const amharic = route('amharic-translator');
  assert.match(amharic, /106 fixed starter phrases/);
  assert.match(amharic, /qualified human translator/);
  assert.doesNotMatch(amharic, /230\+|5th century BC|one of Africa's most important social rituals/i);
  const contextIds = ['amharic-translator', 'zulu-translator', 'arabic-calc', 'transliterate'];
  for (const id of contextIds) {
    const context = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'ai', 'tool-context', `${id}.json`), 'utf8'));
    assert.equal(context.status, 'unverified-static');
    assert.match(context.legacyTextSha256, /^sha256:[a-f0-9]{64}$/);
    assert.match(context.staticText, /local|Local/);
  }
  assert.equal(fs.existsSync(path.join(ROOT, 'data', 'ai', 'tool-context', 'arabic-numerals.json')), false);
  assert.match(JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'ai', 'tool-context', 'arabic-calc.json'), 'utf8')).staticText, /three Unicode families/);
  for (const id of ['amharic-translator', 'zulu-translator', 'transliterate']) {
    assert.match(JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'ai', 'tool-context', `${id}.json`), 'utf8')).staticText, /unverified/i);
  }
});

test('route-owned VIP scripts do not persist, log or send raw text', () => {
  const scripts = [
    'tools/amharic-translator/phrasebook-vip.js',
    'tools/zulu-translator/phrasebook-vip.js',
    'tools/arabic-numerals/arabic-numerals-vip.js',
    'tools/transliterate/transliteration-vip.js'
  ].map((file) => fs.readFileSync(path.join(ROOT, file), 'utf8')).join('\n');
  assert.doesNotMatch(scripts, /localStorage|sessionStorage|fetch\(|console\./);
});
