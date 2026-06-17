# AfroTools AI Model Provider Layer

Status: implemented shared server helper. This document does not introduce a new model vendor or change user consent rules.

## Purpose

Use `netlify/functions/_shared/ai-provider.js` for all new server-side model calls. Do not call provider APIs directly from endpoint handlers, browser components, workflow modules, or tests.

Product architecture is governed in `docs/afrotools-ai-product-architecture.md`
and `data/ai/product-architecture.json`. The current decision is static-first AI
orchestration: use vanilla browser modules, generated JSON artifacts, and thin
Netlify provider ports before considering a heavy frontend framework.

The provider layer centralizes:

- provider selection from environment variables;
- disabled/fallback mode;
- request validation;
- response validation and structured JSON parsing;
- timeouts and retry policy;
- metadata-only logging;
- output source-link sanitization.

Production prompts are governed separately from the provider transport. Use
`assets/js/ai/prompt-registry.js` for prompt IDs, production versions, eval
dataset links, forbidden payload classes, and rollback metadata. Endpoint
handlers should render from the registry instead of owning long-lived production
prompt text inline.

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

## Prompt Governance

Prompt registry:

- `assets/js/ai/prompt-registry.js`

Current production prompts:

- `router.classify-intent` for Ask AfroTools AI routing.
- `workflow.generate-brief` for consented workflow briefs.
- `document.generate-draft` for opt-in document drafting from approved structured fields.
- `result.explain` for calculator/workflow result explanations.

Each prompt declares:

- owner and provider method;
- one production version;
- eval dataset path;
- minimum eval pass rate;
- forbidden payload classes;
- output contract and rollback metadata.

The router endpoint renders `router.classify-intent` from this registry and
records `promptId`, `promptVersion`, `promptEvalDataset`, and
`promptMinEvalPassRate` in telemetry. This metadata is safe operational context;
it must not include raw user prompt text.

Validation:

- `npm run test:ai-prompt-registry`
- `npm run test:ai`

Prompt changes should update the registry, update or add routing/eval fixtures
where behavior changes, and pass the AI gate before release.

## Synthetic Tool-Call Corpus

Use `npm run ai:training-corpus` to generate
`data/ai/tool-call-training-corpus.jsonl` and the companion report. The corpus is
built only from checked-in routing fixtures and prompt examples, marks every
record as synthetic, and excludes raw private user content. It is suitable for
offline router evals, prompt regression checks, and future model-tuning
experiments around known AfroTools tool calls.

Validation:

- `npm run test:ai-tool-call-corpus`
- `npm run eval:ai-tool-calls`
- `npm run test:ai-tool-call-eval`
- `npm run test:ai`

`eval:ai-tool-calls` writes `data/ai/tool-call-eval-report.json`. The gate
requires at least `0.98` exact tool-match rate and `1.0` executable runtime and
URL-privacy pass rates. This makes the corpus useful as an offline regression
suite before any router prompt, model, or deterministic-rule change ships.

## Model-Ready Training Splits

Use `npm run ai:model-splits` after regenerating the corpus to write
provider-neutral chat JSONL files under `data/ai/model-training/`:

- `router-tool-call-train.jsonl`
- `router-tool-call-validation.jsonl`
- `router-tool-call-test.jsonl`
- `router-tool-call-splits.report.json`

Each record has a system message that constrains the model to existing
AfroTools tools, a synthetic user prompt, and an assistant JSON target with the
selected tool id, root-relative route, intent category, privacy/source labels,
missing inputs, extracted input keys, and `existing_tool_call` contract. These
files are suitable for future fine-tuning experiments, router prompt selection,
and held-out model regression checks. They are not a claim that AfroTools has
trained a custom model yet.

Validation:

- `npm run ai:model-splits`
- `npm run test:ai-model-splits`
- `npm run test:ai`

The split report must stay synthetic-only and must keep validation/test records
as held-out checks for prompt, provider, or model changes. If real user feedback
is ever added, it needs a separate consented data pipeline and should not be
mixed into these synthetic files by default.

## AI System Readiness Report

Use `npm run ai:ops-report` to write
`data/ai/ai-system-readiness-report.json`. The report is a repo-artifact gate
for the Ask AfroTools AI system. It checks:

- prompt registry validity and a production router prompt;
- full existing-tool manifest coverage;
- full-catalog model tool pack coverage;
- synthetic corpus size and category breadth;
- train/validation/test split presence and held-out category coverage;
- tool-call eval pass rate, executable runtime calls, and URL privacy;
- Router Lab availability.

This is not a live-production monitor. It does not prove provider keys,
Supabase schema, Netlify deploy health, or production traffic quality. It is the
pre-release gate that should run before router prompt, model, provider, or
tool-call manifest changes are promoted.

Validation:

- `npm run ai:ops-report`
- `npm run test:ai-ops-report`
- `npm run test:ai`

## Sanitized Feedback And Drift Signals

The `/ai/` command page records privacy-safe router feedback through
`assets/js/ai/intent-analytics.js`. Workflow cards show a compact "Route
useful?" control. Clicking it records only metadata such as selected tool id,
intent category, confidence bucket, feedback outcome, feedback reason bucket,
and drift signal. It must not store raw prompts, private career text, document
contents, invoice details, emails, phone numbers, salaries, or identifiers.

Current feedback/drift events:

- `ai_router_feedback_submitted`
- `ai_router_drift_signal`

Aggregates are browser-local by default under
`afrotools.aiIntentAnalytics.v1` and surface in `/ai/intent-report.html` plus
the admin AI traction dashboard. Negative feedback is treated as a route-mismatch
drift signal that should become either a new routing fixture, a manifest synonym,
or a prompt-registry change before model/provider promotion.

