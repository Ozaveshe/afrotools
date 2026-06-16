# AfroTools AI Security Review

Date: 2026-06-16

Status: repo-level review and low-risk hardening pass. Live Supabase schema, RLS, production logs, and deployed Netlify environment variables were not inspected in this pass.

## Scope Reviewed

- Internal AI router: `netlify/functions/ai-route-intent.js`
- Partner AI routing API: `netlify/functions/api-v1-ai-route.js`
- Shared provider abstraction: `netlify/functions/_shared/ai-provider.js`
- Legacy and workflow generation endpoints: `netlify/functions/ai-advisor.js`, `netlify/functions/ai-business-plan.js`, `netlify/functions/crypto-portfolio-advisor.js`
- Sponsor/lead capture: `netlify/functions/capture-b2b-lead.js`
- Guardrails and structured output: `assets/js/ai/guardrails.js`, `assets/js/ai/workflow-schemas.js`
- Privacy-sensitive browser helpers: `assets/js/ai/intent-analytics.js`, `assets/js/ai/prefill-adapters.js`, `assets/js/ai/prefill-consumer.js`, `assets/js/ai/saved-projects.js`, `assets/js/ai/workflow-export.js`
- Admin AI/data dashboards: `admin/ai-traction.html`, `admin/data-confidence.html`, `netlify/functions/api-admin-session.js`
- AI safety docs: `docs/ai-privacy-and-safety.md`, `docs/AI-ENDPOINT-GUARDRAILS.md`, `docs/ai-routing-api.md`, `docs/ai-monetization.md`

## Summary Verdict

The current AfroTools AI implementation has the right primary architecture: deterministic routing first, model calls behind consent, manifest-validated tool routes, source metadata separated from model text, and privacy-filtered analytics/saved-project/export helpers.

The strongest implemented controls are in `ai-route-intent`: request size limits, IP/session/user rate limits, separate model-call rate limits, provider timeout/fallback, structure-only cache entries, manifest route validation, and prompt-injection guardrails.

Older generation endpoints still carry more residual risk than the router, especially around broad AI-advisor context assembly and legacy client-provided context. This pass fixed the low-risk issues that were safe to address without redesigning product flows.

## Fixes Applied

- Added `Cache-Control: no-store` to AI/generation and lead endpoints that can return private or user-specific output:
  - `netlify/functions/ai-advisor.js`
  - `netlify/functions/ai-business-plan.js`
  - `netlify/functions/crypto-portfolio-advisor.js`
  - `netlify/functions/capture-b2b-lead.js`
- Added an 8 KB default raw-body limit to `POST /api/v1/ai/route` before JSON parsing.
- Added a regression test for oversized partner AI routing API bodies.
- Changed `/ai/` URL handling so prompt text from `?q=` is removed from the address bar after the page reads it. The workflow state and input still work in memory.
- Changed `ai-advisor` so client-provided `system` text for site-assistant mode is treated as untrusted page context rather than a privileged system prompt.
- Stopped `ai-advisor` from injecting recent calculation amounts such as gross/net pay into model context for signed-in users. Recent activity now includes tool name and date only.

## Findings By Area

### 1. AI Endpoints

Controls in place:

- `ai-route-intent` enforces method, JSON parsing, raw body size, query length, rate limits, model-call rate limits, provider timeout, deterministic fallback, cache safety, manifest validation, and high-stakes warning validation.
- `api-v1-ai-route` requires API auth, applies route-level rate limiting when configured, rejects sensitive `partnerContext` keys, validates JSON, limits query length, and now limits raw body size.
- `ai-provider` centralizes provider selection, disabled mode, timeouts, retry policy, request validation, safe logging, JSON parsing, schema validation, and source URL stripping.
- `ai-business-plan`, `ai-advisor`, and `crypto-portfolio-advisor` call shared guardrails before model use and route provider output through `ai-provider`.

Residual risk:

- `ai-business-plan` still asks the model to use "real data", name institutions, and produce market/current claims. Guardrails strip source URLs and add warnings, but this endpoint can still produce stale or unsupported claims in prose.
- `ai-advisor` has many legacy tool contexts with embedded current-rate/rule statements. These should be migrated to source metadata and reviewed datasets over time.

### 2. Privacy

Controls in place:

- `/ai/` deterministic routing works without model consent.
- Model retry on `/ai/` requires explicit consent.
- The AI consent wrapper blocks sensitive payload keys unless content consent is present.
- Intent analytics store metadata, query length buckets, safe synthetic examples, and aggregate counters rather than raw prompt text by default.
- Saved AI projects filter raw prompts, CV/PDF/document content, profile text, emails, phones, names, client/customer names, employer/company fields, identity fields, and private export links.
- Workflow exports block raw prompts, provider data, tokens, internal IDs, private document/profile fields, emails, phones, and private diagnostics.

Residual risk:

