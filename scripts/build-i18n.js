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
 *   node scripts/build-i18n.js --lang fr --page benin/bj-paye --overwrite-existing
 *                                            # Rebuild an existing translated output from source
 *   node scripts/build-i18n.js --dry-run         # Report missing translations
 *   node scripts/build-i18n.js --validate        # Validate JSON files for missing keys
 *
 * Output: /<lang>/path/to/page/index.html for each language variant
 * ===================================================================
 */

const fs = require('fs');
const path = require('path');

const { fileToPublicRoute } = require('./lib/canonical-aliases');
const {
  frenchRouteForEnglishToolSource,
  frenchToolSlugToEnglishSource,
} = require('./lib/french-tool-route-map');
const {
  frenchRouteForEnglishTelecomSource,
  frenchTelecomSlugToEnglishSource,
} = require('./lib/french-telecom-route-map');

// ── CONFIG ──────────────────────────────────────────────────────────

const ROOT = path.join(__dirname, '..');
const LANG_DIR = path.join(ROOT, 'lang');
const SITE_URL = 'https://afrotools.com';
const SUPPORTED_LANGS = ['fr', 'sw', 'yo', 'ha'];
const DEFAULT_LANG = 'en';
const ALL_LANGS = [DEFAULT_LANG, ...SUPPORTED_LANGS];

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function writeFileWithRetry(filePath, content) {
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      fs.writeFileSync(filePath, content, 'utf8');
      return;
    } catch (error) {
      if (!['EBUSY', 'EPERM', 'UNKNOWN'].includes(error.code) || attempt === 5) {
        throw error;
      }
      sleep(100 * attempt);
    }
  }
}

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
  overwriteExisting: args.includes('--overwrite-existing'),
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
  'tunisie': 'tunisia', 'guinee': 'guinea', 'rdc': 'dr-congo',
  'dr-congo': 'dr-congo', 'car': 'central-african-republic',
  'eq-guinea': 'equatorial-guinea', 'cabo-verde': 'cape-verde',
  'tchad': 'chad', 'centrafrique': 'central-african-republic',
  'comores': 'comoros', 'mauritanie': 'mauritania',
};

const FRENCH_COUNTRY_SLUG_BY_EN = {
  'algeria': 'algerie',
  'cameroon': 'cameroun',
  'morocco': 'maroc',
  'tunisia': 'tunisie',
  'guinea': 'guinee',
  'dr-congo': 'rdc',
  'drc': 'rdc',
  'central-african-republic': 'centrafrique',
  'car': 'centrafrique',
  'chad': 'tchad',
  'comoros': 'comores',
  'mauritania': 'mauritanie',
};

const PAYE_SLUG_MAP = {
  'algerie':'algeria/dz-paye','burkina-faso':'burkina-faso/bf-paye',
  'burundi':'burundi/bi-paye','cameroun':'cameroon/cm-paye',
  'centrafrique':'car/cf-paye','chad':'chad/td-paye',
  'comores':'comoros/km-paye','congo':'congo/cg-paye',
  'cote-divoire':'cote-divoire/ci-paye','djibouti':'djibouti/dj-paye',
  'gabon':'gabon/ga-paye','guinee':'guinea/gn-paye',
  'madagascar':'madagascar/mg-paye','mali':'mali/ml-paye',
  'maroc':'morocco/ma-paye','mauritanie':'mauritania/mr-paye',
  'niger':'niger/ne-paye','rdc':'dr-congo/cd-paye',
  'senegal':'senegal/sn-paye','tchad':'chad/td-paye',
  'togo':'togo/tg-paye','tunisie':'tunisia/tn-paye',
};

const VAT_SLUG_MAP = {
  'algerie':'algeria/dz-vat','benin':'benin/bj-vat',
  'burkina-faso':'burkina-faso/bf-vat','burundi':'burundi/bi-vat',
  'cameroun':'cameroon/cm-vat','centrafrique':'car/cf-vat',
  'chad':'chad/td-vat','comores':'comoros/km-vat',
  'congo':'congo/cg-vat','cote-divoire':'cote-divoire/ci-vat',
  'gabon':'gabon/ga-vat','guinee':'guinea/gn-vat',
  'madagascar':'madagascar/mg-vat','mali':'mali/ml-vat',
  'maroc':'morocco/ma-vat','mauritanie':'mauritania/mr-vat',
  'niger':'niger/ne-vat','rdc':'dr-congo/cd-vat',
  'senegal':'senegal/sn-vat','tchad':'chad/td-vat',
  'togo':'togo/tg-vat','tunisie':'tunisia/tn-vat',
};

function resolveFrenchRouteFile(frRoute) {
  const clean = frRoute.replace(/^\/+/, '').replace(/\/+$/, '');
  const indexPath = path.join(ROOT, clean, 'index.html');
  if (fs.existsSync(indexPath)) return indexPath;
  const htmlPath = path.join(ROOT, clean + '.html');
  if (fs.existsSync(htmlPath)) return htmlPath;
  const rawPath = path.join(ROOT, clean);
  if (fs.existsSync(rawPath) && fs.statSync(rawPath).isFile()) return rawPath;
  return null;
}

