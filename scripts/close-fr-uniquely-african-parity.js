#!/usr/bin/env node
"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const manifestPath = path.join(root, "data", "localization", "fr-uniquely-african-parity-manifest.json");
const evidenceDir = path.join(root, "reports", "fr-uniquely-african-parity");
const pendingPath = path.join(evidenceDir, "browser-proof.pending.json");
const browserPath = path.join(evidenceDir, "browser-proof.json");
const reflowPendingPath = path.join(evidenceDir, "reflow-diagnostics.pending.json");
const reflowPath = path.join(evidenceDir, "reflow-diagnostics.json");
const receiptPath = path.join(evidenceDir, "acceptance-receipt.json");
const familyPath = path.join(evidenceDir, "family-receipt.json");
const artworkPath = path.join(evidenceDir, "artwork-audit.json");
const rootSentinelFiles = [
  "tests/fixtures/fr-uniquely-african-active-checkout-sentinel.txt",
  "data/localization/fr-uniquely-african-parity-manifest.json",
  "tests/e2e/fr-uniquely-african-parity.spec.js"
];

function normalize(route) {
  const pathname = new URL(route, "https://afrotools.com").pathname.replace(/\/index\.html$/, "/");
  return pathname.endsWith("/") ? pathname : `${pathname}/`;
}

