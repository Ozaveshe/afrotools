#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PAGE = path.join(ROOT, 'ha/kayan-aiki/whatsapp-link/index.html');
const CHECK = process.argv.includes('--check');

function build(source) {
  let html = source
    .replace('https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js', '/assets/vendor/qrcode/qrcode.min.js');
  if (!html.includes('/engines/whatsapp-link-engine.js')) {
    html = html.replace('<script>\nlet currentLink', '<script src="/engines/whatsapp-link-engine.js"></script>\n<script>\nlet currentLink');
  }
  html = html.replace('<div class="qr-box"><canvas id="qrCanvas"></canvas></div>', '<div class="qr-box"><div id="qrCanvas" aria-label="Lambar QR ta mahadar WhatsApp"></div></div>');
  return html;
}

const current = fs.readFileSync(PAGE, 'utf8');
const next = build(current);
if (CHECK) {
  if (next !== current) throw new Error('Hausa WhatsApp page is stale; run node scripts/build-hausa-whatsapp-link.js');
  console.log('Hausa WhatsApp source owner is current.');
} else {
  fs.writeFileSync(PAGE, next, 'utf8');
  console.log(next === current ? 'Hausa WhatsApp page already current.' : 'Updated Hausa WhatsApp page.');
}
module.exports = { build };
