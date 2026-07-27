#!/usr/bin/env node
/*
 * Pins the calibration behaviour against the real misroutes that motivated it.
 *
 * Each case below was produced by an out-of-sample probe of the live router in
 * July 2026, where every one of these wrong answers reported confidence 0.9.
 * The assertions are about honesty, not about picking a different tool: a
 * coin-flip must not present as certainty.
 */
const assert = require("assert");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const confidence = require(path.join(ROOT, "assets", "js", "ai", "afro-confidence.js"));
const manifestApi = require(path.join(ROOT, "assets", "js", "ai", "tool-manifest.js"));

function rank(query, manifest, limit) {
  const ranked = manifestApi.rankToolCandidates(query, manifest, { limit: limit || 5, minScore: 1 });
  return (ranked && ranked.candidates) || [];
}

function main() {
  const manifest = manifestApi.loadDefaultToolManifest();

  // --- 1. Four-way tie must not read as confident -------------------------
  {
    const candidates = rank("tax", manifest);
    const result = confidence.calibrate("tax", candidates);
    assert.ok(result.uncertain, '"tax" must be flagged uncertain, got band ' + result.band);
    assert.ok(result.confidence <= 0.35, '"tax" confidence should collapse, got ' + result.confidence);
    assert.ok(result.alternatives.length >= 1, '"tax" must offer alternatives to disambiguate');
  }

  // --- 2. Three-way tie on a currency query -------------------------------
  {
    const query = "convert 5000 dolars to naria";
    const candidates = rank(query, manifest);
    const result = confidence.calibrate(query, candidates);
    assert.ok(result.uncertain, "tied currency query must be uncertain, got " + result.band);
    assert.strictEqual(result.reason, "tied_candidates", "expected tie to be the stated reason, got " + result.reason);
  }

  // --- 3. Country conflict: a Nigeria question must not get a Kenya tool ---
  {
    const query = "stamp duty on a 50 million naira property in Lagos";
    const candidates = rank(query, manifest);
    const before = candidates[0] && candidates[0].tool && candidates[0].tool.id;
    assert.strictEqual(confidence.detectQueryCountry(query), "NG", "query should read as Nigeria");

    const graded = confidence.calibrate(query, candidates);
    if (before && before.startsWith("ke-")) {
      assert.ok(graded.signals.countryConflict, "ke- tool on an NG query must flag a country conflict");
      assert.ok(graded.confidence <= 0.25, "country conflict must cap confidence, got " + graded.confidence);
    }

    const resolved = confidence.resolveCountryConflict(query, candidates);
    const after = resolved[0] && resolved[0].tool && resolved[0].tool.id;
    assert.ok(!String(after).startsWith("ke-"), "resolver must demote the Kenyan tool, still got " + after);
  }

  // --- 4. Country detection basics ----------------------------------------
  assert.strictEqual(confidence.detectQueryCountry("what rent can I afford in Johannesburg"), "ZA");
  assert.strictEqual(confidence.detectQueryCountry("how much cedi do I need"), "GH");
  assert.strictEqual(confidence.detectQueryCountry("compare Lagos and Nairobi"), null, "two countries is a comparison, not a conflict");
  assert.strictEqual(confidence.detectQueryCountry("calculate my VAT"), null, "country-neutral query");
  assert.strictEqual(confidence.detectToolCountry("ke-stamp-duty"), "KE");
  assert.strictEqual(confidence.detectToolCountry("stamp-duty"), null);

  // --- 5. Short queries can never be confident ----------------------------
  ["money", "help", "tax"].forEach((query) => {
    const result = confidence.calibrate(query, rank(query, manifest));
    assert.ok(result.confidence < 0.7, '"' + query + '" must not be confident, got ' + result.confidence);
  });

  // --- 6. A genuinely clear query should still be answerable ---------------
  {
    const query = "calculate PAYE take home pay for an employee earning 50000 in Kenya";
    const result = confidence.calibrate(query, rank(query, manifest));
    assert.ok(result.confidence > 0, "a specific query should produce a positive confidence");
    assert.ok(!result.signals.countryConflict, "Kenya query with Kenyan tooling is not a conflict");
  }

  // --- 7. Empty candidate list degrades honestly ---------------------------
  {
    const result = confidence.calibrate("anything", []);
    assert.strictEqual(result.confidence, 0);
    assert.ok(result.uncertain);
    assert.strictEqual(result.reason, "no_candidates");
  }

  // --- 8. Confidence must actually vary (the original defect) --------------
  {
    const queries = [
      "tax",
      "money",
      "convert 5000 dolars to naria",
      "calculate PAYE take home pay for an employee earning 50000 in Kenya",
      "estimate solar payback for a shop in Lagos with a 200000 monthly bill"
    ];
    const values = new Set(queries.map((query) => confidence.calibrate(query, rank(query, manifest)).confidence));
    assert.ok(values.size >= 3, "confidence must discriminate across queries, got " + values.size + " distinct values");
  }


  // --- 9. Afro 1.1: the lexicon must be able to INJECT, not just reorder ----
  // The 1.0 defect: the lexicon named the right tool but retrieval had never
  // returned it, so re-ranking was powerless exactly when the lexicon was most
  // right. resolve() must add it to the candidate set.
  {
    const lexicon = JSON.parse(require("fs").readFileSync(
      require("path").join(ROOT, "data", "ai", "afro-lexicon.json"), "utf8"));
    const query = "what will my take home pay be in Kenya if I earn 85000 a month";
    const retrieved = rank(query, manifest);
    assert.ok(!retrieved.some((c) => c.tool.id === "ke-paye"),
      "precondition: retrieval alone should still miss ke-paye here");

    const resolved = confidence.resolve(query, retrieved, { manifest, lexicon });
    const ids = resolved.candidates.map((c) => (c.tool && c.tool.id) || c.toolId);
    assert.ok(ids.indexOf("ke-paye") !== -1 || ids.indexOf("paye-calculator") !== -1,
      "resolve() must inject the tool the lexicon named, got " + ids.slice(0, 4).join(", "));
    assert.ok(resolved.lexiconUsed, "resolve() should report that the lexicon fired");
  }

  // --- 10. Phrase matching survives colloquial variation --------------------
  // The lexicon carries "wetin go remain"; users write "how much go remain".
  {
    // Three or more distinctive words: one may be missing.
    assert.ok(confidence.phraseMatches(" cheapest way to send money to lagos ", "cheapest way send money"),
      "a 3+ word phrase should survive one word being absent");
    // Two distinctive words must be exact — a lexicon hit injects a candidate
    // in 1.1, so a false positive manufactures a confident wrong answer.
    assert.ok(!confidence.phraseMatches(" how much go remain after tax ", "wetin go remain"),
      "two-word phrases must not fuzzy-match; add the variant to the lexicon instead");
    assert.ok(!confidence.phraseMatches(" i need a loan ", "bill of quantities"),
      "loosening must not make unrelated phrases match");
    // Single words stay exact — loosening them would fire constantly.
    assert.ok(!confidence.phraseMatches(" zakariya is my friend ", "zakat"),
      "single-word phrases must still require an exact match");
  }

  console.log("afro-confidence tests passed (" + confidence.VERSION + ")");
}

main();
