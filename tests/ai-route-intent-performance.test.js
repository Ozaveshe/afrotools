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
      "x-forwarded-for": opts.ip || "203.0.113.201",
      "x-afrotools-ai-session": opts.session || "perf-session",
    }, opts.headers || {}),
    body: JSON.stringify(Object.assign({
      query,
      consentToModel: opts.consentToModel === true,
      sessionId: opts.session || "perf-session",
    }, opts.body || {})),
  };
}

function anthropicResponse(decision, usage) {
  return {
    ok: true,
    json: async function () {
      return {
        content: [{ text: JSON.stringify(decision) }],
        usage: usage || { input_tokens: 100, output_tokens: 40 },
      };
    },
  };
}

function fakeBearer(sub) {
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
  return "Bearer " + encode({ alg: "none" }) + "." + encode({ sub }) + ".sig";
}

async function run() {
  let fetchCalls = 0;
  global.fetch = async function () {
    fetchCalls += 1;
    throw new Error("Provider should not be called for obvious deterministic queries");
  };
  let router = freshRouter({
    AFROTOOLS_AI_ROUTER_ANTHROPIC_API_KEY: "test-key",
    AFROTOOLS_AI_ROUTER_OBVIOUS_CONFIDENCE: "0.78",
  });
  let response = await router.handler(postEvent("How much duty to import a 2016 Toyota Axio into Nigeria?", {
    consentToModel: true,
    ip: "203.0.113.202",
    session: "obvious-skip",
  }));
  let payload = JSON.parse(response.body);
  assert.strictEqual(response.statusCode, 200);
  assert.strictEqual(payload.source, "deterministic_obvious");
  assert.strictEqual(payload.fallbackReason, "model_skipped_obvious_intent");
  assert.strictEqual(payload.decision.selectedToolId, "import-duty");
  assert.strictEqual(payload.telemetry.modelCalled, false);
  assert.strictEqual(fetchCalls, 0);

  global.fetch = async function (_url, init) {
    return new Promise((_resolve, reject) => {
      if (init && init.signal) {
        init.signal.addEventListener("abort", () => {
          const err = new Error("aborted");
          err.name = "AbortError";
          reject(err);
        });
      }
    });
  };
  router = freshRouter({
    AFROTOOLS_AI_ROUTER_ANTHROPIC_API_KEY: "test-key",
    AFROTOOLS_AI_ROUTER_PROVIDER_TIMEOUT_MS: "15",
    AFROTOOLS_AI_ROUTER_OBVIOUS_CONFIDENCE: "0.99",
  });
  response = await router.handler(postEvent("school money options ghana", {
    consentToModel: true,
    ip: "203.0.113.203",
    session: "timeout-fallback",
  }));
  payload = JSON.parse(response.body);
  assert.strictEqual(response.statusCode, 200);
  assert.strictEqual(payload.telemetry.modelCalled, true);
  assert.strictEqual(payload.telemetry.providerFailureReason, "provider_timeout");
  assert.strictEqual(payload.fallbackReason, "provider_timeout");
  assert.ok(payload.decision.selectedRoute.startsWith("/"));

  fetchCalls = 0;
  global.fetch = async function () {
    fetchCalls += 1;
    return anthropicResponse({
      intentCategory: "scholarships",
      selectedToolId: "scholarship-finder",
      selectedRoute: "/tools/scholarship-finder/",
      confidence: 0.86,
      reasonShort: "Matched education funding intent.",
      extractedInputs: {
        country: "Ghana",
        rawPrompt: "SECRET PROMPT",
        resumeText: "SECRET RESUME CONTENT",
        pdfContent: "SECRET PDF CONTENT",
      },
      missingInputs: ["targetCountry"],
      clarificationQuestion: "Which destination country?",
      safetyDomain: "education",
      highStakesNotice: "Planning estimate only. Confirm eligibility with official sources.",
      privacyMode: "account_optional",
      canPrefill: true,
      suggestedNextActions: ["Open Scholarship Finder"],
    }, { input_tokens: 120, output_tokens: 60 });
  };
  router = freshRouter({
    AFROTOOLS_AI_ROUTER_ANTHROPIC_API_KEY: "test-key",
    AFROTOOLS_AI_ROUTER_INPUT_COST_PER_MILLION: "1",
    AFROTOOLS_AI_ROUTER_OUTPUT_COST_PER_MILLION: "5",
    AFROTOOLS_AI_ROUTER_OBVIOUS_CONFIDENCE: "0.99",
  });
  response = await router.handler(postEvent("school money options ghana", {
    consentToModel: true,
    ip: "203.0.113.204",
    session: "cache-safe",
  }));
  payload = JSON.parse(response.body);
  assert.strictEqual(response.statusCode, 200);
  assert.strictEqual(payload.source, "model_validated");
  assert.strictEqual(payload.decision.selectedToolId, "scholarship-finder");
  assert.strictEqual(payload.decision.extractedInputs.country, "Ghana");
  const serializedFirst = JSON.stringify(payload);
  assert.ok(!serializedFirst.includes("SECRET"));
  assert.ok(payload.telemetry.estimatedCostUsd > 0);

  response = await router.handler(postEvent("school money options ghana", {
    consentToModel: true,
    ip: "203.0.113.205",
    session: "cache-safe-2",
  }));
  payload = JSON.parse(response.body);
  assert.strictEqual(response.statusCode, 200);
  assert.strictEqual(payload.source, "cache_validated");
  assert.strictEqual(payload.telemetry.cacheHit, true);
  assert.strictEqual(fetchCalls, 1);
  const cache = router.__getDecisionCacheSnapshot();
  assert.ok(cache.length >= 1);
  assert.ok(!JSON.stringify(cache).includes("SECRET"));

  router = freshRouter({
    AFROTOOLS_AI_ROUTER_IP_RATE_LIMIT: "1",
    AFROTOOLS_AI_ROUTER_SESSION_RATE_LIMIT: "1",
    AFROTOOLS_AI_ROUTER_USER_RATE_LIMIT: "1",
  });
  response = await router.handler(postEvent("Calculate PAYE in Kenya", {
    ip: "203.0.113.206",
    session: "rate-limit",
  }));
  assert.strictEqual(response.statusCode, 200);
  response = await router.handler(postEvent("Calculate PAYE in Kenya again", {
    ip: "203.0.113.206",
    session: "rate-limit",
  }));
  payload = JSON.parse(response.body);
  assert.strictEqual(response.statusCode, 429);
  assert.strictEqual(payload.error, "Rate limit exceeded.");
  assert.ok(["ip", "session"].includes(payload.scope));

  router = freshRouter({
    AFROTOOLS_AI_ROUTER_IP_RATE_LIMIT: "10",
    AFROTOOLS_AI_ROUTER_SESSION_RATE_LIMIT: "1",
    AFROTOOLS_AI_ROUTER_USER_RATE_LIMIT: "10",
  });
  response = await router.handler(postEvent("Calculate PAYE in Kenya", {
    ip: "203.0.113.207",
    session: "same-session",
  }));
  assert.strictEqual(response.statusCode, 200);
  response = await router.handler(postEvent("Calculate PAYE in Ghana", {
    ip: "203.0.113.208",
    session: "same-session",
  }));
  payload = JSON.parse(response.body);
  assert.strictEqual(response.statusCode, 429);
  assert.strictEqual(payload.scope, "session");

  router = freshRouter({
    AFROTOOLS_AI_ROUTER_IP_RATE_LIMIT: "10",
    AFROTOOLS_AI_ROUTER_SESSION_RATE_LIMIT: "10",
    AFROTOOLS_AI_ROUTER_USER_RATE_LIMIT: "1",
  });
  const authHeader = { authorization: fakeBearer("user-cost-control") };
  response = await router.handler(postEvent("Calculate PAYE in Kenya", {
    ip: "203.0.113.209",
    session: "user-session-1",
    headers: authHeader,
  }));
  assert.strictEqual(response.statusCode, 200);
  response = await router.handler(postEvent("Calculate PAYE in Ghana", {
    ip: "203.0.113.210",
    session: "user-session-2",
    headers: authHeader,
  }));
  payload = JSON.parse(response.body);
  assert.strictEqual(response.statusCode, 429);
  assert.strictEqual(payload.scope, "user");
}

run()
  .then(() => {
    process.env = ORIGINAL_ENV;
    global.fetch = ORIGINAL_FETCH;
    console.log("AI route intent performance controls validated.");
  })
  .catch((err) => {
    process.env = ORIGINAL_ENV;
    global.fetch = ORIGINAL_FETCH;
    console.error(err);
    process.exitCode = 1;
  });
