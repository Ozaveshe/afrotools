"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { build, exactShards } = require("../scripts/build-sw-financial-shard-a-receipt");

const ROOT = path.resolve(__dirname, "..");

test("derives exactly 46 shard A rows with zero shard B overlap", () => {
  const { unaccepted, shardA, shardB } = exactShards();
  assert.equal(unaccepted.length, 92);
  assert.equal(shardA.length, 46);
  assert.equal(shardB.length, 46);
  assert.equal(shardA[0].englishId, "afrorates");
  assert.equal(shardA[45].englishId, "loan-compare");
  assert.equal(shardB[0].englishId, "lr-paye");
  assert.deepEqual(shardA.filter((row) => shardB.some((other) => other.englishId === row.englishId)), []);
});

test("candidate receipt is fail-closed and coordinator-owned outputs remain outside the lane", () => {
  const { candidate } = build();
  assert.equal(candidate.totals.denominator, 46);
  assert.equal(candidate.totals.accepted, 18);
  assert.equal(candidate.totals.blocked, 28);
  assert.equal(candidate.totals.accepted + candidate.totals.blocked, 46);
  assert.equal(candidate.coordinatorOwnedFilesEdited, false);
  assert.equal(candidate.rows.find((row) => row.englishId === "crypto-prices").status, "blocked");
  assert.match(candidate.rows.find((row) => row.englishId === "crypto-prices").blocker, /category hub/i);
  for (const id of ["bj-paye", "cv-paye", "dj-paye", "gm-paye"]) {
    const row = candidate.rows.find((candidateRow) => candidateRow.englishId === id);
    assert.equal(row.status, "accepted", id);
    assert.ok(row.evidence.includes("tests/e2e/swahili-financial-shard-a-paye.spec.js"), id);
  }
  for (const id of ["currency-converter", "import-duty", "first-home-buyer", "job-offer-evaluator"]) {
    const row = candidate.rows.find((candidateRow) => candidateRow.englishId === id);
    assert.equal(row.status, "accepted", id);
    assert.ok(row.evidence.includes("tests/e2e/swahili-financial-shard-a-deterministic.spec.js"), id);
  }
  for (const row of candidate.rows.filter((item) => item.status === "accepted")) {
    assert.ok(row.swahiliFile, row.englishId);
    const html = fs.readFileSync(path.join(ROOT, row.swahiliFile), "utf8");
    assert.match(html, /<html\b[^>]*\blang=["']sw["']/i, row.englishId);
    assert.doesNotMatch(html, /<iframe\b/i, row.englishId);
    assert.match(html, /hreflang=["']en["']/i, row.englishId);
    assert.match(html, /hreflang=["']sw["']/i, row.englishId);
    assert.match(html, /application\/ld\+json/i, row.englishId);
    assert.match(html, /\/assets\/css\/sw-financial-shard-a\.css/, row.englishId);
    assert.ok(row.artwork.length > 0, row.englishId);
  }
});

test("generated machine and human receipts are current", () => {
  const { candidate, missingArtwork, human } = build();
  assert.equal(fs.readFileSync(path.join(ROOT, "data/localization/sw-financial-shard-a-candidate.json"), "utf8"), `${JSON.stringify(candidate, null, 2)}\n`);
  assert.equal(fs.readFileSync(path.join(ROOT, "reports/swahili-financial-shard-a-missing-artwork.json"), "utf8"), `${JSON.stringify(missingArtwork, null, 2)}\n`);
  assert.equal(fs.readFileSync(path.join(ROOT, "reports/swahili-financial-shard-a-receipt.md"), "utf8"), human);
});
