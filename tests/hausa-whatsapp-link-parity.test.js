const assert = require('assert');
const fs = require('fs');
const path = require('path');
const engine = require('../engines/src/whatsapp-link-engine.js');
const owner = require('../scripts/build-hausa-whatsapp-link.js');

const page = fs.readFileSync(path.resolve(__dirname, '../ha/kayan-aiki/whatsapp-link/index.html'), 'utf8');
assert.strictEqual(engine.normalize('234', '0801 234 5678'), '2348012345678');
assert.strictEqual(engine.normalize('+254', '254712345678'), '254712345678');
assert.strictEqual(engine.build('234', '08012345678', 'Sannu & na gode').url, 'https://wa.me/2348012345678?text=Sannu%20%26%20na%20gode');
assert.throws(() => engine.build('234', '12', ''), /lambobi 7 zuwa 15/);
assert.strictEqual(owner.build(page), page);
assert(page.includes('/assets/vendor/qrcode/qrcode.min.js'));
assert(page.includes('/engines/whatsapp-link-engine.js'));
assert(page.includes("new QRCode(qr, { text: link, width: 180, height: 180"));
assert(page.includes("document.querySelector('#qrCanvas canvas')"));
assert(!page.includes('cdn.jsdelivr.net'));
assert(page.length > 18000, 'public editorial surface must remain intact');
console.log('Hausa WhatsApp parity: 11/11 checks passed.');
