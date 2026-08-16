"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const {
  FRENCH_ENERGY_APPS,
  REVIEWED_AT,
} = require("../scripts/lib/french-energy-parity-contract");
const {
  frenchRouteForEnglishToolSource,
} = require("../scripts/lib/french-tool-route-map");

const ROOT = path.resolve(__dirname, "..");

function fileForRoute(route) {
  return path.join(ROOT, route.replace(/^\/|\/$/g, ""), "index.html");
}

function loadRegistry() {
  const source = fs.readFileSync(path.join(ROOT, "assets/js/components/tool-registry.js"), "utf8");
  const context = {
    console,
    CustomEvent: function CustomEvent(type, init) { return { type, ...(init || {}) }; },
    document: {
      readyState: "loading",
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent() {},
      getElementById() { return null; },
      createElement() { return { style: {}, setAttribute() {}, appendChild() {} }; },
      head: { appendChild() {} },
    },
  };
  vm.createContext(context);
  vm.runInContext(`${source}\n;globalThis.__tools=AFRO_TOOLS;`, context);
  return context.__tools;
}

function scripts(html, withSrc) {
  const matches = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
  return matches.filter((match) => withSrc === /\bsrc\s*=/.test(match[1]));
}

function scriptSources(html) {
  return scripts(html, true)
    .map((match) => (match[1].match(/\bsrc=["']([^"']+)["']/i) || [])[1])
    .filter(Boolean);
}

