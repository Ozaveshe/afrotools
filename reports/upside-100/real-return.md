# Real Return After Inflation — Audit

Tool: https://afrotools.com/tools/real-return/ · File: `tools/real-return/index.html`

## What it does
Computes the real (inflation-adjusted) annual return from a nominal interest/investment rate and an inflation rate, pre-filled per country (15 African markets). Outputs real return %, projected purchasing power over 1/3/5/10 years, a wealth-preservation score (0-100), and a positive/negative verdict with guidance.

## Formula verification (CRITICAL) — PASS
Line 254: `var realRate=((1+nominal)/(1+inflation))-1;` — correct Fisher equation, NOT naive `nominal − inflation`.
- Node check 15% nominal / 12% inflation → **2.68%** real (naive subtraction would wrongly give 3.00%). Confirmed.
- FAQ example (Nigeria 20% / 32%) → **-9.09%** ≈ the stated -9.1%. Confirmed.
Purchasing power uses `amount * (1+realRate)^years` — consistent with the real rate.

## SEO
- Title: keyword + African intent present ("… Calculator — Africa | AfroTools").
- Meta description was 168 chars (over 160) — trimmed to 146.
- One keyword-rich H1 ("Real Return After Inflation Calculator"). Note: page has two visible "Frequently Asked Questions" H2s (native block + generated df-faq) — cosmetic duplication, left as-is.
- JSON-LD: WebApplication/FinanceApplication, BreadcrumbList, FAQPage — all 3 parse. FAQPage's 7 Q&As mirror the 7 visible FAQs (3 df-faq grid + 4 native items), no phantom entries.

## UX / a11y / trust
- Clear input→result flow; results hidden until calculated. Mobile grid collapses at 680px.
- All inputs have associated `<label>`s. Added `aria-live="polite"` to the results container so screen readers announce the computed figures.
- Positive/negative signalled by text + color (not color-only) — good.
- "Not financial advice" disclaimer existed only in the (off-limits) df block; added an inline disclaimer under the main calculator result plus the formula shown to the user.

## Gaps / deferred
- Inflation figures are hardcoded per-country `data-inf` (e.g. NG 32, GH 22) with no data pipeline — will drift. Not changed (data verification / potential shared source).
- Only 15 of 54 countries in the dropdown despite "54 Countries" badge; others rely on manual inflation entry.
- Duplicate FAQ H2 and the generic df-upgrade block are shared/generated surfaces — not edited per task rules.

## Fixes applied 2026-07-14
- Meta description trimmed 168 → 146 chars (still keyword + African intent).
- Added inline "planning estimate, not financial advice" disclaimer + visible Fisher formula under the main calculator result.
- Added `aria-live="polite"` to `#rr-results` for a11y.
- Formula required NO change (already correct Fisher). Title, H1, and all JSON-LD already valid/compliant; verified they still parse.
