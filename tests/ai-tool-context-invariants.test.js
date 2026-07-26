"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const builder = require("../scripts/build-ai-tool-context.js");
const drift = require("./ai-tool-context-drift.test.js");

const HASH_A = "sha256:" + "a".repeat(64);
const HASH_B = "sha256:" + "b".repeat(64);

function entry(fileName, toolKey, status, hash) {
  return {
    fileName,
    filePath: "data/ai/tool-context/" + fileName,
    definition: {
      schemaVersion: 1,
      toolKey,
      legacyTextSha256: hash,
      status,
      staticText: status === "source-coupled" ? "Context without numeric facts." : "Reviewed static context.",
      sourceBindings: status === "source-coupled" ? [{ kind: "fixture" }] : undefined,
    },
  };
}

test("source-derived summary preserves status counts without a literal total", () => {
  const inventory = drift.summarizeSourceDefinitions([
    entry("alpha.json", "alpha", "source-coupled", HASH_A),
    entry("beta.json", "beta", "unverified-static", HASH_B),
  ]);

  assert.deepEqual(inventory.keys, ["alpha", "beta"]);
  assert.deepEqual(inventory.summary, {
    total: 2,
    sourceCoupled: 1,
    unverifiedStatic: 1,
  });
});

test("source inventory rejects duplicate keys, unsupported statuses and invalid legacy hashes", () => {
  assert.deepEqual(builder.ALLOWED_STATUSES, ["source-coupled", "unverified-static"]);
  assert.throws(
    () => drift.summarizeSourceDefinitions([
      entry("alpha.json", "alpha", "unverified-static", HASH_A),
      entry("alpha.json", "alpha", "unverified-static", HASH_B),
    ]),
    /Duplicate tool keys/
  );
  assert.throws(
    () => drift.summarizeSourceDefinitions([
      entry("alpha.json", "alpha", "reviewed-static", HASH_A),
    ]),
    /invalid status/
  );
  assert.throws(
    () => drift.summarizeSourceDefinitions([
      entry("alpha.json", "alpha", "unverified-static", "sha256:not-a-real-digest"),
    ]),
    /invalid legacyTextSha256/
  );
});

test("generated key comparison reports missing and extra contexts independently", () => {
  assert.deepEqual(
    drift.diffToolKeys(["alpha", "beta"], ["beta", "gamma"]),
    { missing: ["alpha"], extra: ["gamma"] }
  );
});

test("duplicate detector reports repeated generated or source keys", () => {
  assert.deepEqual(
    drift.duplicateToolKeys(["alpha", "beta", "alpha", "gamma", "beta"]),
    ["alpha", "beta"]
  );
});
