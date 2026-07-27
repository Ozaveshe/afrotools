'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const home = read('fr/index.html');
const generator = read('scripts/build-french-product-surface.js');
const directory = read('fr/all-tools/index.html');
const styles = read('assets/css/french-home-wave1.css');

assert(/name="afrotools-source-owner" content="scripts\/build-french-product-surface\.js"/.test(home), 'French homepage must remain generator-owned');
assert(/data-registry-count="tools\.locale\.fr\.published"/.test(home), 'French homepage must use the French registry count');
assert(!/data-registry-count="tools\.live_experiences"/.test(home), 'French homepage must not present the global tool count as French coverage');

const featuredRoutes = [
  '/fr/senegal/calculateur-salaire-net',
  '/fr/cote-divoire/calculateur-tva',
  '/fr/tools/generateur-factures/',
  '/fr/tools/convertisseur-devises/'
];
for (const route of featuredRoutes) {
  assert(home.includes(`href="${route}"`), `French homepage must link directly to ${route}`);
}

const schemas = [...home.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
  .map((match) => JSON.parse(match[1]));
const graph = schemas.flatMap((schema) => schema['@graph'] || [schema]);
const pageSchema = graph.find((item) => item['@type'] === 'CollectionPage');
const itemList = graph.find((item) => item['@type'] === 'ItemList');
assert(pageSchema && pageSchema.inLanguage === 'fr', 'French homepage must publish a French CollectionPage');
assert(itemList && itemList.numberOfItems === featuredRoutes.length, 'French homepage ItemList must mirror the four visible featured tools');
assert.deepStrictEqual(
  itemList.itemListElement.map((item) => new URL(item.url).pathname),
  featuredRoutes,
  'French homepage ItemList routes must match the visible featured routes'
);

assert(/property="og:locale" content="fr_FR"/.test(home), 'French homepage must publish the French Open Graph locale');
assert(/property="og:url" content="https:\/\/afrotools\.com\/fr\/"/.test(home), 'French homepage Open Graph URL must match its canonical');
assert(/function hydrateSearchFromUrl\(\)/.test(directory), 'French directory must hydrate the homepage query');
assert(/URLSearchParams\(window\.location\.search\)\.get\('q'\)/.test(directory), 'French directory must consume the q query parameter');
assert(/--fr-ink:\s*var\(--color-text\)/.test(styles), 'French homepage must derive text color from the shared theme');
assert(/background:\s*var\(--color-surface/.test(styles), 'French homepage cards must derive their surface from shared theme tokens');
assert(/current\.includes\(`name="afrotools-source-hash"/.test(generator), 'French surface writer must preserve unchanged post-processed pages');

console.log('French Wave 1 homepage tests passed.');
