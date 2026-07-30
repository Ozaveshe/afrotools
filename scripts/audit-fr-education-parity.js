#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const manifest = require("../data/localization/fr-education-parity.json");
const aiMap = require("../assets/js/ai/french-route-map.generated.js");
const registry = fs.readFileSync(path.join(root, "assets/js/components/tool-registry.js"), "utf8");
const hub = fs.readFileSync(path.join(root, "fr/education/index.html"), "utf8");
const failures = [];

function fail(id, check, detail) {
  failures.push({ id, check, detail });
}

if (manifest.denominator !== 42 || manifest.routes.length !== 42) {
  fail("manifest", "exact-denominator", `${manifest.routes.length}/${manifest.denominator}`);
}

for (const route of manifest.routes) {
  const frenchFile = path.join(root, route.french.replace(/^\/|\/$/g, ""), "index.html");
  const englishFile = path.join(root, route.english.replace(/^\/|\/$/g, ""), "index.html");
  if (!fs.existsSync(frenchFile)) {
    fail(route.id, "french-owner", route.french);
    continue;
  }
  if (!fs.existsSync(englishFile)) {
    fail(route.id, "english-owner", route.english);
    continue;
  }
  const french = fs.readFileSync(frenchFile, "utf8");
  const english = fs.readFileSync(englishFile, "utf8");
  const expectedCanonical = `https://afrotools.com${route.french}`;
  const expectedFrenchAlternate = `hreflang="fr" href="${expectedCanonical}"`;
  const expectedEnglishAlternate = `hreflang="en" href="https://afrotools.com${route.english}"`;

  if (!/<html[^>]+lang="fr"/i.test(french)) fail(route.id, "lang", route.french);
  if (!french.includes(`rel="canonical" href="${expectedCanonical}"`)) fail(route.id, "canonical", route.french);
  if (!french.includes(expectedEnglishAlternate)) fail(route.id, "french-to-english-hreflang", route.french);
  if (!english.includes(expectedFrenchAlternate)) fail(route.id, "english-to-french-hreflang", route.english);
  if (/<iframe\b/i.test(french)) fail(route.id, "native-runtime", "iframe found");
  if (!french.includes(`https://afrotools.com/${route.artwork}`)) fail(route.id, "og-artwork", route.artwork);
  if (!fs.existsSync(path.join(root, route.artwork))) fail(route.id, "artwork-file", route.artwork);
  if (!hub.includes(`href="${route.french}"`)) fail(route.id, "category-hub-link", route.french);
  if (aiMap.routes[route.english] !== route.french) fail(route.id, "ai-route", aiMap.routes[route.english] || "missing");
  if (!registry.includes(`href: '${route.french}'`)) fail(route.id, "registry-route", route.french);

  if (route.owner !== "existing-native-owner") {
    if (!french.includes(`"id":"${route.id}"`)) fail(route.id, "owner-config", route.owner);
    if (!french.includes("/assets/js/pages/fr-education-parity.js")) fail(route.id, "native-controller", route.french);
  }
}

const report = {
  schemaVersion: 1,
  checkedAt: new Date().toISOString(),
  baseline: manifest.baseline,
  category: "Education",
  denominator: 42,
  routesPresent: manifest.routes.length,
  nativeFrenchOwners: manifest.routes.filter((route) => route.owner !== "existing-native-owner").length,
  retainedNativeOwners: manifest.routes.filter((route) => route.owner === "existing-native-owner").length,
  hubLinks: manifest.routes.filter((route) => hub.includes(`href="${route.french}"`)).length,
  artworkResolved: manifest.routes.filter((route) => fs.existsSync(path.join(root, route.artwork))).length,
  aiRoutes: manifest.routes.filter((route) => aiMap.routes[route.english] === route.french).length,
  acceptedRoutes: manifest.routes.filter((route) => route.state === "accepted").length,
  failures,
  accepted: failures.length === 0 && manifest.routes.every((route) => route.state === "accepted")
};

if (process.argv.includes("--write")) {
  fs.writeFileSync(path.join(root, "reports/fr-education-parity-evidence.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
}
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exitCode = 1;
