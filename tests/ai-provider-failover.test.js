#!/usr/bin/env node
/*
 * Pins the OpenAI failover.
 *
 * Before this existed, a single Anthropic outage took the Direct answer panel
 * with it: getProviderInfo() hardcoded `provider === 'anthropic'`, the endpoint
 * was hardcoded, and any 5xx/timeout ended in "the AI service is briefly
 * unavailable". These tests drive the whole path with a stub fetch, so they run
 * with no keys and no network — which matters, because the day this code is
 * load-bearing is the day nobody can reach the primary API to check it.
 */
const assert = require("assert");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const provider = require(path.join(ROOT, "netlify", "functions", "_shared", "ai-provider.js"));

const ANTHROPIC = "https://api.anthropic.com/v1/messages";
const OPENAI = "https://api.openai.com/v1/chat/completions";

function jsonResponse(body, status) {
  return {
    ok: (status || 200) < 400,
    status: status || 200,
    json: async function () { return body; },
    text: async function () { return JSON.stringify(body); }
  };
}

function anthropicOk(textOut) {
  return jsonResponse({ content: [{ type: "text", text: textOut }], usage: { input_tokens: 1 } });
}

function openaiOk(textOut) {
  return jsonResponse({ choices: [{ message: { role: "assistant", content: textOut } }], usage: { total_tokens: 1 } });
}

/** Records every URL called so we can assert who was actually asked. */
function stubFetch(handler) {
  const calls = [];
  const fn = async function (url, init) {
    calls.push({ url: String(url), body: init && init.body ? JSON.parse(init.body) : null, headers: (init && init.headers) || {} });
    return handler(String(url), calls.length, calls[calls.length - 1]);
  };
  fn.calls = calls;
  return fn;
}

const BOTH_KEYS = { ANTHROPIC_API_KEY: "sk-ant-test", OPENAI_API_KEY: "sk-oai-test" };

function makeProvider(env, fetchImpl, extra) {
  return provider.createModelProvider(Object.assign({
    env: env,
    method: "explainResult",
    purpose: "generation",
    fetch: fetchImpl,
    retries: 0
  }, extra || {}));
}

