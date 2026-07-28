'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const registryApi = require('../scripts/lib/canonical-registry');
const { FRENCH_CATEGORIES } = require('../scripts/lib/french-category-directory');
const parityInventory = require('../reports/french-free-app-parity-inventory.json');

const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const fallbackBlock = (html) => {
  const match = html.match(/<!-- PROGRESSIVE_DIRECTORY_FALLBACK_START -->([\s\S]*?)<!-- PROGRESSIVE_DIRECTORY_FALLBACK_END -->/);
  assert.ok(match, 'progressive directory fallback markers must exist');
  return match[1];
};
const anchorCount = (html) => (html.match(/<a\b[^>]*\bhref=["'][^"']+["']/gi) || []).length;
const routeFile = (route) => path.join(ROOT, route.replace(/^\//, ''), 'index.html');

const registry = registryApi.buildCanonicalRegistry();
const validation = registryApi.validateCanonicalRegistry(registry);
assert.strictEqual(validation.ok, true, validation.errors.map(registryApi.formatIssue).join('\n'));

const frenchPublished = registry.tools.filter((tool) => (
  tool.publicationStatus === 'published'
  && !tool.deprecated
  && tool.indexable
  && tool.localeCoverage.includes('fr')
  && tool.route.startsWith('/fr/')
));
const canonicalFrenchCount = registryApi.getSelector(registry, 'tools.locale.fr.published');
assert.ok(canonicalFrenchCount, 'canonical French published selector must exist');
assert.strictEqual(frenchPublished.length, canonicalFrenchCount.value, 'French discovery must use the same fail-closed registry contract as the named selector');

assert.strictEqual(FRENCH_CATEGORIES.length, 32, 'French discovery must represent all 32 canonical categories');
assert.strictEqual(new Set(FRENCH_CATEGORIES.map((category) => category.key)).size, 32, 'French category keys must be unique');
assert.strictEqual(FRENCH_CATEGORIES.filter((category) => category.nativeHub).length, 17, 'only verified native French hubs receive direct hub links');
assert.strictEqual(FRENCH_CATEGORIES.filter((category) => !category.nativeHub).length, 15, 'missing hubs must remain explicit filtered-directory routes');

FRENCH_CATEGORIES.forEach((category) => {
  assert.ok(category.title && category.description, `${category.key} needs native French discovery copy`);
  if (category.nativeHub) {
    assert.ok(category.href.startsWith('/fr/') && category.href.endsWith('/'), `${category.key} native hub must be a French route`);
    assert.ok(fs.existsSync(routeFile(category.href)), `${category.key} native hub must exist: ${category.href}`);
  } else {
    assert.strictEqual(category.href, `/fr/all-tools/?category=${category.key}`, `${category.key} without a hub must fail closed to its French directory filter`);
  }
});

const categoriesHtml = read('fr/categories/index.html');
const categoriesFallback = fallbackBlock(categoriesHtml);
assert.match(categoriesHtml, /Les 32 catégories d'outils en français/);
assert.match(categoriesHtml, /<div class="hero-ey">32 catégories<\/div>/);
assert.match(categoriesHtml, /"inLanguage":"fr"/);
assert.doesNotMatch(categoriesHtml, /12 catégories|tools available|tools planned|fiches canoniques/i);

const categoryRecords = Array.from(categoriesFallback.matchAll(
  /<a class="cc" href="([^"]+)"[^>]*data-category="([^"]+)"[^>]*data-hub-state="([^"]+)"[^>]*>[\s\S]*?<div class="cc-count">(\d+) fiches françaises publiées<\/div>/g
));
assert.strictEqual(categoryRecords.length, 32, 'no-JavaScript category discovery must expose 32 category records');
const expectedByCategory = new Map(FRENCH_CATEGORIES.map((category) => [
  category.key,
  frenchPublished.filter((tool) => tool.categoryId === category.key).length
]));
categoryRecords.forEach((record) => {
  const [, href, key, state, rawCount] = record;
  const category = FRENCH_CATEGORIES.find((item) => item.key === key);
  assert.ok(category, `unexpected French category record ${key}`);
  assert.strictEqual(href, category.href, `${key} fallback link must match the source map`);
  assert.strictEqual(state, category.nativeHub ? 'native' : 'filtered-directory', `${key} hub state must be explicit`);
  assert.strictEqual(Number(rawCount), expectedByCategory.get(key), `${key} count must include only published French registry rows`);
});
assert.strictEqual(
  categoryRecords.reduce((sum, record) => sum + Number(record[4]), 0),
  frenchPublished.length,
  '32 category counts must reconcile to the canonical French published total'
);

const directoryHtml = read('fr/all-tools/index.html');
const directoryFallback = fallbackBlock(directoryHtml);
const staticCount = directoryFallback.match(/data-static-tool-count="(\d+)"/);
assert.ok(staticCount, 'French all-tools fallback must declare its record count');
assert.strictEqual(Number(staticCount[1]), frenchPublished.length, 'French all-tools fallback count must equal canonical French published rows');
assert.strictEqual(anchorCount(directoryFallback), frenchPublished.length, 'every published French registry row must remain discoverable without JavaScript');

const categoryFilters = Array.from(directoryHtml.matchAll(/class="filter-tab[^"]*" data-filter="([^"]+)"/g))
  .map((match) => match[1])
  .filter((key) => FRENCH_CATEGORIES.some((category) => category.key === key));
assert.deepStrictEqual(new Set(categoryFilters), new Set(FRENCH_CATEGORIES.map((category) => category.key)), 'French all-tools must expose all 32 canonical category filters');
assert.match(directoryHtml, /new URLSearchParams\(window\.location\.search\)\.get\('category'\)/, 'filtered-directory routes must initialize the requested category');
assert.match(directoryHtml, /renderedTools\.length\.toLocaleString\('fr-FR'\) \+ ' sur '/, 'result pagination must use French wording and number formatting');
assert.doesNotMatch(directoryHtml, /Retry directory load|>AI<|>Education<|60 of|HR & Payroll|name:'Energy'|name:'Climate'|name:'Mining'|name:'Security'|All Tools|Popular AfroTools/);

assert.strictEqual(parityInventory.totals.accepted, 0, 'discovery coverage must not create product-parity acceptance credit');

console.log(`French discovery foundation passed: 32 categories, ${frenchPublished.length} published French rows, 0 accepted apps.`);
