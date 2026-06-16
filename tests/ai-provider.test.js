#!/usr/bin/env node

const assert = require("assert");
const providerApi = require("../netlify/functions/_shared/ai-provider.js");

function response(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async function () {
      return body;
    },
  };
}

function anthropicText(text, usage) {
  return {
    content: [{ text }],
    usage: usage || { input_tokens: 10, output_tokens: 5 },
  };
}

async function run() {
  assert.deepStrictEqual(providerApi.PROVIDER_METHODS, [
    "classifyIntent",
    "generateWorkflowBrief",
    "generateDocumentDraft",
    "improveCVText",
    "explainResult",
  ]);

  {
    const info = providerApi.getProviderInfo({
      env: { AFROTOOLS_AI_PROVIDER: "disabled", ANTHROPIC_API_KEY: "test-key" },
      purpose: "routing",
      method: "classifyIntent",
    });
    assert.strictEqual(info.enabled, false);
    assert.strictEqual(info.reason, "provider_disabled");
    const disabled = providerApi.createModelProvider({
      env: { AFROTOOLS_AI_PROVIDER: "disabled", ANTHROPIC_API_KEY: "test-key" },
      method: "classifyIntent",
    });
    const result = await disabled.classifyIntent({ query: "solar in Lagos", prompt: "Return JSON" });
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.errorReason, "provider_disabled");
  }

  {
    const logs = [];
    const originalWarn = console.warn;
    console.warn = function () {
      logs.push(Array.from(arguments).join(" "));
    };
    try {
      const provider = providerApi.createModelProvider({
        env: { ANTHROPIC_API_KEY: "test-key" },
        method: "classifyIntent",
        retries: 1,
        fetch: async function () {
          return response(200, anthropicText(JSON.stringify({
            selectedToolId: "solar-roi",
            selectedRoute: "/tools/solar-roi/",
            intentCategory: "energy",
          })));
        },
      });
      const result = await provider.classifyIntent({
        query: "Should I install solar for my shop in Lagos?",
        prompt: "Classify this SECRET_PROMPT_VALUE",
      });
      assert.strictEqual(result.ok, true);
      assert.strictEqual(result.data.selectedToolId, "solar-roi");
      assert.ok(!JSON.stringify(result).includes("SECRET_PROMPT_VALUE"));
      assert.ok(!logs.join("\n").includes("SECRET_PROMPT_VALUE"));
    } finally {
      console.warn = originalWarn;
    }
  }

  {
    const provider = providerApi.createModelProvider({
      env: { ANTHROPIC_API_KEY: "test-key" },
      method: "classifyIntent",
      fetch: async function () {
        return response(200, anthropicText("not json"));
      },
    });
    const result = await provider.classifyIntent({ query: "school funding", prompt: "Return JSON" });
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.errorReason, "provider_invalid_json");
  }

  {
    const provider = providerApi.createModelProvider({
      env: { ANTHROPIC_API_KEY: "test-key" },
      method: "classifyIntent",
      timeoutMs: 10,
      retries: 0,
      fetch: async function (_url, init) {
        return new Promise(function (_resolve, reject) {
          init.signal.addEventListener("abort", function () {
            const err = new Error("aborted");
            err.name = "AbortError";
            reject(err);
          });
        });
      },
    });
    const result = await provider.classifyIntent({ query: "school funding", prompt: "Return JSON" });
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.errorReason, "provider_timeout");
  }

  {
    const provider = providerApi.createModelProvider({
      env: { ANTHROPIC_API_KEY: "test-key" },
      method: "classifyIntent",
      fetch: async function () {
        return response(429, { error: { message: "rate limited" } });
      },
    });
    const result = await provider.classifyIntent({ query: "school funding", prompt: "Return JSON" });
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.errorReason, "provider_error_429");
  }

  {
    let calls = 0;
    const provider = providerApi.createModelProvider({
      env: { ANTHROPIC_API_KEY: "test-key" },
      method: "generateWorkflowBrief",
      retries: 1,
      fetch: async function () {
        calls += 1;
        if (calls === 1) return response(502, {});
        return response(200, anthropicText("Open Solar ROI and compare generator spend. https://made-up-source.example"));
      },
    });
    const result = await provider.generateWorkflowBrief({
      system: "Write a short workflow brief.",
      prompt: "SECRET_DOCUMENT_TEXT",
      domain: "energy",
    });
    assert.strictEqual(result.ok, true);
    assert.strictEqual(calls, 2);
    assert.ok(result.text.includes("[source link omitted]"));
    assert.ok(!JSON.stringify(result).includes("SECRET_DOCUMENT_TEXT"));
  }

  {
    const invalid = providerApi.validateRequest("generateDocumentDraft", { system: "x" });
    assert.ok(invalid.includes("prompt or messages is required"));
  }

  console.log("AI provider abstraction tests passed.");
}

run().catch(function (err) {
  console.error(err);
  process.exitCode = 1;
});
