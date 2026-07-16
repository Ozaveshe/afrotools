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
| 7 | HR & Payroll | `/hr-payroll/` | 🔵 in-progress | ⬜ | ⬜ | ? | opus-hr-payroll-2026-07-17 | statutory deduction ceilings (NSSF/NHIF/pension) are perishable |
| 8 | VAT & Business Tax | `/vat-business-tax/` | 🔵 in-progress | ⬜ | ⬜ | ? | opus-vat-business-tax-2026-07-17 | HIGH stakes; vat-calculator is a reference impl |
| 9 | Fintech | `/fintech/` | 🔵 in-progress | ⬜ | ⬜ | ? | opus-fintech-2026-07-17 | 32 tools; fee/rate/FX lookups are the `\|\|0`-becomes-free risk zone |
| 10 | Trade & Customs | `/trade/` | 🔵 in-progress | ⬜ | ⬜ | ? | opus-trade-customs-2026-07-17 | HIGH stakes: import duty/tariff/AfCFTA; `data/trade/` exists |
| 11 | Mining & Commodities | `/mining/` | 🔵 in-progress | ⬜ | ⬜ | ? | opus-mining-2026-07-17 | commodity prices + royalty rates perishable; hub tool cards were all dead self-links (facade) |
| 12 | Insurance | `/insurance/` | 🔵 in-progress | ⬜ | ⬜ | ? | opus-insurance-2026-07-17 | `data/insurance-data.json` exists; premium rates perishable |
| 13 | Mortgage & Property | `/mortgage-property/` | ✅ complete | ✅ | ✅ | ✅ | opus-mortgage-property-2026-07-17 | 2026-07-17: ledger+validator+rule+FAQPage(6Q). Audit: **no zero-bugs** — all 28 selectors backed by data. Fixed stamp-duty ZA transfer-duty to SARS 1-Apr-2025 scale (was stale, disagreed w/ property-transfer-cost; live-verified R2M=R33,786); dev-feasibility ÷0 guard. mortgage-calculator amortization live-verified (₦308,662/mo). Deploy 4919634 |
| 14 | Personal Finance | `/personal-finance/` | 🟡 partial | n/a | ⬜ | ✅ | opus-coordinator-2026-07-17 | 2026-07-17: added FAQ section + FAQPage schema (5 Q&A, verbatim), deployed `1bf1b00` from an isolated worktree. Hub CSS already clean; no data ledger needed (tools are currency-neutral, formula-only). Remaining: flagship math spot-checks (50-30-20, emergency-fund). |
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
