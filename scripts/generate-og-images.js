#!/usr/bin/env node
/**
 * OG Image Generator for AfroTools
 * ─────────────────────────────────
 * Generates 1200×630 SVG OG images for social sharing.
 * No dependencies needed — pure SVG output.
 *
 * Usage: node scripts/generate-og-images.js
 *
 * Output: assets/img/og/*.svg  (+ assets/img/og-home.svg, og-default.svg)
 *
 * For PNG conversion (optional, most platforms accept SVG):
 *   npx @anthropic-ai/resvg-cli assets/img/og/*.svg
 *   or: https://cloudconvert.com/svg-to-png (batch)
 */

const fs = require('fs');
const path = require('path');

const OG_DIR = path.resolve(__dirname, '..', 'assets', 'img', 'og');
const IMG_DIR = path.resolve(__dirname, '..', 'assets', 'img');

// ── Brand tokens (blue brand — from tokens.min.css) ──
const C = {
  primary:   '#007AFF',
  dark:      '#0A1628',
  darkAlt:   '#131D2E',
  text:      '#E2E8F0',
  muted:     '#94A3B8',
};

// ── Image definitions ──
const IMAGES = [
  // Homepage & default
  { file: 'og-home',        dir: 'img',  title: 'AfroTools',                subtitle: 'Free Financial & Productivity Tools for Africa',    emoji: '🌍',  accent: '#007AFF' },
  { file: 'og-default',     dir: 'img',  title: 'AfroTools',                subtitle: "Free tools for Africa's digital economy",           emoji: '🔧',  accent: '#007AFF' },

  // Category OG images (go in og/ subfolder)
  { file: 'cat-financial',   dir: 'og', title: 'Financial Tools',           subtitle: 'Tax, salary & investment calculators',              emoji: '💰',  accent: '#10B981' },
  { file: 'cat-pdf',         dir: 'og', title: 'PDF & Documents',           subtitle: 'Convert, merge, compress & edit PDFs',              emoji: '📄',  accent: '#F59E0B' },
  { file: 'cat-image',       dir: 'og', title: 'Image & Design',            subtitle: 'Resize, convert & optimize images',                 emoji: '🎨',  accent: '#EC4899' },
  { file: 'cat-developer',   dir: 'og', title: 'Developer Tools',           subtitle: 'JSON, regex, API & code utilities',                 emoji: '⚡',  accent: '#8B5CF6' },
  { file: 'cat-education',   dir: 'og', title: 'Education Tools',           subtitle: 'GPA, CGPA & academic calculators',                  emoji: '🎓',  accent: '#06B6D4' },
  { file: 'cat-health',      dir: 'og', title: 'Health & Wellness',         subtitle: 'BMI, nutrition & fitness calculators',              emoji: '🏥',  accent: '#EF4444' },
  { file: 'cat-african',     dir: 'og', title: 'Uniquely African',          subtitle: 'Tools built for the African continent',             emoji: '🌍',  accent: '#F97316' },
  { file: 'cat-legal',       dir: 'og', title: 'Property & Legal',          subtitle: 'Mortgage, rent & legal calculators',                emoji: '🏠',  accent: '#14B8A6' },
  { file: 'cat-business',    dir: 'og', title: 'Business & ROI',            subtitle: 'Profit, pricing & business analytics',              emoji: '📊',  accent: '#6366F1' },
  { file: 'cat-language',    dir: 'og', title: 'Language Tools',            subtitle: 'Translation, grammar & text utilities',             emoji: '🗣️',  accent: '#D946EF' },
  { file: 'cat-trade',       dir: 'og', title: 'Trade & Logistics',         subtitle: 'Shipping, customs & trade calculators',             emoji: '🚢',  accent: '#0EA5E9' },
  { file: 'cat-crypto',      dir: 'og', title: 'Crypto & Web3',            subtitle: 'Crypto converters & blockchain tools',              emoji: '₿',   accent: '#F7931A' },
  { file: 'cat-agriculture', dir: 'og', title: 'Agriculture',               subtitle: 'Farm planning & crop calculators',                  emoji: '🌾',  accent: '#22C55E' },
  { file: 'cat-ecommerce',   dir: 'og', title: 'E-Commerce',               subtitle: 'Pricing, margins & online store tools',             emoji: '🛒',  accent: '#F43F5E' },
  { file: 'cat-data',        dir: 'og', title: 'Data & Productivity',       subtitle: 'Spreadsheets, charts & productivity tools',         emoji: '📋',  accent: '#0284C7' },

  // Country-specific (top countries)
  { file: 'og-NG',  dir: 'og', title: 'Nigeria Tools',       subtitle: 'PAYE, VAT, pension & salary calculators',       emoji: '🇳🇬', accent: '#008751' },
  { file: 'og-KE',  dir: 'og', title: 'Kenya Tools',         subtitle: 'KRA PAYE, SHIF, NSSF & tax calculators',        emoji: '🇰🇪', accent: '#BB0000' },
  { file: 'og-ZA',  dir: 'og', title: 'South Africa Tools',  subtitle: 'SARS tax, UIF & medical credit calculators',    emoji: '🇿🇦', accent: '#007749' },
  { file: 'og-GH',  dir: 'og', title: 'Ghana Tools',         subtitle: 'GRA PAYE, SSNIT & income tax calculators',      emoji: '🇬🇭', accent: '#006B3F' },
  { file: 'og-TZ',  dir: 'og', title: 'Tanzania Tools',      subtitle: 'TRA PAYE, NSSF & salary calculators',           emoji: '🇹🇿', accent: '#1EB53A' },
  { file: 'og-EG',  dir: 'og', title: 'Egypt Tools',         subtitle: 'Income tax, social insurance calculators',       emoji: '🇪🇬', accent: '#C8102E' },
];

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function svg(img) {
  const a = img.accent;
  const isMain = img.file.startsWith('og-home') || img.file === 'og-default';
  const tSize = isMain ? 62 : 54;
  const tY = isMain ? 285 : 265;
  const sY = tY + 52;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${C.dark}"/>
      <stop offset="100%" stop-color="${C.darkAlt}"/>
    </linearGradient>
    <linearGradient id="bar" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${a}"/>
      <stop offset="100%" stop-color="${C.primary}"/>
    </linearGradient>
    <pattern id="dots" width="30" height="30" patternUnits="userSpaceOnUse">
      <circle cx="15" cy="15" r="1" fill="${C.muted}" opacity="0.07"/>
    </pattern>
  </defs>

  <!-- BG -->
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#dots)"/>

  <!-- Accent bar -->
  <rect y="0" width="1200" height="5" fill="url(#bar)"/>

  <!-- Glow circles -->
  <circle cx="1060" cy="130" r="200" fill="${a}" opacity="0.05"/>
  <circle cx="1100" cy="500" r="130" fill="${C.primary}" opacity="0.04"/>

  <!-- Emoji watermark -->
  <text x="980" y="400" font-size="160" text-anchor="middle" opacity="0.08">${img.emoji}</text>

  <!-- Logo -->
  <text x="80" y="${isMain ? 185 : 165}" font-family="system-ui,-apple-system,sans-serif" font-size="26" font-weight="900" letter-spacing="3" fill="${C.text}">AFRO<tspan fill="${C.primary}">TOOLS</tspan></text>

  <!-- Title -->
  <text x="80" y="${tY}" font-family="system-ui,-apple-system,sans-serif" font-size="${tSize}" font-weight="800" fill="${C.text}" letter-spacing="-1">${esc(img.title)}</text>

  <!-- Subtitle -->
  <text x="80" y="${sY}" font-family="system-ui,-apple-system,sans-serif" font-size="24" fill="${C.muted}">${esc(img.subtitle)}</text>

  <!-- Accent line -->
  <rect x="80" y="${sY + 18}" width="80" height="4" rx="2" fill="${a}"/>

  <!-- Footer -->
  <rect y="590" width="1200" height="40" fill="${C.dark}" opacity="0.6"/>
  <text x="80" y="617" font-family="system-ui,-apple-system,sans-serif" font-size="16" fill="${C.muted}">afrotools.com</text>
  <text x="1120" y="617" font-family="system-ui,-apple-system,sans-serif" font-size="16" fill="${C.muted}" text-anchor="end">Free &amp; Open Tools for Africa</text>
</svg>`;
}

// ── Generate ──
if (!fs.existsSync(OG_DIR)) fs.mkdirSync(OG_DIR, { recursive: true });

let count = 0;
for (const img of IMAGES) {
  const outDir = img.dir === 'og' ? OG_DIR : IMG_DIR;
  const outPath = path.join(outDir, img.file + '.svg');
  fs.writeFileSync(outPath, svg(img));
  const rel = path.relative(path.resolve(__dirname, '..'), outPath).replace(/\\/g, '/');
  console.log(`  ✓ ${rel}`);
  count++;
}

console.log(`\n  Generated ${count} OG images`);
console.log('  SVGs work directly as og:image on most platforms.');
console.log('  For WhatsApp (requires PNG), convert with:');
console.log('    npx resvg-js-cli assets/img/og/*.svg');
