#!/usr/bin/env node
/**
 * add-webapplication-schema.js — Adds WebApplication JSON-LD schema to tool pages.
 *
 * For each tool page that has a WebPage schema but no WebApplication schema,
 * replaces the WebPage schema with WebApplication (which is more specific and
 * better for calculators/tools in Google's eyes).
 *
 * Usage:
 *   node scripts/add-webapplication-schema.js             (audit only)
 *   node scripts/add-webapplication-schema.js --fix        (apply changes)
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const FIX = process.argv.includes('--fix');

// Directories containing tool pages
const TOOL_DIRS = ['tools', 'crypto'];
// Country calculator pages (PAYE/VAT) are also tools
const COUNTRY_TOOL_PATTERN = /\/([\w-]+)\/([\w]+-(?:paye|vat|salary-tax))\.html$/;

function walkHtml(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      results.push(...walkHtml(full));
    } else if (entry.name.endsWith('.html')) {
      results.push(full);
    }
  }
  return results;
}

function inferLang(filePath) {
  const rel = path.relative(ROOT, filePath).replace(/\\/g, '/');
  if (rel.startsWith('fr/')) return 'fr';
  if (rel.startsWith('sw/')) return 'sw';
  if (rel.startsWith('yo/')) return 'yo';
  if (rel.startsWith('ha/')) return 'ha';
  return 'en';
}

function inferCategory(relPath) {
  relPath = relPath.toLowerCase();
  if (relPath.includes('tax') || relPath.includes('paye') || relPath.includes('vat') ||
      relPath.includes('salary') || relPath.includes('pension') || relPath.includes('wht') ||
      relPath.includes('cgt') || relPath.includes('uif') || relPath.includes('nhf') ||
      relPath.includes('stamp-duty') || relPath.includes('dividend') || relPath.includes('transfer-duty'))
    return 'FinanceApplication';
  if (relPath.includes('crypto') || relPath.includes('bitcoin'))
    return 'FinanceApplication';
  if (relPath.includes('mortgage') || relPath.includes('property') || relPath.includes('rent') ||
      relPath.includes('home-loan'))
    return 'FinanceApplication';
  if (relPath.includes('bmi') || relPath.includes('calorie') || relPath.includes('health') ||
      relPath.includes('blood') || relPath.includes('pregnancy') || relPath.includes('drug') ||
      relPath.includes('vaccine') || relPath.includes('malaria') || relPath.includes('sickle'))
    return 'HealthApplication';
  if (relPath.includes('gpa') || relPath.includes('waec') || relPath.includes('jamb') ||
      relPath.includes('school') || relPath.includes('study') || relPath.includes('ielts') ||
      relPath.includes('degree') || relPath.includes('flashcard') || relPath.includes('matric'))
    return 'EducationalApplication';
  if (relPath.includes('pdf') || relPath.includes('json') || relPath.includes('csv') ||
      relPath.includes('regex') || relPath.includes('sql') || relPath.includes('api') ||
      relPath.includes('hash') || relPath.includes('base64') || relPath.includes('uuid') ||
      relPath.includes('jwt') || relPath.includes('diff') || relPath.includes('cron') ||
      relPath.includes('htaccess') || relPath.includes('robots') || relPath.includes('sitemap') ||
      relPath.includes('meta-tag') || relPath.includes('html') || relPath.includes('css') ||
      relPath.includes('url') || relPath.includes('markdown') || relPath.includes('dev-tools'))
    return 'DeveloperApplication';
  if (relPath.includes('image') || relPath.includes('photo') || relPath.includes('logo') ||
      relPath.includes('flyer') || relPath.includes('thumbnail') || relPath.includes('meme') ||
      relPath.includes('color') || relPath.includes('colour') || relPath.includes('favicon') ||
      relPath.includes('watermark') || relPath.includes('background-remover') ||
      relPath.includes('certificate') || relPath.includes('social-card') || relPath.includes('qr'))
    return 'DesignApplication';
  if (relPath.includes('currency') || relPath.includes('forex') || relPath.includes('budget') ||
      relPath.includes('savings') || relPath.includes('loan') || relPath.includes('investment') ||
      relPath.includes('interest') || relPath.includes('inflation') || relPath.includes('break-even') ||
      relPath.includes('profit') || relPath.includes('invoice') || relPath.includes('receipt') ||
      relPath.includes('markup') || relPath.includes('discount') || relPath.includes('tip') ||
      relPath.includes('remittance') || relPath.includes('mobile-money') || relPath.includes('bank'))
    return 'FinanceApplication';
  return 'WebApplication';
}

function processFile(filePath) {
  let html = fs.readFileSync(filePath, 'utf-8');
  const rel = path.relative(ROOT, filePath).replace(/\\/g, '/');
  const lang = inferLang(filePath);

  // Skip if already has WebApplication
  if (html.includes('"@type":"WebApplication"') || html.includes('"@type": "WebApplication"')) {
    return { path: rel, status: 'already-has' };
  }

  // Must have WebPage schema to upgrade
  const webPagePattern = /(<script\s+type="application\/ld\+json">)\s*(\{[^<]*"@type"\s*:\s*"WebPage"[^<]*\})\s*(<\/script>)/i;
  const match = html.match(webPagePattern);
  if (!match) {
    return { path: rel, status: 'no-webpage-schema' };
  }

  try {
    const schema = JSON.parse(match[2]);
    const category = inferCategory(rel);

    // Build WebApplication schema
    const webAppSchema = {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: schema.name || '',
      description: schema.description || '',
      url: schema.url || '',
      inLanguage: lang,
      applicationCategory: category,
      operatingSystem: 'Web',
      browserRequirements: 'Requires JavaScript',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD'
      },
      author: {
        '@type': 'Organization',
        name: 'AfroTools',
        url: 'https://afrotools.com'
      }
    };

    if (FIX) {
      const newScript = `<script type="application/ld+json">\n${JSON.stringify(webAppSchema)}\n</script>`;
      // Insert WebApplication schema BEFORE the existing WebPage script (keep both)
      html = html.replace(match[0], newScript + '\n' + match[0]);
      fs.writeFileSync(filePath, html, 'utf-8');
    }

    return { path: rel, status: 'needs-fix', category };
  } catch (e) {
    return { path: rel, status: 'parse-error', error: e.message };
  }
}

// ── Collect tool pages ──────────────────────────────────────────────────────

const toolFiles = [];

// tools/ and crypto/ directories
for (const dir of TOOL_DIRS) {
  toolFiles.push(...walkHtml(path.join(ROOT, dir)));
  toolFiles.push(...walkHtml(path.join(ROOT, 'fr', dir)));
}

// Country PAYE/VAT pages
const countryDirs = fs.readdirSync(ROOT, { withFileTypes: true })
  .filter(d => d.isDirectory() && !['node_modules', '.git', 'assets', 'scripts', 'tools', 'crypto',
    'fr', 'sw', 'yo', 'ha', 'lang', 'data', 'supabase', 'netlify', '.netlify', '.claude',
    'docs', 'blog', 'widgets', 'engineering', 'admin', 'dashboard'].includes(d.name));

for (const dir of countryDirs) {
  const files = fs.readdirSync(path.join(ROOT, dir.name), { withFileTypes: true })
    .filter(f => f.isFile() && COUNTRY_TOOL_PATTERN.test('/' + dir.name + '/' + f.name));
  for (const f of files) {
    toolFiles.push(path.join(ROOT, dir.name, f.name));
  }
}

// French country PAYE/VAT
const frDir = path.join(ROOT, 'fr');
if (fs.existsSync(frDir)) {
  const frCountries = fs.readdirSync(frDir, { withFileTypes: true })
    .filter(d => d.isDirectory() && !['blog', 'tools', 'all-tools', 'categories', 'countries',
      'business', 'crypto', 'developers', 'ecommerce', 'finance', 'mortgage-property',
      'business-roi', 'data-productivity'].includes(d.name));
  for (const dir of frCountries) {
    const dirPath = path.join(frDir, dir.name);
    const files = fs.readdirSync(dirPath, { withFileTypes: true })
      .filter(f => f.isFile() && f.name.endsWith('.html'));
    for (const f of files) {
      toolFiles.push(path.join(dirPath, f.name));
    }
  }
}

// ── Process ─────────────────────────────────────────────────────────────────

const results = toolFiles.map(processFile);
const needsFix = results.filter(r => r.status === 'needs-fix');
const alreadyHas = results.filter(r => r.status === 'already-has');
const noSchema = results.filter(r => r.status === 'no-webpage-schema');
const parseErrors = results.filter(r => r.status === 'parse-error');

console.log('\n🔍 WebApplication Schema Report');
console.log('═'.repeat(60));
console.log(`📄 ${results.length} tool pages scanned`);
console.log(`✅ ${alreadyHas.length} already have WebApplication schema`);
console.log(`${FIX ? '🔧' : '⚠️ '} ${needsFix.length} pages ${FIX ? 'updated' : 'need WebApplication schema'}`);
if (noSchema.length > 0) console.log(`📝 ${noSchema.length} pages have no WebPage schema (skipped)`);
if (parseErrors.length > 0) console.log(`❌ ${parseErrors.length} parse errors`);

if (needsFix.length > 0) {
  // Category breakdown
  const cats = {};
  for (const r of needsFix) {
    cats[r.category] = (cats[r.category] || 0) + 1;
  }
  console.log('\nCategory breakdown:');
  for (const [cat, count] of Object.entries(cats).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(count).padStart(4)} × ${cat}`);
  }
}

if (!FIX && needsFix.length > 0) {
  console.log(`\nRun with --fix to apply.`);
} else if (FIX) {
  console.log(`\n✅ All changes applied.`);
}

console.log('');
