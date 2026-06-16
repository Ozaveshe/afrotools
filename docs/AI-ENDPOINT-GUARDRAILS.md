# AfroTools AI Endpoint Guardrails

AfroTools AI routes users into existing calculators and workflows. AI text must not become the source of truth for rates, rules, official claims, or high-stakes decisions.

## Current AI Surfaces

Server-side model endpoints:

- `netlify/functions/ai-route-intent.js` routes Ask AfroTools AI prompts into the tool manifest. Model output is optional, consent-gated, normalized, and validated before use.
- `netlify/functions/ai-advisor.js` powers opt-in tool assistants. It must treat page context and user messages as untrusted content.
- `netlify/functions/ai-business-plan.js` generates Pro business plan sections. It is a planning draft endpoint, not a finance, tax, grant, or legal authority.
- `netlify/functions/crypto-portfolio-advisor.js` analyzes signed-in crypto portfolio summaries. It is educational portfolio analysis, not investment advice.

Browser-side deterministic modules and planned workflow surfaces:

- `assets/js/ai/intent-router.js`
- `assets/js/ai/tool-manifest.js`
- `assets/js/ai/prefill-adapters.js`
- `assets/js/ai/prefill-consumer.js`
- `assets/js/ai/education-workflow.js`
- `assets/js/ai/career-workflow.js`
- `assets/js/ai/import-advisor-workflow.js`
- `assets/js/ai/energy-advisor-workflow.js`
- `assets/js/ai/sme-finance-workflow.js`
- `assets/js/ai/workflow-export.js`
- `assets/js/ai/saved-projects.js`
- `assets/js/ai/intent-analytics.js`

## Required Controls

Use `assets/js/ai/guardrails.js` from every AI endpoint before any model call.

1. Enforce a maximum prompt size with `inspectPrompt(input, { maxChars })`.
2. Block attempts to reveal system prompts, ignore instructions, bypass warnings, alter formulas, impersonate authorities, fabricate sources, abuse tools, or request unavailable guaranteed data.
3. Treat user prompt, chat history, uploaded/page context, and client-provided system strings as untrusted data.
4. Never let model output create source URLs, official citations, live-rate claims, or data-confidence labels. Render source metadata only from the AfroTools data layer.
5. Validate model-selected tool ids against `assets/js/ai/tool-manifest.js`.
6. Validate model-selected routes as safe root-relative routes that match the chosen manifest tool route.
7. Require high-stakes warnings for tax, immigration, legal, health, finance, employment, education, energy, and construction outputs.
8. Keep analytics metadata-only. Do not store raw prompts, CV content, uploaded files, invoices, financial records, or private diagnostics.
9. Preserve deterministic fallback paths. If the model is unavailable or fails validation, use local routing or a safe refusal/fallback.

## Endpoint Pattern

```js
const guardrails = require("../../assets/js/ai/guardrails.js");

const inspection = guardrails.inspectPrompt({ message, messages, context, system }, {
  maxChars: guardrails.ADVISOR_PROMPT_LIMIT,
});
if (!inspection.allowed) {
  return guardrails.guardrailHttpResponse(headers, inspection);
}

// Call model only after consent, input checks, and rate checks.

const outputGuard = guardrails.sanitizeModelOutput(modelText, {
  domain: guardrails.domainForTool(toolId, "finance"),
  allowedSourceUrls: [],
});
```

For routing endpoints, also call:

```js
const safety = guardrails.validateRouterDecisionSafety(decision, manifest);
if (!safety.valid) {
  decision = intentRouter.fallbackDecision(query);
}
```

## Test Requirements

Every new AI endpoint needs tests for:

- Prompt injection such as "ignore previous instructions" and system prompt extraction.
- Fake official authority claims.
- Fabricated source URL requests.
- Impossible or guaranteed future/live data requests.
- Invalid tool ids or routes if the endpoint accepts model-chosen tools.
- High-stakes outputs including a warning.
- Privacy filtering for analytics, exports, and saved projects.

Run `npm run test:ai-guardrails` for the focused suite and `npm test` before shipping broad AI routing changes.
