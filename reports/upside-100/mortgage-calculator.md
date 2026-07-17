# Mortgage Calculator — Audit

Live: https://afrotools.com/tools/mortgage-calculator/
File: `tools/mortgage-calculator/index.html`

## What it does
Client-side (local-first) African mortgage repayment calculator. User picks 1 of 14 countries, a country-specific loan type (preset rate), enters loan amount, rate, term, start month, and optional monthly insurance/service charge. Outputs: monthly repayment (P+I plus extras), total interest, total repaid, loan end date, a principal-vs-interest breakdown bar, and a year-by-year amortisation schedule table. LTV auto-syncs from price minus deposit. Optional consent-gated AI advisor sidebar; saved-scenarios via SaveState.

## Amortisation / formula check (CRITICAL — verified correct)
Uses standard `M = P·r·(1+r)^n / ((1+r)^n − 1)` with `r = APR/100/12`, `n = years·12`, and a correct `r === 0 → P/n` guard.
Node cases:
- 200,000 @ 6% / 30y → **1,199.10** (matches textbook).
- 20M @ 6% / 20y → monthly 143,286.21; yearly amort loop reconciles exactly: final balance **0.0000**, Σprincipal = P, Σinterest = totalInterest (14,388,690.81).
- 0% / 5y → 20,000/mo, balance clears to 0.
- 400k @ 28% / 20y → 9,370.29, clears to 0.
Amortisation loop (interest = balance·r, principal = monthly − interest, running balance) is internally consistent with the closed-form total. **No math defects.**

## Gaps vs competitors
- No extra/lump-sum overpayment modelling or payoff-acceleration (common competitor feature).
- No CSV/PDF/print export of the schedule.
- Amortisation is yearly-only (no monthly granularity toggle).
- No chart of balance over time (chart.js is loaded but unused here).
- "Loan End Date" logic returns the month after the final payment for term divisible by 12 (minor cosmetic; not a math error).

## SEO / UX / trust (before fix)
- Title generic ("African Mortgage Calculator | AfroTools"); meta description 212 chars (over the 160 limit).
- H1 "African Mortgage Repayment Calculator" — good, unique.
- JSON-LD: WebApplication/FinanceApplication, WebPage, BreadcrumbList, FAQPage all valid; FAQPage's 9 Qs all mirror visible content (6 in `.faq-grid` + 3 in `.df-faq`) — compliant.
- Loan-type selectors were `<div onclick>` — not keyboard-accessible; no aria-live on result.
- Disclaimers existed in df/verification blocks but none adjacent to the calculator result.

## Fixes applied 2026-07-14
1. Verified amortisation math via node (see above) — correct, no change needed.
2. Title → "African Mortgage Repayment Calculator | 14 Countries | AfroTools" (64 chars, keyword + African intent).
3. Meta description rewritten to 160 chars (was 212), keeps country + amortisation intent.
4. Added a concise "planning estimate; rates/terms vary by lender — confirm with your bank" disclaimer directly under the Calculate button.
5. a11y: loan-type buttons given `role="button"`, `tabindex="0"`, Enter/Space keyboard handling, and `aria-pressed` state (kept in sync in `selectLoanType`). Added `role="status" aria-live="polite"` to the result hero so screen readers announce the computed repayment.
6. Re-validated: all 4 JSON-LD blocks parse; meta 160 chars; title 64 chars.

Deferred (out of scope / larger): overpayment modelling, schedule export, monthly-granularity toggle, balance-over-time chart, end-date cosmetic tweak.
