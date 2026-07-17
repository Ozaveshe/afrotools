# Farm Profit/Loss Calculator — Audit & Fix

- Live: https://afrotools.com/agriculture/farm-profit/
- Hub file: `agriculture/farm-profit/index.html`
- Country calculators: `agriculture/farm-profit/<slug>.html` (54) → shared `engines/farm-profit-engine.js`

## What it does
`/agriculture/farm-profit/` is a **country-directory hub**: hero, region-grouped links to 54 country calculators, an About block, a 5-question FAQ, a "df-upgrade" planning-summary widget, related-tools, and an internal-links block. It renders no profit result itself. The **actual calculator** lives on each country page (e.g. `nigeria.html`): a 6-section form (crop/farm, input costs, labor, land/mechanization, transport/marketing, other costs) feeding the shared engine, which returns a net profit/loss hero, full P&L summary table, revenue-vs-cost bar, key metrics (cost/tonne, break-even yield & price, ROI, margin, revenue/man-day), and 5 what-if scenarios.

## Real analogues & gaps
Closest analogues: FAO cost-of-production templates, university farm-budget/enterprise-budget spreadsheets, and generic ag "gross margin" calculators. **Differentiators here:** Africa-specific realities baked in — post-harvest loss modelled as a **revenue reduction** (not a cost), family labour at 50% opportunity cost, communal-vs-rented land, process-before-sell value-add, middleman commission, country-prefilled costs, local currency. **Gaps:** (1) hub is a directory with no calculator, so the highest-authority URL relies on country pages for tool value; (2) break-even metrics ignore the PH-loss haircut (see below); (3) no multi-season / NPV view; (4) prices are static prefill, not live.

## Math check (node, engine)
Verified `engines/farm-profit-engine.js` against independent recomputation across 4 state cases (profit, price-crash loss, 100% family labour, process-before-sell):
- **Net Profit = Net Revenue − Total Cost** holds exactly in all cases.
- ROI = NetProfit/TotalCost, Margin = NetProfit/NetRevenue, Cost-of-production = TotalCost/Yield, per-hectare figures — all reconcile.
- Post-harvest loss correctly reduces revenue before profit; family-labour discount and process pricing correct.
- **One conservative simplification (shared file, deferred):** `breakEvenYield`/`breakEvenPrice` use gross price and total yield and do **not** divide by `(1 − PHloss)` or the revenue-scaled market/middleman fees, so with a 25% loss the shown break-even yield understates the net-of-loss yield actually needed. Logged in `_shared-fixes.md`. Not a P&L correctness bug.

## SEO / UX / trust
- Title was generic and meta description ran ~210 chars (over the 160 limit). H1 lacked a unique keyword.
- FAQPage JSON-LD answers were **truncated** vs the visible FAQ (missing final sentences on 4 of 5 answers) — a rich-result mismatch risk.
- Hub had no top-level "estimate only" disclaimer (present only inside the df widget and on country pages).
- CollectionPage + BreadcrumbList present; no WebApplication/FinanceApplication markup for the tool itself.
- UX/a11y otherwise solid: breadcrumb nav labelled, responsive `auto-fill minmax(200px,1fr)` grid (mobile-safe at 375px), brand blue `#0062CC` used throughout, decorative flag/arrow spans carry visible text labels.

## Fixes applied 2026-07-14
- **Title** → `Farm Profit/Loss Calculator for Africa — ROI & Break-Even | AfroTools` (keyword + African intent + result intent).
- **Meta description** → trimmed to 157 chars, benefit-led, local-currency + ROI/break-even.
- **H1** → `Farm Profit/Loss Calculator for Africa` (unique keyword).
- **JSON-LD** → added `WebApplication` / `applicationCategory: FinanceApplication` block (price 0, org author). Kept CollectionPage + BreadcrumbList.
- **FAQPage** → rewrote all 5 answers to mirror the visible FAQ **verbatim** (restored the truncated sentences; em-dashes normalised). FAQPage now mirrors only visible Q&A.
- **Disclaimer** → added a top-level "Estimate only" paragraph in the About section near the tool copy.
- Verified all 4 `ld+json` blocks parse via node (4/4 OK). Did not touch the `df-upgrade`/planning-summary block or `df-faq`.

## Deferred
- Shared-engine break-even PH-loss refinement (logged in `_shared-fixes.md`) — affects all 54 country pages.
- No HowTo schema added (hub has no step-by-step instructions to mirror).
