# Crop Farming Profit Calculator — Audit

Tool: https://afrotools.com/tools/agric-profit/
File: `tools/agric-profit/index.html`

## What it does
Client-side crop farming profitability calculator for African agriculture. User picks crop (16 options), country (8), farming method (traditional/improved/commercial), farm size, and seasons/year. The `CROP_DATA` table pre-loads per-hectare input costs (land prep, seeds, fertilizer, chemicals, labour, irrigation, transport, other), expected yield, and local market price; missing country/method combos fall back to Nigeria data scaled by USD FX. Outputs: total revenue, total cost, net profit/loss, ROI %, break-even yield, break-even price, a cost-breakdown table (with post-harvest-loss deduction and per-kg cost), and a cost-vs-profit bar. Local-currency symbols per country. Integrates save/share result components.

## Math verification (node)
- Maize NG improved defaults: cost/ha 385,000; effective yield after 15% PHL = 4,675 kg; revenue 1,168,750; profit 783,750; ROI 203.6%; break-even yield 1,540 kg/ha; break-even price 82.4/kg. Correct.
- Scaling: 2 ha × 2 seasons → cost 1,540,000, revenue 4,675,000, profit 3,135,000, ROI unchanged 203.6%. Correct (ROI is scale-invariant).
- Loss case (price 50): revenue 233,750, profit −151,250, ROI −39.3%, loss styling triggers. Correct.
- PHL applied to yield (revenue side) only, not to costs — economically sound.

## SEO
- Title: "Crop Farming Profit Calculator — African Agriculture" — keyword + African intent. Good.
- H1: "Crop Farming Profit Calculator" — unique, keyword-matched. Good.
- Meta description was 183 chars (over 160) → trimmed to 145.
- JSON-LD: BreadcrumbList, WebApplication (FinanceApplication), FAQPage — all parse. FAQPage mirrors the 6 visible FAQ `<details>` exactly. No HowTo (no numbered step UI; not required).
- Canonical + hreflang (en/sw/x-default) present. SEO body copy is deep and crop-specific.

## UX / a11y / trust
- Clear input → button → results flow; results scroll into view. Defaults auto-load on init and on any crop/country/method change.
- Mobile: form-grid collapses to 1 column at 600px; results-grid uses auto-fit minmax(180px). Reasonable at 375px.
- Labels use `for`/`id`. Added `aria-live="polite"` to results so screen readers announce recalculation.
- Trust gap: only the FAQ mentioned that figures are estimates; no disclaimer near the results. Added a visible "estimate for planning only; prices/yields vary" line under the results.

## Gaps / deferred (not changed)
- USD reference amount not shown alongside local currency (cars-style dual display) — enhancement, out of surgical scope.
- FX fallback rates (`USD_RATES`) are hardcoded 2025/26 approximations; fine for a directory-estimate tool but will drift.
- Some crops have limited country coverage (e.g. sorghum only NG) and rely on scaled-NG fallback — acceptable given the estimate framing.

## Fixes applied 2026-07-14
- Meta description trimmed 183 → 145 chars (still keyword-rich, adds break-even).
- Added visible estimate/variability disclaimer under the results block.
- Added `aria-live="polite"` to `#results` for a11y.
- Verified profit/ROI/break-even math via node (3 cases) — all correct.
- Re-validated all 3 JSON-LD blocks parse after edits.