function hash(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function fail(message) {
  throw new Error(`French Uniquely African closeout refused: ${message}`);
}

const manifestSource = fs.readFileSync(manifestPath, "utf8");
const manifest = JSON.parse(manifestSource);
if (manifest.denominator !== 34 || manifest.rows.length !== 34) fail("manifest denominator is not exactly 34");

const proofSourcePath = fs.existsSync(pendingPath) ? pendingPath : browserPath;
if (!fs.existsSync(proofSourcePath)) fail("browser proof is missing");
const proofSource = fs.readFileSync(proofSourcePath, "utf8");
const proof = JSON.parse(proofSource);
if (proof.status !== "browser-proof-complete" || proof.denominator !== 34 || proof.routes.length !== 34) {
  fail("browser proof is not a complete 34-route run");
}
if (proof.baseUrlSource !== "playwright-config") fail("browser proof is not bound to Playwright configuration");
const sentinel = proof.rootSentinel;
if (!sentinel ||
    sentinel.strategy !== "active-checkout-content-fingerprint" ||
    sentinel.validated !== true ||
    !Array.isArray(sentinel.files) ||
    sentinel.files.length !== rootSentinelFiles.length) {
  fail("active-checkout root sentinel is missing or incomplete");
}
const localSentinelEntries = rootSentinelFiles.map((relativePath) => ({
  path: relativePath,
  sha256: hash(fs.readFileSync(path.join(root, relativePath)))
}));
for (const expected of localSentinelEntries) {
  const actual = sentinel.files.find((entry) => entry.path === expected.path);
  if (!actual || actual.sha256 !== expected.sha256) {
    fail(`active-checkout root sentinel drifted for ${expected.path}`);
  }
}
const localSentinelDigest = hash(
  localSentinelEntries.map((entry) => `${entry.path}\0${entry.sha256}`).join("\n")
);
if (sentinel.sha256 !== localSentinelDigest) fail("active-checkout root sentinel digest drifted");

const manifestRoutes = manifest.rows.map((row) => normalize(row.french.route));
const proofRoutes = proof.routes.map((row) => normalize(row.frenchRoute));
if (new Set(manifestRoutes).size !== 34 || new Set(proofRoutes).size !== 34) fail("duplicate manifest or proof route");
if (manifestRoutes.some((route) => !proofRoutes.includes(route)) || proofRoutes.some((route) => !manifestRoutes.includes(route))) {
  fail("manifest and browser proof routes do not reconcile");
}
if (proof.routes.some((row) => row.accepted !== true)) fail("one or more physical routes are not accepted");

const proofHash = hash(proofSource);
const reflowSourcePath = fs.existsSync(reflowPendingPath) ? reflowPendingPath : reflowPath;
if (!fs.existsSync(reflowSourcePath)) fail("fixed-320 exact-2x reflow proof is missing");
const reflowSource = fs.readFileSync(reflowSourcePath, "utf8");
const reflow = JSON.parse(reflowSource);
if (reflow.viewport !== "fixed 320 CSS px" ||
    reflow.textScale !== "computed root 16px to exact 32px" ||
    reflow.routeCount !== 35 ||
    !Array.isArray(reflow.routes) ||
    reflow.routes.length !== 35) {
  fail("fixed-320 exact-2x reflow proof is incomplete");
}
const reflowIds = reflow.routes.map((row) => row.id);
if (new Set(reflowIds).size !== 35 ||
    !reflowIds.includes("uniquely-african-hub") ||
    manifest.rows.some((row) => !reflowIds.includes(row.english.id))) {
  fail("fixed-320 exact-2x reflow routes do not reconcile");
}
const reflowHash = hash(reflowSource);
const acceptedRoutes = manifest.rows.map((row) => {
  const browser = proof.routes.find((item) => normalize(item.frenchRoute) === normalize(row.french.route));
  return {
    index: row.index,
    englishId: row.english.id,
    englishRoute: normalize(row.english.route),
    frenchRoute: normalize(row.french.route),
    status: "accepted",
    engineOwner: row.engineOwner,
    dataOwner: row.dataOwner,
    outputOracle: browser.outputOracle,
    ownerOracle: browser.ownerOracle,
    browser: browser.browser,
    exports: row.exports,
    seo: browser.seo,
    privacy: browser.privacy,
    artwork: row.artwork
  };
});

const receipt = {
  schemaVersion: 1,
  programme: manifest.programme,
  denominator: 34,
  accepted: 34,
  nonAccepted: 0,
  state: "accepted",
  foundation: manifest.foundation,
  proof: {
    path: "reports/fr-uniquely-african-parity/browser-proof.json",
    sha256: proofHash,
    baseUrlSource: proof.baseUrlSource,
    rootSentinel: proof.rootSentinel,
    limitations: proof.fixtures,
    reflowPath: "reports/fr-uniquely-african-parity/reflow-diagnostics.json",
    reflowSha256: reflowHash
  },
  routes: acceptedRoutes
};

const family = {
  schemaVersion: 1,
  programme: manifest.programme,
  category: "uniquely-african",
  denominator: 34,
  accepted: 34,
  families: Object.values(acceptedRoutes.reduce((groups, route) => {
    const state = manifest.rows.find((row) => row.english.id === route.englishId).french.baselineState;
    if (!groups[state]) groups[state] = { baselineState: state, count: 0, routes: [] };
    groups[state].count += 1;
    groups[state].routes.push(route.frenchRoute);
    return groups;
  }, {}))
};

const artwork = {
  schemaVersion: 1,
  programme: manifest.programme,
  denominator: 34,
  present: manifest.rows.filter((row) => fs.existsSync(path.join(root, row.artwork.path))).length,
  missing: manifest.rows.filter((row) => !fs.existsSync(path.join(root, row.artwork.path))).map((row) => ({
    id: row.english.id,
    route: row.french.route,
    expectedPath: row.artwork.path
  })),
  routes: manifest.rows.map((row) => ({
    id: row.english.id,
    frenchRoute: row.french.route,
    artworkId: row.artwork.id,
    path: row.artwork.path,
    state: fs.existsSync(path.join(root, row.artwork.path)) ? "present" : "missing"
  }))
};
if (artwork.present !== 34 || artwork.missing.length) fail("artwork audit is not 34/34 present");

const acceptedManifest = manifestSource.replace(
  /"acceptance": \{\s*"accepted": 0,\s*"required": 34,\s*"state": "fail-closed"\s*\}/,
  '"acceptance": {\n    "accepted": 34,\n    "required": 34,\n    "state": "accepted"\n  }'
);
if (acceptedManifest === manifestSource && manifest.acceptance.accepted !== 34) fail("manifest acceptance block could not be updated safely");

fs.mkdirSync(evidenceDir, { recursive: true });
if (proofSourcePath === pendingPath) {
  if (fs.existsSync(browserPath)) {
    const previousPath = path.join(evidenceDir, "browser-proof.pre-owner-oracle-repair.json");
    if (!fs.existsSync(previousPath)) fs.renameSync(browserPath, previousPath);
  }
  fs.writeFileSync(browserPath, proofSource);
  fs.unlinkSync(pendingPath);
}
if (reflowSourcePath === reflowPendingPath) {
  fs.writeFileSync(reflowPath, reflowSource);
  fs.unlinkSync(reflowPendingPath);
}
fs.writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
fs.writeFileSync(familyPath, `${JSON.stringify(family, null, 2)}\n`);
fs.writeFileSync(artworkPath, `${JSON.stringify(artwork, null, 2)}\n`);
fs.writeFileSync(manifestPath, acceptedManifest);

console.log(JSON.stringify({
  manifestRoutes: manifestRoutes.length,
  uniqueProofRoutes: new Set(proofRoutes).size,
  mismatch: 0,
  accepted: acceptedRoutes.length,
  nonAccepted: 0,
  artworkPresent: artwork.present,
  proofSha256: proofHash,
  reflowSha256: reflowHash
}, null, 2));
