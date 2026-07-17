/**
 * Batch-add featured images to all blog article pages.
 * Run: node scripts/add-featured-images.js
 */
const fs = require('fs');
const path = require('path');

const BLOG_DIR = path.join(__dirname, '..', 'blog');

// Mapping: article slug -> image path (relative to /assets/img/tools/)
const IMAGE_MAP = {
  'how-to-calculate-paye-nigeria-2026': { img: 'ng-paye.webp', alt: 'Nigeria PAYE Calculator' },
  'nigeria-tax-act-2026-changes': { img: 'ng-paye-v2.svg', alt: 'Nigeria Tax Act 2026' },
  'kenya-paye-calculator-guide-2025': { img: 'ke-paye.webp', alt: 'Kenya PAYE Calculator' },
  'south-africa-tax-brackets-2025-26': { img: 'za-paye.webp', alt: 'South Africa PAYE Calculator' },
  'ghana-paye-tax-ssnit-tier-3': { img: 'gh-paye.webp', alt: 'Ghana PAYE Calculator' },
  'dollar-to-naira-rate-today': { img: 'currency-converter.webp', alt: 'Dollar to Naira Exchange Rate' },
  'mobile-money-fees-africa-compared': { img: 'mobile-money-fees.webp', alt: 'Mobile Money Fees Comparison' },
  'cheapest-way-send-money-nigeria': { img: 'remittance-compare.webp', alt: 'Send Money to Nigeria' },
  'import-duty-nigeria-2026': { img: 'import-duty.webp', alt: 'Nigeria Import Duty Calculator' },
  'vat-rates-africa-2026': { img: 'ng-paye-v2.svg', alt: 'VAT Rates Across Africa' },
  'best-free-pdf-tools-online': { img: 'pdf-workspace.webp', alt: 'Free PDF Tools Online' },
  'salary-after-tax-nigeria': { img: 'ng-paye.webp', alt: 'Nigeria Salary After Tax' },
  'construction-material-prices-nigeria': { img: 'boq-generator.svg', alt: 'Construction Material Prices Nigeria' },
  'waec-grading-system-aggregate': { img: 'waec-calculator.webp', alt: 'WAEC Grading Calculator' },
  'japa-guide-nigeria-canada-2026': { img: 'japa-calculator.webp', alt: 'Japa Calculator Nigeria to Canada' },
  'learn-african-languages-free': { img: 'yoruba-translator.svg', alt: 'African Languages Translator' },
  'free-gpa-calculator-nigerian-universities': { img: 'gpa-calculator.svg', alt: 'GPA Calculator' },
  'free-event-flyer-maker-online': { img: 'flyer-maker.svg', alt: 'Event Flyer Maker' },
  'compound-interest-calculator-africa': { img: 'budget-planner.svg', alt: 'Compound Interest Calculator' },
  'bmi-calculator-africa-guide': { img: 'bmi-calculator.webp', alt: 'BMI Calculator Africa' },
  'free-json-formatter-developer-tools': { img: 'base64.svg', alt: 'Developer Tools' },
  'mortgage-calculator-nigeria-homebuyer': { img: 'mortgage-calculator.svg', alt: 'Mortgage Calculator Nigeria' },
  'nigerian-tenancy-agreement-template': { img: 'tenancy-agreement.svg', alt: 'Nigerian Tenancy Agreement' },
  'youtube-thumbnail-maker-free': { img: 'thumbnail-maker.svg', alt: 'YouTube Thumbnail Maker' },
  'crop-yield-calculator-african-farming': { img: 'agric-profit.svg', alt: 'African Crop Yield Calculator' },
  // Crypto articles (use SVGs that exist)
  'crypto-tax-africa-nigeria-kenya-sa': { img: 'crypto-tax.svg', alt: 'Crypto Tax Africa' },
  'best-p2p-platforms-nigeria-2026': { img: 'crypto-tax.svg', alt: 'P2P Platforms Nigeria' },
  'crypto-scam-red-flags-africa': { img: 'crypto-tax.svg', alt: 'Crypto Scam Red Flags' },
  'how-to-buy-bitcoin-nigeria-2026': { img: 'crypto-tax.svg', alt: 'How to Buy Bitcoin Nigeria' },
  'usdt-vs-usdc-nigeria': { img: 'crypto-tax.svg', alt: 'USDT vs USDC Nigeria' },
};

const FEATURED_HTML = (imgPath, alt) => `
<div class="article-featured-img">
  <div class="article-featured-img-inner">
    <img src="/assets/img/tools/${imgPath}" alt="${alt}" loading="eager">
  </div>
</div>
`;

let updated = 0;
let skipped = 0;

const dirs = fs.readdirSync(BLOG_DIR, { withFileTypes: true })
  .filter(d => d.isDirectory() && d.name !== 'assets')
  .map(d => d.name);

for (const slug of dirs) {
  const filePath = path.join(BLOG_DIR, slug, 'index.html');
  if (!fs.existsSync(filePath)) { skipped++; continue; }

  let html = fs.readFileSync(filePath, 'utf8');

  // Skip if already has featured image
  if (html.includes('article-featured-img')) {
    console.log(`SKIP (already has): ${slug}`);
    skipped++;
    continue;
  }

  const mapping = IMAGE_MAP[slug];
  if (!mapping) {
    console.log(`SKIP (no mapping): ${slug}`);
    skipped++;
    continue;
  }

  const block = FEATURED_HTML(mapping.img, mapping.alt);

  // Type 1: Has article-hero section (newer template)
  if (html.includes('</section>') && html.includes('article-hero')) {
    // Insert after </section> closing the article-hero, before <main class="article-layout">
    html = html.replace(
      /(< *\/section *>)([\s\S]*?)(< *main\s+class="article-layout")/,
      `$1\n${block}\n$3`
    );
    fs.writeFileSync(filePath, html, 'utf8');
    console.log(`UPDATED (hero type): ${slug}`);
    updated++;
  }
  // Type 2: No hero section, article-header inside article-layout (crypto template)
  else if (html.includes('article-header') || html.includes('article-layout')) {
    // Insert before <main class="article-layout">
    html = html.replace(
      /(< *main\s+class="article-layout")/,
      `${block}\n  $1`
    );
    fs.writeFileSync(filePath, html, 'utf8');
    console.log(`UPDATED (header type): ${slug}`);
    updated++;
  }
  else {
    console.log(`SKIP (unknown template): ${slug}`);
    skipped++;
  }
}

console.log(`\nDone: ${updated} updated, ${skipped} skipped`);
