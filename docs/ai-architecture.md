# AfroTools AI Architecture

Status: implementation guide. This document describes the current static-first AfroTools AI architecture and marks planned areas explicitly. It should not be used to claim live capabilities unless the linked route, module, and tests exist.

## Product Model

Ask AfroTools AI is a workflow router around existing AfroTools tools. It should:

- classify a practical prompt into a known workflow;
- ask for missing structured inputs;
- route to an existing calculator, planner, document tool, or country surface;
- create safe prefill payloads where a tool supports them;
- show result panels with assumptions, source confidence, and high-stakes warnings;
- offer exports and saved project summaries where implemented;
- require explicit consent before optional model-assisted text generation.

Ask AfroTools AI should not replace canonical tool pages, invent source data, change formulas, silently upload private content, or promise official outcomes.

## Current Entry Points

- `/ai/`: primary Ask AfroTools AI command page.
- `/ask/`: older shell retained as a separate public route.
- Homepage command variant: feature-flagged and routes to `/ai/?q=...`.
- Vertical AI landing pages: generated under `/ai/education/`, `/ai/career/`, `/ai/business/`, `/ai/trade/`, `/ai/energy/`, `/ai/local-life/`, and `/ai/construction/`.
- Mini-router widget: `widgets/ai/mini-router.js` and `widgets/iframe/ai-mini-router.html`.
- Partner API: `POST /api/v1/ai/route`, implemented by `netlify/functions/api-v1-ai-route.js`.

Planned: additional vertical pages can be added only after their workflow modules, underlying tools, and source/safety copy are real.

## Data Layer

The AI layer reads existing product data instead of creating a separate AI catalog.

- Public tool registry: `assets/js/components/tool-registry.js`
- Generated directory: `data/tool-directory.json`
- Router-safe manifest: `assets/js/ai/tool-manifest.js`
- Prompt example registry: `assets/js/ai/example-registry.js`
- Source metadata: `data/source-registry.json`, `data/source-registry.schema.json`
- Source helper: `assets/js/lib/source-confidence.js`
- Source model docs: `docs/source-confidence-model.md`

The manifest builder normalizes generated directory rows into AI-routable entries, collapses duplicate public routes, and keeps alias ids. Curated overrides in `MAJOR_TOOL_OVERRIDES` define important workflows such as CV Builder, Scholarship Finder, Import Duty, Solar ROI, PAYE, PDF Workspace, construction, agriculture, and AfroAtlas.

Source confidence is separate from the AI model. AI text cannot create source URLs or upgrade confidence. User-facing source labels should come from the source registry and workflow data modules.

## AI Router

Current router modules:

- `assets/js/ai/intent-router.js`: deterministic routing, extraction, output normalization, and router schema.
- `netlify/functions/ai-route-intent.js`: internal `/ai/` router endpoint with rate limits, deterministic-first routing, optional model classification after consent, cache controls, and telemetry.
- `netlify/functions/api-v1-ai-route.js`: partner-safe API endpoint with API-key validation and deterministic routing only.
- `assets/js/ai/guardrails.js`: prompt and output guardrails used by AI endpoints.

The internal router flow:

1. Validate request size and query length.
2. Run guardrails for prompt injection, source fabrication, formula tampering, impersonation, impossible-data requests, and out-of-scope requests.
3. Route deterministically against the manifest.
4. Skip model calls for obvious high-confidence deterministic matches.
5. If the user consented and provider keys exist, call the low-cost classification model with a compact manifest subset.
6. Normalize and validate model output against the manifest, allowed routes, high-stakes warnings, and privacy labels.
7. Fall back to deterministic or search routing when the provider fails, times out, or returns invalid output.

The partner API intentionally does not expose model routing, internal prompts, raw provider payloads, chain-of-thought, extracted sensitive values, or unvalidated routes.

## Prefill Adapters

Prefill adapters live in `assets/js/ai/prefill-adapters.js`. Their contract is:

- `supports(toolId)`
- `normalizeInputs(extractedInputs)`
- `validateInputs(normalizedInputs)`
- `toSafeLaunchPayload(normalizedInputs)`
- `getMissingInputs(normalizedInputs)`
- `getUserFacingSummary(normalizedInputs)`

