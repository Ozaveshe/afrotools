"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { exactShards } = require("../scripts/build-sw-financial-shard-a-receipt");
const routeEntry = require("../assets/js/pages/sw-ai-route-entry");
const routeMap = require("../assets/js/ai/swahili-route-map.generated");
const { assertLifecycle } = require("./support/swahili-acceptance-lifecycle");

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
  const candidate = JSON.parse(fs.readFileSync(path.join(ROOT, "data/localization/sw-financial-shard-a-candidate.json"), "utf8"));
  assert.equal(candidate.totals.denominator, 46);
  assert.equal(candidate.totals.accepted + candidate.totals.blocked, 46);
  assert.equal(candidate.coordinatorOwnedFilesEdited, false);
  assert.equal(candidate.rows.find((row) => row.englishId === "crypto-prices").status, "blocked");
  assert.match(candidate.rows.find((row) => row.englishId === "crypto-prices").blocker, /category hub/i);
  assert.match(candidate.rows.find((row) => row.englishId === "business-planner").blocker, /deterministic template output as AI/i);
  for (const id of ["cd-paye", "cg-paye", "dz-paye"]) {
    assert.match(candidate.rows.find((row) => row.englishId === id).blocker, /raw salary\/chat content/i, id);
  }
  for (const id of ["bj-paye", "cv-paye", "dj-paye", "gm-paye"]) {
    const row = candidate.rows.find((candidateRow) => candidateRow.englishId === id);
    assert.equal(row.status, "accepted", id);
    assert.ok(row.evidence.includes("tests/e2e/swahili-financial-shard-a-paye.spec.js"), id);
  }
  for (const id of ["currency-converter", "import-duty", "first-home-buyer", "job-offer-evaluator", "er-vat"]) {
    const row = candidate.rows.find((candidateRow) => candidateRow.englishId === id);
    assert.equal(row.status, "accepted", id);
    assert.ok(row.evidence.includes("tests/e2e/swahili-financial-shard-a-deterministic.spec.js"), id);
  }
  const cryptoProfit = candidate.rows.find((row) => row.englishId === "crypto-profit");
  assert.equal(cryptoProfit.status, "accepted");
  assert.equal(cryptoProfit.swahiliRoute, "/sw/zana/kikokotoo-faida-crypto");
  assert.ok(cryptoProfit.evidence.includes("tests/e2e/swahili-financial-shard-a-crypto-profit.spec.js"));
  const cryptoMining = candidate.rows.find((row) => row.englishId === "crypto-mining");
  assert.equal(cryptoMining.status, "accepted");
  assert.equal(cryptoMining.swahiliRoute, "/sw/zana/kikokotoo-margin-uchimbaji-crypto");
  assert.ok(cryptoMining.evidence.includes("tests/crypto-mining-margin-engine.test.js"));
  assert.ok(cryptoMining.evidence.includes("tests/e2e/swahili-financial-shard-a-crypto-mining.spec.js"));
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

test("central lifecycle is exact for every immutable shard A ID", () => {
  const { inventory, shardA } = exactShards();
  const acceptance = JSON.parse(fs.readFileSync(path.join(ROOT, "data/audits/swahili-free-app-acceptance.json"), "utf8"));
  assertLifecycle({
    inventory,
    acceptance,
    routeEntry,
    routeMap,
    apps: shardA.map((row) => ({ id: row.englishId, swahiliRoute: row.primarySwahiliRoute })),
  });
});

test("frozen machine and human receipts preserve the exact 46-row lane", () => {
  const candidate = JSON.parse(fs.readFileSync(path.join(ROOT, "data/localization/sw-financial-shard-a-candidate.json"), "utf8"));
  const missingArtwork = JSON.parse(fs.readFileSync(path.join(ROOT, "reports/swahili-financial-shard-a-missing-artwork.json"), "utf8"));
  const human = fs.readFileSync(path.join(ROOT, "reports/swahili-financial-shard-a-receipt.md"), "utf8");
  const { shardA } = exactShards();
  assert.equal(candidate.baseSha, "6edacda8437e1fa9b9e5a512138cbdd3169e38be");
  assert.equal(candidate.rows.length, 46);
  assert.deepEqual(candidate.rows.map((row) => row.englishId), shardA.map((row) => row.englishId));
  assert.equal(candidate.totals.accepted + candidate.totals.blocked, 46);
  assert.equal(missingArtwork.lane, candidate.lane);
  assert.match(human, /46 denominator/);
});
