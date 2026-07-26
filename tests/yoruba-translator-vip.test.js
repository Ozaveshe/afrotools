'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'tools', 'yoruba-translator', 'index.html'), 'utf8');
const match = html.match(/const PHRASES=(\[[\s\S]*?\]);\s*let activeCat/);
assert.ok(match, 'Yoruba PHRASES array must remain statically inspectable');
const phrases = vm.runInNewContext(match[1]);

assert.strictEqual(phrases.length, 175);
assert.strictEqual(new Set(phrases.map((phrase) => phrase.en.toLocaleLowerCase('en'))).size, 175, 'English prompts must be unique');
assert.strictEqual(new Set(phrases.map((phrase) => phrase.lang.normalize('NFC').toLocaleLowerCase('yo'))).size, 175, 'Yoruba forms must be unique');
assert.strictEqual(phrases.filter((phrase) => !phrase.en || !phrase.lang || !phrase.pron || !phrase.cat).length, 0);
assert.strictEqual(phrases.filter((phrase) => phrase.lang !== phrase.lang.normalize('NFC')).length, 0, 'Yoruba must be stored in NFC');
assert.strictEqual(phrases.filter((phrase) => phrase.note).length, 10, 'ten ambiguity-sensitive records need visible notes');

const byEnglish = Object.fromEntries(phrases.map((phrase) => [phrase.en, phrase]));
const fixtures = {
  Hello: 'Báwo ni?',
  'Good morning': 'Ẹ káàárọ̀',
  'Good afternoon': 'Ẹ káàsán',
  'Good evening': 'Ẹ káalẹ́',
  'How are you?': 'Báwo ni o ṣe wà?',
  'Thank you': 'Ẹ ṣéun',
  Work: 'Iṣẹ́',
  Car: 'Ọkọ̀ ayọ́kẹ́lẹ́',
  Church: 'Ilé ìjọsìn',
  'High blood pressure': 'Ẹ̀jẹ̀ ríru / ìfúnpá gíga',
  Cough: 'Ikọ́',
  Congratulations: 'Ẹ kú oríire!',
  'Happy birthday': 'Ẹ kú ọjọ́ ìbí!',
  'Stay strong': 'Máa lágbára',
  Mosque: 'Mọ́sálásí',
  Bank: 'Bánkì / ilé ìfowópamọ́',
};
for (const [english, yoruba] of Object.entries(fixtures)) {
  assert.strictEqual(byEnglish[english].lang, yoruba, `${english} orthography fixture`);
}
assert.strictEqual(byEnglish['ATM / cash machine'].lang, 'Ẹ̀rọ ATM / ẹ̀rọ ìpín owó');
assert.strictEqual(byEnglish['Loan / debt'].lang, 'Awin / gbèsè');
assert.ok(!html.includes("lang:'Eje arin'"));
assert.ok(!html.includes("lang:'Ile ijsin'"));
assert.ok(!html.includes("lang:'Se aropo'"));
assert.ok(!html.includes("lang:'Ile-iṣowo'"));
assert.ok(html.includes('Yoruba orthography lab'));
assert.ok(html.includes('yorubadictionary.yale.edu'));

console.log('yoruba-translator-vip.test.js passed');
