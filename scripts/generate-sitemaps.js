#!/usr/bin/env node
/**
 * generate-sitemaps.js
 * Scans all .html files, groups them into category sub-sitemaps,
 * and creates a sitemap-index.xml pointing to all of them.
 *
 * Usage: node scripts/generate-sitemaps.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BASE_URL = 'https://afrotools.com';
const TODAY = '2026-03-28';

// Directories/patterns to exclude entirely
const EXCLUDE_DIRS = new Set([
  'node_modules', '.netlify', 'scripts', 'admin', 'dashboard',
  '.git', '.claude', 'supabase', 'netlify', 'assets', 'engines',
  'lang', 'pro', 'sw'
]);

// Files to exclude
const EXCLUDE_PATTERNS = [
  /_template/i,
  /style-guide\.html$/i,
  /logo-system\.html$/i,
  /afrotools-mission-control\.html$/i,
  /mc-7a2f9x\.html$/i,
  /index_old\.html$/i,
  /^404\.html$/i,
];

/**
 * Recursively find all .html files
 */
function findHtmlFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (EXCLUDE_DIRS.has(entry.name)) continue;
      findHtmlFiles(fullPath, files);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      files.push(fullPath);
    }
  }
  return files;
}

/**
 * Convert file path to URL
 */
function fileToUrl(filePath) {
  let rel = path.relative(ROOT, filePath).replace(/\\/g, '/');

  // index.html -> directory URL
  if (rel.endsWith('/index.html')) {
    rel = rel.replace(/index\.html$/, '');
  } else if (rel === 'index.html') {
    rel = '';
  }
  // Other .html files keep extension but add trailing context
  // e.g. nigeria/ng-paye.html -> /nigeria/ng-paye.html

  return `${BASE_URL}/${rel}`;
}

/**
 * Determine which sub-sitemap a URL belongs to
 */
function categorize(relPath) {
  if (relPath.startsWith('agriculture/')) return 'agriculture';
  if (relPath.startsWith('blog/')) return 'blog';
  if (relPath.startsWith('tools/')) return 'tools';
  if (relPath.startsWith('fr/')) return 'fr';

  // Country pages: top-level dirs with paye/vat files or country index
  // Known country dirs — match /{country}/ pattern for known countries
  const countryDirs = [
    'algeria', 'angola', 'benin', 'botswana', 'burkina-faso', 'burundi',
    'cabo-verde', 'cameroon', 'cape-verde', 'car', 'central-african-republic',
    'chad', 'comoros', 'congo', 'cote-divoire', 'countries',
    'dr-congo', 'drc', 'djibouti', 'egypt', 'eq-guinea', 'equatorial-guinea',
    'eritrea', 'eswatini', 'ethiopia', 'gabon', 'gambia', 'ghana',
    'guinea', 'guinea-bissau', 'kenya', 'lesotho', 'liberia', 'libya',
    'madagascar', 'malawi', 'mali', 'mauritania', 'mauritius', 'morocco',
    'mozambique', 'namibia', 'niger', 'nigeria', 'rwanda',
    'sao-tome-and-principe', 'senegal', 'seychelles', 'sierra-leone',
    'somalia', 'south-africa', 'south-sudan', 'sudan', 'tanzania', 'togo',
    'tunisia', 'uganda', 'zambia', 'zimbabwe',
    // Regional hub pages
    'african', 'central-africa', 'east-africa', 'north-africa',
    'southern-africa', 'west-africa'
  ];

  const firstSegment = relPath.split('/')[0];
  if (countryDirs.includes(firstSegment)) return 'countries';

  return 'misc';
}

/**
 * Generate XML for a single sitemap
 */
function generateSitemap(urls) {
  const entries = urls.map(url =>
    `  <url>\n    <loc>${url}</loc>\n    <lastmod>${TODAY}</lastmod>\n  </url>`
  ).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>
`;
}

/**
 * Generate sitemap index XML
 */
function generateSitemapIndex(sitemapFiles) {
  const entries = sitemapFiles.map(file =>
    `  <sitemap>\n    <loc>${BASE_URL}/${file}</loc>\n    <lastmod>${TODAY}</lastmod>\n  </sitemap>`
  ).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</sitemapindex>
`;
}

// ── Main ──

const allFiles = findHtmlFiles(ROOT);

// Filter out excluded files
const filtered = allFiles.filter(f => {
  const rel = path.relative(ROOT, f).replace(/\\/g, '/');
  return !EXCLUDE_PATTERNS.some(p => p.test(rel));
});

// Group by category
const groups = {
  agriculture: [],
  countries: [],
  tools: [],
  blog: [],
  fr: [],
  misc: []
};

for (const filePath of filtered) {
  const rel = path.relative(ROOT, filePath).replace(/\\/g, '/');
  const cat = categorize(rel);
  groups[cat].push(fileToUrl(filePath));
}

// Sort URLs within each group
for (const cat of Object.keys(groups)) {
  groups[cat].sort();
}

// Write sub-sitemaps
const sitemapFileNames = [];
const categoryToFile = {
  agriculture: 'sitemap-agriculture.xml',
  countries: 'sitemap-countries.xml',
  tools: 'sitemap-tools.xml',
  blog: 'sitemap-blog.xml',
  fr: 'sitemap-fr.xml',
  misc: 'sitemap-misc.xml'
};

let totalUrls = 0;

for (const [cat, fileName] of Object.entries(categoryToFile)) {
  const urls = groups[cat];
  if (urls.length === 0) continue;

  const xml = generateSitemap(urls);
  const outPath = path.join(ROOT, fileName);
  fs.writeFileSync(outPath, xml, 'utf8');

  sitemapFileNames.push(fileName);
  totalUrls += urls.length;
  console.log(`  ${fileName}: ${urls.length} URLs`);
}

// Also include the existing hand-curated sitemaps
sitemapFileNames.push('sitemap-i18n.xml');
sitemapFileNames.push('sitemap-sw.xml');

// Write sitemap index
const indexXml = generateSitemapIndex(sitemapFileNames);
fs.writeFileSync(path.join(ROOT, 'sitemap-index.xml'), indexXml, 'utf8');

console.log(`\n  sitemap-index.xml: ${sitemapFileNames.length} sub-sitemaps`);
console.log(`  Total URLs across generated sitemaps: ${totalUrls}`);
console.log(`  (plus sitemap-i18n.xml and sitemap-sw.xml which are kept as-is)\n`);

// Keep existing sitemap.xml as a backup but don't delete it
// (it may be referenced by search engines already)
console.log('  Note: existing sitemap.xml left intact for backwards compatibility.');
console.log('  Done!');
