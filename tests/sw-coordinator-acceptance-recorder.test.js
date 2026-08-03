"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const { runRecorder } = require("../scripts/record-sw-coordinator-acceptance.js");

const COMMIT = "1111111111111111111111111111111111111111";
const EVIDENCE = {
  browserSpec: "proof/browser.spec.js",
  engineTest: "proof/engine.test.js",
  workflow: "Exact route workflow proof from the independently accepted receipt.",
  export: "Exact local export disposition from the independently accepted receipt.",
};

function writeJson(root, relativePath, value) {
  const file = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function writeText(root, relativePath, value) {
  const file = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, value, "utf8");
}

function blockedEntries() {
  return ["bi-paye", "rw-paye", "ug-paye"].map((englishId) => ({
    englishId,
    swahiliRoute: `/sw/${englishId}/`,
    status: "blocked",
    categoryKey: "financial",
    evidence: { workflow: `${englishId} proof` },
    blocker: `${englishId} remains blocked`,
  }));
}

function fixture(options = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "sw-acceptance-recorder-"));
  const candidateId = options.candidateId || "candidate-app";
  const candidateRoute = options.candidateRoute || "/sw/zana/candidate-app/";
  const inventoryId = options.inventoryId || candidateId;
  const inventoryRoute = options.inventoryRoute === undefined ? candidateRoute : options.inventoryRoute;
  const rows = [{
    englishId: inventoryId,
    categoryKey: "developer",
    primarySwahiliRoute: inventoryRoute,
  }];
  for (let index = 1; index < 1257; index += 1) {
    rows.push({ englishId: `filler-${index}`, categoryKey: "filler", primarySwahiliRoute: null });
  }
  writeJson(root, "inventory.json", {
    totals: { englishFreeApps: 1257 },
    rows,
  });
  const blocked = blockedEntries();
  writeJson(root, "ledger.json", {
    schemaVersion: 1,
    reviewedAt: "2026-07-31",
    entries: options.ledgerEntries || blocked,
  });
  writeJson(root, "receipt.json", {
    outcome: options.receiptOutcome || "accepted",
    accepted: options.receiptAccepted === undefined ? 1 : options.receiptAccepted,
    blocked: options.receiptBlocked || 0,
    rows: options.receiptRows || [{ englishId: candidateId, swahiliRoute: candidateRoute, status: "accepted" }],
  });
  writeText(root, "proof/browser.spec.js", "// exact browser receipt\n");
  writeText(root, "proof/engine.test.js", "// exact engine receipt\n");
  if (!options.omitRoute) {
    writeText(root, "sw/zana/candidate-app/index.html", '<!doctype html><html lang="sw"><title>Candidate</title></html>\n');
  }
  const manifest = {
    schemaVersion: 1,
    authoritativeInventoryRows: 1257,
    expectedCandidates: 1,
    expectedAcceptedRoutes: 1,
    preservedBlockedEntries: 3,
    candidates: [{
      id: "fixture-candidate",
      commit: COMMIT,
      expectedRoutes: 1,
      approval: options.approval || {
        status: "accepted",
        independentlyReviewed: true,
        acceptedRouteCount: 1,
        evidence: EVIDENCE,
      },
      artifacts: [{
        path: "receipt.json",
        format: "json",
        assertions: [
          { pointer: "/outcome", equals: "accepted" },
          { pointer: "/accepted", equals: 1 },
          { pointer: "/blocked", equals: 0 },
        ],
      }],
      rowSources: [{
        path: "receipt.json",
        rowsPointer: "/rows",
        idPointer: "/englishId",
        routePointer: "/swahiliRoute",
        statusPointer: "/status",
        acceptedValues: ["accepted"],
      }],
    }],
  };
  writeJson(root, "manifest.json", manifest);
  return { root, blocked, manifest };
}

function run(root, mode) {
  return runRecorder({
    root,
    mode,
    manifestPath: "manifest.json",
    inventoryPath: "inventory.json",
    ledgerPath: "ledger.json",
  });
}

