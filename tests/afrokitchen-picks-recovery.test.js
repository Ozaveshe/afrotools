'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const acorn = require('acorn');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'tools/afrokitchen/index.html'), 'utf8');
const homeSource = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(match => match[1]).find(source => source.includes('function readPickedRecipes()'));
const runtime = fs.readFileSync(path.join(root, 'tools/afrokitchen/static-recipe-runtime.js'), 'utf8');
function functions(source) {
  const output = {};
  function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'FunctionDeclaration') output[node.id.name] = source.slice(node.start, node.end);
    for (const value of Object.values(node)) if (Array.isArray(value)) value.forEach(visit); else if (value && typeof value === 'object') visit(value);
  }
  visit(acorn.parse(source, { ecmaVersion: 'latest' })); return output;
}
const home = functions(homeSource), recipe = functions(runtime);
const plain = value => JSON.parse(JSON.stringify(value));

function reader(raw, options = {}) {
  const context = { window: { localStorage: { getItem() { if (options.denied) throw Error('Synthetic denied read'); return raw; } } },
    mealPlannerRecipes: options.catalog === false ? [] : Array.from({ length: 30 }, (_, index) => ({ slug: `recipe-${index}`, name: `Synthetic ${index}` })),
    PICKED_RECIPES_KEY: 'ak_meal_plan_v1', pickedRecipesStorageIssue: '' };
  if (options.getter) Object.defineProperty(context.window, 'localStorage', { get() { throw Error('Synthetic unavailable storage'); } });
  vm.createContext(context); vm.runInContext(home.readPickedRecipes + '\n' + home.pickedRecipesStorageMessage, context);
  const picks = vm.runInContext('readPickedRecipes()', context);
  return { context, picks: plain(picks), issue: context.pickedRecipesStorageIssue, message: vm.runInContext('pickedRecipesStorageMessage()', context) };
}

for (const raw of ['{synthetic corrupt', '', '{}', 'null', '42']) test(`homepage preserves and distinguishes damaged data ${JSON.stringify(raw)}`, () => {
  const result = reader(raw, { catalog: false });
  assert.deepEqual(result.picks, []); assert.equal(result.issue, 'corrupt'); assert.match(result.message, /Clear picks to remove only these picks/);
});
for (const raw of [null, '[]']) test(`homepage distinguishes truly empty picks ${JSON.stringify(raw)}`, () => {
  const result = reader(raw); assert.deepEqual(result.picks, []); assert.equal(result.issue, '');
});
for (const options of [{ denied: true }, { getter: true }]) test(`homepage read denial is distinct from corruption ${JSON.stringify(options)}`, () => {
  const result = reader('[{"slug":"recipe-0"}]', options);
  assert.equal(result.issue, 'unavailable'); assert.match(result.message, /storage access/); assert.doesNotMatch(result.message, /Clear picks/);
});
test('homepage keeps existing21-entry scan, published-slug filtering and deduplication', () => {
  const items = [{ slug: 'recipe-0' }, { slug: 'recipe-0' }, null, { slug: '__proto__' }, ...Array.from({ length: 25 }, (_, i) => ({ slug: `recipe-${i + 1}` }))];
  const result = reader(JSON.stringify(items));
  assert.equal(result.issue, ''); assert.deepEqual(result.picks.map(item => item.slug), ['recipe-0', ...Array.from({ length: 17 }, (_, i) => `recipe-${i + 1}`)]);
});

