# AfroTools AI Monetization

Status: product and implementation reference. This document describes the first AfroTools AI monetization layer currently represented in code and the rules for future Pro, sponsor, widget, API, and lead workflows.

## Product Principle

Keep core AfroTools calculators and public workflows free. Monetization should sit around added value:

- richer AI documents;
- deeper saved project history;
- richer PDF reports;
- advanced planning;
- no ads or sponsor surfaces in supported Pro experiences;
- partner widgets;
- API access;
- clearly labeled sponsor/data workflows;
- explicit lead opt-ins.

Do not gate existing promised free tools unless product leadership explicitly changes the public contract and the change is documented.

## Current Implementation

Module:

- `assets/js/ai/pro-monetization.js`

Tests:

- `tests/ai-pro-monetization.test.js`

The module defines:

- `PLAN_CAPABILITIES`
- `FEATURE_GATES`
- pricing display feature flag helpers;
- local usage counting;
- upgrade prompt generation with privacy filtering.

Pricing UI is feature-flagged and should not appear publicly unless enabled.

## Plans

Free:

- basic AI routing;
- core calculators;
- limited AI briefs;
- limited basic exports;
- limited local saved projects;
- ads/sponsors allowed.

Pro:

- more AI briefs/documents;
- richer PDF exports;
- saved project depth;
- no ads in supported Pro workflows;
- advanced planning;
- priority features.

Team / B2B:

- widgets;
- API access;
- sponsor/data workflows;
- team or partner implementation paths;
- white-label-ready paths.

The exact pricing, quotas, payment provider, and packaging are product decisions. Do not hardcode public price claims unless billing and pricing pages are updated together.

## Feature Gates

Current gates include:

- `basic_routing`
- `core_calculator`
- `ai_brief_basic`
- `workflow_export_basic`
- `saved_project_local`
- `ai_document_advanced`
- `workflow_export_rich_pdf`
- `saved_project_sync_pro`
- `no_ads`
- `advanced_planning`
- `widget_embed`
- `api_access`
- `sponsor_data_workflow`
- `white_label`

Core calculators and basic routing are free and should not hard-block. Some Free limits can trigger soft upgrade prompts without blocking the user from the underlying free tool.

## Pricing Display Flag

Pricing display is gated by:

- `AFROTOOLS_AI_PRO_PRICING_DISPLAY`
- `NEXT_PUBLIC_AFROTOOLS_AI_PRO_PRICING_DISPLAY`
- runtime `AFROTOOLS_FLAGS`
- local development storage key `AFROTOOLS_AI_PRO_PRICING_DISPLAY`

Use the flag for public price or upgrade UI. Keep upgrade prompts calm, optional, and contextual.

## Sponsor Rules

Sponsor, affiliate, accounting partner, installer, education partner, trade partner, or API partner surfaces must be:

- clearly labeled;
- separate from formulas and eligibility logic;
- independent of source confidence;
- opt-in before lead handoff;
- privacy-filtered before analytics or partner delivery.

Sponsors must not:

- alter PAYE, VAT, duty, fuel, FX, scholarship, solar, or affordability calculations;
- change rankings without disclosure;
- hide stale or low-confidence source warnings;
- imply official approval;
- receive raw prompts, CVs, documents, invoice contents, salaries, or private identifiers without explicit user consent and a documented handoff.

## Lead Opt-In

Lead workflows should use explicit user action, such as:

- "Contact a partner";
- "Request a quote";
- "Send my details";
- "Talk to an accountant";
- "Ask an installer".

The UI must show what is being sent. Analytics may record opt-in metadata, not raw lead content.

## Widgets

Implemented:

- `widgets/ai/mini-router.js`
- `widgets/iframe/ai-mini-router.html`
- `docs/ASK-AFROTOOLS-AI-WIDGET.md`

Current widget behavior is deterministic and lightweight. It recommends a workflow and opens AfroTools. It should not expose private AI endpoints or send raw partner prompts to model providers.

Team/B2B widget monetization is planned around configuration, partner attribution, allowed categories, sponsor labeling, volume use, and support. Do not claim white-label deployment is live unless the partner implementation exists.

## API

Implemented:

- `POST /api/v1/ai/route`
- `netlify/functions/api-v1-ai-route.js`
- `docs/api/ai-route.html`

API monetization is Team/B2B-oriented. The endpoint is useful for partner sites that need a recommended AfroTools link without receiving internal prompts or unrestricted model behavior.

Planned:

- partner dashboards;
- usage analytics;
- formal API pricing tiers;
- account-managed API keys;
- SLA/support language.

Mark these as planned until billing, account management, and partner reporting are implemented.

## Exports And Pro

Implemented export helper:

- `assets/js/ai/workflow-export.js`

Free can include basic copy, JSON, WhatsApp, email text, and basic PDF where available. Pro can gate richer branded PDF reports, larger documents, and advanced export packaging. Do not block the existing primary export path for local-first sensitive tools unless product explicitly asks for that change.

## Privacy In Upgrade Prompts

Upgrade prompts must filter:

- raw prompts;
- emails and phones;
- tokens and internal IDs;
- CV/PDF/document content;
- client or customer details;
- private diagnostics.

Use `buildUpgradePrompt()` and `buildUpgradeMarkup()` from `assets/js/ai/pro-monetization.js` rather than hand-rolling prompt context.

## Validation

```bash
node tests/ai-pro-monetization.test.js
node tests/ai-workflow-export.test.js
node tests/ai-mini-router-widget.test.js
node tests/api-ai-route.test.js
```

For pricing, billing, account, or sponsor lead changes, also run the relevant auth, workspace, API, privacy, and browser checks for the touched surface.
