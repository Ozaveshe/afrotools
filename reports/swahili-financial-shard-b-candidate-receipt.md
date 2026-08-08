# Swahili Finance, Tax & Market Data shard B candidate receipt

Baseline: `6edacda8437e1fa9b9e5a512138cbdd3169e38be`

Denominator: **46**. Accepted: **25**. Blocked: **21**.

Derivation proof: 92 unaccepted financial rows; shard A 46 rows through `loan-compare`; shard B positions 47-92 from `lr-paye` through `za-uif`; overlap **0**.

The missing `.claude/rules/i18n.md` reference was recorded as a setup gap; AGENTS.md, the Swahili strategy and coordinator skill supplied the active localization contract.

## Accepted candidates

| ID | English owner | Swahili app | Source owners | Export/browser proof |
|---|---|---|---|---|
| `lr-paye` | `/liberia/lr-paye` | `/sw/liberia/kikokotoo-kodi-mshahara` | `/assets/js/lib/simple-chart-fallback.js`<br>`/assets/js/lib/chart-config.js`<br>`/assets/js/engines/lr-paye.js`<br>`/assets/js/lib/pdf-template.js`<br>`/assets/js/lib/sw-accessibility.js` | `tests/e2e/swahili-financial-shard-b.spec.js` plus app oracle suite |
| `microfinance-calc` | `/tools/microfinance-calc` | `/sw/zana/microfinance-riba-tambarare-dhidi-ya-salio` | `/engines/microfinance-offer-engine.js`<br>`/assets/js/pages/microfinance-offer.js`<br>`/assets/js/lib/sw-accessibility.js` | `tests/e2e/swahili-financial-shard-b.spec.js` plus app oracle suite |
| `mortgage-affordability` | `/tools/mortgage-affordability` | `/sw/zana/uwezo-wa-mkopo-wa-nyumba` | `/assets/js/lib/dark-mode.js`<br>`/assets/js/engines/mortgage-budget-boundary.js`<br>`/assets/js/pages/mortgage-budget-boundary.js`<br>`/assets/js/lib/sw-accessibility.js` | `tests/e2e/swahili-financial-shard-b.spec.js` plus app oracle suite |
| `mortgage-calculator` | `/tools/mortgage-calculator` | `/sw/zana/kikokotoo-mkopo-wa-nyumba` | `/assets/js/lib/dark-mode.js`<br>`/assets/js/engines/mortgage-planner.js`<br>`/assets/js/pages/mortgage-planner-vip.js`<br>`/assets/js/lib/sw-accessibility.js` | `tests/e2e/swahili-financial-shard-b.spec.js` plus app oracle suite |
| `mr-paye` | `/mauritania/mr-paye` | `/sw/mauritania/kikokotoo-kodi-mshahara` | `/assets/js/lib/simple-chart-fallback.js`<br>`/assets/js/lib/chart-config.js`<br>`/assets/js/engines/mr-paye.js`<br>`/assets/js/lib/pdf-template.js`<br>`/assets/js/lib/sw-accessibility.js` | `tests/e2e/swahili-financial-shard-b.spec.js` plus app oracle suite |
| `ng-cgt` | `/tools/ng-cgt` | `/sw/zana/kikokotoo-cgt-nigeria` | `/assets/js/lib/source-confidence.js`<br>`/assets/js/engines/ng-cgt.js`<br>`/assets/js/pages/ng-cgt-vip.js`<br>`data/tool-verification.json`<br>`data/source-registry.json` | `tests/e2e/swahili-financial-shard-b.spec.js` plus app oracle suite |
| `ng-cit` | `/tools/ng-cit` | `/sw/zana/kikokotoo-cit-nigeria` | `/assets/js/lib/source-confidence.js`<br>`/assets/js/engines/ng-cit.js`<br>`/assets/js/pages/ng-cit-vip.js`<br>`data/tool-verification.json`<br>`data/source-registry.json` | `tests/e2e/swahili-financial-shard-b.spec.js` plus app oracle suite |
| `payslip-generator` | `/tools/payslip-generator` | `/sw/zana/kizalishaji-payslip` | `/assets/js/lib/dark-mode.js`<br>`/assets/js/engines/payslip-draft.js`<br>`/assets/js/pages/payslip-draft-vip.js`<br>`/assets/js/lib/sw-accessibility.js` | `tests/e2e/swahili-financial-shard-b.spec.js` plus app oracle suite |
| `pension-proj` | `/tools/pension-proj` | `/sw/zana/makadirio-ya-pensheni` | `/engines/pension-projection-planner.js`<br>`/assets/js/lib/pdf-template.js`<br>`/assets/js/pages/pension-projection-sw.js` | `tests/e2e/swahili-financial-shard-b.spec.js` plus app oracle suite |
| `property-roi` | `/tools/property-roi` | `/sw/zana/faida-ya-uwekezaji-wa-nyumba` | `/assets/js/lib/pdf-template.js`<br>`/assets/js/engines/property-investment-analysis.js`<br>`/assets/js/pages/property-roi-vip.js`<br>`/assets/js/lib/sw-accessibility.js` | `tests/e2e/swahili-financial-shard-b.spec.js` plus app oracle suite |
| `property-transfer-cost` | `/tools/property-transfer-cost` | `/sw/zana/gharama-za-uhamisho-wa-mali` | `/assets/js/lib/pdf-template.js`<br>`/assets/js/engines/property-transfer-quote.js`<br>`/assets/js/pages/property-transfer-cost-vip.js`<br>`/assets/js/lib/sw-accessibility.js` | `tests/e2e/swahili-financial-shard-b.spec.js` plus app oracle suite |
| `rent-vs-buy` | `/tools/rent-vs-buy` | `/sw/zana/kukodi-dhidi-ya-kununua` | `/assets/js/lib/pdf-template.js`<br>`/assets/js/engines/rent-buy-scenario.js`<br>`/assets/js/pages/rent-vs-buy-vip.js`<br>`/assets/js/lib/sw-accessibility.js` | `tests/e2e/swahili-financial-shard-b.spec.js` plus app oracle suite |
| `retirement-planner` | `/tools/retirement-planner` | `/sw/zana/mpango-wa-kustaafu-mapema` | `/assets/js/lib/pdf-template.js`<br>`/assets/js/engines/retirement-scenario-planner.js`<br>`/assets/js/pages/retirement-planner-vip.js`<br>`/assets/js/lib/sw-accessibility.js` | `tests/e2e/swahili-financial-shard-b.spec.js` plus app oracle suite |
| `route-fares` | `/tools/route-fares` | `/sw/zana/nauli-za-ruti` | `/assets/js/lib/source-confidence.js`<br>`/assets/js/engines/route-fares.js`<br>`/assets/js/pages/route-fares-locales-vip.js`<br>`/assets/js/lib/sw-accessibility.js` | `tests/e2e/swahili-financial-shard-b.spec.js` plus app oracle suite |
| `salary-compare` | `/tools/salary-compare` | `/sw/zana/kilinganisha-mishahara` | `/assets/js/lib/pdf-template.js`<br>`/assets/js/engines/salary-offer-compare.js`<br>`/assets/js/pages/salary-compare-vip.js`<br>`/assets/js/lib/sw-accessibility.js` | `tests/e2e/swahili-financial-shard-b.spec.js` plus app oracle suite |
| `salary-intelligence` | `/tools/salary-intelligence` | `/sw/zana/daftari-la-ushahidi-wa-mishahara` | `/assets/js/lib/pdf-template.js`<br>`/assets/js/engines/salary-evidence-notebook.js`<br>`/assets/js/pages/salary-intelligence-vip.js` | `tests/e2e/swahili-financial-shard-b.spec.js` plus app oracle suite |
| `side-hustle-tax` | `/tools/side-hustle-tax` | `/sw/zana/mpango-wa-akiba-ya-kodi-ya-mapato-ya-ziada` | `/assets/js/lib/pdf-template.js`<br>`/assets/js/engines/side-income-tax-reserve.js`<br>`/assets/js/pages/side-income-tax-reserve-vip.js` | `tests/e2e/swahili-financial-shard-b.spec.js` plus app oracle suite |
| `so-paye` | `/somalia/so-paye` | `/sw/somalia/kikokotoo-kodi-mshahara` | `/assets/js/lib/dark-mode.js`<br>`/assets/js/lib/source-confidence.js`<br>`/assets/js/engines/so-paye.js`<br>`/assets/js/lib/pdf-template.js`<br>`/assets/js/pages/somalia-paye-vip.js`<br>`/assets/js/lib/sw-accessibility.js` | `tests/e2e/swahili-financial-shard-b.spec.js` plus app oracle suite |
| `ss-paye` | `/south-sudan/ss-paye` | `/sw/south-sudan/kikokotoo-kodi-mshahara` | `/assets/js/lib/dark-mode.js`<br>`/assets/js/lib/source-confidence.js`<br>`/assets/js/engines/ss-paye.js`<br>`/assets/js/lib/pdf-template.js`<br>`/assets/js/pages/south-sudan-paye-vip.js`<br>`/assets/js/lib/sw-accessibility.js` | `tests/e2e/swahili-financial-shard-b.spec.js` plus app oracle suite |
| `st-paye` | `/sao-tome/st-paye` | `/sw/sao-tome/kikokotoo-kodi-mshahara` | `/assets/js/lib/source-confidence.js`<br>`/assets/js/lib/dark-mode.js`<br>`/assets/js/engines/st-paye.js`<br>`/assets/js/lib/pdf-template.js`<br>`/assets/js/lib/sw-accessibility.js` | `tests/e2e/swahili-financial-shard-b.spec.js` plus app oracle suite |
| `staff-cost` | `/tools/staff-cost` | `/sw/zana/bajeti-ya-gharama-za-wafanyakazi` | `/assets/js/lib/pdf-template.js`<br>`/engines/staff-cost-planner.js`<br>`/assets/js/pages/staff-cost-sw.js` | `tests/e2e/swahili-financial-shard-b.spec.js` plus app oracle suite |
| `startup-valuation` | `/tools/startup-valuation` | `/sw/zana/thamani-ya-startup` | `/engines/startup-valuation-engine.js`<br>`/assets/js/pages/startup-valuation-vip.js`<br>`/assets/js/lib/sw-accessibility.js` | `tests/e2e/swahili-financial-shard-b.spec.js` plus app oracle suite |
| `student-loan` | `/tools/student-loan` | `/sw/zana/mpango-wa-malipo-ya-mkopo-wa-mwanafunzi` | `/assets/js/lib/pdf-template.js`<br>`/assets/js/engines/student-loan-plan.js`<br>`/assets/js/pages/student-loan-vip.js` | `tests/e2e/swahili-financial-shard-b.spec.js` plus app oracle suite |
| `tg-paye` | `/togo/tg-paye` | `/sw/togo/kikokotoo-kodi-mshahara` | `/assets/js/lib/dark-mode.js`<br>`/assets/js/lib/source-confidence.js`<br>`/assets/js/engines/tg-paye.js`<br>`/assets/js/lib/pdf-template.js`<br>`/assets/js/pages/togo-paye-vip.js`<br>`/assets/js/lib/sw-accessibility.js` | `tests/e2e/swahili-financial-shard-b.spec.js` plus app oracle suite |
| `transfer-pricing` | `/tools/transfer-pricing` | `/sw/zana/ulinganisho-wa-bei-za-uhamisho` | `/assets/js/engines/transfer-pricing-planner.js`<br>`/assets/js/pages/transfer-pricing-vip.js` | `tests/e2e/swahili-financial-shard-b.spec.js` plus app oracle suite |

