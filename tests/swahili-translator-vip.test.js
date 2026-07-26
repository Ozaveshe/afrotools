'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'tools', 'swahili-translator', 'index.html'), 'utf8');
const vipJs = fs.readFileSync(path.join(root, 'tools', 'swahili-translator', 'translator-vip.js'), 'utf8');
const match = html.match(/const PHRASES=(\[[\s\S]*?\]);\s*let activeCat/);
assert.ok(match, 'Swahili PHRASES array must remain statically inspectable');
const phrases = vm.runInNewContext(match[1]);

assert.strictEqual(phrases.length, 194);
assert.strictEqual(new Set(phrases.map((phrase) => phrase.en.toLocaleLowerCase('en'))).size, 194, 'English prompts must be unique');
assert.strictEqual(
  phrases.filter((phrase) => !phrase.en || !phrase.sw || !phrase.pron || !phrase.cat).length,
  0,
  'every Swahili record must have English, Swahili, pronunciation, and category fields'
);
for (const phrase of phrases) {
  assert.strictEqual(phrase.en, phrase.en.normalize('NFC'), `English NFC: ${phrase.en}`);
  assert.strictEqual(phrase.sw, phrase.sw.normalize('NFC'), `Swahili NFC: ${phrase.en}`);
  assert.ok(!/^\s|\s$/.test(phrase.en + phrase.sw), `no edge whitespace: ${phrase.en}`);
}

const byEnglish = Object.fromEntries(phrases.map((phrase) => [phrase.en, phrase]));
assert.strictEqual(byEnglish['I am fine'].sw, 'Niko vizuri');
assert.strictEqual(byEnglish['Sorry / sympathy'].sw, 'Pole');
assert.strictEqual(byEnglish['Excuse me'].sw, 'Samahani');
assert.strictEqual(byEnglish.Beach.sw, 'Ufukwe');
assert.strictEqual(byEnglish['The bill, please'].sw, 'Bili, tafadhali');
assert.strictEqual(byEnglish['Call the police'].sw, 'Piga simu kwa polisi');
assert.strictEqual(byEnglish['ATM / cash machine'].sw, 'Mashine ya kutoa pesa');
assert.strictEqual(byEnglish['What is the exchange rate?'].sw, 'Kiwango cha ubadilishaji ni kipi?');
assert.strictEqual(byEnglish['Coffee beans'].sw, 'Buni');
assert.strictEqual(phrases.filter((phrase) => phrase.note).length, 9, 'nine ambiguity-sensitive records need visible notes');

const categories = new Set(phrases.map((phrase) => phrase.cat));
for (const required of ['Greetings', 'Basics', 'Travel', 'Food & Drink', 'Emergency', 'Market & Shopping', 'Money & Finance', 'Agriculture']) {
  assert.ok(categories.has(required), `missing Swahili category: ${required}`);
}

assert.ok(html.includes('Swahili meaning checker'));
assert.ok(html.includes('bakita.go.tz'));
assert.ok(html.includes('kiswahili.eac.int'));
assert.ok(!html.includes("sw:'Pwani',pron:'PWAH-nee',cat:'Travel'"));
assert.ok(!html.includes("sw:'Mashine ya pesa'"));
assert.ok(!html.includes("sw:'Hesabu tafadhali'"));
assert.ok(!html.includes('/assets/js/lib/live-translate.js'), 'Swahili must not load the raw-text-keyed shared client');
assert.ok(vipJs.includes("cache: 'no-store'"));
assert.ok(vipJs.includes('allowFallback: false'));
assert.ok(vipJs.includes('data.unchanged'));
assert.ok(!/localStorage|sessionStorage|indexedDB|memoryCache|cacheKey|location\.(?:hash|search)/i.test(vipJs));

console.log('swahili-translator-vip.test.js passed');
