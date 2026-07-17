# AfroTools AI Review Notes

Use this file as the Codex-friendly review path for PRs that touch Ask AfroTools AI, AI workflows, AI APIs, widgets, saved projects, exports, source confidence, or monetization gates.

## Review Lanes

- AI routing: `assets/js/ai/intent-router.js`, `netlify/functions/ai-route-intent.js`, `data/ai/**`, `tests/ai-routing-eval.test.js`
- Partner API: `netlify/functions/api-v1-ai-route.js`, `docs/api/ai-route.html`, `docs/ai-routing-api.md`, `tests/api-ai-route.test.js`
- Tool manifest and prompts: `assets/js/ai/tool-manifest.js`, `assets/js/ai/prompt-examples.js`, `tests/ai-tool-manifest.test.js`, `tests/ai-prompt-examples.test.js`
- Prefill and privacy: `assets/js/ai/prefill-adapters.js`, `assets/js/ai/prefill-consumer.js`, `tests/ai-prefill-adapters.test.js`
- Guardrails and consent: `assets/js/ai/guardrails.js`, `/ai/` consent UI, `tests/ai-guardrails.test.js`
- Workflow panels: `assets/js/ai/*-workflow.js`, `ai/index.html`, workflow-specific tests
- Exports and saved projects: `assets/js/ai/workflow-export.js`, `assets/js/ai/saved-projects.js`, related tests
- Monetization and sponsors: `assets/js/ai/pro-monetization.js`, sponsor/lead surfaces, `tests/ai-pro-monetization.test.js`
- Source confidence: `data/source-registry.json`, `assets/js/lib/source-confidence.js`, `docs/source-confidence-model.md`, `tests/source-confidence.test.js`

## Required Local Checks For AI PRs

Start with the narrow checks:

```bash
npm run lint
npm run type-check
npm run test:ai
```

Then run broader checks when the PR changes public pages, generated data, routes, functions, or source-confidence behavior:

```bash
npm test
npm run build
```

For publish-surface or Netlify/function changes, also run:

```bash
npm run security:scan
npm run build:deploy
npm run audit:dist
```

## Review Rules

- Do not approve model-chosen tool ids, routes, source labels, export formats, or account actions unless server-side validation exists.
- Do not allow raw prompts, CVs, PDFs, invoices, identity data, salary data, or provider payloads in analytics, caches, URLs, logs, reports, exports, or screenshots.
- Keep deterministic routing available without model consent.
- High-stakes domains must include planning-estimate warnings.
- Source URLs and source confidence must come from the data layer, not generated AI text.
- Sponsor and Pro surfaces must not alter formulas, rankings, eligibility, or source warnings.
- Generated outputs must be committed when CI reports drift after `npm run build:deploy`.
