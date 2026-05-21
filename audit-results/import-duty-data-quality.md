# Import Duty Data Quality Trust Layer

Audit date: 2026-05-21

Scope: `/tools/import-duty/`, `/tools/landed-cost/`, `/tools/vehicle-import-duty/`, Import Duty registry copy, and the Nigeria import-duty blog CTA/copy. No customs, VAT, levy, FX, port, or clearing values were refreshed in this pass.

## What Changed

- Added `assets/js/lib/import-duty-data-trust.js` as the shared source metadata and claims-policy helper for Import Duty and Landed Cost surfaces.
- Added `assets/css/import-duty-data-trust.css` for compact result labels: `Official`, `Estimate`, `User input`, `Needs verification`, plus `Last checked` and source links when metadata allows them.
- Wired `/tools/import-duty/` result rows to show confidence labels and the required planning disclaimer.
- Wired `/tools/landed-cost/` waterfall rows to show confidence labels and the required planning disclaimer.
- Softened unsupported route, registry, and blog wording so broad presets are presented as planning estimates, not official or final customs assessments.

## Classification Rules

- `official_customs`, `official_tax_authority`, and `official_port_authority` may display as `Official` only when `sourceUrl`, `lastChecked`, and `confidence: verified` are present.
- `market_estimate` displays as `Estimate`.
- `user_input` displays as `User input`.
- `unknown` or missing source fields display as `Needs verification`.
- Mixed totals display as estimates unless every component is source-backed or user-entered in a way that supports a stronger label.

## Current Coverage

- `/tools/import-duty/`: user-entered FOB and shipping show `User input`; CIF shows `User input`; duty, VAT, levy, and FX rows show `Needs verification`; estimated landed-cost totals show `Estimate`.
- `/tools/landed-cost/`: user-entered FOB, duty rate, duty amount, and editable FX are modeled as `User input`; freight, insurance, broker fee, handling, and total landed cost are `Estimate`; levy and VAT presets are `Needs verification`.
- `/tools/vehicle-import-duty/`: copy now says planning estimate for selected markets and directs users to official sources or licensed professionals. Full trust-label wiring remains a follow-up.


## Nigeria Engine and Product UI Update

- Added `assets/js/engines/import-duty-nigeria-engine.js` for modular Nigeria-first landed-cost formulas. Stored rate values remain `needs_review` unless the user overrides them.
- Added `assets/js/pages/import-duty-page.js` for General goods, Car import, CIF calculator, Saved estimates, Guide, copy summary, WhatsApp summary, PDF estimate, print, and local save/reload flows.
- Added `assets/css/import-duty-nigeria.css` for the premium mobile-first UI.
- Vehicle make, model, year, type, purchase price, shipping, insurance, assessed-value override, user FX, clearing and port charges are classified as `user_input` when entered.
- Clearing, port, shipping, insurance, and mixed totals remain estimates or user inputs; no partner or sponsor placement is presented as an official cost source.
- Browser smoke evidence is recorded in `audit-results/import-duty-live-ad-readiness-smoke.md`.

## Remaining Gaps

- No official customs, tax, or port rate in the current Import Duty or Landed Cost product has structured `sourceUrl` and `lastChecked` metadata yet.
- Hardcoded FX values are not source-backed and should remain `Needs verification` unless a dated source is attached.
- Country duty/category presets are broad planning approximations and should not be treated as HS-code-level official rates.
- Vehicle import logic still needs the same field-level trust metadata layer.
- PDF/share output on `/tools/import-duty/` now uses the disclaimer, but a richer source appendix should be added after official source packs exist.

## Validation

- `tests/import-duty-data-trust.test.js` enforces source-label rules and scans the import-duty claim surfaces for unsupported exact/official/guaranteed language.
- `npm test` now includes the import-duty data trust test.
- Build validation should be run after this change because the site build rewrites registry, bundles, cache-busting, and generated SEO outputs.
