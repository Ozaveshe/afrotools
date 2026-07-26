'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'tools', 'hausa-translator', 'index.html'), 'utf8');
const match = html.match(/const PHRASES=(\[[\s\S]*?\]);\s*let activeCat/);
assert.ok(match, 'Hausa PHRASES array must remain statically inspectable');
const phrases = vm.runInNewContext(match[1]);

assert.strictEqual(phrases.length, 131);
assert.strictEqual(new Set(phrases.map((phrase) => phrase.en.toLocaleLowerCase('en'))).size, 131);
assert.strictEqual(new Set(phrases.map((phrase) => phrase.lang.normalize('NFC').toLocaleLowerCase('ha'))).size, 131);
assert.strictEqual(phrases.filter((phrase) => !phrase.en || !phrase.lang || !phrase.pron || !phrase.cat).length, 0);
assert.strictEqual(phrases.filter((phrase) => phrase.lang !== phrase.lang.normalize('NFC')).length, 0);
assert.strictEqual(phrases.filter((phrase) => phrase.note).length, 11);

const byEnglish = Object.fromEntries(phrases.map((phrase) => [phrase.en, phrase]));
assert.strictEqual(byEnglish['How are you?'].lang, 'Yaya kake? / Yaya kike?');
assert.strictEqual(byEnglish['What is your name?'].lang, 'Mene ne sunanka / sunanki?');
assert.strictEqual(byEnglish.Money.lang, 'Kuɗi');
assert.strictEqual(byEnglish.Police.lang, '’Yan sanda');
assert.strictEqual(byEnglish['Give me a discount'].lang, 'Ka / ki rage kaɗan');
assert.strictEqual(byEnglish['I need change'].lang, 'Ina buƙatar kuɗin canji');
assert.strictEqual(byEnglish['I have a headache'].lang, 'Kaina yana ciwo');
assert.strictEqual(byEnglish['I may have malaria'].lang, 'Ina zargin zazzabin cizon sauro');
assert.strictEqual(byEnglish['My stomach hurts'].lang, 'Cikina yana ciwo');
assert.strictEqual(byEnglish['No worries'].lang, 'Ba damuwa');
assert.strictEqual(byEnglish['I miss you'].lang, 'Ina kewarka / kewarki');
assert.strictEqual(byEnglish['ATM / cash machine'].lang, 'Injin cire kuɗi / ATM');
assert.strictEqual(byEnglish['What is the exchange rate?'].lang, 'Nawa ne kuɗin musaya?');
assert.ok(!html.includes("lang:'Kudi'"));
assert.ok(!html.includes("lang:'Ina mafarkin ka/ki'"));
assert.ok(!html.includes("lang:'Kai na yi mini ciwo'"));
assert.ok(!html.includes('/assets/js/lib/live-translate.js'), 'Hausa must not load the raw-text-keyed shared client');
assert.ok(html.includes('Hausa address and writing guide'));
assert.ok(html.includes('hausa-online-grammar/pronunciation-writing/hausa-writing'));

console.log('hausa-translator-vip-day5.test.js passed');
