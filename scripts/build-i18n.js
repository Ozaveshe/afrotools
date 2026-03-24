#!/usr/bin/env node
/**
 * AFROTOOLS — i18n Build Script
 * ===================================================================
 * Generates static multilingual HTML pages from English source files
 * and JSON translation files.
 *
 * Usage:
 *   node scripts/build-i18n.js --all            # Build all languages
 *   node scripts/build-i18n.js --lang fr         # Build specific language
 *   node scripts/build-i18n.js --page ghana/gh-paye  # Build specific page in all languages
 *   node scripts/build-i18n.js --dry-run         # Report missing translations
 *   node scripts/build-i18n.js --validate        # Validate JSON files for missing keys
 *
 * Output: /<lang>/path/to/page/index.html for each language variant
 * ===================================================================
 */

const fs = require('fs');
const path = require('path');

// ── CONFIG ──────────────────────────────────────────────────────────

const ROOT = path.join(__dirname, '..');
const LANG_DIR = path.join(ROOT, 'lang');
const SITE_URL = 'https://afrotools.com';
const SUPPORTED_LANGS = ['fr', 'sw', 'yo', 'ha'];
const DEFAULT_LANG = 'en';
const ALL_LANGS = [DEFAULT_LANG, ...SUPPORTED_LANGS];

// Pages to process (relative to ROOT, without .html extension or trailing slash)
// These are the source English pages
const PAGES_TO_BUILD = [];

// Directories/files to skip when scanning for pages
const SKIP_DIRS = new Set([
  'node_modules', '.git', '.claude', 'scripts', 'netlify', 'lang', 'assets',
  'dist', 'fr', 'sw', 'yo', 'ha', 'docs', 'tests', '.github', '.vscode',
  'admin', 'dashboard', 'pro'
]);

const SKIP_FILES = new Set([
  'offline.html', 'afrotools-mission-control.html', 'style-guide.html',
  'logo-system.html', '404.html', 'robots.txt', 'sitemap.xml', 'sitemap-i18n.xml'
]);

// ── PARSE CLI ARGS ──────────────────────────────────────────────────

const args = process.argv.slice(2);
const flags = {
  all: args.includes('--all'),
  lang: null,
  page: null,
  dryRun: args.includes('--dry-run'),
  validate: args.includes('--validate'),
};

const langIdx = args.indexOf('--lang');
if (langIdx !== -1 && args[langIdx + 1]) {
  flags.lang = args[langIdx + 1];
}

const pageIdx = args.indexOf('--page');
if (pageIdx !== -1 && args[pageIdx + 1] !== undefined) {
  flags.page = args[pageIdx + 1];
}

// ── LOAD TRANSLATIONS ───────────────────────────────────────────────

function loadJSON(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    console.error(`Error loading ${filePath}: ${e.message}`);
    return null;
  }
}

function flattenObj(obj, prefix = '') {
  const result = {};
  for (const [key, val] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      Object.assign(result, flattenObj(val, fullKey));
    } else {
      result[fullKey] = val;
    }
  }
  return result;
}

// Load all translation files
const translations = {};
for (const lang of ALL_LANGS) {
  const globalFile = path.join(LANG_DIR, `${lang}.json`);
  if (fs.existsSync(globalFile)) {
    translations[lang] = loadJSON(globalFile);
    if (translations[lang]) {
      translations[lang]._flat = flattenObj(translations[lang]);
    }
  } else {
    console.warn(`WARNING: Missing translation file: ${globalFile}`);
  }
}

// ── VALIDATE MODE ───────────────────────────────────────────────────

if (flags.validate) {
  console.log('\n=== Translation Validation ===\n');
  const enFlat = translations.en?._flat || {};
  const enKeys = Object.keys(enFlat).filter(k => !k.startsWith('_'));
  let hasErrors = false;

  for (const lang of SUPPORTED_LANGS) {
    const langFlat = translations[lang]?._flat || {};
    const langKeys = Object.keys(langFlat).filter(k => !k.startsWith('_'));

    const missing = enKeys.filter(k => !(k in langFlat));
    const extra = langKeys.filter(k => !(k in enFlat));

    if (missing.length > 0) {
      hasErrors = true;
      console.log(`[${lang}] Missing ${missing.length} keys:`);
      missing.forEach(k => console.log(`  - ${k}`));
    }
    if (extra.length > 0) {
      console.log(`[${lang}] Extra ${extra.length} keys (not in en.json):`);
      extra.forEach(k => console.log(`  + ${k}`));
    }
    if (missing.length === 0 && extra.length === 0) {
      console.log(`[${lang}] ✓ All keys match en.json`);
    }
    console.log('');
  }

  process.exit(hasErrors ? 1 : 0);
}

