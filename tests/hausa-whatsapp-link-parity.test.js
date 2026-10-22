const assert = require('assert');
const fs = require('fs');
const path = require('path');
const engine = require('../engines/src/whatsapp-link-engine.js');
const originalWrite = fs.writeFileSync;
let owner;
try {
  fs.writeFileSync = () => { throw new Error('Importing the owner must not write public files'); };
  owner = require('../scripts/build-hausa-whatsapp-link.js');
} finally {
  fs.writeFileSync = originalWrite;
}

const page = fs.readFileSync(path.resolve(__dirname, '../ha/kayan-aiki/whatsapp-link/index.html'), 'utf8');
assert.strictEqual(engine.normalize('234', '0801 234 5678'), '2348012345678');
assert.strictEqual(engine.normalize('+254', '254712345678'), '254712345678');
assert.strictEqual(engine.build('234', '08012345678', 'Sannu & na gode').url, 'https://wa.me/2348012345678?text=Sannu%20%26%20na%20gode');
assert.throws(() => engine.build('234', '12', ''), /lambobi 7 zuwa 15/);
assert.strictEqual(owner.build(page) === page, true, 'Hausa owner must be byte-idempotent');
assert(page.includes('/assets/vendor/qrcode/qrcode.min.js'));
assert(page.includes('/engines/whatsapp-link-engine.js'));
assert(page.includes('/assets/js/pages/ha-yo-whatsapp-link.js'));
assert(page.includes('data-wa-download-qr'));
assert(page.includes('data-wa-form="bulk"'));
assert(!page.includes('cdn.jsdelivr.net'));
assert(page.includes('Mai Gina WhatsApp Link yana gina hanyar'));
assert(page.includes('Ina amfani da QR code yaya?'));
console.log('Hausa WhatsApp engine, source owner, local assets and editorial preservation checks passed.');
