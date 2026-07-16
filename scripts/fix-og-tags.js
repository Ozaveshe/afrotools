#!/usr/bin/env node
/**
 * OG Meta Tag Audit & Fix for WhatsApp Optimization
 * ─────────────────────────────────────────────────
 * Scans tool HTML pages and reports/fixes OG meta tags.
 * Run: node scripts/fix-og-tags.js [--fix]
 *
 * Without --fix: audit only (prints report)
 * With --fix: applies fixes to files
 */

const fs = require('fs');
const path = require('path');
const { imageSizeFromUrl } = require('./lib/image-size.js');

const FIX_MODE = process.argv.includes('--fix');
const ROOT = path.resolve(__dirname, '..');

/* ── WhatsApp-optimized OG data for top tools ── */
const OG_OVERRIDES = {
  'nigeria/ng-salary-tax.html': {
    ogTitle: 'Calculate Your Nigeria Take-Home Pay \u2014 Free',
    ogDesc: 'Nigeria PAYE calculator 2026. NTA & PITA tax bands, pension, NHF. See your exact net salary in seconds.',
    ogImage: 'https://afrotools.com/assets/img/og-ng-salary-tax.png',
  },
  'kenya/ke-paye.html': {
    ogTitle: 'Kenya PAYE Calculator \u2014 KRA Tax Bands 2026',
    ogDesc: 'Calculate Kenya net salary. PAYE, NSSF, SHIF, Housing Levy, disability exemption. Finance Act 2024 compliant.',
    ogImage: 'https://afrotools.com/assets/img/og-ke-paye.png',
  },
  'south-africa/za-paye.html': {
    ogTitle: 'South Africa Tax Calculator \u2014 SARS 2026',
    ogDesc: 'Calculate SA take-home pay. SARS tax brackets, UIF, medical credits, retirement annuity. Free and instant.',
    ogImage: 'https://afrotools.com/assets/img/og-za-paye.png',
  },
  'ghana/gh-paye.html': {
    ogTitle: 'Ghana PAYE Calculator \u2014 GRA Tax Rates 2026',
    ogDesc: 'Calculate Ghana net salary. GRA tax bands, SSNIT Tier I/II/III, overtime, bonus tax. Free PAYE calculator.',
    ogImage: 'https://afrotools.com/assets/img/og-gh-paye.png',
  },
  'egypt/eg-paye.html': {
    ogTitle: 'Egypt Salary Tax Calculator \u2014 2025/2026',
    ogDesc: 'Calculate Egypt net salary after tax. Progressive tax bands, social insurance, exemptions. Free and accurate.',
    ogImage: 'https://afrotools.com/assets/img/og-default.png',
  },
  'tanzania/tz-paye.html': {
    ogTitle: 'Tanzania PAYE Calculator \u2014 TRA 2026',
    ogDesc: 'Calculate Tanzania take-home salary. TRA PAYE bands, NSSF, SDL, skills levy. Free tax calculator.',
    ogImage: 'https://afrotools.com/assets/img/og-default.png',
  },
  'uganda/ug-paye.html': {
    ogTitle: 'Uganda PAYE Calculator \u2014 URA 2026',
    ogDesc: 'Calculate Uganda take-home pay. URA tax bands, NSSF 5%, local service tax. Free and instant.',
    ogImage: 'https://afrotools.com/assets/img/og-default.png',
  },
  'rwanda/rw-paye.html': {
    ogTitle: 'Rwanda PAYE Calculator \u2014 RRA 2026',
    ogDesc: 'Calculate Rwanda net salary. RRA progressive tax bands, pension 5%, maternity leave. Free calculator.',
    ogImage: 'https://afrotools.com/assets/img/og-default.png',
  },
  'ethiopia/et-paye.html': {
    ogTitle: 'Ethiopia PAYE Calculator \u2014 2025/2026',
    ogDesc: 'Calculate Ethiopia net salary after income tax. Progressive bands, pension 7%. Free and instant.',
    ogImage: 'https://afrotools.com/assets/img/og-default.png',
  },
  'morocco/ma-paye.html': {
    ogTitle: 'Morocco Salary Tax Calculator \u2014 IR 2026',
    ogDesc: 'Calculate Morocco net salary. IR progressive bands, CNSS, AMO, family deductions. Free calculator.',
    ogImage: 'https://afrotools.com/assets/img/og-default.png',
  },

  /* ── VAT pages ── */
  'nigeria/ng-vat.html': {
    ogTitle: 'Nigeria VAT Calculator \u2014 Add or Remove VAT',
    ogDesc: 'Calculate Nigeria VAT instantly. Add or remove 7.5% VAT. Free VAT calculator with breakdown.',
    ogImage: 'https://afrotools.com/assets/img/og-default.png',
  },
  'kenya/ke-vat.html': {
    ogTitle: 'Kenya VAT Calculator \u2014 16% KRA VAT',
    ogDesc: 'Calculate Kenya VAT. Add or remove 16% VAT instantly. Free calculator with full breakdown.',
    ogImage: 'https://afrotools.com/assets/img/og-default.png',
  },
  'south-africa/za-vat.html': {
    ogTitle: 'South Africa VAT Calculator \u2014 15% SARS',
    ogDesc: 'Calculate SA VAT. Add or remove 15% VAT instantly. SARS-compliant free calculator.',
    ogImage: 'https://afrotools.com/assets/img/og-default.png',
  },
  'ghana/gh-vat.html': {
    ogTitle: 'Ghana VAT Calculator \u2014 Add/Remove VAT',
    ogDesc: 'Calculate Ghana VAT instantly. Standard 15% + NHIL + GETFund + COVID levy. Free calculator.',
    ogImage: 'https://afrotools.com/assets/img/og-default.png',
  },

  /* ── Top tools ── */
  'tools/currency-converter/index.html': {
    ogTitle: 'African Currency Converter \u2014 Live Rates',
    ogDesc: 'Convert between African currencies with live exchange rates. Dollar to Naira, Cedi, Shilling and 40+ currencies.',
    ogImage: 'https://afrotools.com/assets/img/og-default.png',
  },
  'tools/mobile-money-fees/index.html': {
    ogTitle: 'Mobile Money Fee Calculator \u2014 M-Pesa, MoMo',
    ogDesc: 'Compare mobile money fees across M-Pesa, MTN MoMo, Airtel Money, Wave. See exact charges before sending.',
    ogImage: 'https://afrotools.com/assets/img/og-default.png',
  },
  'tools/mortgage-calculator/index.html': {
    ogTitle: 'African Mortgage Calculator \u2014 Free',
    ogDesc: 'Calculate your monthly mortgage payment for Nigeria, Kenya, South Africa. See amortization schedule.',
    ogImage: 'https://afrotools.com/assets/img/og-default.png',
  },
  'crypto/tax-calculator/index.html': {
    ogTitle: 'Crypto Tax Calculator Africa \u2014 Free',
    ogDesc: 'Calculate crypto capital gains tax for Nigeria, Kenya, South Africa. Free cryptocurrency tax calculator.',
    ogImage: 'https://afrotools.com/assets/img/og-default.png',
  },
  'tools/budget-planner/index.html': {
    ogTitle: 'Monthly Budget Planner \u2014 Free Tool',
    ogDesc: 'Plan your monthly budget. Track income, expenses, savings goals. Works with any African currency.',
    ogImage: 'https://afrotools.com/assets/img/og-default.png',
  },
  'tools/remittance-compare/index.html': {
    ogTitle: 'Compare Remittance Fees \u2014 Send Money Africa',
    ogDesc: 'Compare remittance fees for sending money to Africa. Wise, Remitly, WorldRemit, Sendwave side-by-side.',
    ogImage: 'https://afrotools.com/assets/img/og-default.png',
  },
};

