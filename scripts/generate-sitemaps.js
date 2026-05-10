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

const { fileToPublicRoute } = require('./lib/canonical-aliases');

const ROOT = path.resolve(__dirname, '..');
const BASE_URL = 'https://afrotools.com';
const TODAY = new Date().toISOString().slice(0, 10);
const EXTRA_SITEMAPS = ['sitemap-cars.xml', 'jamb/sitemap.xml'];
const REFRESH_LASTMOD = process.env.AFROTOOLS_REFRESH_SITEMAP_LASTMOD === '1';

// Directories to exclude entirely (non-content)
const EXCLUDE_DIRS = new Set([
  'node_modules', '.netlify', 'scripts', 'admin', 'dashboard',
  '.git', '.github', '.claude', 'supabase', 'netlify', 'assets', 'engines',
  'dist', 'lang', 'pro', 'developers', 'data', 'tests', 'widgets', 'afrowork',
  'afrotools-sentinel', 'prompts', 'docs', 'cars', 'jamb'
]);

// Files to exclude
const EXCLUDE_PATTERNS = [
  /_template/i,
  /style-guide\.html$/i,
  /logo-system\.html$/i,
  /afrotools-mission-control\.html$/i,
  /fr\/widgets\/iframe\/template\.html$/i,
  /mc-7a2f9x\.html$/i,
  /tools\/afrostream\/admin\.html$/i,
  /widgets\/iframe\/template\.html$/i,
  /index_old\.html$/i,
  /^404\.html$/i,
];

function readXmlLastmods(filePath, blockTag) {
  if (!fs.existsSync(filePath)) return new Map();

  const content = fs.readFileSync(filePath, 'utf8');
  const pattern = new RegExp(
    `<${blockTag}>[\\s\\S]*?<loc>([^<]+)<\\/loc>[\\s\\S]*?<lastmod>(\\d{4}-\\d{2}-\\d{2})<\\/lastmod>[\\s\\S]*?<\\/${blockTag}>`,
    'g'
  );
  const entries = new Map();
  let match;

  while ((match = pattern.exec(content)) !== null) {
    entries.set(match[1], match[2]);
  }

  return entries;
}

function readExistingUrlLastmods() {
  const entries = new Map();
  for (const name of fs.readdirSync(ROOT)) {
    if (!/^sitemap.*\.xml$/i.test(name) || name === 'sitemap-index.xml') continue;

    for (const [loc, lastmod] of readXmlLastmods(path.join(ROOT, name), 'url')) {
      entries.set(loc, lastmod);
    }
  }

  const jambSitemap = path.join(ROOT, 'jamb', 'sitemap.xml');
  for (const [loc, lastmod] of readXmlLastmods(jambSitemap, 'url')) {
    entries.set(loc, lastmod);
  }

  return entries;
}

const EXISTING_URL_LASTMODS = readExistingUrlLastmods();
const EXISTING_INDEX_LASTMODS = readXmlLastmods(path.join(ROOT, 'sitemap-index.xml'), 'sitemap');

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
  return `${BASE_URL}${fileToPublicRoute(filePath)}`;
}

