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

test("explicit BF hold removes calculation discovery without withholding other review-required engines", () => {
  const registry = require("../netlify/functions/_engines");
  const availability = require("../data/calculation-quality/paye-availability.json");
  const formulas = require("../data/calculation-quality/formula-registry.json").formulas;
  assert.equal(availability.schemaVersion, 1);
  assert.deepEqual(Object.keys(availability.countries), ["BF"]);
  assert.equal(registry.get("BF"), null);
  assert.equal(registry.get("bf"), null);
  assert.equal(registry.getFormula("BF"), null);
  for (const effectiveOn of [undefined, "2026-01-01", "1900-01-01"])
    assert.deepEqual(registry.resolve("bf", effectiveOn), {
      ok: false, error: "PAYROLL_WITHHELD", jurisdiction: "BF",
      effectiveOn: effectiveOn || null, reasonCode: availability.countries.BF.reasonCode,
    });
  const available = formulas.filter(f => f.formulaFamily === "paye-server" && f.jurisdictions.length === 1)
    .map(f => f.jurisdictions[0]).filter(code => code !== "BF").sort();
  assert.equal(available.length, 52);
  assert.deepEqual(registry.listCountryCodes(), available);
  assert.equal(registry.count(), available.length);
  assert.deepEqual(registry.listCountries().map(row => row.code).sort(), available);
  for (const code of available) {
    assert.equal(typeof registry.get(code).calculate, "function", code);
    assert.equal(registry.resolve(code).ok, true, code + " remains available without an effective-date request");
  }
  assert.ok(formulas.some(f => f.formulaFamily === "paye-server" && f.effectiveDateStatus === "review-required"
    && f.jurisdictions[0] !== "BF" && registry.get(f.jurisdictions[0])), "review-required alone must not withhold engines");
  assert.equal(registry.resolve("XX").error, "UNSUPPORTED_JURISDICTION");
  assert.equal(registry.resolve("ZA", "2026-03-01").error, "UNSUPPORTED_DATE");
});

test("BF AI availability is source-coupled and contains no calculable payroll facts", () => {
  const crypto = require("node:crypto"), fs = require("node:fs"), path = require("node:path");
  const policy = require("../data/calculation-quality/paye-availability.json");
  const held = builder.buildAll();
  const record = held.records["bf-paye-fr"], facts = record.sourceRecord.facts;
  assert.equal(record.definition.status, "source-coupled");
  assert.equal(record.definition.toolKey, "bf-paye-fr");
  assert.match(held.contexts["bf-paye-fr"], /Répondez TOUJOURS en français/);
  assert.equal(facts.availability, "withheld");
  assert.equal(facts.calculable, false);
  assert.equal(facts.countryCode, "BF");
  assert.equal(facts.reasonCode, policy.countries.BF.reasonCode);
  assert.equal(facts.sourceLabel, policy.countries.BF.sourceLabel);
  const digest = text => "sha256:" + crypto.createHash("sha256").update(text).digest("hex");
  assert.equal(facts.policyDigest, digest(JSON.stringify(policy, null, 2) + "\n"));
  assert.equal(facts.webHoldDigest, digest(fs.readFileSync(path.join(__dirname, "..", policy.countries.BF.webHoldController), "utf8")));
  assert.deepEqual(Object.keys(facts).sort(), ["countryCode", "availability", "calculable", "reasonCode", "sourceLabel", "policyPath", "policyDigest", "webHoldDigest"].sort());
  assert.match(held.contexts["bf-paye-fr"], /Do not calculate or estimate/);
  assert.match(held.contexts["bf-paye-fr"], /no current payroll rules or new source review date/);
  assert.doesNotMatch(held.contexts["bf-paye-fr"], /\d|%|XOF|Current structured|As of:|Formula:/);
});