function preferredFrenchRouteForEnglishPage(enPage) {
  const clean = enPage.replace(/^\//, '').replace(/\/$/, '');
  if (clean === 'document-pdf' && resolveFrenchRouteFile('/fr/document-pdf')) {
    return '/fr/document-pdf/';
  }

  const mappedToolRoute = frenchRouteForEnglishToolSource(clean);
  if (mappedToolRoute && resolveFrenchRouteFile(mappedToolRoute)) {
    return `${mappedToolRoute}/`;
  }

  const mappedTelecomRoute = frenchRouteForEnglishTelecomSource(clean);
  if (mappedTelecomRoute && resolveFrenchRouteFile(mappedTelecomRoute)) {
    return `${mappedTelecomRoute}/`;
  }

  const parts = clean.split('/');
  const country = parts[0];
  const slug = parts[1] || '';

  if (country === 'cars' && slug) {
    const preferredCarsParts = parts.slice();
    preferredCarsParts[1] = FRENCH_COUNTRY_SLUG_BY_EN[preferredCarsParts[1]] || preferredCarsParts[1];
    const route = `/fr/${preferredCarsParts.join('/')}`;
    if (resolveFrenchRouteFile(route)) return route + '/';
  }

  const preferredCountry = FRENCH_COUNTRY_SLUG_BY_EN[country] || country;
  const isPaye = /-paye$|salary-tax$/i.test(slug);
  const isVat = /-vat$/i.test(slug);

  if (country && slug && isPaye) {
    const route = `/fr/${preferredCountry}/calculateur-salaire-net`;
    if (resolveFrenchRouteFile(route)) return route;
  }

  if (country && slug && isVat) {
    const route = `/fr/${preferredCountry}/calculateur-tva`;
    if (resolveFrenchRouteFile(route)) return route;
  }

  if (clean && !slug && FRENCH_COUNTRY_SLUG_BY_EN[country]) {
    const route = `/fr/${preferredCountry}/`;
    if (resolveFrenchRouteFile(route)) return route;
  }

  return null;
}

function preferredFrenchUrlForEnglishPage(enPage) {
  const route = preferredFrenchRouteForEnglishPage(enPage);
  return route ? SITE_URL + route : null;
}

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
        if (country === 'cars') {
          const carsParts = parts.slice(1);
          if (carsParts[carsParts.length - 1] === 'index.html') carsParts.pop();
          if (carsParts.length) {
            carsParts[0] = COUNTRY_FR_TO_EN[carsParts[0]] || carsParts[0];
            enPage = ['cars', ...carsParts].join('/');
          } else {
            enPage = 'cars';
          }
        } else if (country === 'blog') {
          enPage = null;
        } else if (country === 'tools') {
          enPage = frenchToolSlugToEnglishSource(fileBase) || rel.replace('.html', '').replace(/\/index$/, '');
        } else if (country === 'telecom') {
          enPage = frenchTelecomSlugToEnglishSource(fileBase) || rel.replace('.html', '').replace(/\/index$/, '');
        } else if (fileBase === 'calculateur-salaire-net' && PAYE_SLUG_MAP[country]) {
          enPage = PAYE_SLUG_MAP[country];
        } else if (fileBase === 'calculateur-tva' && VAT_SLUG_MAP[country]) {
          enPage = VAT_SLUG_MAP[country];
        } else if (country === 'eq-guinea' && fileBase === 'gq-paye') {
          enPage = 'eq-guinea/gq-paye';
        } else if (country === 'eq-guinea' && fileBase === 'gq-vat') {
          enPage = 'eq-guinea/gq-vat';
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
        const isEqGuineaTaxRoute = country === 'eq-guinea' && (parts[1] === 'gq-paye' || parts[1] === 'gq-vat');
        const isMappedTelecomRoute = country === 'telecom' && parts[1] && frenchTelecomSlugToEnglishSource(parts[1]);
        if (country !== 'tools' && country !== 'blog' && !isEqGuineaTaxRoute && !isMappedTelecomRoute && parts.length === 3 && parts[2] === 'index.html') {
          const enCountry = COUNTRY_FR_TO_EN[country] || country;
          enPage = enCountry + '/' + parts[1];
        }

        // Clean enPage
        if (enPage !== null) {
          enPage = enPage.replace(/\/+$/, '').replace(/^\//, '');
          if (enPage === 'index') enPage = '';
        }

        // Build French URL with canonical route rules:
        // foo/index.html => /foo/, foo.html => /foo.
        const frUrl = fileToPublicRoute(path.join(frDir, rel));

        // Verify English source exists
        const enExists = enPage !== null && resolveSourceFile(enPage);

        if (enPage !== null && enExists) {
          const preferredFrUrl = preferredFrenchUrlForEnglishPage(enPage) || SITE_URL + frUrl;
          existingFrPages.set(enPage, preferredFrUrl);
          existingFrToEn.set(preferredFrUrl.replace(SITE_URL, ''), enPage);
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

// ── DISCOVER EXISTING SWAHILI PAGES ────────────────────────────────
// Hand-crafted Swahili pages under /sw/ that predate the build system.
// We map each to its English equivalent so hreflang/sitemap can reference them.

const SW_SLUG_TO_EN = {
  // Category hubs
  'afya': 'health',
  'afya-na-bima': 'health-insurance',
  'data-na-tija': 'data-productivity',
  'elimu': 'education',
  'hati-na-pdf': 'document-pdf',
  'kazi-na-nyaraka': 'document-pdf',
  'kilimo': 'agriculture',
  'mali-na-mikopo': 'mortgage-property',
  'mshahara-na-kodi': 'salary-tax',
  'sarafu': 'currency',
  'vat-na-kodi': 'vat-business-tax',
  'zana-za-ai': 'tools/ai-advisor',
  'zana-za-elimu': 'education',
  'zana-za-pdf': 'document-pdf',
  'zana-zote': 'all-tools',
  'nchi': 'countries',
  'linganisha/kenya-vs-tanzania-kodi': 'compare/kenya-vs-tanzania-tax',
  // Country PAYE tools
  'kenya/kikokotoo-kodi-mshahara': 'kenya/ke-paye',
  'tanzania/kikokotoo-kodi-mshahara': 'tanzania/tz-paye',
  'nigeria/kikokotoo-kodi-mshahara': 'nigeria/ng-salary-tax',
  'ghana/kikokotoo-kodi-mshahara': 'ghana/gh-paye',
  'south-africa/kikokotoo-kodi-mshahara': 'south-africa/za-paye',
  'ethiopia/kikokotoo-kodi-mshahara': 'ethiopia/et-paye',
  'malawi/kikokotoo-kodi-mshahara': 'malawi/mw-paye',
  'zambia/kikokotoo-kodi-mshahara': 'zambia/zm-paye',
  'mozambique/kikokotoo-kodi-mshahara': 'mozambique/mz-paye',
  'dr-congo/kikokotoo-kodi-mshahara': 'dr-congo/cd-paye',
  'somalia/kikokotoo-kodi-mshahara': 'somalia/so-paye',
  'sudan/kikokotoo-kodi-mshahara': 'sudan/sd-paye',
  'egypt/kikokotoo-kodi-mshahara': 'egypt/eg-paye',
  'morocco/kikokotoo-kodi-mshahara': 'morocco/ma-paye',
  'algeria/kikokotoo-kodi-mshahara': 'algeria/dz-paye',
  'burkina-faso/kikokotoo-kodi-mshahara': 'burkina-faso/bf-paye',
  'cameroon/kikokotoo-kodi-mshahara': 'cameroon/cm-paye',
  'guinea/kikokotoo-kodi-mshahara': 'guinea/gn-paye',
  'senegal/kikokotoo-kodi-mshahara': 'senegal/sn-paye',
  'tunisia/kikokotoo-kodi-mshahara': 'tunisia/tn-paye',
  // Swahili agriculture country calculators
  'kilimo/mavuno/kenya': 'agriculture/crop-yield/kenya',
  'kilimo/mavuno/tanzania': 'agriculture/crop-yield/tanzania',
  'kilimo/mavuno/uganda': 'agriculture/crop-yield/uganda',
  'kilimo/mavuno/rwanda': 'agriculture/crop-yield/rwanda',
  'kilimo/mavuno/burundi': 'agriculture/crop-yield/burundi',
  'kilimo/mbolea/kenya': 'agriculture/fertilizer/kenya',
  'kilimo/mbolea/tanzania': 'agriculture/fertilizer/tanzania',
  'kilimo/mbolea/uganda': 'agriculture/fertilizer/uganda',
  'kilimo/mbolea/rwanda': 'agriculture/fertilizer/rwanda',
  'kilimo/mbolea/burundi': 'agriculture/fertilizer/burundi',
  'kilimo/umwagiliaji/kenya': 'agriculture/irrigation/kenya',
  'kilimo/umwagiliaji/tanzania': 'agriculture/irrigation/tanzania',
  'kilimo/umwagiliaji/uganda': 'agriculture/irrigation/uganda',
  'kilimo/umwagiliaji/rwanda': 'agriculture/irrigation/rwanda',
  'kilimo/umwagiliaji/burundi': 'agriculture/irrigation/burundi',
};

const SW_EN_TO_SLUG = new Map(
  Object.entries(SW_SLUG_TO_EN)
    .filter(([, enPage]) => enPage)
    .map(([swSlug, enPage]) => [enPage.replace(/^\/+|\/+$/g, ''), swSlug])
);

// existingSwPages: Map<enPagePath, swUrl>
const existingSwPages = new Map();
const existingSwToEn = new Map();

function discoverExistingSwPages() {
  const swDir = path.join(ROOT, 'sw');
  if (!fs.existsSync(swDir)) return;

  const walkSw = (dir, base) => {
    fs.readdirSync(dir, { withFileTypes: true }).forEach(e => {
      const rel = base ? base + '/' + e.name : e.name;
      if (e.isDirectory()) walkSw(path.join(dir, e.name), rel);
      else if (e.name.endsWith('.html')) {
        let cleanRel = rel.replace(/\.html$/, '').replace(/\/index$/, '');
        if (cleanRel === 'index') cleanRel = '';

        // Lookup English equivalent
        let enPage = SW_SLUG_TO_EN[cleanRel] || null;

        // If not in explicit map, try direct match (same country/path in English)
        if (!enPage) {
          enPage = cleanRel;
        }

        if (enPage) {
          enPage = enPage.replace(/\/+$/, '').replace(/^\//, '');
        }

        // Build Swahili URL with canonical route rules:
        // foo/index.html => /foo/, foo.html => /foo.
        const swUrl = fileToPublicRoute(path.join(swDir, rel));

        // Verify English source exists
        const enExists = enPage && resolveSourceFile(enPage);

        if (enPage && enExists) {
          if (!existingSwPages.has(enPage)) {
            existingSwPages.set(enPage, SITE_URL + swUrl);
            existingSwToEn.set(swUrl, enPage);
          }
        } else {
          existingSwPages.set('_swonly_' + rel, SITE_URL + swUrl);
        }
      }
    });
  };

  walkSw(swDir, '');
  console.log(`[existing-sw] ${existingSwPages.size} existing Swahili pages mapped`);
}

discoverExistingSwPages();

// Get which languages have a translation for a given page path
// Now considers both page-specific JSON files AND existing hand-crafted French pages
function getAvailableLangs(pagePath) {
  const clean = pagePath.replace(/^\//, '').replace(/\/$/, '');
  const langs = [DEFAULT_LANG]; // English always available
  for (const lang of SUPPORTED_LANGS) {
    if (translatedPages[lang].has(clean)) {
      langs.push(lang);
    }
    // Also check existing hand-crafted pages
    if (lang === 'fr' && existingFrPages.has(clean) && !langs.includes('fr')) {
      langs.push('fr');
    }
    if (lang === 'sw' && existingSwPages.has(clean) && !langs.includes('sw')) {
      langs.push('sw');
    }
  }
  return langs;
}

// Get the actual French URL for a page (may differ from generated URL pattern)
function getFrenchUrl(pagePath) {
  const clean = pagePath.replace(/^\//, '').replace(/\/$/, '');
  const preferredUrl = preferredFrenchUrlForEnglishPage(clean);
  if (preferredUrl) return preferredUrl;
  // If there's an existing hand-crafted French page, use its URL
  if (existingFrPages.has(clean)) {
    return existingFrPages.get(clean);
  }
  // Otherwise use the standard generated URL
  return buildLangUrl(pagePath, 'fr');
}

// ── BUILD URL FOR LANGUAGE ──────────────────────────────────────────

function buildLangUrl(pagePath, lang) {
  const targetFile =
    lang === DEFAULT_LANG ? resolveSourceFile(pagePath) : buildOutputPath(pagePath, lang);

  if (targetFile) {
    return `${SITE_URL}${fileToPublicRoute(targetFile)}`;
  }

  let clean = pagePath.replace(/^\//, '').replace(/\/$/, '');
  if (clean === 'index.html') clean = '';

  if (lang === DEFAULT_LANG) {
    return clean === '' ? `${SITE_URL}/` : `${SITE_URL}/${clean}`;
  }

  return clean === '' ? `${SITE_URL}/${lang}/` : `${SITE_URL}/${lang}/${clean}`;
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

function buildDryRunOutputPlan(pagePath, lang) {
  const clean = pagePath.replace(/^\//, '').replace(/\/$/, '');
  if (lang === 'sw' && SW_EN_TO_SLUG.has(clean)) {
    const swSlug = SW_EN_TO_SLUG.get(clean);
    const outputPath = path.join(ROOT, 'sw', swSlug, 'index.html');
    return {
      outputPath,
      routeAliasAware: true,
      route: fileToPublicRoute(outputPath),
    };
  }

  const outputPath = buildOutputPath(pagePath, lang);
  return {
    outputPath,
    routeAliasAware: false,
    route: fileToPublicRoute(outputPath),
  };
}

function logDryRunOutputPlan(pagePath, lang, hasPageTranslation, sourceFile) {
  const plan = buildDryRunOutputPlan(pagePath, lang);
  const relSource = sourceFile ? path.relative(ROOT, sourceFile).replace(/\\/g, '/') : 'missing source';
  const relOutput = path.relative(ROOT, plan.outputPath).replace(/\\/g, '/');
  const markers = [];
  if (plan.routeAliasAware) markers.push('route-alias-aware');
  if (!hasPageTranslation) markers.push('no page pack');
  console.log(
    `[dry-run] ${lang} ${pagePath || '/'}: ${relSource} -> ${relOutput}` +
      (markers.length ? ` (${markers.join(', ')})` : '')
  );
}

function getSwahiliUrl(pagePath) {
  const clean = pagePath.replace(/^\//, '').replace(/\/$/, '');
  if (existingSwPages.has(clean)) {
    return existingSwPages.get(clean);
  }
  return buildLangUrl(pagePath, 'sw');
}

function generateHreflangTags(pagePath, activeLangs) {
  const tags = [];

  for (const lang of activeLangs) {
    // For French/Swahili, use existing hand-crafted URL if available
    let url;
    if (lang === 'fr') url = getFrenchUrl(pagePath);
    else if (lang === 'sw') url = getSwahiliUrl(pagePath);
    else url = buildLangUrl(pagePath, lang);
    tags.push(`<link rel="alternate" hreflang="${lang}" href="${url}" />`);
  }

  // x-default always points to English
  const defaultUrl = buildLangUrl(pagePath, DEFAULT_LANG);
  tags.push(`<link rel="alternate" hreflang="x-default" href="${defaultUrl}" />`);

  return tags.join('\n');
}

// ── PROCESS HTML ────────────────────────────────────────────────────

const missingKeys = new Map(); // lang -> Set of missing keys

function applyExactPairs(input, pairs) {
  let output = input;
  for (const [from, to] of pairs) {
    if (!output.includes(from)) continue;
    output = output.split(from).join(to);
  }
  return output;
}

function findMatchingClosingTag(html, openStart, tagName) {
  const escapedTag = tagName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const tagRe = new RegExp(`<\\/?${escapedTag}\\b[^>]*>`, 'gi');
  const openRe = new RegExp(`^<${escapedTag}\\b`, 'i');
  tagRe.lastIndex = openStart;
  let depth = 0;
  let match;

  while ((match = tagRe.exec(html))) {
    if (openRe.test(match[0])) {
      depth += 1;
    } else {
      depth -= 1;
      if (depth === 0) return match.index;
    }
  }

  return -1;
}

function applyFrenchPayeFallbacks(input) {
  let output = input;

  output = output
    .replace(/<title>([^<]+?)\s+Calculateur PAYE([^<]*)<\/title>/i, '<title>Calculateur PAYE $1$2</title>')
    .replace(/<meta\s+property="og:title"\s+content="([^"]+?)\s+PAYE Calculator([^"]*)"/i, '<meta property="og:title" content="Calculateur PAYE $1$2"')
    .replace(/<meta\s+name="twitter:title"\s+content="([^"]+?)\s+PAYE Calculator([^"]*)"/i, '<meta name="twitter:title" content="Calculateur PAYE $1$2"')
    .replace(/<h1>([^<]+?)\s+Calculateur PAYE\s*(<em>[\s\S]*?<\/em>)<\/h1>/i, '<h1>Calculateur PAYE $1 $2</h1>')
    .replace(/<h1>([^<]+?)\s+Calculateur PAYE<\/h1>/i, '<h1>Calculateur PAYE $1</h1>')
    .replace(/tool-name="([^"]+?)\s+PAYE Calculator"/g, 'tool-name="Calculateur PAYE $1"')
    .replace(/"name":"([^"]+?)\s+PAYE Calculator([^"]*)"/g, '"name":"Calculateur PAYE $1$2"')
    .replace(/>([^<]+?)\s+Calculateur PAYE</g, '>Calculateur PAYE $1<')
    .replace(/>([^<]+?)\s+Calculateur TVA</g, '>Calculateur TVA $1<')
    .replace(/alt="([^"]+?)\s+PAYE Calculator"/g, 'alt="Calculateur PAYE $1"')
    .replace(/alt="([^"]+?)\s+VAT Calculator"/g, 'alt="Calculateur TVA $1"')
    .replace(/<h2 class="ng-guide-title">How\s+([^<]+?)\s+PAYE Tax Is Calculated([^<]*)<\/h2>/i, '<h2 class="ng-guide-title">Comment le PAYE de $1 est calcule$2</h2>');

  const pairs = [
    ['Calculate your monthly take-home pay using', 'Calculez votre salaire net mensuel avec'],
    ['Calculate your take-home pay in', 'Calculez votre salaire net en'],
    ['Calculate your take-home pay using', 'Calculez votre salaire net avec'],
    ['Accurate, free, instant.', 'Precis, gratuit et instantane.'],
    ['Updated ', 'Mis a jour '],
    ['Updated:', 'Mis a jour :'],
    ['Informational only.', 'A titre informatif uniquement.'],
    ['Salary Input', 'Saisie du salaire'],
    ['Annual or monthly gross', 'Brut annuel ou mensuel'],
    ['Enter your annual gross salary. Monthly equivalent shown in slider.', "Saisissez votre salaire brut annuel. L'equivalent mensuel apparait sur le curseur."],
    ['Adjust with slider', 'Ajuster avec le curseur'],
    ['all employees', 'tous les salaries'],
    ['employee — tax-deductible', 'salarie — deductible fiscalement'],
    ['After DGI tax, CNPS &amp; all deductions', 'Apres impot DGI, CNPS et retenues'],
    ['After all deductions &amp; tax', 'Apres deductions et impot'],
    ['Monthly Equivalent', 'Equivalent mensuel'],
    ['Annual Bands', 'Tranches annuelles'],
    ['Free PDF Export', 'Export PDF gratuit'],
    ['Share Result', 'Partager le resultat'],
    ['Ask a follow-up…', 'Posez une question de suivi...'],
    ['Ask a follow-up...', 'Posez une question de suivi...'],
    ['Ask a follow-up below ↓', 'Posez une question ci-dessous ↓'],
    ['Your name (optional)', 'Votre nom (facultatif)'],
    ['Your email address', 'Votre adresse e-mail'],
    ['Annual Take-Home Pay', 'Salaire net annuel'],
    ['Monthly Take-Home Pay', 'Salaire net mensuel'],
    ['Annual Take-Home', 'Net annuel'],
    ['Annual Gross', 'Brut annuel'],
    ['Gross: ', 'Brut : '],
    ['Take-home: ', 'Net : '],
    ['Effective: ', 'Taux effectif : '],
    ['Total Employer Cost:', 'Cout total employeur :'],
    ['My Take-Home Pay', 'Mon salaire net'],
    ['Your Salary', 'Votre salaire'],
    ['Calculate First →', "Calculez d'abord →"],
    ['Enter your salary above and calculate to get a personalized tax analysis.', "Saisissez votre salaire ci-dessus puis lancez le calcul pour obtenir une analyse fiscale personnalisee."],
    ['Employment Status', "Statut d'emploi"],
    ['Progressive tax', 'Impot progressif'],
    ['Non-Resident', 'Non-resident'],
    ['Flat 30%', 'Taux fixe 30%'],
    ['Deductions & Levies', 'Retenues et prelevements'],
    ['Not deductible from tax', "Non deductible de l'impot"],
    ['Official annual bands', 'Tranches annuelles officielles'],
    ['Monthly Salary', 'Salaire mensuel'],
    ['Or enter directly', 'Ou saisissez directement'],
    ['Monthly salary', 'Salaire mensuel'],
    ['What are the ', 'Quelles sont les '],
    ['What is the total ', 'Quel est le total de '],
    ['What is the salary in the calculator equivalent to in monthly terms?', "A quoi correspond le salaire du calculateur en equivalent mensuel ?"],
    ['What is ', "Qu'est-ce que "],
    ['When are ', 'Quand les '],
    ['taxes calculated and paid?', 'impots sont-ils calcules et payes ?'],
    ['Annual gross salary', 'Salaire brut annuel'],
    ['Monthly gross salary', 'Salaire brut mensuel'],
    ['Gross Income', 'Revenu brut'],
    ['Take-Home Pay', 'Salaire net'],
    ['Tax Bands', 'Tranches fiscales'],
    ['Income Tax', 'Impot sur le revenu'],
    ['Share', 'Partager'],
  ];

  output = applyExactPairs(output, pairs);
  return output;
}

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
  // Handle lang in any position in the opening <html> tag (e.g. after data-* attrs)
  processed = processed.replace(/(<html\b[^<]*?)\slang="[^"]*"/, `$1 lang="${lang}"`);

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
    // Replace the full article body so translated body files do not leave English
    // source CTA/FAQ blocks behind after the localized content.
    const bodyOpenRe = /<(div|article)\b[^>]*class=(["'])[^"']*\barticle-body\b[^"']*\2[^>]*>/i;
    const bodyMatch = processed.match(bodyOpenRe);
    if (bodyMatch && typeof bodyMatch.index === 'number') {
      const bodyIdx = bodyMatch.index;
      const contentStart = bodyIdx + bodyMatch[0].length;
      const closeTag = findMatchingClosingTag(processed, bodyIdx, bodyMatch[1]);
      if (closeTag > contentStart) {
        processed = processed.substring(0, contentStart) + '\n' + translatedBody + '\n' + processed.substring(closeTag);
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

  // 9b. For French pages, append "-fr" to the tool-id meta tag so the AI Advisor
  // uses the correct French tool context (e.g. "ke-paye" → "ke-paye-fr")
  if (lang === 'fr') {
    processed = processed.replace(
      /<meta\s+name="tool-id"\s+content="([^"-][^"]*)"/,
      (match, toolId) => `<meta name="tool-id" content="${toolId}-fr"`
    );
  }

  // 10. Update JSON-LD structured data inLanguage
  processed = processed.replace(
    /"inLanguage"\s*:\s*"[^"]*"/g,
    `"inLanguage":"${lang}"`
  );

  // 10b. UI string translation pass (fr only)
  // Replaces known English UI strings in HTML text content and select attribute values,
  // skipping <script> and <style> blocks. Uses phrase-level translations to preserve
  // French word order — avoids single-word replacements that cause word-order issues.
  if (lang === 'fr') {
    const UI_TRANSLATIONS_FR = [
      // ── Calculator input labels (compound phrases first) ──
      ['Enter Your Details', 'Vos informations'],
      ['Monthly Gross Salary', 'Salaire Brut Mensuel'],
      ['Annual Gross Salary', 'Salaire Brut Annuel'],
      ['Before any deductions', 'Avant toute déduction'],
      ['Before any déductions', 'Avant toute déduction'],
      ['Before deductions', 'Avant déductions'],
      ['Or type exact annual amount', 'Ou entrez le montant annuel exact'],
      ['Or type exact monthly amount', 'Ou entrez le montant mensuel exact'],
      ['Leave blank = full gross', 'Laisser vide = salaire brut total'],
      ['Active Deductions', 'Déductions actives'],
      ['Toggle to include / exclude', 'Activer / désactiver'],
      ['Statutory Deductions', 'Retenues légales'],
      ['Optional Deductions', 'Déductions facultatives'],

      // ── PAYE page labels / breadcrumbs ──
      ['PAYE Calculator', 'Calculateur PAYE'],
      ['Tax Calculator', 'Calculateur Fiscal'],
      ['VAT Calculator', 'Calculateur TVA'],
      ['Download PDF', 'Telecharger le PDF'],
      ['Copy Link', 'Copier le lien'],
      ['Save to My Tools', 'Enregistrer dans Mes outils'],
      ['All Countries', 'Tous les pays'],
      ['Gross → Net', 'Brut → Net'],
      ['Net → Gross', 'Net → Brut'],
      ['Also see:', 'Voir aussi :'],
      ['Last updated:', 'Dernière mise à jour :'],
      ['See what changed', 'Voir les changements'],
      ['Ask a follow-up below ↓', 'Posez une question ci-dessous ↓'],
      ['Get AI Tax Analysis →', 'Obtenir une analyse IA →'],
      ['Analysing…', 'Analyse en cours…'],
      ['Calculate first to unlock →', "Calculez d'abord pour débloquer →"],

      // ── Kenya specifics ──
      ['Affordable Housing Levy', 'Prélèvement Logement Abordable'],
      ['Housing Levy', 'Prélèvement Logement'],
      ['Calculate first â†’', "Calculez d'abord â†’"],
      ['Calculate first →', "Calculez d'abord →"],
      ['Calculate first &rarr;', "Calculez d'abord &rarr;"],
      ['Old System &mdash; PITA', 'Ancien systeme &mdash; PITA'],
      ['Annual Home Loan Interest', 'Interets annuels de pret immobilier'],
      ['How can I pay less tax?', 'Comment reduire mon impot ?'],
      ['Salary slider', 'Curseur de salaire'],
      ['Tax breakdown chart', 'Graphique de ventilation fiscale'],
      ['Basic Salary (for NSSF)', 'Salaire de Base (pour NSSF)'],
      ['Basic Salary (for SSNIT)', 'Salaire de Base (pour SSNIT)'],
      ['NSSF Tier I + II', 'NSSF Niveaux I + II'],
      ['NSSF Tier I+II', 'NSSF Niveaux I+II'],
      ['Personal Relief', 'Abattement Personnel'],
      ['Disability Exemption', 'Exonération Handicap'],
      ['Mortgage Relief', 'Allègement Prêt Immobilier'],
      ['Mortgage Interest Relief', 'Allègement Intérêts Immobiliers'],
      ['Disabled (NCPWD registered)', 'Handicapé(e) (enregistré NCPWD)'],
      ['Insurance Relief', 'Allègement Assurance'],
      ['Monthly Insurance Premium', "Prime d'Assurance Mensuelle"],
      ['Monthly Pension Contribution', 'Cotisation de Pension Mensuelle'],
      ['Monthly Mortgage Interest', 'Intérêts Immobiliers Mensuels'],
      ['Monthly PRMF Contribution', 'Cotisation PRMF Mensuelle'],

      // ── Ghana specifics ──
      ['SSNIT Tier I + II', 'SSNIT Niveaux I + II'],
      ['SSNIT Tier I+II', 'SSNIT Niveaux I+II'],
      ['SSNIT Tier III', 'SSNIT Niveau III'],
      ['Voluntary, tax-deductible', 'Volontaire, déductible fiscalement'],
      ['Marriage Relief', 'Abattement pour Mariage'],
      ['1 Child Relief', 'Abattement 1 Enfant'],
      ['2 Children Relief', 'Abattement 2 Enfants'],
      ['Disability Relief', 'Abattement Handicap'],
      ['Old Age (60+)', 'Troisième Âge (60+)'],
      ['Dependent Relative', 'Parent à Charge'],
      ['Pension (SSNIT)', 'Pension (SSNIT)'],
      ['Tier III Contribution (Annual)', 'Cotisation Niveau III (Annuelle)'],
      ['Personal Reliefs (GRA-registered)', 'Abattements Personnels (enregistrés GRA)'],

      // ── Nigeria specifics ──
      ['Consolidated Relief Allowance', 'Allocation de Réduction Consolidée'],
      ['Voluntary Pension', 'Pension Volontaire'],
      ['Life Assurance', 'Assurance Vie'],
      ['National Housing Fund', 'Fonds National du Logement'],

      // ── Rwanda specifics ──
      ['RSSB Pension', 'Pension RSSB'],
      ['Maternity Leave Contribution', 'Cotisation Congé Maternité'],
      ['Community-Based Health Insurance', 'Mutuelle de Santé'],

      // ── Common result labels ──
      ['Monthly Take-Home Pay', 'Salaire Net Mensuel'],
      ['Annual Take-Home Pay', 'Salaire Net Annuel'],
      ['Effective Tax Rate', "Taux d'Imposition Effectif"],
      ['Total Deductions', 'Total des Déductions'],
      ['Tax Owed', 'Impôt Dû'],
      ['Pension Contribution', 'Cotisation de Pension'],
      ['Health Insurance', 'Assurance Maladie'],
      ['Tax Bands', "Tranches d'Imposition"],
      ['Employer Cost', 'Coût Employeur'],
      ['Chargeable Income', 'Revenu Imposable'],
      ['Tax Payable', 'Impôt Dû'],
      ['Cumulative Tax', 'Impôt Cumulé'],
      ['Cumulative Income', 'Revenu Cumulé'],
      ['Tax-free threshold', "Seuil d'exonération"],
      ['Gross Salary', 'Salaire Brut'],
      ['Net Salary', 'Salaire Net'],
      ['Take-Home Pay', 'Salaire Net'],
      ['Net Pay', 'Salaire Net'],
      ['Tax Rate', "Taux d'imposition"],
      ['Income Tax', "Impôt sur le Revenu"],
      ['Total Tax', 'Impôt Total'],

      // ── Buttons ──
      ['Calculate My Take-Home Pay', 'Calculer mon salaire net'],
      ['Calculate My Net Salary', 'Calculer mon salaire net'],
      ['Calculate My PAYE', 'Calculer mon PAYE'],

      // ── Status / placeholders ──
      ['Search by tool, country, category...', 'Rechercher par outil, pays ou categorie...'],
      ['Search articles... e.g. PAYE, mobile money, import duty', 'Rechercher des articles... ex. PAYE, mobile money, droits de douane'],
      ['Search blog articles', 'Rechercher dans les articles'],
      ['Search all tools', 'Rechercher dans tous les outils'],
      ['Search tools â€” e.g. budget, ROI, meeting cost', 'Rechercher des outils â€” ex. budget, ROI, cout de reunion'],
      ['Search tools â€” e.g. budget, ROI, meeting costâ€¦', 'Rechercher des outils â€” ex. budget, ROI, cout de reunion...'],
      ['Search tools — e.g. budget, ROI, meeting cost', 'Rechercher des outils — ex. budget, ROI, cout de reunion'],
      ['Search tools — e.g. budget, ROI, meeting cost…', 'Rechercher des outils — ex. budget, ROI, cout de reunion...'],
      ['Clear search', 'Effacer la recherche'],
      ['Reset filters', 'Reinitialiser les filtres'],
      ['Sort tools', 'Trier les outils'],
      ['Your@email.com', 'Adresse e-mail'],
      ['your@email.com', 'vous@exemple.com'],
      ['Tax &amp; PAYE', 'Fiscalite &amp; PAYE'],
      ['Business &amp; Legal', 'Entreprise &amp; juridique'],
      ['Tools &amp; Guides', 'Outils &amp; guides'],
      ['🧾 Business', '🧾 Entreprise'],
      ['AfroTools Blog', 'Articles AfroTools'],
      ['Blog highlights', 'Points forts des articles'],
      ['Popular AfroTools calculators', 'Calculateurs AfroTools populaires'],
      ['Featured articles', 'Articles a la une'],
      ['Blog pagination', 'Pagination des articles'],
      ['Email address', 'Adresse e-mail'],
      ['All Tools', 'Tous les outils'],
      ['All AfroTools', 'Tout AfroTools'],
      ['Search Results', 'Resultats de recherche'],
      ['Frequently Asked Questions', 'Questions frequentes'],
      ['Related Articles', 'Articles connexes'],
      ['AfroTools Team', 'Equipe AfroTools'],
      ['Get in touch', 'Contactez-nous'],
      ['Search', 'Rechercher'],
      ['Open', 'Ouvrir'],
      ['Loading...', 'Chargement...'],
      ['Calculating...', 'Calcul en cours...'],
      ['Something went wrong', "Une erreur s'est produite"],
      ['Try Again', 'Réessayer'],
      ['No results found', 'Aucun résultat trouvé'],
      ['Copied!', 'Copié !'],

      // ── AI Advisor ──
      ['What are the Ghana GRA PAYE tax bands for 2026?', 'Quelles sont les tranches PAYE GRA au Ghana pour 2026 ?'],
      ['What is SSNIT Tier III and how does it reduce tax?', "Qu'est-ce que le niveau III SSNIT et comment reduit-il l'impot ?"],
      ["What is the employer's total cost in Ghana?", 'Quel est le cout total employeur au Ghana ?'],
      ['What is the tax-free threshold in Ghana?', 'Quel est le seuil non imposable au Ghana ?'],
      ['What is SSNIT Tier 2 pension in Ghana?', "Qu'est-ce que la pension SSNIT niveau 2 au Ghana ?"],
      ['What is the difference between gross and net salary in Ghana?', 'Quelle est la difference entre salaire brut et salaire net au Ghana ?'],
      ['What is SHIF and how does it replace NHIF?', "Qu'est-ce que le SHIF et comment remplace-t-il le NHIF ?"],
      ['Is AHL tax-deductible?', "L'AHL est-il deductible fiscalement ?"],
      ['What is the disability exemption?', "Qu'est-ce que l'exoneration handicap ?"],
      ['What are the NSSF Tier I and Tier II rates?', 'Quels sont les taux NSSF niveaux I et II ?'],
      ['What is the pension deduction cap?', 'Quel est le plafond de deduction des pensions ?'],
      ['How does mortgage interest deduction work?', 'Comment fonctionne la deduction des interets de pret immobilier ?'],
      ['What is the personal relief of KES 2,400/month?', "Qu'est-ce que l'abattement personnel de 2 400 KES par mois ?"],
      ['What are the Rwanda PAYE tax bands for 2025/26?', 'Quelles sont les tranches PAYE du Rwanda pour 2025/26 ?'],
      ['What is the maternity leave contribution?', "Qu'est-ce que la cotisation de conge maternite ?"],
      ['When must employers remit PAYE to RRA?', 'Quand les employeurs doivent-ils reverser le PAYE a la RRA ?'],
      ['What are the new PAYE tax bands for 2026?', 'Quelles sont les nouvelles tranches PAYE pour 2026 ?'],
      ['What happened to CRA under the new tax law?', "Qu'est-il arrive au CRA avec la nouvelle loi fiscale ?"],
      ['When does the Nigeria Tax Act take effect?', 'Quand la loi fiscale nigeriane entre-t-elle en vigueur ?'],
      ['Is there a minimum tax in Nigeria?', 'Existe-t-il un impot minimum au Nigeria ?'],
      ['Why is my effective tax rate lower than the top bracket?', 'Pourquoi mon taux effectif est-il inferieur a la tranche la plus elevee ?'],
      ['Can I do a net-to-gross calculation?', 'Puis-je faire un calcul net vers brut ?'],
      ['What is the employer cost for hiring in Nigeria?', 'Quel est le cout employeur pour recruter au Nigeria ?'],
      ['What is the effective vs marginal tax rate?', 'Quelle est la difference entre taux effectif et taux marginal ?'],
      ['What is CRA under PITA?', "Qu'est-ce que le CRA sous le regime PITA ?"],
      ['What is the current import duty rate on cars in Nigeria?', 'Quel est le taux actuel des droits de douane sur les voitures au Nigeria ?'],
      ['Can I import goods duty-free into Nigeria?', 'Puis-je importer des marchandises en franchise de droits au Nigeria ?'],
      ['When should I compare against remittance products?', "Quand comparer avec les produits de transfert d'argent ?"],
      ['What are the South Africa tax brackets for 2025/26?', "Quelles sont les tranches d'impot en Afrique du Sud pour 2025/26 ?"],
      ['What is the tax threshold in South Africa for 2025/26?', "Quel est le seuil d'impot en Afrique du Sud pour 2025/26 ?"],
      ['How do medical tax credits work in South Africa?', "Comment fonctionnent les credits d'impot medical en Afrique du Sud ?"],
      ['How much can I contribute to retirement tax-free?', "Combien puis-je cotiser a la retraite sans impot ?"],
      ['GRA PAYE schedule and Ghana salary tax guidance', 'Bareme PAYE GRA et guide fiscal des salaires au Ghana'],
      ['GRA PAYE schedule, SSNIT, and Ghana salary after tax', 'Bareme PAYE GRA, SSNIT et salaire net au Ghana'],
      ['Use the calculator', 'Utiliser le calculateur'],
      ['Calculate Ghana PAYE and take-home pay', 'Calculer le PAYE et le salaire net au Ghana'],
      ['Is this the official GRA PAYE schedule?', 'Est-ce le bareme officiel PAYE GRA ?'],
      ['Tax regime selection', 'Selection du regime fiscal'],
      ['PAYE calculator', 'Calculateur PAYE'],
      ['2025 tax year &middot; CRA applies', 'Annee fiscale 2025 &middot; CRA applicable'],
      ['Includes AI Advisor', 'Inclut le Conseiller IA'],
      ['AI Tax Advisor', 'Conseiller Fiscal IA'],
      ['AI Financial Advisor', 'Conseiller Financier IA'],
      ['AI Advisor', 'Conseiller IA'],
      ['Calculate first to unlock', "Calculez d'abord pour débloquer"],
      ['Calculate your salary first to get personalised AI tax analysis.', "Calculez votre salaire pour obtenir une analyse fiscale IA personnalisée."],
      ['Calculate your salary first', "Calculez d'abord votre salaire"],
      ['Powered by Claude', 'Propulsé par Claude'],
      ['Thinking...', 'Réflexion en cours...'],

      // ── Footer ──
      ['All rights reserved', 'Tous droits réservés'],
      ['Made for Africa, by Africa', "Fait pour l'Afrique, par l'Afrique"],

      // ── PDF modal ──
      ['Enter your email to get a detailed PDF', 'Entrez votre email pour obtenir un PDF détaillé'],
    ];

    // Sort by string length descending so longer phrases match before their substrings
    UI_TRANSLATIONS_FR.sort((a, b) => b[0].length - a[0].length);

    // Split HTML at script/style block boundaries, only translate in non-code segments
    const segments = processed.split(/(<(?:script|style)[^>]*>[\s\S]*?<\/(?:script|style)>)/i);
    processed = segments.map((seg, i) => {
      // Odd-indexed segments are script/style blocks — leave untouched
      if (i % 2 === 1) return seg;
      let s = seg;

      // Replace in element text content (between > and <)
      s = s.replace(/>([^<]+)</g, (match, text) => {
        let t = text;
        for (const [en, fr] of UI_TRANSLATIONS_FR) {
          const escaped = en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          t = t.replace(new RegExp(escaped, 'g'), fr);
        }
        return `>${t}<`;
      });

      // Replace in placeholder, aria-label, and title attribute values
      s = s.replace(/(placeholder|aria-label|title)="([^"]*)"/g, (match, attr, val) => {
        let v = val;
        for (const [en, fr] of UI_TRANSLATIONS_FR) {
          const escaped = en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          v = v.replace(new RegExp(escaped, 'g'), fr);
        }
        return `${attr}="${v}"`;
      });

      return s;
    }).join('');
  }

  const cleanPagePath = pagePath.replace(/^\//, '').replace(/\/$/, '');
  if (lang === 'fr' && /(?:^|\/)[^/]*(?:-paye|salary-tax)$/i.test(cleanPagePath)) {
    processed = applyFrenchPayeFallbacks(processed);
  }

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

  // 13. For French pages: inject share/copy text overrides after <body>
  // This patches the share library's hardcoded English strings at runtime.
  if (lang === 'fr') {
    const frShareOverride = `<script>
window.addEventListener('load', function() {
  // Override share library copy toast text for French pages
  if (window.AfroTools) {
    var _origToast = window.AfroTools.toast;
    if (_origToast && _origToast.success) {
      var _origSuccess = _origToast.success.bind(_origToast);
      _origToast.success = function(msg) {
        if (msg === 'Link copied to clipboard') msg = 'Lien copié !';
        return _origSuccess(msg);
      };
    }
    if (typeof _origToast === 'function') {
      window.AfroTools.toast = function(msg, type) {
        if (msg === 'Link copied!' || msg === 'Link copied to clipboard') msg = 'Lien copié !';
        return _origToast(msg, type);
      };
    }
  }
  // Patch window.open to replace WhatsApp share CTA text for French pages
  var _origOpen = window.open;
  window.open = function(url, target) {
    if (url && typeof url === 'string' && url.startsWith('https://wa.me/?text=')) {
      url = url.replace(encodeURIComponent('Calculate yours FREE \uD83D\uDC47'),
                        encodeURIComponent('Calculez le v\u00F4tre GRATUITEMENT \uD83D\uDC47'));
      url = url.replace(encodeURIComponent('My Result'), encodeURIComponent('Mon r\u00E9sultat'));
    }
    return _origOpen.apply(this, arguments);
  };
});
</script>`;
    processed = processed.replace('<body', frShareOverride + '\n<body');
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

      const hasPageTranslation = translatedPages[lang].has(clean);
      const allowExplicitSourceRebuild = Boolean(flags.overwriteExisting && flags.page);
      if (flags.dryRun && flags.page) {
        logDryRunOutputPlan(pagePath, lang, hasPageTranslation, resolveSourceFile(pagePath));
      }

      // By default, only build pages that have a page-specific translation file.
      // For targeted repair work, allow a single explicit page rebuild from source.
      if (!hasPageTranslation && !allowExplicitSourceRebuild) {
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

        // NEVER overwrite existing translated files unless explicitly asked.
        // A file is "existing" if it's on disk but NOT generated by us
        // (i.e., the page path is NOT in our translatedPages set for this lang).
        // If we have a translation for it, we're the ones who created it — safe to overwrite.
        if (
          fs.existsSync(outputPath) &&
          !translatedPages[lang].has(clean) &&
          !flags.overwriteExisting
        ) {
          totalSkipped++;
          continue;
        }

        const html = fs.readFileSync(sourceFile, 'utf8');
        const processedHtml = processHTML(html, lang, pagePath);

        if (!flags.dryRun) {
          const outputDir = path.dirname(outputPath);
          fs.mkdirSync(outputDir, { recursive: true });
          writeFileWithRetry(outputPath, processedHtml);
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
  writeFileWithRetry(outPath, xml);
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

      const htmlLangMatch = html.match(/<html[^>]*\slang=["']([^"']+)["']/i);
      const sourceLang = htmlLangMatch ? htmlLangMatch[1].toLowerCase() : DEFAULT_LANG;
      const sourceUrl = buildLangUrl(pagePath, DEFAULT_LANG);
      const hreflangBlock = sourceLang !== DEFAULT_LANG && SUPPORTED_LANGS.includes(sourceLang)
        ? [
            `<link rel="alternate" hreflang="${sourceLang}" href="${sourceUrl}" />`,
            `<link rel="alternate" hreflang="x-default" href="${sourceUrl}" />`,
          ].join('\n')
        : generateHreflangTags(pagePath, getAvailableLangs(pagePath));
      html = html.replace('</head>', `${hreflangBlock}\n</head>`);

      writeFileWithRetry(sourceFile, html);
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
      writeFileWithRetry(frFilePath, html);
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
      writeFileWithRetry(frFilePath, html);
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
  node scripts/build-i18n.js --lang fr --page benin/bj-paye --overwrite-existing
                                                Rebuild an existing translated output from source
  node scripts/build-i18n.js --dry-run           Report missing translations
  node scripts/build-i18n.js --validate          Validate JSON key parity
  `);
}
