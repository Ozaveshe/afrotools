#!/usr/bin/env node
"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { minify } = require("terser");
const { getEngineTerserOptions, engineOutputPath } = require("../scripts/lib/engine-build");

const ROOT = path.resolve(__dirname, "..");
const ENGINE_DIR = path.join(ROOT, "engines");
const SOURCE_DIR = path.join(ENGINE_DIR, "src");
const SMOKE_GLOBALS = {
  "afroatlas-engine.js": "AfroAtlas",
  "business-planner-engine.js": "BusinessPlannerEngine",
  "minimum-wage-engine.js": "AfroTools.MinWageEngine",
  "doc-generator-engine.js": "AfroTools.engines.docGenerator",
  "afrokitchen-engine.js": "AfroKitchenEngine",
  "creator-carousel-engine.js": "AfroTools.engines.creatorCarousel",
};

function filesIn(dir) {
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".js"))
    .map((entry) => entry.name)
    .sort();
}

function browserContext() {
  const storage = new Map();
  const sandbox = {
    console,
    module: { exports: {} },
    exports: {},
    navigator: { language: "en" },
    location: { href: "https://www.afrotools.com/", pathname: "/" },
    localStorage: {
      getItem: (key) => storage.has(key) ? storage.get(key) : null,
      setItem: (key, value) => storage.set(key, String(value)),
      removeItem: (key) => storage.delete(key),
    },
    sessionStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    },
    setTimeout,
    clearTimeout,
    fetch: async () => ({ ok: false, json: async () => ({}) }),
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  return vm.createContext(sandbox);
}

function resolveGlobal(context, dottedPath) {
  return dottedPath.split(".").reduce((value, key) => value && value[key], context);
}

function publicShape(value) {
  if (value == null) return { type: String(value), keys: [] };
  return { type: typeof value, keys: Object.keys(value).sort() };
}

function execute(code, filename, globalPath) {
  const context = browserContext();
  new vm.Script(code, { filename }).runInContext(context, { timeout: 5000 });
  const attached = resolveGlobal(context, globalPath);
  assert(attached, `${filename}: expected browser global ${globalPath}`);
  return publicShape(attached);
}

async function canonical(code, filename) {
  const result = await minify({ [filename]: code }, getEngineTerserOptions());
  assert(result.code, `${filename}: Terser returned no canonical output`);
  return result.code;
}

(async () => {
  const sources = filesIn(SOURCE_DIR);
  const outputs = filesIn(ENGINE_DIR);
  // Floor against accidental mass deletion, not a target. It stepped down from
  // 140 to 126 in July 2026 when 14 engines with no page, test or generator
  // consumer were deliberately removed — see docs/UNUSED-ENGINE-ARTIFACTS-2026-07.md.
  assert.ok(sources.length >= 126, `expected at least 126 readable engine sources, found ${sources.length}`);

  // Every source must have a build output, but not all of them land in
  // engines/ — solar-roi builds to assets/js/engines/, which is where the 110
  // pages that use it load from. engineOutputPath is the same map minify.js
  // builds with, so the two cannot disagree about where a source goes.
  const expectedInEngineDir = sources
    .filter((name) => engineOutputPath(name) === `engines/${name}`)
    .sort();
  assert.deepStrictEqual(outputs, expectedInEngineDir, "source/output engine names must match exactly");
  for (const filename of sources) {
    const outputRel = engineOutputPath(filename);
    assert.ok(
      fs.existsSync(path.join(ROOT, outputRel)),
      `${filename}: build output ${outputRel} is missing`,
    );
  }

  for (const filename of sources) {
    const source = fs.readFileSync(path.join(SOURCE_DIR, filename), "utf8");
    const output = fs.readFileSync(path.join(ROOT, engineOutputPath(filename)), "utf8");
    new vm.Script(source, { filename: `engines/src/${filename}` });
    new vm.Script(output, { filename: engineOutputPath(filename) });
    const [sourceCanonical, outputCanonical] = await Promise.all([
      canonical(source, filename),
      canonical(output, filename),
    ]);
    assert.strictEqual(outputCanonical, sourceCanonical, `${filename}: rebuilt output changed canonical semantics`);
  }

  for (const [filename, globalPath] of Object.entries(SMOKE_GLOBALS)) {
    const source = fs.readFileSync(path.join(SOURCE_DIR, filename), "utf8");
    const output = fs.readFileSync(path.join(ROOT, engineOutputPath(filename)), "utf8");
    assert.deepStrictEqual(
      execute(output, engineOutputPath(filename), globalPath),
      execute(source, `engines/src/${filename}`, globalPath),
      `${filename}: rebuilt global ${globalPath} changed shape`,
    );
  }

  console.log(`engine source recovery: PASS (${sources.length} semantic pairs; ${Object.keys(SMOKE_GLOBALS).length} browser-global smokes)`);
})().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
