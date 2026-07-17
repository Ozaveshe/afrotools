#!/usr/bin/env node

const assert = require("assert");
const guardrails = require("../assets/js/ai/guardrails.js");
const manifestApi = require("../assets/js/ai/tool-manifest.js");

const ROUTER_PATH = "../netlify/functions/ai-route-intent.js";
const ORIGINAL_ENV = Object.assign({}, process.env);
const ORIGINAL_FETCH = global.fetch;
const ORIGINAL_VALIDATE_ROUTER_DECISION_SAFETY = guardrails.validateRouterDecisionSafety;

function freshRouter(env) {
  process.env = Object.assign({}, ORIGINAL_ENV, env || {});
  delete require.cache[require.resolve(ROUTER_PATH)];
  const router = require(ROUTER_PATH);
  if (router.__resetForTests) router.__resetForTests();
  return router;
}

function postEvent(query, options) {
  const opts = options || {};
  return {
    httpMethod: "POST",
    headers: Object.assign({
      origin: "https://afrotools.com",
      "x-forwarded-for": opts.ip || "198.51.100.10",
      "x-afrotools-ai-session": opts.session || "fallback-session",
    }, opts.headers || {}),
    body: JSON.stringify(Object.assign({
      query,
      consentToModel: opts.consentToModel === true,
      sessionId: opts.session || "fallback-session",
    }, opts.body || {})),
  };
}

function response(status, text) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async function () {
      return { content: [{ text: text || "" }], usage: { input_tokens: 80, output_tokens: 30 } };
    },
  };
}

async function call(router, query, options) {
  const result = await router.handler(postEvent(query, options));
  return { response: result, json: JSON.parse(result.body || "{}") };
}

