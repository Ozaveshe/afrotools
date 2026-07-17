# Salary & Income Tax Hub Rule

Applies to:

- `salary-tax/index.html`, `salary-tax/**`
- Country PAYE pages: `*/`-`*-paye.html` and `*/`-`*-salary-tax.html` (e.g. `kenya/ke-paye.html`, `nigeria/ng-salary-tax.html`)
- `assets/js/engines/*-paye.js`, `engines/francophone-paye-engine.js`, `engines/afropayroll-os-engine.js`
- `assets/css/salary-tax*.css`, `assets/css/paye-hub-shortcuts.css`
- `data/salary-tax/**`
- `scripts/update-salary-tax-source-ledger.js`

## Why this rule exists

This hub holds the site's highest-stakes legal figures: PAYE / income-tax bands, personal reliefs, tax-free thresholds and statutory deduction rates (NSSF, SHIF/NHIF, pension, social security). They change with each country's **finance act or amendment act**, not on a calendar, and a wrong band silently mis-states someone's take-home pay or their filing.

A July 2026 audit found a live, high-stakes correctness bug in the flagship **Kenya PAYE** page: it deducted the Affordable Housing Levy (AHL) from net pay only and **did not** reduce taxable income by it — and a prominent callout advertised this as "the correct post-repeal calculation." KRA's own public notice on the *Tax Laws (Amendment) Act, 2024* (effective 27 Dec 2024) lists AHL as **allowable deduction #1** and SHIF as **#3**: both reduce taxable employment income. What was repealed is the separate **15% affordable-housing relief**, not the deduction. The page overstated PAYE for every Kenyan (KES ~225/month at a 50k salary). The fix: include AHL in the taxable-income subtraction, and correct the copy. The shared `assets/js/engines/ke-paye.js` was already correct; the page had its own inline logic that was not.

The lesson: **read the Act, not the headline** — and confirm the page's inline calculator matches the shared engine.

## Rules

- Use `data/salary-tax/official-sources.json` as the source map before changing any public salary-tax fact. Run `npm run salary-tax:sources` after adding, removing, or changing source URLs; use `npm run salary-tax:sources:check` for release proof.
- **Never** update a band, relief, threshold or statutory rate because a URL's content hash changed. Open the page and read the gazetted Act or the revenue authority's published notice — same standard as `.claude/rules/government.md` and `.claude/rules/energy.md`. A changed page is not a rate change.
- A **revenue authority** (KRA, FIRS, SARS, GRA, URA, TRA, RRA, ZRA, ZIMRA, MRA, RSL, BURS, NamRA, ERS, SRC, ETA, …) always outranks a payroll vendor, aggregator or commercial "net pay calculator" for the same claim.
- Only 17 of 54 markets have a bound revenue-authority URL today. The other 37 live in the ledger's `gaps.revenueAuthoritiesWithoutUrl` block — each is a known liability, not a to-do. Do not delete one without either finding the official URL or showing the figure as planning-grade.
- **Statutory deduction ceilings are the most perishable numbers here** and move on their own schedule, separate from the tax bands. Kenya's NSSF UEL alone went 18,000 → 72,000 → 108,000 across three years. Never carry a ceiling forward without reading the operative gazetted schedule.
- Treat blocked or unreachable authority portals as a manual-review queue. A page that did not load is not evidence the band is unchanged.
- Keep `gaps` honest. Do not delete an `unsourcedClaims` class without either binding a source or removing the claim it covers.

## The bug class to watch for

Two distinct defects live in this hub:

1. **Missing table → zero tax.** A per-country band/rate lookup that resolves to `|| 0` (or `|| {}` then `(x.rate||0)`) turns a missing tax table into "no tax," which then looks like a *great* salary. The July 2026 audit confirmed the current engines guard this — `ke-paye` validates the salary and blocks calculation on `<= 0`; `francophone-paye-engine` returns `{error:'Country not configured'}` for an unknown country; `salary-compare` populates its dropdown from the same `COUNTRIES` object it reads. **Any new multi-country tool must keep that pattern** — filter the dropdown to configured countries or force user input, never default a missing table to zero. The tell is a dropdown offering more countries than the config actually covers.

2. **Wrong deduction/relief treatment.** The Kenya AHL bug was not a zero-default — the math was internally consistent, it just applied the wrong legal rule. Recompute at least one salary by hand against the authority's worked example before trusting a page, and make sure the page's inline logic and the shared engine agree.

## Freshness

Country PAYE pages carry their own "Last verified" / "Updated" stamp. That is a floor, not a per-figure date. A page rendering a band older than `highRiskCadenceDays` (90) should present it as a planning-grade estimate with its review date and the authority link, exactly as the pages already do ("Confirm with KRA or a qualified tax professional"). Do not claim tax tables are "updated regularly" beyond what the codebase can support. Only bump a "Last verified" stamp when you have actually re-read the operative Act/notice — as was done for `kenya/ke-paye.html` in July 2026.

## Validation

- `npm run salary-tax:sources:check`
- `npm run check-links` for broad route changes.
