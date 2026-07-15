const assert = require("assert");

function createStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    },
    clear() {
      values.clear();
    }
  };
}

global.localStorage = createStorage();

const usageLimits = require("../assets/js/ai/usage-limits.js");
const pro = require("../assets/js/ai/pro-monetization.js");

function testPlanCapabilities() {
  assert.equal(pro.PLAN_CAPABILITIES.free.id, "free");
  assert.equal(pro.PLAN_CAPABILITIES.free.adsAndSponsors, true);
  assert.equal(pro.PLAN_CAPABILITIES.free.advancedPlanning, false);
  assert.equal(pro.PLAN_CAPABILITIES.pro.adsAndSponsors, false);
  assert.equal(pro.PLAN_CAPABILITIES.pro.pdfRichness, "rich");
  assert.equal(pro.PLAN_CAPABILITIES.team.widgets, true);
  assert.equal(pro.PLAN_CAPABILITIES.team.apiAccess, true);
  assert.equal(pro.PLAN_CAPABILITIES.team.whiteLabel, true);
}

function testSharedAiBriefLimits() {
  assert.equal(usageLimits.getAiBriefsPerDay("free"), 3);
  assert.equal(pro.PLAN_CAPABILITIES.free.aiBriefsPerDay, usageLimits.getAiBriefsPerDay("free"));
  assert.equal(pro.PLAN_CAPABILITIES.pro.aiBriefsPerDay, usageLimits.getAiBriefsPerDay("pro"));
  assert.equal(pro.PLAN_CAPABILITIES.team.aiBriefsPerDay, usageLimits.getAiBriefsPerDay("team"));

  const underLimit = pro.evaluateFeature("ai_brief_basic", {
    currentPlan: "free",
    usage: { date: "2026-07-13", counts: { ai_brief_basic: 2 } }
  });
  assert.equal(underLimit.allowed, true);

  const atLimit = pro.evaluateFeature("ai_brief_basic", {
    currentPlan: "free",
    usage: { date: "2026-07-13", counts: { ai_brief_basic: 3 } }
  });
  assert.equal(atLimit.allowed, false);
  assert.equal(atLimit.reason, "limit_reached");

  assert.equal(pro.planFromProfile({ subscription_tier: "pro" }), "pro");
}

function testPricingFlag() {
  global.localStorage.clear();
  assert.equal(pro.pricingDisplayEnabled(), false);
  assert.equal(pro.pricingDisplayEnabled({ env: { AFROTOOLS_AI_PRO_PRICING_DISPLAY: "true" } }), true);
  assert.equal(pro.pricingDisplayEnabled({ env: { NEXT_PUBLIC_AFROTOOLS_AI_PRO_PRICING_DISPLAY: "1" } }), true);
  global.localStorage.setItem(pro.PRICE_FLAG_KEY, "on");
  assert.equal(pro.pricingDisplayEnabled(), true);
}

function testCoreFreeGates() {
  const routing = pro.evaluateFeature("basic_routing", { currentPlan: "free" });
  const calculator = pro.evaluateFeature("core_calculator", { currentPlan: "free" });
  assert.equal(routing.allowed, true);
  assert.equal(routing.shouldBlock, false);
  assert.equal(calculator.allowed, true);
  assert.equal(calculator.shouldBlock, false);
  assert.equal(calculator.existingFree, true);
}

function testProOnlyGates() {
  const advancedDoc = pro.evaluateFeature("ai_document_advanced", { currentPlan: "free" });
  assert.equal(advancedDoc.allowed, false);
  assert.equal(advancedDoc.shouldBlock, true);
  assert.equal(advancedDoc.requiredPlan, "pro");

  const richPdf = pro.evaluateFeature("workflow_export_rich_pdf", { currentPlan: "pro" });
  assert.equal(richPdf.allowed, true);
  assert.equal(richPdf.shouldBlock, false);

  const apiForPro = pro.evaluateFeature("api_access", { currentPlan: "pro" });
  assert.equal(apiForPro.allowed, false);
  assert.equal(apiForPro.shouldBlock, true);
  assert.equal(apiForPro.requiredPlan, "team");
}

function testFreeLimitsAreSoftPrompts() {
  const underLimit = pro.evaluateFeature("workflow_export_basic", {
    currentPlan: "free",
    usage: { date: "2026-06-16", counts: { workflow_export_basic: 2 } }
  });
  assert.equal(underLimit.allowed, true);
  assert.equal(underLimit.shouldBlock, false);

  const overLimit = pro.evaluateFeature("workflow_export_basic", {
    currentPlan: "free",
    usage: { date: "2026-06-16", counts: { workflow_export_basic: 3 } }
  });
  assert.equal(overLimit.allowed, false);
  assert.equal(overLimit.shouldBlock, false);
  assert.equal(overLimit.reason, "limit_reached");

  const proUnlimited = pro.evaluateFeature("workflow_export_basic", {
    currentPlan: "pro",
    usage: { date: "2026-06-16", counts: { workflow_export_basic: 300 } }
  });
  assert.equal(proUnlimited.allowed, true);
}

function testUsageRecording() {
  global.localStorage.clear();
  pro.recordUsage("workflow_export_basic", "2026-06-16T10:00:00Z");
  pro.recordUsage("workflow_export_basic", "2026-06-16T11:00:00Z");
  const usage = pro.getUsage("2026-06-16T12:00:00Z");
  assert.equal(usage.counts.workflow_export_basic, 2);
  assert.equal(pro.resetUsage(), true);
  assert.deepEqual(pro.getUsage("2026-06-16T12:00:00Z").counts, {});
}

function testPromptPrivacyFiltering() {
  const prompt = pro.buildUpgradePrompt("ai_document_advanced", {
    workflowType: "cv-builder",
    selectedToolId: "cv-builder",
    country: "Ghana",
    rawPrompt: "Write my CV for Ada Example, ada@example.com",
    email: "ada@example.com"
  }, { currentPlan: "free" });
  assert.equal(prompt.context.workflowType, "cv-builder");
  assert.equal(prompt.context.country, "Ghana");
  assert.equal(prompt.context.rawPrompt, undefined);
  assert.equal(prompt.context.email, undefined);

  const markup = pro.buildUpgradeMarkup("ai_document_advanced", {
    workflowType: "career",
    rawPrompt: "secret private prompt",
    selectedToolId: "cv-builder"
  }, { currentPlan: "free" });
  assert.equal(markup.includes("secret private prompt"), false);
  assert.equal(markup.includes("Optional Pro upgrade"), true);
}

testPlanCapabilities();
testSharedAiBriefLimits();
testPricingFlag();
testCoreFreeGates();
testProOnlyGates();
testFreeLimitsAreSoftPrompts();
testUsageRecording();
testPromptPrivacyFiltering();

console.log("ai-pro-monetization tests passed");
