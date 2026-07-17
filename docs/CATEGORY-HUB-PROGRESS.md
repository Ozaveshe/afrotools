<!--
SHARED PROGRESS TRACKER — edit this file to claim and report category-hub work.
This is the single source of truth for the category-hub elevation program.
Any session (interactive or Codex) MUST update its row before starting and after deploying.
-->

# Category Hub Elevation — Shared Progress Tracker

**Purpose:** get all 32 category hubs (and their sub-apps) to the same senior-engineer bar:
correct calculators, honest source discipline, clean workflow, non-slop CSS, real SEO/GEO, deployed and verified live.

**Reference implementation:** the **Energy** hub (July 2026). It has the full pattern —
`data/energy/official-sources.json`, `scripts/update-energy-source-ledger.js`,
`.claude/rules/energy.md`, FAQPage schema, and a live-verified calculator audit.
Copy that shape. See also `.claude/rules/{government,telecom,transport}.md`.

## Coordination protocol (read before starting)

1. **Claim your category** — set `Owner` to your session id/name and `Status` to `🔵 in-progress` in the table below, commit that one-line change, and push, *before* doing the work. This prevents two sessions colliding on the same hub.
2. **Never bulk-merge branches.** 176+ commits are stranded on ~192 stale local branches; merging them reverts production. Ship your *own* work only.
3. **Deploy discipline:** commit only the files you changed (never `git commit -a` — a Codex session sweeps with `git add -A`). Fast-forward `main`, `git push origin main`. Production build takes **~18 minutes**; then verify on `https://afrotools.com/<hub>/` before marking done.
4. **Never bump a data `lastUpdated` stamp without actually re-reading the official source.** A changed hash is not a rate change (see the government rule).
5. **Update your row** with what shipped + the deploy commit when done.

## Status legend

- ✅ **complete** — ledger (if data-perishable) + rule file + calculator audit + FAQPage + deployed
- 🟡 **partial** — some of the above; see notes
- 🔵 **in-progress** — a session is actively working it (see Owner)
- ⬜ **pending** — untouched by the program

## Tracker

