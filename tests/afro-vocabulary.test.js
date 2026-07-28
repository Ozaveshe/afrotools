#!/usr/bin/env node
/*
 * Pins the Afro 1.3 vocabulary pack.
 *
 * The pack exists because only 94 of 1,252 tools carried authored vocabulary,
 * so the other 92% were findable only by the words in their own title and
 * description. Two earlier versions were measured and rejected, and both
 * failure modes are asserted here because neither is visible by reading the
 * output — you only see them in a benchmark days later.
 */
const assert = require("assert");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const pack = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "ai", "afro-vocabulary.json"), "utf8"));
const directory = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "tool-directory.json"), "utf8"));

function main() {
  const tools = pack.tools || {};
  const ids = Object.keys(tools);

  // --- 1. Coverage is the point of the pack -------------------------------
  assert.ok(ids.length > 400,
    "the pack should cover hundreds of tools, got " + ids.length);
  const known = new Set(directory.map((tool) => tool.id));
  ids.forEach((id) => assert.ok(known.has(id), "pack names a tool not in the directory: " + id));

  // --- 2. Question-shape words must never reach a tool ---------------------
  // Measured failure: hotel-star-guide absorbed {versus, which is better,
  // cheapest, against} and then won "cheapest flight from lagos to nairobi"
  // and "hotel or apartment, which one cheaper" — queries about other tools
  // entirely, matched on words that say nothing about hotels.
  const SHAPE = ["versus", "vs", "against", "which is better", "better than", "compare",
    "comparison", "cheapest", "cheaper", "best", "worth it", "how much", "how many",
    "what does it cost", "should i", "difference between"];
  ids.forEach((id) => {
    tools[id].forEach((term) => {
      assert.strictEqual(SHAPE.indexOf(term), -1,
        'tool "' + id + '" gained the question-shape term "' + term + '"; those belong on the query, not the tool');
    });
  });

  // --- 3. Terms stay bounded ----------------------------------------------
  // Measured failure: 8 terms per tool with no rarity gate dropped holdout
  // accuracy 65% -> 62% AND cut retrieval@8 from 90% to 85% — the added noise
  // pushed correct tools out of the candidate set entirely.
  const cap = pack.maxTermsPerTool || 4;
  ids.forEach((id) => {
    assert.ok(tools[id].length <= cap,
      'tool "' + id + '" carries ' + tools[id].length + " terms, over the cap of " + cap);
    tools[id].forEach((term) => {
      assert.ok(String(term).length >= 4, 'term "' + term + '" on ' + id + " is too short to discriminate");
      assert.strictEqual(String(term), String(term).toLowerCase().trim(), "terms must be normalised: " + term);
    });
  });

  // --- 4. No duplicates within a tool -------------------------------------
  ids.forEach((id) => {
    assert.strictEqual(new Set(tools[id]).size, tools[id].length, "duplicate terms on " + id);
  });

  // --- 5. The motivating case actually works ------------------------------
  // "what is 500 dollars in Kenyan shillings today" ranked currency-converter
  // at a NEGATIVE fit because the tool contained neither "dollars" nor
  // "shillings" and was reached only by query expansion, which is penalised.
  assert.ok(tools["currency-converter"], "currency-converter should be enriched");
  assert.ok(tools["currency-converter"].some((term) => /dollar/.test(term)),
    "currency-converter must gain a dollar term, got " + tools["currency-converter"].join(", "));

  const termCount = ids.reduce((total, id) => total + tools[id].length, 0);
  console.log("afro-vocabulary tests passed (" + pack.version + ") — " + ids.length +
    " tools of " + directory.length + " (" + Math.round(ids.length / directory.length * 100) +
    "%), " + termCount + " terms, no question-shape leakage");
}

main();
