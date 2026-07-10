#!/usr/bin/env node

// Offline checks for the AI advisor smart-model routing heuristic and the
// shared reasoning core. No network calls; only the exported test hooks.

const assert = require("assert");
const advisor = require("../netlify/functions/ai-advisor.js");

const { classifyQueryComplexity, buildCoreIntelligencePrompt } = advisor.__test__;

function userMessage(content) {
  return [{ role: "user", content }];
}

async function run() {
  // Simple lookup stays on the fast tier
  {
    const result = classifyQueryComplexity(userMessage("What is PAYE?"), "ng-paye", "");
    assert.strictEqual(result.tier, "fast");
  }

  // Multi-country comparison with figures escalates to the smart tier
  {
    const result = classifyQueryComplexity(
      userMessage(
        "Compare take-home pay in Nigeria versus Kenya for a 950,000 monthly salary. " +
        "Should I take the Nairobi offer of KES 480,000 instead, and what pension difference should I plan for over 10 years?"
      ),
      "salary-compare",
      ""
    );
    assert.strictEqual(result.tier, "smart");
  }

  // Planning/keyword-heavy question escalates even without huge length
  {
    const result = classifyQueryComplexity(
      userMessage("Should I choose annuity or programmed withdrawal? Give me the difference between them over 15 years with NGN 40,000,000."),
      "pension-proj",
      ""
    );
    assert.strictEqual(result.tier, "smart");
  }

  // High-stakes tools always route smart
  {
    assert.strictEqual(classifyQueryComplexity(userMessage("hi"), "medical-report", "").tier, "smart");
    assert.strictEqual(classifyQueryComplexity(userMessage("hi"), "za-gepf", "").tier, "smart");
    assert.strictEqual(classifyQueryComplexity(userMessage("hi"), "japa-calculator", "").tier, "smart");
  }

  // Short greeting on a generic tool stays fast
  {
    const result = classifyQueryComplexity(userMessage("Thanks!"), "savings-goal", "");
    assert.strictEqual(result.tier, "fast");
  }

  // Missing/empty inputs never throw
  {
    assert.strictEqual(classifyQueryComplexity([], undefined, undefined).tier, "fast");
    assert.strictEqual(classifyQueryComplexity(null, "", null).tier, "fast");
  }

  // Core prompt carries the date, verification guidance, and African context
  {
    const core = buildCoreIntelligencePrompt();
    const today = new Date().toISOString().slice(0, 10);
    assert.ok(core.includes(today));
    assert.ok(/step by step/i.test(core));
    assert.ok(/parallel exchange rate/i.test(core));
    assert.ok(/inflation/i.test(core));
    assert.ok(/mobile money/i.test(core));
  }

  console.log("AI advisor smart-routing tests passed.");
}

run().catch(function (err) {
  console.error(err);
  process.exitCode = 1;
});
