# Free demand cohort acceptance candidate — 9 September 2026

Candidate, not a production or statutory certification. Owner: core free catalogue session `01a086a8-0a2a-7c41-b91d-dd9eaacb732a`. Worktree `C:/Users/Oza/.codex/worktrees/215b/afrotools`, branch `codex/free-cohort-acceptance`. Verified starting HEAD and fetched origin/main: `bfee7e433282eb5ba786a8f3af241d109750166f`, identical to coordinator assignment. Coordinator subsequently reported post-dashboard main `edb36be7b28f7524d7ae9fdddaa8fda1440d4887`; this branch was not rebased, merged or deployed.

Tested product/test tree: `6078e565b5d77d52940699918ce51879b30ff1eb` (final browser run completed immediately before committing the identical tree). Commits, in order:

- `c13ac702`: Ethiopia water explicit user rate and charges, no invented surcharge, TXT estimate.
- `a6212bfc`: Ethiopia electricity custom ETB mode, wrapped retired-entry link and accurate visible retirement wording.
- `6078e565`: Nigeria saved-mode contract, accessible invalid salary feedback, stale output removal, mobile guide layout; full cohort browser tests.

## Exactly ten entries and acceptance matrix

Nine entries come from the dated planning pack `live-baseline.json` latest/prior 28-day Google click rows. The tenth is **coordinator-selected Nigeria PAYE representative coverage**, not a claimed highest-demand salary winner. AFCON was deliberately excluded by assignment. Downstream calculator pages are tested as parts of these journeys, not counted as additional cohort entries.

All ten entry routes returned local HTTP 200 and fit at **320×844 and 390×844**. Action tests ran at **390×844**. Source freshness acceptance is separate from mechanical acceptance.

| # | Exact entry/canonical and demand rationale | Synthetic input and expected result | Completion proof | Limits / disposition |
|---|---|---|---|---|
| 1 | `/tools/amount-words-gh/` — 197/195 clicks | 12,500.75 → Ghana Cedis Twelve Thousand Five Hundred and Pesewas Seventy-Five Only; hand-checked digits/subunits | Keyboard-triggered real clipboard; negative/empty handling | Mechanical pass; draft wording, issuer format still controls. No save/download offered by core converter. |
| 2 | `/tools/naira-to-words/` — 60/119 | 12,500.75 → Twelve Thousand Five Hundred Naira and Seventy-Five Kobo Only | Keyboard-triggered real clipboard; negative/empty handling | Mechanical pass; no account/export gate added. |
| 3 | `/tools/lobola-calculator/` — 102/131 | Zimbabwe custom inputs: 6 cattle × $500 + $500 custom family item + $400 visible preset tokens + $300 gifts + $200 ceremony = $4,400 | Save on device, reload storage, gift-list “Use saved Zimbabwe plan” | Arithmetic and handoff pass; preset amounts are planning inputs, not independently verified family obligations or cultural authority. No claim of valuing a person. |
| 4 | `/tools/market-days/` — 39/23 | 2026-01-05 → Orie; Emene filter; trip brief | Copied brief via real clipboard; engine date/timezone/filter checks | Cycle arithmetic passes against declared Jan 1 Orie anchor. Independent current calendar rendering/market operating days remain an external cultural/source review gate; opening the cited calendar did not independently expose its date grid to the web reader. |
| 5 | `/tools/electricity-tariff/ethiopia/` — 60/35 | Retired entry → `/tools/electricity-tariff/?country=ET`; 1,000 ETB ÷ user rate5 =200 kWh | Link navigation, ETB selected, custom source label, invalid0 rate rejected | Mechanical custom-mode pass. No maintained Ethiopia provider/class tariff certified. Entry remains 200, self-canonical and noindex; **not an HTTP redirect**. Main calculator canonical is `/tools/electricity-tariff/`. No save/export offered by its core interface. |
| 6 | `/tools/water-bill/ethiopia/` — 49/36 | 15 m³ × user12.50 ETB + user7.25 ETB =194.75; 15,000L/30/4=125 L/person/day | Missing/negative inputs rejected, keyboard calculate, TXT downloaded and reopened; edited inputs invalidate prior output | Corrected custom flat-rate planning pass. Former Br3 default, rounded8% charge and exact/official/WHO claims withdrawn for ET. No automatic provider, tier, sewerage, tax or arrears schedule certified. Old shared dashboard/PDF helper replaced on this route by local TXT estimate; no persistence promise. |
| 7 | `/blog/construction-material-prices-nigeria/` — 58/76 | Guide → `/tools/building-materials/`; (100×10,000+25,000)×1.10 =NGN1,127,500 | Actual quote worksheet completes | Guide is already honest about absent current retail prices. No invented guide export or supplier quotation. Reviewed local quote dataset remains absent. |
| 8 | `/blog/ghana-cedi-words/` — 36/20 | Guide → Ghana converter; 500,000 → five hundred thousand | Working converter CTA | Useful guide journey pass; no invented guide export. |
| 9 | `/fr/blog/frais-orange-money-guide-2026/` — 34/55 | Cameroon example10,000×1%+4=104 FCFA; two entered same-market XAF quotes104/150 differ46 | Guide → French local comparison; JSON downloaded and parsed; currency mismatch no longer shows comparable46 XAF | Cameroon formula matches provider page read September9. Other country tariffs/native editorial review not freshly certified. No automatic Orange tariff calculation claimed. |
| 10 | `/nigeria/ng-salary-tax` — representative chosen by coordinator | NTA:3m annual, deductions off →330k tax,222,500 net/mo; 1m rent→200k relief,300k tax,225k net/mo | Saved inputs/reloaded result/PDF text agree; valid→invalid→valid; both PITA and NTA round-trip monthly input, net-to-gross mode, annual output period | **Partial statutory acceptance only.** Basic NTA oracle passes; the home-loan cap discrepancy is corrected in the 2026-09-10 follow-up below. Other deduction applicability remains outside this review. Historical incorrectly recorded scenarios are not migrated. |

