<!--
32 ready-to-run session prompts, one per category hub. Paste one into a fresh
Claude Code session. Each is self-contained. Coordinate via docs/CATEGORY-HUB-PROGRESS.md.
Generated to get ahead of the category-hub elevation backlog.
-->

# Category Hub — 32 Session Prompts

Run these in **separate sessions**, ideally a few in parallel. Each session claims its row in
`docs/CATEGORY-HUB-PROGRESS.md` first so two sessions never touch the same hub.

**Suggested priority order** (highest user-harm / SEO value first): Salary Tax, VAT & Business Tax,
Trade & Customs, Fintech, Religious & Cultural, HR & Payroll, Insurance, Mortgage & Property, Mining —
then the remaining data-light categories, then the light FAQPage passes on the four complete hubs.

---

### 1. Salary & Income Tax — `/salary-tax/`

You are a senior product engineer taking full ownership of the **Salary & Income Tax** hub (/salary-tax/) and all its sub-apps.

**Context you inherit (read first):** open `docs/CATEGORY-HUB-PROGRESS.md` and `.claude/rules/energy.md`. The **Energy** hub is the reference implementation: `data/energy/official-sources.json`, `scripts/update-energy-source-ledger.js`, its FAQPage schema, and a live-verified calculator audit. Copy that shape.

**Category focus:** HIGH-STAKES legal figures. PAYE/income-tax bands, reliefs and thresholds change every finance act. Bind each country to its revenue authority (KRA, URA, FIRS, SARS, GRA, ZIMRA…) in a source ledger; verify against the gazetted Act, never a changed hash. Audit bracket math and the missing-country→0-tax bug.