Prefill payloads are short-lived browser payloads, not public URLs. They use:

- storage key: `afrotools.aiPrefillDraft`
- storage: `sessionStorage`
- TTL: 20 minutes
- launch URL pattern: append `source=ask&prefill=1`

Do not put salaries, invoices, CV text, document content, purchase prices, client names, or personal identifiers in query strings. Destination tools should read only matching editable fields and must not auto-submit calculations or exports.

## Workflow Result Panels

The `/ai/` page renders workflow-specific panels from the current routing state. Implemented modules include:

- `assets/js/ai/education-workflow.js`
- `assets/js/ai/career-workflow.js`
- `assets/js/ai/import-advisor-workflow.js`
- `assets/js/ai/energy-advisor-workflow.js`
- `assets/js/ai/sme-finance-workflow.js`
- `assets/js/ai/country-workflow.js`
- `assets/js/ai/local-life-workflow.js`
- `assets/js/ai/construction-workflow.js`
- `assets/js/ai/agriculture-workflow.js`

Panels should show structured summaries, missing inputs, recommended tools, assumptions, warnings, source/freshness/confidence, and next steps. They should stay deterministic by default. Any optional AI-generated narrative must be behind consent.

## Consent And Privacy

Core routing works without model consent. Optional AI retry on `/ai/` requires the user to tick the consent checkbox and press the retry action. Some workflow panels have their own optional AI actions, such as education brief improvement or CV starter profile generation.

Sensitive content rules:

- no silent uploads;
- no raw CV, PDF, invoice, salary, document, identity, contact, or profile content in analytics;
- no private data in URLs by default;
- local storage only for unauthenticated saved summaries;
- account sync only after explicit user action and sanitized payload creation.

## Source Confidence

Use `DataSourceMeta` from `docs/source-confidence-model.md` for changing rates, fees, rules, scholarships, tax rates, fuel prices, country stats, and external availability. Workflow outputs should distinguish:

- official/reviewed data;
- estimates and user-entered assumptions;
- stale, unknown, unavailable, or low-confidence states.

AI outputs must not fabricate source links. `guardrails.sanitizeModelOutput()` strips unsupported URLs and appends source-link caution copy when needed.

## Exports

Reusable workflow exports live in `assets/js/ai/workflow-export.js`. Implemented export surfaces include:

- text report;
- checklist text;
- WhatsApp share text/link;
- email-ready text;
- JSON download;
- PDF report via existing `window.AfroTools.pdf.generate` when available.

Currently integrated first with Import Advisor and Energy Advisor. Planned: expand the same export contract to education, career, SME finance, local life, country intelligence, construction, and agriculture after privacy filtering is reviewed per workflow.

Exports must strip hidden raw prompts, provider tokens, internal IDs, private diagnostics, emails, phones, document content, and sensitive profile fields.

## Saved Projects

Saved project support lives in `assets/js/ai/saved-projects.js`. The `/ai` page can save sanitized local summaries and can sync sanitized summaries through the existing workspace bridge only after explicit action.

Saved project contents should include workflow type, title, non-sensitive summary, structured inputs, result summary, timestamps, and optional export links. They should not save raw CV/PDF/document contents by default.

## Analytics

AI analytics should use metadata only. Implemented helper: `assets/js/ai/intent-analytics.js`.

Allowed event payload style:

- workflow type;
- selected tool id;
- category;
- country code;
- confidence bucket;
- source/freshness state;
- consent state;
- export type;
- query length bucket.

Do not log raw prompts, raw documents, profile text, financial records, emails, phone numbers, identity fields, or provider payloads.

## Validation

Core checks:

```bash
npm run lint
npm run type-check
npm run test:ai
node tests/ai-tool-manifest.test.js
node tests/ai-prompt-examples.test.js
node tests/ai-intent-router.test.js
node tests/ai-guardrails.test.js
node tests/ai-prefill-adapters.test.js
node tests/ai-workflow-export.test.js
npm test
npm run build
```

Browser checks for touched UI:

```bash
npm run test:ai-home-command-hero
npm run test:ai-mini-router-widget:browser
```

Use `npm run lint --if-present` and `npm run type-check --if-present` only when working across older branches that may not have these CI helper scripts yet.
