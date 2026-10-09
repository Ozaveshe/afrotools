const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { inspectRecipeSchemaState } = require('../scripts/audit-afrokitchen-indexability');
const { buildRecipePageHtml } = require('../scripts/generate-afrokitchen-static-pages');
const { loadAfroKitchenEngine, loadRecipeImages } = require('../scripts/lib/afrokitchen-static');

const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '../tools/afrokitchen/seo-manifest.json')));
const engine = loadAfroKitchenEngine();
const images = loadRecipeImages();
const fixture = (slug = 'fisherman-soup-ng') => {
  const recipe = structuredClone(manifest.recipes.find(item => item.slug === slug));
  if (slug === 'fisherman-soup-ng') {
    recipe.slug = 'synthetic-image-free-recipe';
    recipe.route_path = '/tools/afrokitchen/recipes/synthetic-image-free-recipe/';
    recipe.route_url = 'https://afrotools.com' + recipe.route_path;
    recipe.image_url = '/assets/img/kitchen-category-banner.webp';
    recipe.page_image = null;
    recipe.media = [];
  }
  return { recipe, html: buildRecipePageHtml(recipe, manifest, engine, images, { recipes: {} }) };
};
const inspect = ({ recipe, html }) => inspectRecipeSchemaState(recipe, html, images);
const replacePayload = (html, mutate) => html.replace(/(window\.__AK_STATIC_RECIPE = )(.*?)(;<\/script>)/, (_, before, json, after) => {
  const data = JSON.parse(json);
  mutate(data);
  return before + JSON.stringify(data) + after;
});

test('a verified complete recipe awaiting a dish image remains indexable', () => {
  assert.deepEqual(inspect(fixture()), { state: 'awaiting-dish-image', errors: [] });
});
test('a recipe with a dish image retains its required Recipe markup', () => {
  assert.deepEqual(inspect(fixture('jollof-rice-ng')), { state: 'recipe-markup', errors: [] });
});
test('editorial ingredient IDs and record timestamps do not change cooking content', () => {
  const item = fixture();
  item.html = replacePayload(item.html, data => {
    data.ingredients[0].id = 'synthetic-editorial-record';
    data.ingredients[0].created_at = null;
  });
  assert.deepEqual(inspect(item), { state: 'awaiting-dish-image', errors: [] });
});
test('null and zero step durations both represent no countdown timer', () => {
  const item = fixture();
  item.recipe.steps[0].timer_seconds = null;
  item.html = replacePayload(item.html, data => { data.steps[0].timer_seconds = 0; });
  assert.deepEqual(inspect(item), { state: 'awaiting-dish-image', errors: [] });
});
test('a canonical breadcrumb in a JSON-LD graph inherits its valid context', () => {
  const item = fixture();
  item.html = item.html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, (block, json) => {
    const schema = JSON.parse(json);
    if (schema['@type'] !== 'BreadcrumbList') return block;
    delete schema['@context'];
    return '<script type="application/ld+json">' + JSON.stringify({ '@context': 'https://schema.org', '@graph': [schema] }) + '</script>';
  });
  assert.deepEqual(inspect(item), { state: 'awaiting-dish-image', errors: [] });
});

