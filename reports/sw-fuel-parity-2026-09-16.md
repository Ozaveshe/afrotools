# Swahili fuel scenario and discovery — 2026-09-16

Base: `718a4795427ab960edb57fab495df63b970802c2`; fresh origin/main `0656bb1053a25b45a538cd65b1d92edff86423b9`. Isolated `sw-fuel-parity-20260916`; French SEO candidates592c2cd2/3bcd2a11 preserved elsewhere. No main push/deployment.

## Confirmed defects and bounded repair

The previous SW fuel page offered LPG but labelled all prices/quantities as litres; permissive numeric coercion accepted malformed/missing values as zero; result labels included English; no own TXT/JSON export or country reference selector existed. The unrelated inline switch cases were inactive on this route.

New durable owner `scripts/build-sw-fuel-tracker.js` renders only this route, with readable `assets/js/pages/sw-fuel-tracker.js` and DOM-free `assets/js/engines/sw-fuel-scenario.js`. Hooked to `build:surfaces` via `sw:fuel:build`; `sw:fuel:check` checks regeneration. Retains all six manual inputs: currency, fuel, entered price, comparison price, monthly quantity and user-entered inspection age. Machine IDs remain stable. Petrol/diesel use L; LPG uses kg. Switching fuel clears price/quantity inputs because no mass/volume or fuel-price conversion is implied; switching currency clears both prices. Invalid or changed input invalidates report buttons and displayed result. Native labels and explicit manual-price disclaimers replace mixed-language output. Local TXT/JSON exports preserve input/result units, monthly period and limitations; JSON is a report, not an importable backup claim.

Country selector reads existing `/data/fuel/latest.json` without credentials, displays native country names, row date/source and national-reference scope. Explicit use-reference action can fill only a row allowed by shared `FuelTrackerEngine.rowUsability` (45-day threshold), with additional HTTPS/date validity/future-date guards. Old, future, missing-source rows cannot fill inputs. No dataset duplication, rate changes, current-price claim or geolocation request. Manual workflow remains usable when fetch fails. The manual price's inspection age remains a user assertion, not independent verification. Source provenance is conservatively discarded upon manual input edits.

## Validation

- `node scripts/build-sw-fuel-tracker.js --write` then `--check`: PASS, exact second generation.
- `node -c assets/js/pages/sw-fuel-tracker.js`: PASS.
- `node --test tests/calculation-quality.test.js tests/sw-fuel-scenario.test.js`: PASS;17 internal CQ contracts plus2 direct scenario tests.
- Six scoped golden fixtures independently register kg/L, positive/zero arithmetic and invalid values. `node scripts/build-calculation-quality.js --write --accept-formula-change --review-file=reports/calculation-quality-review-sw-fuel-2026-09-16.json --only-formula-ids=formula-assets-js-engines-sw-fuel-scenario` changed only the new formula registration. This verifies arithmetic, not fuel tariffs.
- `PORT=4371 CI=1 AFROTOOLS_TEST_DISABLE_ANALYTICS=1 node <dependency-tree>/@playwright/test/cli.js test tests/e2e/sw-fuel-scenario.spec.js --project=chromium --workers=1`:1 PASS. Dependency tree/NODE_PATH `C:/Users/Oza/.codex/worktrees/language-director-20260915/afrotools/node_modules`.
- Browser fixture:12.5kg ×2500TZS/kg=31250TZS; price difference100TZS/kg×12.5=1250TZS. Actual TXT/JSON parsed; zero preserved; negative edits disable stale export; switching to diesel clears obsolete kg values. Synthetic current/stale/future/missing-source rows test withholding. 390px no horizontal overflow and keyboard submit tested. Initial test had an unscoped submit locator also matching footer newsletter; scoped to this form before passing.
- `git diff --check`: PASS. No full build, full accessibility audit, PDF/import promise, provider/live-data mutation or deployment proof. Source code sends no inputs to network or storage; the browser run used analytics-disabled test seam and is not a separate default-analytics network privacy audit.

Visual inspection: `C:/Users/Oza/.codex/worktrees/sw-fuel-parity-20260916/afrotools/test-results/sw-fuel-scenario-SW-fuel-k-f1b1c-eferences-and-mobile-layout-chromium/sw-fuel-390.png` (manual form after invalidation).

## Full fuel parity remains open — shared implementation route

Current EN hub differs from legacy country pages: `/tools/fuel-tracker/` uses `assets/js/engines/fuel-tracker-engine.js` plus `assets/js/pages/fuel-tracker-vip.js` and `/data/fuel/markets.json`. It has country/market selection, effective/verified dates, granularity, freshness-gated eligible rates, optional on-device geolocation matching and fill-cost calculation. Legacy FR hub still includes country comparison/generator workflows; it must not lose those when gaining finder parity. SW now retains manual price comparison and has dated national snapshot discovery, but **does not yet implement the EN city/market finder or geolocation**. No whole-app acceptance.

Next source-owned implementation should:

1. Reuse `FuelTrackerEngine.recordStatus`, `marketRecord`, `nearestMarket` and `calculateFillCost` unchanged; reuse `markets.json`, not a separately translated price dataset. Keep `latest.json` national snapshots visibly separate from eligible market records.
2. Parameterize the English finder controller's display dictionary/number formatting and container scope. Mount the shared finder in native EN/FR/SW shells. Avoid three copies of location matching or freshness logic. Preserve existing FR comparison/generator and SW manual comparison as distinct working sections.
3. Keep geolocation explicitly user-triggered and browser-local, with native explanation; no coordinate persistence, URLs, analytics or server transmission. Prove denied/unavailable location and manual market fallback. A country benchmark must never be relabelled as a city/station rate.
4. Test each locale against the same synthetic market payload: valid/expired/future/missing-source records, unit conversion/fill calculation, selection invalidation, actual exports and mobile/keyboard flows. Add native source/granularity/status text and default-network privacy proof. Current country coverage and dates remain source limitations, not translated claims of fresh prices.

These are remaining goal requirements, not accepted exclusions or permanent reduced localized workflows.
