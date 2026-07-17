/**
 * Fix og:image meta tags across all blog articles.
 * - Adds og:image if missing
 * - Replaces og-default.png with actual tool image
 * Run: node scripts/fix-og-images.js
 */
const fs = require('fs');
const path = require('path');

const BLOG_DIR = path.join(__dirname, '..', 'blog');
const BASE_URL = 'https://afrotools.com/assets/img/tools/';

const IMAGE_MAP = {
  'how-to-calculate-paye-nigeria-2026': 'ng-paye.webp',
  'nigeria-tax-act-2026-changes': 'ng-paye-v2.svg',
  'kenya-paye-calculator-guide-2025': 'ke-paye.webp',
  'south-africa-tax-brackets-2025-26': 'za-paye.webp',
  'ghana-paye-tax-ssnit-tier-3': 'gh-paye.webp',
  'dollar-to-naira-rate-today': 'currency-converter.webp',
  'mobile-money-fees-africa-compared': 'mobile-money-fees.webp',
  'cheapest-way-send-money-nigeria': 'remittance-compare.webp',
  'import-duty-nigeria-2026': 'import-duty.webp',
  'vat-rates-africa-2026': 'ng-paye-v2.svg',
  'best-free-pdf-tools-online': 'pdf-workspace.webp',
  'salary-after-tax-nigeria': 'ng-paye.webp',
  'construction-material-prices-nigeria': 'boq-generator.svg',
  'waec-grading-system-aggregate': 'waec-calculator.webp',
  'japa-guide-nigeria-canada-2026': 'japa-calculator.webp',
  'learn-african-languages-free': 'yoruba-translator.svg',
  'free-gpa-calculator-nigerian-universities': 'gpa-calculator.svg',
  'free-event-flyer-maker-online': 'flyer-maker.svg',
  'compound-interest-calculator-africa': 'budget-planner.svg',
  'bmi-calculator-africa-guide': 'bmi-calculator.webp',
  'free-json-formatter-developer-tools': 'base64.svg',
  'mortgage-calculator-nigeria-homebuyer': 'mortgage-calculator.svg',
  'nigerian-tenancy-agreement-template': 'tenancy-agreement.svg',
  'youtube-thumbnail-maker-free': 'thumbnail-maker.svg',
  'crop-yield-calculator-african-farming': 'agric-profit.svg',
  'crypto-tax-africa-nigeria-kenya-sa': 'crypto-tax.svg',
  'best-p2p-platforms-nigeria-2026': 'crypto-tax.svg',
  'crypto-scam-red-flags-africa': 'crypto-tax.svg',
  'how-to-buy-bitcoin-nigeria-2026': 'crypto-tax.svg',
  'usdt-vs-usdc-nigeria': 'crypto-tax.svg',
  // New articles already have correct og:image
  'kenya-salary-tax-2026': 'ke-paye.webp',
  'uif-calculator-south-africa-2026': 'za-uif.webp',
  'register-business-nigeria-cac-2026': 'business-name-gen.svg',
  'best-savings-accounts-nigeria-2026': 'budget-planner.svg',
};

let updated = 0;
let skipped = 0;

const dirs = fs.readdirSync(BLOG_DIR, { withFileTypes: true })
  .filter(d => d.isDirectory() && d.name !== 'assets')
  .map(d => d.name);

for (const slug of dirs) {
  const filePath = path.join(BLOG_DIR, slug, 'index.html');
  if (!fs.existsSync(filePath)) { skipped++; continue; }

  const img = IMAGE_MAP[slug];
  if (!img) { console.log(`SKIP (no mapping): ${slug}`); skipped++; continue; }

  let html = fs.readFileSync(filePath, 'utf8');
  const ogImageUrl = BASE_URL + img;
  let changed = false;

  // Case 1: Has og:image pointing to og-default.png — replace it
  if (html.includes('og-default.png') || html.includes('og-home.png')) {
    html = html.replace(
      /content="https:\/\/afrotools\.com\/assets\/img\/og-(?:default|home)\.png"/g,
      `content="${ogImageUrl}"`
    );
    changed = true;
  }

  // Case 2: Has no og:image at all — add it after og:description or og:title
  if (!html.includes('og:image')) {
    // Try to insert after og:description
    if (html.includes('og:description')) {
      html = html.replace(
        /(< *meta\s+property="og:description"[^>]*>)/,
        `$1\n<meta property="og:image" content="${ogImageUrl}">`
      );
      changed = true;
    }
    // Fallback: insert after og:title
    else if (html.includes('og:title')) {
      html = html.replace(
        /(< *meta\s+property="og:title"[^>]*>)/,
        `$1\n<meta property="og:image" content="${ogImageUrl}">`
      );
      changed = true;
    }
  }

  // Also fix JSON-LD Article schema image if it points to og-default
  if (html.includes('"image":"https://afrotools.com/assets/img/og-default.png"')) {
    html = html.replace(
      '"image":"https://afrotools.com/assets/img/og-default.png"',
      `"image":"${ogImageUrl}"`
    );
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, html, 'utf8');
    console.log(`UPDATED: ${slug}`);
    updated++;
  } else {
    console.log(`OK (already correct): ${slug}`);
    skipped++;
  }
}

console.log(`\nDone: ${updated} updated, ${skipped} skipped`);
