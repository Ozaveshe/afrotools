'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'tools/zulu-translator/index.html'), 'utf8');
const vip = fs.readFileSync(path.join(ROOT, 'tools/zulu-translator/phrasebook-vip.js'), 'utf8');

function rows() {
  const match = html.match(/var PHRASES=(\[[\s\S]*?\]);\s*var activeCat/);
  assert.ok(match);
  const context = {};
  vm.runInNewContext(`PHRASES=${match[1]}`, context);
  return context.PHRASES;
}

test('isiZulu app exposes its exact local-table contract and deterministic fixtures', () => {
  const data = rows();
  assert.equal(data.length, 132);
  assert.equal(new Set(data.map((row) => row.cat)).size, 15);
  assert.deepEqual(
    JSON.parse(JSON.stringify(data.slice(0, 3).map((row) => [row.en, row.lang, row.pron]))),
    [
      ['Hello', 'Sawubona', 'sah-woo-BOH-nah'],
      ['Hello (to many)', 'Sanibonani', 'sah-nee-boh-NAH-nee'],
      ['How are you?', 'Unjani?', 'oon-JAH-nee']
    ]
  );
});

test('isiZulu speech uses actual phrase text, zu-ZA and refuses unrelated fallback voices', () => {
  assert.match(html, /new SpeechSynthesisUtterance\(text\)/);
  assert.match(html, /utterance\.lang='zu-ZA'/);
  assert.match(html, /\/\^zu\(\?:-\|\$\)\/i/);
  assert.match(html, /No installed isiZulu voice found; no fallback voice was used/);
  assert.doesNotMatch(html, /new SpeechSynthesisUtterance\(.*pron/);
});

test('isiZulu limits and accessible interaction states match the route contract', () => {
  assert.match(html, /do not reliably encode tone/);
  assert.match(html, /regional usage/);
  assert.match(html, /role="toolbar" aria-label="Filter phrases by category"/);
  assert.match(html, /aria-pressed="true"/);
  assert.match(html, /role="list" aria-live="polite"/);
  assert.match(html, /quizCorrectLang/);
  assert.match(html, /button\.disabled=true/);
  assert.match(vip, /132 app-local, unverified draft phrase rows/);
  assert.doesNotMatch(vip, /localStorage|sessionStorage|fetch\(|console\./);
});
