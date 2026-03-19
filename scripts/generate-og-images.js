#!/usr/bin/env node
/**
 * OG Image Generator for AfroTools
 * ─────────────────────────────────
 * Generates 1200x630 PNG OG images for WhatsApp/social sharing.
 *
 * Option A: Run `npm install canvas` first, then `node scripts/generate-og-images.js`
 * Option B: Open `scripts/generate-og-images.html` in a browser and click "Download All"
 *
 * Images are saved to assets/img/
 */

const fs = require('fs');
const path = require('path');

let createCanvas;
try {
  createCanvas = require('canvas').createCanvas;
} catch (e) {
  console.error('canvas package not installed. Run: npm install canvas');
  console.error('Or open scripts/generate-og-images.html in a browser instead.');
  process.exit(1);
}

const W = 1200, H = 630;
const OUT = path.resolve(__dirname, '..', 'assets', 'img');

const IMAGES = [
  { title: 'Nigeria PAYE Calculator', subtitle: 'Calculate your salary after tax in seconds', emoji: '\uD83C\uDDF3\uD83C\uDDEC', filename: 'og-ng-salary-tax.png' },
  { title: 'Kenya PAYE Calculator', subtitle: 'KRA tax bands, SHIF, NSSF, AHL \u2014 all included', emoji: '\uD83C\uDDF0\uD83C\uDDEA', filename: 'og-ke-paye.png' },
  { title: 'South Africa Tax Calculator', subtitle: 'SARS 2026 brackets, UIF, medical credits', emoji: '\uD83C\uDDFF\uD83C\uDDE6', filename: 'og-za-paye.png' },
  { title: 'Ghana PAYE Calculator', subtitle: 'GRA tax rates, SSNIT, Tier II & III', emoji: '\uD83C\uDDEC\uD83C\uDDED', filename: 'og-gh-paye.png' },
  { title: 'African VAT Calculator', subtitle: 'Add or remove VAT for any African country', emoji: '\uD83E\uDDFE', filename: 'og-vat.png' },
  { title: 'Currency Converter', subtitle: 'Live exchange rates for all African currencies', emoji: '\uD83D\uDCB1', filename: 'og-fx.png' },
  { title: 'Mobile Money Fee Calculator', subtitle: 'M-Pesa, MTN MoMo, Wave \u2014 compare fees', emoji: '\uD83D\uDCF1', filename: 'og-mobile-money.png' },
  { title: 'Salary Benchmark', subtitle: 'See how your salary compares in your country', emoji: '\uD83D\uDCCA', filename: 'og-salary.png' },
  { title: 'Monthly Budget Planner', subtitle: 'Plan your spending, maximize your savings', emoji: '\uD83D\uDCB0', filename: 'og-budget.png' },
  { title: 'AfroTools', subtitle: 'Free calculators & tools built for Africa', emoji: '\uD83C\uDF0D', filename: 'og-default.png' },
];

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function generateImage({ title, subtitle, emoji, filename }) {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  /* Background gradient */
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, '#0c1a10');
  grad.addColorStop(1, '#0f2516');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  /* Decorative circle */
  ctx.save();
  ctx.globalAlpha = 0.06;
  ctx.fillStyle = '#008751';
  ctx.beginPath();
  ctx.arc(W - 120, 140, 260, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  /* Top accent bar */
  ctx.fillStyle = '#008751';
  ctx.fillRect(0, 0, W, 5);

  /* Logo badge */
  const px = 60;
  roundRect(ctx, px, 50, 160, 42, 8);
  ctx.fillStyle = '#008751';
  ctx.fill();
  ctx.font = 'bold 20px Arial';
  ctx.fillStyle = '#FAFAF8';
  ctx.textBaseline = 'middle';
  ctx.fillText('AFROTOOLS', px + 14, 71);

  /* Emoji */
  ctx.font = '72px Arial';
  ctx.textBaseline = 'top';
  ctx.fillText(emoji, px, 140);

  /* Title with word wrap */
  ctx.fillStyle = '#FAFAF8';
  ctx.font = 'bold 52px Georgia';
  ctx.textBaseline = 'top';
  const words = title.split(' ');
  let line = '';
  let y = 280;
  for (const word of words) {
    const test = line + word + ' ';
    if (ctx.measureText(test).width > W - 140) {
      ctx.fillText(line.trim(), px, y);
      line = word + ' ';
      y += 62;
    } else {
      line = test;
    }
  }
  ctx.fillText(line.trim(), px, y);

  /* Subtitle */
  ctx.fillStyle = 'rgba(250,250,248,0.55)';
  ctx.font = '500 24px Arial';
  ctx.fillText(subtitle, px, y + 62);

  /* Bottom brand bar */
  const barH = 64;
  const barY = H - barH;
  ctx.fillStyle = '#008751';
  ctx.fillRect(0, barY, W, barH);
  ctx.font = '600 22px Arial';
  ctx.fillStyle = '#FAFAF8';
  ctx.textBaseline = 'middle';
  ctx.fillText('afrotools.com', px, barY + barH / 2);

  /* Save */
  const buffer = canvas.toBuffer('image/png');
  const outPath = path.join(OUT, filename);
  fs.writeFileSync(outPath, buffer);
  console.log(`Generated: ${filename} (${(buffer.length / 1024).toFixed(0)} KB)`);
}

console.log('Generating OG images...\n');
IMAGES.forEach(generateImage);
console.log('\nDone! Images saved to assets/img/');