const invalidHtml = [
  ['missing marker', html => html.replace(/<meta name="afrokitchen-schema-blockers"[^>]*>/, '')],
  ['wrong blocker', html => html.replace('content="missing_image"', 'content="missing_ingredients"')],
  ['additional blocker', html => html.replace('content="missing_image"', 'content="missing_image,missing_instructions"')],
  ['duplicate marker', html => html.replace('content="missing_image">', 'content="missing_image"><meta name="afrokitchen-schema-blockers" content="missing_image">')],
  ['noindex', html => html.replace('content="index, follow"', 'content="noindex, follow"')],
  ['missing canonical', html => html.replace(/<link rel="canonical"[^>]*>/, '')],
  ['duplicate canonical', html => html.replace(/(<link rel="canonical"[^>]*>)/, '$1$1')],
  ['wrong canonical', html => html.replace(/(<link rel="canonical" href=")[^"]+/, '$1https://example.test/wrong/')],
  ['malformed JSON-LD', html => html.replace('<script type="application/ld+json">', '<script type="application/ld+json">{broken')],
  ['missing breadcrumb', html => html.replace(/<script type="application\/ld\+json">(?=[\s\S]*?<\/script>)[\s\S]*?<\/script>/, '')],
  ['wrong breadcrumb canonical', html => html.replace(/("item":")https:\/\/afrotools.com\/tools\/afrokitchen\/recipes\/synthetic-image-free-recipe\//, '$1https://example.test/wrong/')],
  ['wrong breadcrumb context', html => html.replace('"@context":"https://schema.org"', '"@context":"https://example.test/invalid"')],
  ['wrong breadcrumb position', html => html.replace('"position":1', '"position":9')],
  ['missing payload', html => html.replace(/<script>window\.__AK_STATIC_RECIPE[\s\S]*?<\/script>/, '')],
  ['malformed payload', html => html.replace('window.__AK_STATIC_RECIPE = {', 'window.__AK_STATIC_RECIPE = {broken')],
  ['changed name', html => replacePayload(html, data => { data.name = 'Synthetic different dish'; })],
  ['missing ingredients', html => replacePayload(html, data => { data.ingredients = []; })],
  ['changed ingredient', html => replacePayload(html, data => { data.ingredients[0].name = 'Synthetic substitute'; })],
  ['changed quantity', html => replacePayload(html, data => { data.ingredients[0].amount += 1; })],
  ['missing instructions', html => replacePayload(html, data => { data.steps = []; })],
  ['changed instruction', html => replacePayload(html, data => { data.steps[0].instruction = 'Synthetic changed instruction'; })],
  ['changed timer', html => replacePayload(html, data => { data.steps[0].timer_seconds += 1; })],
  ['hidden recipe body', html => html.replace(/<body\b[\s\S]*?<script>window\.__AK_STATIC_RECIPE/, '<body><script>window.__AK_STATIC_RECIPE')],
];
for (const [name, change] of invalidHtml) test(`image deferral blocks ${name}`, () => {
  const item = fixture();
  item.html = change(item.html);
  assert.notEqual(inspect(item).state, 'awaiting-dish-image');
  assert.ok(inspect(item).errors.length > 0);
});

for (const [name, change] of [
  ['unpublished recipe', recipe => { recipe.generated_in_wave = false; }],
  ['missing description', recipe => { recipe.description = ''; }],
  ['invalid duration', recipe => { recipe.prep_time_minutes = -1; }],
  ['missing servings', recipe => { recipe.default_servings = 0; }],
  ['incomplete step', recipe => { recipe.steps[0].instruction = ''; }],
]) test(`image deferral blocks source with ${name}`, () => {
  const item = fixture();
  change(item.recipe);
  assert.ok(inspect(item).errors.length > 0);
});

test('an available dish photo cannot use an image-only exemption', () => {
  const item = fixture('jollof-rice-ng');
  item.html = item.html.replace(/<script type="application\/ld\+json">(?=\s*\{\s*"@context"[\s\S]*?"@type":\s*"Recipe")[\s\S]*?<\/script>/, '').replace('</head>', '<meta name="afrokitchen-schema-blockers" content="missing_image"></head>');
  assert.ok(inspect(item).errors.some(error => error.includes('dish image is available')));
});
test('malformed unrelated JSON-LD is blocking even alongside Recipe markup', () => {
  const item = fixture('jollof-rice-ng');
  item.html = item.html.replace('</head>', '<script type="application/ld+json">{broken}</script></head>');
  assert.ok(inspect(item).errors.includes('malformed JSON-LD'));
});
test('duplicate Recipe markup is blocking', () => {
  const item = fixture('jollof-rice-ng');
  item.html = item.html.replace('</head>', '<script type="application/ld+json">{"@type":"Recipe"}</script></head>');
  assert.ok(inspect(item).errors.includes('duplicate Recipe JSON-LD'));
});
