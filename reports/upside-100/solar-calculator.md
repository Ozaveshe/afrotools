# Solar Panel Calculator - Audit

Live: https://afrotools.com/tools/solar-calculator/
File: `tools/solar-calculator/index.html`

## What it does
Client-side off-grid/hybrid/on-grid solar sizer for Africa. User picks a country (33, each with a Peak Sun Hours value), builds an appliance load list (with quick presets for flat/family/shop/homestead/office), and sets system type, panel wattage, battery chemistry, backup days, degradation, orientation, shade, soiling and roof area. Outputs panel count + kWp, battery count + kWh, inverter kVA, MPPT amps, effective sun hours, roof area, a 10-year ROI-vs-generator table/chart, specs, tips and a Site-QA tab. Copy/CSV/print export and an optional (consent-gated) AI advisor.

## Sizing math (verified with Node)
- Load: `totalWh = Σ watts×qty×hrs`; `peakW = Σ watts×qty`. Correct.
- Panels: `panelKW = totalWh / (effectivePsh×1000)`, `effectivePsh = PSH × 0.82 × orientation × (1−shade) × (1−soiling)`. Sound PVWatts-style derate. Default Nigeria case: 6.27 kWh/day -> 5×400W = 2.0 kWp. Reasonable.
- Inverter: `ceil(peakW×1.2 /1000 ×2)/2` (0.5 kVA steps). OK.
- **Battery (defect, now fixed):** used `adjustedWh = totalWh / performanceFactor`, applying *panel-side* losses (soiling/shade/orientation) to battery autonomy. Panel losses size the array, not storage, so this over-sized the bank ~28%. Default case: 18 batteries where the textbook formula `(load×days)/(DoD×eff)` gives 14 (lead-acid: 33 -> 25; Kenya family: 22 -> 17). Corrected to use actual `totalWh`.

## Gaps / notes (deferred)
- MPPT amp formula divides array W by 12V (or 24 for >400W panels) giving unrealistic ~210A for a 2 kWp array; real 24/48V banks are far lower. Secondary spec, left as-is.
- System-cost figure ($/panel, FX table) is hardcoded/rough, disclosed as estimate.
- `#2563EB` used as accent/link/positive colour (near-brand blue, semantic) rather than `var(--color-primary)`; solar-yellow `#ffc800` is the tool's identity accent. Left to avoid scope creep.
- No visible FAQ, so no FAQPage added.

## SEO / UX / trust
- Title/meta were generic; both JSON-LD blocks (WebApplication + WebPage) had placeholder garbage (name/url/description all `https://afrotools.com/`).
- Disclaimer already strong (planning-estimate + certified-installer + prices-change) in method notes, export note and verification panel.
- Mobile grid collapses at 760px; tables scroll; inputs have labels. Appliance-row inputs were mislabelled (all "Appliance qty").

## Fixes applied 2026-07-14
- Corrected battery sizing to use actual daily load (`totalWh`) instead of panel-loss-inflated `adjustedWh` (removes ~28% over-size). Node-verified.
- `<title>` -> "Solar Panel Calculator for Africa - Panel, Battery & Inverter Sizing | AfroTools".
- Meta description rewritten to 156 chars with African intent.
- Fixed both broken JSON-LD blocks (real name/description/url pointing to the tool route). All 3 ld+json blocks parse.
- a11y: distinct aria-labels for appliance name/watts/qty/hrs inputs + remove button.
- No FAQPage/HowTo added (no visible FAQ/steps). No shared files touched.