/* ── Audit & fix a single file ── */
function processFile(relPath) {
  const fullPath = path.join(ROOT, relPath);
  if (!fs.existsSync(fullPath)) {
    console.log(`  SKIP  ${relPath} (not found)`);
    return;
  }

  let html = fs.readFileSync(fullPath, 'utf8');
  const override = OG_OVERRIDES[relPath];
  const issues = [];

  /* Check og:title */
  const titleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]*)"[^>]*>/i);
  const ogTitle = titleMatch ? titleMatch[1] : null;
  if (!ogTitle) issues.push('MISSING og:title');
  else if (ogTitle.length > 65) issues.push(`og:title too long (${ogTitle.length} chars): "${ogTitle}"`);

  /* Check og:description */
  const descMatch = html.match(/<meta\s+property="og:description"\s+content="([^"]*)"[^>]*>/i);
  const ogDesc = descMatch ? descMatch[1] : null;
  if (!ogDesc) issues.push('MISSING og:description');
  else if (ogDesc.length > 155) issues.push(`og:description too long (${ogDesc.length} chars)`);

  /* Check og:image */
  const imgMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]*)"[^>]*>/i);
  const ogImage = imgMatch ? imgMatch[1] : null;
  if (!ogImage) issues.push('MISSING og:image');
  else if (!ogImage.startsWith('https://')) issues.push('og:image not HTTPS: ' + ogImage);

  /* Check og:image:width/height */
  const widthMatch = html.match(/<meta\s+property="og:image:width"/i);
  const heightMatch = html.match(/<meta\s+property="og:image:height"/i);
  if (!widthMatch) issues.push('MISSING og:image:width');
  if (!heightMatch) issues.push('MISSING og:image:height');

  /* Check og:site_name */
  const siteNameMatch = html.match(/<meta\s+property="og:site_name"/i);
  if (!siteNameMatch) issues.push('MISSING og:site_name');

  /* Report */
  if (issues.length > 0 || FIX_MODE) {
    console.log(`\n${relPath}:`);
    issues.forEach(i => console.log(`  ⚠  ${i}`));
  }

  /* Apply fixes if --fix mode */
  if (FIX_MODE && override) {
    let modified = false;

    /* Fix og:title */
    if (override.ogTitle && titleMatch) {
      html = html.replace(titleMatch[0], `<meta property="og:title" content="${override.ogTitle}">`);
      modified = true;
      console.log(`  ✓  og:title → "${override.ogTitle}"`);
    }

    /* Fix og:description */
    if (override.ogDesc && descMatch) {
      html = html.replace(descMatch[0], `<meta property="og:description" content="${override.ogDesc}">`);
      modified = true;
      console.log(`  ✓  og:description → "${override.ogDesc.slice(0, 60)}..."`);
    }

    /* Fix og:image — re-match after possible title/desc changes */
    const imgMatchNow = html.match(/<meta\s+property="og:image"\s+content="([^"]*)"[^>]*>/i);
    if (override.ogImage && imgMatchNow) {
      html = html.replace(imgMatchNow[0], `<meta property="og:image" content="${override.ogImage}">`);
      modified = true;
    }

    /* Add og:image:width/height if missing — measured, never assumed.
       This previously hardcoded 1200x630, which lied for every page whose og:image was a smaller
       asset (e.g. the 600x400 tool thumbnails apply-og-fallbacks.js swaps in). If the image cannot
       be measured, emit nothing: platforms then fetch and size it themselves, which is correct,
       whereas a wrong hint mis-renders the card. */
    const widthNow = html.match(/<meta\s+property="og:image:width"/i);
    if (!widthNow) {
      const imgTag = html.match(/<meta\s+property="og:image"\s+content="([^"]*)">/i);
      if (imgTag) {
        const size = imageSizeFromUrl(imgTag[1], ROOT);
        if (size) {
          html = html.replace(
            imgTag[0],
            imgTag[0] + `\n  <meta property="og:image:width" content="${size.w}">\n  <meta property="og:image:height" content="${size.h}">`
          );
          modified = true;
          console.log(`  ✓  Added og:image:width + og:image:height (${size.w}x${size.h})`);
        } else {
          console.log(`  •  Skipped og:image dimensions (cannot measure ${imgTag[1]})`);
        }
      }
    }

    /* Add og:site_name if missing */
    if (!siteNameMatch) {
      const insertAfter = html.match(/<meta\s+property="og:image:height"[^>]*>/i) ||
                           html.match(/<meta\s+property="og:image"[^>]*>/i);
      if (insertAfter) {
        html = html.replace(insertAfter[0], insertAfter[0] + '\n  <meta property="og:site_name" content="AfroTools">');
        modified = true;
        console.log('  ✓  Added og:site_name');
      }
    }

    /* Also update twitter:title/description to match */
    if (override.ogTitle) {
      const twTitle = html.match(/<meta\s+name="twitter:title"\s+content="([^"]*)"[^>]*>/i);
      if (twTitle) {
        html = html.replace(twTitle[0], `<meta name="twitter:title" content="${override.ogTitle}">`);
      }
    }
    if (override.ogDesc) {
      const twDesc = html.match(/<meta\s+name="twitter:description"\s+content="([^"]*)"[^>]*>/i);
      if (twDesc) {
        html = html.replace(twDesc[0], `<meta name="twitter:description" content="${override.ogDesc}">`);
      }
    }

    if (modified) {
      fs.writeFileSync(fullPath, html, 'utf8');
      console.log(`  ✓  File saved`);
    }
  }
}

/* ── Main ── */
console.log(`AfroTools OG Tag Audit${FIX_MODE ? ' + FIX' : ' (read-only)'}`);
console.log('═'.repeat(50));

Object.keys(OG_OVERRIDES).forEach(processFile);

console.log('\n' + '═'.repeat(50));
console.log('Done. ' + (FIX_MODE ? 'Fixes applied.' : 'Run with --fix to apply changes.'));
