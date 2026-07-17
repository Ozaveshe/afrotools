# AfroTools AI Public Beta Readiness Report

Date: 2026-06-16

Status: beta-ready with monitored residual risks.

## Scope

This QA pass covered the public Ask AfroTools AI beta surface across:

- homepage command hero;
- `/ai/` command workflow router;
- CV Builder handoff;
- Scholarship Finder and Study Abroad planning;
- Import Advisor result panel and exports;
- Solar and Generator Advisor result panel;
- SME finance payroll, VAT, invoice, and cashflow routing;
- deterministic fallback when the model/provider path is unavailable;
- missing-input clarification and tool launch;
- outside-scope and prompt-injection safe fallback;
- mobile viewport layout, tap targets, and overflow checks.

## Fixes Made

- Updated the homepage command E2E test for the new privacy behavior where `/ai/` scrubs `q` from the URL after reading the prompt.
- Added an integrated homepage prompt -> `/ai/` -> CV Builder prefill browser test.
- Added browser coverage for Import Advisor PDF and WhatsApp export controls using a sanitized workflow report.
- Added browser coverage for outside-scope prompts and prompt-injection attempts.
- Fixed `/ai/` so router-disabled/no-match prompts show the safe no-match fallback instead of a router-error state.
- Fixed `/ai/` no-match state to set `tool-search` as the explicit safe fallback target for analytics and state consumers.
- Polished no-match copy to say AfroTools AI could not match the prompt safely.

## Journey Results

| Journey | Result | Evidence |
| --- | --- | --- |
| Homepage prompt -> `/ai` -> CV Builder prefill | Pass | `tests/e2e/ai-home-command-hero.spec.js` integrated CV test |
| Homepage prompt -> Scholarship/Study Abroad workflow | Pass | `tests/e2e/ai-command-page.spec.js` education workflow and Scholarship Finder prefill tests |
| Prompt -> Import Duty -> result panel -> PDF/WhatsApp export | Pass | Import advisor panel plus PDF and WhatsApp export test |
| Prompt -> Solar/Generator Advisor -> energy brief | Pass | Energy advisor panel and Solar ROI prefill test |
| Prompt -> SME payroll/VAT/invoice tool | Pass | SME payroll and cashflow browser tests; SME finance unit suite covers VAT/invoice routing |
| Prompt -> deterministic fallback when AI is disabled | Pass | Provider-disabled router response test |
| Prompt with missing inputs -> clarification -> tool launch | Pass | Import clarification update and skip/open tests |
| Prompt outside scope -> safe fallback | Pass | Outside-scope browser test |
| Prompt with injection attempt -> guardrail response | Pass | Prompt-injection browser test plus guardrail unit tests |
| Mobile viewport for above surfaces | Pass | Command hero, command page, result controls, loading state, and vertical page mobile tests |

## Beta Readiness Notes

- Core routing remains deterministic-first and usable without provider keys.
- Sensitive prefill values are passed through `sessionStorage`, not URL query strings.
- `/ai/` now removes prompt text from the browser URL after initial handoff.
- Import and energy exports use the shared privacy-filtered workflow report module.
- Guardrail and outside-scope prompts do not open calculator routes automatically.
- Mobile QA confirms no horizontal overflow on the command hero and command page result surfaces.

## Residual Risks To Monitor

1. The first navigation from homepage to `/ai/?q=...` still briefly contains the prompt before `/ai/` scrubs it. A future handoff should avoid query strings entirely.
2. Some AI workflows depend on static, generated, or reviewed datasets. Keep source/freshness labels visible and monitor stale-data warnings.
3. Legacy `ai-advisor` tool contexts still need continued migration into source-backed metadata.
4. Mobile coverage uses representative shared panels rather than every possible country/tool destination at every width.
5. Browser E2E coverage is Chromium-only in the current repo script.

## Commands Run

```bash
npm run test:ai-command-page
npm run test:ai-home-command-hero
npm run test:ai
npm run lint
npm run type-check
git diff --check
npm test
npm run build
```

Expected recurring non-blocking warnings:

- public-claim audit content-review warnings for article/educational context;
- automation registry warnings for incomplete/missing recent Codex evidence on existing automation lanes.
