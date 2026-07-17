# Job Offer Evaluator — Audit

Live: https://afrotools.com/tools/job-offer-evaluator/
File: `tools/job-offer-evaluator/index.html`
Engine: `engines/job-offer-engine.js`

## What it does
Compares up to 4 African job offers on **true total compensation**, not gross salary. Three input tabs (Offers Setup, Culture Score, Counter-Offer) feed a results view with: winner + ranked list, full component comparison table, 5-year trajectory chart (Chart.js) by company-type growth profile, probability-weighted equity/ESOP valuation, relocation break-even, and a "Regret Test". Counter-offer tab generates a negotiation script + walk-away line and an accept-probability band. All computation is client-side; export via copy/download/localStorage.

## Math verification (node, replicated engine)
- Net pay NG @ ₦800k gross: pension 8% = ₦64,000; tax 20% on (gross−pension) = ₦147,200; net ₦588,800; effective deductions 26.4%. Consistent (tax applied after pension deduction; effective% correctly includes pension).
- Equity EV (10k shares / 10M FD / $0.20 strike): scenarios [$3k,$8k,$48k,$98k]; probEV = 0×.40 + .35×8k + .20×48k + .05×98k = **$17,300**. Weights sum to 100% and match the on-screen "40% zero · 35% $10M · 20% $50M · 5% $100M" and the FAQ. Correct.
- Counter 620k vs 550k offer = +12.7% → "Moderate" band. Correct.
- Culture all-5 ratings = 50/100. Correct.

## Gaps / observations (not fixed — out of surgical scope)
- **Possible double-count:** a user who sets an Annual Bonus % *and* ticks "13th month" gets both added to total comp. Both are user-controlled, so defensible, but worth a UI hint.
- `monetizeBenefits` computes `leaveValue` and `remoteValue` but excludes them from the benefits total (remote shown as days only) — intentional to avoid double counting; fine.
- Effective-tax model is a single flat rate per country applied after pension; no PAYE bands/reliefs. Clearly disclaimed and links to the dedicated PAYE calculators.
- Duplicate `<option value="TZ">Tanzania</option>` in the country select (harmless).
- Main tabs are `<button onclick>` without `role=tab`/`aria-selected`; keyboard operable but not a full ARIA tablist. Low priority.

## SEO
- Title lacked African intent; FAQPage mirrors the 6 visible FAQs exactly (good); WebApplication was `UtilitiesApplication` (a finance tool). Verification/methodology panel, sources, and "career planning support, not legal/tax/financial advice" disclaimer all present and strong.

## UX / a11y / trust
- Input→result flow clear; sticky compare button on mobile; focus-visible rings; prefers-reduced-motion handled; inputs/sliders have aria-labels; scrollable tables (min-width) for 375px. Solid.

## Fixes applied 2026-07-14
- **Title** → `Job Offer Evaluator: Compare Job Offers in Africa | AfroTools` (adds primary keyword + African intent; 61 chars).
- **Meta description** → trimmed 184→148 chars, in the 120–160 target, keeps core capabilities.
- **JSON-LD** WebApplication `applicationCategory`: `UtilitiesApplication` → `FinanceApplication` (accurate category). All 3 ld+json blocks (BreadcrumbList, FAQPage, WebApplication) re-validated with `JSON.parse` — valid.
- Math re-verified via node before/after; no engine changes needed (calculations already correct).