## Blocked candidates

| ID | Current candidate | Exact blocker |
|---|---|---|
| `ly-paye` | `/sw/libya/kikokotoo-kodi-mshahara` | The existing PAYE page retains a legacy product boundary (lead-gated export, explicit English fallback, non-shared formula owner or raw-input share risk) and lacks a safe app-specific parity receipt. |
| `ma-paye` | `/sw/morocco/kikokotoo-kodi-mshahara` | The existing PAYE page retains a legacy product boundary (lead-gated export, explicit English fallback, non-shared formula owner or raw-input share risk) and lacks a safe app-specific parity receipt. |
| `mg-paye` | `/sw/madagascar/kikokotoo-kodi-mshahara` | The existing PAYE page retains a legacy product boundary (lead-gated export, explicit English fallback, non-shared formula owner or raw-input share risk) and lacks a safe app-specific parity receipt. |
| `mz-paye` | `/sw/mozambique/kikokotoo-kodi-mshahara` | The existing PAYE page retains a legacy product boundary (lead-gated export, explicit English fallback, non-shared formula owner or raw-input share risk) and lacks a safe app-specific parity receipt. |
| `na-paye` | `/sw/namibia/kikokotoo-kodi-mshahara` | The existing PAYE page retains a legacy product boundary (lead-gated export, explicit English fallback, non-shared formula owner or raw-input share risk) and lacks a safe app-specific parity receipt. |
| `ng-land-use` | `/` | No physical Swahili app route exists; formula, UI, SEO, artwork and export proof cannot be fabricated safely in this lane. |
| `ng-paye` | `/sw/nigeria/kikokotoo-kodi-mshahara` | The existing PAYE page retains a legacy product boundary (lead-gated export, explicit English fallback, non-shared formula owner or raw-input share risk) and lacks a safe app-specific parity receipt. |
| `ng-pension` | `/` | No physical Swahili app route exists; formula, UI, SEO, artwork and export proof cannot be fabricated safely in this lane. |
| `ng-wht` | `/` | No physical Swahili app route exists; formula, UI, SEO, artwork and export proof cannot be fabricated safely in this lane. |
| `paye-calculator` | `/sw/mshahara-na-kodi/paye` | The candidate is a PAYE directory hub, not a native equivalent of the English calculator app. |
| `pension-projection` | `/` | No physical Swahili app route exists; formula, UI, SEO, artwork and export proof cannot be fabricated safely in this lane. |
| `sars-efiling` | `/` | No physical Swahili app route exists; formula, UI, SEO, artwork and export proof cannot be fabricated safely in this lane. |
| `sd-paye` | `/sw/sudan/kikokotoo-kodi-mshahara` | The existing PAYE page retains a legacy product boundary (lead-gated export, explicit English fallback, non-shared formula owner or raw-input share risk) and lacks a safe app-specific parity receipt. |
| `sl-paye` | `/sw/sierra-leone/kikokotoo-kodi-mshahara` | The existing PAYE page retains a legacy product boundary (lead-gated export, explicit English fallback, non-shared formula owner or raw-input share risk) and lacks a safe app-specific parity receipt. |
| `tn-paye` | `/sw/tunisia/kikokotoo-kodi-mshahara` | The existing PAYE page retains a legacy product boundary (lead-gated export, explicit English fallback, non-shared formula owner or raw-input share risk) and lacks a safe app-specific parity receipt. |
| `za-cgt` | `/` | No physical Swahili app route exists; formula, UI, SEO, artwork and export proof cannot be fabricated safely in this lane. |
| `za-dividend-tax` | `/` | No physical Swahili app route exists; formula, UI, SEO, artwork and export proof cannot be fabricated safely in this lane. |
| `za-gepf` | `/` | No physical Swahili app route exists; formula, UI, SEO, artwork and export proof cannot be fabricated safely in this lane. |
| `za-paye` | `/sw/south-africa/kikokotoo-kodi-mshahara` | The existing PAYE page retains a legacy product boundary (lead-gated export, explicit English fallback, non-shared formula owner or raw-input share risk) and lacks a safe app-specific parity receipt. |
| `za-transfer-duty` | `/` | No physical Swahili app route exists; formula, UI, SEO, artwork and export proof cannot be fabricated safely in this lane. |
| `za-uif` | `/` | No physical Swahili app route exists; formula, UI, SEO, artwork and export proof cannot be fabricated safely in this lane. |