(async function run() {
  global.fetch = async function () {
    throw new Error("Provider should not be called when disabled");
  };
  let router = freshRouter({
    AFROTOOLS_AI_PROVIDER: "disabled",
    ANTHROPIC_API_KEY: "test-key",
    AFROTOOLS_AI_FALLBACK_LOGGING: "off",
  });
  let result = await call(router, "Should I install solar for my shop in Lagos?", {
    consentToModel: true,
    ip: "198.51.100.20",
    session: "disabled-provider",
  });
  assert.strictEqual(result.response.statusCode, 200);
  assert.strictEqual(result.json.fallbackReason, "provider_disabled");
  assert.strictEqual(result.json.decision.selectedToolId, "solar-roi");
  assert.strictEqual(result.json.toolCall.type, "existing_tool_call");
  assert.strictEqual(result.json.toolCall.toolId, "solar-roi");
  assert.strictEqual(result.json.toolCall.action, "prefill_existing_tool");
  assert.ok(Array.isArray(result.json.toolCandidates));
  assert.ok(result.json.toolCandidates.length > 0, "router response should include safe related tool candidates");
  assert.ok(result.json.toolCandidates.every((candidate) => candidate.type === "existing_tool_candidate"));
  assert.ok(result.json.toolCandidates.every((candidate) => candidate.toolId !== result.json.toolCall.toolId));
  assert.ok(!JSON.stringify(result.json.toolCandidates).toLowerCase().includes("shop in lagos"));
  assert.strictEqual(result.json.telemetry.modelCalled, false);
  assert.ok(result.json.telemetry.aiDisabledFallbacks >= 1);

  global.fetch = async function () {
    throw new Error("Provider should wait for explicit consent");
  };
  router = freshRouter({
    AFROTOOLS_AI_ROUTER_ANTHROPIC_API_KEY: "test-key",
    AFROTOOLS_AI_ROUTER_OBVIOUS_CONFIDENCE: "0.99",
    AFROTOOLS_AI_FALLBACK_LOGGING: "off",
  });
  result = await call(router, "school money options ghana", {
    consentToModel: false,
    ip: "198.51.100.205",
    session: "consent-not-provided",
  });
  assert.strictEqual(result.response.statusCode, 200);
  assert.strictEqual(result.json.routerStatus, "ok");
  assert.strictEqual(result.json.routerUnavailable, false);
  assert.strictEqual(result.json.fallbackUsed, true);
  assert.strictEqual(result.json.fallbackReason, "model_consent_not_provided");
  assert.strictEqual(result.response.headers["X-AI-Router-Status"], "ok");
  assert.strictEqual(result.json.telemetry.modelCalled, false);

  global.fetch = async function () {
    return response(200, "not json");
  };
  router = freshRouter({
    AFROTOOLS_AI_ROUTER_ANTHROPIC_API_KEY: "test-key",
    AFROTOOLS_AI_ROUTER_OBVIOUS_CONFIDENCE: "1.01",
    AFROTOOLS_AI_FALLBACK_LOGGING: "off",
  });
  result = await call(router, "school money options ghana", {
    consentToModel: true,
    ip: "198.51.100.21",
    session: "invalid-json-provider",
  });
  assert.strictEqual(result.response.statusCode, 200);
  assert.strictEqual(result.json.fallbackReason, "provider_invalid_json");
  assert.ok(result.json.decision.selectedRoute.startsWith("/"));
  assert.ok(result.json.telemetry.providerFailureFallbacks >= 1);
  assert.strictEqual(result.json.telemetry.providerUsed, false);

  global.fetch = async function () {
    return response(429, "");
  };
  router = freshRouter({
    AFROTOOLS_AI_ROUTER_ANTHROPIC_API_KEY: "test-key",
    AFROTOOLS_AI_ROUTER_OBVIOUS_CONFIDENCE: "0.99",
    AFROTOOLS_AI_FALLBACK_LOGGING: "off",
  });
  result = await call(router, "school money options kenya", {
    consentToModel: true,
    ip: "198.51.100.22",
    session: "provider-429",
  });
  assert.strictEqual(result.response.statusCode, 200);
  assert.strictEqual(result.json.routerStatus, "degraded");
  assert.strictEqual(result.json.routerUnavailable, false);
  assert.strictEqual(result.json.fallbackUsed, true);
  assert.strictEqual(result.json.fallbackReason, "provider_error_429");
  assert.strictEqual(result.response.headers["X-AI-Fallback"], "provider_error_429");
  assert.strictEqual(result.response.headers["X-AI-Router-Status"], "degraded");
  assert.ok(result.json.decision.selectedRoute.startsWith("/"));
  assert.ok(result.json.telemetry.providerFailureFallbacks >= 1);

  global.fetch = async function () {
    return response(502, "");
  };
  router = freshRouter({
    AFROTOOLS_AI_ROUTER_ANTHROPIC_API_KEY: "test-key",
    AFROTOOLS_AI_ROUTER_OBVIOUS_CONFIDENCE: "0.99",
    AFROTOOLS_AI_FALLBACK_LOGGING: "off",
  });
  result = await call(router, "write a CV for an electrical engineer in Ghana", {
    consentToModel: true,
    ip: "198.51.100.225",
    session: "provider-502",
  });
  assert.strictEqual(result.response.statusCode, 200);
  assert.strictEqual(result.json.routerStatus, "degraded");
  assert.strictEqual(result.json.routerUnavailable, false);
  assert.strictEqual(result.json.fallbackUsed, true);
  assert.strictEqual(result.json.fallbackReason, "provider_error_502");
  assert.strictEqual(result.response.headers["X-AI-Fallback"], "provider_error_502");
  assert.strictEqual(result.response.headers["X-AI-Router-Status"], "degraded");
  assert.strictEqual(result.json.decision.selectedToolId, "cv-builder");
  assert.strictEqual(result.json.toolCall.toolId, "cv-builder");
  assert.ok(result.json.decision.selectedRoute.startsWith("/tools/cv-builder/"));

  let fetchCalls = 0;
  let capturedProviderPrompt = "";
  global.fetch = async function (_url, init) {
    fetchCalls += 1;
    const providerBody = JSON.parse(init && init.body || "{}");
    capturedProviderPrompt = providerBody.messages && providerBody.messages[0] && providerBody.messages[0].content || "";
    return response(200, JSON.stringify({
      intentCategory: "scholarships",
      selectedToolId: "scholarship-finder",
      selectedRoute: "/tools/scholarship-finder/",
      confidence: 0.84,
      reasonShort: "Matched education funding intent.",
      extractedInputs: { country: "Ghana" },
      missingInputs: ["studyLevel"],
      clarificationQuestion: "What study level?",
      safetyDomain: "education",
      highStakesNotice: "Planning estimate only. Confirm eligibility with official sources.",
      privacyMode: "account_optional",
      canPrefill: true,
      suggestedNextActions: ["Open Scholarship Finder"],
    }));
  };
  router = freshRouter({
    AFROTOOLS_AI_ROUTER_ANTHROPIC_API_KEY: "test-key",
    AFROTOOLS_AI_ROUTER_OBVIOUS_CONFIDENCE: "0.99",
    AFROTOOLS_AI_ROUTER_MODEL_RATE_LIMIT: "1",
    AFROTOOLS_AI_FALLBACK_LOGGING: "off",
  });
  result = await call(router, "school money options ghana", {
    consentToModel: true,
    ip: "198.51.100.23",
    session: "model-limit-a",
  });
  assert.strictEqual(result.response.statusCode, 200);
  assert.strictEqual(result.json.routerStatus, "ok");
  assert.strictEqual(result.json.routerUnavailable, false);
  assert.strictEqual(result.json.fallbackUsed, false);
  assert.strictEqual(result.response.headers["X-AI-Router-Status"], "ok");
  assert.strictEqual(result.json.source, "model_validated");
  assert.ok(capturedProviderPrompt.includes("generated_full_catalog_pack"), "provider prompt should use the generated full-catalog pack context");
  assert.ok(capturedProviderPrompt.includes("selectedChunkIds"), "provider prompt should expose selected catalog chunk ids");
  assert.ok(capturedProviderPrompt.includes("scholarship-finder"), "provider prompt should include the selected existing tool call");
  assert.ok(!capturedProviderPrompt.split("User query:")[0].toLowerCase().includes("school money options ghana"), "catalog context should not echo raw query text");
  result = await call(router, "school money options rwanda", {
    consentToModel: true,
    ip: "198.51.100.23",
    session: "model-limit-b",
  });
  assert.strictEqual(result.response.statusCode, 200);
  assert.strictEqual(result.json.fallbackReason, "model_rate_limited");
  assert.strictEqual(result.json.source, "deterministic_model_rate_limited");
  assert.strictEqual(result.response.headers["X-AI-Fallback"], "model_rate_limited");
  assert.strictEqual(fetchCalls, 1);
  assert.ok(result.json.telemetry.rateLimitFallbacks >= 1);
  assert.ok(result.json.decision.selectedRoute.startsWith("/"));

  guardrails.validateRouterDecisionSafety = function () {
    throw new Error("forced router safety crash");
  };
  router = freshRouter({
    AFROTOOLS_AI_PROVIDER: "disabled",
    ANTHROPIC_API_KEY: "test-key",
    AFROTOOLS_AI_FALLBACK_LOGGING: "off",
  });
  result = await call(router, "Should I install solar for my shop in Lagos?", {
    consentToModel: false,
    ip: "198.51.100.24",
    session: "runtime-fallback",
  });
  assert.strictEqual(result.response.statusCode, 200);
  assert.strictEqual(result.json.source, "safe_runtime_fallback");
  assert.strictEqual(result.json.fallbackReason, "router_runtime_fallback");
  assert.strictEqual(result.response.headers["X-AI-Runtime-Fallback"], "true");
  assert.strictEqual(result.json.decision.selectedToolId, "solar-roi");
  assert.strictEqual(result.json.toolCall.toolId, "solar-roi");
  guardrails.validateRouterDecisionSafety = ORIGINAL_VALIDATE_ROUTER_DECISION_SAFETY;

  const fakeManifest = Array.from({ length: 100 }, function buildTool(_, index) {
    return {
      id: index === 86 ? "diaspora-permit-planner" : "generic-tool-" + index,
      slug: index === 86 ? "diaspora-permit-planner" : "generic-tool-" + index,
      route: index === 86 ? "/tools/diaspora-permit-planner/" : "/tools/generic-tool-" + index + "/",
      title: index === 86 ? "Diaspora Permit Planner" : "Generic Tool " + index,
      shortDescription: index === 86 ? "Plan African diaspora residence permit paperwork and next steps." : "Generic utility.",
      category: index === 86 ? "legal" : "general",
      subcategory: index === 86 ? "permits" : "general",
      countriesSupported: ["ALL"],
      languagesSupported: ["en"],
      currencySupport: ["local"],
      userIntents: index === 86 ? ["diaspora permit", "residence permit", "permit paperwork"] : ["generic tool"],
      exampleQueries: index === 86 ? ["Plan my diaspora permit paperwork"] : ["Open generic tool"],
      requiredInputs: [],
      optionalInputs: [],
      privacyMode: "browser_local",
      aiCapabilities: ["route_only"],
      outputTypes: ["checklist"],
      sourcePolicy: "reviewed",
      highStakesDomain: index === 86 ? "legal" : "none",
      aliases: [],
    };
  });
  fakeManifest.push({
    id: "residence-permit-checklist",
    slug: "residence-permit-checklist",
    route: "/tools/residence-permit-checklist/",
    title: "Residence Permit Checklist",
    shortDescription: "Checklist for residence permit paperwork and next steps.",
    category: "legal",
    subcategory: "permits",
    countriesSupported: ["ALL"],
    languagesSupported: ["en"],
    currencySupport: ["local"],
    userIntents: ["residence permit checklist", "permit paperwork"],
    exampleQueries: ["Checklist my permit paperwork"],
    requiredInputs: [],
    optionalInputs: [],
    privacyMode: "browser_local",
    aiCapabilities: ["route_only"],
    outputTypes: ["checklist"],
    sourcePolicy: "reviewed",
    highStakesDomain: "legal",
    aliases: [],
  });
  const selectedTools = router.__test.selectPromptTools("Plan my diaspora permit paperwork", fakeManifest, {
    selectedToolId: "diaspora-permit-planner",
    intentCategory: "legal",
  }, 20);
  assert.strictEqual(selectedTools[0].id, "diaspora-permit-planner");
  const modelPrompt = router.__test.buildModelPrompt("Plan my diaspora permit paperwork", fakeManifest, {
    selectedToolId: "diaspora-permit-planner",
    intentCategory: "legal",
  });
  assert.ok(modelPrompt.includes("diaspora-permit-planner"), "model prompt should include relevant tools beyond the first 60 manifest entries");
  assert.ok(modelPrompt.includes("selected from 101 AfroTools manifest entries"));

  const fullManifest = manifestApi.getToolManifestForRouter();
  const catalogContext = router.__test.buildPromptCatalogContext("Compare M-Pesa fees in Kenya and find the cheapest send option", fullManifest, {
    selectedToolId: "mobile-money-fees",
    intentCategory: "african",
  });
  assert.strictEqual(catalogContext.source, "generated_full_catalog_pack");
  assert.strictEqual(catalogContext.catalogToolCount, fullManifest.length);
  assert.ok(catalogContext.selectedChunkIds.length > 0, "provider prompt should reference generated full-catalog chunks");
  assert.ok(catalogContext.selectedTools.some((tool) => tool.toolId === "mobile-money-fees"), "provider prompt context should include selected tool call");
  assert.ok(!JSON.stringify(catalogContext).toLowerCase().includes("cheapest send option"), "catalog context should not echo raw user query text");

  const candidates = router.__test.buildToolCandidates("Plan my diaspora permit paperwork", {
    selectedToolId: "diaspora-permit-planner",
  }, fakeManifest, 3);
  assert.ok(candidates.length > 0, "candidate builder should return nearby existing tools");
  assert.ok(candidates.every((candidate) => candidate.type === "existing_tool_candidate"));
  assert.ok(candidates.every((candidate) => !Object.prototype.hasOwnProperty.call(candidate, "matchedTerms")));

  console.log("AI provider fallback behavior tests passed.");
})().catch(function fail(err) {
  console.error(err);
  process.exitCode = 1;
}).finally(function restore() {
  process.env = ORIGINAL_ENV;
  global.fetch = ORIGINAL_FETCH;
  guardrails.validateRouterDecisionSafety = ORIGINAL_VALIDATE_ROUTER_DECISION_SAFETY;
});