// ── DISCOVER PAGES ──────────────────────────────────────────────────

function discoverPages(dir, basePath = '') {
  const pages = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      pages.push(...discoverPages(path.join(dir, entry.name), `${basePath}${entry.name}/`));
    } else if (entry.name.endsWith('.html') && !SKIP_FILES.has(entry.name)) {
      // For index.html, use the directory path; for other .html, use filename without extension
      if (entry.name === 'index.html') {
        pages.push(basePath || '/');
      } else {
        pages.push(`${basePath}${entry.name.replace('.html', '')}`);
      }
    }
  }
  return pages;
}

let pagesToProcess;
if (flags.page) {
  pagesToProcess = [flags.page.replace(/^\//, '').replace(/\/$/, '')];
} else {
  pagesToProcess = discoverPages(ROOT);
}

// ── RESOLVE SOURCE FILE ─────────────────────────────────────────────

function resolveSourceFile(pagePath) {
  // pagePath like "ghana/gh-paye" or "blog/average-salary-kenya-2026/" or ""
  const clean = pagePath.replace(/^\//, '').replace(/\/$/, '');

  if (clean === '' || clean === '/') {
    return path.join(ROOT, 'index.html');
  }

  // Try index.html in directory first
  const indexPath = path.join(ROOT, clean, 'index.html');
  if (fs.existsSync(indexPath)) return indexPath;

  // Try .html extension
  const htmlPath = path.join(ROOT, clean + '.html');
  if (fs.existsSync(htmlPath)) return htmlPath;

  // Try as-is
  if (fs.existsSync(path.join(ROOT, clean)) && fs.statSync(path.join(ROOT, clean)).isFile()) {
    return path.join(ROOT, clean);
  }

  return null;
}

// ── GET TRANSLATION VALUE ───────────────────────────────────────────

function getTranslation(lang, key, fallbackLang = DEFAULT_LANG) {
  // Try the target language first
  const langFlat = translations[lang]?._flat;
  if (langFlat && key in langFlat) return langFlat[key];

  // Fallback to English
  const enFlat = translations[fallbackLang]?._flat;
  if (enFlat && key in enFlat) return enFlat[key];

  return null;
}

// ── LOAD PAGE-SPECIFIC TRANSLATIONS ─────────────────────────────────

function loadPageTranslations(pagePath, lang) {
  const clean = pagePath.replace(/^\//, '').replace(/\/$/, '');
  const pageJsonDir = path.join(LANG_DIR, 'pages', clean);
  const pageJsonFile = path.join(pageJsonDir, `${lang}.json`);

  if (fs.existsSync(pageJsonFile)) {
    const pageData = loadJSON(pageJsonFile);
    if (pageData) return flattenObj(pageData);
  }
  return {};
}

// ── CHECK WHICH PAGES HAVE TRANSLATIONS ─────────────────────────────

function hasPageTranslation(pagePath, lang) {
  const clean = pagePath.replace(/^\//, '').replace(/\/$/, '');
  const pageJsonFile = path.join(LANG_DIR, 'pages', clean, `${lang}.json`);
  return fs.existsSync(pageJsonFile);
}

// Build a map: lang -> Set of page paths that have translations
const translatedPages = {};
for (const lang of SUPPORTED_LANGS) {
  translatedPages[lang] = new Set();
}

function discoverTranslatedPages() {
  const pagesDir = path.join(LANG_DIR, 'pages');
  if (!fs.existsSync(pagesDir)) return;

  const walk = (dir, basePath = '') => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        walk(path.join(dir, entry.name), basePath ? `${basePath}/${entry.name}` : entry.name);
      } else if (entry.name.endsWith('.json') && entry.name !== 'en.json') {
        const lang = entry.name.replace('.json', '');
        if (translatedPages[lang]) {
          translatedPages[lang].add(basePath);
        }
      }
    }
  };
  walk(pagesDir);

  for (const lang of SUPPORTED_LANGS) {
    if (translatedPages[lang].size > 0) {
      console.log(`[${lang}] ${translatedPages[lang].size} pages with translations`);
    }
  }
}

discoverTranslatedPages();

// ── DISCOVER EXISTING FRENCH PAGES ──────────────────────────────────
// These are hand-crafted French pages that predate the build system.
// We map each to its English equivalent so hreflang/sitemap can reference them.

const COUNTRY_FR_TO_EN = {
  'algerie': 'algeria', 'cameroun': 'cameroon', 'maroc': 'morocco',
  'tunisie': 'tunisia', 'guinee': 'guinea', 'rdc': 'drc',
  'dr-congo': 'drc', 'car': 'central-african-republic',
  'eq-guinea': 'equatorial-guinea', 'cabo-verde': 'cape-verde',
};

const PAYE_SLUG_MAP = {
  'algerie':'algeria/dz-paye','burkina-faso':'burkina-faso/bf-paye',
  'cameroun':'cameroon/cm-paye','congo':'congo/cg-paye',
  'cote-divoire':'cote-divoire/ci-paye','gabon':'gabon/ga-paye',
  'guinee':'guinea/gn-paye','mali':'mali/ml-paye','maroc':'morocco/ma-paye',
  'niger':'niger/ne-paye','rdc':'drc','senegal':'senegal/sn-paye',
  'togo':'togo/tg-paye','tunisie':'tunisia/tn-paye',
};

const VAT_SLUG_MAP = {
  'algerie':'algeria/dz-vat','burkina-faso':'burkina-faso/bf-vat',
  'cameroun':'cameroon/cm-vat','congo':'congo/cg-vat',
  'cote-divoire':'cote-divoire/ci-vat','gabon':'gabon/ga-vat',
  'guinee':'guinea/gn-vat','mali':'mali/ml-vat','maroc':'morocco/ma-vat',
  'niger':'niger/ne-vat','rdc':'drc','senegal':'senegal/sn-vat',
  'togo':'togo/tg-vat','tunisie':'tunisia/tn-vat',
};

// existingFrPages: Map<enPagePath, frUrl>
// Maps English page path -> French URL for existing hand-crafted pages
const existingFrPages = new Map();
// Also: frUrl -> enPagePath for reverse lookup
const existingFrToEn = new Map();

function discoverExistingFrPages() {
  const frDir = path.join(ROOT, 'fr');
  if (!fs.existsSync(frDir)) return;

  const walkFr = (dir, base) => {
    fs.readdirSync(dir, { withFileTypes: true }).forEach(e => {
      const rel = base ? base + '/' + e.name : e.name;
      if (e.isDirectory()) walkFr(path.join(dir, e.name), rel);
      else if (e.name.endsWith('.html')) {
        const parts = rel.split('/');
        const country = parts[0];
        const fileBase = parts.length >= 2 ? parts[1].replace('.html', '') : null;
        let enPage = null;

        // French tool slugs -> English equivalents
        if (fileBase === 'calculateur-salaire-net' && PAYE_SLUG_MAP[country]) {
          enPage = PAYE_SLUG_MAP[country];
        } else if (fileBase === 'calculateur-tva' && VAT_SLUG_MAP[country]) {
          enPage = VAT_SLUG_MAP[country];
        }
        // Country slug mapping for index.html
        else if (COUNTRY_FR_TO_EN[country]) {
          const rest = parts.slice(1).join('/');
          enPage = COUNTRY_FR_TO_EN[country] + (rest ? '/' + rest.replace('.html', '').replace(/\/index$/, '') : '');
        }
        // Direct match (same path in English)
        else {
          enPage = rel.replace('.html', '').replace(/\/index$/, '');
        }
        // Dir-style index: /fr/XX/tool/index.html -> XX/tool
        if (parts.length === 3 && parts[2] === 'index.html') {
          const enCountry = COUNTRY_FR_TO_EN[country] || country;
          enPage = enCountry + '/' + parts[1];
        }

        // Clean enPage
        if (enPage) {
          enPage = enPage.replace(/\/+$/, '').replace(/^\//, '');
        }

        // Build French URL
        let frUrl = '/fr/' + rel.replace(/\.html$/, '').replace(/\/index$/, '');
        if (!frUrl.endsWith('/')) frUrl += '/';

        // Verify English source exists
        const enExists = enPage && resolveSourceFile(enPage);

        if (enPage && enExists) {
          existingFrPages.set(enPage, SITE_URL + frUrl);
          existingFrToEn.set(frUrl, enPage);
        } else {
          // French-only page (no English equiv) — still track for sitemap
          existingFrPages.set('_fronly_' + rel, SITE_URL + frUrl);
        }
      }
    });
  };

  walkFr(frDir, '');
  console.log(`[existing-fr] ${existingFrPages.size} existing French pages mapped`);
}

discoverExistingFrPages();

// Get which languages have a translation for a given page path
// Now considers both page-specific JSON files AND existing hand-crafted French pages
function getAvailableLangs(pagePath) {
  const clean = pagePath.replace(/^\//, '').replace(/\/$/, '');
  const langs = [DEFAULT_LANG]; // English always available
  for (const lang of SUPPORTED_LANGS) {
    if (translatedPages[lang].has(clean)) {
      langs.push(lang);
    }
    // Also check existing hand-crafted pages (currently only French)
    if (lang === 'fr' && existingFrPages.has(clean) && !langs.includes('fr')) {
      langs.push('fr');
    }
  }
  return langs;
}

// Get the actual French URL for a page (may differ from generated URL pattern)
function getFrenchUrl(pagePath) {
  const clean = pagePath.replace(/^\//, '').replace(/\/$/, '');
  // If there's an existing hand-crafted French page, use its URL
  if (existingFrPages.has(clean)) {
    return existingFrPages.get(clean);
  }
  // Otherwise use the standard generated URL
  return buildLangUrl(pagePath, 'fr');
}

// ── BUILD URL FOR LANGUAGE ──────────────────────────────────────────

function buildLangUrl(pagePath, lang) {
  let clean = pagePath.replace(/^\//, '').replace(/\/$/, '');
  // Treat index.html as root
  if (clean === 'index.html') clean = '';

  if (lang === DEFAULT_LANG) {
    if (clean === '') return `${SITE_URL}/`;
    return `${SITE_URL}/${clean}/`;
  }

  if (clean === '') return `${SITE_URL}/${lang}/`;
  return `${SITE_URL}/${lang}/${clean}/`;
}

// ── BUILD OUTPUT PATH ───────────────────────────────────────────────

function buildOutputPath(pagePath, lang) {
  const clean = pagePath.replace(/^\//, '').replace(/\/$/, '');

  if (clean === '' || clean === 'index.html') {
    return path.join(ROOT, lang, 'index.html');
  }

  // Check if the output path would conflict with an existing file
  // (e.g., /fr/algerie/ exists as a directory, but /fr/index.html exists as a file)
  const dirPath = path.join(ROOT, lang, clean);
  if (fs.existsSync(dirPath) && fs.statSync(dirPath).isFile()) {
    // Can't create a directory here — output to adjacent path
    return path.join(ROOT, lang, clean.replace(/\.html$/, ''), 'index.html');
  }

  // If the source was a .html file (not index.html), output to same structure
  const sourcePath = resolveSourceFile(pagePath);
  if (sourcePath && !sourcePath.endsWith('index.html') && sourcePath.endsWith('.html')) {
    // Output as /lang/dir/filename.html to match source structure
    return path.join(ROOT, lang, clean + '.html');
  }

  // Default: output as /lang/path/index.html for clean URLs
  return path.join(ROOT, lang, clean, 'index.html');
}

// ── GENERATE HREFLANG TAGS ──────────────────────────────────────────

function generateHreflangTags(pagePath, activeLangs) {
  const tags = [];

  for (const lang of activeLangs) {
    // For French, use existing hand-crafted URL if available
    const url = (lang === 'fr') ? getFrenchUrl(pagePath) : buildLangUrl(pagePath, lang);
    tags.push(`<link rel="alternate" hreflang="${lang}" href="${url}" />`);
  }

  // x-default always points to English
  const defaultUrl = buildLangUrl(pagePath, DEFAULT_LANG);
  tags.push(`<link rel="alternate" hreflang="x-default" href="${defaultUrl}" />`);

  return tags.join('\n');
}

// ── PROCESS HTML ────────────────────────────────────────────────────

const missingKeys = new Map(); // lang -> Set of missing keys

function processHTML(html, lang, pagePath) {
  let processed = html;
  const pageTranslations = loadPageTranslations(pagePath, lang);

  // Helper to get translation with page-specific override
  function t(key) {
    if (key in pageTranslations) return pageTranslations[key];
    const val = getTranslation(lang, key);
    if (val === null) {
      if (!missingKeys.has(lang)) missingKeys.set(lang, new Set());
      missingKeys.get(lang).add(key);
      // Fallback to English
      return getTranslation(DEFAULT_LANG, key) || '';
    }
    return val;
  }

  // 1. Set <html lang="XX">
  processed = processed.replace(/<html\s+lang="[^"]*"/, `<html lang="${lang}"`);

  // 2. Update <meta property="og:locale">
  const ogLocale = t('seo.ogLocale') || `${lang}_${lang.toUpperCase()}`;
  if (processed.includes('og:locale')) {
    processed = processed.replace(
      /<meta\s+property="og:locale"\s+content="[^"]*"/,
      `<meta property="og:locale" content="${ogLocale}"`
    );
  } else {
    // Insert og:locale before </head>
    processed = processed.replace(
      '</head>',
      `<meta property="og:locale" content="${ogLocale}">\n</head>`
    );
  }

  // 3. Update canonical URL to point to self
  const selfUrl = buildLangUrl(pagePath, lang);
  processed = processed.replace(
    /<link\s+rel="canonical"\s+href="[^"]*"/,
    `<link rel="canonical" href="${selfUrl}"`
  );

  // 4. Update og:url to point to self
  processed = processed.replace(
    /<meta\s+property="og:url"\s+content="[^"]*"/,
    `<meta property="og:url" content="${selfUrl}"`
  );

  // 4b. Translate <title> tag if page.title exists
  const pageTitle = t('page.title');
  if (pageTitle) {
    processed = processed.replace(/<title>[^<]*<\/title>/, `<title>${pageTitle}</title>`);
  }

  // 4c. Translate <meta name="description"> if page.metaDescription exists
  const pageMeta = t('page.metaDescription');
  if (pageMeta) {
    processed = processed.replace(
      /<meta\s+name="description"\s+content="[^"]*"/,
      `<meta name="description" content="${pageMeta}"`
    );
  }

  // 4d. Translate og:title if page.ogTitle or page.title exists
  const pageOgTitle = t('page.ogTitle') || pageTitle;
  if (pageOgTitle) {
    processed = processed.replace(
      /<meta\s+property="og:title"\s+content="[^"]*"/,
      `<meta property="og:title" content="${pageOgTitle}"`
    );
    processed = processed.replace(
      /<meta\s+name="twitter:title"\s+content="[^"]*"/,
      `<meta name="twitter:title" content="${pageOgTitle}"`
    );
  }

  // 4e. Translate og:description if page.ogDescription or page.metaDescription exists
  const pageOgDesc = t('page.ogDescription') || pageMeta;
  if (pageOgDesc) {
    processed = processed.replace(
      /<meta\s+property="og:description"\s+content="[^"]*"/,
      `<meta property="og:description" content="${pageOgDesc}"`
    );
    processed = processed.replace(
      /<meta\s+name="twitter:description"\s+content="[^"]*"/,
      `<meta name="twitter:description" content="${pageOgDesc}"`
    );
  }

  // 4f. Translate <h1> if page.h1 exists
  const pageH1 = t('page.h1');
  if (pageH1) {
    processed = processed.replace(/(<h1[^>]*>)([\s\S]*?)(<\/h1>)/, `$1${pageH1}$3`);
  }

  // 4g. Replace article body if a body.html file exists for this page+lang
  const cleanForBody = pagePath.replace(/^\//, '').replace(/\/$/, '');
  const bodyFile = path.join(LANG_DIR, 'pages', cleanForBody, `${lang}.body.html`);
  if (fs.existsSync(bodyFile)) {
    const translatedBody = fs.readFileSync(bodyFile, 'utf8');
    // Find the article-body div and replace its content up to the next major section
    const bodyOpenTag = '<div class="article-body">';
    const bodyIdx = processed.indexOf(bodyOpenTag);
    if (bodyIdx !== -1) {
      const contentStart = bodyIdx + bodyOpenTag.length;
      // Find the end: look for closing </div> followed by a known section marker
      const endMarkers = ['<div class="article-cta">', '<div class="related-articles">', '<section class="faq-section">', '<div class="faq-section">', '<div class="author-box">', '</article>'];
      let contentEnd = -1;
      for (const marker of endMarkers) {
        const idx = processed.indexOf(marker, contentStart);
        if (idx !== -1 && (contentEnd === -1 || idx < contentEnd)) {
          contentEnd = idx;
        }
      }
      if (contentEnd !== -1) {
        // Walk backwards from contentEnd to find the closing </div> of article-body
        // The content ends at the last </div> before the end marker
        let closeDiv = processed.lastIndexOf('</div>', contentEnd);
        if (closeDiv > contentStart) {
          processed = processed.substring(0, contentStart) + '\n' + translatedBody + '\n' + processed.substring(closeDiv);
        }
      }
    }
  }

  // 5. Inject hreflang tags (replace existing or add before </head>)
  // First remove any existing hreflang tags
  processed = processed.replace(/<link\s+rel="alternate"\s+hreflang="[^"]*"\s+href="[^"]*"\s*\/?>\s*\n?/g, '');

  // Only include hreflang for languages that have translations for this page
  const activeLangs = getAvailableLangs(pagePath);
  const hreflangBlock = generateHreflangTags(pagePath, activeLangs);

  // Insert hreflang tags before </head>
  processed = processed.replace(
    '</head>',
    `${hreflangBlock}\n</head>`
  );

  // 6. Replace data-i18n attributes
  // Pattern: <tag data-i18n="key">content</tag>
  processed = processed.replace(
    /(<[^>]+\s)data-i18n="([^"]+)"([^>]*>)([\s\S]*?)(<\/[^>]+>)/g,
    (match, prefix, key, afterAttr, content, closingTag) => {
      const translated = t(key);
      if (translated) {
        return `${prefix}data-i18n="${key}"${afterAttr}${translated}${closingTag}`;
      }
      return match;
    }
  );

  // 7. Replace data-i18n-placeholder attributes
  processed = processed.replace(
    /data-i18n-placeholder="([^"]+)"\s+placeholder="[^"]*"/g,
    (match, key) => {
      const translated = t(key);
      if (translated) {
        return `data-i18n-placeholder="${key}" placeholder="${translated}"`;
      }
      return match;
    }
  );

  // 8. Replace data-i18n-alt attributes
  processed = processed.replace(
    /data-i18n-alt="([^"]+)"\s+alt="[^"]*"/g,
    (match, key) => {
      const translated = t(key);
      if (translated) {
        return `data-i18n-alt="${key}" alt="${translated}"`;
      }
      return match;
    }
  );

  // 9. Replace data-i18n-aria-label attributes
  processed = processed.replace(
    /data-i18n-aria-label="([^"]+)"\s+aria-label="[^"]*"/g,
    (match, key) => {
      const translated = t(key);
      if (translated) {
        return `data-i18n-aria-label="${key}" aria-label="${translated}"`;
      }
      return match;
    }
  );

  // 10. Update JSON-LD structured data inLanguage
  processed = processed.replace(
    /"inLanguage"\s*:\s*"[^"]*"/g,
    `"inLanguage":"${lang}"`
  );

  // 11. Update internal navigation links to include language prefix
  // Only rewrite links that are absolute paths starting with / and pointing to known pages
  // Skip asset links, API links, and external links
  const langPrefix = `/${lang}`;
  processed = processed.replace(
    /href="(\/(?!assets\/|api\/|netlify\/|fr\/|sw\/|yo\/|ha\/)[^"]*?)"/g,
    (match, href) => {
      // Don't double-prefix, and don't rewrite anchor-only links
      if (href.startsWith(langPrefix + '/') || href === '#') return match;
      return `href="${langPrefix}${href}"`;
    }
  );

  // 12. Inject i18n-detect.js and language meta tag before </head>
  const langMetaTag = `<meta name="content-language" content="${lang}">`;
  const i18nScript = `<script src="/assets/js/i18n-detect.js" defer></script>`;

  // Only inject if not already present
  if (!processed.includes('i18n-detect.js')) {
    processed = processed.replace(
      '</head>',
      `${langMetaTag}\n${i18nScript}\n</head>`
    );
  }

  return processed;
}

