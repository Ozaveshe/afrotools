# Fuel market finder: EN / FR / SW bounded parity

## Candidate identity and source scope

- Isolated branch `codex/sw-fuel-parity-20260916`, follows preserved `9fff00dc`.
- Original branch base `718a4795427ab960edb57fab495df63b970802c2`; fresh fetch before branch creation recorded `origin/main` as `0656bb1053a25b45a538cd65b1d92edff86423b9`.
- No canonical/coordinator edits, push, deployment, rate changes, dataset changes or new source-freshness claims.
- Shared readable browser owner remains `assets/js/pages/fuel-tracker-vip.js`. Its native labels come from `assets/js/lib/fuel-market-copy.js`; generated shells come from `scripts/lib/fuel-market-shell.js` through `scripts/build-fuel-market-locales.js`.
- Build hook follows SW generation in `build:surfaces`. The SW owner also composes the common finder owner, so its standalone check preserves the finder. Engine loads before the retained SW manual controller.
- No shared engine or CQ metadata edits in this candidate. `FuelTrackerEngine` remains the arithmetic, dataset validation, age/validity, nearest-market and distance owner.

## Actual changes and controls

All three physical routes now use the same country/market/fuel selector, source-bearing result, dated coverage table, optional location action and fill calculation. France retains its original hero and legacy comparison/map/generator scripts; Swahili retains its separate country snapshot and manual comparison/LPG budget. The English market UI is generated through the same owner.

The shared fill form preserves quantity mode, tank capacity/current percentage, litres and US gallons. A visible currency field makes manual calculations possible when no eligible market record is available. Local TXT/JSON exports contain actual inputs, selected market provenance when applicable, units and computed amounts. TXT includes native display labels; JSON preserves stable machine keys and raw values. Exports are disabled after changing input or selection, and eligibility is checked again before calculation/export.

Existing English defects repaired in the shared controller:

1. A changed price, unit, quantity or market previously left an old fill result visible. Changes now clear result/export state.
2. Market data loading was chained behind the unrelated legacy `latest.json` request. A legacy snapshot failure no longer disables `markets.json`.
3. `recordStatus` clamps future dates to age zero. The UI additionally withholds invalid/future effective or verification dates, non-HTTPS source URLs and incompatible volume units. This is a conservative UI eligibility guard, not a new price or engine/CQ claim.
4. Empty tank percentage is explicitly rejected before the shared numeric calculation, rather than implicitly becoming zero.

Location is requested only by the button. Coordinates are passed locally to the existing nearest-market engine. They are absent from report state, storage and analytics payloads. A later manual country/market selection cancels an earlier pending location selection. Denial/unavailability preserves manual selection.

## Evidence

- `node --test tests/calculation-quality.test.js tests/fuel-market-locales.test.js tests/sw-fuel-scenario.test.js`: PASS (17 internal CQ contracts plus four direct tests).
- `node tests/gsc-demand-capture-products.test.js`: PASS.
- `node tests/live-data-tool-wiring.test.js`: PASS; dated data assertion now points to actual market owner, not the removed unnecessary legacy-fetch dependency.
- `node scripts/build-fuel-market-locales.js --write` then `--check`: PASS for all three routes; repeated check and simulated release cache suffix normalization pass.
- `node scripts/build-sw-fuel-tracker.js --check`: PASS.
- Playwright Chromium, one worker, port 4373, default analytics environment: six PASS across `fuel-market-language-parity.spec.js`, the two fuel/location cases in `gsc-demand-capture-products.spec.js`, and `sw-fuel-scenario.spec.js`.
- Port 4374: three shared-language cases PASS after adding missing-source failure/manual fallback, denied-location and improved screenshots. Ports 4375/4376/4377: French case rechecked after moving the new block below its existing hero and dismissing the delayed optional-analytics prompt for readable screenshots.
- Independent synthetic arithmetic: 10 L × 2 = 20; 2 US gallons × 3.785411784 × 2 = 15.141647136; 40 L tank at 25% requires 30 L and costs 60 at price 2; 100% full tank costs zero. Actual parsed JSON/TXT downloads assert those results and provenance.
- Browser gates cover stale, future, expired and missing-source fixtures; empty/negative/over-100 tank percentage; changed-input export invalidation; successful and denied location; legacy snapshot HTTP failure with market data still usable; failed market dataset with manual calculation usable.
- 390px browser overflow, keyboard submit and scoped WCAG A/AA axe checks pass in all three languages. Network URL/body observations and both browser storage areas contain neither synthetic coordinate. Disclosed cookieless analytics requests are not falsely classified as input transfer; default analytics was not disabled in these runs.

Existing English browser assertions were tied to mutable repository dates and exact old wording. They now use explicit dated fixtures and retain their actual result/mobile/location assertions. No historical acceptance ledger was rewritten.

## Limits / remaining work

- This establishes the common market-finder lane, not full acceptance of every legacy French comparison, map, generator or snapshot calculation. Those legacy controls remain present but were not exhaustively exercised here.
- Source notes retain original English text under an explicitly native-labelled “original source notes (English)” disclosure. Country names, UI labels, eligibility, calculations and TXT labels are native. Dataset content was not silently translated or reclassified as official.
- The real dataset's dates, geographical coverage and source accuracy were not reverified. Current prices, nearby stations and cheapest-pump coverage are not promised.
- Market data currently supports petrol/diesel references; SW manual LPG/kg remains independently available. No litre/kg conversion was invented.
- No PDF workflow existed in the common English finder; this candidate adds equivalent TXT/JSON across the three languages, not a PDF claim.
- Axe scope is the new finder, not every existing page element. Native geolocation permission UI is mocked for deterministic tests; actual device positioning is not verified.
- Full repository build, dist/release checks and production observation remain coordinator work. No CTR uplift claim.

## Local visual evidence

Under `C:/Users/Oza/.codex/worktrees/sw-fuel-parity-20260916/afrotools/test-results/`, each shared-language test emits `fuel-market-{locale}-390.png` and `fuel-fill-{locale}-390.png`. The final French folder is `fuel-market-language-parit-69521-location-privacy-and-mobile-chromium`.
