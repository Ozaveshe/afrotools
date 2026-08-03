# Swahili PAYE report-language parity evidence

Date: 2026-07-31

Branch: `codex/sw-paye-reports-20260731`

Baseline: `99898076`

Scope: 26 Swahili PAYE report routes; Kenya PAYE is excluded because it was accepted in an earlier lane.

## Acceptance

- Accepted: 26/26
- Blocked: 0/26
- Deleted files: 0
- Formula-engine changes: 0
- Master-ledger, sitemap, other-locale, `dist/`, deployment and merge changes: 0

Accepted countries:

`angola`, `botswana`, `burkina-faso`, `burundi`, `cameroon`, `central-african-republic`, `chad`, `cote-divoire`, `egypt`, `equatorial-guinea`, `eswatini`, `ethiopia`, `gabon`, `guinea`, `lesotho`, `malawi`, `mali`, `mauritius`, `niger`, `rwanda`, `senegal`, `seychelles`, `tanzania`, `uganda`, `zambia`, `zimbabwe`.

## User-facing result

- Every report artifact declares `lang="sw"` and uses the route's Swahili canonical URL.
- Report headings, result labels, explanations, source/legal context, freshness language, estimate boundaries, share copy, AI prompts, AI progress, and AI error copy are native Swahili within this lane.
- Botswana's former almost-empty print document is now a substantive report built from the existing result object.
- Equatorial Guinea's former bare `window.print()` action is now a substantive local report that can be reopened and printed.
- Botswana presentation bindings now use the existing result object's real `monthlyGhafi`, `monthlyKodi`, and `monthlyNet` fields. Calculation formulas were not changed.
- AI remains optional. Before any calculated salary fields are sent, every route names the fields involved and requires an explicit confirmation. Dismissal causes zero AI requests.
- All 26 routes retain direct, ungated, browser-local report actions with no email or lead-capture gate.

## Source ownership

- `scripts/normalize-sw-paye-report-language.js` owns the exact 26-route report, share, AI-language and consent contract and has an idempotent check/write mode.
- `scripts/fix-sw-paye-custom-ui.js` now supports an exact country selector and check-only mode so this lane does not rewrite unrelated PAYE routes.
- `tests/swahili-paye-report-language.test.js` freezes per-route formula-function hashes and verifies report language, artwork, SEO, consent and AI-language contracts.
- `tests/e2e/swahili-paye-local-exports-vip.spec.js` owns the per-route browser acceptance oracle.

## Browser proof

Final serial Chromium run: 26/26 passed with one worker.

Each physical route proved:

- invalid salary fails closed, then a valid salary produces finite outputs;
- keyboard focus reaches the salary input and calculation action;
- no horizontal overflow at 320px or 375px;
- 200% text reflow has no horizontal overflow;
- light and dark theme state remains operable;
- self-canonical, Swahili locale, source/freshness context and local artwork resolve;
- report action is direct and ungated;
- generated report HTML is substantive, reopened in a new page and contains structured Swahili sections;
- the reopened page is rendered to a real PDF buffer, the `%PDF-` signature is verified, and `pdf-parse` reopens the Swahili content;
- browser print is invoked;
- declining AI consent sends no request; accepting consent sends exactly one mocked AI request whose route requires a Swahili response;
- no unexpected write request, page error or console error occurs.

After the full run, the four routes touched by the final AI-prompt language cleanup (`egypt`, `equatorial-guinea` matched by the route filter, `guinea`, `lesotho`) passed again 4/4.

## Static and repository proof

Passed:

- `node scripts/normalize-sw-paye-report-language.js`
- `node scripts/fix-sw-paye-custom-ui.js --countries=<exact-26> --check`
- `node tests/swahili-paye-local-exports.test.js`
- `node tests/swahili-paye-report-language.test.js`
- `npm run lint` — 47 JavaScript files checked
- `npm run type-check`
- `npm run salary-tax:verify`
- `node tests/ai-intent-router.test.js` — 31 deterministic samples plus API guardrails
- `node tests/localization-platform.test.js`
- `node scripts/validate-hreflang.js` — 10,734 public pages, 30,350 relationships, all reciprocal and locale-correct
- `git diff --check`

## Acceptance boundary

This receipt accepts the exact 26 PAYE report/export and optional-AI workflows above. It does not claim completion of unrelated Swahili category pages or shared sitewide save/share/benchmark component localization.
