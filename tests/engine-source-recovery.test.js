#!/usr/bin/env node
"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { minify } = require("terser");
const { getEngineTerserOptions } = require("../scripts/lib/engine-build");

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
  assert.ok(sources.length >= 128, "expected at least 128 readable engine sources");
  assert.deepStrictEqual(sources, outputs, "source/output engine names must match exactly");

  for (const filename of sources) {
    const source = fs.readFileSync(path.join(SOURCE_DIR, filename), "utf8");
    const output = fs.readFileSync(path.join(ENGINE_DIR, filename), "utf8");
    new vm.Script(source, { filename: `engines/src/${filename}` });
    new vm.Script(output, { filename: `engines/${filename}` });
    const [sourceCanonical, outputCanonical] = await Promise.all([
      canonical(source, filename),
      canonical(output, filename),
    ]);
    assert.strictEqual(outputCanonical, sourceCanonical, `${filename}: rebuilt output changed canonical semantics`);
  }

  for (const [filename, globalPath] of Object.entries(SMOKE_GLOBALS)) {
    const source = fs.readFileSync(path.join(SOURCE_DIR, filename), "utf8");
    const output = fs.readFileSync(path.join(ENGINE_DIR, filename), "utf8");
    assert.deepStrictEqual(
      execute(output, `engines/${filename}`, globalPath),
      execute(source, `engines/src/${filename}`, globalPath),
      `${filename}: rebuilt global ${globalPath} changed shape`,
    );
  }

  console.log(`engine source recovery: PASS (${sources.length} semantic pairs; ${Object.keys(SMOKE_GLOBALS).length} browser-global smokes)`);
})().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