## Proof contract

- Synthetic inputs only. Shared DOM-free engines and existing app-specific oracle suites preserve English formula/data semantics.
- The focused Playwright matrix checks every accepted route at 320px and 375px, 200% text reflow, system light/dark, keyboard focus, canonical/OG identity, local resource failures, privacy and local-only advertised actions.
- Each accepted app points to an app-specific parser or export-payload suite. The current ng-cit family suite passed 9/9 after its privacy assertion separated consent-mode measurement beacons from first-party or raw-input writes; the historical mixed 20/31 selection remains recorded separately and is not represented as green.
- No coordinator acceptance ledger, inventory, AI route map, locale coverage output, sitemap, redirects, service-worker stamp, live service or other locale UI/copy is edited.
- Blocked high-stakes tax apps remain blocked rather than receiving invented formulas, rates, claims or evidence.

## Current lane command evidence

- Evidence generator check: 46 rows, 25 accepted candidates, 21 blocked, one missing artwork.
- PASS: current 12 focused Node subtests cover six ng-cit engine oracle cases, five shard derivation/static/source-owner tests and the source-verification panel contract.
- PASS: ng-cit English/Swahili/French/Hausa/Yoruba family regression 9/9, including exact statutory boundaries, TXT parsing, privacy, focus, theme and reflow.
- PASS: complete 36-test shard browser matrix on isolated port 43917, including ng-cit exact engine comparison, parsed TXT, clipboard, stale-result clearing, invalid focus, reset, privacy and every accepted route.
- PASS: direct language validation and 33,468 reciprocal hreflang relationships across 5,351 equivalence groups and 11,298 public pages. The broad `build:i18n:validate` wrapper separately reports three protected stale coverage artifacts, which were intentionally not regenerated.
- PASS: 138,262 internal links across 11,517 HTML files; registry audit retains two unrelated missing-page rows and adds no ng-cit defect.
- PASS: privacy/AI consent server check and 3/3 browser checks using the repository-installed Playwright runtime.
- MIXED: focused existing workflow/export suites plus the new Mauritania parser proof passed 20/31. Parser-level PDF/JSON/CSV/TXT proofs passed for the targeted export tests; 11 failures remain explicitly carried and no pass is claimed for those assertions.

