# AfroTools AI Privacy And Safety

Status: implementation policy. This document describes current safety boundaries for Ask AfroTools AI, internal AI endpoints, partner routing, widgets, saved projects, exports, and analytics.

## Core Principles

- Deterministic routing first.
- Existing tools remain the authority for calculations and workflows.
- No silent uploads of sensitive user content.
- No raw private content in URLs, analytics, caches, screenshots, reports, or logs.
- Optional model assistance requires explicit consent.
- High-stakes domains must show planning-estimate warnings.
- Source links and confidence labels must come from AfroTools data metadata, not AI text.
- Sponsor, Pro, or partner surfaces must not alter formulas, rankings, eligibility, or source labels.

## Sensitive Content

Treat these as sensitive:

- CVs, resumes, job descriptions, cover letters, LinkedIn/profile text, recruiter messages;
- PDFs, uploaded documents, extracted document text, certificates, transcripts;
- emails, phone numbers, addresses, names, identity numbers, passport data, account IDs;
- salary, payroll, invoice, tax, bank, card, client, customer, business records;
- legal facts, health facts, immigration facts, financial records;
- raw prompts that include any of the above.

Sensitive content must not be logged, cached, stored, synced, exported, or sent to a model unless the workflow explicitly implements consent and privacy filtering.

## Consent Model

Implemented on `/ai/`:

- deterministic routing works without model consent;
- optional model retry requires ticking the AI consent checkbox and clicking retry;
- workflow-specific optional AI actions must check consent again where sensitive fields may be sent;
- consent analytics use metadata only.

Implemented in `ai-route-intent`:

- `consentToModel: false` keeps routing deterministic;
- `consentToModel: true` allows provider classification only when provider keys are configured;
- obvious deterministic matches can skip the model even with consent.

Consent is not a blanket permission to send everything. Only the minimum relevant prompt or structured fields should be sent.

## No Silent Uploads

Tools handling CVs, PDFs, invoices, financial details, legal facts, or health data should remain browser-local unless a later feature explicitly adds opt-in server behavior.

Do not silently send:

- pasted CV/resume text;
- uploaded PDF contents;
- invoice line items;
- salary or payroll details;
- identity documents;
- raw private prompts;
- workspace drafts or saved projects.

## Guardrails

Shared guardrails live in `assets/js/ai/guardrails.js`.

Prompt checks currently block:

- system/developer prompt extraction;
- "ignore previous instructions" style bypass attempts;
- disclaimer removal or bypass;
- formula/rate/source-confidence tampering;
- official authority impersonation;
- source or official URL fabrication;
- unsafe tool-use or approval-bypass instructions;
- requests outside AfroTools planning/calculator scope;
- impossible guarantees or unavailable future data.

Output checks currently:

- validate model-selected tool IDs and routes against the manifest;
- require root-relative routes;
- require high-stakes warnings when a safety domain applies;
- strip unsupported source URLs from AI text;
- redact prompt-leakage phrases;
- append domain disclaimers where needed.

## High-Stakes Domains

High-stakes domains are defined in the AI tool manifest and guardrails:

- `tax`
- `immigration`
- `legal`
- `health`
- `finance`
- `employment`
- `education`
- `energy`
- `construction`
- `none`

The manifest enum currently includes `tax`, `immigration`, `legal`, `health`, `finance`, `employment`, `education`, `energy`, and `none`. Guardrails also include construction disclaimer copy for construction-adjacent IDs. If construction becomes a first-class manifest domain, update the manifest enum and tests together.

All high-stakes outputs should use planning language and direct users to official sources or qualified professionals. AfroTools should not claim filing, admission, visa, customs, tax, engineering, medical, or legal authority.

## Source Fabrication Prevention

AI output must not invent:

- official URLs;
- government gazette links;
- regulator citations;
- scholarship/provider links;
- fuel/tax/FX/current-rate sources;
- confidence or freshness metadata.

Render source UI from:

- `data/source-registry.json`;
- `assets/js/lib/source-confidence.js`;
- workflow data modules that already carry reviewed source metadata.

If an AI output contains unsupported URLs, use `guardrails.sanitizeModelOutput()` to replace them with `[source link omitted]` and append source caution copy.

## Router Validation

Server-side validation must ensure:

- `selectedToolId` exists in the router manifest or is the safe `tool-search` fallback;
- `selectedRoute` is root-relative and matches the selected manifest route;
- high-stakes decisions include warnings;
- output conforms to `intentRouter.OUTPUT_SCHEMA`;
- model output never decides account actions, destructive edits, source labels, export formats, or external URLs without validation.

## Caching And Cost Controls

Implemented in `netlify/functions/ai-route-intent.js`:

- deterministic routing before provider calls;
- provider timeout;
- separate model rate limit;
- normalized prompt/category/country fingerprint cache;
- no caching of sensitive CV/PDF/document/legal/health-style queries;
- cache entries store structure only and strip extracted inputs;
- telemetry tracks model calls, failures, latency, cache hit rate, and estimated cost when provider metadata is available.

Do not cache raw sensitive content unless a future account feature explicitly implements consent, encryption/storage rules, and deletion controls.

## Analytics

Allowed:

- workflow type;
- selected tool id;
- category;
- country code;
- confidence bucket;
- missing input types;
- source/freshness state;
- consent state;
- query length bucket;
- export type;
- local/account save outcome.

Not allowed:

- raw prompts;
- raw CV/PDF/document text;
- provider payloads;
- names, emails, phones, addresses;
- salaries, invoice line items, client names, identity numbers;
- tokens, cookies, request IDs, trace IDs, internal diagnostics.

## Saved Projects

Saved projects should store sanitized summaries, not raw documents. Local saving is acceptable for unauthenticated users where possible. Account sync requires explicit user action and must still use sanitized payloads.

Do not save raw CV/PDF/document contents by default.

## Exports

`assets/js/ai/workflow-export.js` filters reports before PDF, JSON, copy, WhatsApp, and email output. It blocks raw prompts, tokens, internal IDs, provider data, emails, phones, and private document/profile fields.

When adding export support to a new workflow, add a test that proves sensitive fixture fields are absent from every export format.

## Partner And Widget Safety

The mini-router widget runs deterministic browser routing and should not transmit raw prompts. Recommended links include only category, partner, country, and source metadata.

The partner API rejects sensitive `partnerContext` keys and returns only a validated route decision.

## Validation

```bash
node tests/ai-guardrails.test.js
node tests/api-ai-route.test.js
node tests/ai-prefill-adapters.test.js
node tests/ai-workflow-export.test.js
node tests/ai-intent-analytics.test.js
node tests/ai-saved-projects.test.js
```