**Do this pass:**
1. **Claim it** — in `docs/CATEGORY-HUB-PROGRESS.md` set this row's Status to `in-progress` and Owner to your session; commit just that line and push, so no other session collides.
2. **Inventory** the hub's tools (read `/salary-tax/index.html`) and drive each one in the browser preview — confirm it loads, calculates, exports, and logs no console errors.
3. **Calculator correctness** — hunt the `country.data.field || 0` bug class (missing data must never render as free/zero; force user input or filter the dropdown — copy the energy pattern). Independently recompute at least one flagship tool's math and confirm the on-screen number matches. Fix what you find.
4. **Source discipline** (for the perishable data noted above): add `data/salary-tax/official-sources.json` + `scripts/update-salary-tax-source-ledger.js` + `salary-tax:sources[:check]` npm scripts, mirroring energy/telecom. Bind confident official sources, record honest gaps, and add `.claude/rules/salary-tax.md`. Never bump a `lastUpdated` stamp without reading the real source.
5. **Workflow + CSS** — make the hub tell a coherent task story; fix broken cross-links. Do NOT add AI-slop CSS (no colored top/left border-accent bars, no gratuitous restyle); respect the existing token system.
6. **SEO/GEO** — verify canonical, hreflang, OG, and add **FAQPage JSON-LD matching the visible FAQ verbatim** (844 tool pages have it; most hubs don't).
7. **Deploy + verify** — commit ONLY your files (never `git commit -a`; a Codex session sweeps with `git add -A`). Fast-forward `main`, `git push origin main`. The production build takes ~18 min — then open `https://afrotools.com/salary-tax/` in the browser, confirm your changes are live, check console, and fetch any new data file.
8. **Report** — update this row in `docs/CATEGORY-HUB-PROGRESS.md` (status, what shipped, deploy commit).

**Guardrails:** Do NOT bulk-merge or push the ~192 stale local branches — merging them reverts production. Ship only your own work. If you run low on context, write a handoff into the tracker and open a fresh session.

---

### 2. HR & Payroll — `/hr-payroll/`

You are a senior product engineer taking full ownership of the **HR & Payroll** hub (/hr-payroll/) and all its sub-apps.

**Context you inherit (read first):** open `docs/CATEGORY-HUB-PROGRESS.md` and `.claude/rules/energy.md`. The **Energy** hub is the reference implementation: `data/energy/official-sources.json`, `scripts/update-energy-source-ledger.js`, its FAQPage schema, and a live-verified calculator audit. Copy that shape.

**Category focus:** Statutory deduction ceilings (NSSF, NHIF/SHIF, pension, PAYE) are perishable and legal. Audit contribution caps and the missing-rate→0 bug. Add a source ledger to the relevant social-security bodies.

**Do this pass:**
1. **Claim it** — in `docs/CATEGORY-HUB-PROGRESS.md` set this row's Status to `in-progress` and Owner to your session; commit just that line and push, so no other session collides.
2. **Inventory** the hub's tools (read `/hr-payroll/index.html`) and drive each one in the browser preview — confirm it loads, calculates, exports, and logs no console errors.
3. **Calculator correctness** — hunt the `country.data.field || 0` bug class (missing data must never render as free/zero; force user input or filter the dropdown — copy the energy pattern). Independently recompute at least one flagship tool's math and confirm the on-screen number matches. Fix what you find.
4. **Source discipline** (for the perishable data noted above): add `data/hr-payroll/official-sources.json` + `scripts/update-hr-payroll-source-ledger.js` + `hr-payroll:sources[:check]` npm scripts, mirroring energy/telecom. Bind confident official sources, record honest gaps, and add `.claude/rules/hr-payroll.md`. Never bump a `lastUpdated` stamp without reading the real source.
5. **Workflow + CSS** — make the hub tell a coherent task story; fix broken cross-links. Do NOT add AI-slop CSS (no colored top/left border-accent bars, no gratuitous restyle); respect the existing token system.
6. **SEO/GEO** — verify canonical, hreflang, OG, and add **FAQPage JSON-LD matching the visible FAQ verbatim** (844 tool pages have it; most hubs don't).
7. **Deploy + verify** — commit ONLY your files (never `git commit -a`; a Codex session sweeps with `git add -A`). Fast-forward `main`, `git push origin main`. The production build takes ~18 min — then open `https://afrotools.com/hr-payroll/` in the browser, confirm your changes are live, check console, and fetch any new data file.
8. **Report** — update this row in `docs/CATEGORY-HUB-PROGRESS.md` (status, what shipped, deploy commit).

**Guardrails:** Do NOT bulk-merge or push the ~192 stale local branches — merging them reverts production. Ship only your own work. If you run low on context, write a handoff into the tracker and open a fresh session.

---

### 3. VAT & Business Tax — `/vat-business-tax/`

You are a senior product engineer taking full ownership of the **VAT & Business Tax** hub (/vat-business-tax/) and all its sub-apps.

**Context you inherit (read first):** open `docs/CATEGORY-HUB-PROGRESS.md` and `.claude/rules/energy.md`. The **Energy** hub is the reference implementation: `data/energy/official-sources.json`, `scripts/update-energy-source-ledger.js`, its FAQPage schema, and a live-verified calculator audit. Copy that shape.

**Category focus:** HIGH-STAKES. VAT rates and registration thresholds per country. vat-calculator is a reference implementation — match its rigor. Any dropdown offering more countries than the rate dataset covers is the tell for the zero-bug.

**Do this pass:**
1. **Claim it** — in `docs/CATEGORY-HUB-PROGRESS.md` set this row's Status to `in-progress` and Owner to your session; commit just that line and push, so no other session collides.
2. **Inventory** the hub's tools (read `/vat-business-tax/index.html`) and drive each one in the browser preview — confirm it loads, calculates, exports, and logs no console errors.
3. **Calculator correctness** — hunt the `country.data.field || 0` bug class (missing data must never render as free/zero; force user input or filter the dropdown — copy the energy pattern). Independently recompute at least one flagship tool's math and confirm the on-screen number matches. Fix what you find.
4. **Source discipline** (for the perishable data noted above): add `data/vat-business-tax/official-sources.json` + `scripts/update-vat-business-tax-source-ledger.js` + `vat-business-tax:sources[:check]` npm scripts, mirroring energy/telecom. Bind confident official sources, record honest gaps, and add `.claude/rules/vat-business-tax.md`. Never bump a `lastUpdated` stamp without reading the real source.
5. **Workflow + CSS** — make the hub tell a coherent task story; fix broken cross-links. Do NOT add AI-slop CSS (no colored top/left border-accent bars, no gratuitous restyle); respect the existing token system.
6. **SEO/GEO** — verify canonical, hreflang, OG, and add **FAQPage JSON-LD matching the visible FAQ verbatim** (844 tool pages have it; most hubs don't).
7. **Deploy + verify** — commit ONLY your files (never `git commit -a`; a Codex session sweeps with `git add -A`). Fast-forward `main`, `git push origin main`. The production build takes ~18 min — then open `https://afrotools.com/vat-business-tax/` in the browser, confirm your changes are live, check console, and fetch any new data file.
8. **Report** — update this row in `docs/CATEGORY-HUB-PROGRESS.md` (status, what shipped, deploy commit).

**Guardrails:** Do NOT bulk-merge or push the ~192 stale local branches — merging them reverts production. Ship only your own work. If you run low on context, write a handoff into the tracker and open a fresh session.

---

### 4. Fintech — `/fintech/`

You are a senior product engineer taking full ownership of the **Fintech** hub (/fintech/) and all its sub-apps.

**Context you inherit (read first):** open `docs/CATEGORY-HUB-PROGRESS.md` and `.claude/rules/energy.md`. The **Energy** hub is the reference implementation: `data/energy/official-sources.json`, `scripts/update-energy-source-ledger.js`, its FAQPage schema, and a live-verified calculator audit. Copy that shape.

**Category focus:** ~32 tools (loans, remittance, banking fees, crypto). Fee/interest/FX lookups are the prime `country.fees||0`-becomes-free zone. Audit interest and amortization math; verify one flagship live. FX must use the shared live source.

**Do this pass:**
1. **Claim it** — in `docs/CATEGORY-HUB-PROGRESS.md` set this row's Status to `in-progress` and Owner to your session; commit just that line and push, so no other session collides.
2. **Inventory** the hub's tools (read `/fintech/index.html`) and drive each one in the browser preview — confirm it loads, calculates, exports, and logs no console errors.
3. **Calculator correctness** — hunt the `country.data.field || 0` bug class (missing data must never render as free/zero; force user input or filter the dropdown — copy the energy pattern). Independently recompute at least one flagship tool's math and confirm the on-screen number matches. Fix what you find.
4. **Source discipline** (for the perishable data noted above): add `data/fintech/official-sources.json` + `scripts/update-fintech-source-ledger.js` + `fintech:sources[:check]` npm scripts, mirroring energy/telecom. Bind confident official sources, record honest gaps, and add `.claude/rules/fintech.md`. Never bump a `lastUpdated` stamp without reading the real source.
5. **Workflow + CSS** — make the hub tell a coherent task story; fix broken cross-links. Do NOT add AI-slop CSS (no colored top/left border-accent bars, no gratuitous restyle); respect the existing token system.
6. **SEO/GEO** — verify canonical, hreflang, OG, and add **FAQPage JSON-LD matching the visible FAQ verbatim** (844 tool pages have it; most hubs don't).
7. **Deploy + verify** — commit ONLY your files (never `git commit -a`; a Codex session sweeps with `git add -A`). Fast-forward `main`, `git push origin main`. The production build takes ~18 min — then open `https://afrotools.com/fintech/` in the browser, confirm your changes are live, check console, and fetch any new data file.
8. **Report** — update this row in `docs/CATEGORY-HUB-PROGRESS.md` (status, what shipped, deploy commit).

**Guardrails:** Do NOT bulk-merge or push the ~192 stale local branches — merging them reverts production. Ship only your own work. If you run low on context, write a handoff into the tracker and open a fresh session.

---

### 5. Trade & Customs — `/trade/`

You are a senior product engineer taking full ownership of the **Trade & Customs** hub (/trade/) and all its sub-apps.

**Context you inherit (read first):** open `docs/CATEGORY-HUB-PROGRESS.md` and `.claude/rules/energy.md`. The **Energy** hub is the reference implementation: `data/energy/official-sources.json`, `scripts/update-energy-source-ledger.js`, its FAQPage schema, and a live-verified calculator audit. Copy that shape.

**Category focus:** HIGH-STAKES. Import duty, tariffs, incoterms, AfCFTA rules of origin. `data/trade/` already has country packs — bind them in a source ledger to customs authorities. Full import-rule markets vs directory-estimate must stay honestly labelled.

**Do this pass:**
1. **Claim it** — in `docs/CATEGORY-HUB-PROGRESS.md` set this row's Status to `in-progress` and Owner to your session; commit just that line and push, so no other session collides.
2. **Inventory** the hub's tools (read `/trade/index.html`) and drive each one in the browser preview — confirm it loads, calculates, exports, and logs no console errors.
3. **Calculator correctness** — hunt the `country.data.field || 0` bug class (missing data must never render as free/zero; force user input or filter the dropdown — copy the energy pattern). Independently recompute at least one flagship tool's math and confirm the on-screen number matches. Fix what you find.
4. **Source discipline** (for the perishable data noted above): add `data/trade/official-sources.json` + `scripts/update-trade-source-ledger.js` + `trade:sources[:check]` npm scripts, mirroring energy/telecom. Bind confident official sources, record honest gaps, and add `.claude/rules/trade.md`. Never bump a `lastUpdated` stamp without reading the real source.
5. **Workflow + CSS** — make the hub tell a coherent task story; fix broken cross-links. Do NOT add AI-slop CSS (no colored top/left border-accent bars, no gratuitous restyle); respect the existing token system.
6. **SEO/GEO** — verify canonical, hreflang, OG, and add **FAQPage JSON-LD matching the visible FAQ verbatim** (844 tool pages have it; most hubs don't).
7. **Deploy + verify** — commit ONLY your files (never `git commit -a`; a Codex session sweeps with `git add -A`). Fast-forward `main`, `git push origin main`. The production build takes ~18 min — then open `https://afrotools.com/trade/` in the browser, confirm your changes are live, check console, and fetch any new data file.
8. **Report** — update this row in `docs/CATEGORY-HUB-PROGRESS.md` (status, what shipped, deploy commit).

**Guardrails:** Do NOT bulk-merge or push the ~192 stale local branches — merging them reverts production. Ship only your own work. If you run low on context, write a handoff into the tracker and open a fresh session.

---

### 6. Mining & Commodities — `/mining/`

You are a senior product engineer taking full ownership of the **Mining & Commodities** hub (/mining/) and all its sub-apps.

**Context you inherit (read first):** open `docs/CATEGORY-HUB-PROGRESS.md` and `.claude/rules/energy.md`. The **Energy** hub is the reference implementation: `data/energy/official-sources.json`, `scripts/update-energy-source-ledger.js`, its FAQPage schema, and a live-verified calculator audit. Copy that shape.

**Category focus:** Commodity prices and royalty/tax rates are perishable. Add a source ledger to mines ministries / commodity references. Audit royalty math and price-lookup zero-bugs.

**Do this pass:**
1. **Claim it** — in `docs/CATEGORY-HUB-PROGRESS.md` set this row's Status to `in-progress` and Owner to your session; commit just that line and push, so no other session collides.
2. **Inventory** the hub's tools (read `/mining/index.html`) and drive each one in the browser preview — confirm it loads, calculates, exports, and logs no console errors.
3. **Calculator correctness** — hunt the `country.data.field || 0` bug class (missing data must never render as free/zero; force user input or filter the dropdown — copy the energy pattern). Independently recompute at least one flagship tool's math and confirm the on-screen number matches. Fix what you find.
4. **Source discipline** (for the perishable data noted above): add `data/mining/official-sources.json` + `scripts/update-mining-source-ledger.js` + `mining:sources[:check]` npm scripts, mirroring energy/telecom. Bind confident official sources, record honest gaps, and add `.claude/rules/mining.md`. Never bump a `lastUpdated` stamp without reading the real source.
5. **Workflow + CSS** — make the hub tell a coherent task story; fix broken cross-links. Do NOT add AI-slop CSS (no colored top/left border-accent bars, no gratuitous restyle); respect the existing token system.
6. **SEO/GEO** — verify canonical, hreflang, OG, and add **FAQPage JSON-LD matching the visible FAQ verbatim** (844 tool pages have it; most hubs don't).
7. **Deploy + verify** — commit ONLY your files (never `git commit -a`; a Codex session sweeps with `git add -A`). Fast-forward `main`, `git push origin main`. The production build takes ~18 min — then open `https://afrotools.com/mining/` in the browser, confirm your changes are live, check console, and fetch any new data file.
8. **Report** — update this row in `docs/CATEGORY-HUB-PROGRESS.md` (status, what shipped, deploy commit).

**Guardrails:** Do NOT bulk-merge or push the ~192 stale local branches — merging them reverts production. Ship only your own work. If you run low on context, write a handoff into the tracker and open a fresh session.

---

### 7. Insurance — `/insurance/`

You are a senior product engineer taking full ownership of the **Insurance** hub (/insurance/) and all its sub-apps.

**Context you inherit (read first):** open `docs/CATEGORY-HUB-PROGRESS.md` and `.claude/rules/energy.md`. The **Energy** hub is the reference implementation: `data/energy/official-sources.json`, `scripts/update-energy-source-ledger.js`, its FAQPage schema, and a live-verified calculator audit. Copy that shape.

**Category focus:** `data/insurance-data.json` exists. Premium rates and regulator context are perishable. Add a source ledger to insurance regulators (NAICOM, IRA, FSCA…). Audit premium math.

**Do this pass:**
1. **Claim it** — in `docs/CATEGORY-HUB-PROGRESS.md` set this row's Status to `in-progress` and Owner to your session; commit just that line and push, so no other session collides.
2. **Inventory** the hub's tools (read `/insurance/index.html`) and drive each one in the browser preview — confirm it loads, calculates, exports, and logs no console errors.
3. **Calculator correctness** — hunt the `country.data.field || 0` bug class (missing data must never render as free/zero; force user input or filter the dropdown — copy the energy pattern). Independently recompute at least one flagship tool's math and confirm the on-screen number matches. Fix what you find.
4. **Source discipline** (for the perishable data noted above): add `data/insurance/official-sources.json` + `scripts/update-insurance-source-ledger.js` + `insurance:sources[:check]` npm scripts, mirroring energy/telecom. Bind confident official sources, record honest gaps, and add `.claude/rules/insurance.md`. Never bump a `lastUpdated` stamp without reading the real source.
5. **Workflow + CSS** — make the hub tell a coherent task story; fix broken cross-links. Do NOT add AI-slop CSS (no colored top/left border-accent bars, no gratuitous restyle); respect the existing token system.
6. **SEO/GEO** — verify canonical, hreflang, OG, and add **FAQPage JSON-LD matching the visible FAQ verbatim** (844 tool pages have it; most hubs don't).
7. **Deploy + verify** — commit ONLY your files (never `git commit -a`; a Codex session sweeps with `git add -A`). Fast-forward `main`, `git push origin main`. The production build takes ~18 min — then open `https://afrotools.com/insurance/` in the browser, confirm your changes are live, check console, and fetch any new data file.
8. **Report** — update this row in `docs/CATEGORY-HUB-PROGRESS.md` (status, what shipped, deploy commit).

**Guardrails:** Do NOT bulk-merge or push the ~192 stale local branches — merging them reverts production. Ship only your own work. If you run low on context, write a handoff into the tracker and open a fresh session.

---

### 8. Mortgage & Property — `/mortgage-property/`

You are a senior product engineer taking full ownership of the **Mortgage & Property** hub (/mortgage-property/) and all its sub-apps.

**Context you inherit (read first):** open `docs/CATEGORY-HUB-PROGRESS.md` and `.claude/rules/energy.md`. The **Energy** hub is the reference implementation: `data/energy/official-sources.json`, `scripts/update-energy-source-ledger.js`, its FAQPage schema, and a live-verified calculator audit. Copy that shape.

**Category focus:** Amortization/affordability math + stamp duty and interest rates. Independently recompute an amortization schedule and confirm it matches. Rates are perishable.

**Do this pass:**
1. **Claim it** — in `docs/CATEGORY-HUB-PROGRESS.md` set this row's Status to `in-progress` and Owner to your session; commit just that line and push, so no other session collides.
2. **Inventory** the hub's tools (read `/mortgage-property/index.html`) and drive each one in the browser preview — confirm it loads, calculates, exports, and logs no console errors.
3. **Calculator correctness** — hunt the `country.data.field || 0` bug class (missing data must never render as free/zero; force user input or filter the dropdown — copy the energy pattern). Independently recompute at least one flagship tool's math and confirm the on-screen number matches. Fix what you find.
4. **Source discipline** (for the perishable data noted above): add `data/mortgage-property/official-sources.json` + `scripts/update-mortgage-property-source-ledger.js` + `mortgage-property:sources[:check]` npm scripts, mirroring energy/telecom. Bind confident official sources, record honest gaps, and add `.claude/rules/mortgage-property.md`. Never bump a `lastUpdated` stamp without reading the real source.
5. **Workflow + CSS** — make the hub tell a coherent task story; fix broken cross-links. Do NOT add AI-slop CSS (no colored top/left border-accent bars, no gratuitous restyle); respect the existing token system.
6. **SEO/GEO** — verify canonical, hreflang, OG, and add **FAQPage JSON-LD matching the visible FAQ verbatim** (844 tool pages have it; most hubs don't).
7. **Deploy + verify** — commit ONLY your files (never `git commit -a`; a Codex session sweeps with `git add -A`). Fast-forward `main`, `git push origin main`. The production build takes ~18 min — then open `https://afrotools.com/mortgage-property/` in the browser, confirm your changes are live, check console, and fetch any new data file.
8. **Report** — update this row in `docs/CATEGORY-HUB-PROGRESS.md` (status, what shipped, deploy commit).

**Guardrails:** Do NOT bulk-merge or push the ~192 stale local branches — merging them reverts production. Ship only your own work. If you run low on context, write a handoff into the tracker and open a fresh session.

---

### 9. Personal Finance — `/personal-finance/`

You are a senior product engineer taking full ownership of the **Personal Finance** hub (/personal-finance/) and all its sub-apps.

**Context you inherit (read first):** open `docs/CATEGORY-HUB-PROGRESS.md` and `.claude/rules/energy.md`. The **Energy** hub is the reference implementation: `data/energy/official-sources.json`, `scripts/update-energy-source-ledger.js`, its FAQPage schema, and a live-verified calculator audit. Copy that shape.

**Category focus:** Budget, savings, 50-30-20, compound-interest tools. Mostly formula-correctness (no country data), so focus the audit on math edge cases (zero/negative inputs, division) and workflow.

**Do this pass:**
1. **Claim it** — in `docs/CATEGORY-HUB-PROGRESS.md` set this row's Status to `in-progress` and Owner to your session; commit just that line and push, so no other session collides.
2. **Inventory** the hub's tools (read `/personal-finance/index.html`) and drive each one in the browser preview — confirm it loads, calculates, exports, and logs no console errors.
3. **Calculator correctness** — hunt the `country.data.field || 0` bug class (missing data must never render as free/zero; force user input or filter the dropdown — copy the energy pattern). Independently recompute at least one flagship tool's math and confirm the on-screen number matches. Fix what you find.
4. **Source discipline** (for the perishable data noted above): add `data/personal-finance/official-sources.json` + `scripts/update-personal-finance-source-ledger.js` + `personal-finance:sources[:check]` npm scripts, mirroring energy/telecom. Bind confident official sources, record honest gaps, and add `.claude/rules/personal-finance.md`. Never bump a `lastUpdated` stamp without reading the real source.
5. **Workflow + CSS** — make the hub tell a coherent task story; fix broken cross-links. Do NOT add AI-slop CSS (no colored top/left border-accent bars, no gratuitous restyle); respect the existing token system.
6. **SEO/GEO** — verify canonical, hreflang, OG, and add **FAQPage JSON-LD matching the visible FAQ verbatim** (844 tool pages have it; most hubs don't).
7. **Deploy + verify** — commit ONLY your files (never `git commit -a`; a Codex session sweeps with `git add -A`). Fast-forward `main`, `git push origin main`. The production build takes ~18 min — then open `https://afrotools.com/personal-finance/` in the browser, confirm your changes are live, check console, and fetch any new data file.
8. **Report** — update this row in `docs/CATEGORY-HUB-PROGRESS.md` (status, what shipped, deploy commit).

**Guardrails:** Do NOT bulk-merge or push the ~192 stale local branches — merging them reverts production. Ship only your own work. If you run low on context, write a handoff into the tracker and open a fresh session.

---

### 10. Business ROI — `/business-roi/`

You are a senior product engineer taking full ownership of the **Business ROI** hub (/business-roi/) and all its sub-apps.

**Context you inherit (read first):** open `docs/CATEGORY-HUB-PROGRESS.md` and `.claude/rules/energy.md`. The **Energy** hub is the reference implementation: `data/energy/official-sources.json`, `scripts/update-energy-source-ledger.js`, its FAQPage schema, and a live-verified calculator audit. Copy that shape.

**Category focus:** Break-even, cash-flow, ROI, business planners. Financial-model correctness; verify a flagship model by hand. Workflow: planners should chain coherently.

**Do this pass:**
1. **Claim it** — in `docs/CATEGORY-HUB-PROGRESS.md` set this row's Status to `in-progress` and Owner to your session; commit just that line and push, so no other session collides.
2. **Inventory** the hub's tools (read `/business-roi/index.html`) and drive each one in the browser preview — confirm it loads, calculates, exports, and logs no console errors.
3. **Calculator correctness** — hunt the `country.data.field || 0` bug class (missing data must never render as free/zero; force user input or filter the dropdown — copy the energy pattern). Independently recompute at least one flagship tool's math and confirm the on-screen number matches. Fix what you find.
4. **Source discipline** (for the perishable data noted above): add `data/business-roi/official-sources.json` + `scripts/update-business-roi-source-ledger.js` + `business-roi:sources[:check]` npm scripts, mirroring energy/telecom. Bind confident official sources, record honest gaps, and add `.claude/rules/business-roi.md`. Never bump a `lastUpdated` stamp without reading the real source.
5. **Workflow + CSS** — make the hub tell a coherent task story; fix broken cross-links. Do NOT add AI-slop CSS (no colored top/left border-accent bars, no gratuitous restyle); respect the existing token system.
6. **SEO/GEO** — verify canonical, hreflang, OG, and add **FAQPage JSON-LD matching the visible FAQ verbatim** (844 tool pages have it; most hubs don't).
7. **Deploy + verify** — commit ONLY your files (never `git commit -a`; a Codex session sweeps with `git add -A`). Fast-forward `main`, `git push origin main`. The production build takes ~18 min — then open `https://afrotools.com/business-roi/` in the browser, confirm your changes are live, check console, and fetch any new data file.
8. **Report** — update this row in `docs/CATEGORY-HUB-PROGRESS.md` (status, what shipped, deploy commit).

**Guardrails:** Do NOT bulk-merge or push the ~192 stale local branches — merging them reverts production. Ship only your own work. If you run low on context, write a handoff into the tracker and open a fresh session.

---

### 11. Diaspora — `/diaspora/`

You are a senior product engineer taking full ownership of the **Diaspora** hub (/diaspora/) and all its sub-apps.

**Context you inherit (read first):** open `docs/CATEGORY-HUB-PROGRESS.md` and `.claude/rules/energy.md`. The **Energy** hub is the reference implementation: `data/energy/official-sources.json`, `scripts/update-energy-source-ledger.js`, its FAQPage schema, and a live-verified calculator audit. Copy that shape.

**Category focus:** Remittance and diaspora tools. FX and transfer-fee perishability; fee-lookup zero-bug. FX via the shared live source, not a hardcoded rate.

**Do this pass:**
1. **Claim it** — in `docs/CATEGORY-HUB-PROGRESS.md` set this row's Status to `in-progress` and Owner to your session; commit just that line and push, so no other session collides.
2. **Inventory** the hub's tools (read `/diaspora/index.html`) and drive each one in the browser preview — confirm it loads, calculates, exports, and logs no console errors.
3. **Calculator correctness** — hunt the `country.data.field || 0` bug class (missing data must never render as free/zero; force user input or filter the dropdown — copy the energy pattern). Independently recompute at least one flagship tool's math and confirm the on-screen number matches. Fix what you find.
4. **Source discipline** (for the perishable data noted above): add `data/diaspora/official-sources.json` + `scripts/update-diaspora-source-ledger.js` + `diaspora:sources[:check]` npm scripts, mirroring energy/telecom. Bind confident official sources, record honest gaps, and add `.claude/rules/diaspora.md`. Never bump a `lastUpdated` stamp without reading the real source.
5. **Workflow + CSS** — make the hub tell a coherent task story; fix broken cross-links. Do NOT add AI-slop CSS (no colored top/left border-accent bars, no gratuitous restyle); respect the existing token system.
6. **SEO/GEO** — verify canonical, hreflang, OG, and add **FAQPage JSON-LD matching the visible FAQ verbatim** (844 tool pages have it; most hubs don't).
7. **Deploy + verify** — commit ONLY your files (never `git commit -a`; a Codex session sweeps with `git add -A`). Fast-forward `main`, `git push origin main`. The production build takes ~18 min — then open `https://afrotools.com/diaspora/` in the browser, confirm your changes are live, check console, and fetch any new data file.
8. **Report** — update this row in `docs/CATEGORY-HUB-PROGRESS.md` (status, what shipped, deploy commit).

**Guardrails:** Do NOT bulk-merge or push the ~192 stale local branches — merging them reverts production. Ship only your own work. If you run low on context, write a handoff into the tracker and open a fresh session.

---

### 12. Agriculture — `/agriculture/`

You are a senior product engineer taking full ownership of the **Agriculture** hub (/agriculture/) and all its sub-apps.

**Context you inherit (read first):** open `docs/CATEGORY-HUB-PROGRESS.md` and `.claude/rules/energy.md`. The **Energy** hub is the reference implementation: `data/energy/official-sources.json`, `scripts/update-energy-source-ledger.js`, its FAQPage schema, and a live-verified calculator audit. Copy that shape.

**Category focus:** Crop/seed-rate/farm-input calculators. Agronomic-formula correctness + perishable input prices. Verify a flagship agronomic calc against a known worked example.

**Do this pass:**
1. **Claim it** — in `docs/CATEGORY-HUB-PROGRESS.md` set this row's Status to `in-progress` and Owner to your session; commit just that line and push, so no other session collides.
2. **Inventory** the hub's tools (read `/agriculture/index.html`) and drive each one in the browser preview — confirm it loads, calculates, exports, and logs no console errors.
3. **Calculator correctness** — hunt the `country.data.field || 0` bug class (missing data must never render as free/zero; force user input or filter the dropdown — copy the energy pattern). Independently recompute at least one flagship tool's math and confirm the on-screen number matches. Fix what you find.
4. **Source discipline** (for the perishable data noted above): add `data/agriculture/official-sources.json` + `scripts/update-agriculture-source-ledger.js` + `agriculture:sources[:check]` npm scripts, mirroring energy/telecom. Bind confident official sources, record honest gaps, and add `.claude/rules/agriculture.md`. Never bump a `lastUpdated` stamp without reading the real source.
5. **Workflow + CSS** — make the hub tell a coherent task story; fix broken cross-links. Do NOT add AI-slop CSS (no colored top/left border-accent bars, no gratuitous restyle); respect the existing token system.
6. **SEO/GEO** — verify canonical, hreflang, OG, and add **FAQPage JSON-LD matching the visible FAQ verbatim** (844 tool pages have it; most hubs don't).
7. **Deploy + verify** — commit ONLY your files (never `git commit -a`; a Codex session sweeps with `git add -A`). Fast-forward `main`, `git push origin main`. The production build takes ~18 min — then open `https://afrotools.com/agriculture/` in the browser, confirm your changes are live, check console, and fetch any new data file.
8. **Report** — update this row in `docs/CATEGORY-HUB-PROGRESS.md` (status, what shipped, deploy commit).

**Guardrails:** Do NOT bulk-merge or push the ~192 stale local branches — merging them reverts production. Ship only your own work. If you run low on context, write a handoff into the tracker and open a fresh session.

---

### 13. Education — `/education/`

You are a senior product engineer taking full ownership of the **Education** hub (/education/) and all its sub-apps.

**Context you inherit (read first):** open `docs/CATEGORY-HUB-PROGRESS.md` and `.claude/rules/energy.md`. The **Energy** hub is the reference implementation: `data/energy/official-sources.json`, `scripts/update-energy-source-ledger.js`, its FAQPage schema, and a live-verified calculator audit. Copy that shape.

**Category focus:** `data/scholarships/official-sources.json` already exists — extend it. Scholarship deadlines and exam dates are perishable and must show review dates. Audit JAMB/aggregate-score math.

**Do this pass:**
1. **Claim it** — in `docs/CATEGORY-HUB-PROGRESS.md` set this row's Status to `in-progress` and Owner to your session; commit just that line and push, so no other session collides.
2. **Inventory** the hub's tools (read `/education/index.html`) and drive each one in the browser preview — confirm it loads, calculates, exports, and logs no console errors.
3. **Calculator correctness** — hunt the `country.data.field || 0` bug class (missing data must never render as free/zero; force user input or filter the dropdown — copy the energy pattern). Independently recompute at least one flagship tool's math and confirm the on-screen number matches. Fix what you find.
4. **Source discipline** (for the perishable data noted above): add `data/education/official-sources.json` + `scripts/update-education-source-ledger.js` + `education:sources[:check]` npm scripts, mirroring energy/telecom. Bind confident official sources, record honest gaps, and add `.claude/rules/education.md`. Never bump a `lastUpdated` stamp without reading the real source.
5. **Workflow + CSS** — make the hub tell a coherent task story; fix broken cross-links. Do NOT add AI-slop CSS (no colored top/left border-accent bars, no gratuitous restyle); respect the existing token system.
6. **SEO/GEO** — verify canonical, hreflang, OG, and add **FAQPage JSON-LD matching the visible FAQ verbatim** (844 tool pages have it; most hubs don't).
7. **Deploy + verify** — commit ONLY your files (never `git commit -a`; a Codex session sweeps with `git add -A`). Fast-forward `main`, `git push origin main`. The production build takes ~18 min — then open `https://afrotools.com/education/` in the browser, confirm your changes are live, check console, and fetch any new data file.
8. **Report** — update this row in `docs/CATEGORY-HUB-PROGRESS.md` (status, what shipped, deploy commit).

**Guardrails:** Do NOT bulk-merge or push the ~192 stale local branches — merging them reverts production. Ship only your own work. If you run low on context, write a handoff into the tracker and open a fresh session.

---

### 14. Health — `/health/`

You are a senior product engineer taking full ownership of the **Health** hub (/health/) and all its sub-apps.

**Context you inherit (read first):** open `docs/CATEGORY-HUB-PROGRESS.md` and `.claude/rules/energy.md`. The **Energy** hub is the reference implementation: `data/energy/official-sources.json`, `scripts/update-energy-source-ledger.js`, its FAQPage schema, and a live-verified calculator audit. Copy that shape.

**Category focus:** BMI/water/health calculators. Formula accuracy and unit handling (metric/imperial). Medical-adjacent: keep clear non-diagnostic disclaimers. Verify a flagship formula against a reference.

**Do this pass:**
1. **Claim it** — in `docs/CATEGORY-HUB-PROGRESS.md` set this row's Status to `in-progress` and Owner to your session; commit just that line and push, so no other session collides.
2. **Inventory** the hub's tools (read `/health/index.html`) and drive each one in the browser preview — confirm it loads, calculates, exports, and logs no console errors.
3. **Calculator correctness** — hunt the `country.data.field || 0` bug class (missing data must never render as free/zero; force user input or filter the dropdown — copy the energy pattern). Independently recompute at least one flagship tool's math and confirm the on-screen number matches. Fix what you find.
4. **Source discipline** (for the perishable data noted above): add `data/health/official-sources.json` + `scripts/update-health-source-ledger.js` + `health:sources[:check]` npm scripts, mirroring energy/telecom. Bind confident official sources, record honest gaps, and add `.claude/rules/health.md`. Never bump a `lastUpdated` stamp without reading the real source.
5. **Workflow + CSS** — make the hub tell a coherent task story; fix broken cross-links. Do NOT add AI-slop CSS (no colored top/left border-accent bars, no gratuitous restyle); respect the existing token system.
6. **SEO/GEO** — verify canonical, hreflang, OG, and add **FAQPage JSON-LD matching the visible FAQ verbatim** (844 tool pages have it; most hubs don't).
7. **Deploy + verify** — commit ONLY your files (never `git commit -a`; a Codex session sweeps with `git add -A`). Fast-forward `main`, `git push origin main`. The production build takes ~18 min — then open `https://afrotools.com/health/` in the browser, confirm your changes are live, check console, and fetch any new data file.
8. **Report** — update this row in `docs/CATEGORY-HUB-PROGRESS.md` (status, what shipped, deploy commit).

**Guardrails:** Do NOT bulk-merge or push the ~192 stale local branches — merging them reverts production. Ship only your own work. If you run low on context, write a handoff into the tracker and open a fresh session.

---

### 15. Religious & Cultural — `/religious-cultural/`

You are a senior product engineer taking full ownership of the **Religious & Cultural** hub (/religious-cultural/) and all its sub-apps.

**Context you inherit (read first):** open `docs/CATEGORY-HUB-PROGRESS.md` and `.claude/rules/energy.md`. The **Energy** hub is the reference implementation: `data/energy/official-sources.json`, `scripts/update-energy-source-ledger.js`, its FAQPage schema, and a live-verified calculator audit. Copy that shape.

**Category focus:** HIGH-SENSITIVITY correctness: zakat nisab thresholds, faraid inheritance shares, prayer times must be exact and sourced to recognised authority. Errors here are reputationally severe. Nisab tracks live gold/silver price.

**Do this pass:**
1. **Claim it** — in `docs/CATEGORY-HUB-PROGRESS.md` set this row's Status to `in-progress` and Owner to your session; commit just that line and push, so no other session collides.
2. **Inventory** the hub's tools (read `/religious-cultural/index.html`) and drive each one in the browser preview — confirm it loads, calculates, exports, and logs no console errors.
3. **Calculator correctness** — hunt the `country.data.field || 0` bug class (missing data must never render as free/zero; force user input or filter the dropdown — copy the energy pattern). Independently recompute at least one flagship tool's math and confirm the on-screen number matches. Fix what you find.
4. **Source discipline** (for the perishable data noted above): add `data/religious-cultural/official-sources.json` + `scripts/update-religious-cultural-source-ledger.js` + `religious-cultural:sources[:check]` npm scripts, mirroring energy/telecom. Bind confident official sources, record honest gaps, and add `.claude/rules/religious-cultural.md`. Never bump a `lastUpdated` stamp without reading the real source.
5. **Workflow + CSS** — make the hub tell a coherent task story; fix broken cross-links. Do NOT add AI-slop CSS (no colored top/left border-accent bars, no gratuitous restyle); respect the existing token system.
6. **SEO/GEO** — verify canonical, hreflang, OG, and add **FAQPage JSON-LD matching the visible FAQ verbatim** (844 tool pages have it; most hubs don't).
7. **Deploy + verify** — commit ONLY your files (never `git commit -a`; a Codex session sweeps with `git add -A`). Fast-forward `main`, `git push origin main`. The production build takes ~18 min — then open `https://afrotools.com/religious-cultural/` in the browser, confirm your changes are live, check console, and fetch any new data file.
8. **Report** — update this row in `docs/CATEGORY-HUB-PROGRESS.md` (status, what shipped, deploy commit).

**Guardrails:** Do NOT bulk-merge or push the ~192 stale local branches — merging them reverts production. Ship only your own work. If you run low on context, write a handoff into the tracker and open a fresh session.

---

### 16. Travel & Tourism — `/travel/`

You are a senior product engineer taking full ownership of the **Travel & Tourism** hub (/travel/) and all its sub-apps.

**Context you inherit (read first):** open `docs/CATEGORY-HUB-PROGRESS.md` and `.claude/rules/energy.md`. The **Energy** hub is the reference implementation: `data/energy/official-sources.json`, `scripts/update-energy-source-ledger.js`, its FAQPage schema, and a live-verified calculator audit. Copy that shape.

**Category focus:** Visa fees, flight/travel-cost tools. Fees are perishable; add a source ledger to immigration/authority pages where claims are legal (visa costs, requirements).

**Do this pass:**
1. **Claim it** — in `docs/CATEGORY-HUB-PROGRESS.md` set this row's Status to `in-progress` and Owner to your session; commit just that line and push, so no other session collides.
2. **Inventory** the hub's tools (read `/travel/index.html`) and drive each one in the browser preview — confirm it loads, calculates, exports, and logs no console errors.
3. **Calculator correctness** — hunt the `country.data.field || 0` bug class (missing data must never render as free/zero; force user input or filter the dropdown — copy the energy pattern). Independently recompute at least one flagship tool's math and confirm the on-screen number matches. Fix what you find.
4. **Source discipline** (for the perishable data noted above): add `data/travel/official-sources.json` + `scripts/update-travel-source-ledger.js` + `travel:sources[:check]` npm scripts, mirroring energy/telecom. Bind confident official sources, record honest gaps, and add `.claude/rules/travel.md`. Never bump a `lastUpdated` stamp without reading the real source.
5. **Workflow + CSS** — make the hub tell a coherent task story; fix broken cross-links. Do NOT add AI-slop CSS (no colored top/left border-accent bars, no gratuitous restyle); respect the existing token system.
6. **SEO/GEO** — verify canonical, hreflang, OG, and add **FAQPage JSON-LD matching the visible FAQ verbatim** (844 tool pages have it; most hubs don't).
7. **Deploy + verify** — commit ONLY your files (never `git commit -a`; a Codex session sweeps with `git add -A`). Fast-forward `main`, `git push origin main`. The production build takes ~18 min — then open `https://afrotools.com/travel/` in the browser, confirm your changes are live, check console, and fetch any new data file.
8. **Report** — update this row in `docs/CATEGORY-HUB-PROGRESS.md` (status, what shipped, deploy commit).

**Guardrails:** Do NOT bulk-merge or push the ~192 stale local branches — merging them reverts production. Ship only your own work. If you run low on context, write a handoff into the tracker and open a fresh session.

---

### 17. Career — `/career/`

You are a senior product engineer taking full ownership of the **Career** hub (/career/) and all its sub-apps.

**Context you inherit (read first):** open `docs/CATEGORY-HUB-PROGRESS.md` and `.claude/rules/energy.md`. The **Energy** hub is the reference implementation: `data/energy/official-sources.json`, `scripts/update-energy-source-ledger.js`, its FAQPage schema, and a live-verified calculator audit. Copy that shape.

**Category focus:** CV, cover-letter, salary tools. Workflow + privacy (keep drafts local). Salary data perishability; audit any salary-benchmark lookups.

**Do this pass:**
1. **Claim it** — in `docs/CATEGORY-HUB-PROGRESS.md` set this row's Status to `in-progress` and Owner to your session; commit just that line and push, so no other session collides.
2. **Inventory** the hub's tools (read `/career/index.html`) and drive each one in the browser preview — confirm it loads, calculates, exports, and logs no console errors.
3. **Calculator correctness** — hunt the `country.data.field || 0` bug class (missing data must never render as free/zero; force user input or filter the dropdown — copy the energy pattern). Independently recompute at least one flagship tool's math and confirm the on-screen number matches. Fix what you find.
4. **Source discipline** (for the perishable data noted above): add `data/career/official-sources.json` + `scripts/update-career-source-ledger.js` + `career:sources[:check]` npm scripts, mirroring energy/telecom. Bind confident official sources, record honest gaps, and add `.claude/rules/career.md`. Never bump a `lastUpdated` stamp without reading the real source.
5. **Workflow + CSS** — make the hub tell a coherent task story; fix broken cross-links. Do NOT add AI-slop CSS (no colored top/left border-accent bars, no gratuitous restyle); respect the existing token system.
6. **SEO/GEO** — verify canonical, hreflang, OG, and add **FAQPage JSON-LD matching the visible FAQ verbatim** (844 tool pages have it; most hubs don't).
7. **Deploy + verify** — commit ONLY your files (never `git commit -a`; a Codex session sweeps with `git add -A`). Fast-forward `main`, `git push origin main`. The production build takes ~18 min — then open `https://afrotools.com/career/` in the browser, confirm your changes are live, check console, and fetch any new data file.
8. **Report** — update this row in `docs/CATEGORY-HUB-PROGRESS.md` (status, what shipped, deploy commit).

**Guardrails:** Do NOT bulk-merge or push the ~192 stale local branches — merging them reverts production. Ship only your own work. If you run low on context, write a handoff into the tracker and open a fresh session.

---

### 18. Small Business — `/small-business/`

You are a senior product engineer taking full ownership of the **Small Business** hub (/small-business/) and all its sub-apps.

**Context you inherit (read first):** open `docs/CATEGORY-HUB-PROGRESS.md` and `.claude/rules/energy.md`. The **Energy** hub is the reference implementation: `data/energy/official-sources.json`, `scripts/update-energy-source-ledger.js`, its FAQPage schema, and a live-verified calculator audit. Copy that shape.

**Category focus:** Invoice, receipt, business-name tools. Workflow coherence and export correctness; privacy (local processing). Mostly client-side.

**Do this pass:**
1. **Claim it** — in `docs/CATEGORY-HUB-PROGRESS.md` set this row's Status to `in-progress` and Owner to your session; commit just that line and push, so no other session collides.
2. **Inventory** the hub's tools (read `/small-business/index.html`) and drive each one in the browser preview — confirm it loads, calculates, exports, and logs no console errors.
3. **Calculator correctness** — hunt the `country.data.field || 0` bug class (missing data must never render as free/zero; force user input or filter the dropdown — copy the energy pattern). Independently recompute at least one flagship tool's math and confirm the on-screen number matches. Fix what you find.
4. **Source discipline** (for the perishable data noted above): add `data/small-business/official-sources.json` + `scripts/update-small-business-source-ledger.js` + `small-business:sources[:check]` npm scripts, mirroring energy/telecom. Bind confident official sources, record honest gaps, and add `.claude/rules/small-business.md`. Never bump a `lastUpdated` stamp without reading the real source.
5. **Workflow + CSS** — make the hub tell a coherent task story; fix broken cross-links. Do NOT add AI-slop CSS (no colored top/left border-accent bars, no gratuitous restyle); respect the existing token system.
6. **SEO/GEO** — verify canonical, hreflang, OG, and add **FAQPage JSON-LD matching the visible FAQ verbatim** (844 tool pages have it; most hubs don't).
7. **Deploy + verify** — commit ONLY your files (never `git commit -a`; a Codex session sweeps with `git add -A`). Fast-forward `main`, `git push origin main`. The production build takes ~18 min — then open `https://afrotools.com/small-business/` in the browser, confirm your changes are live, check console, and fetch any new data file.
8. **Report** — update this row in `docs/CATEGORY-HUB-PROGRESS.md` (status, what shipped, deploy commit).

**Guardrails:** Do NOT bulk-merge or push the ~192 stale local branches — merging them reverts production. Ship only your own work. If you run low on context, write a handoff into the tracker and open a fresh session.

---

### 19. Document & PDF — `/document-pdf/`

You are a senior product engineer taking full ownership of the **Document & PDF** hub (/document-pdf/) and all its sub-apps.

**Context you inherit (read first):** open `docs/CATEGORY-HUB-PROGRESS.md` and `.claude/rules/energy.md`. The **Energy** hub is the reference implementation: `data/energy/official-sources.json`, `scripts/update-energy-source-ledger.js`, its FAQPage schema, and a live-verified calculator audit. Copy that shape.

**Category focus:** Client-side PDF/document generators. Focus: functionality (every generator produces a valid file), privacy (processing stays local), performance, and SEO. Low data-perishability — no ledger needed.

**Do this pass:**
1. **Claim it** — in `docs/CATEGORY-HUB-PROGRESS.md` set this row's Status to `in-progress` and Owner to your session; commit just that line and push, so no other session collides.
2. **Inventory** the hub's tools (read `/document-pdf/index.html`) and drive each one in the browser preview — confirm it loads, calculates, exports, and logs no console errors.
3. **Calculator correctness** — hunt the `country.data.field || 0` bug class (missing data must never render as free/zero; force user input or filter the dropdown — copy the energy pattern). Independently recompute at least one flagship tool's math and confirm the on-screen number matches. Fix what you find.
4. **Source discipline** (for the perishable data noted above): add `data/document-pdf/official-sources.json` + `scripts/update-document-pdf-source-ledger.js` + `document-pdf:sources[:check]` npm scripts, mirroring energy/telecom. Bind confident official sources, record honest gaps, and add `.claude/rules/document-pdf.md`. Never bump a `lastUpdated` stamp without reading the real source.
5. **Workflow + CSS** — make the hub tell a coherent task story; fix broken cross-links. Do NOT add AI-slop CSS (no colored top/left border-accent bars, no gratuitous restyle); respect the existing token system.
6. **SEO/GEO** — verify canonical, hreflang, OG, and add **FAQPage JSON-LD matching the visible FAQ verbatim** (844 tool pages have it; most hubs don't).
7. **Deploy + verify** — commit ONLY your files (never `git commit -a`; a Codex session sweeps with `git add -A`). Fast-forward `main`, `git push origin main`. The production build takes ~18 min — then open `https://afrotools.com/document-pdf/` in the browser, confirm your changes are live, check console, and fetch any new data file.
8. **Report** — update this row in `docs/CATEGORY-HUB-PROGRESS.md` (status, what shipped, deploy commit).

**Guardrails:** Do NOT bulk-merge or push the ~192 stale local branches — merging them reverts production. Ship only your own work. If you run low on context, write a handoff into the tracker and open a fresh session.

---

### 20. Developer Tools — `/developer-tools/`

You are a senior product engineer taking full ownership of the **Developer Tools** hub (/developer-tools/) and all its sub-apps.

**Context you inherit (read first):** open `docs/CATEGORY-HUB-PROGRESS.md` and `.claude/rules/energy.md`. The **Energy** hub is the reference implementation: `data/energy/official-sources.json`, `scripts/update-energy-source-ledger.js`, its FAQPage schema, and a live-verified calculator audit. Copy that shape.

**Category focus:** hash/uuid/qr/json/base64/regex/sql-playground. Encoder/decoder correctness (round-trip tests), edge cases, client-side. SEO + FAQPage. No ledger needed.

**Do this pass:**
1. **Claim it** — in `docs/CATEGORY-HUB-PROGRESS.md` set this row's Status to `in-progress` and Owner to your session; commit just that line and push, so no other session collides.
2. **Inventory** the hub's tools (read `/developer-tools/index.html`) and drive each one in the browser preview — confirm it loads, calculates, exports, and logs no console errors.
3. **Calculator correctness** — hunt the `country.data.field || 0` bug class (missing data must never render as free/zero; force user input or filter the dropdown — copy the energy pattern). Independently recompute at least one flagship tool's math and confirm the on-screen number matches. Fix what you find.
4. **Source discipline** (for the perishable data noted above): add `data/developer-tools/official-sources.json` + `scripts/update-developer-tools-source-ledger.js` + `developer-tools:sources[:check]` npm scripts, mirroring energy/telecom. Bind confident official sources, record honest gaps, and add `.claude/rules/developer-tools.md`. Never bump a `lastUpdated` stamp without reading the real source.
5. **Workflow + CSS** — make the hub tell a coherent task story; fix broken cross-links. Do NOT add AI-slop CSS (no colored top/left border-accent bars, no gratuitous restyle); respect the existing token system.
6. **SEO/GEO** — verify canonical, hreflang, OG, and add **FAQPage JSON-LD matching the visible FAQ verbatim** (844 tool pages have it; most hubs don't).
7. **Deploy + verify** — commit ONLY your files (never `git commit -a`; a Codex session sweeps with `git add -A`). Fast-forward `main`, `git push origin main`. The production build takes ~18 min — then open `https://afrotools.com/developer-tools/` in the browser, confirm your changes are live, check console, and fetch any new data file.
8. **Report** — update this row in `docs/CATEGORY-HUB-PROGRESS.md` (status, what shipped, deploy commit).

**Guardrails:** Do NOT bulk-merge or push the ~192 stale local branches — merging them reverts production. Ship only your own work. If you run low on context, write a handoff into the tracker and open a fresh session.

---

### 21. Image & Design — `/image-design/`

You are a senior product engineer taking full ownership of the **Image & Design** hub (/image-design/) and all its sub-apps.

**Context you inherit (read first):** open `docs/CATEGORY-HUB-PROGRESS.md` and `.claude/rules/energy.md`. The **Energy** hub is the reference implementation: `data/energy/official-sources.json`, `scripts/update-energy-source-ledger.js`, its FAQPage schema, and a live-verified calculator audit. Copy that shape.

**Category focus:** favicon/palette/watermark/meme tools. Functionality + performance (no jank on large images), CSS quality, SEO. Client-side. No ledger needed.

**Do this pass:**
1. **Claim it** — in `docs/CATEGORY-HUB-PROGRESS.md` set this row's Status to `in-progress` and Owner to your session; commit just that line and push, so no other session collides.
2. **Inventory** the hub's tools (read `/image-design/index.html`) and drive each one in the browser preview — confirm it loads, calculates, exports, and logs no console errors.
3. **Calculator correctness** — hunt the `country.data.field || 0` bug class (missing data must never render as free/zero; force user input or filter the dropdown — copy the energy pattern). Independently recompute at least one flagship tool's math and confirm the on-screen number matches. Fix what you find.
4. **Source discipline** (for the perishable data noted above): add `data/image-design/official-sources.json` + `scripts/update-image-design-source-ledger.js` + `image-design:sources[:check]` npm scripts, mirroring energy/telecom. Bind confident official sources, record honest gaps, and add `.claude/rules/image-design.md`. Never bump a `lastUpdated` stamp without reading the real source.
5. **Workflow + CSS** — make the hub tell a coherent task story; fix broken cross-links. Do NOT add AI-slop CSS (no colored top/left border-accent bars, no gratuitous restyle); respect the existing token system.
6. **SEO/GEO** — verify canonical, hreflang, OG, and add **FAQPage JSON-LD matching the visible FAQ verbatim** (844 tool pages have it; most hubs don't).
7. **Deploy + verify** — commit ONLY your files (never `git commit -a`; a Codex session sweeps with `git add -A`). Fast-forward `main`, `git push origin main`. The production build takes ~18 min — then open `https://afrotools.com/image-design/` in the browser, confirm your changes are live, check console, and fetch any new data file.
8. **Report** — update this row in `docs/CATEGORY-HUB-PROGRESS.md` (status, what shipped, deploy commit).

**Guardrails:** Do NOT bulk-merge or push the ~192 stale local branches — merging them reverts production. Ship only your own work. If you run low on context, write a handoff into the tracker and open a fresh session.

---

### 22. Engineering — `/engineering/`

You are a senior product engineer taking full ownership of the **Engineering** hub (/engineering/) and all its sub-apps.

**Context you inherit (read first):** open `docs/CATEGORY-HUB-PROGRESS.md` and `.claude/rules/energy.md`. The **Energy** hub is the reference implementation: `data/energy/official-sources.json`, `scripts/update-energy-source-ledger.js`, its FAQPage schema, and a live-verified calculator audit. Copy that shape.

**Category focus:** BOQ/structural/unit calculators. Formula and unit-conversion correctness is the whole game — verify against worked examples. Watch significant-figure and rounding handling.

**Do this pass:**
1. **Claim it** — in `docs/CATEGORY-HUB-PROGRESS.md` set this row's Status to `in-progress` and Owner to your session; commit just that line and push, so no other session collides.
2. **Inventory** the hub's tools (read `/engineering/index.html`) and drive each one in the browser preview — confirm it loads, calculates, exports, and logs no console errors.
3. **Calculator correctness** — hunt the `country.data.field || 0` bug class (missing data must never render as free/zero; force user input or filter the dropdown — copy the energy pattern). Independently recompute at least one flagship tool's math and confirm the on-screen number matches. Fix what you find.
4. **Source discipline** (for the perishable data noted above): add `data/engineering/official-sources.json` + `scripts/update-engineering-source-ledger.js` + `engineering:sources[:check]` npm scripts, mirroring energy/telecom. Bind confident official sources, record honest gaps, and add `.claude/rules/engineering.md`. Never bump a `lastUpdated` stamp without reading the real source.
5. **Workflow + CSS** — make the hub tell a coherent task story; fix broken cross-links. Do NOT add AI-slop CSS (no colored top/left border-accent bars, no gratuitous restyle); respect the existing token system.
6. **SEO/GEO** — verify canonical, hreflang, OG, and add **FAQPage JSON-LD matching the visible FAQ verbatim** (844 tool pages have it; most hubs don't).
7. **Deploy + verify** — commit ONLY your files (never `git commit -a`; a Codex session sweeps with `git add -A`). Fast-forward `main`, `git push origin main`. The production build takes ~18 min — then open `https://afrotools.com/engineering/` in the browser, confirm your changes are live, check console, and fetch any new data file.
8. **Report** — update this row in `docs/CATEGORY-HUB-PROGRESS.md` (status, what shipped, deploy commit).

**Guardrails:** Do NOT bulk-merge or push the ~192 stale local branches — merging them reverts production. Ship only your own work. If you run low on context, write a handoff into the tracker and open a fresh session.

---

### 23. Creative — `/creative/`

You are a senior product engineer taking full ownership of the **Creative** hub (/creative/) and all its sub-apps.

**Context you inherit (read first):** open `docs/CATEGORY-HUB-PROGRESS.md` and `.claude/rules/energy.md`. The **Energy** hub is the reference implementation: `data/energy/official-sources.json`, `scripts/update-energy-source-ledger.js`, its FAQPage schema, and a live-verified calculator audit. Copy that shape.

**Category focus:** Client-side creative tools. Functionality, CSS quality (no slop), and SEO/FAQPage. No ledger needed.

**Do this pass:**
1. **Claim it** — in `docs/CATEGORY-HUB-PROGRESS.md` set this row's Status to `in-progress` and Owner to your session; commit just that line and push, so no other session collides.
2. **Inventory** the hub's tools (read `/creative/index.html`) and drive each one in the browser preview — confirm it loads, calculates, exports, and logs no console errors.
3. **Calculator correctness** — hunt the `country.data.field || 0` bug class (missing data must never render as free/zero; force user input or filter the dropdown — copy the energy pattern). Independently recompute at least one flagship tool's math and confirm the on-screen number matches. Fix what you find.
4. **Source discipline** (for the perishable data noted above): add `data/creative/official-sources.json` + `scripts/update-creative-source-ledger.js` + `creative:sources[:check]` npm scripts, mirroring energy/telecom. Bind confident official sources, record honest gaps, and add `.claude/rules/creative.md`. Never bump a `lastUpdated` stamp without reading the real source.
5. **Workflow + CSS** — make the hub tell a coherent task story; fix broken cross-links. Do NOT add AI-slop CSS (no colored top/left border-accent bars, no gratuitous restyle); respect the existing token system.
6. **SEO/GEO** — verify canonical, hreflang, OG, and add **FAQPage JSON-LD matching the visible FAQ verbatim** (844 tool pages have it; most hubs don't).
7. **Deploy + verify** — commit ONLY your files (never `git commit -a`; a Codex session sweeps with `git add -A`). Fast-forward `main`, `git push origin main`. The production build takes ~18 min — then open `https://afrotools.com/creative/` in the browser, confirm your changes are live, check console, and fetch any new data file.
8. **Report** — update this row in `docs/CATEGORY-HUB-PROGRESS.md` (status, what shipped, deploy commit).

**Guardrails:** Do NOT bulk-merge or push the ~192 stale local branches — merging them reverts production. Ship only your own work. If you run low on context, write a handoff into the tracker and open a fresh session.

---

### 24. Security — `/security/`

You are a senior product engineer taking full ownership of the **Security** hub (/security/) and all its sub-apps.

**Context you inherit (read first):** open `docs/CATEGORY-HUB-PROGRESS.md` and `.claude/rules/energy.md`. The **Energy** hub is the reference implementation: `data/energy/official-sources.json`, `scripts/update-energy-source-ledger.js`, its FAQPage schema, and a live-verified calculator audit. Copy that shape.

**Category focus:** password generator, phishing-quiz, security tools. Correctness (entropy calc, quiz scoring), privacy (nothing leaves the browser), and clear educational framing. No ledger needed.

**Do this pass:**
1. **Claim it** — in `docs/CATEGORY-HUB-PROGRESS.md` set this row's Status to `in-progress` and Owner to your session; commit just that line and push, so no other session collides.
2. **Inventory** the hub's tools (read `/security/index.html`) and drive each one in the browser preview — confirm it loads, calculates, exports, and logs no console errors.
3. **Calculator correctness** — hunt the `country.data.field || 0` bug class (missing data must never render as free/zero; force user input or filter the dropdown — copy the energy pattern). Independently recompute at least one flagship tool's math and confirm the on-screen number matches. Fix what you find.
4. **Source discipline** (for the perishable data noted above): add `data/security/official-sources.json` + `scripts/update-security-source-ledger.js` + `security:sources[:check]` npm scripts, mirroring energy/telecom. Bind confident official sources, record honest gaps, and add `.claude/rules/security.md`. Never bump a `lastUpdated` stamp without reading the real source.
5. **Workflow + CSS** — make the hub tell a coherent task story; fix broken cross-links. Do NOT add AI-slop CSS (no colored top/left border-accent bars, no gratuitous restyle); respect the existing token system.
6. **SEO/GEO** — verify canonical, hreflang, OG, and add **FAQPage JSON-LD matching the visible FAQ verbatim** (844 tool pages have it; most hubs don't).
7. **Deploy + verify** — commit ONLY your files (never `git commit -a`; a Codex session sweeps with `git add -A`). Fast-forward `main`, `git push origin main`. The production build takes ~18 min — then open `https://afrotools.com/security/` in the browser, confirm your changes are live, check console, and fetch any new data file.
8. **Report** — update this row in `docs/CATEGORY-HUB-PROGRESS.md` (status, what shipped, deploy commit).

**Guardrails:** Do NOT bulk-merge or push the ~192 stale local branches — merging them reverts production. Ship only your own work. If you run low on context, write a handoff into the tracker and open a fresh session.

---

### 25. Language — `/language/`

You are a senior product engineer taking full ownership of the **Language** hub (/language/) and all its sub-apps.

**Context you inherit (read first):** open `docs/CATEGORY-HUB-PROGRESS.md` and `.claude/rules/energy.md`. The **Energy** hub is the reference implementation: `data/energy/official-sources.json`, `scripts/update-energy-source-ledger.js`, its FAQPage schema, and a live-verified calculator audit. Copy that shape.

**Category focus:** Translation/localization tools. i18n correctness (accents, RTL where relevant), functionality, SEO. Coordinate with the FR/SW localization repair work.

**Do this pass:**
1. **Claim it** — in `docs/CATEGORY-HUB-PROGRESS.md` set this row's Status to `in-progress` and Owner to your session; commit just that line and push, so no other session collides.
2. **Inventory** the hub's tools (read `/language/index.html`) and drive each one in the browser preview — confirm it loads, calculates, exports, and logs no console errors.
3. **Calculator correctness** — hunt the `country.data.field || 0` bug class (missing data must never render as free/zero; force user input or filter the dropdown — copy the energy pattern). Independently recompute at least one flagship tool's math and confirm the on-screen number matches. Fix what you find.
4. **Source discipline** (for the perishable data noted above): add `data/language/official-sources.json` + `scripts/update-language-source-ledger.js` + `language:sources[:check]` npm scripts, mirroring energy/telecom. Bind confident official sources, record honest gaps, and add `.claude/rules/language.md`. Never bump a `lastUpdated` stamp without reading the real source.
5. **Workflow + CSS** — make the hub tell a coherent task story; fix broken cross-links. Do NOT add AI-slop CSS (no colored top/left border-accent bars, no gratuitous restyle); respect the existing token system.
6. **SEO/GEO** — verify canonical, hreflang, OG, and add **FAQPage JSON-LD matching the visible FAQ verbatim** (844 tool pages have it; most hubs don't).
7. **Deploy + verify** — commit ONLY your files (never `git commit -a`; a Codex session sweeps with `git add -A`). Fast-forward `main`, `git push origin main`. The production build takes ~18 min — then open `https://afrotools.com/language/` in the browser, confirm your changes are live, check console, and fetch any new data file.
8. **Report** — update this row in `docs/CATEGORY-HUB-PROGRESS.md` (status, what shipped, deploy commit).

**Guardrails:** Do NOT bulk-merge or push the ~192 stale local branches — merging them reverts production. Ship only your own work. If you run low on context, write a handoff into the tracker and open a fresh session.

---

### 26. Sports — `/sports/`

You are a senior product engineer taking full ownership of the **Sports** hub (/sports/) and all its sub-apps.

**Context you inherit (read first):** open `docs/CATEGORY-HUB-PROGRESS.md` and `.claude/rules/energy.md`. The **Energy** hub is the reference implementation: `data/energy/official-sources.json`, `scripts/update-energy-source-ledger.js`, its FAQPage schema, and a live-verified calculator audit. Copy that shape.

**Category focus:** afcon-predictor, matchday, sports tools. Data freshness (fixtures/results) and predictor-logic correctness. Show review dates; do not present stale fixtures as live.

**Do this pass:**
1. **Claim it** — in `docs/CATEGORY-HUB-PROGRESS.md` set this row's Status to `in-progress` and Owner to your session; commit just that line and push, so no other session collides.
2. **Inventory** the hub's tools (read `/sports/index.html`) and drive each one in the browser preview — confirm it loads, calculates, exports, and logs no console errors.
3. **Calculator correctness** — hunt the `country.data.field || 0` bug class (missing data must never render as free/zero; force user input or filter the dropdown — copy the energy pattern). Independently recompute at least one flagship tool's math and confirm the on-screen number matches. Fix what you find.
4. **Source discipline** (for the perishable data noted above): add `data/sports/official-sources.json` + `scripts/update-sports-source-ledger.js` + `sports:sources[:check]` npm scripts, mirroring energy/telecom. Bind confident official sources, record honest gaps, and add `.claude/rules/sports.md`. Never bump a `lastUpdated` stamp without reading the real source.
5. **Workflow + CSS** — make the hub tell a coherent task story; fix broken cross-links. Do NOT add AI-slop CSS (no colored top/left border-accent bars, no gratuitous restyle); respect the existing token system.
6. **SEO/GEO** — verify canonical, hreflang, OG, and add **FAQPage JSON-LD matching the visible FAQ verbatim** (844 tool pages have it; most hubs don't).
7. **Deploy + verify** — commit ONLY your files (never `git commit -a`; a Codex session sweeps with `git add -A`). Fast-forward `main`, `git push origin main`. The production build takes ~18 min — then open `https://afrotools.com/sports/` in the browser, confirm your changes are live, check console, and fetch any new data file.
8. **Report** — update this row in `docs/CATEGORY-HUB-PROGRESS.md` (status, what shipped, deploy commit).

**Guardrails:** Do NOT bulk-merge or push the ~192 stale local branches — merging them reverts production. Ship only your own work. If you run low on context, write a handoff into the tracker and open a fresh session.

---

### 27. Climate & Weather — `/climate/`

You are a senior product engineer FINISHING the **Climate & Weather** hub (/climate/), which is partially done.

**Context you inherit (read first):** open `docs/CATEGORY-HUB-PROGRESS.md` and `.claude/rules/energy.md`. The **Energy** hub is the reference implementation: `data/energy/official-sources.json`, `scripts/update-energy-source-ledger.js`, its FAQPage schema, and a live-verified calculator audit. Copy that shape.

**Category focus:** Calculators already audited (flood/drought saturation bugs fixed). REMAINING: add `data/climate/official-sources.json` + rule file + FAQPage. Bind any published climate/risk figures to a real authority.

**Do this pass:**
1. **Claim it** — in `docs/CATEGORY-HUB-PROGRESS.md` set this row's Status to `in-progress` and Owner to your session; commit just that line and push, so no other session collides.
2. **Inventory** the hub's tools (read `/climate/index.html`) and drive each one in the browser preview — confirm it loads, calculates, exports, and logs no console errors.
3. **Calculator correctness** — hunt the `country.data.field || 0` bug class (missing data must never render as free/zero; force user input or filter the dropdown — copy the energy pattern). Independently recompute at least one flagship tool's math and confirm the on-screen number matches. Fix what you find.
4. **Source discipline** (for the perishable data noted above): add `data/climate/official-sources.json` + `scripts/update-climate-source-ledger.js` + `climate:sources[:check]` npm scripts, mirroring energy/telecom. Bind confident official sources, record honest gaps, and add `.claude/rules/climate.md`. Never bump a `lastUpdated` stamp without reading the real source.
5. **Workflow + CSS** — make the hub tell a coherent task story; fix broken cross-links. Do NOT add AI-slop CSS (no colored top/left border-accent bars, no gratuitous restyle); respect the existing token system.
6. **SEO/GEO** — verify canonical, hreflang, OG, and add **FAQPage JSON-LD matching the visible FAQ verbatim** (844 tool pages have it; most hubs don't).
7. **Deploy + verify** — commit ONLY your files (never `git commit -a`; a Codex session sweeps with `git add -A`). Fast-forward `main`, `git push origin main`. The production build takes ~18 min — then open `https://afrotools.com/climate/` in the browser, confirm your changes are live, check console, and fetch any new data file.
8. **Report** — update this row in `docs/CATEGORY-HUB-PROGRESS.md` (status, what shipped, deploy commit).

**Guardrails:** Do NOT bulk-merge or push the ~192 stale local branches — merging them reverts production. Ship only your own work. If you run low on context, write a handoff into the tracker and open a fresh session.

---

### 28. Uniquely African — `/uniquely-african/`

You are a senior product engineer FINISHING the **Uniquely African** hub (/uniquely-african/), which is partially done.

**Context you inherit (read first):** open `docs/CATEGORY-HUB-PROGRESS.md` and `.claude/rules/energy.md`. The **Energy** hub is the reference implementation: `data/energy/official-sources.json`, `scripts/update-energy-source-ledger.js`, its FAQPage schema, and a live-verified calculator audit. Copy that shape.

**Category focus:** AfroKitchen already has `.claude/rules/afrokitchen.md` — follow it. Audit the OTHER sub-apps in this category. Respect generated-output boundaries in the rule.

**Do this pass:**
1. **Claim it** — in `docs/CATEGORY-HUB-PROGRESS.md` set this row's Status to `in-progress` and Owner to your session; commit just that line and push, so no other session collides.
2. **Inventory** the hub's tools (read `/uniquely-african/index.html`) and drive each one in the browser preview — confirm it loads, calculates, exports, and logs no console errors.
3. **Calculator correctness** — hunt the `country.data.field || 0` bug class (missing data must never render as free/zero; force user input or filter the dropdown — copy the energy pattern). Independently recompute at least one flagship tool's math and confirm the on-screen number matches. Fix what you find.
4. **Source discipline** (for the perishable data noted above): add `data/uniquely-african/official-sources.json` + `scripts/update-uniquely-african-source-ledger.js` + `uniquely-african:sources[:check]` npm scripts, mirroring energy/telecom. Bind confident official sources, record honest gaps, and add `.claude/rules/uniquely-african.md`. Never bump a `lastUpdated` stamp without reading the real source.
5. **Workflow + CSS** — make the hub tell a coherent task story; fix broken cross-links. Do NOT add AI-slop CSS (no colored top/left border-accent bars, no gratuitous restyle); respect the existing token system.
6. **SEO/GEO** — verify canonical, hreflang, OG, and add **FAQPage JSON-LD matching the visible FAQ verbatim** (844 tool pages have it; most hubs don't).
7. **Deploy + verify** — commit ONLY your files (never `git commit -a`; a Codex session sweeps with `git add -A`). Fast-forward `main`, `git push origin main`. The production build takes ~18 min — then open `https://afrotools.com/uniquely-african/` in the browser, confirm your changes are live, check console, and fetch any new data file.
8. **Report** — update this row in `docs/CATEGORY-HUB-PROGRESS.md` (status, what shipped, deploy commit).

**Guardrails:** Do NOT bulk-merge or push the ~192 stale local branches — merging them reverts production. Ship only your own work. If you run low on context, write a handoff into the tracker and open a fresh session.

---

### 29. Government — `/government/`

You are a senior product engineer doing a LIGHT verification-and-SEO pass on the **Government** hub (/government/), which already has the full source-ledger treatment.

**Context you inherit (read first):** open `docs/CATEGORY-HUB-PROGRESS.md` and `.claude/rules/energy.md`. The **Energy** hub is the reference implementation: `data/energy/official-sources.json`, `scripts/update-energy-source-ledger.js`, its FAQPage schema, and a live-verified calculator audit. Copy that shape.

**Category focus:** Ledger + rule already exist. REMAINING (light pass): add FAQPage schema to the hub and re-verify counts align across cards/metadata/JSON-LD. Run `npm run government:sources:check`.

**Do this pass:**
1. **Claim it** — in `docs/CATEGORY-HUB-PROGRESS.md` set this row's Status to `in-progress` and Owner to your session; commit just that line and push, so no other session collides.
2. **Inventory** the hub's tools (read `/government/index.html`) and drive each one in the browser preview — confirm it loads, calculates, exports, and logs no console errors.
3. **Calculator correctness** — hunt the `country.data.field || 0` bug class (missing data must never render as free/zero; force user input or filter the dropdown — copy the energy pattern). Independently recompute at least one flagship tool's math and confirm the on-screen number matches. Fix what you find.
4. **Source discipline** (already done — just run the existing `:sources:check` and confirm it passes).
5. **Workflow + CSS** — make the hub tell a coherent task story; fix broken cross-links. Do NOT add AI-slop CSS (no colored top/left border-accent bars, no gratuitous restyle); respect the existing token system.
6. **SEO/GEO** — verify canonical, hreflang, OG, and add **FAQPage JSON-LD matching the visible FAQ verbatim** (844 tool pages have it; most hubs don't).
7. **Deploy + verify** — commit ONLY your files (never `git commit -a`; a Codex session sweeps with `git add -A`). Fast-forward `main`, `git push origin main`. The production build takes ~18 min — then open `https://afrotools.com/government/` in the browser, confirm your changes are live, check console, and fetch any new data file.
8. **Report** — update this row in `docs/CATEGORY-HUB-PROGRESS.md` (status, what shipped, deploy commit).

**Guardrails:** Do NOT bulk-merge or push the ~192 stale local branches — merging them reverts production. Ship only your own work. If you run low on context, write a handoff into the tracker and open a fresh session.

---

### 30. Telecom & Mobile — `/telecom/`

You are a senior product engineer doing a LIGHT verification-and-SEO pass on the **Telecom & Mobile** hub (/telecom/), which already has the full source-ledger treatment.

**Context you inherit (read first):** open `docs/CATEGORY-HUB-PROGRESS.md` and `.claude/rules/energy.md`. The **Energy** hub is the reference implementation: `data/energy/official-sources.json`, `scripts/update-energy-source-ledger.js`, its FAQPage schema, and a live-verified calculator audit. Copy that shape.

**Category focus:** Ledger + rule already exist. REMAINING (light pass): add FAQPage schema; confirm no dropdown offers more markets than the dataset covers. Run `npm run telecom:sources:check`.

**Do this pass:**
1. **Claim it** — in `docs/CATEGORY-HUB-PROGRESS.md` set this row's Status to `in-progress` and Owner to your session; commit just that line and push, so no other session collides.
2. **Inventory** the hub's tools (read `/telecom/index.html`) and drive each one in the browser preview — confirm it loads, calculates, exports, and logs no console errors.
3. **Calculator correctness** — hunt the `country.data.field || 0` bug class (missing data must never render as free/zero; force user input or filter the dropdown — copy the energy pattern). Independently recompute at least one flagship tool's math and confirm the on-screen number matches. Fix what you find.
4. **Source discipline** (already done — just run the existing `:sources:check` and confirm it passes).
5. **Workflow + CSS** — make the hub tell a coherent task story; fix broken cross-links. Do NOT add AI-slop CSS (no colored top/left border-accent bars, no gratuitous restyle); respect the existing token system.
6. **SEO/GEO** — verify canonical, hreflang, OG, and add **FAQPage JSON-LD matching the visible FAQ verbatim** (844 tool pages have it; most hubs don't).
7. **Deploy + verify** — commit ONLY your files (never `git commit -a`; a Codex session sweeps with `git add -A`). Fast-forward `main`, `git push origin main`. The production build takes ~18 min — then open `https://afrotools.com/telecom/` in the browser, confirm your changes are live, check console, and fetch any new data file.
8. **Report** — update this row in `docs/CATEGORY-HUB-PROGRESS.md` (status, what shipped, deploy commit).

**Guardrails:** Do NOT bulk-merge or push the ~192 stale local branches — merging them reverts production. Ship only your own work. If you run low on context, write a handoff into the tracker and open a fresh session.

---

### 31. Transport — `/transport/`

You are a senior product engineer doing a LIGHT verification-and-SEO pass on the **Transport** hub (/transport/), which already has the full source-ledger treatment.

**Context you inherit (read first):** open `docs/CATEGORY-HUB-PROGRESS.md` and `.claude/rules/energy.md`. The **Energy** hub is the reference implementation: `data/energy/official-sources.json`, `scripts/update-energy-source-ledger.js`, its FAQPage schema, and a live-verified calculator audit. Copy that shape.

**Category focus:** Ledger + rule already exist. REMAINING (light pass): add FAQPage schema; re-verify hub counts. Run `npm run transport:sources:check`.

**Do this pass:**
1. **Claim it** — in `docs/CATEGORY-HUB-PROGRESS.md` set this row's Status to `in-progress` and Owner to your session; commit just that line and push, so no other session collides.
2. **Inventory** the hub's tools (read `/transport/index.html`) and drive each one in the browser preview — confirm it loads, calculates, exports, and logs no console errors.
3. **Calculator correctness** — hunt the `country.data.field || 0` bug class (missing data must never render as free/zero; force user input or filter the dropdown — copy the energy pattern). Independently recompute at least one flagship tool's math and confirm the on-screen number matches. Fix what you find.
4. **Source discipline** (already done — just run the existing `:sources:check` and confirm it passes).
5. **Workflow + CSS** — make the hub tell a coherent task story; fix broken cross-links. Do NOT add AI-slop CSS (no colored top/left border-accent bars, no gratuitous restyle); respect the existing token system.
6. **SEO/GEO** — verify canonical, hreflang, OG, and add **FAQPage JSON-LD matching the visible FAQ verbatim** (844 tool pages have it; most hubs don't).
7. **Deploy + verify** — commit ONLY your files (never `git commit -a`; a Codex session sweeps with `git add -A`). Fast-forward `main`, `git push origin main`. The production build takes ~18 min — then open `https://afrotools.com/transport/` in the browser, confirm your changes are live, check console, and fetch any new data file.
8. **Report** — update this row in `docs/CATEGORY-HUB-PROGRESS.md` (status, what shipped, deploy commit).

**Guardrails:** Do NOT bulk-merge or push the ~192 stale local branches — merging them reverts production. Ship only your own work. If you run low on context, write a handoff into the tracker and open a fresh session.

---

### 32. Energy & Utilities — `/energy/`

You are a senior product engineer doing a LIGHT verification-and-SEO pass on the **Energy & Utilities** hub (/energy/), which already has the full source-ledger treatment.

**Context you inherit (read first):** open `docs/CATEGORY-HUB-PROGRESS.md` and `.claude/rules/energy.md`. The **Energy** hub is the reference implementation: `data/energy/official-sources.json`, `scripts/update-energy-source-ledger.js`, its FAQPage schema, and a live-verified calculator audit. Copy that shape.

**Category focus:** DONE — reference implementation. Only re-open to refresh the 2026-03 dataset stamp against real regulator notices (never bump the stamp without reading the source), or to extend regulator coverage beyond the current 12/54 in the ledger.

**Do this pass:**
1. **Claim it** — in `docs/CATEGORY-HUB-PROGRESS.md` set this row's Status to `in-progress` and Owner to your session; commit just that line and push, so no other session collides.
2. **Inventory** the hub's tools (read `/energy/index.html`) and drive each one in the browser preview — confirm it loads, calculates, exports, and logs no console errors.
3. **Calculator correctness** — hunt the `country.data.field || 0` bug class (missing data must never render as free/zero; force user input or filter the dropdown — copy the energy pattern). Independently recompute at least one flagship tool's math and confirm the on-screen number matches. Fix what you find.
4. **Source discipline** (already done — just run the existing `:sources:check` and confirm it passes).
5. **Workflow + CSS** — make the hub tell a coherent task story; fix broken cross-links. Do NOT add AI-slop CSS (no colored top/left border-accent bars, no gratuitous restyle); respect the existing token system.
6. **SEO/GEO** — verify canonical, hreflang, OG, and add **FAQPage JSON-LD matching the visible FAQ verbatim** (844 tool pages have it; most hubs don't).
7. **Deploy + verify** — commit ONLY your files (never `git commit -a`; a Codex session sweeps with `git add -A`). Fast-forward `main`, `git push origin main`. The production build takes ~18 min — then open `https://afrotools.com/energy/` in the browser, confirm your changes are live, check console, and fetch any new data file.
8. **Report** — update this row in `docs/CATEGORY-HUB-PROGRESS.md` (status, what shipped, deploy commit).

**Guardrails:** Do NOT bulk-merge or push the ~192 stale local branches — merging them reverts production. Ship only your own work. If you run low on context, write a handoff into the tracker and open a fresh session.

---

