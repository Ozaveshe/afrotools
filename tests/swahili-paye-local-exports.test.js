const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TARGETS = [
  'angola',
  'botswana',
  'burkina-faso',
  'burundi',
  'cameroon',
  'central-african-republic',
  'chad',
  'cote-divoire',
  'egypt',
  'equatorial-guinea',
  'eswatini',
  'ethiopia',
  'gabon',
  'guinea',
  'lesotho',
  'malawi',
  'mali',
  'mauritius',
  'niger',
  'rwanda',
  'senegal',
  'seychelles',
  'tanzania',
  'uganda',
  'zambia',
  'zimbabwe',
];
const MOBILE_REPAIRS = new Set([
  'burundi',
  'central-african-republic',
  'chad',
  'equatorial-guinea',
  'gabon',
  'rwanda',
  'tanzania',
  'uganda',
]);

for (const country of TARGETS) {
  const rel = `sw/${country}/kikokotoo-kodi-mshahara/index.html`;
  const html = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  assert.match(html, /function\s+generatePdf\s*\(/, `${rel} must retain its local PDF generator`);
  assert.match(
    html,
    /<button\b[^>]*onclick=["']generatePdf\(\)["'][^>]*data-no-gate=["']true["'][^>]*>/i,
    `${rel} must expose its local PDF action directly`,
  );
  assert.doesNotMatch(
    html,
    /auto-email-gate\.js|pdf-leads|pdfEmail|hiddenGross|openPdfModal|submitPdf/i,
    `${rel} must not retain a lead-capture export path`,
  );
  if (MOBILE_REPAIRS.has(country)) {
    assert.match(html, /data-sw-paye-mobile-contract/, `${rel} must retain its 320px layout repair`);
  }
  if (/function\s+renderChart\s*\(/.test(html)) {
    assert.match(
      html,
      /function\s+renderChart\s*\([^)]*\)\s*\{\s*if\s*\(typeof Chart===['"]undefined['"]\)return;/,
      `${rel} must calculate safely when Chart.js is unavailable`,
    );
  }
}

assert.strictEqual(TARGETS.length, 26, 'The mature local-PDF family must stay explicit');
console.log(`Verified ${TARGETS.length} Swahili PAYE pages with ungated local PDF exports.`);
