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
const TODAY = new Date().toISOString().slice(0, 10);

// Directories to exclude entirely (non-content)
const EXCLUDE_DIRS = new Set([
  'node_modules', '.netlify', 'scripts', 'admin', 'dashboard',
  '.git', '.github', '.claude', 'supabase', 'netlify', 'assets', 'engines',
  'lang', 'pro', 'developers', 'data', 'tests', 'widgets', 'afrowork',
  'afrotools-sentinel', 'prompts', 'docs'
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
  if (relPath.startsWith('sw/')) return 'sw';
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
    'sao-tome', 'sao-tome-and-principe', 'senegal', 'seychelles', 'sierra-leone',
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
  sw: [],
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
  sw: 'sitemap-sw.xml',
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

// ── Generate sitemap-i18n.xml with hreflang cross-references ──
// Match EN pages to their FR/SW equivalents by path pattern
const enUrls = [...groups.agriculture, ...groups.countries, ...groups.tools,
                ...groups.blog, ...groups.misc];
const frUrlSet = new Set(groups.fr.map(u => {
  try { return new URL(u).pathname; } catch { return u; }
}));
const swUrlSet = new Set(groups.sw.map(u => {
  try { return new URL(u).pathname; } catch { return u; }
}));

const i18nEntries = [];
for (const enUrl of enUrls) {
  let enPath;
  try { enPath = new URL(enUrl).pathname; } catch { enPath = enUrl; }

  const frPath = '/fr' + enPath;
  const swPath = '/sw' + enPath;
  const hasFr = frUrlSet.has(frPath);
  const hasSw = swUrlSet.has(swPath);

  if (hasFr || hasSw) {
    const langs = { en: enPath };
    if (hasFr) langs.fr = frPath;
    if (hasSw) langs.sw = swPath;
    i18nEntries.push(langs);
  }
}

if (i18nEntries.length > 0) {
  let i18nXml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  i18nXml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
  i18nXml += '        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';

  for (const langs of i18nEntries) {
    for (const [lang, urlPath] of Object.entries(langs)) {
      i18nXml += '  <url>\n';
      i18nXml += `    <loc>${BASE_URL}${urlPath}</loc>\n`;
      i18nXml += `    <lastmod>${TODAY}</lastmod>\n`;
      for (const [hl, hp] of Object.entries(langs)) {
        i18nXml += `    <xhtml:link rel="alternate" hreflang="${hl}" href="${BASE_URL}${hp}" />\n`;
      }
      i18nXml += `    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE_URL}${langs.en}" />\n`;
      i18nXml += '  </url>\n';
    }
  }
  i18nXml += '</urlset>\n';

  fs.writeFileSync(path.join(ROOT, 'sitemap-i18n.xml'), i18nXml, 'utf8');
  sitemapFileNames.push('sitemap-i18n.xml');
  const i18nCount = (i18nXml.match(/<url>/g) || []).length;
  console.log(`  sitemap-i18n.xml: ${i18nCount} hreflang entries (${i18nEntries.length} page pairs)`);
}

// Write sitemap index
const indexXml = generateSitemapIndex(sitemapFileNames);
fs.writeFileSync(path.join(ROOT, 'sitemap-index.xml'), indexXml, 'utf8');

// Replace sitemap.xml with the index — crawlers check both /sitemap.xml and /sitemap-index.xml
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), indexXml, 'utf8');

console.log(`\n  sitemap-index.xml: ${sitemapFileNames.length} sub-sitemaps`);
console.log(`  sitemap.xml: replaced with sitemap index (was broken — had dupes & bad URLs)`);
console.log(`  Total unique URLs: ${totalUrls}`);
console.log('  Done!');
