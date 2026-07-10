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

  // Adaptive thinking + effort are sent only to models that support them
  {
    assert.strictEqual(providerApi.supportsAdaptiveThinking("claude-opus-4-8"), true);
    assert.strictEqual(providerApi.supportsAdaptiveThinking("claude-sonnet-5"), true);
    assert.strictEqual(providerApi.supportsAdaptiveThinking("claude-haiku-4-5-20251001"), false);
    assert.strictEqual(providerApi.getSmartGenerationModel({}), "claude-opus-4-8");
    assert.strictEqual(
      providerApi.getSmartGenerationModel({ AFROTOOLS_AI_SMART_MODEL: "claude-sonnet-5" }),
      "claude-sonnet-5"
    );

    const bodies = [];
    const provider = providerApi.createModelProvider({
      env: { ANTHROPIC_API_KEY: "test-key" },
      method: "explainResult",
      fetch: async function (_url, init) {
        bodies.push(JSON.parse(init.body));
        return response(200, anthropicText("Answer text."));
      },
    });

    // Smart-model request: thinking + effort included
    const smart = await provider.explainResult({
      system: "You are the advisor.",
      prompt: "Compare pensions",
      model: "claude-opus-4-8",
      thinking: true,
      effort: "medium",
    });
    assert.strictEqual(smart.ok, true);
    assert.strictEqual(bodies[0].model, "claude-opus-4-8");
    assert.deepStrictEqual(bodies[0].thinking, { type: "adaptive" });
    assert.deepStrictEqual(bodies[0].output_config, { effort: "medium" });

    // Fast/default model: thinking must never be sent even if requested
    await provider.explainResult({
      system: "You are the advisor.",
      prompt: "What is PAYE?",
      thinking: true,
      effort: "medium",
    });
    assert.strictEqual(bodies[1].thinking, undefined);
    assert.strictEqual(bodies[1].output_config, undefined);
  }

  // Text extraction joins all text blocks and skips thinking blocks
  {
    const provider = providerApi.createModelProvider({
      env: { ANTHROPIC_API_KEY: "test-key" },
      method: "explainResult",
      fetch: async function () {
        return response(200, {
          content: [
            { type: "thinking", thinking: "" },
            { type: "text", text: "First part." },
            { type: "text", text: "Second part." },
          ],
          usage: { input_tokens: 10, output_tokens: 5 },
        });
      },
    });
    const result = await provider.explainResult({
      system: "You are the advisor.",
      prompt: "Explain the result",
    });
    assert.strictEqual(result.ok, true);
    assert.ok(result.text.includes("First part."));
    assert.ok(result.text.includes("Second part."));
  }

  console.log("AI provider abstraction tests passed.");
}

run().catch(function (err) {
  console.error(err);
  process.exitCode = 1;
});
