"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const {
  buildReport,
  normalizeRoute,
} = require("../build-french-free-app-parity-inventory");

const ROOT = path.resolve(__dirname, "..", "..");
const CATEGORY = "VAT & Business Tax";
const EXPECTED = 63;
const ROUTE_CONTRACT_SPEC =
  "tests/e2e/french-vat-business-tax-route-contract.spec.js";
const OWNER_ISOLATION_SPEC = "tests/e2e/owner-test-isolation.spec.js";
const PRODUCTION_BOUNDARY_SPECS = Object.freeze([
  "tests/e2e/analytics-consent.spec.js",
  "tests/e2e/privacy-ai-consent.spec.js",
]);

function listFiles(directory, extension) {
  const output = [];
  const stack = [directory];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.isFile() && entry.name.endsWith(extension)) output.push(full);
    }
  }
  return output.sort();
}

function buildCategoryRows() {
  const rows = buildReport().rows.filter((row) => row.category === CATEGORY);
  if (rows.length !== EXPECTED) {
    throw new Error(`Expected ${EXPECTED} ${CATEGORY} rows, found ${rows.length}.`);
  }
  const ids = new Set();
  const routes = new Set();
  for (const row of rows) {
    const route = normalizeRoute(row.primaryFrenchRoute);
    if (ids.has(row.englishId)) throw new Error(`Duplicate id ${row.englishId}.`);
    if (routes.has(route)) throw new Error(`Duplicate French route ${route}.`);
    ids.add(row.englishId);
    routes.add(route);
  }
  return rows;
}

function ownerSpecsForRows(rows) {
  const testFiles = listFiles(path.join(ROOT, "tests", "e2e"), ".spec.js")
    .map((file) => ({
      file,
      relative: path.relative(ROOT, file).replace(/\\/g, "/"),
      source: fs.readFileSync(file, "utf8"),
    }))
    .filter(
      (test) =>
        test.relative !== ROUTE_CONTRACT_SPEC &&
        test.relative !== OWNER_ISOLATION_SPEC &&
        !PRODUCTION_BOUNDARY_SPECS.includes(test.relative),
    );
  const output = new Map();
  for (const row of rows) {
    const route = normalizeRoute(row.primaryFrenchRoute);
    const candidates = [route, `${route}/`, route.replace(/\/$/, "")];
    const matches = testFiles
      .filter((test) =>
        candidates.some((candidate) => test.source.includes(candidate)),
      )
      .map((test) => test.relative);
    if (!matches.length) {
      throw new Error(`${row.englishId}: no mapped owner spec for ${route}.`);
    }
    output.set(row.englishId, matches);
  }
  return output;
}

function coverageDigest(rows, ownerSpecs) {
  const files = new Set([
    "assets/js/ai/french-route-map.generated.js",
    "assets/js/lib/local-vat-pdf.js",
    "assets/js/pages/guinea-bissau-vat-vip.js",
    "data/registry/locale-coverage-policy.json",
    "data/registry/locale-page-coverage.json",
    "data/vat-business-tax/official-sources.json",
    ROUTE_CONTRACT_SPEC,
    OWNER_ISOLATION_SPEC,
    ...PRODUCTION_BOUNDARY_SPECS,
    "scripts/lib/french-vat-business-tax-live-contract.js",
    "scripts/run-french-vat-business-tax-live-suite.js",
    "scripts/verify-french-vat-business-tax-wave2.js",
  ]);
  for (const row of rows) {
    files.add(row.primaryFrenchFile);
    const routeSource = fs.readFileSync(
      path.join(ROOT, row.primaryFrenchFile),
      "utf8",
    );
    for (const match of routeSource.matchAll(
      /<(?:script|link)\b[^>]+(?:src|href)=["'](\/[^"'?#]+\.(?:js|css))[^"']*["']/gi,
    )) {
      const dependency = match[1].replace(/^\/+/, "");
      if (fs.existsSync(path.join(ROOT, dependency))) files.add(dependency);
    }
    for (const spec of ownerSpecs.get(row.englishId) || []) files.add(spec);
  }

  const digest = crypto.createHash("sha256");
  for (const relative of [...files].sort()) {
    const file = path.join(ROOT, relative);
    if (!fs.existsSync(file)) throw new Error(`Coverage input missing: ${relative}`);
    digest.update(relative);
    digest.update("\0");
    digest.update(fs.readFileSync(file));
    digest.update("\0");
  }
  return {
    algorithm: "sha256",
    value: digest.digest("hex"),
    files: [...files].sort(),
  };
}

function routeTestTitle(row) {
  return `FRVAT::${row.englishId}::${normalizeRoute(row.primaryFrenchRoute)}`;
}

module.exports = {
  CATEGORY,
  EXPECTED,
  OWNER_ISOLATION_SPEC,
  PRODUCTION_BOUNDARY_SPECS,
  ROOT,
  ROUTE_CONTRACT_SPEC,
  buildCategoryRows,
  coverageDigest,
  normalizeRoute,
  ownerSpecsForRows,
  routeTestTitle,
};
