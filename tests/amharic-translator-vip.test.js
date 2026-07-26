'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'tools/amharic-translator/index.html'), 'utf8');
const vip = fs.readFileSync(path.join(ROOT, 'tools/amharic-translator/phrasebook-vip.js'), 'utf8');

function rows() {
  const match = html.match(/var PHRASES=(\[[\s\S]*?\]);\s*var activeCat/);
  assert.ok(match);
  const context = {};
  vm.runInNewContext(`PHRASES=${match[1]}`, context);
  return context.PHRASES;
}

test('Amharic app exposes its exact local-table contract and script fixtures', () => {
  const data = rows();
  assert.equal(data.length, 106);
  assert.equal(new Set(data.map((row) => row.cat)).size, 14);
  assert.deepEqual(
    JSON.parse(JSON.stringify(data.slice(0, 4).map((row) => [row.en, row.lang]))),
    [
      ['Hello', 'ሰላም'],
      ['How are you? (m)', 'እንደምን ነህ'],
      ['How are you? (f)', 'እንደምን ነሽ'],
      ['I am fine', 'ደህና ነኝ']
    ]
  );
});

test('Amharic device speech uses Ethiopic text and the am-ET language tag', () => {
  assert.match(html, /new SpeechSynthesisUtterance\(text\)/);
  assert.match(html, /utterance\.lang='am-ET'/);
  assert.match(html, /\/\^am\(\?:-\|\$\)\/i/);
  assert.doesNotMatch(html, /new SpeechSynthesisUtterance\(p\.roman\)|u\.lang='am'/);
});

test('Amharic filtering, categories and quiz expose accessible state', () => {
  assert.match(html, /role="toolbar" aria-label="Filter phrases by category"/);
  assert.match(html, /aria-pressed="true"/);
  assert.match(html, /role="list" aria-live="polite"/);
  assert.match(html, /quizCorrectLang/);
  assert.match(html, /button\.disabled=true/);
  assert.match(vip, /No phrase text was uploaded/);
  assert.doesNotMatch(vip, /localStorage|sessionStorage|fetch\(|console\./);
});
