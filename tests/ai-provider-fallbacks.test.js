#!/usr/bin/env node

const assert = require("assert");

const ROUTER_PATH = "../netlify/functions/ai-route-intent.js";
const ORIGINAL_ENV = Object.assign({}, process.env);
const ORIGINAL_FETCH = global.fetch;

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
  assert.strictEqual(result.json.telemetry.modelCalled, false);
  assert.ok(result.json.telemetry.aiDisabledFallbacks >= 1);

  global.fetch = async function () {
    return response(200, "not json");
  };
  router = freshRouter({
    AFROTOOLS_AI_ROUTER_ANTHROPIC_API_KEY: "test-key",
    AFROTOOLS_AI_ROUTER_OBVIOUS_CONFIDENCE: "0.99",
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
  assert.strictEqual(result.json.fallbackReason, "provider_error_429");
  assert.strictEqual(result.response.headers["X-AI-Fallback"], "provider_error_429");
  assert.ok(result.json.decision.selectedRoute.startsWith("/"));
  assert.ok(result.json.telemetry.providerFailureFallbacks >= 1);

  let fetchCalls = 0;
  global.fetch = async function () {
    fetchCalls += 1;
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
  assert.strictEqual(result.json.source, "model_validated");
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

  console.log("AI provider fallback behavior tests passed.");
})().catch(function fail(err) {
  console.error(err);
  process.exitCode = 1;
}).finally(function restore() {
  process.env = ORIGINAL_ENV;
  global.fetch = ORIGINAL_FETCH;
});