## Changed product paths and decisions

- Responsive source styles: `assets/css/property-roi-vip.css`, `assets/css/property-transfer-cost-vip.css`, `assets/css/route-fares-vip.css`, `assets/css/somalia-paye-vip.css`, `assets/css/startup-valuation-vip.css`, and `assets/css/togo-paye-vip.css`.
- Targeted Swahili page fixes: `sw/sao-tome/kikokotoo-kodi-mshahara/index.html` (long-heading reflow) and `sw/zana/microfinance-riba-tambarare-dhidi-ya-salio/index.html` (engine enum values preserved while labels remain Kiswahili).
- Student-loan native parity: the new Swahili route uses `assets/js/engines/student-loan-plan.js` and the shared controller, requires user-entered sourced terms, and provides local copy/PDF/CSV/JSON without programme presets or network submission.
- Staff-cost native parity: the Swahili controller uses `engines/staff-cost-planner.js`, requires current user-supplied employer-obligation evidence, neutralizes spreadsheet-formula prefixes in CSV, and provides local copy/CSV/PDF without bundled statutory rates.
- Pension-proj native parity: the Swahili controller uses `engines/pension-projection-planner.js`, requires current scheme evidence and explicit assumption confirmation, and provides local copy/CSV/PDF without country rates, entitlements or forecasts. The distinct legacy `pension-projection` route remains blocked.
- Transfer-pricing native parity: the shared `transfer-pricing-planner.js` controller now has complete Swahili method, error, result and memo copy; the route requires a documented user range and provides local copy/TXT/JSON/print without a benchmark or compliance conclusion.
- Side-hustle-tax native parity: the shared `side-income-tax-reserve.js` engine and controller require a user-sourced reserve rate and recent evidence, then provide injection-safe CSV, JSON, copy and PDF without selecting a tax rate or deciding deductions.
- Salary-intelligence native parity: the private Swahili evidence notebook uses `assets/js/engines/salary-evidence-notebook.js`, requires five comparable recent user-entered rows, annualizes monthly evidence by 12, applies the existing NIST p(N+1) quartile interpolation and provides local injection-safe CSV, JSON import/reopen, PDF and copy. It contains no seeded market salary, representative benchmark, API, analytics or raw-input storage.
- Ng-cgt native parity: `/sw/zana/kikokotoo-cgt-nigeria/` delegates to `assets/js/engines/ng-cgt.js`, keeps the NTA 2025 scope confirmation and transaction exclusions visible, localizes the progressive rate label, clears stale results, focuses invalid inputs, resets locally and offers only copy plus a parsed local TXT summary. It makes no filing, assessment, classification or exemption decision.
- Ng-cit native parity: `/sw/zana/kikokotoo-cit-nigeria/` delegates to the unchanged DOM-free `assets/js/engines/ng-cit.js`, preserves separate total-profits and assessable-profits bases, requires explicit resident ordinary-company scope, flags but does not calculate section 57 review, clears stale results, focuses invalid inputs, resets locally and advertises only copy plus parsed local TXT.
- Ng-cit reciprocal metadata only: `tools/ng-cit/index.html`, `fr/tools/ng-impot-societes/index.html`, `ha/kayan-aiki/cit-najeriya/index.html` and `yo/awon-ise/cit-naijiria/index.html` add the one Swahili alternate; their visible UI/copy is unchanged.
- Mauritania source-owner repair: `assets/js/engines/mr-paye.js` replaces duplicated inline formula logic in `sw/mauritania/kikokotoo-kodi-mshahara/index.html`; `tests/engines/mr-paye-browser-parity.test.js` proves both CNSS states against the reviewed server engine through source review date 21 July 2026 and next review 31 October 2026.
- Formula/data/source decision: no formula, rate, threshold, jurisdiction data or authority source changed. Ng-cit preserves the existing NigeriaCit rules exactly and remains fail-closed outside its confirmed scope; ng-cgt preserves the existing NigeriaCgt rules exactly; the microfinance fix restores the existing shared engine contract (`annual`, `monthly`, `period`); Mauritania preserves monthly ITS, CNSS, MRU 6,000 allowance, MRU 10 statutory round-down and employer charges.
- Browser matrix: system Chrome, one worker, isolated ports 43917 and 43918; synthetic fixtures only; 320/375, dark/light and 200% text reflow covered.
- Privacy/AI: no raw input body was observed leaving the browser; empty-body analytics page-view beacons are separated from sensitive payload checks. `test:privacy-ai-consent` passed 3/3 browser tests plus its server test.
- Official-source recheck on 8 August 2026: the NIPC-published Nigeria Tax Act 2025 still supports the small-company definition, company rates, development levy and section 57 review trigger used by the unchanged NigeriaCit engine; June 2026 Federal Ministry of Finance guidance still sets the NTA boundary at 1 January 2026. No engine parameter changed.
- Official-source recheck on 8 August 2026: the NIPC-published Nigeria Tax Act 2025 still contains the Nigerian-share threshold and same-year reinvestment rules used by the existing engine, and June 2026 Federal Ministry of Finance guidance still sets the NTA boundary at 1 January 2026. No engine parameter changed.
- Official-source recheck on 8 August 2026: the Mauritania DGI obligations page still states monthly ITS rates of 15%, 25% and 40%; the official CNSS declaration form still states 13% employer CNSS, 1% worker CNSS and 2% occupational medicine. No cap or formula was changed, and the reviewed 21 July contract retains its 31 October review boundary.
- Carried baseline debt: the legacy `tests/engines/lr-paye.test.js` source-title assertion expects two entries while the existing central formula registry contains five; its product fixtures run before that assertion. Registry audit also retains two unrelated missing-page rows. `npm run lint` now passes all 49 checked JavaScript files.

## Artwork

Missing artwork: `sars-efiling`.