async function main() {
  // --- 1. Healthy Anthropic is never failed over ---------------------------
  {
    const fetchImpl = stubFetch(function (url) {
      if (url === ANTHROPIC) return anthropicOk("primary answer");
      throw new Error("OpenAI must not be called when Anthropic succeeds");
    });
    const p = makeProvider(BOTH_KEYS, fetchImpl);
    const result = await p.explainResult({ system: "be helpful", messages: [{ role: "user", content: "hello" }] });
    assert.ok(result.ok, "expected success, got " + result.errorReason);
    assert.strictEqual(result.provider, "anthropic");
    assert.strictEqual(fetchImpl.calls.length, 1, "exactly one upstream call");
    assert.ok(!result.failoverFrom, "no failover marker on a healthy call");
  }

  // --- 2. A 5xx fails over and the user still gets an answer ---------------
  {
    const fetchImpl = stubFetch(function (url) {
      if (url === ANTHROPIC) return jsonResponse({ error: "overloaded" }, 529);
      return openaiOk("backup answer");
    });
    const p = makeProvider(BOTH_KEYS, fetchImpl);
    const result = await p.explainResult({ system: "be helpful", messages: [{ role: "user", content: "hello" }] });
    assert.ok(result.ok, "failover should produce an answer, got " + result.errorReason);
    assert.strictEqual(result.provider, "openai");
    assert.strictEqual(result.failoverFrom, "anthropic");
    assert.strictEqual(result.failoverReason, "provider_error_529");
    assert.ok(result.text.indexOf("backup answer") !== -1);
    assert.strictEqual(fetchImpl.calls[1].url, OPENAI);
  }

  // --- 3. A lapsed card (401) is an infrastructure failure, not a bad ask ---
  {
    const fetchImpl = stubFetch(function (url) {
      if (url === ANTHROPIC) return jsonResponse({ error: "invalid key" }, 401);
      return openaiOk("still answering");
    });
    const p = makeProvider(BOTH_KEYS, fetchImpl);
    const result = await p.explainResult({ system: "be helpful", messages: [{ role: "user", content: "hello" }] });
    assert.ok(result.ok, "401 on the primary must fail over");
    assert.strictEqual(result.provider, "openai");
  }

  // --- 4. A timeout fails over ---------------------------------------------
  {
    const fetchImpl = stubFetch(function (url) {
      if (url === ANTHROPIC) {
        const err = new Error("aborted");
        err.name = "AbortError";
        throw err;
      }
      return openaiOk("after timeout");
    });
    const p = makeProvider(BOTH_KEYS, fetchImpl);
    const result = await p.explainResult({ system: "be helpful", messages: [{ role: "user", content: "hello" }] });
    assert.ok(result.ok, "a timeout must fail over");
    assert.strictEqual(result.provider, "openai");
  }

  // --- 5. A BAD REQUEST does not fail over ---------------------------------
  // The request is the problem; asking a second model spends twice to fail twice.
  {
    const fetchImpl = stubFetch(function (url) {
      if (url === ANTHROPIC) return jsonResponse({ error: "bad request" }, 400);
      throw new Error("must not fail over on a 400");
    });
    const p = makeProvider(BOTH_KEYS, fetchImpl);
    const result = await p.explainResult({ system: "be helpful", messages: [{ role: "user", content: "hello" }] });
    assert.ok(!result.ok, "a 400 should stay a failure");
    assert.strictEqual(fetchImpl.calls.length, 1, "OpenAI must not be called");
  }

  // --- 6. If the backup also fails, report the ORIGINAL cause --------------
  // Otherwise every Anthropic outage would surface as an OpenAI error and send
  // whoever is debugging to the wrong dashboard.
  {
    const fetchImpl = stubFetch(function (url) {
      if (url === ANTHROPIC) return jsonResponse({ error: "overloaded" }, 503);
      return jsonResponse({ error: "also down" }, 500);
    });
    const p = makeProvider(BOTH_KEYS, fetchImpl);
    const result = await p.explainResult({ system: "be helpful", messages: [{ role: "user", content: "hello" }] });
    assert.ok(!result.ok);
    assert.strictEqual(result.errorReason, "provider_error_503", "should report the primary's failure, got " + result.errorReason);
  }

  // --- 7. No OpenAI key = exactly today's behaviour ------------------------
  {
    const fetchImpl = stubFetch(function () { return jsonResponse({ error: "overloaded" }, 503); });
    const p = makeProvider({ ANTHROPIC_API_KEY: "sk-ant-test" }, fetchImpl);
    const result = await p.explainResult({ system: "be helpful", messages: [{ role: "user", content: "hello" }] });
    assert.ok(!result.ok);
    assert.strictEqual(fetchImpl.calls.length, 1, "no backup configured means no second call");
  }

  // --- 8. OpenAI alone carries the load when Anthropic has no key ----------
  {
    const fetchImpl = stubFetch(function (url) {
      if (url === ANTHROPIC) throw new Error("Anthropic must not be called without a key");
      return openaiOk("openai only");
    });
    const p = makeProvider({ OPENAI_API_KEY: "sk-oai-test" }, fetchImpl);
    const result = await p.explainResult({ system: "be helpful", messages: [{ role: "user", content: "hello" }] });
    assert.ok(result.ok, "OpenAI alone should answer, got " + result.errorReason);
    assert.strictEqual(result.provider, "openai");
  }

  // --- 9. A deliberately disabled model layer stays disabled ---------------
  // "disabled" is an operator decision. A stray OPENAI_API_KEY must not undo it.
  {
    const fetchImpl = stubFetch(function () { throw new Error("nothing should be called"); });
    const p = makeProvider({ AFROTOOLS_AI_PROVIDER: "disabled", OPENAI_API_KEY: "sk-oai-test" }, fetchImpl);
    const result = await p.explainResult({ system: "be helpful", messages: [{ role: "user", content: "hello" }] });
    assert.ok(!result.ok);
    assert.strictEqual(result.errorReason, "provider_disabled");
    assert.strictEqual(fetchImpl.calls.length, 0);
  }

  // --- 10. OpenAI payload shape ------------------------------------------
  // The system prompt is a message, not a top-level field, and the thinking
  // fields must never be forwarded — either mistake is a hard API error.
  {
    const payload = provider.buildOpenAIPayload(
      { model: "gpt-4o", maxTokens: 400, inputCharLimit: 1000, systemCharLimit: 1000 },
      "explainResult",
      { system: "be brief", messages: [{ role: "user", content: "hi" }], thinking: true, effort: "high" },
      "max_completion_tokens"
    );
    assert.strictEqual(payload.system, undefined, "system must not be a top-level field for OpenAI");
    assert.strictEqual(payload.messages[0].role, "system");
    assert.strictEqual(payload.messages[0].content, "be brief");
    assert.strictEqual(payload.messages[1].content, "hi");
    assert.strictEqual(payload.max_completion_tokens, 400);
    assert.strictEqual(payload.thinking, undefined, "thinking is Anthropic-only");
    assert.strictEqual(payload.output_config, undefined, "output_config is Anthropic-only");
  }

  // --- 11. The token-field 400 is retried with the other field -------------
  // Current OpenAI models want max_completion_tokens, older ones max_tokens.
  // Guessing wrong would make the failover fail exactly when it is needed.
  {
    const fetchImpl = stubFetch(function (url, n) {
      if (url === ANTHROPIC) return jsonResponse({ error: "down" }, 503);
      if (n === 2) return jsonResponse({ error: { message: "Unsupported parameter: 'max_completion_tokens'" } }, 400);
      return openaiOk("second shape worked");
    });
    const p = makeProvider(BOTH_KEYS, fetchImpl);
    const result = await p.explainResult({ system: "be helpful", messages: [{ role: "user", content: "hello" }] });
    assert.ok(result.ok, "should recover by switching token field, got " + result.errorReason);
    assert.strictEqual(fetchImpl.calls[1].body.max_completion_tokens !== undefined, true);
    assert.strictEqual(fetchImpl.calls[2].body.max_tokens !== undefined, true, "retry must use max_tokens");
  }

  // --- 12. Guardrails apply equally to a failover answer -------------------
  // An OpenAI answer must not reach a user under weaker checks than an
  // Anthropic one, which is why both share the post-processing path.
  {
    const fetchImpl = stubFetch(function (url) {
      if (url === ANTHROPIC) return jsonResponse({}, 503);
      return openaiOk("   ");
    });
    const p = makeProvider(BOTH_KEYS, fetchImpl);
    const result = await p.explainResult({ system: "be helpful", messages: [{ role: "user", content: "hello" }] });
    assert.ok(!result.ok, "an empty backup answer must not be presented as an answer");
  }

  // --- 13. classifyIntent still parses JSON through either provider --------
  {
    const fetchImpl = stubFetch(function (url) {
      if (url === ANTHROPIC) return jsonResponse({}, 503);
      return openaiOk('```json\n{"intent":"vat"}\n```');
    });
    const p = provider.createModelProvider({
      env: BOTH_KEYS, method: "classifyIntent", purpose: "routing", fetch: fetchImpl, retries: 0
    });
    const result = await p.classifyIntent({ query: "vat on 45000", prompt: "classify this" });
    assert.ok(result.ok, "classifyIntent should fail over too, got " + result.errorReason);
    assert.deepStrictEqual(result.data, { intent: "vat" });
  }

  // --- 14. Routing and generation get separate OpenAI models ---------------
  {
    assert.strictEqual(provider.getOpenAIModelForMethod({}, "classifyIntent", "routing"), "gpt-4o-mini");
    assert.strictEqual(provider.getOpenAIModelForMethod({}, "explainResult", "generation"), "gpt-4o");
    assert.strictEqual(
      provider.getOpenAIModelForMethod({ AFROTOOLS_AI_OPENAI_MODEL: "gpt-5" }, "explainResult", "generation"),
      "gpt-5",
      "env must override the default"
    );
  }

  // --- 15. Failover reasons are infrastructure only ------------------------
  ["provider_error_500", "provider_error_503", "provider_error_429", "provider_error_401",
   "provider_error_403", "provider_timeout", "provider_unavailable", "fetch_unavailable"
  ].forEach(function (reason) {
    assert.ok(provider.shouldFailover({ ok: false, errorReason: reason }), reason + " should fail over");
  });
  ["provider_error_400", "provider_invalid_json", "response_schema_validation_failed",
   "request_validation_failed", "provider_disabled", "provider_empty_response"
  ].forEach(function (reason) {
    assert.ok(!provider.shouldFailover({ ok: false, errorReason: reason }), reason + " must NOT fail over");
  });
  assert.ok(!provider.shouldFailover({ ok: true, errorReason: "" }), "a success never fails over");

  console.log("ai-provider failover tests passed — 15 cases, no network, no keys");
}

main().catch(function (err) {
  console.error(err);
  process.exitCode = 1;
});
