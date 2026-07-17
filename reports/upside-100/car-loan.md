# Car Loan Calculator — Audit

- Live: https://afrotools.com/tools/car-loan/
- File: `tools/car-loan/index.html` (self-contained: inline CSS/JS, Chart.js CDN, AI advisor via `/.netlify/functions/ai-advisor`)

## What it does
Three-mode car finance tool for all 54 African countries + USD/GBP/EUR:
1. **Monthly Payment** — amortising repayment from vehicle price, deposit (amount or %), trade-in, rate (slider + input, auto-seeded per country), term (1–7yr or custom months), balloon %, lump-sum fees. Outputs monthly payment, loan amount, total interest, total cost, interest-to-loan ratio, monthly rate, balloon due. Renders doughnut (principal vs interest), balance-over-time line, stacked monthly bar, full monthly/annual amortisation table with CSV download.
2. **Affordability** — inverts the annuity to a max loan/price from a monthly budget.
3. **Comparison** — Scenario A vs B (rate/term/balloon) with winner + savings.
Plus a Total-Cost-of-Ownership block (fuel, insurance on depreciating value, depreciation, residual value) and a sidebar quick-afford (15–20% income rule). Country data carries currency symbol, indicative rate band, and fuel price.

## Competitors & gaps
- **Bankrate auto / Calculator.net** — strong on amortisation schedules and extra-payment scenarios but are US-centric (USD, US APR norms, no local rate context). AfroTools already beats them on **local-currency + per-country rate bands + balloon (SA) + TCO + affordability**, which is the real differentiator.
- Remaining gaps vs best-in-class: no extra/lump-sum prepayment modelling; no APR-with-fees (initiation/monthly account fees) vs nominal-rate distinction; rate bands are indicative, not live lender rates; no PDF export (CSV only).

## Math verification (node, exact)
- Standard amortisation `M = P·r(1+r)^n/((1+r)^n−1)` matches independent formula (10M @18% 36mo → 361,523.96/mo). ✓
- 0% interest → straight-line (6M @0% 24mo → 250,000/mo, 0 interest). ✓
- Balloon: monthly amortises `P − PV(balloon)`; residual balance after n payments equals the balloon exactly (20M @12% 60mo, 30% balloon → residual 6,000,000 = balloon). ✓
- Affordability inverts correctly (budget 250k @22% 36mo → maxLoan 6,546,138.61 → back-check 250,000/mo). ✓
- Amortisation schedule is consistent with the summary and self-clears to 0 at term end.

## SEO
- Title was weak/generic (`Car Loan Calculator | AfroTools`, 31 chars). **Fixed** → keyword + African intent.
- Meta description was 212 chars (over limit). **Fixed** → 158 chars.
- **FAQPage JSON-LD did NOT match the visible FAQ** (different question wording; one schema Q — "total cost of owning a car" — had no visible counterpart, while visible "% of income" Q was absent). Rich-result risk. **Fixed** to mirror the 6 visible `.faq` questions exactly.
- WebApplication/`FinanceApplication`, WebPage, BreadcrumbList all present and valid.
- H1: single, now includes "for Africa" for keyword uniqueness. Good depth of body copy + two FAQ surfaces (main + df-faq).

## UX / a11y / trust
- Input→result flow is clear; results, amortisation, and TCO reveal on calculate; smooth-scroll; charts degrade gracefully when Chart.js is blocked (fallback note). Mobile: grid collapses at 900/768/480px, tab bar scrolls.
- Trust: sidebar + tool-verification disclaimers present. **Added** an estimate/"rates vary by lender" line directly under the main results (was only in sidebar/footer).
- a11y: improved two generic rate-input aria-labels. Slider + number are kept in sync.

## Fixes applied 2026-07-14
All edits scoped to `tools/car-loan/index.html`:
1. `<title>` → `Car Loan Calculator Africa: Monthly Repayment & Amortisation | AfroTools` (keyword + African intent).
2. Meta description rewritten to 158 chars (was 212).
3. H1 → `Car Loan Calculator for Africa` (unique keyword intent; still single H1).
4. FAQPage JSON-LD rewritten to mirror the 6 visible FAQ questions/answers exactly (verified programmatically: EXACT MATCH true).
5. Added an "Estimate only — actual rates, fees and terms vary by lender. Confirm the quote with your bank or dealer before signing." disclaimer under the Loan Summary results.
6. a11y: descriptive aria-labels on the interest-rate slider and number inputs.

Verified: all 4 JSON-LD blocks parse (WebApplication, WebPage, BreadcrumbList, FAQPage). Loan/amortisation/affordability/balloon math re-checked with node — correct. No shared files touched; nothing appended to `_shared-fixes.md`.

### Deferred (not in scope / needs shared or backend work)
- Extra-payment / lump-sum prepayment modelling and APR-including-fees vs nominal-rate distinction (feature work).
- Live per-lender rates (currently indicative bands) — data pipeline.
- PDF amortisation export (CSV exists) — shared share/save components.
