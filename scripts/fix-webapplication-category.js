#!/usr/bin/env node
/**
 * fix-webapplication-category.js — Corrects mislabeled WebApplication JSON-LD
 * `applicationCategory` values.
 *
 * Background: add-webapplication-schema.js inferred categories from the full
 * relative path, whose dev-tool keyword list included "html" — which matches
 * "index.html" on EVERY page. Any tool not caught by an earlier finance/health/
 * education keyword therefore fell through to `DeveloperApplication`. This left
 * ~108 non-developer tools (bride-price, car-loan, age-calculator, …) tagged as
 * developer tools, which misleads search engines.
 *
 * This script is CONSERVATIVE: it only touches pages whose current
 * applicationCategory is exactly "DeveloperApplication" AND whose slug-based
 * re-classification is something else. Genuine developer tools (base64, regex,
 * cron-builder, …) keep DeveloperApplication. Anything ambiguous defaults to the
 * always-valid `WebApplication`.
 *
 * Usage:
 *   node scripts/fix-webapplication-category.js          (audit only)
 *   node scripts/fix-webapplication-category.js --fix    (apply changes)
 */

const fs = require('fs');
const path = require('path');
const { writeFileSyncWithRetry, renameSyncWithRetry } = require('./lib/safe-write');

const ROOT = path.resolve(__dirname, '..');
const FIX = process.argv.includes('--fix');
const TOOL_DIRS = ['tools', 'crypto'];

function walkHtml(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      out.push(...walkHtml(full));
    } else if (entry.name.endsWith('.html')) {
      out.push(full);
    }
  }
  return out;
}

// Slug-based classifier. Matches against the tool slug (path WITHOUT the
// index.html / *.html filename), so "index.html" can never trigger a match.
function inferCategory(slug) {
  const s = slug.toLowerCase();
  const has = (...k) => k.some((x) => s.includes(x));
  if (has('tax', 'paye', 'vat', 'salary', 'pension', 'wht', 'cgt', 'uif', 'nhf',
    'stamp-duty', 'dividend', 'transfer-duty')) return 'FinanceApplication';
  if (has('crypto', 'bitcoin')) return 'FinanceApplication';
  if (has('mortgage', 'property', 'rent', 'home-loan')) return 'FinanceApplication';
  if (has('bmi', 'calorie', 'health', 'blood', 'pregnancy', 'drug', 'vaccine',
    'malaria', 'sickle')) return 'HealthApplication';
  if (has('gpa', 'waec', 'jamb', 'school', 'study', 'ielts', 'degree', 'flashcard',
    'matric', 'scholarship', 'university', 'fraction', 'binary', 'scientific-calc',
    'citation')) return 'EducationalApplication';
  // Genuine developer tools — deliberately narrow, no 'html'/'url'/'api'.
  if (has('json', 'csv', 'regex', 'sql', 'hash', 'base64', 'uuid', 'jwt', 'htaccess',
    'robots.txt', 'sitemap', 'meta-tag', 'markdown', 'dev-tools', 'cron', 'docker',
    'css-gradient', 'diff-checker', 'commit-message', 'htpasswd')) return 'DeveloperApplication';
  if (has('image', 'photo', 'logo', 'flyer', 'thumbnail', 'meme', 'color', 'colour',
    'favicon', 'watermark', 'background-remover', 'certificate', 'social-card', 'qr',
    'passport')) return 'DesignApplication';
  if (has('currency', 'forex', 'budget', 'savings', 'loan', 'investment', 'interest',
    'inflation', 'break-even', 'profit', 'invoice', 'receipt', 'markup', 'discount',
    'tip', 'remittance', 'mobile-money', 'bank', 'wallet', 'portfolio', 'ajo-interest'))
    return 'FinanceApplication';
  return 'WebApplication';
}

function slugFor(rel) {
  return rel.replace(/\/index\.html$/i, '').replace(/\.html$/i, '');
}

const files = [];
for (const d of TOOL_DIRS) files.push(...walkHtml(path.join(ROOT, d)));

const corrected = [];
const kept = [];
const catCounts = {};

for (const file of files) {
  let html = fs.readFileSync(file, 'utf-8');
  if (!/"@type":\s*"WebApplication"/.test(html)) continue;
  const devMatch = html.match(/"applicationCategory":\s*"DeveloperApplication"/);
  if (!devMatch) continue;

  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  const newCat = inferCategory(slugFor(rel));
  if (newCat === 'DeveloperApplication') { kept.push(rel); continue; }

  catCounts[newCat] = (catCounts[newCat] || 0) + 1;
  corrected.push({ rel, newCat });

  if (FIX) {
    const before = html;
    html = html.replace(/"applicationCategory":(\s*)"DeveloperApplication"/,
      `"applicationCategory":$1"${newCat}"`);
    if (html !== before) {
      const tmp = file + '.tmp-cat';
      writeFileSyncWithRetry(tmp, html, 'utf-8');
      renameSyncWithRetry(tmp, file);
    }
  }
}

console.log('\n🔧 WebApplication applicationCategory remediation');
console.log('═'.repeat(60));
console.log(`Scanned ${files.length} html files in ${TOOL_DIRS.join(', ')}`);
console.log(`Genuine developer tools kept as-is: ${kept.length}`);
console.log(`${FIX ? 'Corrected' : 'Would correct'}: ${corrected.length}`);
for (const [cat, n] of Object.entries(catCounts).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(4)} × ${cat}`);
}
if (!FIX && corrected.length) console.log('\nRun with --fix to apply.');
if (FIX) console.log('\n✅ Applied.');
console.log('');