## Necessary fixes and boundaries

Ethiopia water source is `scripts/templates/ethiopia-water-bill.html`, selected by `scripts/generate-energy-x15.js`; the targeted generator preserves unrelated markets. `engines/src/water-bill-engine.js` branches only for ET. Eight Nigeria residential/commercial regression comparisons against the recorded base return byte-equivalent JSON. The generated `engines/water-bill-engine.js` comes from the existing minifier. Custom inputs remain browser-local and are not stored by this route. TXT includes the entered formula and limitations.

Electricity's existing controller had no ET country or ETB currency despite the retired entry promising custom-rate calculation. Added only that unsupported/custom selection; no tariff record, registry entry or country launch. `generate-energy-x54.js --ethiopia-electricity-link-only` regenerates the narrow retired link/notice fragments while preserving post-processed metadata. The retired CTA wraps instead of overflowing72px at320px. No canonical, robots or redirect metadata changed.

Nigeria's top-level `let` mode variables were invisible to the existing save adapter's `window.REGIME`, `window.PERIOD`, `window.SALARY_PERIOD`, `window.CALC_MODE` reads. The adapter therefore captured fallback inputs while retaining a valid result snapshot. Route-owned `var` declarations now expose the intended existing contract. Tests assert serialized inputs, restored state, recalculation and parsed PDF for both regimes; this is persistence verification, not independent PITA-law verification. The reverse solver already tolerates less than1 naira annual difference; the test checks that tolerance rather than imposing an exact reverse result.

Historical snapshots may contain contradictory recorded inputs and results. No automatic reinterpretation or migration was performed. Users can explicitly choose the intended regime/mode/period, recalculate and save a new named scenario. The saved list remains inside the initially hidden results panel; after reload, a calculation is needed to reveal it before loading an existing scenario. This discoverability limitation remains.

