#!/usr/bin/env node
/*
 * Afro-Bench runner.
 *
 * Reports two numbers that matter and are usually conflated:
 *
 *   ACCURACY    — did the router land on a tool that actually helps?
 *   CALIBRATION — does its confidence predict its own correctness?
 *
 * Calibration is the one that makes the product trustworthy. A router that is
 * 70% accurate and knows which 30% it got wrong is far more useful than one
 * that is 80% accurate and asserts everything at 0.9, because the first can ask
 * a clarifying question and the second cannot.
 *
 * Usage:
 *   node scripts/run-afro-bench.js            # summary
 *   node scripts/run-afro-bench.js --verbose  # per-case detail
 *   node scripts/run-afro-bench.js --json     # machine-readable, for tracking
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const bench = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "ai", "afro-bench.json"), "utf8"));
const manifestApi = require(path.join(ROOT, "assets", "js", "ai", "tool-manifest.js"));
const confidence = require(path.join(ROOT, "assets", "js", "ai", "afro-confidence.js"));

const VERBOSE = process.argv.includes("--verbose");
const AS_JSON = process.argv.includes("--json");

function toolIdOf(candidate) {
  if (!candidate) return null;
  if (candidate.tool && candidate.tool.id) return candidate.tool.id;
  return candidate.toolId || candidate.id || null;
}

function runCase(testCase, manifest) {
  const ranked = manifestApi.rankToolCandidates(testCase.prompt, manifest, { limit: 5, minScore: 1 });
  let candidates = (ranked && ranked.candidates) || [];
  if (!process.argv.includes("--no-rerank")) {
    candidates = confidence.rerank(testCase.prompt, candidates, { manifest });
  }
  candidates = confidence.resolveCountryConflict(testCase.prompt, candidates);

  const graded = confidence.calibrate(testCase.prompt, candidates, { manifest });
  const picked = toolIdOf(candidates[0]);

  const acceptable = testCase.acceptable || [];
  const rejects = testCase.rejects || [];

  let correct;
  if (testCase.expectUncertain) {
    // For a genuinely ambiguous prompt the only right behaviour is to admit it.
    correct = graded.uncertain;
  } else {
    correct = !!picked && acceptable.indexOf(picked) !== -1 && rejects.indexOf(picked) === -1;
  }

  return {
    id: testCase.id,
    category: testCase.category,
    style: testCase.style,
    prompt: testCase.prompt,
    picked,
    correct,
    expectUncertain: !!testCase.expectUncertain,
    confidence: graded.confidence,
    band: graded.band,
    uncertain: graded.uncertain,
    reason: graded.reason,
    alternatives: graded.alternatives.map((a) => a.toolId)
  };
}

function main() {
  const manifest = manifestApi.loadDefaultToolManifest();
  const results = bench.cases.map((testCase) => runCase(testCase, manifest));

  const total = results.length;
  const correct = results.filter((r) => r.correct).length;
  const accuracy = correct / total;

  // Calibration: of the answers it presented confidently, how many were right?
  // And of the ones it flagged, how many were actually wrong? A useful signal
  // means high precision when confident and high recall on its own mistakes.
  const answered = results.filter((r) => !r.expectUncertain);
  const shownConfident = answered.filter((r) => !r.uncertain);
  const flagged = answered.filter((r) => r.uncertain);
  const confidentAndRight = shownConfident.filter((r) => r.correct).length;
  const flaggedAndWrong = flagged.filter((r) => !r.correct).length;
  const wrongTotal = answered.filter((r) => !r.correct).length;

  const precisionWhenConfident = shownConfident.length ? confidentAndRight / shownConfident.length : 0;
  const recallOfOwnErrors = wrongTotal ? flaggedAndWrong / wrongTotal : 1;

  const byCategory = {};
  results.forEach((r) => {
    byCategory[r.category] = byCategory[r.category] || { total: 0, correct: 0 };
    byCategory[r.category].total++;
    if (r.correct) byCategory[r.category].correct++;
  });

  const byStyle = {};
  results.forEach((r) => {
    byStyle[r.style] = byStyle[r.style] || { total: 0, correct: 0 };
    byStyle[r.style].total++;
    if (r.correct) byStyle[r.style].correct++;
  });

  const summary = {
    benchmark: bench.name,
    version: bench.version,
    cases: total,
    accuracy: Number(accuracy.toFixed(3)),
    precisionWhenConfident: Number(precisionWhenConfident.toFixed(3)),
    recallOfOwnErrors: Number(recallOfOwnErrors.toFixed(3)),
    byCategory,
    byStyle
  };

  if (AS_JSON) {
    console.log(JSON.stringify({ summary, results }, null, 1));
    return;
  }

  console.log("=== " + bench.name + " v" + bench.version + " ===\n");
  if (VERBOSE) {
    results.forEach((r) => {
      const mark = r.correct ? " ok " : "MISS";
      console.log(
        mark + "  " + String(r.confidence).padEnd(6) + r.band.padEnd(11) +
        r.prompt.slice(0, 46).padEnd(48) + "-> " + String(r.picked || "—").slice(0, 24)
      );
      if (!r.correct && r.alternatives.length) console.log("        alts: " + r.alternatives.join(", "));
    });
    console.log("");
  }

  console.log("ACCURACY                     " + correct + "/" + total + "  (" + Math.round(accuracy * 100) + "%)");
  console.log("Precision when confident     " + Math.round(precisionWhenConfident * 100) + "%   (of answers it did NOT flag, how many were right)");
  console.log("Recall of its own errors     " + Math.round(recallOfOwnErrors * 100) + "%   (of its wrong answers, how many it flagged)");

  console.log("\nBy style:");
  Object.keys(byStyle).sort().forEach((style) => {
    const s = byStyle[style];
    console.log("  " + style.padEnd(18) + s.correct + "/" + s.total);
  });

  console.log("\nBy category (misses first):");
  Object.keys(byCategory)
    .sort((a, b) => (byCategory[a].correct / byCategory[a].total) - (byCategory[b].correct / byCategory[b].total))
    .forEach((category) => {
      const c = byCategory[category];
      console.log("  " + category.padEnd(20) + c.correct + "/" + c.total);
    });
}

main();
