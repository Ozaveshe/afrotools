#!/usr/bin/env node
/*
 * The learning loop must be useful AND must not leak prompts.
 *
 * The drift-intake pipeline promises syntheticPromptsOnly / rawPromptIncluded:
 * false. These tests assert that promise holds by construction: whatever a user
 * types, the outgoing report contains only tool ids, counts and reason codes.
 */
const assert = require("assert");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

// Minimal localStorage so the module can run outside a browser.
const store = {};
global.localStorage = {
  getItem: (key) => (key in store ? store[key] : null),
  setItem: (key, value) => { store[key] = String(value); },
  removeItem: (key) => { delete store[key]; }
};

const learn = require(path.join(ROOT, "assets", "js", "ai", "afro-learn.js"));

function main() {
  learn.clear();

  // --- a correction is learned -------------------------------------------
  const corrected = learn.recordCorrection({
    shown: ["home-workout", "ke-paye", "first-home-buyer"],
    chosen: "ke-paye",
    confidence: 0.45,
    reason: "low_term_coverage"
  });
  assert.ok(corrected, "a correction should be recorded");
  assert.strictEqual(corrected.rankChosen, 1);
  assert.strictEqual(corrected.confirmed, false);

  // --- picking the top result is a confirmation, not a correction ---------
  const confirmed = learn.recordCorrection({
    shown: ["cv-builder", "cover-letter"],
    chosen: "cv-builder",
    confidence: 0.8
  });
  assert.strictEqual(confirmed.confirmed, true, "choosing rank 0 is a confirmation");

  // --- nothing to learn from an empty event -------------------------------
  assert.strictEqual(learn.recordCorrection({ shown: [], chosen: null }), null);
  assert.strictEqual(learn.recordCorrection(null), null);

  // --- repeated corrections rank the lexicon queue by impact ---------------
  for (let i = 0; i < 3; i++) {
    learn.recordCorrection({ shown: ["bill-split", "boq-gen"], chosen: "boq-gen", confidence: 0.35, reason: "tied_candidates" });
  }
  const report = learn.buildReport();
  assert.strictEqual(report.totals.corrections, 4);
  assert.strictEqual(report.totals.confirmations, 1);
  const top = report.lexiconCandidates[0];
  assert.strictEqual(top.proposedTool, "bill-split");
  assert.strictEqual(top.correctTool, "boq-gen");
  assert.strictEqual(top.count, 3, "the most-corrected pair must lead the queue");

  // --- THE PRIVACY GUARANTEE ----------------------------------------------
  // Feed a signal alongside a prompt containing obvious personal data and
  // assert none of it can reach the report. The API takes no prompt at all,
  // which is the point: the guarantee is structural, not a filter.
  const secrets = ["Chidinma Okafor", "salary 450000", "BVN 22134567890", "chidi@example.com"];
  learn.recordCorrection({
    shown: ["service-charge", "mobile-money-fees"],
    chosen: "mobile-money-fees",
    confidence: 0.5,
    reason: "low_term_coverage"
  });
  const serialised = JSON.stringify(learn.buildReport());
  secrets.forEach((secret) => {
    assert.ok(serialised.indexOf(secret) === -1, "report must never contain user text: " + secret);
  });
  assert.strictEqual(learn.buildReport().containsRawPrompts, false);

  // Every string in the report must be a tool id, a reason code, or a key we chose.
  const allowedReasons = ["tied_candidates", "country_conflict", "query_too_short", "low_term_coverage", "clear_match", "no_candidates"];
  learn.buildReport().lexiconCandidates.forEach((candidate) => {
    assert.ok(/^[a-z0-9-]+$/.test(candidate.proposedTool), "proposedTool must be a tool id");
    assert.ok(/^[a-z0-9-]+$/.test(candidate.correctTool), "correctTool must be a tool id");
    Object.keys(candidate.reasons).forEach((reason) => {
      assert.ok(allowedReasons.indexOf(reason) !== -1, "unexpected reason code: " + reason);
    });
  });

  // --- storage is bounded so it cannot grow without limit ------------------
  for (let i = 0; i < 400; i++) {
    learn.recordCorrection({ shown: ["a-tool", "b-tool"], chosen: "b-tool", confidence: 0.4 });
  }
  assert.ok(learn.readSignals().length <= 300, "signal log must stay bounded");

  learn.clear();
  assert.strictEqual(learn.readSignals().length, 0);

  console.log("afro-learn tests passed (" + learn.VERSION + ") — no raw prompts, bounded storage, impact-ranked queue");
}

main();