// ── MAIN BUILD ──────────────────────────────────────────────────────

function build() {
  const targetLangs = flags.lang ? [flags.lang] : SUPPORTED_LANGS;

  // Validate target languages
  for (const lang of targetLangs) {
    if (!SUPPORTED_LANGS.includes(lang)) {
      console.error(`Error: Unknown language "${lang}". Supported: ${SUPPORTED_LANGS.join(', ')}`);
      process.exit(1);
    }
    if (!translations[lang]) {
      console.error(`Error: No translation file found for "${lang}"`);
      process.exit(1);
    }
  }

  console.log(`\n=== AfroTools i18n Build ===`);
  console.log(`Languages: ${targetLangs.join(', ')}`);
  console.log(`Pages discovered: ${pagesToProcess.length}`);
  if (flags.dryRun) console.log(`Mode: DRY RUN (no files written)\n`);
  else console.log('');

  let totalBuilt = 0;
  let totalSkipped = 0;
  const errors = [];

  for (const lang of targetLangs) {
    let langBuilt = 0;

    for (const pagePath of pagesToProcess) {
      const clean = pagePath.replace(/^\//, '').replace(/\/$/, '');

      // Only build pages that have a page-specific translation file
      if (!translatedPages[lang].has(clean)) {
        totalSkipped++;
        continue;
      }

      const sourceFile = resolveSourceFile(pagePath);
      if (!sourceFile) {
        totalSkipped++;
        continue;
      }

      try {
        const outputPath = buildOutputPath(pagePath, lang);

        // NEVER overwrite existing hand-crafted French files.
        // A file is "existing" if it's on disk but NOT generated by us
        // (i.e., the page path is NOT in our translatedPages set for this lang).
        // If we have a translation for it, we're the ones who created it — safe to overwrite.
        if (fs.existsSync(outputPath) && !translatedPages[lang].has(clean)) {
          totalSkipped++;
          continue;
        }

        const html = fs.readFileSync(sourceFile, 'utf8');
        const processedHtml = processHTML(html, lang, pagePath);

        if (!flags.dryRun) {
          const outputDir = path.dirname(outputPath);
          fs.mkdirSync(outputDir, { recursive: true });
          fs.writeFileSync(outputPath, processedHtml, 'utf8');
        }

        langBuilt++;
        totalBuilt++;
      } catch (err) {
        errors.push({ lang, page: pagePath, error: err.message });
      }
    }

    console.log(`[${lang}] Built ${langBuilt} pages`);
  }

  // Report missing translation keys
  if (missingKeys.size > 0) {
    console.log('\n=== Missing Translation Keys ===');
    for (const [lang, keys] of missingKeys) {
      console.log(`\n[${lang}] ${keys.size} missing keys:`);
      for (const key of keys) {
        console.log(`  - ${key}`);
      }
    }
  }

  // Report errors
  if (errors.length > 0) {
    console.log('\n=== Errors ===');
    errors.forEach(e => console.log(`  [${e.lang}] ${e.page}: ${e.error}`));
  }

  console.log(`\nTotal: ${totalBuilt} pages built, ${totalSkipped} skipped, ${errors.length} errors`);

  // Generate sitemap
  if (!flags.dryRun && !flags.page) {
    generateSitemapI18n(targetLangs, pagesToProcess);
  }

  return errors.length === 0;
}

// ── GENERATE MULTILINGUAL SITEMAP ───────────────────────────────────

function generateSitemapI18n(targetLangs, pages) {
  console.log('\n=== Generating i18n Sitemap ===');

  const TODAY = new Date().toISOString().split('T')[0];
  const allLangs = ALL_LANGS;
  const entries = [];

  for (const pagePath of pages) {
    const sourceFile = resolveSourceFile(pagePath);
    if (!sourceFile) continue;

    // Determine which languages actually have translations for this page
    const availableLangs = getAvailableLangs(pagePath);

    // Only generate sitemap entries for languages that were actually built or exist
    const langsToInclude = availableLangs.filter(l =>
      l === DEFAULT_LANG || targetLangs.includes(l)
    );

    // Helper to get URL for a lang, respecting existing French pages
    const urlFor = (pg, l) => (l === 'fr') ? getFrenchUrl(pg) : buildLangUrl(pg, l);

    for (const lang of langsToInclude) {
      const url = urlFor(pagePath, lang);

      const alternates = langsToInclude.map(l => {
        return `    <xhtml:link rel="alternate" hreflang="${l}" href="${urlFor(pagePath, l)}" />`;
      });
      alternates.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${buildLangUrl(pagePath, DEFAULT_LANG)}" />`);

      let priority = '0.7';
      let changefreq = 'weekly';
      const clean = pagePath.replace(/^\//, '').replace(/\/$/, '');
      if (clean === '' || clean === '/') {
        priority = '1.0'; changefreq = 'daily';
      } else if (clean.startsWith('blog/')) {
        priority = '0.6'; changefreq = 'monthly';
      }

      entries.push(`  <url>
    <loc>${url}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
${alternates.join('\n')}
  </url>`);
    }
  }

  // Also add French-only pages (no English equivalent) to sitemap
  for (const [key, frUrl] of existingFrPages) {
    if (!key.startsWith('_fronly_')) continue;
    entries.push(`  <url>
    <loc>${frUrl}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
    <xhtml:link rel="alternate" hreflang="fr" href="${frUrl}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${frUrl}" />
  </url>`);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join('\n')}
</urlset>
`;

  const outPath = path.join(ROOT, 'sitemap-i18n.xml');
  fs.writeFileSync(outPath, xml, 'utf8');
  console.log(`Generated sitemap-i18n.xml with ${entries.length} URL entries`);
}

// ── ALSO UPDATE ENGLISH SOURCE WITH HREFLANG TAGS ───────────────────

function injectHreflangIntoEnglish(pages) {
  console.log('\n=== Injecting hreflang into English pages ===');
  let count = 0;

  for (const pagePath of pages) {
    const sourceFile = resolveSourceFile(pagePath);
    if (!sourceFile) continue;

    try {
      let html = fs.readFileSync(sourceFile, 'utf8');

      // Remove existing hreflang tags
      html = html.replace(/<link\s+rel="alternate"\s+hreflang="[^"]*"\s+href="[^"]*"\s*\/?>\s*\n?/g, '');

      // Only include hreflang for languages that have translations for this page
      const availableLangs = getAvailableLangs(pagePath);
      const hreflangBlock = generateHreflangTags(pagePath, availableLangs);
      html = html.replace('</head>', `${hreflangBlock}\n</head>`);

      fs.writeFileSync(sourceFile, html, 'utf8');
      count++;
    } catch (err) {
      console.error(`  Error on ${pagePath}: ${err.message}`);
    }
  }

  console.log(`Injected hreflang tags into ${count} English pages`);
}

// ── INJECT HREFLANG INTO EXISTING FRENCH PAGES ──────────────────────

function injectHreflangIntoExistingFrench() {
  console.log('\n=== Injecting hreflang into existing French pages ===');
  let count = 0;
  let errors = 0;

  for (const [enPage, frAbsUrl] of existingFrPages) {
    if (enPage.startsWith('_fronly_')) continue; // Skip French-only pages for now

    // Find the actual French file on disk
    const frRelUrl = frAbsUrl.replace(SITE_URL, '');
    // Convert URL back to file path
    let frFilePath = path.join(ROOT, frRelUrl.replace(/\/$/, ''));
    // Try index.html first, then .html
    if (fs.existsSync(frFilePath + '/index.html')) {
      frFilePath = frFilePath + '/index.html';
    } else if (fs.existsSync(frFilePath + '.html')) {
      frFilePath = frFilePath + '.html';
    } else if (fs.existsSync(frFilePath) && fs.statSync(frFilePath).isFile()) {
      // already a file
    } else {
      continue;
    }

    try {
      let html = fs.readFileSync(frFilePath, 'utf8');

      // Remove existing hreflang tags
      html = html.replace(/<link\s+rel="alternate"\s+hreflang="[^"]*"\s+href="[^"]*"\s*\/?>\s*\n?/g, '');

      // Build hreflang tags: en + fr + x-default
      const enUrl = buildLangUrl(enPage, DEFAULT_LANG);
      const tags = [
        `<link rel="alternate" hreflang="en" href="${enUrl}" />`,
        `<link rel="alternate" hreflang="fr" href="${frAbsUrl}" />`,
        `<link rel="alternate" hreflang="x-default" href="${enUrl}" />`,
      ].join('\n');

      html = html.replace('</head>', `${tags}\n</head>`);
      fs.writeFileSync(frFilePath, html, 'utf8');
      count++;
    } catch (err) {
      errors++;
    }
  }

  // Also handle French-only pages (self-referencing hreflang only)
  for (const [key, frAbsUrl] of existingFrPages) {
    if (!key.startsWith('_fronly_')) continue;
    const rel = key.replace('_fronly_', '');
    const frFilePath = path.join(ROOT, 'fr', rel);
    if (!fs.existsSync(frFilePath)) continue;

    try {
      let html = fs.readFileSync(frFilePath, 'utf8');
      html = html.replace(/<link\s+rel="alternate"\s+hreflang="[^"]*"\s+href="[^"]*"\s*\/?>\s*\n?/g, '');
      const tags = [
        `<link rel="alternate" hreflang="fr" href="${frAbsUrl}" />`,
        `<link rel="alternate" hreflang="x-default" href="${frAbsUrl}" />`,
      ].join('\n');
      html = html.replace('</head>', `${tags}\n</head>`);
      fs.writeFileSync(frFilePath, html, 'utf8');
      count++;
    } catch (err) {
      errors++;
    }
  }

  console.log(`Injected hreflang into ${count} existing French pages (${errors} errors)`);
}

// ── RUN ─────────────────────────────────────────────────────────────

if (flags.all || flags.lang || flags.page || flags.dryRun) {
  const success = build();

  // Also inject hreflang into English source pages and existing French pages
  if (!flags.dryRun && (flags.all || !flags.page)) {
    injectHreflangIntoEnglish(pagesToProcess);
    injectHreflangIntoExistingFrench();
  }

  process.exit(success ? 0 : 1);
} else {
  console.log(`
AfroTools i18n Build Script
Usage:
  node scripts/build-i18n.js --all              Build all languages
  node scripts/build-i18n.js --lang fr           Build specific language
  node scripts/build-i18n.js --page ghana/gh-paye  Build specific page in all langs
  node scripts/build-i18n.js --dry-run           Report missing translations
  node scripts/build-i18n.js --validate          Validate JSON key parity
  `);
}
