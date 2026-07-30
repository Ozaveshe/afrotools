#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const {
  writeFileSyncWithRetry,
  renameSyncWithRetry,
} = require("./lib/safe-write");

const ROOT = path.resolve(__dirname, "..");
const MANIFEST_PATH = path.join(
  ROOT,
  "data",
  "localization",
  "fr-uniquely-african-parity-manifest.json"
);
const OUTPUT_PATH = path.join(
  ROOT,
  "assets",
  "js",
  "ai",
  "french-route-map.uniquely-african.js"
);
const EXPECTED_ROWS = 34;

function normalizeRoute(value) {
  const route = String(value || "").split(/[?#]/)[0].replace(/\/+/g, "/");
  return `/${route.replace(/^\/+|\/+$/g, "")}/`;
}

function buildPayload() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  if (manifest.denominator !== EXPECTED_ROWS || manifest.rows.length !== EXPECTED_ROWS) {
    throw new Error(`Expected exactly ${EXPECTED_ROWS} Uniquely African manifest rows.`);
  }

  const routes = {};
  for (const row of manifest.rows) {
    const englishRoute = normalizeRoute(row.english.route);
    const frenchRoute = normalizeRoute(row.french.route);
    if (routes[englishRoute]) throw new Error(`Duplicate English route: ${englishRoute}`);
    if (!frenchRoute.startsWith("/fr/")) throw new Error(`Non-French route: ${frenchRoute}`);
    routes[englishRoute] = frenchRoute;
  }
  if (Object.keys(routes).length !== EXPECTED_ROWS) throw new Error("AI route map row drift.");

  return {
    schemaVersion: 1,
    programme: manifest.programme,
    source: path.relative(ROOT, MANIFEST_PATH).replace(/\\/g, "/"),
    denominator: EXPECTED_ROWS,
    routes,
  };
}

function render(payload) {
  return `(function installFrenchUniquelyAfricanRouteMap(root) {
  "use strict";
  var payload = Object.freeze(${JSON.stringify(payload)});
  var shared = root && root.AfroToolsAIFrenchRouteMap;
  if (!shared || !shared.routes) throw new Error("The base French AI route map must load first.");
  Object.keys(payload.routes).forEach(function (englishRoute) {
    var expected = payload.routes[englishRoute];
    var current = shared.routes[englishRoute];
    if (current && current !== expected) {
      throw new Error("Conflicting French AI route for " + englishRoute);
    }
    shared.routes[englishRoute] = expected;
  });
  root.AfroToolsAIFrenchUniquelyAfricanRouteMap = payload;
})(typeof globalThis !== "undefined" ? globalThis : this);
`;
}

function atomicWrite(content) {
  const temporary = path.join(
    path.dirname(OUTPUT_PATH),
    `.${path.basename(OUTPUT_PATH)}.${process.pid}.${Date.now()}.tmp`
  );
  writeFileSyncWithRetry(temporary, content, "utf8");
  try {
    renameSyncWithRetry(temporary, OUTPUT_PATH);
  } finally {
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
  }
}

function generate(options = {}) {
  const payload = buildPayload();
  const content = render(payload);
  const current = fs.existsSync(OUTPUT_PATH) ? fs.readFileSync(OUTPUT_PATH, "utf8") : "";
  if (options.check && current !== content) {
    throw new Error("French Uniquely African AI route map is stale.");
  }
  if (!options.check && current !== content) atomicWrite(content);
  return { payload, changed: current !== content };
}

if (require.main === module) {
  try {
    const result = generate({ check: process.argv.includes("--check") });
    console.log(JSON.stringify({
      rows: Object.keys(result.payload.routes).length,
      changed: result.changed,
      output: path.relative(ROOT, OUTPUT_PATH).replace(/\\/g, "/"),
    }, null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { buildPayload, generate, normalizeRoute, render };
