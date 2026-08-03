"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const MANIFEST = path.join(ROOT, "data", "localization", "sw-agriculture-parity-manifest.json");
const OUTPUT = path.join(ROOT, "assets", "js", "ai", "swahili-agriculture-route-map.generated.js");
const FAMILY = "fertilizer";

function normalizeRoute(route) {
  const clean = String(route || "").split(/[?#]/)[0].replace(/^\/+|\/+$/g, "");
  return clean ? `/${clean}/` : "/";
}

function buildArtifact() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
  const rows = manifest.rows.filter(row => row.family === FAMILY);
  const hubRows = rows.filter(row => !row.country);
  const countryRows = rows.filter(row => row.country);
  if (rows.length !== 55 || hubRows.length !== 1 || countryRows.length !== 54) {
    throw new Error(`Expected fertilizer route map 55/1/54, received ${rows.length}/${hubRows.length}/${countryRows.length}.`);
  }

  const routes = {};
  for (const row of rows) {
    if (row.swahili.ownerState !== "manifest-generated-native") {
      throw new Error(`Route is not owned by the native Swahili generator: ${row.swahili.route}`);
    }
    const outputFile = path.join(ROOT, row.swahili.file);
    if (!fs.existsSync(outputFile)) throw new Error(`Mapped route is missing: ${row.swahili.file}`);
    routes[normalizeRoute(row.english.routeKey || row.english.route)] = normalizeRoute(row.swahili.routeKey || row.swahili.route);
  }

  const payload = {
    schemaVersion: 1,
    locale: "sw",
    family: FAMILY,
    source: "data/localization/sw-agriculture-parity-manifest.json",
    report: {
      rows: rows.length,
      hubRows: hubRows.length,
      countryRows: countryRows.length,
      physicalRoutes: rows.length
    },
    routes
  };

  return `(function initSwahiliAgricultureRouteMap(root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.AfroToolsAISwahiliAgricultureRouteMap = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function createSwahiliAgricultureRouteMap() {
  "use strict";
  return Object.freeze(${JSON.stringify(payload)});
});
`;
}

function main() {
  const check = process.argv.includes("--check");
  const content = buildArtifact();
  if (check) {
    if (!fs.existsSync(OUTPUT) || fs.readFileSync(OUTPUT, "utf8") !== content) {
      throw new Error("Swahili Agriculture AI route map is stale. Run node scripts/build-ai-swahili-agriculture-route-map.js.");
    }
    console.log("Swahili Agriculture AI route map is current: 55/55 fertilizer routes.");
    return;
  }
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, content, "utf8");
  console.log("Generated Swahili Agriculture AI route map: 55/55 fertilizer routes.");
}

if (require.main === module) main();

module.exports = { buildArtifact, normalizeRoute };
