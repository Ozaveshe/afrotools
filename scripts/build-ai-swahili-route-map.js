#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const DIRECTORY = path.join(ROOT, "data", "tool-directory.json");
const ACCEPTANCE = path.join(ROOT, "data", "audits", "swahili-free-app-acceptance.json");
const OUTPUT = path.join(ROOT, "assets", "js", "ai", "swahili-route-map.generated.js");

function normalizeRoute(route) {
  const clean = String(route || "").split(/[?#]/)[0].replace(/^\/+|\/+$/g, "");
  return clean ? `/${clean}/` : "/";
}

function routeFile(route) {
  return path.join(ROOT, ...normalizeRoute(route).split("/").filter(Boolean), "index.html");
}

function buildPayload() {
  const directory = JSON.parse(fs.readFileSync(DIRECTORY, "utf8"));
  const acceptance = JSON.parse(fs.readFileSync(ACCEPTANCE, "utf8"));
  const directoryById = new Map(directory.map((row) => [row.id, row]));
  const acceptedEntries = acceptance.entries
    .filter((entry) => entry.status === "accepted");
  const archivedAcceptedIds = [
    ...acceptedEntries.filter((entry) => !directoryById.has(entry.englishId)),
    ...(acceptance.archivedEntries || []).filter((entry) => entry.status === "accepted")
  ]
    .map((entry) => entry.englishId)
    .filter((id, index, ids) => ids.indexOf(id) === index)
    .sort();
  const accepted = acceptedEntries
    .filter((entry) => directoryById.has(entry.englishId))
    .sort((left, right) => left.englishId.localeCompare(right.englishId));
  const routes = {};
  const ids = {};

  for (const entry of accepted) {
    const english = directoryById.get(entry.englishId);
    if (!english) throw new Error(`Current accepted Swahili route has no English directory row: ${entry.englishId}`);
    const swahiliRoute = normalizeRoute(entry.swahiliRoute);
    if (!fs.existsSync(routeFile(swahiliRoute))) {
      throw new Error(`Accepted Swahili route has no physical page: ${entry.englishId} -> ${swahiliRoute}`);
    }
    const englishRoute = normalizeRoute(english.url);
    if (routes[englishRoute] && routes[englishRoute] !== swahiliRoute) {
      throw new Error(`Conflicting Swahili routes for ${englishRoute}`);
    }
    routes[englishRoute] = swahiliRoute;
    ids[entry.englishId] = swahiliRoute;
  }

  if (Object.keys(ids).length !== accepted.length) {
    throw new Error("Duplicate accepted Swahili tool ids detected.");
  }

  return {
    schemaVersion: 1,
    locale: "sw",
    source: "data/audits/swahili-free-app-acceptance.json + data/tool-directory.json",
    acceptanceRule: "Only app-level accepted Swahili owners are routable.",
    acceptedRoutes: accepted.length,
    archivedAcceptedIds,
    fallbackRoute: "/sw/zana-zote/",
    routes,
    ids
  };
}

function buildArtifact() {
  return `(function initSwahiliRouteMap(root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.AfroToolsAISwahiliRouteMap = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function createSwahiliRouteMap() {
  "use strict";
  return Object.freeze(${JSON.stringify(buildPayload())});
});
`;
}

function main() {
  const check = process.argv.includes("--check");
  const content = buildArtifact();
  if (check) {
    if (!fs.existsSync(OUTPUT) || fs.readFileSync(OUTPUT, "utf8") !== content) {
      throw new Error("Swahili AI route map is stale. Run node scripts/build-ai-swahili-route-map.js.");
    }
  } else {
    fs.writeFileSync(OUTPUT, content, "utf8");
  }
  const payload = buildPayload();
  console.log(`Swahili AI route map ${check ? "verified" : "generated"}: ${payload.acceptedRoutes} accepted routes.`);
}

if (require.main === module) main();

module.exports = { buildArtifact, buildPayload, normalizeRoute, routeFile };