| # | Category | Hub | Status | Ledger | Rule | FAQPage | Owner | Notes / last pass |
|---|----------|-----|--------|--------|------|---------|-------|-------------------|
| 1 | Energy & Utilities | `/energy/` | ✅ complete | ✅ | ✅ | ✅ | — | 2026-07-17: ledger + validator + rule + FAQPage; solar-vs-generator math live-verified |
| 2 | Government | `/government/` | ✅ complete | ✅ | ✅ | ⬜ | — | source ledger + `government:sources`; FAQPage not yet added |
| 3 | Telecom & Mobile | `/telecom/` | ✅ complete | ✅ | ✅ | ⬜ | — | ledger added 2026-07-16; roaming/whatsapp zero-bugs fixed |
| 4 | Transport | `/transport/` | ✅ complete | ✅ | ✅ | ⬜ | — | source ledger + `transport:sources` |
| 5 | Climate & Weather | `/climate/` | 🟡 partial | ⬜ | ⬜ | ? | — | calculators audited (flood/drought saturation bugs fixed); needs ledger + rule + FAQPage |
| 6 | Salary & Income Tax | `/salary-tax/` | 🔵 in-progress | ⬜ | ⬜ | ? | opus-salary-tax-2026-07-17 | HIGH stakes: PAYE bands change per finance act; verify against gazetted Act |
| 7 | HR & Payroll | `/hr-payroll/` | ✅ complete | ✅ | ✅ | ✅ | opus-hr-payroll-2026-07-17 | 2026-07-17: ledger (`data/hr-payroll/official-sources.json`, 14/54 official bodies bound + 40 body gaps + 3 unsourced-claim classes) + `scripts/update-hr-payroll-source-ledger.js` reading flagship `EMPLOYER_COST_RULES` + `hr-payroll:sources[:check]` + `.claude/rules/hr-payroll.md`. **P0 ceiling fix:** Kenya NSSF caps were stale (Tier I 7,000 / Tier II 36,000 = Feb-2025). Verified & updated to **Feb-2026: Tier I 9,000 (max 540/side), Tier II 108,000 (max 5,940/side)** in both `employer-cost-data.js` and `social-security-rates.js`; recorded in ledger `verifiedCeilings`. Flagship employee-cost live-verified (KES 120k → 128,280 total, 540/5,940/1,800). Zero-bug **absent** — engines error/null on unknown country, social-security dropdown = 34/34 data keys. Hub FAQPage added (4 Q&A, verbatim). **Deep per-tool audit (all 14 sub-apps driven):** fixed maternity engine 100%→0 pay bug (`"100%".indexOf("0%")` zeroed pay for ~40 countries); severance/gratuity no-formula countries now show a label not "0" + added Ethiopia `daysBase` formula + ZW/LY/ER statutory minimums; retrenchment propagates severance-not-computable; domestic-worker filled 4 empty pages (AO/CM/ET/TN); national-pension KE cap 2,160→6,480; verified EG social-insurance cap 12,600→**16,700** (Jan-2026) + ZA UIF R17,712 confirmed current (ledger verifiedCeilings now KE/EG/ZA). overtime/minimum-wage/leave/ke-nssf/ng-pension/payslip verified correct. |
| 8 | VAT & Business Tax | `/vat-business-tax/` | ✅ complete | ✅ | ✅ | ✅ | opus-vat-business-tax-2026-07-17 | 2026-07-17: ledger (15/54 authorities bound, 36 regulator gaps + 3 no-VAT) + validator reading flagship `const DB` + `vat-business-tax:sources[:check]` + rule file. Flagship VAT math live-verified (NG add 250k→268,750, GH extract 120→100+20, KE add, SO genuine 0%). Zero-bug **absent** — dropdown built from complete 54-market DB; 0% for SO/ER/LY is genuine, not missing data. Hub FAQPage added (6 Q&A, verbatim). api-vat.js stale 2024 stamps recorded as ledger gap. Shipped via isolated worktree after shared-tree collision + a bad no-checkout commit truncated main (repaired by coordinator 446e6ff). |
| 9 | Fintech | `/fintech/` | 🟡 partial | ✅ | ✅ | ✅ | opus-fintech-2026-07-17 | 2026-07-17: ledger+validator (`fintech:sources`), `.claude/rules/fintech.md`, hub FAQPage (matches JS-rendered neutral FAQ), removed monogram-override slop → SVG icons. Audited all 32 tools: `\|\|0` bug class ABSENT. Wired remittance-compare to live shared FX (`/api/forex?base=USD`, cross-rate dest/send, snapshot fallback) — math live-verified (LemFi (1000−2)×1365.86 = ₦1,363,125 ✓). Shipped via isolated worktree after shared-tree collision orphaned first attempt. Deploy `fc6f41a` — **verified live** (prod: ledger JSON 200, hub FAQPage present, monogram slop gone, loadLiveFx live, /api/forex 200 fresh). NOTE: only 2/32 tools driven live + math-recomputed; other 30 audited for zero-bug class only — amortization/APR/T-bill math beyond flagships still unaudited. |
| 10 | Trade & Customs | `/trade/` | 🔵 in-progress | ⬜ | ⬜ | ? | opus-trade-customs-2026-07-17 | HIGH stakes: import duty/tariff/AfCFTA; `data/trade/` exists |
| 11 | Mining & Commodities | `/mining/` | ✅ complete | ✅ | ✅ | ✅ | opus-mining-2026-07-17 | 2026-07-17: hub was a facade (10 dead self-links, 0 tools) → **7 live tools**: mining-royalty (18 jurisdictions), mining-license-fee (8), diamond-valuation, oil-well-production, oil-gas-revenue, artisanal-mining-income + commodity ref. All math hand-verified in-browser. Ledger + validator + rule + `npm run test:mining` (FAQ↔JSON-LD parity + hub-honesty invariants). **Rate review: 8 of 12 defaults were stale** (NG gold 3%→15%, GH gold→sliding 5-12%, KE all 4 cut, ZW Pt→7%, ZM cobalt→8%, ML/BF→sliding); gaps 11→5. Deploys cee469c, 06df2f5, +this. **Remaining (deliberate, see ledger `gaps.unsourcedClaims`):** 3 Planned tools not built because the data cannot yet be modelled honestly — export duty (most markets have none/suspended/pending/banned; must not collapse 'none' vs 'unknown' to 0), environmental bond (no jurisdiction publishes a rate — bonds are closure-cost-sized; must force user input), petroleum pricing (perishable pump prices; overlaps /energy/). |
| 12 | Insurance | `/insurance/` | ✅ complete | ✅ | ✅ | ✅ | opus-insurance-2026-07-17 | 2026-07-17: ledger (19/54 regulators bound, 35 gaps) + validator + `insurance:sources[:check]` + `.claude/rules/insurance.md`. Fixed the premium=0 bug class (force user input, block calc) across car/workers-comp/professional-indemnity/marine/fire/business/life engines; fixed health-contribution ₦0 for split-rate markets (NG/EG/MA) by handling {employee,employer}. Car third-party now statutory (NG NAICOM ₦15,000, not discounted ₦12,825) + "Not applicable" where no priced product (ZA RAF). Hub FAQPage (6 Q&A verbatim) + restored SVG icons (dropped monogram override). Math live-verified (NG comp ₦128,250–₦299,250, excess ₦50,000). Shipped via git-plumbing commit on origin/main (shared-tree collision). **Deployed + live-verified on prod 2026-07-17**: aadc3b7 (ledger/validator/FAQ/rule/SVG-icons) + 1d5101f (engine fixes in engines/src — engines/*.js are minified from src by minify.js, so an artifact-only commit gets overwritten by the build). Prod checks: blank inputs blocked on all 8 calculators, NG car TP statutory ₦15,000, ZA TP "Not applicable", health NG ₦4,375/₦8,125, ledger JSON 200, hub FAQPage present, monogram override gone. **2nd pass**: fixed motor-third-party fabricating a premium for South Africa (min/max both 0 → now "Not applicable"; NG statutory ₦15,000 preserved); fixed funeral-insurance inverted premium range (min>max — divided min by coverMin, max by coverMax; now scales both by mid-cover so min≤max, e.g. ZA R46–R200). Math independently recomputed for workers-comp/fire/PI/life/marine/business (all consistent). claim-tracker + insurance-fraud-checker (InsuranceFraudEngine) functional. |
| 13 | Mortgage & Property | `/mortgage-property/` | ✅ complete | ✅ | ✅ | ✅ | opus-mortgage-property-2026-07-17 | 2026-07-17: ledger+validator+rule+FAQPage(6Q) **LIVE**. Audit: no zero-bugs (all 28 selectors backed by data). Fixed stamp-duty ZA→SARS 1-Apr-2025 scale (live-verified R2M=R33,786); dev-feasibility ÷0; property-cgt CI/UG exemption honesty; offplan-vs-ready symmetric appreciation; home-loan-eligibility country-aware DSR/deposit. **Deploy was blocked by a prohibited public-claim phrase** ("all calculations run in your browser") failing build:public-claims→build:deploy; fixed in 15f3a31. Deploys: 4919634, 15f3a31, c348862 |
| 14 | Personal Finance | `/personal-finance/` | ✅ complete | n/a | ⬜ | ✅ | opus-coordinator-2026-07-17 | 2026-07-17: FAQ + FAQPage (5 Q&A, verbatim) **live-verified** on prod, deploy `1bf1b00`. Flagship math audited: 50-30-20-budget (`income*0.5/0.3/0.2`, `income<=0` guard, `pct()` guards `total>0`) and security-emergency-fund (`expenses<=0` guard, 3/5/8-mo tiers) both correct; `parseFloat(input)||0` coalesces empty inputs only (not the data-lookup zero-bug). Hub CSS token-clean; tools currency-neutral so no ledger/rule needed. |
| 15 | Business ROI | `/business-roi/` | ⬜ pending | ⬜ | ⬜ | ? | — | break-even/cash-flow/ROI math |
| 16 | Diaspora | `/diaspora/` | ⬜ pending | ⬜ | ⬜ | ? | — | remittance FX + fee perishability |
| 17 | Agriculture | `/agriculture/` | ⬜ pending | ⬜ | ⬜ | ? | — | agronomic formulas + input prices |
| 18 | Education | `/education/` | ⬜ pending | ⬜ | ⬜ | ? | — | `data/scholarships/official-sources.json` exists; deadlines/exam dates perishable |
| 19 | Health | `/health/` | ⬜ pending | ⬜ | ⬜ | ? | — | formula accuracy + unit handling; medical disclaimers |
| 20 | Religious & Cultural | `/religious-cultural/` | ⬜ pending | ⬜ | ⬜ | ? | — | HIGH sensitivity: zakat nisab, faraid inheritance shares must be exact |
| 21 | Travel & Tourism | `/travel/` | ⬜ pending | ⬜ | ⬜ | ? | — | visa fees + travel costs perishable |
| 22 | Career | `/career/` | ⬜ pending | ⬜ | ⬜ | ? | — | CV/cover-letter/salary workflow + privacy |
| 23 | Small Business | `/small-business/` | ⬜ pending | ⬜ | ⬜ | ? | — | invoice/receipt/business-name workflow |
| 24 | Document & PDF | `/document-pdf/` | ⬜ pending | ⬜ | ⬜ | ? | — | client-side utilities; privacy (local processing) + SEO |
| 25 | Developer Tools | `/developer-tools/` | ⬜ pending | ⬜ | ⬜ | ? | — | encoder/hash/uuid correctness; client-side |
| 26 | Image & Design | `/image-design/` | ⬜ pending | ⬜ | ⬜ | ? | — | favicon/palette/watermark; performance + SEO |
| 27 | Engineering | `/engineering/` | ⬜ pending | ⬜ | ⬜ | ? | — | BOQ/structural formula + unit correctness |
| 28 | Creative | `/creative/` | ⬜ pending | ⬜ | ⬜ | ? | — | client-side creative tools; functionality + SEO |
| 29 | Security | `/security/` | ⬜ pending | ⬜ | ⬜ | ? | — | password/phishing-quiz; correctness + privacy |
| 30 | Language | `/language/` | ⬜ pending | ⬜ | ⬜ | ? | — | translation/localization; i18n correctness |
| 31 | Sports | `/sports/` | ⬜ pending | ⬜ | ⬜ | ? | — | afcon-predictor/matchday; data freshness |
| 32 | Uniquely African | `/uniquely-african/` | 🟡 partial | ⬜ | ✅ | ? | — | AfroKitchen has `.claude/rules/afrokitchen.md`; other sub-apps pending |

## Standard pass checklist (what "done" means per category)

- [ ] **Functionality** — every tool loads, calculates, and exports without console errors (drive it in the browser).
- [ ] **Calculator correctness** — audit the `country.data.field || 0` bug class (missing data must never render as free/zero — force user input or filter the dropdown; copy the energy pattern). Independently recompute at least one flagship tool's math and confirm it matches.
- [ ] **Source discipline** — for data-perishable categories, add `data/<cat>/official-sources.json` + `scripts/update-<cat>-source-ledger.js` + npm scripts, mirroring energy/telecom. Record honest gaps. Add `.claude/rules/<cat>.md`.
- [ ] **Workflow** — the hub tells a coherent task story (bill → decision, etc.); cross-links work.
- [ ] **CSS** — no AI-slop (no colored top/left border-accent bars, no gratuitous restyling; respect the existing token system).
- [ ] **SEO/GEO** — canonical, hreflang, OG, and **FAQPage JSON-LD matching the visible FAQ** (844 tool pages already have it; hubs mostly don't).
- [ ] **Deploy + verify** — push `main`, wait ~18 min, confirm live on production, check console + a network fetch of any new data file.
- [ ] **Update this tracker.**