test("writes one exact accepted evidence object and preserves all three blocked entries", () => {
  const { root, blocked } = fixture();
  const result = run(root, "write");
  assert.deepEqual(result.acceptedRoutes, 1);
  assert.deepEqual(result.blockedPreserved, 3);
  const ledger = JSON.parse(fs.readFileSync(path.join(root, "ledger.json"), "utf8"));
  assert.deepEqual(ledger.entries.slice(0, 3), blocked);
  assert.deepEqual(ledger.entries[3], {
    englishId: "candidate-app",
    swahiliRoute: "/sw/zana/candidate-app/",
    status: "accepted",
    categoryKey: "developer",
    evidence: EVIDENCE,
  });
  assert.doesNotThrow(() => run(root, "check"));
});

test("check reports a stale temp ledger and never writes it", () => {
  const { root } = fixture();
  const before = fs.readFileSync(path.join(root, "ledger.json"), "utf8");
  assert.throws(() => run(root, "check"), /ledger is stale/);
  assert.equal(fs.readFileSync(path.join(root, "ledger.json"), "utf8"), before);
});

test("rejects an ID absent from the authoritative 1,257-row inventory", () => {
  const { root } = fixture({ inventoryId: "different-app" });
  const before = fs.readFileSync(path.join(root, "ledger.json"), "utf8");
  assert.throws(() => run(root, "write"), /unknown to the authoritative inventory/);
  assert.equal(fs.readFileSync(path.join(root, "ledger.json"), "utf8"), before);
});

test("rejects duplicate candidate IDs before writing", () => {
  const { root, manifest } = fixture();
  manifest.expectedAcceptedRoutes = 2;
  manifest.candidates[0].expectedRoutes = 2;
  manifest.candidates[0].approval.acceptedRouteCount = 2;
  manifest.candidates[0].rowSources = [{
    rows: [
      { englishId: "candidate-app", swahiliRoute: "/sw/zana/candidate-app/" },
      { englishId: "candidate-app", swahiliRoute: "/sw/zana/candidate-app-copy/" },
    ],
  }];
  writeText(root, "sw/zana/candidate-app-copy/index.html", '<html lang="sw"></html>\n');
  writeJson(root, "manifest.json", manifest);
  assert.throws(() => run(root, "write"), /duplicate candidate ID/);
});

test("rejects a central-existing candidate ID and leaves blocked rows byte-for-byte unchanged", () => {
  const blocked = blockedEntries();
  const existing = {
    englishId: "candidate-app",
    swahiliRoute: "/sw/zana/old-owner/",
    status: "accepted",
    categoryKey: "developer",
    evidence: EVIDENCE,
  };
  const { root } = fixture({ ledgerEntries: [...blocked, existing] });
  const before = fs.readFileSync(path.join(root, "ledger.json"), "utf8");
  assert.throws(() => run(root, "write"), /already exists in the central ledger/);
  assert.equal(fs.readFileSync(path.join(root, "ledger.json"), "utf8"), before);
});

test("rejects a missing physical Swahili route", () => {
  const { root } = fixture({ omitRoute: true });
  assert.throws(() => run(root, "write"), /no physical Swahili route/);
});

test("never turns inventory or route presence into acceptance without an accepted receipt", () => {
  const { root } = fixture({
    approval: {
      status: "candidate-ready",
      independentlyReviewed: false,
      acceptedRouteCount: 1,
      evidence: EVIDENCE,
    },
  });
  assert.throws(() => run(root, "write"), /lacks exact independently accepted receipt evidence/);
});

test("rejects a receipt row whose route-level status is not accepted", () => {
  const { root } = fixture({
    receiptRows: [{
      englishId: "candidate-app",
      swahiliRoute: "/sw/zana/candidate-app/",
      status: "candidate-ready",
    }],
  });
  assert.throws(() => run(root, "write"), /lacks accepted receipt status/);
});

test("rejects a non-authoritative inventory size", () => {
  const { root } = fixture();
  const inventoryPath = path.join(root, "inventory.json");
  const inventory = JSON.parse(fs.readFileSync(inventoryPath, "utf8"));
  inventory.rows.pop();
  writeJson(root, "inventory.json", inventory);
  assert.throws(() => run(root, "write"), /exactly 1257 rows/);
});
