# Savings Goal Calculator — Upside Audit

- Live: https://afrotools.com/tools/savings-goal/
- Source: `tools/savings-goal/index.html`
- Category: financial
- Audited: 2026-07-13

## 1. What it does
A three-mode savings planner (Time to Goal / Monthly Needed / Final Balance) covering 54 African countries + USD/GBP/EUR. Simulates month-by-month compounding, applies inflation to both the target (nominal goal grows) and to a real-value readout, and adds milestones (25/50/75/100%), a Chart.js growth chart, conservative/moderate/aggressive scenario comparison, a year-by-year table, goal presets, country rate/instrument sidebars, and an AI advisor. Feature-rich relative to Western competitors.

## 2. Calculation review
The core math is sound:
- `simulate()` (line 767): `monthlyRate = annualRate/12`; deposit added, then interest on the new balance (annuity-due style). Standard and consistent.
- Inflation applied symmetrically to goal and real value. Internally consistent.
- `solveForMonthly()` (line 816): bisection with adaptive upper bound — correct.

### Red flags
1. **Preset FX map is incomplete (real defect).** `multipliers` (line 686) covers ~28 currency codes but the COUNTRIES list has ~16 more (LYD, ERN, DJF, SOS, SSP, BIF, KMF, CVE, SZL, LSL, MGA, SCR, STN, MRU, LRD, SLL). These fall back to `m=1`, so every goal preset injects raw **NGN** amounts into those currencies (e.g. Libya "Emergency Fund" = 1,500,000 LYD ≈ $310k — nonsense). Presets are unusable for ~30% of supported countries.
2. **Hardcoded FX (1 USD = 1600 NGN, line 685).** Static, drifts from the live `/api/forex` source used elsewhere on-site; presets silently go stale.
3. **No selectable compounding frequency.** Interest is hardcoded monthly. Competitors expose daily/monthly/quarterly/annual, which materially changes results for daily-compounding accounts.
4. **Weekly/bi-weekly deposits are collapsed to a monthly equivalent** (`deposit*52/12`, line 735) then compounded monthly — an approximation, not true weekly compounding. Acceptable but undocumented.
5. **Dead argument:** `renderScenarios()` is called with an 8th arg (`freq==='balance'?…`, line 753) but the signature (line 959) takes 7, and `freq` is never `'balance'`. Harmless but sloppy.

## 3. SEO audit
- **Title** "Savings Goal Calculator — How Long to Save? | AfroTools" — ~53 chars, strong, keyworded. Keep.
- **Meta description** ~185 chars — slightly over the ~160 truncation point; trim.
- **H1** "Savings Goal Calculator" — good. Single H1, sensible H2/H3 outline.
- **JSON-LD:** WebApplication + WebPage + BreadcrumbList + FAQPage all present. Good coverage. **Defect:** `applicationCategory` is `"DeveloperApplication"` (line 194) — should be `"FinanceApplication"`.
- **Missing:** no `HowTo` schema (the "How the Calculator Works" section is a natural fit).
- Canonical + hreflang (en/sw/x-default) present and correct.
- Internal linking present (investment-return, break-even, related-tools SSR). Solid content depth with African savings-intent keywords (T-Bills, SACCO, Ajo, Chama, Stokvel, PiggyVest).

## 4. UI/UX & trust
- Clear input→result flow, worked breakdown, progress bar, milestones, chart. Auto-calculates on load (good — no empty state).
- **No general disclaimer** ("estimates only / not financial advice") anywhere — flagged and confirmed. Only a conditional negative-real-return warning exists. Rates/inflation are stated (sidebar) but not dated or sourced with "as of" — no verification panel.
- **Brand watch-out:** the entire tool is **green** (`--accent:#10b981`). Site brand is BLUE `#0062CC` (memory: "brand is blue, not green"). Fintech tools sometimes use green, but this is a full green hero + green accents — inconsistent with the standardized palette. No top-border accent bars (compliant).
- Mobile: responsive grid collapses at 900/600px, tables scroll — appears sound at 375px (verify live).
- Accessibility: inputs have `aria-label`s; FAQ uses `<details>`. Reasonable.

## 5. Prioritized fixes

### A. Quick wins (exact file → change)
1. `tools/savings-goal/index.html` line 194 → change `applicationCategory` from `"DeveloperApplication"` to `"FinanceApplication"`.
2. `index.html` → add a one-line disclaimer under the calc button / results: "Estimates for planning only — not financial advice. Rates and inflation are indicative; verify with your provider." Add `<meta>` "as of" date to rate sidebar.
3. `index.html` line 686 → complete the `multipliers` map for the ~16 missing currency codes (or gate presets to supported currencies and hide the preset dropdown otherwise) so presets stop emitting raw NGN amounts.
4. Trim meta description (line 8) to ≤160 chars.
5. Add `HowTo` JSON-LD mirroring the "How the Calculator Works" steps.

### B. Feature upgrades vs competitors
1. Add a **compounding-frequency selector** (daily/monthly/quarterly/annual) — the one clear feature Bankrate/NerdWallet have that this lacks.
2. Add a **"save X per day / per week"** derived readout (Bankrate parity) in Monthly-Needed mode.
3. Wire preset FX to the live `/api/forex?base=USD` source (fallback `/data/forex/latest.json`) instead of the hardcoded 1600 constant.
4. Consider a brand-alignment pass to blue (or confirm green is the sanctioned fintech-category accent).

### C. Watch-outs (generated / shared surfaces)
- Do **not** hand-edit the SSR `related-tools` block or sitemap entries — regenerate via the SEO scripts (`.claude/rules/seo-pages.md`).
- Country rate/inflation data is inline-hardcoded in this file (not a shared data file) — any accuracy update lives only here; there is no source ledger for it.
- The `sw/` hreflang alias (`/sw/zana/lengo-la-akiba/`) must be kept in parity if inputs/labels change (Swahili i18n pipeline).

## Fixes applied 2026-07-14

All edits confined to `tools/savings-goal/index.html`. No shared files touched.

1. **FX preset map completed (correctness).** Added the 16 previously-unmapped currency codes (LYD, ERN, DJF, SOS, SSP, BIF, KMF, CVE, SZL, LSL, MGA, SCR, STN, MRU, LRD, SLL) with approximate USD-anchored multipliers so presets no longer inject raw NGN amounts. Also added a defensive gate: any still-unmapped currency now disables presets ("enter a custom amount") instead of showing a wrong number.
2. **Named FX constant + note.** Replaced the bare `1600` with `NGN_PER_USD=1600` and an "approx, not live" comment.
3. **Disclaimer added** under the Calculate button: "Estimates only — not financial advice. Interest, inflation and preset amounts are approximate and indicative, not live rates."
4. **Meta description trimmed** to ~143 chars (was ~183).
5. **`applicationCategory`** verified already `FinanceApplication` (no change needed).
6. **HowTo JSON-LD added** mirroring the visible 5-step calculator flow (mode → country → goal → deposit/rates → calculate).

**FX check (approx units/USD):** LYD emergency = 4,545 (~$937, was ~1,500,000 LYD ≈ $310k); BIF business = 9,062,500 (~$3,125); MGA house = 28,125,000 (~$6,250); SLL emergency = 21,093,750 (~$938); NGN emergency = 1,500,000 (~$938). All realistic.

**JSON-LD:** all 5 blocks (WebApplication, WebPage, BreadcrumbList, FAQPage, HowTo) parse valid via `JSON.parse`.

**Deferred (feature upgrades / out of scope):** live `/api/forex` wiring, compounding-frequency selector, per-day/per-week readout, brand blue pass, "as of" rate dates.
