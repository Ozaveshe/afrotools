#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const DEFAULT_ROOT = path.resolve(__dirname, "..");
const DEFAULT_MANIFEST = "data/localization/sw-coordinator-acceptance-batch-2026-08-02.json";
const DEFAULT_INVENTORY = "reports/swahili-free-app-parity-inventory.json";
const DEFAULT_LEDGER = "data/audits/swahili-free-app-acceptance.json";

function fail(message) {
  throw new Error(`Swahili coordinator acceptance refused: ${message}`);
}

function readJson(file, label) {
  let text;
  try {
    text = fs.readFileSync(file, "utf8");
  } catch (error) {
    fail(`${label} is missing or unreadable: ${file} (${error.message})`);
  }
  try {
    return { value: JSON.parse(text), text };
  } catch (error) {
    fail(`${label} is not valid JSON: ${file} (${error.message})`);
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeRoute(value) {
  const route = String(value || "")
    .replace(/^https?:\/\/[^/]+/i, "")
    .split(/[?#]/)[0]
    .replace(/\/index\.html$/i, "")
    .replace(/\.html$/i, "")
    .replace(/\/+/g, "/");
  if (!route || route === "/") return route === "/" ? "/" : "";
  return `/${route.replace(/^\/+|\/+$/g, "")}/`;
}

function pointer(value, jsonPointer, label) {
  if (jsonPointer === "" || jsonPointer === "/") return value;
  if (typeof jsonPointer !== "string" || !jsonPointer.startsWith("/")) {
    fail(`${label} has invalid JSON pointer ${JSON.stringify(jsonPointer)}.`);
  }
  let current = value;
  for (const rawPart of jsonPointer.slice(1).split("/")) {
    const part = rawPart.replace(/~1/g, "/").replace(/~0/g, "~");
    if (current === null || current === undefined || !Object.hasOwn(current, part)) {
      fail(`${label} is missing ${jsonPointer}.`);
    }
    current = current[part];
  }
  return current;
}

function resolveInside(root, relativePath, label) {
  if (!relativePath || path.isAbsolute(relativePath)) {
    fail(`${label} must be a non-empty repository-relative path.`);
  }
  const resolvedRoot = path.resolve(root);
  const resolved = path.resolve(resolvedRoot, relativePath);
  if (resolved !== resolvedRoot && !resolved.startsWith(`${resolvedRoot}${path.sep}`)) {
    fail(`${label} escapes the repository root: ${relativePath}.`);
  }
  return resolved;
}

function assertArtifact(root, artifact, cache, candidateId) {
  const label = `${candidateId} artifact`;
  const file = resolveInside(root, artifact.path, label);
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
    fail(`${label} is missing: ${artifact.path}.`);
  }
  const text = fs.readFileSync(file, "utf8");
  if (!text.trim()) fail(`${label} is empty: ${artifact.path}.`);
  if (artifact.requiredText && !text.includes(artifact.requiredText)) {
    fail(`${label} lacks required receipt text ${JSON.stringify(artifact.requiredText)}.`);
  }
  if (artifact.format === "json") {
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (error) {
      fail(`${label} is not valid JSON: ${artifact.path} (${error.message})`);
    }
    cache.set(artifact.path, parsed);
    for (const assertion of artifact.assertions || []) {
      const actual = pointer(parsed, assertion.pointer, `${label} ${artifact.path}`);
      if (JSON.stringify(actual) !== JSON.stringify(assertion.equals)) {
        fail(
          `${label} assertion failed at ${assertion.pointer}: expected ${JSON.stringify(assertion.equals)}, got ${JSON.stringify(actual)}.`,
        );
      }
    }
  }
}

function sourceRows(root, source, cache, candidateId) {
  if (Array.isArray(source.rows)) return clone(source.rows);
  if (!source.path) fail(`${candidateId} row source has no path or explicit rows.`);
  let document = cache.get(source.path);
  if (!document) {
    const file = resolveInside(root, source.path, `${candidateId} row source`);
    document = readJson(file, `${candidateId} row source`).value;
    cache.set(source.path, document);
  }
  if (source.idsPointer || source.routesPointer) {
    const ids = pointer(document, source.idsPointer, `${candidateId} row source`);
    const routes = pointer(document, source.routesPointer, `${candidateId} row source`);
    if (!Array.isArray(ids) || !Array.isArray(routes) || ids.length !== routes.length) {
      fail(`${candidateId} parallel receipt arrays are missing or have different lengths.`);
    }
    return ids.map((englishId, index) => ({ englishId, swahiliRoute: routes[index] }));
  }
  const rows = pointer(document, source.rowsPointer, `${candidateId} row source`);
  if (!Array.isArray(rows)) fail(`${candidateId} row source ${source.rowsPointer} is not an array.`);
  return rows.map((row, index) => {
    if (!row || typeof row !== "object" || Array.isArray(row)) {
      fail(`${candidateId} row ${index + 1} is not an object.`);
    }
    if (source.statusPointer) {
      const status = pointer(row, source.statusPointer, `${candidateId} row ${index + 1}`);
      const acceptedValues = source.acceptedValues || ["accepted"];
      if (!acceptedValues.includes(status)) {
        fail(`${candidateId} row ${index + 1} lacks accepted receipt status.`);
      }
    }
    return {
      englishId: pointer(row, source.idPointer, `${candidateId} row ${index + 1}`),
      swahiliRoute: pointer(row, source.routePointer, `${candidateId} row ${index + 1}`),
    };
  });
}

function routeFile(root, route) {
  const relative = normalizeRoute(route).replace(/^\/+|\/+$/g, "");
  const candidates = [
    path.join(root, relative, "index.html"),
    path.join(root, `${relative}.html`),
  ];
  return candidates.find((file) => fs.existsSync(file) && fs.statSync(file).isFile()) || null;
}

function validateEvidence(root, evidence, candidateId) {
  if (!evidence || typeof evidence !== "object" || Array.isArray(evidence)) {
    fail(`${candidateId} has no exact accepted evidence object.`);
  }
  for (const key of ["browserSpec", "engineTest", "workflow", "export"]) {
    if (typeof evidence[key] !== "string" || !evidence[key].trim()) {
      fail(`${candidateId} evidence.${key} must be a non-empty string.`);
    }
  }
  for (const key of ["browserSpec", "engineTest"]) {
    const file = resolveInside(root, evidence[key], `${candidateId} evidence.${key}`);
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
      fail(`${candidateId} evidence file is missing: ${evidence[key]}.`);
    }
  }
}

function buildDesired({ root, manifest, inventory, ledger, mode = "check" }) {
  const expectedInventoryRows = manifest.authoritativeInventoryRows;
  if (!Number.isInteger(expectedInventoryRows) || expectedInventoryRows <= 0) {
    fail("manifest.authoritativeInventoryRows must be a positive integer.");
  }
  if (!Array.isArray(inventory.rows) || inventory.rows.length !== expectedInventoryRows) {
    fail(`authoritative inventory must contain exactly ${expectedInventoryRows} rows.`);
  }
  if (inventory.totals?.englishFreeApps !== expectedInventoryRows) {
    fail(`authoritative inventory total must be exactly ${expectedInventoryRows}.`);
  }
  if (!Array.isArray(ledger.entries)) fail("central ledger entries are missing.");
  if (!Array.isArray(manifest.candidates) || manifest.candidates.length !== manifest.expectedCandidates) {
    fail(`manifest must contain exactly ${manifest.expectedCandidates} candidates.`);
  }

  const inventoryById = new Map();
  for (const row of inventory.rows) {
    if (!row?.englishId || inventoryById.has(row.englishId)) {
      fail(`authoritative inventory contains a missing or duplicate ID: ${row?.englishId || "(empty)"}.`);
    }
    inventoryById.set(row.englishId, row);
  }

  const ledgerIds = new Set();
  for (const entry of ledger.entries) {
    if (!entry?.englishId || ledgerIds.has(entry.englishId)) {
      fail(`central ledger contains a missing or duplicate ID: ${entry?.englishId || "(empty)"}.`);
    }
    ledgerIds.add(entry.englishId);
  }
  const blockedBefore = ledger.entries.filter((entry) => entry.status === "blocked").map(clone);
  const resolvedBlockedEntries = manifest.resolvedBlockedEntries || 0;
  const expectedBlockedBefore = manifest.preservedBlockedEntries + (mode === "write" ? resolvedBlockedEntries : 0);
  if (!Number.isInteger(manifest.preservedBlockedEntries) || manifest.preservedBlockedEntries < 0
      || !Number.isInteger(resolvedBlockedEntries) || resolvedBlockedEntries < 0) {
    fail("blocked-entry counts must be non-negative integers.");
  }
  if (blockedBefore.length !== expectedBlockedBefore) {
    fail(`central ledger must contain exactly ${expectedBlockedBefore} blocked entries, found ${blockedBefore.length}.`);
  }

  const candidateIds = new Set();
  const candidateRoutes = new Set();
  const desiredEntries = [];
  const entriesToAppend = [];
  const blockedReplacements = new Map();
  let routeTotal = 0;

  for (const candidate of manifest.candidates) {
    const candidateId = candidate.id || candidate.commit;
    if (!/^[0-9a-f]{40}$/i.test(candidate.commit || "")) {
      fail(`${candidateId} does not name an exact 40-character commit.`);
    }
    if (
      candidate.approval?.status !== "accepted"
      || candidate.approval?.independentlyReviewed !== true
      || candidate.approval?.acceptedRouteCount !== candidate.expectedRoutes
    ) {
      fail(`${candidateId} lacks exact independently accepted receipt evidence.`);
    }
    validateEvidence(root, candidate.approval.evidence, candidateId);

    const cache = new Map();
    if (!Array.isArray(candidate.artifacts) || candidate.artifacts.length === 0) {
      fail(`${candidateId} has no candidate manifest or receipt artifacts.`);
    }
    for (const artifact of candidate.artifacts) assertArtifact(root, artifact, cache, candidateId);
    if (!Array.isArray(candidate.rowSources) || candidate.rowSources.length === 0) {
      fail(`${candidateId} has no deterministic candidate row source.`);
    }

    const rows = candidate.rowSources.flatMap((source) => sourceRows(root, source, cache, candidateId));
    if (rows.length !== candidate.expectedRoutes) {
      fail(`${candidateId} must resolve exactly ${candidate.expectedRoutes} routes, found ${rows.length}.`);
    }
    routeTotal += rows.length;

    for (const rawRow of rows) {
      const englishId = String(rawRow.englishId || "").trim();
      const swahiliRoute = normalizeRoute(rawRow.swahiliRoute);
      if (!englishId) fail(`${candidateId} contains an empty English ID.`);
      if (!swahiliRoute.startsWith("/sw/") || swahiliRoute === "/sw/") {
        fail(`${candidateId}/${englishId} does not name a physical Swahili route.`);
      }
      if (candidateIds.has(englishId)) fail(`duplicate candidate ID: ${englishId}.`);
      if (candidateRoutes.has(swahiliRoute)) fail(`duplicate candidate route: ${swahiliRoute}.`);
      const inventoryRow = inventoryById.get(englishId);
      if (!inventoryRow) fail(`candidate ID is unknown to the authoritative inventory: ${englishId}.`);
      const inventoryRoute = normalizeRoute(inventoryRow.primarySwahiliRoute);
      if (inventoryRoute && inventoryRoute !== swahiliRoute) {
        fail(`${englishId} conflicts with authoritative inventory route ${inventoryRoute}.`);
      }
      const ownerFile = routeFile(root, swahiliRoute);
      if (!ownerFile) fail(`${englishId} has no physical Swahili route for ${swahiliRoute}.`);
      const html = fs.readFileSync(ownerFile, "utf8");
      if (!/<html\b[^>]*\blang=["']sw(?:-|["'])/i.test(html)) {
        fail(`${englishId} physical owner does not declare lang=sw: ${path.relative(root, ownerFile)}.`);
      }

      candidateIds.add(englishId);
      candidateRoutes.add(swahiliRoute);
      const desiredEntry = {
        englishId,
        swahiliRoute,
        status: "accepted",
        categoryKey: inventoryRow.categoryKey,
        evidence: clone(candidate.approval.evidence),
      };
      if (ledgerIds.has(englishId)) {
        const existing = ledger.entries.find((entry) => entry.englishId === englishId);
        if (mode === "write" && existing.status === "blocked" && candidate.approval.resolvesBlocked === true) {
          if (normalizeRoute(existing.swahiliRoute) !== swahiliRoute) {
            fail(`${englishId} blocked route does not match the accepted physical owner.`);
          }
          blockedReplacements.set(englishId, desiredEntry);
        } else if (mode !== "check" || JSON.stringify(existing) !== JSON.stringify(desiredEntry)) {
          fail(`candidate ID already exists in the central ledger: ${englishId}.`);
        }
      } else {
        entriesToAppend.push(desiredEntry);
      }
      desiredEntries.push(desiredEntry);
    }
  }

  if (routeTotal !== manifest.expectedAcceptedRoutes) {
    fail(`batch must contain exactly ${manifest.expectedAcceptedRoutes} routes, found ${routeTotal}.`);
  }

  if (mode === "write" && blockedReplacements.size !== resolvedBlockedEntries) {
    fail(`batch must resolve exactly ${resolvedBlockedEntries} blocked entries, found ${blockedReplacements.size}.`);
  }
  const desired = clone(ledger);
  desired.entries = desired.entries.map((entry) => blockedReplacements.get(entry.englishId) || entry);
  desired.entries.push(...entriesToAppend);
  const blockedAfter = desired.entries.filter((entry) => entry.status === "blocked");
  const blockedExpectedAfter = blockedBefore.filter((entry) => !blockedReplacements.has(entry.englishId));
  if (blockedAfter.length !== manifest.preservedBlockedEntries
      || JSON.stringify(blockedAfter) !== JSON.stringify(blockedExpectedAfter)) {
    fail("the unresolved blocked entries would not be preserved exactly.");
  }
  return { desired, desiredEntries, blockedBefore, blockedAfter, blockedResolved: blockedReplacements.size };
}

function runRecorder(options = {}) {
  const root = path.resolve(options.root || DEFAULT_ROOT);
  const manifestPath = resolveInside(root, options.manifestPath || DEFAULT_MANIFEST, "manifest path");
  const manifest = readJson(manifestPath, "coordinator manifest").value;
  const inventoryPath = resolveInside(root, options.inventoryPath || manifest.inventoryPath || DEFAULT_INVENTORY, "inventory path");
  const ledgerPath = resolveInside(root, options.ledgerPath || manifest.ledgerPath || DEFAULT_LEDGER, "ledger path");
  const inventory = readJson(inventoryPath, "authoritative inventory").value;
  const ledgerRead = readJson(ledgerPath, "central acceptance ledger");
  const mode = options.mode || "check";
  if (!['check', 'write'].includes(mode)) fail(`unsupported mode: ${mode}.`);
  const { desired, desiredEntries, blockedAfter, blockedResolved } = buildDesired({
    root,
    manifest,
    inventory,
    ledger: ledgerRead.value,
    mode,
  });
  const desiredText = `${JSON.stringify(desired, null, 2)}\n`;
  if (mode === "check") {
    if (ledgerRead.text !== desiredText) {
      fail(`central ledger is stale for ${desiredEntries.length} accepted routes; rerun with --write.`);
    }
  } else if (ledgerRead.text !== desiredText) {
    fs.writeFileSync(ledgerPath, desiredText, "utf8");
  }
  return {
    mode,
    acceptedRoutes: desiredEntries.length,
    blockedPreserved: blockedAfter.length,
    blockedResolved,
    ledgerPath,
  };
}

function cliArgs(argv) {
  const write = argv.includes("--write");
  const check = argv.includes("--check");
  if (write === check) fail("pass exactly one of --check or --write.");
  const value = (flag) => {
    const index = argv.indexOf(flag);
    if (index < 0) return undefined;
    if (!argv[index + 1] || argv[index + 1].startsWith("--")) fail(`${flag} requires a value.`);
    return argv[index + 1];
  };
  return {
    mode: write ? "write" : "check",
    root: value("--root"),
    manifestPath: value("--manifest"),
    inventoryPath: value("--inventory"),
    ledgerPath: value("--ledger"),
  };
}

if (require.main === module) {
  try {
    const result = runRecorder(cliArgs(process.argv.slice(2)));
    console.log(
      `${result.mode === "write" ? "Recorded" : "Verified"} ${result.acceptedRoutes} accepted Swahili routes; preserved ${result.blockedPreserved} and resolved ${result.blockedResolved} blocked entries.`,
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = {
  buildDesired,
  normalizeRoute,
  runRecorder,
};
