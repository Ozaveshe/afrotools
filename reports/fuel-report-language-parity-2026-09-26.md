# Fuel report and French snapshot parity — 2026-09-26

## Scope and baseline

Isolated branch `codex/fuel-report-parity-20260926`, based on freshly fetched `origin/main` `7a5c7f8fae971d1ffadea09de973e3e4fb4b7009`. The canonical checkout was not changed. Existing untracked `fuel-peer.cjs` and `reorder-peer.cjs` were preserved.

The interrupted audit at `94af89b7` showed a French fill calculation of 2 XOF/L × 10 L = 20 XOF. Its CSV omitted the cost and instead reported the selected market's effective/verification dates as results, while attaching Nigeria to the manual XOF scenario. The old French national table described LPG prices as USD per litre and displayed English country/region names.

## Changed files and behavior

- `assets/js/pages/fuel-tracker-vip.js`: exposes a cloned, validated current report through `AfroTools.fuelFillReport()`. Edits already invalidate the stored result; the getter also rechecks reference expiry. Adds fuel type and localized market/country names to the existing local JSON report.
- `assets/js/pages/french-finance-export-contract.js`: only the `fuel-tracker` adapter consumes that validated report. CSV, copy and print share explicit calculation and input fields. Manual prices exclude unrelated market/source/date claims. Market-backed reports include native country/market labels, source, dates, volume, fuel type and tank context.
- `engines/src/fuel-engine.js`: correct French national snapshot unit labels (GPL/kg, petrol and diesel/L), native country/region names and accented labels. `engines/fuel-engine.js` is regenerated with its existing minification owner.
- `tests/e2e/fuel-explicit-report.spec.js`: five new output-focused scenarios.

There are no changed prices, exchange rates, data dates, freshness thresholds, source ledgers, calculation formulas, routes, country-page owners or analytics events. No new network, storage, registration or export gate is introduced.

## Tests run

- PASS: five new browser scenarios plus three existing `fuel-market-language-parity.spec.js` scenarios, **8/8 in 1.2 minutes**, Chromium, port 4524, actual isolated source server, default analytics behavior.
- Actual EN/FR/SW manual JSON downloads: 20 XOF, manual basis, no market metadata; changing the price invalidates output. Mutating the returned clone does not alter the next report.
- Actual French manual CSV and parsed browser-print PDF: 20 XOF with manual basis; neither unrelated Nigeria nor verification date appears.
- Actual French market CSV and parsed browser-print PDF: 2 US gallons × 2 XOF/L = 15.141647136 XOF and 7.570823568 L, with Senegal, diesel and synthetic source context. Tank CSV: 40 L tank at 25% gives 30 L and 60 XOF. Advancing the clock past validity blocks export.
- French LPG snapshot: kg appears in local/USD values and the section description; liquid-fuel switching restores L. Algeria and North Africa are rendered in French.
- Existing shared suite passed all three locales: stale/future/expired references, gallon/tank arithmetic, invalid inputs, zero fill, local manual fallback, geolocation consent/privacy, keyboard calculation, 390px overflow and scoped axe WCAG A/AA checks.
- PASS: `node tests/fuel-tracker-engine.test.js`.
- PASS: `node --test --test-isolation=none tests/fuel-market-locales.test.js` (2 tests, normalized generated-owner repeatability plus independent calculations).
- PASS: `npm run build:i18n:validate`.
- PASS: `npm run validate:hreflang` (11,574 public pages; 32,564 relationships; 5,302 equivalence groups).
- PASS: source syntax checks and `git diff --check`; no deleted files.

The raw `node scripts/build-fuel-market-locales.js --check` reported existing build-managed asset-reference drift on the unchanged EN page. The normalized owner tests passed; this batch does not change the generator or HTML pages. An initial browser run failed because the LPG test assumed Algeria was the cheapest row, and because this machine lacked axe-core. The test now locates Algeria explicitly; the lockfile-pinned axe-core 4.12.1 was installed only in the private evidence dependency folder. The final eight-test run passed without weakening the accessibility assertions.

## Evidence and limits

Private evidence is under `C:/Users/Oza/.codex/worktrees/cover-letter-parity-20260916/fuel-parity-candidate/`: `verified-browser.log`, `verified-browser-evidence/` (actual CSV, JSON, PDFs and existing synthetic screenshots), `i18n-validate.log`, and `hreflang.log`.

This is source/browser proof, not packaged-site or production proof. The coordinator must run the combined release build, security/artifact gates and live checks after integration. The broad legacy French finance inventory suite was not rerun; the new adapter is selected only by the fuel tool id. Browser-print PDF parsing proves content in Chromium, not every OS print driver. Country-name fallback on browsers without Intl.DisplayNames and a whole-page accessibility audit remain unverified.

### Retained feature gap

Both EN `/tools/fuel-tracker/` and FR `/fr/tools/suivi-carburant/` still lack the original `#generator-cost` and `#fuel-compare` surfaces. At `94af89b7`, `scripts/build-french-fuel-country-pages.js` advertised those absent anchors. The current baseline already routes the generator link to `/fr/tools/couts-secours-energie/` and comparison links to related-country snapshots. Those prior link changes do not establish restored in-page generator/comparison functionality or complete feature parity. This repair does not remove, relabel or close that requirement.

## Rollout and rollback

No deployment or main push by this agent. Integrate the scoped commit and regenerate release-managed output through existing owners. Reverting that commit restores the prior fuel report behavior; data and calculator arithmetic remain unaffected.
