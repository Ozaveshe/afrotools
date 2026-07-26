'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'tools', 'igbo-translator', 'index.html'), 'utf8');
const match = html.match(/const PHRASES=(\[[\s\S]*?\]);\s*let activeCat/);
assert.ok(match, 'Igbo PHRASES array must remain statically inspectable');
const phrases = vm.runInNewContext(match[1]);

assert.strictEqual(phrases.length, 129);
assert.strictEqual(new Set(phrases.map((phrase) => phrase.en.toLocaleLowerCase('en'))).size, 129);
assert.strictEqual(new Set(phrases.map((phrase) => phrase.lang.normalize('NFC').toLocaleLowerCase('ig'))).size, 129);
assert.strictEqual(phrases.filter((phrase) => !phrase.en || !phrase.lang || !phrase.pron || !phrase.cat).length, 0);
assert.strictEqual(phrases.filter((phrase) => phrase.lang !== phrase.lang.normalize('NFC')).length, 0);
assert.ok(phrases.filter((phrase) => phrase.note).length >= 9);

const byEnglish = Object.fromEntries(phrases.map((phrase) => [phrase.en, phrase]));
assert.strictEqual(byEnglish['I don\'t understand'].lang, 'Aghọtaghị m');
assert.strictEqual(byEnglish['I understand'].lang, 'Aghọtara m');
assert.strictEqual(byEnglish.Hospital.lang, 'Ụlọ ọgwụ');
assert.strictEqual(byEnglish.Pharmacy.lang, 'Ụlọ ahịa ọgwụ');
assert.strictEqual(byEnglish.Fever.lang, 'Ahụ ọkụ');
assert.strictEqual(byEnglish['I may have malaria'].lang, 'Echere m na m nwere ọrịa ịba');
assert.strictEqual(byEnglish['I miss you'].lang, 'Agụụ gị na-agụ m');
assert.strictEqual(byEnglish.Loan.lang, 'Mgbazinye ego');
assert.strictEqual(byEnglish['Traditional marriage ceremony'].lang, 'Ịgba nkwụ');
assert.strictEqual(byEnglish['Yam barn'].lang, 'Ọba ji');
assert.ok(!html.includes("lang:'Aghota m'"));
assert.ok(!html.includes("lang:'Otutu'"));
assert.ok(!html.includes('/assets/js/lib/live-translate.js'), 'Igbo must not load the raw-text-keyed shared client');
assert.ok(html.includes('Igbo writing and variation checker'));
assert.ok(html.includes('elias.fas.harvard.edu/languages/igbo/beginning/2/igbo-sounds-and-tones'));

console.log('igbo-translator-vip-day5.test.js passed');
