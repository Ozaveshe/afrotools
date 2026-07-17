# AfroTools AI PR Review - 2026-06-16

## Review Verdict

Status: beta-ready with follow-ups.

This diff supports the "Africa's Practical AI Hub" strategy by routing practical prompts into existing AfroTools calculators, documents, country data, exports, and workflow panels instead of replacing the free tool directory with a generic chatbot. The strongest product choices are deterministic-first routing, source/freshness surfaces, privacy-filtered prefill/export paths, and partner/API/widget monetization that does not gate core calculators.

## What Was Fixed During Review

- Fixed `POST /api/v1/ai/route` safe-route handling so `source=api_ai_route` is appended even when a validated route already has query parameters.
- Added a focused API test for that route-safety branch.
- Replaced currency-symbol mojibake risk in the internal router cache fingerprint regex with explicit Unicode escapes.

## Review Checklist

- Strategy fit: Pass. The work makes AI a practical router and workflow layer around real African calculators, documents, data, and exports.
- Free tools, SEO, and routes: Pass with watch item. Existing tools remain canonical and free; build/link checks pass. Generated SEO/static output is very broad and should be reviewed carefully before merge.
- AI consent, validation, rate limits, fallback: Pass. Internal routing is deterministic-first, model use is consented, provider failures fall back, router output is validated, and endpoints rate-limit.
- Source/freshness/confidence: Pass. Source metadata and cautious warnings are preserved and broadened across data-heavy workflows.
- High-stakes labeling: Pass. Tax, finance, immigration, education, energy, legal, construction, and employment workflows consistently use planning-estimate language.
- Repo conventions: Mostly pass. The implementation follows static HTML/IIFE/CommonJS patterns and keeps engines/testable helpers separate. The generated-file blast radius is the main review burden.
- Tests: Pass. Unit, API, E2E, AI eval, and build checks cover the major beta journeys. The remaining gap is visual/manual review breadth across every generated route.
- Mobile and accessibility: Pass for shared AI surfaces. E2E checks cover tap targets, overflow, status regions, export labels, and representative mobile pages.
- Monetization and trust: Pass. Pro/API/widget/sponsor paths are introduced as optional upgrades or partner surfaces; core calculator access is not blocked.

## Follow-up TODOs

1. Replace homepage -> `/ai/?q=...` handoff with a sessionStorage-based handoff so prompts never briefly appear in browser history.
2. Add a generated-output review gate for broad `npm run build` diffs, especially localized car/tool pages and bundle alias churn.
3. Add cross-browser E2E coverage for Ask AfroTools AI once CI capacity allows it; current beta proof is Chromium-heavy.
4. Continue migrating legacy `ai-advisor` surfaces onto source-backed workflow modules and the shared guardrail/provider layer.
5. Add a public beta monitoring checklist for AI fallback rate, route no-match rate, export usage, saved-project usage, and Pro/API/widget interest.
6. Review the existing public-claim `content-review` warnings as a content QA task, even though they are non-blocking for this AI beta PR.
