#!/usr/bin/env node
/*
 * Afro-Lexicon integrity.
 *
 * The lexicon is the layer that makes the router understand how Africans
 * actually ask. It is only worth anything if every phrase it claims resolves to
 * a tool that exists AND is reachable by the router, so this test guards both.
 *
 * It also pins the gap it exposed: tools that exist on disk but are missing
 * from the router manifest. Those are recorded in knownUnrouteable rather than
 * quietly dropped — the phrasing is known and the tool is built, so the only
 * thing missing is manifest registration.
 */
const assert = require("assert");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const lexicon = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "ai", "afro-lexicon.json"), "utf8"));
const manifestApi = require(path.join(ROOT, "assets", "js", "ai", "tool-manifest.js"));
const confidence = require(path.join(ROOT, "assets", "js", "ai", "afro-confidence.js"));

function main() {
  const manifest = manifestApi.loadDefaultToolManifest();
  const routable = new Set(manifest.map((tool) => tool.id));
  const unrouteable = new Set((lexicon.knownUnrouteable && lexicon.knownUnrouteable.tools) || []);

  assert.ok(Array.isArray(lexicon.entries) && lexicon.entries.length, "lexicon must have entries");

  const seenPhrases = new Map();
  let phraseCount = 0;

  lexicon.entries.forEach((entry, index) => {
    const where = "entry " + index + " (" + (entry.intent || "no intent") + ")";
    assert.ok(Array.isArray(entry.phrases) && entry.phrases.length, where + " needs phrases");
    assert.ok(Array.isArray(entry.tools) && entry.tools.length, where + " needs at least one tool");

    entry.phrases.forEach((phrase) => {
      phraseCount++;
      assert.strictEqual(phrase, phrase.toLowerCase(), where + ": phrase must be lowercase — " + phrase);
      assert.ok(phrase.trim() === phrase, where + ": phrase has stray whitespace — " + phrase);
      // A phrase mapping to two different intents makes routing ambiguous by
      // construction; catch it here rather than in production.
      if (seenPhrases.has(phrase)) {
        const previous = seenPhrases.get(phrase);
        assert.strictEqual(previous, entry.intent,
          'phrase "' + phrase + '" is claimed by both ' + previous + " and " + entry.intent);
      }
      seenPhrases.set(phrase, entry.intent);
    });

    entry.tools.forEach((toolId) => {
      // Every referenced tool must either be routable, or be an acknowledged gap.
      assert.ok(routable.has(toolId) || unrouteable.has(toolId),
        where + ': references "' + toolId + '" which is neither in the manifest nor recorded in knownUnrouteable');
    });
  });

  // The recorded gaps must be real: on disk, and genuinely absent from the manifest.
  unrouteable.forEach((toolId) => {
    assert.ok(!routable.has(toolId),
      '"' + toolId + '" is in the manifest now — remove it from knownUnrouteable');
    const onDisk = fs.existsSync(path.join(ROOT, "tools", toolId));
    assert.ok(onDisk, '"' + toolId + '" is listed as unrouteable but does not exist on disk either');
  });

  // The lexicon must actually fire on the phrasing it claims.
  const probes = [
    ["wetin go remain after tax", "paye-calculator"],
    ["i need to clear my car at tincan", "car-import-cost"],
    ["how much does mpesa charge", "mobile-money-fees"],
    ["what is my healthy weight", "bmi-calculator"],
    ["i need a bill of quantities", "boq-generator"]
  ];
  probes.forEach(([query, expected]) => {
    const hits = confidence.lexiconMatches(query, lexicon);
    assert.ok(hits[expected], 'lexicon should map "' + query + '" to ' + expected);
  });

  // --- A generic phrase must lead with a generic tool ----------------------
  // "landed cost" and "clear goods" sat in entries that listed car-import-cost
  // FIRST, so "landed cost for a container of electronics from China" was
  // priced as a car import. Entry order is now a ranking signal — the boost
  // decays down the list — so a generic phrase sharing an entry with
  // car-specific ones is a routing bug, not a tidiness issue.
  {
    const CAR_ONLY = ["tokunbo", "belgium car", "foreign used car", "import a car",
      "duty on a car", "clear my car", "clearing my car"];
    const GENERIC = ["landed cost", "clear goods", "customs clearing"];
    lexicon.entries.forEach((entry) => {
      const phrases = entry.phrases || [];
      const hasCar = phrases.some((phrase) => CAR_ONLY.indexOf(phrase) !== -1);
      const hasGeneric = phrases.some((phrase) => GENERIC.indexOf(phrase) !== -1);
      assert.ok(!(hasCar && hasGeneric),
        "an entry must not mix car-specific and generic clearance phrases: " + phrases.join(", "));
      if (hasGeneric) {
        assert.notStrictEqual((entry.tools || [])[0], "car-import-cost",
          "a generic clearance entry must not lead with the car tool");
      }
    });
  }

  console.log("afro-lexicon tests passed (" + lexicon.entries.length + " entries, " + phraseCount + " phrases, " +
    unrouteable.size + " known unrouteable)");
}

main();
