const assert = require('assert');
const fs = require('fs');
const path = require('path');
const engine = require('../engines/src/hausa-number-words-engine.js');
const owner = require('../scripts/build-hausa-naira-words.js');

const root = path.resolve(__dirname, '..');
const pagePath = path.join(root, 'ha/kayan-aiki/naira-zuwa-kalmomi/index.html');
const page = fs.readFileSync(pagePath, 'utf8');

assert.strictEqual(engine.integer(0), 'sifili');
assert.strictEqual(engine.integer(19), "goma da tara");
assert.strictEqual(engine.integer(125430), "dubu ɗari da ashirin da biyar da ɗari huɗu da talatin");
assert.strictEqual(engine.amount(125430.75, 'NGN'), "Naira dubu ɗari da ashirin da biyar da ɗari huɗu da talatin da Kobo saba'in da biyar kacal");
assert.strictEqual(engine.amount(1000, 'USD'), 'Dala dubu kacal');
assert.throws(() => engine.amount(-1, 'NGN'), /iyakar/);
assert.throws(() => engine.amount(2, 'BAD'), /tallafa/);
assert.strictEqual(owner.build(page), page, 'source owner must be idempotent');
assert(page.includes('lang="ha"'));
assert(page.includes('/engines/hausa-number-words-engine.js'));
assert(page.includes('downloadJsonResult()'));
assert(page.includes('localOnly: true'));
assert(page.includes('https://afrotools.com/tools/naira-to-words/'));
assert(page.includes('https://afrotools.com/fr/tools/naira-en-lettres/'));
assert(page.length > 20000, 'editorial and SEO surface must not be contracted');
console.log('Hausa Naira parity: 14/14 checks passed.');
