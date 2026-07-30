"use strict";

const assert = require("assert");
const { buildArtifacts } = require("../scripts/build-sw-agriculture-parity-stop-receipt");

const artifacts = buildArtifacts();
const receipt = JSON.parse(artifacts["reports/sw-agriculture-parity-stop-receipt-2026-07-31.json"]);
const artwork = JSON.parse(artifacts["reports/sw-agriculture-missing-artwork-queue.json"]);

assert.equal(receipt.outcome, "stopped-at-english-engine-extraction-boundary");
assert.equal(receipt.counts.inScopeRows, 447);
assert.equal(receipt.counts.acceptedAtCheckpoint, 0);
assert.equal(receipt.counts.acceptedThisLane, 0);
assert.equal(receipt.counts.architectureBlockedRows, 1);
assert.equal(receipt.counts.pausedByMandatoryStop, 446);
assert.equal(receipt.counts.mappedCandidates, 33);
assert.equal(receipt.counts.missingSwahiliOwners, 414);
assert.deepEqual(receipt.counts.baselineStates, {
  "localized-shell-candidate": 18,
  missing: 414,
  "native-candidate": 15,
});
assert.equal(receipt.rows.length, 447);
assert.equal(receipt.architectureBlockers[0].englishId, "vaccination-schedule");
assert.equal(receipt.architectureBlockers[0].inspectedEngineCandidates[0].domFree, false);
assert.ok(receipt.architectureBlockers[0].inspectedEngineCandidates[0].domEvidence.length > 0);
assert.equal(receipt.nonBlockingEngineReconciliation[0].englishId, "poultry-roi-calculator");
assert.equal(receipt.nonBlockingEngineReconciliation[0].domFree, true);
assert.equal(
  receipt.validation.find((entry) => entry.command === "npm run agriculture:discovery:check").status,
  "failed-baseline"
);
assert.equal(artwork.scopeRows, 447);
assert.equal(artwork.count, 0);
assert.deepEqual(artwork.rows, []);

console.log("Swahili Agriculture architecture-stop receipt verified for all 447 scoped rows.");
