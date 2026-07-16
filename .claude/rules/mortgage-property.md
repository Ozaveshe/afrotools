# Mortgage & Property Hub Rule

Applies to:

- `mortgage-property/index.html`
- `tools/mortgage-calculator/**`, `tools/stamp-duty/**`, `tools/mortgage-affordability/**`, `tools/home-loan-eligibility/**`
- `tools/property-transfer-cost/**`, `tools/property-cgt/**`, `tools/rental-yield/**`, `tools/rent-vs-buy/**`
- `tools/rent-affordability/**`, `tools/property-roi/**`, `tools/property-valuation/**`, `tools/first-home-buyer/**`
- `tools/property-mgmt-fees/**`, `tools/agent-commission/**`, `tools/service-charge/**`, `tools/short-let-calc/**`
- `tools/building-materials/**`, `tools/construction-budget/**`, `tools/dev-feasibility/**`, `tools/survey-cost/**`
- `tools/home-renovation-cost/**`, `tools/land-title-check/**`, `tools/tenant-screening/**`, `tools/rental-agreement/**`
- `tools/plot-converter/**`, `tools/building-permit/**`, `tools/diaspora-property/**`, `tools/offplan-vs-ready/**`
- `data/mortgage-property/**`
- `scripts/update-mortgage-property-source-ledger.js`

## Why this rule exists

Mortgage & Property mixes statute-set transaction taxes with market interest rates, and both are perishable. Stamp duty, transfer duty and property CGT change with a Finance Act or a gazetted notice; central-bank policy rates move every MPC meeting; commercial mortgage rates are lender offers on top. Unlike energy, telecom, government and transport, this hub had **no central dataset file** — every tool hard-codes its own country rate table inside `tools/<tool>/index.html`, so a stale rate can hide in any one of 28 files with nothing tying it to a source. The ledger added in July 2026 binds the *authority* for each perishable claim class and records the rest as honest gaps.

## Rules

- Use `data/mortgage-property/official-sources.json` as the source map before changing any public tax rate, transfer-duty band, CGT rate or policy rate.
- Run `npm run mortgage-property:sources` after adding, removing, or changing source URLs. Use `npm run mortgage-property:sources:check` for release proof.
- **Never** update a stamp-duty band, transfer-duty scale, CGT rate or policy rate because a URL's content hash changed. Read the gazetted Finance Act, tax schedule or MPC statement — same standard as `.claude/rules/government.md`.
- A **revenue authority** (FIRS, KRA, SARS, GRA, TRA, URA, ETA, DGI) always outranks a law-firm summary, property portal or bank marketing page for a tax rate. A **central bank** is authoritative for the *policy rate only*, never for the mortgage rate a bank quotes.
- Commercial mortgage rates, per-sqm valuations, building-material prices, construction cost/sqm, short-let nightly rates and agent commissions are **commercial** data, recorded in the ledger as unsourced by design. Present them as planning-grade ranges with a review date — never as an official or guaranteed rate.
- Housing schemes (NHF/FMBN, FLISP/DHS, KMRC) publish their own subsidised rates and eligibility. Bind the scheme administrator, not a news article.
- Only 8 of the ~15 markets these tools price have a bound authority URL today. The rest live in the ledger's `gaps.authoritiesWithoutUrl` block. An entry there is a known liability, not a to-do — do not delete one without either finding the source or showing the figure as planning-grade.
- Keep `gaps` honest. Do not delete an `unsourcedClaims` class or an `authoritiesWithoutUrl` entry without either binding a source or removing the claim it covers.

## The bug class to watch for

`var rate = country.data[cc] || 0` (or `(COUNTRIES[cc] || {}).stampRate || 0`) converts *missing data* into *zero*, which then renders as **free** — a stamp duty of 0, a transfer cost of 0, "no CGT" — and silently wins a comparison. This is the same defect telecom's `roaming-cost` and energy's `generator-fuel` shipped.

The tell: **a country/city selector that offers more options than the rate table has keys.** The fix pattern:

- **Filter the selector** to countries the rate table actually covers (telecom's `tv-compare`/`internet-compare` pattern), or
- **Force user input** and block the calculation when the required rate is `<= 0` (energy's `generator-fuel` pattern).

A tax or fee that is genuinely zero (e.g. SA transfer duty under R1.1M, a first-time-buyer exemption) must be an **explicit, labelled** `amount: 0` with a note — not a silent `|| 0` fallthrough. The two are indistinguishable in the output; only the code shows which you meant.

## Freshness

Each tool carries its own "Reviewed"/"Rates as of" stamp. That is a floor, not a per-figure date. A stamp-duty band, transfer-duty scale or policy rate older than `highRiskCadenceDays` (90) should be shown as planning-grade with its review date, not as current. Do not claim rates are "updated regularly" — 28 independent hard-coded tables cannot support that claim.

## Validation

- `npm run mortgage-property:sources:check`
- `npm run check-links` for broad route changes.