Validation:

- `npm run test:ai-intent-analytics`
- `npm run test:ai-traction-dashboard`
- `npm run test:ai-command-page`

## Drift-To-Eval Intake

Use `npm run ai:drift-intake` to turn sanitized router feedback aggregates into
`data/ai/drift-intake/router-drift-intake-report.json`. The generator reads an
aggregate report shaped like `AfroToolsAIIntentAnalytics.getReport()` and writes
a human-review queue with tool ids, routes, category buckets, missing-input
buckets, drift signals, and redacted fixture stubs.

This intake step deliberately does not require or preserve raw user prompts. Each
queue item contains a placeholder such as `[REDACTED: create synthetic prompt
from sanitized feedback bucket]`. A reviewer must replace that placeholder with a
fresh synthetic prompt before adding it to `data/ai/routing-eval-fixtures.json`,
manifest aliases, prompt-registry changes, or future model-tuning data.

Validation:

- `npm run ai:drift-intake`
- `npm run test:ai-drift-intake`
- `npm run test:ai`

## Full-Catalog Tool Retrieval

Ask AfroTools AI should route into existing tools before proposing new workflow
surface area. `assets/js/ai/tool-manifest.js` exposes
`rankToolCandidates(query, manifest, options)` to score the full router-safe
catalog, not just the curated strategic-rule list. The deterministic router uses
this as a second stage when no strategic rule matches, and the Netlify router
endpoint uses the same retriever to choose the candidate tool catalog shown to
the model.

Retrieval rules:

- exact domain/tool terms should beat geography-only matches;
- weak generic comparison prompts may route to a more specific catalog tool;
- explicit country-profile, market-entry, or multi-country comparison prompts
  stay with AfroAtlas;
- unrelated prompts should return no catalog candidates and fall back to search.

Router responses may include `toolCandidates`, a bounded list of nearby existing
AfroTools tools for the current query. Candidate objects are sanitized: they may
include tool id, title, route, category, action, privacy/source labels, output
types, and score, but must not include matched query terms, raw prompts,
extracted private fields, provider diagnostics, or model traces. The command UI
renders these as alternate existing-tool calls under the primary result.

Validation:

- `npm run test:ai-tool-manifest`
- `npm run test:ai-intent-router`
- `npm run test:ai-routing-eval`
- `npm run eval:ai-tool-calls`

## Full-Catalog Model Tool Pack

Use `npm run ai:tool-catalog-pack` to write
`data/ai/tool-catalog-pack.json`. The pack converts every router-safe manifest
entry into compact, model-context-ready existing-tool-call records, then chunks
them by category so a provider request can include a relevant slice of the full
AfroTools catalog without pasting the whole site into one prompt.

Each packed tool includes the known tool id, root-relative route, category,
safe hint terms, required/optional input names, privacy/source labels, output
types, and an `existing_tool_call` contract. The pack must not include raw user
prompts, real private documents, emails, phone numbers, secrets, provider traces,
or unvalidated model output.

Operational flow:

1. Rank the full manifest with `rankToolCandidates(query, manifest, options)`.
2. Select the top candidate chunk or a short list of candidate tool calls.
3. Send only that sanitized catalog context to the provider.
4. Validate the provider-selected tool id and route against the pack/manifest.
5. Execute through `assets/js/ai/tool-invocation-runtime.js`.

Validation:

- `npm run ai:tool-catalog-pack`
- `npm run test:ai-tool-catalog-pack`
- `npm run ai:ops-report`
- `npm run test:ai`

## Router Lab

Use `/ai/router-lab.html` for a noindex browser view of the latest generated
tool-call corpus and eval report. The page reads
`data/ai/tool-call-eval-report.json` and
`data/ai/tool-call-training-corpus.report.json`, plus the optional model split
report at `data/ai/model-training/router-tool-call-splits.report.json` and the
AI readiness report at `data/ai/ai-system-readiness-report.json`. It shows
system gate status, category coverage, top tool calls, source split, model split
coverage, readiness checks, and a sanitized JSON summary without raw query text.

Validation:

- `npm run ai:training-corpus`
- `npm run ai:model-splits`
- `npm run ai:tool-catalog-pack`
- `npm run eval:ai-tool-calls`
- `npm run ai:ops-report`
- `npm run ai:architecture-report`
- `npm run test:ai-router-lab:browser`

## Existing Tool Invocation Runtime

Use `assets/js/ai/tool-invocation-runtime.js` when a router decision needs to
open or prefill an existing AfroTools workflow. The runtime combines the server
`existing_tool_call` contract with `prefill-adapters.js`, produces a launchable
execution plan, and stores only short-lived session prefill payloads when a safe
adapter exists.

Execution order:

1. Router selects a known tool from the manifest.
2. Runtime builds an `afrotools_existing_tool_execution` plan.
3. The canonical tool route opens with `source=ask&prefill=1`.
4. The destination tool consumes browser-session prefill and waits for user
   action before calculating, exporting, saving, or sending anything to AI.

Validation:

- `npm run test:ai-tool-invocation-runtime`
- `npm run test:ai-prefill-adapters`
- `npm run test:ai`

## Adding Another Provider

1. Add a provider-specific request function inside `netlify/functions/_shared/ai-provider.js`.
2. Keep the public five-method interface unchanged.
3. Map provider response text and usage into the common result shape.
4. Preserve timeout, retry, and metadata-only logging behavior.
5. Add request/response validation tests in `tests/ai-provider.test.js`.
6. Add disabled-mode and invalid-output tests before enabling the provider in any endpoint.
7. Document the new environment variables here.

Do not add direct calls from endpoint handlers to the new provider SDK or HTTP API.
