# African Salary Benchmarker — Audit

- Live: https://afrotools.com/tools/salary-compare/
- File: `tools/salary-compare/index.html`
- Category: Financial / Career

## What it does
Client-side salary benchmarking across 15 African countries and 23 roles. User picks role, experience, industry, country, city, and skills, then compares base pay across markets. Toggles: local currency, total compensation, remote/diaspora employer, PPP-adjusted. Ten result views (country bars, comparison table, compensation split, skill premiums, distribution/percentile, cost-of-living, city breakdown, gender gap, inflation, career timeline). Extras: negotiation band calculator with tailored scripts, remote-work premium detail, copy/CSV/print export, optional AI advisor. All data (`COUNTRIES`, `BASE_SALARIES`, `CITY_MULT`, `INFLATION_DATA`, `PROMOTION_TIMELINE`, `GENDER_GAP`, `REMOTE_PREMIUMS`) is inline in the page — no shared salary file, no backend fetch.

## Competitors & gaps
- **Glassdoor / PayScale / Levels.fyi**: crowd-sourced verified data points per employer. AfroTools has none — figures are modeled/aggregated bands, so trust rests entirely on disclosure.
- **Numbeo**: stronger cost-of-living granularity; AfroTools' COL is a single per-country factor.
- **Advantage over all three**: Africa-specific breadth (15 countries, allowance-based total-comp modeling, PPP, remote/diaspora premiums, gender-gap and inflation views) that the global incumbents cover thinly or not at all.
- **Trust gap**: data is static "2025/2026" estimates with no per-figure sourcing or last-updated date on individual bands; salaries move fast (esp. NGN/EGP/ETB devaluation, already noted in the inflation view). Freshness is the main credibility risk.

## Data source & freshness
Sources named in-page: Glassdoor, PayScale, local salary surveys, recruitment-agency reports, "as of 2025/2026." Gender-gap and remote-premium sets are labelled directional/estimated. No live API; values are hardcoded. Adequate for a planning tool given the disclaimers, but no machine-readable freshness signal.

## SEO
- **Title**: `African Salary Benchmarker & Negotiation Calculator | AfroTools` — keyword + African intent + differentiator, ~62 chars. Adequate; left unchanged.
- **Meta description**: was ~200 chars (over limit) — trimmed to 154. FIXED.
- **H1**: single, unique — "African Salary Benchmarker". Good.
- **JSON-LD**: WebApplication (FinanceApplication), WebPage, BreadcrumbList, FAQPage — all 4 valid. FAQPage's 8 questions all mirror visible FAQ (6 SEO accordions + Methodology + Privacy). Visible "Export path" accordion is intentionally not in schema (subset is valid). Compliant.
- **Content depth**: strong — 4 explainer paragraphs + 6-item FAQ + verification panel. Good topical coverage.

## UX / a11y
- Input → benchmark flow is clear; results region is `aria-live="polite"`. Tabs use full ARIA tablist/tab/tabpanel with roving tabindex.
- Toggles, skills multiselect, AI input all have labels/aria-labels. `focus-visible` outlines scoped to tool controls. `prefers-reduced-motion` respected. Tables wrapped in `overflow-x:auto`.
- Mobile: responsive breakpoints at 980/768/640/480px collapse grids to single column; workbench stacks and AI card reorders above. No obvious 375px overflow risk.
- Minor residual (not fixed, low priority): result tabs are click/keyboard-activated via JS but the ARIA `tab` roles are on `div`s, not buttons — functional but semantically softer than native buttons.

## Fixes applied 2026-07-14
1. **Meta description** shortened from ~200 → 154 chars (`tools/salary-compare/index.html` head), preserving African intent + core keywords (role/industry/experience, negotiation, remote premium, PPP, cost-of-living).
2. **Always-visible source footnote** strengthened to lead with the explicit disclaimer "Benchmarks are indicative estimates, not verified offers." before the aggregated-source list.
- Title left as-is (already keyword + African intent, correct length).
- JSON-LD verified: all 4 blocks parse; FAQPage mirrors only visible FAQ.
- No shared-file edits required (salary data is inline in this tool page).
- Did not touch the verification / "planning summary" panel or its FAQ answers.
