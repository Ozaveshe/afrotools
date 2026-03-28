#!/usr/bin/env node
/**
 * generate-paye-og.js
 * Generates OG images (SVG) for 28 missing country PAYE calculator pages.
 * Run: node scripts/generate-paye-og.js
 * Then convert: npx sharp-cli --input assets/img/og-*-paye.svg --output assets/img/ --format png
 */

const fs = require('fs');
const path = require('path');

const OUT_DIR = path.resolve(__dirname, '..', 'assets', 'img');

const COUNTRIES = {
  bf: { name: 'Burkina Faso',        flag: '\u{1F1E7}\u{1F1EB}' },
  bi: { name: 'Burundi',             flag: '\u{1F1E7}\u{1F1EE}' },
  bj: { name: 'Benin',               flag: '\u{1F1E7}\u{1F1EF}' },
  bw: { name: 'Botswana',            flag: '\u{1F1E7}\u{1F1FC}' },
  cv: { name: 'Cabo Verde',          flag: '\u{1F1E8}\u{1F1FB}' },
  dj: { name: 'Djibouti',            flag: '\u{1F1E9}\u{1F1EF}' },
  er: { name: 'Eritrea',             flag: '\u{1F1EA}\u{1F1F7}' },
  ga: { name: 'Gabon',               flag: '\u{1F1EC}\u{1F1E6}' },
  gm: { name: 'Gambia',              flag: '\u{1F1EC}\u{1F1F2}' },
  gn: { name: 'Guinea',              flag: '\u{1F1EC}\u{1F1F3}' },
  gw: { name: 'Guinea-Bissau',       flag: '\u{1F1EC}\u{1F1FC}' },
  km: { name: 'Comoros',             flag: '\u{1F1F0}\u{1F1F2}' },
  lr: { name: 'Liberia',             flag: '\u{1F1F1}\u{1F1F7}' },
  ml: { name: 'Mali',                flag: '\u{1F1F2}\u{1F1F1}' },
  mr: { name: 'Mauritania',          flag: '\u{1F1F2}\u{1F1F7}' },
  mu: { name: 'Mauritius',           flag: '\u{1F1F2}\u{1F1FA}' },
  mw: { name: 'Malawi',              flag: '\u{1F1F2}\u{1F1FC}' },
  ne: { name: 'Niger',               flag: '\u{1F1F3}\u{1F1EA}' },
  sc: { name: 'Seychelles',          flag: '\u{1F1F8}\u{1F1E8}' },
  sl: { name: 'Sierra Leone',        flag: '\u{1F1F8}\u{1F1F1}' },
  sn: { name: 'Senegal',             flag: '\u{1F1F8}\u{1F1F3}' },
  ss: { name: 'South Sudan',         flag: '\u{1F1F8}\u{1F1F8}' },
  st: { name: 'S\u00E3o Tom\u00E9 & Pr\u00EDncipe', flag: '\u{1F1F8}\u{1F1F9}' },
  td: { name: 'Chad',                flag: '\u{1F1F9}\u{1F1E9}' },
  tg: { name: 'Togo',                flag: '\u{1F1F9}\u{1F1EC}' },
  tn: { name: 'Tunisia',             flag: '\u{1F1F9}\u{1F1F3}' },
  zm: { name: 'Zambia',              flag: '\u{1F1FF}\u{1F1F2}' },
  zw: { name: 'Zimbabwe',            flag: '\u{1F1FF}\u{1F1FC}' },
};

function escapeXml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildSvg(cc, { name, flag }) {
  const escapedName = escapeXml(name);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0A1628"/>
      <stop offset="100%" stop-color="#111827"/>
    </linearGradient>
    <linearGradient id="bar" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#007AFF"/>
      <stop offset="100%" stop-color="#4DA3FF"/>
    </linearGradient>
    <pattern id="dots" width="30" height="30" patternUnits="userSpaceOnUse">
      <circle cx="15" cy="15" r="1" fill="#94A3B8" opacity="0.07"/>
    </pattern>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#dots)"/>

  <!-- Accent bar -->
  <rect y="0" width="1200" height="4" fill="url(#bar)"/>

  <!-- Glow circles -->
  <circle cx="1060" cy="130" r="200" fill="#007AFF" opacity="0.05"/>
  <circle cx="1100" cy="500" r="130" fill="#4DA3FF" opacity="0.04"/>

  <!-- Flag watermark -->
  <text x="980" y="400" font-size="160" text-anchor="middle" opacity="0.08">${flag}</text>

  <!-- Logo -->
  <text x="80" y="165" font-family="system-ui,-apple-system,sans-serif" font-size="26" font-weight="900" letter-spacing="3" fill="#E2E8F0">AFRO<tspan fill="#007AFF">TOOLS</tspan></text>

  <!-- Country name -->
  <text x="80" y="275" font-family="system-ui,-apple-system,sans-serif" font-size="56" font-weight="800" fill="#E2E8F0" letter-spacing="-1">${escapedName}</text>

  <!-- Tool name -->
  <text x="80" y="330" font-family="system-ui,-apple-system,sans-serif" font-size="28" fill="#94A3B8">PAYE Calculator</text>

  <!-- Accent line -->
  <rect x="80" y="350" width="80" height="4" rx="2" fill="#007AFF"/>

  <!-- Flag display (visible) -->
  <text x="80" y="440" font-size="64">${flag}</text>

  <!-- Footer -->
  <rect y="590" width="1200" height="40" fill="#0A1628" opacity="0.6"/>
  <text x="80" y="617" font-family="system-ui,-apple-system,sans-serif" font-size="16" fill="#94A3B8">afrotools.com</text>
  <text x="1120" y="617" font-family="system-ui,-apple-system,sans-serif" font-size="16" fill="#94A3B8" text-anchor="end">AfroTools</text>
</svg>`;
}

// Ensure output directory exists
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

let count = 0;
for (const [cc, info] of Object.entries(COUNTRIES)) {
  const filename = `og-${cc}-paye.svg`;
  const filepath = path.join(OUT_DIR, filename);
  fs.writeFileSync(filepath, buildSvg(cc, info), 'utf8');
  count++;
  console.log(`  Created ${filename}`);
}

console.log(`\nDone! Generated ${count} SVG files in ${OUT_DIR}`);
console.log(`\nTo convert to PNG, run:`);
console.log(`  npx sharp-cli --input "assets/img/og-*-paye.svg" --output "assets/img/" --format png`);
console.log(`  — or individually —`);
console.log(`  for f in assets/img/og-*-paye.svg; do npx sharp "$f" -o "\${f%.svg}.png"; done`);
