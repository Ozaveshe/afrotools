#!/usr/bin/env node

const assert = require("assert");
const i18n = require("../assets/js/ai/i18n.js");
const router = require("../assets/js/ai/intent-router.js");
const manifestApi = require("../assets/js/ai/tool-manifest.js");
const api = require("../netlify/functions/ai-route-intent.js");

const manifest = manifestApi.getToolManifestForRouter();
const requiredKeys = [
  "homeHero.title",
  "page.title",
  "page.inputLabel",
  "examples.education",
  "examples.career",
  "examples.business",
  "examples.trade",
  "examples.energy",
  "privacyNotices.generic",
  "result.inputsDetected",
  "result.missingInputs",
  "result.openTool",
  "clarification.country",
  "categories.education",
  "categories.trade",
];

assert.deepStrictEqual(i18n.SUPPORTED_LOCALES, ["en", "fr", "pt", "ar", "sw"]);
assert.strictEqual(i18n.normalizeLocale("fr-FR"), "fr");
assert.strictEqual(i18n.normalizeLocale("pt-BR"), "pt");
assert.strictEqual(i18n.normalizeLocale("kiswahili"), "sw");
assert.strictEqual(i18n.normalizeLocale("ar-EG"), "ar");
assert.strictEqual(i18n.normalizeLocale("unknown"), "en");
assert.strictEqual(i18n.isRtl("ar"), true);
assert.strictEqual(i18n.isRtl("fr"), false);

for (const locale of i18n.SUPPORTED_LOCALES) {
  for (const key of requiredKeys) {
    const value = i18n.t(locale, key, "");
    assert.ok(typeof value === "string" && value.trim().length > 0, `${locale}:${key}`);
  }
}

const frenchDecision = router.routeDeterministically("I want to study in Canada from Nigeria with $8,000", {
  manifest,
  locale: "fr",
});
assert.strictEqual(frenchDecision.locale, "fr");
assert.strictEqual(frenchDecision.selectedToolId, "study-abroad-cost");
assert.strictEqual(frenchDecision.reasonShort, i18n.t("fr", "router.matched"));
assert.strictEqual(frenchDecision.labels.openTool, i18n.t("fr", "result.openTool"));
assert.strictEqual(frenchDecision.labels.category, i18n.t("fr", "categories.studyAbroad"));
assert.ok(frenchDecision.suggestedNextActions.includes(i18n.t("fr", "router.openWorkflow")));

const arabicFallback = router.routeDeterministically("blue sky weekend vibes", {
  manifest,
  locale: "ar",
});
assert.strictEqual(arabicFallback.locale, "ar");
assert.strictEqual(arabicFallback.selectedToolId, "tool-search");
assert.strictEqual(arabicFallback.labels.direction, "rtl");
assert.strictEqual(arabicFallback.reasonShort, i18n.t("ar", "router.fallback"));

const swClarification = i18n.clarificationForMissing("sw", ["country"]);
assert.strictEqual(swClarification, i18n.t("sw", "clarification.country"));

async function runApiLocaleTest() {
  const response = await api.handler({
    httpMethod: "POST",
    headers: { origin: "https://afrotools.com", "x-forwarded-for": "203.0.113.91" },
    body: JSON.stringify({
      query: "Calculate payroll for 5 employees in Kenya",
      locale: "pt-BR",
    }),
  });
  assert.strictEqual(response.statusCode, 200);
  const payload = JSON.parse(response.body);
  assert.strictEqual(payload.ok, true);
  assert.strictEqual(payload.locale, "pt");
  assert.strictEqual(payload.decision.locale, "pt");
  assert.strictEqual(payload.decision.labels.openTool, i18n.t("pt", "result.openTool"));
  assert.strictEqual(payload.decision.reasonShort, i18n.t("pt", "router.matched"));
}

runApiLocaleTest()
  .then(() => {
    console.log("AI i18n foundations validated for en/fr/pt/ar/sw plus locale-aware routing.");
  })
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