- Raw query logging can be enabled through runtime/local flags for debugging. That should stay disabled in production and should be checked by deploy-time configuration review.
- Browser `localStorage` and `sessionStorage` are appropriate for local-first behavior, but they are readable by any injected script. Sensitive values should stay short-lived in `sessionStorage`, and XSS prevention remains important.

### 3. URL Safety

Controls in place:

- Prefill adapters use `sessionStorage` for sensitive tool handoff values.
- Tool URLs carry shallow flags such as `source=ask&prefill=1`, not salaries, invoice details, CV text, or document contents.
- `/ai/` now removes prompt text from the URL after initial `?q=` handoff.

Residual risk:

- The initial `/ai/?q=...` navigation can still briefly put prompt text in browser history, server access logs, and referrer chains before the page scrubs it.
- `/search/?q=...` remains a public search pattern and should not be used for sensitive private prompts.

### 4. Sponsor And Lead Forms

Controls in place:

- `capture-b2b-lead` requires explicit consent, validates required fields, normalizes offer/prospect choices, uses a honeypot field, rate-limits by IP, hashes IP before storage, and stores only the intended lead fields.
- AI monetization docs state that sponsor surfaces cannot alter formulas, rankings, eligibility, source labels, or confidence warnings.
- AI traction analytics track sponsor opt-in counts, not raw lead details.

Residual risk:

- Public lead form UI should be periodically audited so consent checkboxes are explicit, unchecked by default where appropriate, and clear about what will be sent.

### 5. API Routes

Controls in place:

- `POST /api/v1/ai/route` validates API keys through the shared API auth helper, applies plan limits, supports deterministic sandbox keys, rejects sensitive partner context, and returns only validated public route decisions.
- Responses do not include internal prompts, chain-of-thought, provider payloads, raw extracted inputs, `_meta`, or model diagnostics.

Residual risk:

- Shared API auth still accepts `api_key` in query parameters and its error message advertises that path. This is a URL leakage risk for real partner keys and should be deprecated in favor of headers only.
- Scope-level API permissions are not visible in the AI route endpoint. If partners get multiple API products, add explicit `ai_route` permission checks to the API key record.

### 6. Admin Dashboards

Controls in place:

- `admin/ai-traction.html` and `admin/data-confidence.html` are `noindex,nofollow`.
- Both require the existing admin key through `/api/admin-session`.
- Dashboards are view-only and expose local exports, not destructive controls.
- `api-admin-session` uses `Cache-Control: private, no-store`.

Residual risk:

- Admin pages store the shared admin key in `sessionStorage`. This is better than `localStorage`, but still script-readable. A short-lived HttpOnly session cookie or signed admin session token would reduce exposure.
- Admin gating depends on `ADMIN_KEY`/`ADMIN_SECRET` being configured correctly in production.

### 7. Prompt Injection And Tool Safety

Controls in place:

- Shared guardrails block common system bypass, system prompt extraction, disclaimer bypass, formula/rate/source tampering, official impersonation, source fabrication, tool abuse, out-of-scope abuse, and impossible data guarantees.
- Router decisions are validated against the AI tool manifest and safe root-relative routes.
- Model text cannot create supported source URLs unless URLs are explicitly allowed by the caller.
- High-stakes domains require warnings in router outputs and receive disclaimers in model text.

Residual risk:

- Guardrails are static regex controls and will not catch every novel prompt-injection phrasing.
- Retrieved/page/document content should continue to be treated as untrusted data, especially for PDF/CV/document workflows.

## Larger TODOs

1. Replace `/ai/?q=...` prompt handoff with a sessionStorage, POST-backed, or fragment-based handoff that avoids server logs and referrer leakage entirely.
2. Deprecate `api_key` query parameters in shared API auth; require `x-api-key` or `Authorization` headers for production keys.
3. Add explicit API-key product scopes such as `ai_route`, `forex`, `fuel`, `scholarships`, and reject keys without the required scope.
4. Move admin login from raw shared key in `sessionStorage` to a short-lived HttpOnly session cookie or signed admin session token.
5. Migrate legacy `ai-advisor` hardcoded tool contexts into source-backed data modules with `DataSourceMeta` freshness/confidence labels.
6. Add provider-output tests for `ai-business-plan` to catch unsupported official claims, stale market claims, and fabricated institutions.
7. Add production configuration checks that fail deploy previews if raw query logging is enabled outside local development.
8. Extend lead-form tests to cover explicit consent, honeypot behavior, PII minimization, and no-store headers.
9. Add a periodic security test that calls all AI endpoints with prompt-injection fixtures and confirms guardrail or safe-fallback behavior.

## Validation Commands

Run after this review:

```bash
node tests/api-ai-route.test.js
node tests/ai-guardrails.test.js
npm run test:ai
npm run lint
npm run type-check
npm test
npm run build
```