function formulaScripts(html) {
  return scripts(html, false)
    .filter((match) => !/\bdata-locale-shell-controller\b/i.test(match[1]))
    .filter((match) => !/application\/(ld\+json|json)/i.test(match[1]))
    .map((match) => match[2].trim())
    .filter((body) => body.length > 300 && /(calculate|Math\.|function\s*\(|=>)/.test(body));
}

const tools = loadRegistry();
const englishOwners = tools.filter((tool) =>
  tool.category === "energy" &&
  (!tool.lang || tool.lang === "en") &&
  ["live", "new"].includes(tool.status)
);
assert.strictEqual(englishOwners.length, 20, "English Energy denominator must remain 20 owners");
assert.strictEqual(
  englishOwners.reduce((sum, tool) => sum + (tool.toolCount || 1), 0),
  287,
  "English Energy expanded denominator must remain 287 experiences"
);
assert.strictEqual(FRENCH_ENERGY_APPS.length, 20, "French Energy contract must contain 20 apps");
assert.strictEqual(new Set(FRENCH_ENERGY_APPS.map((app) => app.id)).size, 20, "French Energy ids must be unique");
assert.strictEqual(new Set(FRENCH_ENERGY_APPS.map((app) => app.frRoute)).size, 20, "French Energy routes must be unique");

const ownerIds = new Set(englishOwners.map((tool) => tool.id));
assert.deepStrictEqual(
  [...new Set(FRENCH_ENERGY_APPS.map((app) => app.id))].sort(),
  [...ownerIds].sort(),
  "French Energy contract must exactly match the 20 English owners"
);

for (const app of FRENCH_ENERGY_APPS) {
  const englishFile = fileForRoute(app.enRoute);
  const sourceFile = fileForRoute(app.sourceRoute);
  const frenchFile = fileForRoute(app.frRoute);
  assert.ok(fs.existsSync(englishFile), `${app.id}: English owner missing`);
  assert.ok(fs.existsSync(sourceFile), `${app.id}: calculation source missing`);
  assert.ok(fs.existsSync(frenchFile), `${app.id}: French route missing`);
  assert.ok(fs.existsSync(path.join(ROOT, app.image.replace(/^\//, ""))), `${app.id}: dedicated artwork missing`);

  const english = fs.readFileSync(englishFile, "utf8");
  const source = fs.readFileSync(sourceFile, "utf8");
  const french = fs.readFileSync(frenchFile, "utf8");
  assert.match(french, /<html\b[^>]*lang=["']fr["']/i, `${app.id}: html language`);
  assert.ok(french.includes(`<link rel="canonical" href="https://afrotools.com${app.frRoute}">`), `${app.id}: canonical`);
  if (!app.standaloneLocalizedAlias) {
    assert.ok(french.includes(`hreflang="en" href="https://afrotools.com${app.enRoute}"`), `${app.id}: English alternate`);
    assert.ok(french.includes(`hreflang="fr" href="https://afrotools.com${app.frRoute}"`), `${app.id}: French alternate`);
    assert.ok(english.includes(`hreflang="fr" href="https://afrotools.com${app.frRoute}`), `${app.id}: reciprocal French alternate`);
  } else {
    assert.ok(!/hreflang=["']en["']/i.test(french), `${app.id}: moved English owner must not be an alternate`);
    assert.ok(french.includes(`hreflang="fr" href="https://afrotools.com${app.frRoute}"`), `${app.id}: self locale alternate`);
    assert.ok(french.includes(`hreflang="x-default" href="https://afrotools.com${app.frRoute}"`), `${app.id}: self x-default alternate`);
  }
  assert.ok(french.includes(`fr-energy-parity:${app.id}`), `${app.id}: source owner marker`);
  assert.ok(french.includes(`data-fr-energy-config`), `${app.id}: runtime config`);
  assert.ok(french.includes(`"inLanguage":"fr"`), `${app.id}: French structured data`);
  assert.ok(french.includes(app.title), `${app.id}: native French title`);
  assert.ok(french.includes(app.description), `${app.id}: native French description`);
  assert.ok(french.includes("/assets/js/pages/french-energy-parity.js"), `${app.id}: parity runtime`);
  assert.ok(french.includes("/assets/css/french-energy-parity.css"), `${app.id}: parity CSS`);
  assert.ok(!french.includes("class=\"source-launch\""), `${app.id}: thin handoff wrapper must be gone`);
  assert.ok(!french.includes(`fetch('${app.enRoute}`), `${app.id}: fetched English calculator must be gone`);

  const englishSources = scriptSources(source).filter((src) => /(?:\/engines\/|\/data\/energy\/)/.test(src));
  const frenchSources = scriptSources(french).filter((src) => /(?:\/engines\/|\/data\/energy\/)/.test(src));
  assert.deepStrictEqual(frenchSources, englishSources, `${app.id}: DOM-free engines and energy datasets must match English`);

  for (const formulaScript of formulaScripts(source)) {
    assert.ok(french.includes(formulaScript), `${app.id}: inline formula/controller script changed`);
  }

  const registryRow = tools.find((tool) =>
    tool.lang === "fr" &&
    tool.sourceId === app.id &&
    tool.href.replace(/\/?$/, "/") === app.frRoute
  );
  assert.ok(registryRow, `${app.id}: exact French registry owner missing`);
  assert.strictEqual(
    frenchRouteForEnglishToolSource(`tools/${app.id}`),
    app.frRoute.replace(/\/$/, ""),
    `${app.id}: AI/French route map mismatch`
  );
}

const hub = fs.readFileSync(fileForRoute("/fr/energy/"), "utf8");
assert.strictEqual((hub.match(/class="energy-card"/g) || []).length, 20, "French hub must show 20 cards");
assert.ok(hub.includes('"numberOfItems":20'), "French hub schema must declare 20 items");
for (const app of FRENCH_ENERGY_APPS) {
  assert.ok(hub.includes(`href="${app.frRoute}"`), `${app.id}: missing from French hub`);
}

assert.strictEqual(REVIEWED_AT, "2026-03-01", "freshness contract must match verified source/formula registry date");
assert.ok(
  fs.readFileSync(path.join(ROOT, "assets/js/pages/french-energy-parity.js"), "utf8").includes('if (age > 30) return { id: "stale"'),
  "freshness UI must fail closed when the source snapshot is older than 30 days"
);
assert.match(
  fs.readFileSync(path.join(ROOT, "assets/js/pages/french-energy-parity.js"), "utf8"),
  /\^\[A-Za-z0-9\]\/\.test\(pair\[0\]\)/,
  "exact translations must use a leading word boundary so Ouganda phrases are not repeatedly expanded"
);

console.log("French Energy static parity passed: 20/20 owners, 287 English experiences frozen, hub/registry/filesystem/AI exact.");
