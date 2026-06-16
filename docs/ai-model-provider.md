# AfroTools AI Model Provider Layer

Status: implemented shared server helper. This document does not introduce a new model vendor or change user consent rules.

## Purpose

Use `netlify/functions/_shared/ai-provider.js` for all new server-side model calls. Do not call provider APIs directly from endpoint handlers, browser components, workflow modules, or tests.

The provider layer centralizes:

- provider selection from environment variables;
- disabled/fallback mode;
- request validation;
- response validation and structured JSON parsing;
- timeouts and retry policy;
- metadata-only logging;
- output source-link sanitization.

## Interface

Create a provider with:

```js
const aiProvider = require("./_shared/ai-provider");

const provider = aiProvider.createModelProvider({
  purpose: "routing", // or "generation"
  method: "classifyIntent",
  timeoutMs: 4500,
  maxTokens: 450,
});
```

Supported methods:

- `classifyIntent({ query, prompt, maxTokens })`
- `generateWorkflowBrief({ system, prompt|messages, domain, maxTokens })`
- `generateDocumentDraft({ system, prompt|messages, domain, maxTokens })`
- `improveCVText({ system, prompt|messages, domain, maxTokens })`
- `explainResult({ system, prompt|messages, domain, maxTokens })`

Each method returns:

```js
{
  ok: true,
  method: "classifyIntent",
  provider: "anthropic",
  model: "claude-haiku-4-5-20251001",
  data: {},      // structured output for classifyIntent
  text: "",     // sanitized user-visible text for generation methods
  usage: null,
  latencyMs: 123,
  errorReason: ""
}
```

Failures return `ok: false` and an `errorReason`, such as `provider_disabled`, `provider_key_not_configured`, `provider_timeout`, `provider_invalid_json`, `request_validation_failed`, or `provider_error_502`.

## Environment

Provider selection:

- `AFROTOOLS_AI_PROVIDER=anthropic`
- `AFROTOOLS_AI_PROVIDER=disabled` for deterministic/fallback-only mode

Keys:

- routing: `AFROTOOLS_AI_ROUTER_ANTHROPIC_API_KEY`, falling back to `ANTHROPIC_API_KEY`
- generation: `AFROTOOLS_AI_ANTHROPIC_API_KEY`, falling back to `ANTHROPIC_API_KEY`

Models:

- routing: `AFROTOOLS_AI_ROUTER_CLASSIFICATION_MODEL` or `AFROTOOLS_AI_ROUTER_MODEL`
- generation: `AFROTOOLS_AI_GENERATION_MODEL`
- method-specific: `AFROTOOLS_AI_GENERATE_DOCUMENT_DRAFT_MODEL`, `AFROTOOLS_AI_EXPLAIN_RESULT_MODEL`, etc.

Controls:

- `AFROTOOLS_AI_PROVIDER_TIMEOUT_MS`
- `AFROTOOLS_AI_PROVIDER_RETRIES`
- method max token overrides such as `AFROTOOLS_AI_CLASSIFY_INTENT_MAX_TOKENS`

## Privacy Rules

The provider layer must not log raw prompts, documents, CV text, extracted PDF text, invoices, salaries, client names, provider payloads, tokens, or internal diagnostics.

Endpoint handlers may send model inputs only after the workflow's consent and guardrail checks. The provider layer validates size and shape, but it does not replace consent enforcement.

For structured routing, `classifyIntent` parses and validates JSON shape only. The endpoint must still validate tool IDs, routes, high-stakes warnings, and source claims against the manifest and guardrails.

## Adding Another Provider

1. Add a provider-specific request function inside `netlify/functions/_shared/ai-provider.js`.
2. Keep the public five-method interface unchanged.
3. Map provider response text and usage into the common result shape.
4. Preserve timeout, retry, and metadata-only logging behavior.
5. Add request/response validation tests in `tests/ai-provider.test.js`.
6. Add disabled-mode and invalid-output tests before enabling the provider in any endpoint.
7. Document the new environment variables here.

Do not add direct calls from endpoint handlers to the new provider SDK or HTTP API.