function staticPage(raw, options = {}) {
  let stored = raw, status = '';
  const writes = [], links = [];
  const storage = { getItem() { if (options.readDenied) throw Error('Synthetic read denied'); return stored; }, setItem(key, value) {
    writes.push({ key, value }); if (options.writeDenied) throw Error('Synthetic write denied'); stored = value;
  } };
  const document = { getElementById() { return { appendChild(node) { links.push(node); } }; }, createElement() { return { setAttribute(name, value) { this[name] = value; } }; } };
  const window = { localStorage: options.absent ? null : storage, document, location: { pathname: '/tools/afrokitchen/recipes/jollof-rice-ng/' } };
  if (options.getterDenied) Object.defineProperty(window, 'localStorage', { get() { throw Error('Synthetic storage getter denied'); } });
  const context = { e: window, t: document, n: { slug: 'jollof-rice-ng', name: 'Jollof Rice', country_name: 'Nigeria', country_code: 'NG', category: options.idea ? 'drink' : 'main' },
    s: { servings: 7 }, r: 'ak_meal_plan_v1', S(message) { status = message; links.length = 0; }, M() { return !options.idea; } };
  vm.createContext(context); vm.runInContext(recipe.k + '\n' + recipe.showPickedRecipeRecovery, context);
  return { run() { vm.runInContext('k()', context); }, clear() { stored = null; }, result() { return { stored, status, writes, links }; } };
}
for (const raw of ['{synthetic corrupt', '', '{}', 'null']) test(`recipe Add preserves damaged picks and exposes explicit recovery ${JSON.stringify(raw)}`, () => {
  const page = staticPage(raw); page.run(); const result = page.result();
  assert.equal(result.stored, raw); assert.deepEqual(result.writes, []); assert.match(result.status, /choose Clear picks/);
  assert.equal(result.links.length, 1); assert.equal(result.links[0].href, '/tools/afrokitchen/#ak-picked-recipes'); assert.equal(result.links[0]['data-ak-picks-recovery'], '');
  page.clear(); page.run(); assert.equal(page.result().writes.length, 1); assert.equal(JSON.parse(page.result().stored)[0].slug, 'jollof-rice-ng');
});
for (const options of [{ readDenied: true }, { getterDenied: true }]) test(`recipe read denial does not claim corruption or write ${JSON.stringify(options)}`, () => {
  const page = staticPage('[]', options); page.run(); const result = page.result();
  assert.equal(result.stored, '[]'); assert.deepEqual(result.writes, []); assert.match(result.status, /could not read/); assert.deepEqual(result.links, []);
});
for (const idea of [false, true]) test(`recipe denied write preserves existing data and main/idea feedback ${idea}`, () => {
  const initial = '[{"slug":"recipe-0","servings":4}]', page = staticPage(initial, { writeDenied: true, idea }); page.run();
  assert.equal(page.result().stored, initial); assert.equal(page.result().writes.length, 1);
  assert.equal(page.result().status, idea ? 'Could not save this recipe idea.' : 'Could not save this recipe to the meal plan.'); assert.deepEqual(page.result().links, []);
});
for (const idea of [false, true]) test(`valid Add keeps main/idea records, ordering, deduplication and21limit ${idea}`, () => {
  const originals = [{ slug: 'jollof-rice-ng', servings: 2 }, ...Array.from({ length: 25 }, (_, i) => ({ slug: `recipe-${i}`, custom: `kept-${i}` }))];
  const page = staticPage(JSON.stringify(originals), { idea }); page.run(); const result = page.result(), stored = JSON.parse(result.stored);
  assert.equal(stored.length, 21); assert.deepEqual(stored.slice(1), originals.slice(1, 21));
  assert.deepEqual(Object.keys(stored[0]).sort(), ['added_at', 'category', 'country_code', 'country_name', 'name', 'servings', 'slug', 'url']);
  assert.equal(stored[0].servings, 7); assert.equal(stored[0].category, idea ? 'drink' : 'main'); assert.ok(Number.isFinite(Date.parse(stored[0].added_at)));
  assert.equal(result.links[0].href, idea ? '/tools/afrokitchen/#browse-panel' : '/tools/afrokitchen/#cook-this-week');
});
test('absent browser storage is reported without a recovery link or write', () => {
  const page = staticPage(null, { absent: true }); page.run(); assert.equal(page.result().status, 'Recipe storage is not available in this browser.'); assert.deepEqual(page.result().writes, []);
});