Invalid salary previously only changed a placeholder/border and left prior output active. It now announces an error, marks the input invalid, clears `RESULT`/`window.RESULT`, and hides the result/export/save panel. Valid recovery restores it. The Nigeria guide grid now permits children to shrink at320px. No shared auth, dashboard, tax formulas, analytics names or save library changed.

## Dated sources and unresolved gates

Read-only source work on 2026-09-09:

- [National Assembly Nigeria Tax Act 2025](https://nass.gov.ng/documents/download/11249), Gazette26June2025; NTA regime effective1January2026. Section 30(2)(a)(iv), PDF page32, allows qualifying owner-occupied development loan interest; section30(2)(a)(vi) explicitly caps **rent relief** at500k. Fourth Schedule, PDF page156, supports the0% first800k /15% next2.2m oracle. This is a narrow provisions check, not tax-professional sign-off.
- Historical finding (superseded by the 2026-09-10 correction below): `nigeria/ng-salary-tax.html:1377` caps NTA home-loan interest500k; legacy PITA code at1315 does likewise; `assets/js/engines/ng-paye.js:1` contains both capped implementations. 3m gross,600k qualifying interest, no other deductions: existing shared NTA engine admits500k, taxable2.5m, tax255k; uncapped reading would give taxable2.4m/tax 240k, a15k difference. Official-site search did not locate an alternative500k interest cap; [Imo revenue Form A guide](https://iirs.im.gov.ng/document/docs/forms/form%20a.pdf) surfaced documentary requirements, not proof of such a cap. Eligibility, documentary claims and any supplementary/legacy instrument require authoritative review. No cap correction was shipped.
- [Orange Cameroon tariff](https://orangemoney.orange.cm/fr/tarification-orange-money.html) directly supports54 FCFA /1%+4 /4,004 range structure and the104 example. [Orange Senegal source](https://www.orange.sn/assistance/tutoriels/lancement-du-nouveau-modele-orange-money-0) could not be opened by the web reader; its current status is unverified. Mali/Côte d'Ivoire were not re-certified. Existing guide dates were not restamped.
- [EEU English tariff entry](https://eeu.gov.et/electricity-tariff/detail/84) and [EEU schedule](https://www.eeu.gov.et/electricity-tariff/download/254) surfaced current multi-period references. Effective-quarter, provider/class and full billing treatment were not independently accepted. No automatic Ethiopia electricity schedule added.
- [AAWSA tariff PDF](https://www.aajs.gov.et/uploads/Publication/149-2015-2024-09-25-66f40296e8daa.pdf) surfaced but opening failed. No national water rate certified from this. User-entered flat-rate worksheet is explicitly conditional on suitability.
- [BUA manufacturer distributor directory](https://www.buacement.com/distributors) opened; it is a useful supplier-verification route, not current retail quote evidence. [Mkomigbo calendar](https://mkomigbo.com/igbo-calendar/?y=2026) opened as an app shell; cycle anchor remains separately reviewable.

## Commands and results

All on September9, local Windows/Chromium, Node24.12.0. No provider/API mocks were used in cohort action tests; service workers blocked per existing Playwright configuration. Optional analytics consent fixture was declined. Only synthetic inputs.

- `npm ci` — pass,104 packages,0 reported vulnerabilities.
- `npm run automation:preflight` —12 pass,2 warnings,0 fail; missing email provider/Netlify blob configuration. No claim of those service layers.
- `node scripts/generate-energy-x15.js --ethiopia-water-only` — pass; source/output equality test passes.
- `node scripts/minify.js --only=water-bill-engine` — pass; only engine output retained.
- `node scripts/generate-energy-x54.js --ethiopia-electricity-link-only` — pass; no other country output touched.
- `node tests/ethiopia-water-custom.test.js` —4/4 pass, including unchanged-market comparisons.
- `node tests/amount-words-input.test.js` —4/4 pass.
- `node tests/market-days-engine.test.js` —12 assertions pass; anchor-dependent, not an independent calendar oracle.
- `node --test tests/french-orange-money-guide.test.js` —4/4 pass; static content contract.
- `node tests/electricity-cost-engine.test.js` —pass, existing flat/tier/charge/freshness/provider tests.
- `$env:PORT='4191'; $env:AFROTOOLS_TEST_DISABLE_ANALYTICS='1'; npx playwright test tests/e2e/free-demand-cohort.spec.js --project=chromium --workers=1 --output=artifacts/free-cohort/final-results` —**13/13 pass,1.2min**. No failing checks hidden by skips. Earlier selector/focus assumptions were corrected; observed source defects were reproduced and repaired.
- `npm run check-links` —pass,142,093 internal links across11,767 HTML files.
- `node -c scripts/generate-energy-x15.js`, `node -c scripts/generate-energy-x54.js`, `node -c assets/js/pages/electricity-cost-prepaid-units.js` —pass; two executable Nigeria inline scripts also compile via `vm.Script`.
- `git diff --check` —pass; deletion-only diff empty.

Broad deploy build/dist/security checks were **not run**: this is an isolated candidate with coordinator-owned integration/release. No production deployment, Supabase mutation, billing operation, account save, email or external contact occurred.

## Local versus live and zoom observation

Local action proof above is not deployed proof. One direct live check: `https://afrotools.com/tools/electricity-tariff/ethiopia/` returned200, final URL unchanged, canonical self; it corroborates the retired landing contract only, not the candidate fix. Other ten-route production journeys were not re-tested.

Supplemental local initial-page probe covers the ten entries plus electricity destination: no page exceptions or HTTP>=400 responses observed. This is not a whole-session console/network audit of every export or third-party provider.

CSS `zoom:2` at1280×900 gave scrollWidth1365/clientWidth1280 on representative water page; screenshot shows desktop shared navigation remains expanded. Declined storage matches the current `afrotools_cookie_consent='declined'` contract and the banner is absent in the controlled probe. Shadow navbar `.right`/`.btn-login` right edge1365.22. Equivalent unzoomed640×450 gives640/640. Thus this is an unresolved **CSS-zoom-specific shared accessibility observation**, not a native-browser-zoom failure claim or a demonstrated consent defect. Earlier broad probe also saw99px on French Orange but its extra cause was not isolated; no French layout defect is certified from that. Native browser zoom, assistive technology and full WCAG review remain untested. Normal320/390 reflow passed for all ten. No shared consent/navbar changes made.

Local artifacts (untracked/private, available in this worktree): `artifacts/free-cohort/final-browser.log`, `browser-evidence.json`, `zoom-observation.json`, `water-css-zoom200.png`, `water-390.png`, `electricity-390.png`. Earlier failure traces remain separate from final passing results.

## Source/generated lists and integration

Source: `engines/src/water-bill-engine.js`; `scripts/generate-energy-x15.js`; `scripts/templates/ethiopia-water-bill.html`; `assets/js/pages/electricity-cost-prepaid-units.js`; `tools/electricity-tariff/index.html`; `scripts/generate-energy-x54.js`; `nigeria/ng-salary-tax.html`.

Generated: `engines/water-bill-engine.js`; `tools/water-bill/ethiopia/index.html`; narrow link/notice fragment in `tools/electricity-tariff/ethiopia/index.html`.

Tests: `tests/ethiopia-water-custom.test.js`; `tests/e2e/free-demand-cohort.spec.js`. Evidence: this report. No source date, registry, locale expansion, sitemap or shared auth/dashboard files changed. Internal electricity CTA now supplies `country=ET`; route and canonical are unchanged. Rollback: revert the corresponding scoped commit; no database rollback required. Coordinator must perform combined integration checks and any release/deployed verification. Material source gates above remain open even if integration passes.

## Integration follow-up — protected formula registry

Coordinator's broad test run exposed stale digests for the changed water engine and, once that was resolved, the Nigeria PAYE route. Both reproduced in this worktree. The catalogue registry remains unchanged; the **calculation-quality formula registry** now registers these two reviewed implementation changes, using separate review records under `data/calculation-quality/reviews/` and the existing owner command `node scripts/build-calculation-quality.js --write --accept-formula-change --review-file=<record> --only-formula-ids=<id> --as-of=2026-09-09`.

Water review record: `ethiopia-water-custom-rate-2026-09-09.json`, formula `formula-engines-water-bill-engine`; digest `73b1b2f0569408442a980661cc6a6f9a3365112742e00a6fd47621cc93626226` → `db7fbcc2d3ed985225ef612ef4d29f700e7cdaadbd541137cef6da5bf06abf16`. Commit `b00ffeab`.

Nigeria review record: `nigeria-paye-save-mode-recovery-2026-09-09.json`, formula `route-ng-paye`; digest `544255ae772bc7add961d75f1171ff1ea66d30e1720e4e3cdc809ae5a90711a3` → `cb6b308c506788afd8fd8c38a0e808519a03ed7aa1c7b80786c0060e6c7e4b18`. No tax-formula or historical-save migration acceptance implied.

Only artifact digests, digest-derived version fields and parameter digest references changed in those two records. Full before/after comparison confirms all golden expectations, fixture-delta records, other formula records and source-verification dates unchanged. All current formula digests match. `scripts/lib/calculation-quality.js` and the enforcement tests remain unchanged. On September9, `node tests/calculation-quality.test.js` (all16 groups), `node tests/water-bill-night-flow.test.js`, `node tests/ethiopia-water-custom.test.js` (4/4 including unchanged-country cases), and `git diff --check` pass. No runtime change in this follow-up, so browser tests were not repeated. Broad integration/build/deployed checks remain coordinator-owned.


## NTA interest correction — 2026-09-10

- Independently read the [official Nigeria Tax Act 2025 gazette](https://nass.gov.ng/documents/download/11249), PDF pages 31–32 (printed A416–A417). Section 30(2)(a)(iv) allows interest paid for developing an owner-occupied home without a fixed monetary ceiling in that provision. The 20% / NGN 500,000 ceiling belongs to rent relief in 30(2)(a)(vi); sections 31–32 govern written claims and evidence.
- Corrected only NTA interest treatment in the inline Nigeria salary route and active shared browser engine. The browser engine serves AfroAnswer and payroll previews. Restored a readable owner at assets/js/engines/src/ng-paye.js with an explicit scripts/minify.js mapping to the existing served path. Server netlify/functions/_engines/ng-paye.js already uses uncapped validated mortgageInterest and remains untouched. PITA calculation logic and the rent-relief ceiling remain unchanged.
- Route field guidance and PDF identify eligible development-loan interest, exclude principal and rental-property interest, and explain claims/evidence. Invalid interest clears the result, announces an error, and supports recovery. Turning off this optional deduction excludes a non-qualifying amount; the calculator does not adjudicate eligibility.
- Independent 0 / 400k / 500k / 600k / 2.2m interest fixtures compare route, readable/built shared browser, and server taxable income/tax. At 3m gross and 600k eligible interest, taxable income is 2.4m and annual tax 240k. Route/shared disposable-net presentation remains 2.16m after interest and tax; server payroll-net remains 2.76m because interest is a relief rather than a payroll withholding there. No broader presentation change is claimed.
- PASS: node --test tests/nigeria-nta-interest.test.js (8 tests); node tests/calculation-quality.test.js (16 groups); focused Chromium run of Nigeria cohort plus tests/e2e/nigeria-nta-interest.spec.js (4/4). Browser checks include 390px overflow, saved 600k/reload/recalculation, reopened PDF values and qualification text, malformed/negative rejection and valid recovery, both legacy and NTA non-default saved modes.
- Scoped owner refresh records only paye-browser-ng and route-ng-paye in data/calculation-quality/reviews/nigeria-nta-interest-2026-09-10.json. Only their digest/version/parameter-digest fields changed. All golden-fixture expectations, fixture-delta registry, inventory, other formula records, and tax-source dates are byte/value unchanged. These are local candidate checks; combined build, security, dist, CI and production checks belong to the coordinator.