function formatDate(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function normalizeSitemapLastmod(date) {
  const formatted = formatDate(date);
  const ageMs = Date.now() - new Date(formatted).getTime();
  const ageDays = ageMs / 86400000;
  return ageDays > 7 ? TODAY : formatted;
}

function stableSitemapLastmod(loc, fallbackDate) {
  if (!REFRESH_LASTMOD && EXISTING_URL_LASTMODS.has(loc)) {
    return EXISTING_URL_LASTMODS.get(loc);
  }

  return normalizeSitemapLastmod(fallbackDate);
}

function extractCanonicalHref(html) {
  const match =
    html.match(/<link\b(?=[^>]*\brel=["']canonical["'])(?=[^>]*\bhref=["']([^"']+)["'])[^>]*>/i) ||
    html.match(/<link\b(?=[^>]*\bhref=["']([^"']+)["'])(?=[^>]*\brel=["']canonical["'])[^>]*>/i);

  return match ? match[1] : null;
}

function hasNoindex(html) {
  const robotsMatch =
    html.match(/<meta\b(?=[^>]*\bname=["']robots["'])[^>]*\bcontent=["']([^"']+)["'][^>]*>/i) ||
    html.match(/<meta\b(?=[^>]*\bcontent=["']([^"']+)["'])[^>]*\bname=["']robots["'][^>]*>/i);

  return Boolean(robotsMatch && /\bnoindex\b/i.test(robotsMatch[1]));
}

function normalizePathForCompare(value) {
  if (!value) return '/';
  const stripped = value.replace(BASE_URL, '').replace(/\/$/, '');
  return stripped || '/';
}

function inspectHtmlFile(filePath) {
  const html = fs.readFileSync(filePath, 'utf8');
  const url = fileToUrl(filePath);
  const currentPath = normalizePathForCompare(new URL(url).pathname);
  const canonicalHref = extractCanonicalHref(html);
  let canonicalPath = null;

  if (canonicalHref) {
    try {
      const canonicalUrl = new URL(canonicalHref, BASE_URL);
      if (canonicalUrl.origin === BASE_URL) {
        canonicalPath = normalizePathForCompare(canonicalUrl.pathname);
      }
    } catch {
      canonicalPath = normalizePathForCompare(canonicalHref);
    }
  }

  const headEnd = html.search(/<\/head>/i);
  const snippet = headEnd === -1 ? html.slice(0, 2500) : html.slice(0, headEnd + 7);
  const redirectLike =
    /<meta[^>]+http-equiv=["']refresh["']/i.test(html) ||
    /window\.location\.replace\(\s*['"][^'"]+['"]\s*\)/i.test(snippet) ||
    /location\.replace\(\s*['"][^'"]+['"]\s*\)/i.test(snippet) ||
    /window\.location(?:\.href)?\s*=\s*['"][^'"]+['"]/i.test(snippet) ||
    /location\.href\s*=\s*['"][^'"]+['"]/i.test(snippet);
  const noindex = hasNoindex(html);
  const canonicalMismatch = canonicalPath && canonicalPath !== currentPath;

  return {
    url,
    normalizedKey: currentPath,
    lastmod: stableSitemapLastmod(url, fs.statSync(filePath).mtime),
    exclude: redirectLike || canonicalMismatch || noindex,
  };
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
function generateSitemap(entriesByUrl) {
  const entries = entriesByUrl.map(entry =>
    `  <url>\n    <loc>${entry.url}</loc>\n    <lastmod>${entry.lastmod}</lastmod>\n  </url>`
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
    `  <sitemap>\n    <loc>${BASE_URL}/${file.file}</loc>\n    <lastmod>${file.lastmod}</lastmod>\n  </sitemap>`
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
  const page = inspectHtmlFile(filePath);
  if (page.exclude) continue;
  groups[cat].push(page);
}

function dedupeEntries(entries) {
  const byUrl = new Map();
  for (const entry of entries) {
    const key = entry.normalizedKey || entry.url;
    const existing = byUrl.get(key);

    if (!existing) {
      byUrl.set(key, entry);
      continue;
    }

    const preferCurrent =
      (existing.url.endsWith('/') && !entry.url.endsWith('/')) ||
      (existing.url.endsWith('/') === entry.url.endsWith('/') && entry.lastmod > existing.lastmod);

    if (preferCurrent) {
      byUrl.set(key, entry);
    }
  }
  return [...byUrl.values()];
}

// Deduplicate and sort URLs within each group
for (const cat of Object.keys(groups)) {
  groups[cat] = dedupeEntries(groups[cat]);
  groups[cat].sort((a, b) => a.url.localeCompare(b.url));
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

  const lastmod = urls.reduce((latest, entry) => entry.lastmod > latest ? entry.lastmod : latest, urls[0].lastmod);
  sitemapFileNames.push({ file: fileName, lastmod });
  totalUrls += urls.length;
  console.log(`  ${fileName}: ${urls.length} URLs`);
}

// ── Generate sitemap-i18n.xml with hreflang cross-references ──
// Match EN pages to their FR/SW equivalents by path pattern
const enUrls = [...groups.agriculture, ...groups.countries, ...groups.tools,
                ...groups.blog, ...groups.misc];
const frUrlMap = new Map(groups.fr.map(entry => {
  try { return [new URL(entry.url).pathname, entry.lastmod]; } catch { return [entry.url, entry.lastmod]; }
}));
const swUrlMap = new Map(groups.sw.map(entry => {
  try { return [new URL(entry.url).pathname, entry.lastmod]; } catch { return [entry.url, entry.lastmod]; }
}));

const i18nEntries = [];
for (const enUrl of enUrls) {
  let enPath;
  try { enPath = new URL(enUrl.url).pathname; } catch { enPath = enUrl.url; }

  const frPath = '/fr' + enPath;
  const swPath = '/sw' + enPath;
  const hasFr = frUrlMap.has(frPath);
  const hasSw = swUrlMap.has(swPath);

  if (hasFr || hasSw) {
    const langs = { en: enPath };
    if (hasFr) langs.fr = frPath;
    if (hasSw) langs.sw = swPath;
    const lastmod = [enUrl.lastmod, frUrlMap.get(frPath), swUrlMap.get(swPath)]
      .filter(Boolean)
      .sort()
      .slice(-1)[0] || TODAY;
    i18nEntries.push({ langs, lastmod });
  }
}

if (i18nEntries.length > 0) {
  let i18nXml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  i18nXml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
  i18nXml += '        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';

  for (const entry of i18nEntries) {
    const langs = entry.langs;
    for (const [lang, urlPath] of Object.entries(langs)) {
      i18nXml += '  <url>\n';
      i18nXml += `    <loc>${BASE_URL}${urlPath}</loc>\n`;
      i18nXml += `    <lastmod>${entry.lastmod}</lastmod>\n`;
      for (const [hl, hp] of Object.entries(langs)) {
        i18nXml += `    <xhtml:link rel="alternate" hreflang="${hl}" href="${BASE_URL}${hp}" />\n`;
      }
      i18nXml += `    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE_URL}${langs.en}" />\n`;
      i18nXml += '  </url>\n';
    }
  }
  i18nXml += '</urlset>\n';

  fs.writeFileSync(path.join(ROOT, 'sitemap-i18n.xml'), i18nXml, 'utf8');
  const i18nLastmod = i18nEntries.reduce((latest, entry) => entry.lastmod > latest ? entry.lastmod : latest, i18nEntries[0].lastmod);
  sitemapFileNames.push({ file: 'sitemap-i18n.xml', lastmod: i18nLastmod });
  const i18nCount = (i18nXml.match(/<url>/g) || []).length;
  console.log(`  sitemap-i18n.xml: ${i18nCount} hreflang entries (${i18nEntries.length} page pairs)`);
}

for (const extraFile of EXTRA_SITEMAPS) {
  const fullPath = path.join(ROOT, extraFile);
  if (!fs.existsSync(fullPath)) continue;

  const file = extraFile.replace(/\\/g, '/');
  const loc = `${BASE_URL}/${file}`;
  sitemapFileNames.push({
    file,
    lastmod: !REFRESH_LASTMOD && EXISTING_INDEX_LASTMODS.has(loc)
      ? EXISTING_INDEX_LASTMODS.get(loc)
      : normalizeSitemapLastmod(fs.statSync(fullPath).mtime),
  });
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
