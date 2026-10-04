#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { Resvg } = require('@resvg/resvg-js');
const { writeFileSyncWithRetry } = require('./lib/safe-write');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT = 'assets/img/og-fr-developers.png';
const FONT_DIR = path.join(ROOT, 'assets/fonts/noto-sans');

// Adapt the existing OG authoring palette. This is a French resources card,
// with no country, tax, live-data or API-availability promise.
function cardSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <title>Ressources pour développeurs AfroTools</title>
  <defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#0A1628"/><stop offset="1" stop-color="#131D2E"/></linearGradient></defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="8" fill="#0062CC"/>
  <circle cx="1060" cy="130" r="230" fill="#0062CC" opacity=".08"/>
  <g font-family="Noto Sans" fill="#E2E8F0">
    <rect x="72" y="54" width="202" height="48" rx="10" fill="#0062CC"/>
    <text x="94" y="87" font-size="24" font-weight="700">AFROTOOLS</text>
    <text x="72" y="220" font-size="82" font-weight="700" fill="#60A5FA">&lt;/&gt;</text>
    <text x="72" y="325" font-size="64" font-weight="700">Ressources pour</text>
    <text x="72" y="405" font-size="64" font-weight="700">développeurs</text>
    <text x="76" y="468" font-size="30" fill="#CBD5E1">API, widgets et intégrations</text>
    <path d="M72 530H1128" stroke="#334155"/>
    <text x="76" y="582" font-size="24" font-weight="700">afrotools.com</text>
    <text x="1124" y="582" text-anchor="end" font-size="23" fill="#CBD5E1">Ressources en français</text>
  </g>
</svg>\n`;
}

function renderPng() {
  const provenance = JSON.parse(fs.readFileSync(path.join(FONT_DIR, 'provenance.json'), 'utf8'));
  for (const record of provenance.files) {
    const bytes = fs.readFileSync(path.join(FONT_DIR, record.file));
    if (bytes.length !== record.bytes || crypto.createHash('sha256').update(bytes).digest('hex') !== record.sha256) {
      throw new Error(`French developer card font provenance mismatch: ${record.file}`);
    }
  }
  const image = new Resvg(cardSvg(), {
    font: {
      loadSystemFonts: false,
      fontFiles: ['NotoSans-Regular.ttf', 'NotoSans-Bold.ttf'].map(file => path.join(FONT_DIR, file)),
      defaultFontFamily: 'Noto Sans'
    }
  }).render();
  if (image.width !== 1200 || image.height !== 630) throw new Error('French developer card must be 1200×630');
  return image.asPng();
}

function main() {
  const args = process.argv.slice(2);
  if (args.length !== 1 || !['--write', '--check'].includes(args[0])) throw new Error('Use --write or --check');
  const output = path.join(ROOT, OUTPUT), expected = renderPng();
  const matches = fs.existsSync(output) && fs.readFileSync(output).equals(expected);
  if (!matches && args[0] === '--check') throw new Error(`STALE ${OUTPUT}`);
  if (!matches) writeFileSyncWithRetry(output, expected);
  console.log(`French developer card ${matches ? 'current' : 'written'}: 1200×630 PNG, ${expected.length} bytes`);
}

if (require.main === module) main();
module.exports = { OUTPUT, cardSvg, renderPng };
