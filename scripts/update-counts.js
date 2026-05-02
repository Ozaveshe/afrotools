#!/usr/bin/env node
/**
 * Sync public-facing tool counts from the registry into static HTML surfaces.
 *
 * Why this exists:
 * - Search engines read source HTML, not just runtime DOM updates.
 * - Several EN/FR/SW marketing pages historically drifted to old totals.
 * - Swahili also had duplicated registry script tags with an older cache key.
 *
 * Usage:
 *   node scripts/update-counts.js
 *   node scripts/update-counts.js --write
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const WRITE = process.argv.includes('--write');
const REGISTRY_PATH = path.join(ROOT, 'assets', 'js', 'components', 'tool-registry.js');

function loadRegistryStats() {
  const code = fs.readFileSync(REGISTRY_PATH, 'utf8');

  function FakeEvent() {}

  const sandbox = {
    window: {},
    CustomEvent: FakeEvent,
    document: {
      readyState: 'complete',
      getElementById: () => null,
      createElement: () => ({ textContent: '', style: {}, appendChild() {} }),
      head: { appendChild() {} },
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent() {},
      querySelector: () => null
    }
  };

  vm.runInNewContext(code, sandbox, { filename: 'tool-registry.js' });

  if (typeof sandbox.getPublicToolStats === 'function') {
    return {
      en: sandbox.getPublicToolStats('en'),
      fr: sandbox.getPublicToolStats('fr'),
      sw: sandbox.getPublicToolStats('sw')
    };
  }

  const live = (sandbox.AFRO_TOOLS || []).filter((tool) => tool.status === 'live' || tool.status === 'new').length;
  const queued = (sandbox.AFRO_TOOLS || []).filter((tool) => tool.status === 'queued').length;
  const planned = (sandbox.AFRO_TOOLS || []).filter((tool) => tool.status === 'planned').length;
  const categories = Object.keys(sandbox.AFRO_CATEGORIES || {}).length;
  const registryEntries = (sandbox.AFRO_TOOLS || []).length;
  const makeStats = (locale) => {
    const localeId = locale === 'fr' ? 'fr-FR' : locale === 'sw' ? 'sw-TZ' : 'en-US';
    const format = (value, plus) => {
      let text = Number(value || 0).toLocaleString(localeId);
      if (locale === 'fr') text = text.replace(/\u202f/g, ' ');
      return plus ? text + '+' : text;
    };
    return {
      registryEntries,
      liveTools: live,
      queuedTools: queued,
      plannedTools: planned,
      inDevelopmentTools: queued + planned,
      categories,
      display: {
        registryEntries: format(registryEntries, false),
        liveTools: format(live, false),
        liveToolsPlus: format(live, true),
        inDevelopmentTools: format(queued + planned, false),
        categories: format(categories, false)
      }
    };
  };

  return {
    en: makeStats('en'),
    fr: makeStats('fr'),
    sw: makeStats('sw')
  };
}

const stats = loadRegistryStats();
const touched = [];

function readFile(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

function writeFile(relPath, content) {
  fs.writeFileSync(path.join(ROOT, relPath), content, 'utf8');
}

function updateFile(relPath, transform) {
  const original = readFile(relPath);
  const updated = transform(original);
  if (updated !== original) {
    touched.push(relPath);
    if (WRITE) writeFile(relPath, updated);
  }
}

function replaceEnPlusCounts(content) {
  return content.replace(/\b\d{1,3}(?:,\d{3})?\+/g, stats.en.display.liveToolsPlus);
}

function replaceFrPlusCounts(content) {
  return content.replace(/\b\d{1,3}(?:[ ,]\d{3})?\+/g, stats.fr.display.liveToolsPlus);
}

function replaceSwPlusCounts(content) {
  return content.replace(/\b\d{1,3}(?:,\d{3})?\+/g, stats.sw.display.liveToolsPlus);
}

function cleanDuplicateSwRegistryTag(content) {
  return content.replace(
    /<script src="\/assets\/js\/components\/tool-registry\.min\.js\?v=[^"]+" defer><\/script><script src="\/assets\/js\/components\/tool-registry\.min\.js\?v=([^"]+)" defer><\/script>/g,
    '<script src="/assets/js/components/tool-registry.min.js?v=$1" defer></script>'
  );
}

const EN_PLUS_FILES = [
  'about/index.html',
  'categories/index.html',
  'faq/index.html',
  'search/index.html',
  'egypt/index.html',
  'ghana/index.html',
  'kenya/index.html',
  'nigeria/index.html',
  'south-africa/index.html',
  'tanzania/index.html',
  'tools/afrostream/index.html'
];

const FR_PLUS_FILES = [
  'fr/about/index.html',
  'fr/advertise/index.html',
  'fr/all-tools/index.html',
  'fr/categories/index.html',
  'fr/index.html',
  'fr/search/index.html'
];

const SW_PLUS_FILES = [
  'sw/index.html',
  'sw/kuhusu/index.html',
  'sw/nchi/index.html',
  'sw/tools/index.html',
  'sw/zana-zote/index.html'
];

EN_PLUS_FILES.forEach((relPath) => updateFile(relPath, replaceEnPlusCounts));
FR_PLUS_FILES.forEach((relPath) => updateFile(relPath, replaceFrPlusCounts));
SW_PLUS_FILES.forEach((relPath) => updateFile(relPath, replaceSwPlusCounts));

[
  'sw/index.html',
  'sw/mshahara-na-kodi/index.html',
  'sw/mshahara-na-kodi/business-tax/index.html',
  'sw/mshahara-na-kodi/crypto/index.html',
  'sw/mshahara-na-kodi/francophone/index.html',
  'sw/mshahara-na-kodi/fx/index.html',
  'sw/mshahara-na-kodi/paye/index.html',
  'sw/mshahara-na-kodi/payroll/index.html',
  'sw/mshahara-na-kodi/property/index.html',
  'sw/mshahara-na-kodi/savings/index.html',
  'sw/zana-zote/index.html'
].forEach((relPath) => updateFile(relPath, cleanDuplicateSwRegistryTag));

updateFile('index.html', (content) => {
  return content
    .replace(/id="stat-total">[^<]+</, 'id="stat-total">' + stats.en.display.liveToolsPlus + '<')
    .replace(/id="hp-stat-tools">[^<]+</, 'id="hp-stat-tools">' + stats.en.display.liveToolsPlus + '<')
    .replace(/id="home-about-count">[^<]+</, 'id="home-about-count">' + stats.en.display.liveToolsPlus + '<')
    .replace(/id="cats-browse-count">[^<]+</, 'id="cats-browse-count">' + stats.en.display.liveToolsPlus + '<')
    .replace(/placeholder="Search [^"]+ tools\.\.\."/g, 'placeholder="Search ' + stats.en.display.liveToolsPlus + ' tools..."')
    .replace(/id="cats-heading">[^<]+ Tools\. 54 Countries\./, 'id="cats-heading">' + stats.en.display.liveToolsPlus + ' Tools. 54 Countries.');
});

updateFile('all-tools/index.html', (content) => {
  return content
    .replace(/id="statLive">[^<]+</, 'id="statLive">' + stats.en.display.liveToolsPlus + '<')
    .replace(/id="statPlanned">[^<]+</, 'id="statPlanned">' + stats.en.display.inDevelopmentTools + '<')
    .replace(/id="statCategories">[^<]+</, 'id="statCategories">' + stats.en.display.categories + '<')
    .replace(/id="countAll">[^<]+</, 'id="countAll">' + stats.en.display.liveTools + '<')
    .replace(/id="countLive">[^<]+</, 'id="countLive">' + stats.en.display.liveTools + '<');
});

updateFile('advertise/index.html', (content) => {
  return content
    .replace(/>100\+<\/div>\s*<div style="font-size:0\.72rem;color:#6b7280;font-weight:600;">Live Tools</, '>' + stats.en.display.liveToolsPlus + '</div>\n        <div style="font-size:0.72rem;color:#6b7280;font-weight:600;">Live Tools<')
    .replace(/>12<\/div>\s*<div style="font-size:0\.72rem;color:#6b7280;font-weight:600;">Tool Categories</, '>' + stats.en.display.categories + '</div>\n        <div style="font-size:0.72rem;color:#6b7280;font-weight:600;">Tool Categories<');
});

updateFile('tools/index.html', (content) => {
  return content.replace(/placeholder="Search [^"]+ tools\.\.\."/g, 'placeholder="Search ' + stats.en.display.liveToolsPlus + ' tools..."');
});

updateFile('about/index.html', (content) => {
  return content
    .replace(/\b14 categories\b/g, stats.en.display.categories + ' categories')
    .replace(/over \d{1,3}(?:,\d{3})? tools/g, 'over ' + stats.en.display.liveTools + ' tools');
});

updateFile('categories/index.html', (content) => {
  return content.replace(/id="heroToolCount">[^<]+</, 'id="heroToolCount">' + stats.en.display.liveTools + '<');
});

updateFile('faq/index.html', (content) => {
  return content
    .replace(/shared across all [^<]+ pages/g, 'shared across AfroTools public tool surfaces')
    .replace(/metadata for all [^<]+ tools \(both live and planned\)/g, 'metadata for all ' + stats.en.display.registryEntries + ' registry entries');
});

updateFile('fr/all-tools/index.html', (content) => {
  return content
    .replace(/Plus de \d{1,3}(?: \d{3}) outils/g, 'Plus de ' + stats.fr.display.liveTools + ' outils')
    .replace(/plus de \d{1,3}(?: \d{3}) outils/g, 'plus de ' + stats.fr.display.liveTools + ' outils');
});

updateFile('sw/index.html', (content) => {
  return content.replace(/id="hp-stat-categories">[^<]+</, 'id="hp-stat-categories">' + stats.sw.display.categories + '<');
});

updateFile('sw/nchi/index.html', (content) => {
  return content.replace(/hero-stat-val">5<\/div><div class="hero-stat-lbl">Lugha/g, 'hero-stat-val">3</div><div class="hero-stat-lbl">Lugha');
});

console.log('Live tool instances:', stats.en.liveTools, '(' + stats.en.display.liveToolsPlus + ')');
console.log('Total tool instances:', stats.en.totalTools);
console.log('Registry entries:', stats.en.registryEntries);
console.log('Categories:', stats.en.categories);
console.log('Mode:', WRITE ? 'WRITE' : 'DRY RUN');
console.log('Files changed:', touched.length);
if (touched.length) {
  touched.forEach((relPath) => console.log('  ' + relPath));
}
