# Import Duty Live Production Ad-Readiness Smoke

Date: 2026-05-21
Route tested: https://afrotools.com/tools/import-duty/
Evidence folder: C:\Users\Oza\Documents\afrotools\audit-results\import-duty-live-production-ad-readiness

## Final Verdict

Not ready

## Blocker

The live route is not serving the upgraded Import Duty / Landed Cost product. Production still serves the legacy page with:

- H1: `Import Duty & Customs Calculator 2026`
- legacy tabs: `Calculate Duties`, `Compare Countries`, `HS Code Lookup`, `Saved`
- legacy script path: `/assets/js/lib/import-duty-rules.js`
- missing upgraded selectors: `data-mode-tab="goods"`, `data-mode-tab="car"`, `data-mode-tab="cif"`
- missing upgraded asset: `/assets/js/pages/import-duty-page.js` returns 404 on live

Cache-busted live check also returned the legacy page (`HasNewTabs=false`, `HasOldTabs=true`). This appears to be a production deployment mismatch, not a browser-cache issue.

## Screenshots

- Desktop initial: C:\Users\Oza\Documents\afrotools\audit-results\import-duty-live-production-ad-readiness\desktop-1440x900-live-current-initial.png
- Desktop legacy calculation: C:\Users\Oza\Documents\afrotools\audit-results\import-duty-live-production-ad-readiness\desktop-1440x900-live-current-legacy-calc.png
- Desktop saved after reload: C:\Users\Oza\Documents\afrotools\audit-results\import-duty-live-production-ad-readiness\desktop-1440x900-live-current-saved-after-reload.png
- Laptop initial: C:\Users\Oza\Documents\afrotools\audit-results\import-duty-live-production-ad-readiness\laptop-1366x768-live-current-initial.png
- Laptop legacy calculation: C:\Users\Oza\Documents\afrotools\audit-results\import-duty-live-production-ad-readiness\laptop-1366x768-live-current-legacy-calc.png
- Mobile 390 initial: C:\Users\Oza\Documents\afrotools\audit-results\import-duty-live-production-ad-readiness\mobile-390x844-live-current-initial.png
- Mobile 390 legacy calculation: C:\Users\Oza\Documents\afrotools\audit-results\import-duty-live-production-ad-readiness\mobile-390x844-live-current-legacy-calc.png
- Mobile 360 initial: C:\Users\Oza\Documents\afrotools\audit-results\import-duty-live-production-ad-readiness\mobile-360x800-live-current-initial.png
- Mobile 360 legacy calculation: C:\Users\Oza\Documents\afrotools\audit-results\import-duty-live-production-ad-readiness\mobile-360x800-live-current-legacy-calc.png
- Failed upgraded-selector smoke screenshots are also present as `*-error.png` in the same evidence folder.

## Downloaded PDF Path

No PDF estimate was downloaded from the live production route during this smoke. The current legacy PDF action did not produce a downloadable file in the automated run, and the upgraded PDF estimate flow is not present on live.

## Saved-State Result

Legacy saved-state persistence works on the current live page:

`Nigeria - Laptop / Desktop - $5,000 FOB - NGN 10,429,220`

The saved item remained visible after reload. This is not the upgraded `afro-import-duty-estimates-v2` saved-estimate flow.

## Source-Confidence Result

Fail. The source/confidence drawer is not available on live because production is serving the legacy calculator.

Expected upgraded controls and labels such as `View sources`, `Official`, `Estimate`, `User input`, `Needs verification`, and field-level last-checked/source metadata were not present.

## Flow Results

- Open live page: works, but serves legacy UI.
- General goods calculation: legacy calculation works.
- Car import calculation: fail, dedicated car import mode is missing.
- CIF calculator: fail, CIF mode is missing.
- Manual FX rate: fail, upgraded manual FX field is missing.
- Shipping and insurance: legacy combined shipping/insurance field works.
- Source/confidence drawer: fail, missing.
- Copy summary: upgraded copy-summary control missing.
- WhatsApp summary: fail, missing.
- Save estimate: legacy save/reload works.
- PDF estimate: fail, no downloaded PDF produced.
- Print flow: available and callable.
- Partner CTA: fail, upgraded partner layer is missing.

## Mobile Result

No horizontal overflow was detected on the current legacy page:

- 390x844 initial and legacy result: `scrollWidth=390`, overflow false.
- 360x800 initial and legacy result: `scrollWidth=360`, overflow false.

This confirms the current live legacy layout does not overflow, but it does not validate the upgraded mobile-first product because that deployment is not live.

## Console Result

Fail. Two console errors were captured on desktop:

- `https://www.google.com/g/collect...` blocked by the current Content Security Policy.
- Fetch to the same Google collect endpoint refused by CSP.

Page errors: 0.

## Analytics Result

Legacy `calculation_complete` events fired with params limited to `tool_name`, `country`, and `category`. No item value, shipping, insurance, VIN, make, model, FX rate, or assessed value was observed in captured analytics params.

However, production also emitted CSP-blocked Google collect errors, and the upgraded analytics events were not available:

- `import_partner_clicked`: missing
- `import_sponsor_viewed`: missing
- `import_partner_interest_clicked`: missing
- upgraded `share_click`, `pdf_download`, and import-type confidence params: missing

## Unsupported-Claim Scan Result

Exact required phrase scan:

- `exact duty`: no matches
- `official cost`: no matches
- `verified customs cost`: no matches
- `guaranteed clearing cost`: no matches

Additional overclaim-risk phrases found on the legacy live page:

- `accurate import duties`
- `Rates from NCS`
- `2025/2026 Rates`
- `Updated March 2026`

These are incompatible with the upgraded product's source-confidence policy unless backed by current source URLs and last-checked metadata.

## Evidence JSON

- Expected upgraded-flow smoke: C:\Users\Oza\Documents\afrotools\audit-results\import-duty-live-production-ad-readiness\production-smoke-results.json
- Current live legacy-state smoke: C:\Users\Oza\Documents\afrotools\audit-results\import-duty-live-production-ad-readiness\production-current-live-state.json

## Required Next Step

Deploy the production build that contains the upgraded `/tools/import-duty/` page and its new assets, then rerun this exact live-domain smoke. After the correct build is live, the pass should specifically re-check car import, CIF mode, source confidence, PDF, WhatsApp, partner events, and CSP-clean analytics.
