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
const { englishSourceForFrenchCarsParts } = require('./lib/french-cars-route-map');
const { writeFileSyncWithRetry } = require('./lib/safe-write');

const ROOT = path.resolve(__dirname, '..');
const BASE_URL = 'https://afrotools.com';
const TODAY = new Date().toISOString().slice(0, 10);
const EXTRA_SITEMAPS = ['sitemap-cars.xml', 'jamb/sitemap.xml'];
const AFROKITCHEN_MANIFEST_PATH = path.join(ROOT, 'tools', 'afrokitchen', 'seo-manifest.json');
const EXPLICIT_SITEMAP_HTML = [
  'api/docs/index.html',
  'widgets/index.html',
  'widgets/demo/index.html'
];
const REFRESH_LASTMOD = process.env.AFROTOOLS_REFRESH_SITEMAP_LASTMOD === '1';
const REDIRECTS_PATH = path.join(ROOT, '_redirects');

// Directories to exclude entirely (non-content)
const EXCLUDE_DIRS = new Set([
  'node_modules', '.netlify', 'scripts', 'admin', 'dashboard',
  '.git', '.github', '.claude', 'supabase', 'netlify', 'assets', 'engines',
  'dist', 'lang', 'pro', 'developers', 'data', 'tests', 'widgets', 'afrowork',
  'afrotools-sentinel', 'prompts', 'docs', 'audit-results', 'artifacts'
]);