function fragmentPage(options = {}) {
  const listeners = new Map(), frames = [], scrolls = [];
  const panel = { isConnected: true, hidden: false, getClientRects: () => [{}], scrollIntoView(value) { scrolls.push(plain(value)); } };
  const window = { location: { hash: '#ak-picked-recipes' },
    addEventListener(type, callback) { if (!listeners.has(type)) listeners.set(type, new Set()); listeners.get(type).add(callback); },
    removeEventListener(type, callback) { listeners.get(type)?.delete(callback); },
    requestAnimationFrame(callback) { frames.push(callback); } };
  const document = { readyState: options.loaded ? 'complete' : 'interactive', getElementById: () => panel };
  const context = { window, document, pickedRecipesCatalogReady: !!options.catalog,
    pickedRecipesFragment: { started: false, initialScheduled: false, finalScheduled: false, waitingLoad: false, cancelled: false, finished: false } };
  vm.createContext(context);
  vm.runInContext(['cancelPickedRecipesFragment', 'stopPickedRecipesFragmentListeners', 'checkPickedRecipesFragmentHash', 'revealPickedRecipesFragment'].map(name => home[name]).join('\n'), context);
  return { context, panel, scrolls, listeners,
    render() { vm.runInContext('revealPickedRecipesFragment()', context); },
    event(type, trusted = true) { for (const callback of [...(listeners.get(type) || [])]) callback({ isTrusted: trusted }); },
    loaded() { document.readyState = 'complete'; this.event('load'); },
    catalog() { context.pickedRecipesCatalogReady = true; this.render(); },
    frame() { for (const callback of frames.splice(0)) callback(); } };
}

test('recovery fragment waits for loaded styles, then aligns once after initial catalog layout', () => {
  const page = fragmentPage(); page.render(); page.frame(); assert.equal(page.scrolls.length, 0);
  page.loaded(); page.frame(); assert.deepEqual(page.scrolls, [{ block: 'start', behavior: 'instant' }]);
  page.render(); page.frame(); assert.equal(page.scrolls.length, 1);
  page.catalog(); page.frame(); assert.equal(page.scrolls.length, 2);
  page.render(); page.catalog(); page.frame(); assert.equal(page.scrolls.length, 2);
  assert.equal(page.context.pickedRecipesFragment.finished, true);
  assert.equal([...page.listeners.values()].reduce((sum, callbacks) => sum + callbacks.size, 0), 0);
});
test('catalog ready before page load needs only one recovery alignment', () => {
  const page = fragmentPage({ catalog: true }); page.render(); page.loaded(); page.frame();
  assert.equal(page.scrolls.length, 1); page.render(); page.frame(); assert.equal(page.scrolls.length, 1);
});
for (const type of ['wheel', 'keydown', 'pointerdown', 'touchstart']) test('trusted ' + type + ' takes over before delayed catalog alignment', () => {
  const page = fragmentPage({ loaded: true }); page.render(); page.frame(); page.event(type); page.catalog(); page.frame();
  assert.equal(page.scrolls.length, 1); assert.equal(page.context.pickedRecipesFragment.cancelled, true);
});
test('untrusted events do not cancel real recovery navigation intent', () => {
  const page = fragmentPage({ loaded: true }); page.render(); page.frame(); page.event('wheel', false); page.catalog(); page.frame();
  assert.equal(page.scrolls.length, 2);
});
for (const change of ['hash', 'hidden', 'disconnected']) test('queued recovery alignment is canceled when target becomes ' + change, () => {
  const page = fragmentPage({ loaded: true }); page.render();
  if (change === 'hash') { page.context.window.location.hash = '#browse-panel'; page.event('hashchange'); }
  if (change === 'hidden') page.panel.hidden = true;
  if (change === 'disconnected') page.panel.isConnected = false;
  page.frame(); page.catalog(); page.frame(); assert.equal(page.scrolls.length, 0);
  assert.equal(page.context.pickedRecipesFragment.cancelled, true);
});
