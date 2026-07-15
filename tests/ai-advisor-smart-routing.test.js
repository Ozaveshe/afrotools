#!/usr/bin/env node

// Offline checks for the AI advisor smart-model routing heuristic and the
// shared reasoning core. No network calls; only the exported test hooks.

const assert = require("assert");
const advisor = require("../netlify/functions/ai-advisor.js");
const entitlements = require("../netlify/functions/_shared/entitlements.js");

const { classifyQueryComplexity, buildCoreIntelligencePrompt, checkRateLimit, getToolContext } = advisor.__test__;

function userMessage(content) {
  return [{ role: "user", content }];
}

async function run() {
  // Every tier recognized by the public Pro gate is active only while its
  // profile entitlement is unexpired (or explicitly non-expiring).
  {
    const now = "2026-07-13T12:00:00.000Z";
    entitlements.ENTITLED_TIERS.forEach(function (tier) {
      const result = entitlements.resolveProfileEntitlement({
        subscription_tier: tier,
        subscription_expires_at: "2027-07-13T12:00:00.000Z"
      }, now);
      assert.strictEqual(result.isPro, true, tier + " should be entitled");
    });
    assert.strictEqual(entitlements.resolveProfileEntitlement({
      subscription_tier: "pro",
      subscription_expires_at: "2025-07-13T12:00:00.000Z"
    }, now).isPro, false);
  }

  // Regression: a profile-backed Pro account remains allowed after the free
  // daily quota has been consumed. The lookup must target profiles, not a
  // subscriptions table.
  {
    const requestedUrls = [];
    const result = await checkRateLimit({
      headers: {
        authorization: "Bearer fixture-token",
        "x-afro-session": "fixture-session"
      }
    }, {}, {
      now: "2026-07-13T12:00:00.000Z",
      store: {
        get: async function () { return "3"; }
      },
      supabaseAuthUrl: "https://zpclagtgczsygrgztlts.supabase.co",
      supabaseAuthKey: "fixture-service-key",
      fetchImpl: async function (url) {
        requestedUrls.push(String(url));
        if (String(url).endsWith("/auth/v1/user")) {
          return { ok: true, json: async function () { return { id: "fixture-pro-user" }; } };
        }
        if (String(url).includes("/rest/v1/profiles?")) {
          return {
            ok: true,
            json: async function () {
              return [{
                subscription_tier: "pro",
                subscription_expires_at: "2027-07-13T12:00:00.000Z"
              }];
            }
          };
        }
        throw new Error("Unexpected URL: " + url);
      }
    });

    assert.strictEqual(result.allowed, true);
    assert.strictEqual(result.limit, Infinity);
    assert.ok(requestedUrls.some(function (url) { return url.includes("/rest/v1/profiles?"); }));
    assert.ok(requestedUrls.every(function (url) { return !url.includes("/subscriptions"); }));
  }

  // The advisor sees the generated, source-labelled context without changing
  // the existing routing behavior for the same sample prompt.
  {
    const context = getToolContext("ng-paye");
    assert.ok(context.includes("Current structured PAYE facts"));
    assert.ok(context.includes("Source: Federal Inland Revenue Service (FIRS)"));
    assert.ok(context.includes("As of: 2026-03-01"));
    assert.strictEqual(getToolContext("unknown-tool"), "");
    assert.strictEqual(classifyQueryComplexity(userMessage("What is PAYE?"), "ng-paye", "").tier, "fast");
  }

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