const EXCLUDE_ROOT_DIRS = new Set([
  'cars',
  'jamb',
  'matchday-os'
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
  /tools\/vehicle-import-duty\/index\.html$/i,
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
    if (
      !/^sitemap.*\.xml$/i.test(name) ||
      name === 'sitemap-index.xml' ||
      name === 'sitemap.xml' ||
      name === 'sitemap-i18n.xml'
    ) {
      continue;
    }

    for (const [loc, lastmod] of readXmlLastmods(path.join(ROOT, name), 'url')) {
      if (!entries.has(loc)) entries.set(loc, lastmod);
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

function normalizeRedirectSource(value) {
  const route = String(value || '').trim().split(/[?#]/)[0];
  if (!route || !route.startsWith('/')) return '';
  if (route !== '/' && route.endsWith('/')) return route.replace(/\/+$/, '/');
  return route;
}

function loadRedirectExclusions() {
  const exact = new Set();
  const forcedWildcards = [];
  if (!fs.existsSync(REDIRECTS_PATH)) return { exact, forcedWildcards };

  const lines = fs.readFileSync(REDIRECTS_PATH, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const parts = trimmed.split(/\s+/);
    if (parts.length < 3) continue;

    const status = parts[2];
    if (!/^(?:301|302|307|308|410)!?$/.test(status)) continue;

    const source = normalizeRedirectSource(parts[0]);
    if (!source) continue;

    if (source.includes('*')) {
      if (status.endsWith('!')) {
        forcedWildcards.push(source.split('*')[0]);
      }
      continue;
    }

    if (!source.includes(':')) exact.add(source);
  }

  return { exact, forcedWildcards };
}

const REDIRECT_EXCLUSIONS = loadRedirectExclusions();

function isExplicitRedirectRoute(url) {
  let route;
  try {
    route = new URL(url).pathname;
  } catch {
    route = url;
  }

  if (REDIRECT_EXCLUSIONS.exact.has(route)) return true;
  return REDIRECT_EXCLUSIONS.forcedWildcards.some(prefix => route.startsWith(prefix));
}

function xmlEscape(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function asIsoDate(value) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

function maxDate(values) {
  return values.map(asIsoDate).filter(Boolean).sort().slice(-1)[0] || '';
}

function toAbsoluteSiteUrl(value) {
  const input = String(value || '').trim();
  if (!input) return '';
  if (/^https?:\/\//i.test(input)) return input;
  if (input.startsWith('/')) return `${BASE_URL}${input}`;
  return '';
}

function uniqueImages(images) {
  const seen = new Set();
  return images
    .map((image) => ({
      loc: toAbsoluteSiteUrl(image.loc || image.url || image.src || image),
      title: String(image.title || '').trim(),
      caption: String(image.caption || '').trim()
    }))
    .filter((image) => {
      if (!image.loc || seen.has(image.loc)) return false;
      seen.add(image.loc);
      return true;
    });
}

function loadAfroKitchenSitemapMetadata() {
  if (!fs.existsSync(AFROKITCHEN_MANIFEST_PATH)) return new Map();

  try {
    const manifest = JSON.parse(fs.readFileSync(AFROKITCHEN_MANIFEST_PATH, 'utf8'));
    const metadata = new Map();
    const recipeBySlug = new Map((manifest.recipes || []).map((recipe) => [recipe.slug, recipe]));
    const generatedRecipes = (manifest.recipes || []).filter((recipe) => recipe.generated_in_wave);

    for (const recipe of generatedRecipes) {
      metadata.set(recipe.route_url, {
        lastmod: normalizeSitemapLastmod(maxDate([recipe.updated_at, recipe.created_at]) || manifest.generated_at),
        images: uniqueImages([
          { loc: recipe.social_image || recipe.page_image || recipe.image_url, title: `${recipe.name} recipe from ${recipe.country_name}` }
        ])
      });
    }

    for (const country of manifest.countries || []) {
      const recipes = (country.generated_recipe_slugs || country.recipes || [])
        .map((entry) => (typeof entry === 'string' ? recipeBySlug.get(entry) : recipeBySlug.get(entry.slug)))
        .filter(Boolean);
      metadata.set(country.route_url, {
        lastmod: normalizeSitemapLastmod(maxDate(recipes.flatMap((recipe) => [recipe.updated_at, recipe.created_at])) || manifest.generated_at),
        images: uniqueImages([{ loc: `${BASE_URL}/assets/img/tools/afrokitchen.webp`, title: `${country.country_name} recipes` }])
      });
    }

    for (const collection of manifest.collections || []) {
      const recipes = (collection.generated_recipe_slugs || collection.recipes || [])
        .map((entry) => (typeof entry === 'string' ? recipeBySlug.get(entry) : recipeBySlug.get(entry.slug)))
        .filter(Boolean);
      metadata.set(collection.route_url, {
        lastmod: normalizeSitemapLastmod(maxDate(recipes.flatMap((recipe) => [recipe.updated_at, recipe.created_at])) || manifest.generated_at),
        images: uniqueImages([{ loc: toAbsoluteSiteUrl(collection.image_url) || `${BASE_URL}/assets/img/tools/afrokitchen.webp`, title: `${collection.name} recipe collection` }])
      });
    }

    metadata.set(`${BASE_URL}/tools/afrokitchen/`, {
      lastmod: asIsoDate(manifest.generated_at),
      images: uniqueImages([{ loc: `${BASE_URL}/assets/img/tools/afrokitchen.webp`, title: 'AfroKitchen African recipe atlas' }])
    });

    return metadata;
  } catch (error) {
    console.warn(`Unable to load AfroKitchen sitemap metadata: ${error.message}`);
    return new Map();
  }
}

const AFROKITCHEN_SITEMAP_METADATA = loadAfroKitchenSitemapMetadata();

/**
 * Recursively find all .html files
 */
function findHtmlFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const relDir = path.relative(ROOT, fullPath).replace(/\\/g, '/');
      if (EXCLUDE_ROOT_DIRS.has(relDir)) continue;
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

function extractMetaContent(html, propertyName) {
  const propertyPattern = new RegExp(
    `<meta\\b(?=[^>]*\\bproperty=["']${propertyName}["'])(?=[^>]*\\bcontent=["']([^"']+)["'])[^>]*>`,
    'i'
  );
  const namePattern = new RegExp(
    `<meta\\b(?=[^>]*\\bname=["']${propertyName}["'])(?=[^>]*\\bcontent=["']([^"']+)["'])[^>]*>`,
    'i'
  );
  const match = html.match(propertyPattern) || html.match(namePattern);
  return match ? match[1] : '';
}

function extractJsonLdImages(html) {
  const images = [];
  const scriptPattern = /<script\b([^>]*type=["']application\/ld\+json["'][^>]*)>([\s\S]*?)<\/script>/gi;
  let match;

  function collect(value) {
    if (!value) return;
    if (typeof value === 'string') {
      images.push({ loc: value });
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(collect);
      return;
    }
    if (typeof value === 'object') {
      if (value.url) images.push({ loc: value.url, title: value.name || '' });
      if (value.contentUrl) images.push({ loc: value.contentUrl, title: value.name || '' });
      if (value.image) collect(value.image);
    }
  }

  while ((match = scriptPattern.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[2].trim());
      const nodes = Array.isArray(parsed && parsed['@graph']) ? parsed['@graph'] : [parsed];
      nodes.forEach((node) => collect(node && node.image));
    } catch {
      // Ignore non-JSON or malformed schema blocks; page-level metadata still applies.
    }
  }

  return images;
}

function extractPageImages(html) {
  const ogImage = extractMetaContent(html, 'og:image');
  const twitterImage = extractMetaContent(html, 'twitter:image');
  const title = extractMetaContent(html, 'og:title') || extractMetaContent(html, 'twitter:title');
  return uniqueImages([
    { loc: ogImage, title },
    { loc: twitterImage, title },
    ...extractJsonLdImages(html)
  ]);
}

function isAfroKitchenUrl(url) {
  try {
    return new URL(url).pathname.startsWith('/tools/afrokitchen/');
  } catch {
    return false;
  }
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
  const manifestMetadata = AFROKITCHEN_SITEMAP_METADATA.get(url);
  const images = manifestMetadata && manifestMetadata.images && manifestMetadata.images.length
    ? manifestMetadata.images
    : isAfroKitchenUrl(url) ? extractPageImages(html) : [];

  return {
    url,
    normalizedKey: currentPath,
    lastmod: manifestMetadata && manifestMetadata.lastmod
      ? manifestMetadata.lastmod
      : stableSitemapLastmod(url, fs.statSync(filePath).mtime),
    images,
    exclude: redirectLike || canonicalMismatch || noindex || isExplicitRedirectRoute(url),
  };
}

/**
 * Determine which sub-sitemap a URL belongs to
 */
function categorize(relPath) {
  if (relPath.startsWith('sw/')) return 'sw';
  if (relPath.startsWith('ha/')) return 'ha';
  if (relPath.startsWith('yo/')) return 'yo';
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
  const hasImages = entriesByUrl.some(entry => Array.isArray(entry.images) && entry.images.length);
  const entries = entriesByUrl.map(entry => {
    const imageXml = (entry.images || []).map((image) => {
      const titleXml = image.title ? `\n      <image:title>${xmlEscape(image.title)}</image:title>` : '';
      const captionXml = image.caption ? `\n      <image:caption>${xmlEscape(image.caption)}</image:caption>` : '';
      return `    <image:image>\n      <image:loc>${xmlEscape(image.loc)}</image:loc>${titleXml}${captionXml}\n    </image:image>`;
    }).join('\n');

    return `  <url>\n    <loc>${xmlEscape(entry.url)}</loc>\n    <lastmod>${entry.lastmod}</lastmod>${imageXml ? `\n${imageXml}` : ''}\n  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"${hasImages ? '\n        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"' : ''}>
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
for (const rel of EXPLICIT_SITEMAP_HTML) {
  const fullPath = path.join(ROOT, rel);
  if (fs.existsSync(fullPath)) allFiles.push(fullPath);
}

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
  ha: [],
  yo: [],
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

function compareStableString(left, right) {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

// Deduplicate and sort URLs within each group
for (const cat of Object.keys(groups)) {
  groups[cat] = dedupeEntries(groups[cat]);
  groups[cat].sort((a, b) => compareStableString(a.url, b.url));
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
  ha: 'sitemap-ha.xml',
  yo: 'sitemap-yo.xml',
  misc: 'sitemap-misc.xml'
};

let totalUrls = 0;

for (const [cat, fileName] of Object.entries(categoryToFile)) {
  const urls = groups[cat];
  if (urls.length === 0) continue;

  const xml = generateSitemap(urls);
  const outPath = path.join(ROOT, fileName);
  writeFileSyncWithRetry(outPath, xml, 'utf8');

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

for (const frEntry of groups.fr) {
  let frPath;
  try { frPath = new URL(frEntry.url).pathname; } catch { frPath = frEntry.url; }
  if (!frPath.startsWith('/fr/cars')) continue;

  const parts = frPath.replace(/^\/fr\/cars\/?/, '').replace(/\/$/, '').split('/').filter(Boolean);
  const enSource = englishSourceForFrenchCarsParts(parts);
  const enPath = `/${enSource}/`;
  const enFile = path.join(ROOT, enSource, 'index.html');
  if (!fs.existsSync(enFile)) continue;

  const lastmod = [frEntry.lastmod, stableSitemapLastmod(`${BASE_URL}${enPath}`, fs.statSync(enFile).mtime)]
    .filter(Boolean)
    .sort()
    .slice(-1)[0] || TODAY;
  i18nEntries.push({ langs: { en: enPath, fr: frPath }, lastmod });
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

  writeFileSyncWithRetry(path.join(ROOT, 'sitemap-i18n.xml'), i18nXml, 'utf8');
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
writeFileSyncWithRetry(path.join(ROOT, 'sitemap-index.xml'), indexXml, 'utf8');

// Replace sitemap.xml with the index — crawlers check both /sitemap.xml and /sitemap-index.xml
writeFileSyncWithRetry(path.join(ROOT, 'sitemap.xml'), indexXml, 'utf8');

console.log(`\n  sitemap-index.xml: ${sitemapFileNames.length} sub-sitemaps`);
console.log(`  sitemap.xml: replaced with sitemap index (was broken — had dupes & bad URLs)`);
console.log(`  Total unique URLs: ${totalUrls}`);
console.log('  Done!');
