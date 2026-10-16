"use strict";
const test = require("node:test"), assert = require("node:assert/strict");
const fs = require("node:fs"), path = require("node:path"), vm = require("node:vm");
const { buildRecipeIndex, projectPublicationEvidence, writeRecipeIndex } = require("../scripts/lib/afrokitchen-recipe-index");
const root = path.join(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const id = "11111111-1111-4111-8111-111111111111";
const eligible = extra => ({ id, slug: "test-dish", name: "Test dish", country_code: "NG", generated_in_wave: true, is_published: true, is_verified: true, ingredients: [], ...extra });
const mixed = () => [eligible(), ...[false, null, undefined, "true", 1].map((flag, i) => eligible({ id: "bad" + i, slug: "bad" + i, is_published: flag })), eligible({ id: "unverified", is_verified: false })];
function engine(options = {}, file = "engines/src/afrokitchen-engine.js") {
  const calls = [], context = { console: { warn() {} }, Promise, Date, AbortController, setTimeout, clearTimeout, ...options.globals };
  const auth = options.client ? { getSupabase: () => options.client } : undefined;
  context.AfroAuth = auth;
  context.window = { navigator: { onLine: options.online !== false }, AfroAuth: auth, fetch: async (...args) => {
    calls.push(args); return options.fetch ? options.fetch(...args) : { ok: true, json: async () => options.index || { version: 2, recipes: [eligible()] } };
  }};
  vm.runInNewContext(read(file), context);
  return { api: context.AfroKitchenEngine, calls, context };
}
function clientFor(data, detail = false) {
  const filters = [], tables = [];
  const client = { from(table) {
    tables.push(table);
    const query = { select() { return this; }, eq(k, v) { filters.push([table, k, v]); return this; }, order() { return this; }, limit() { return this; }, in() { return this; }, contains() { return this; }, or() { return this; },
      maybeSingle() { return Promise.resolve({ data, error: null }); }, then(resolve) { return Promise.resolve({ data: table === "recipes" ? data : [], error: null }).then(resolve); } };
    return query;
  }, rpc() { return Promise.resolve(); } };
  return { client, filters, tables };
}

test("source and paired served engine preserve the same fail-closed, retry, and low-data detail contracts", async () => {
  for (const file of ["engines/src/afrokitchen-engine.js", "engines/afrokitchen-engine.js"]) {
    let index = { version: 1, recipes: [eligible()] };
    const instance = engine({ online: false, fetch: async () => ({ ok: true, json: async () => index }) }, file);
    assert.equal(instance.api.isPublicationUnavailable(await instance.api.fetchRecipes({ search: "dish" })), true, file);
    index = { version: 2, recipes: [eligible()] };
    instance.api.retryPublication();
    const rows = await instance.api.fetchRecipes({ country: "NG" });
    assert.equal(rows.length, 1, file); assert.equal(rows[0].id, id, file);
    const reads = instance.calls.length;
    assert.equal((await instance.api.checkRecipePublication(eligible())).kind, "eligible", file);
    assert.equal((await instance.api.checkRecipePublication(eligible({ is_published: false }))).kind, "withheld", file);
    assert.equal(instance.calls.length, reads, file + " new explicit static payload does not fetch the full index");
    const sdk = clientFor(mixed());
    const fallback = engine({ client: sdk.client, fetch: async () => ({ ok: false }) }, file);
    assert.equal((await fallback.api.fetchRecipes({})).length, 1, file);
    assert.ok(sdk.filters.some(row => row[1] === "is_published" && row[2] === true), file);
    assert.ok(sdk.filters.some(row => row[1] === "is_verified" && row[2] === true), file);
  }
});

test("index requires explicit published AND verified flags, carries them, and refuses an unknown-status write", () => {
  const index = buildRecipeIndex({ generated_at: "original", recipes: mixed() });
  assert.equal(index.version, 2); assert.equal(index.recipes.length, 1);
  assert.equal(index.recipes[0].is_published, true); assert.equal(index.recipes[0].is_verified, true);
  assert.throws(() => writeRecipeIndex({ recipes: mixed() }, "never-written.json"), /Publication flags missing/);
  assert.equal(fs.existsSync("never-written.json"), false);
});

test("eligibility projection joins exact IDs and slugs and preserves content/history without guessing flags", () => {
  const manifest = { generated_at: "original-date", recipes: [eligible({ is_published: undefined, description: "unchanged" })], countries: [], collections: [] };
  delete manifest.recipes[0].is_published;
  const snapshot = { kind: "CONFIGURED_AFROTOOLS_READONLY_PUBLIC_RECIPE_ELIGIBILITY_SNAPSHOT", projectUrl: "https://zpclagtgczsygrgztlts.supabase.co", projectVerifiedBeforeQuery: true, observedAt: "2026-10-16T10:57:12Z", count: 1, records: [eligible()] };
  const result = projectPublicationEvidence(manifest, snapshot, Buffer.from(JSON.stringify(snapshot)));
  assert.equal(result.recipes[0].description, "unchanged"); assert.equal(result.generated_at, "original-date"); assert.equal(result.recipes[0].is_published, true);
  assert.equal(Object.hasOwn(manifest.recipes[0], "is_published"), false);
  for (const mutate of [s => s.records[0].id = "wrong", s => s.records[0].slug = "wrong", s => s.records[0].is_published = null, s => s.records.push(s.records[0]), s => s.projectUrl = "https://wrong.supabase.co"]) {
    const bad = structuredClone(snapshot); mutate(bad); assert.throws(() => projectPublicationEvidence(manifest, bad, Buffer.from("bad")));
  }
  assert.throws(() => projectPublicationEvidence({ ...manifest, recipes: [eligible({ is_published: false })] }, snapshot, Buffer.from("bad")), /existing status differs/);
});

test("actual public API list/get require both query flags and reject an upstream non-public row before children", async () => {
  let returned = mixed(), calls = [];
  const context = { exports: {}, process: { env: { SUPABASE_ANON_KEY: "synthetic-test-key" } }, fetch: async url => {
    calls.push(url); return { ok: true, json: async () => returned };
  }};
  vm.runInNewContext(read("netlify/functions/afrokitchen-recipes.js"), context);
  const run = action => context.exports.handler({ httpMethod: "GET", headers: {}, queryStringParameters: { action, slug: "test-dish" } });
  assert.equal(JSON.parse((await run("list")).body).length, 1);
  assert.match(calls[0], /is_published=eq.true&is_verified=eq.true/);
  for (const flag of [false, null, undefined, "true", 1]) {
    returned = [eligible({ is_published: flag })]; calls = [];
    assert.equal((await run("get")).statusCode, 404); assert.equal(calls.length, 1);
    assert.match(calls[0], /is_published=eq.true&is_verified=eq.true/);
  }
});

test("version1/missing/null index data becomes unavailable, retains status through filters and explicit retry recovers", async () => {
  let index = { version: 1, recipes: [eligible()] };
  const e = engine({ online: false, fetch: async () => ({ ok: true, json: async () => index }) });
  for (const filter of [{}, { country: "NG", search: "dish", ids: [id], limit: 1 }]) {
    assert.equal(e.api.isPublicationUnavailable(await e.api.fetchRecipes(filter)), true);
  }
  index = { version: 2, recipes: [eligible({ is_published: null })] };
  assert.equal(e.api.isPublicationUnavailable(await e.api.fetchRecipes({})), true);
  index = { version: 2, recipes: [eligible()] }; e.api.retryPublication();
  assert.equal((await e.api.fetchRecipes({ country: "NG" })).length, 1);
  index = { version: 2, recipes: [] }; e.api.retryPublication();
  const empty = await e.api.fetchRecipes({}); assert.equal(empty.length, 0); assert.equal(e.api.isPublicationUnavailable(empty), false);
});

test("actual engine DB fallback and cache recheck false flags and do not resurrect legacy seeds", async () => {
  const db = clientFor(mixed());
  const e = engine({ client: db.client, index: { version: 1, recipes: [] } });
  const rows = await e.api.fetchRecipes({}); assert.equal(rows.length, 1);
  assert.ok(db.filters.some(x => x[1] === "is_published" && x[2] === true));
  assert.ok(db.filters.some(x => x[1] === "is_verified" && x[2] === true));
  rows[0].is_published = false;
  assert.equal((await e.api.fetchRecipes({})).length, 0, "cached row with explicit false cannot reappear");
  const offline = engine({ online: false, index: { version: 1, recipes: [] } });
  assert.equal(offline.api.isPublicationUnavailable(await offline.api.fetchRecipes({})), true);
  assert.equal(offline.api.isPublicationUnavailable(await offline.api.fetchRecipeBySlug(offline.api.SEED_RECIPES[0].slug)), true);
});

test("concurrent invalid-index reads coalesce; settled failure can retry without stale inflight state", async () => {
  let release;
  const e = engine({ online: false, fetch: () => new Promise(resolve => { release = resolve; }) });
  const a = e.api.fetchRecipes({}), b = e.api.fetchRecipes({ country: "NG" });
  await Promise.resolve(); assert.equal(e.calls.length, 1);
  release({ ok: false });
  assert.equal(e.api.isPublicationUnavailable(await a), true); assert.equal(e.api.isPublicationUnavailable(await b), true);
  e.context.window.fetch = async () => ({ ok: true, json: async () => ({ version: 2, recipes: [eligible()] }) });
  assert.equal((await e.api.fetchRecipes({})).length, 1);
});

test("index header/body wait has one bounded budget, aborts and leaves retry possible", async () => {
  for (const phase of ["headers", "body"]) {
    let fire, signal;
    const e = engine({ online: false, globals: { setTimeout(fn, ms) { assert.equal(ms, 8000); fire = fn; return 1; }, clearTimeout() {} }, fetch: (_url, options) => {
      signal = options.signal;
      return phase === "headers" ? new Promise(() => {}) : Promise.resolve({ ok: true, json: () => new Promise(() => {}) });
    }});
    const pending = e.api.fetchRecipes({}); await Promise.resolve(); fire();
    assert.equal(e.api.isPublicationUnavailable(await pending), true); assert.equal(signal.aborted, true);
  }
});

test("new static payload uses data-light explicit fastpath; legacy needs unanimous UUIDs plus exact approved index ID+slug", async () => {
  const e = engine();
  assert.equal((await e.api.checkRecipePublication(eligible())).kind, "eligible"); assert.equal(e.calls.length, 0);
  assert.equal((await e.api.checkRecipePublication(eligible({ is_published: false }))).kind, "withheld"); assert.equal(e.calls.length, 0);
  assert.equal((await e.api.checkRecipePublication(eligible({ is_published: null }))).kind, "unavailable"); assert.equal(e.calls.length, 0);
  const legacy = { slug: "test-dish", ingredients: [{ recipe_id: id }], steps: [{ recipe_id: id }] };
  assert.equal((await e.api.checkRecipePublication(legacy)).kind, "eligible"); assert.equal(e.calls.length, 1);
  assert.equal((await e.api.checkRecipePublication({ ...legacy, steps: [{ recipe_id: "different" }] })).kind, "unavailable");
  assert.equal((await e.api.checkRecipePublication({ ...legacy, id: "different" })).kind, "unavailable");
  assert.equal((await e.api.checkRecipePublication({ ...legacy, slug: "other-dish" })).kind, "withheld");
});

test("detail fallback never returns an explicit false row or seed with only a slug match", async () => {
  const db = clientFor(eligible({ is_published: false }), true);
  const e = engine({ client: db.client });
  assert.equal(await e.api.fetchRecipeBySlug("test-dish"), null); assert.deepEqual(db.tables, ["recipes"]);
  const offline = engine({ online: false });
  const seed = offline.api.SEED_RECIPES[0]; seed.slug = "test-dish";
  assert.equal(offline.api.isPublicationUnavailable(await offline.api.fetchRecipeBySlug("test-dish")), true);
  seed.id = id; delete seed.is_published; delete seed.is_verified;
  const approved = await offline.api.fetchRecipeBySlug("test-dish"); assert.equal(approved.is_published, true); assert.equal(approved.is_verified, true);
  seed.is_published = false;
  assert.equal(offline.api.isPublicationUnavailable(await offline.api.fetchRecipeBySlug("test-dish")), true);
});

// Execute the actual three caller functions with minimal synthetic DOMs. This
// exercises their early unavailable branch before any saved/search/filter chain.
function node() {
  const children = {}, value = { style: {}, attributes: {}, textContent: "original", innerHTML: "original", value: "recommended", hidden: false,
    children, appendChild(child) { children[child.id || "child"] = child; }, setAttribute(k, v) { this.attributes[k] = v; }, querySelector(selector) { return children[selector] || (children[selector] = node()); }, addEventListener() {} };
  return value;
}
test("actual landing/country/collection callers recover from unavailable to populated without an empty message, then genuine empty", async () => {
  for (const name of ["index", "country", "collection"]) {
    const source = read("tools/afrokitchen/" + name + ".html"), elements = {};
    const get = id => id === "ak-publication-retry" ? elements[id] || null : elements[id] || (elements[id] = node());
    get("recipes-empty").appendChild = child => { elements[child.id] = child; };
    const document = { getElementById: get, createElement: () => node(), querySelector: () => node(), querySelectorAll: () => [] };
    const status = []; Object.defineProperty(status, "publicationUnavailable", { value: true }); let rows = status, retried = 0;
    const ownedCollection = Object.freeze({ slug: "x", name: "Test collection", recipe_ids: Object.freeze([id]) });
    const AK = { COUNTRIES: { NG: { flag: "NG" } }, isPublicationUnavailable: x => !!x.publicationUnavailable, retryPublication() { retried++; }, fetchRecipes: async () => rows, fetchCollections: async () => [ownedCollection] };
    const start = source.indexOf("  function showPublicationState"), end = source.indexOf("  async function", start);
    let code = source.slice(start, end);
    const functionName = name === "index" ? "loadRecipes" : "load";
    const from = source.indexOf("  async function " + functionName + "()"), to = name === "index" ? source.indexOf("  // ── Featured recipe", from) : source.indexOf("\n  catSelect.addEventListener", from);
    code += source.slice(from, name === "collection" ? source.indexOf("\n  load();", from) : to);
    const context = { document, AK, AKRoutes: { recipe: slug => "/recipes/" + slug }, AKImages: { createCardSlotMarkup: () => "", hydrate() {} }, categoryLabel: () => "Main", country: { flag: "NG", name: "Nigeria" }, renderRecipeGrid: recipes => { get("recipes-grid").innerHTML = "populated:" + recipes.length; }, slug: "x", code: "NG", catSelect: { value: "" }, diffSelect: { value: "" }, recipeRequestId: 0, currentRecipes: [], savedOnly: true, visibleRecipeCount: 0, PAGE_SIZE: 12,
      getFilters: () => ({}), updateMoreButton() {}, updateResultsSummary() {}, resultsSummary: node(), retryRecipePublication() {}, window: { localStorage: { setItem() { throw Error("user storage must not change"); }, removeItem() { throw Error("user storage must not change"); }, clear() { throw Error("user storage must not change"); } }, AfroKitchenCookbook: { read() { throw Error("must not reach saved derivation while unavailable"); } } } };
    if (name === "index") {
      const retryStart = source.indexOf("  function retryRecipePublication()");
      code += source.slice(retryStart, source.indexOf("  // ── Init", retryStart));
      context.loadLandingMeta = async () => { context.mealPlannerCatalogReady = true; };
      context.loadFeatured = async () => {};
      context.revealPickedRecipesFragment = () => {};
    }
    vm.createContext(context); vm.runInContext(code + ";this.run=" + functionName, context);
    await context.run(); assert.match(get("recipes-empty").querySelector("h3").textContent, /availability could not be checked/);
    assert.equal(get("recipes-loading").style.display, "none");
    const retry = get("ak-publication-retry"); assert.equal(retry.hidden, false);
    rows = [eligible()]; context.savedOnly = false;
    await retry.onclick();
    assert.equal(get("recipes-empty").style.display, "none", name + " hides prior empty/unavailable panel when recipes render");
    assert.equal(retry.hidden, true); assert.equal(retry.style.display, "none");
    rows = status; await context.run();
    assert.equal(get("recipes-empty").style.display, "", name + " still shows a later unavailable state");
    rows = [];
    await retry.onclick(); assert.doesNotMatch(get("recipes-empty").querySelector("h3").textContent, /availability could not be checked/);
    assert.equal(get("recipes-empty").style.display, "", name + " shows genuine empty after successful recovery");
    assert.equal(retried, 2); assert.equal(retry.hidden, true); assert.equal(retry.style.display, "none");
    assert.deepEqual(ownedCollection.recipe_ids, [id], "unknown and genuine empty collection results retain selected IDs");
  }
});

test("unknown/empty/withdrawn recipe lookups and derived-cache retry preserve actual saved picks, plans, notes and history", async () => {
  const storage = new Map([
    ["ak_meal_plan_v1", JSON.stringify([{ slug: "test-dish" }])],
    ["ak_saved_plan_v1", JSON.stringify({ version: 1, slugs: ["test-dish"], inputs: { days: 3, maxTime: 45, servings: 2, diet: "", country: "", occasion: "" } })],
    ["ak_cookbook_v1", '["test-dish"]'], ["notes", "user note"], ["history", "user history"]
  ]);
  const before = JSON.stringify([...storage]); let writes = 0;
  const localStorage = { getItem: key => storage.get(key) ?? null, setItem() { writes++; }, removeItem() { writes++; }, clear() { writes++; } };
  for (const file of ["engines/src/afrokitchen-engine.js", "engines/afrokitchen-engine.js"]) {
    let index = { version: 1, recipes: [eligible()] };
    const instance = engine({ online: false, fetch: async () => ({ ok: true, json: async () => index }) }, file);
    instance.context.window.localStorage = localStorage;
    assert.equal(instance.api.isPublicationUnavailable(await instance.api.fetchRecipes({ ids: [id] })), true);
    assert.equal((await instance.api.fetchRecipeBySlug("test-dish")).publicationUnavailable, true);
    instance.api.retryPublication(); index = { version: 2, recipes: [] };
    assert.equal((await instance.api.fetchRecipes({ ids: [id] })).length, 0);
    assert.equal((await instance.api.checkRecipePublication(eligible({ is_published: false }))).kind, "withheld");
  }
  const source = read("tools/afrokitchen/index.html");
  const slice = (from, to) => source.slice(source.indexOf("  function " + from), source.indexOf("  function " + to));
  const restoreStart = source.indexOf("  async function restoreSavedPlan()"), restoreEnd = source.indexOf("  function matchesPlan", restoreStart);
  const context = { window: { localStorage }, PICKED_RECIPES_KEY: "ak_meal_plan_v1", SAVED_PLAN_KEY: "ak_saved_plan_v1", mealPlannerRecipes: [], planGenerationRevision: 0,
    AK: { DIETS: [], COUNTRIES: {} }, renderPlanEmpty() {}, setPlanStatus() {} };
  vm.createContext(context);
  vm.runInContext(slice("readPickedRecipes()", "pickedRecipesStorageMessage()") + slice("readSavedPlan()", "updateSavedPlanControls()") + source.slice(restoreStart, restoreEnd), context);
  assert.equal(context.readPickedRecipes().length, 0); await context.restoreSavedPlan();
  context.mealPlannerRecipes = [eligible({ slug: "another-dish" })];
  await context.restoreSavedPlan();
  assert.equal(writes, 0); assert.equal(JSON.stringify([...storage]), before);
});

test("actual manifest query and static country/collection projections admit only the explicit public verified lane", async () => {
  const sample = JSON.parse(read("tools/afrokitchen/seo-manifest.json")).recipes[0];
  const rows = [sample, ...[false, null, undefined, "true"].map((flag, index) => ({ ...sample, id: "denied" + index, slug: "denied" + index, is_published: flag }))];
  const filters = [];
  const tables = { recipes: rows, recipe_ingredients: sample.ingredients, recipe_steps: sample.steps, recipe_media: [], recipe_reviews: [], collections: [] };
  const client = { from(table) { return { select() { return this; }, eq(key, value) { filters.push([table, key, value]); return this; }, order() { return this; }, range(from, to) { return Promise.resolve({ data: (tables[table] || []).slice(from, to + 1), error: null }); } }; } };
  const module = { exports: {} };
  const localRequire = name => name === "@supabase/supabase-js" ? { createClient: () => client } : name === "../../data/image-generation/recipe-image-aliases.json" ? JSON.parse(read("data/image-generation/recipe-image-aliases.json")) : require(name);
  const wrapper = vm.runInNewContext("(function(require,module,exports,__dirname){" + read("scripts/lib/afrokitchen-static.js") + "})", { process: { env: {} }, console, URL, Map, Set, Date, Buffer });
  wrapper(localRequire, module, module.exports, path.join(root, "scripts/lib"));
  const manifest = await module.exports.buildManifest({ waveStrategy: "all_verified" });
  assert.equal(manifest.recipes.length, 1); assert.equal(manifest.recipes[0].id, sample.id);
  assert.equal(manifest.recipes[0].is_published, true); assert.equal(manifest.recipes[0].is_verified, true);
  assert.equal(manifest.countries[0].recipes[0].is_published, true); assert.equal(manifest.countries[0].recipes[0].is_verified, true);
  assert.ok(filters.some(x => x[0] === "recipes" && x[1] === "is_published" && x[2] === true));
  assert.ok(filters.some(x => x[0] === "recipes" && x[1] === "is_verified" && x[2] === true));
});

function element() {
  return { children: [], events: {}, style: {}, attributes: {}, textContent: "", appendChild(child) { this.children.push(child); return child; },
    setAttribute(key, value) { this.attributes[key] = value; }, addEventListener(name, fn) { this.events[name] = fn; },
    contains(child) { return this.children.includes(child); }, remove() { this.removed = true; } };
}
const settle = () => new Promise(resolve => setImmediate(resolve));
test("actual static runtime blocks controls/storage until eligibility, shows unavailable Retry, and initializes once after recovery", async () => {
  const main = element(), listeners = {}, body = element(); let state = "unavailable", reads = 0, retries = 0, checks = 0;
  const payload = { slug: "legacy", ingredients: [{ recipe_id: id }], steps: [{ recipe_id: id }], default_servings: 2 };
  const window = { __AK_STATIC_RECIPE: payload, AfroKitchenEngine: { checkRecipePublication: async () => { checks++; return { kind: state }; }, retryPublication() { retries++; } },
    location: { search: "" }, localStorage: { getItem() { reads++; return null; } } };
  const document = { readyState: "loading", body, createElement: element, querySelector: () => main, addEventListener(name, fn) { listeners[name] = fn; } };
  vm.runInNewContext(read("tools/afrokitchen/static-recipe-runtime.js"), { window, document, URLSearchParams, Promise, console, Object, Number, JSON });
  const initial = window.AKStaticRecipePage.copyRecipe;
  assert.equal(initial(), false); assert.equal(reads, 0);
  await settle(); assert.equal(reads, 0); assert.match(main.children[0].textContent, /publication data is unavailable/);
  // The maintained static page root is a div.ak-static-page[role=main], not a main element.
  const target = { closest: selector => selector === "button,input" ? target : selector === ".ak-static-page" ? main : null };
  const event = { target, preventDefault() { this.prevented = true; }, stopImmediatePropagation() { this.stopped = true; } };
  listeners.click(event); assert.equal(event.prevented, true); assert.equal(event.stopped, true);
  const retry = main.children[0].children[0]; state = "eligible"; retry.events.click(); await settle();
  assert.equal(retries, 1); assert.equal(checks, 2); assert.equal(reads, 1); assert.notEqual(window.AKStaticRecipePage.copyRecipe, initial);
  assert.equal(main.children[0].removed, true); assert.equal(typeof listeners.DOMContentLoaded, "function");
  payload.is_published = false; assert.equal(window.AKStaticRecipePage.copyRecipe(), false, "explicit denial still wins on exposed actions");
});

test("actual dynamic detail distinguishes unknown availability from confirmed404 and never displays unflagged fallback data", async () => {
  const source = read("tools/afrokitchen/recipe-page.js");
  const start = source.indexOf("async function(t){var n=await e.fetchRecipeBySlug"), end = source.indexOf("}(r)){if(i.publicationUnavailable)", start);
  assert.ok(start > 0 && end > start);
  let row = { publicationUnavailable: true }, status = 404;
  const context = { e: { fetchRecipeBySlug: async () => row }, x: async () => { const error = Error("synthetic transport"); error.status = status; throw error; }, setTimeout: fn => fn(), Promise };
  const load = vm.runInNewContext("(" + source.slice(start, end + 1) + ")", context);
  assert.equal((await load("test-dish")).publicationUnavailable, true);
  row = null; assert.equal(await load("test-dish"), null);
  status = 503; assert.equal((await load("test-dish")).publicationUnavailable, true);
  context.x = async () => ({ id, slug: "test-dish" }); assert.equal(await load("test-dish"), null);
  const elements = {}, get = key => elements[key] || (elements[key] = node());
  let reset = 0, reload = 0;
  const viewStart = source.indexOf("function publicationUnavailable()"), viewEnd = source.indexOf("function E()", viewStart);
  const view = { p: get, document: { createElement: () => { const item = element(); item.addEventListener = (key, fn) => { item.events[key] = fn; }; return item; } }, e: { retryPublication() { reset++; } }, window: { location: { reload() { reload++; } } } };
  vm.runInNewContext(source.slice(viewStart, viewEnd) + ";publicationUnavailable()", view);
  assert.equal(get("recipe-loading").style.display, "none"); assert.equal(get("recipe-content").style.display, "none");
  assert.match(get("recipe-404").querySelector("p").textContent, /not a confirmed missing recipe/);
  get("recipe-404").children.child.events.click(); assert.equal(reset, 1); assert.equal(reload, 1);
});
