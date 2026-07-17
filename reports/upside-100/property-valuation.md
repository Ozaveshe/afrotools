# Property Valuation Estimator — Audit

URL: https://afrotools.com/tools/property-valuation/
File: `tools/property-valuation/index.html`

## What it does
Estimates a property's market value from local per-square-metre data. User picks country (NG, KE, ZA, GH, EG), city, neighborhood, then enters size (sqm), property type (apartment/house/semi/land) and condition (new/good/fair/poor). Output: estimated value, low/high range (0.88×–1.15×), adjusted per-sqm rate, a valuation breakdown, a neighborhood price comparison bar chart, a 3-year appreciation projection, and an AI observation. Sidebar shows a 2026 market snapshot and usage tips. Optional AI advisor + a legal-workflow copilot block.

## Valuation math (verified with node)
`adjPerSqm = basePerSqm × typeMult × condMult` then `estimate = adjPerSqm × size`; `low = est×0.88`, `high = est×1.15`. Multipliers: type {apt 1.0, house 1.15, semi 1.08, land 0.45}; condition {new 1.20, good 1.0, fair 0.85, poor 0.68}. Spot-checks all correct, e.g. Ikoyi apt/good 120 sqm → ₦336.0M (range ₦295.7M–₦386.4M); Accra land/poor 500 sqm → $38,250; 3yr@10% compounding of ₦336M → ₦447.2M. Math is internally sound. Data is a hardcoded 2026 snapshot (no live feed) — reasonable for an indicative tool but not dated/sourced on-page.

## Gaps
- No live/dated data source; `article:modified_time` = 2026-03-28. Values are static estimates.
- Land valuation uses the same neighborhood building rate × 0.45 — crude for plots (land is often quoted per plot, not per sqm of building), acceptable as estimate.
- Result had no single prominent "not a formal valuation" disclaimer (only buried in sidebar tips) — now fixed.
- No visible FAQ, so no FAQPage schema is appropriate (correctly absent).

## SEO
- Title: strong — keyword + African intent + year. Kept.
- Meta description was 173 chars (over 160). Trimmed to 155.
- One H1, unique keyword ("African Property Valuation Estimator"). Good.
- JSON-LD: WebApplication + BreadcrumbList, both parse valid (node-checked). No FAQPage (no visible FAQ) — correct.

## UX / a11y / trust
- Clear input→result flow, recalculates on change. Responsive (900px / 480px breakpoints), radio grids collapse.
- a11y: radios wrapped in `<label>` but carried vague `aria-label="PropType"/"Condition"` that overrode the visible option name — removed so each option's visible text is its accessible name. Added `aria-live="polite"` to results.
- Trust: added a highlighted indicative-estimate disclaimer at the result.

## Fixes applied 2026-07-14
- Meta description shortened 173→155 chars, African-intent keyword phrasing.
- Added prominent `.valuation-disclaimer` note in results: "indicative estimate … not a formal valuation … engage a licensed valuer (RICS/API or national body)", with styling.
- Added `aria-live="polite"` to `#results` so the estimate is announced.
- Removed misleading `aria-label="PropType"`/`"Condition"` from the 8 radio inputs; visible labels now supply accessible names.
- Verified valuation math (4 node cases + appreciation compounding) and confirmed both JSON-LD blocks parse. No FAQPage added (no visible FAQ). No shared price-data files edited.
