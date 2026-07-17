# Insurance Hub Rule

Applies to:

- `insurance/index.html`
- `tools/car-insurance/**`, `tools/motor-third-party/**`
- `tools/health-insurance-compare/**`, `tools/health-contribution/**`
- `tools/life-insurance-calc/**`, `tools/funeral-insurance/**`, `tools/travel-insurance/**`
- `tools/business-insurance/**`, `tools/professional-indemnity/**`, `tools/fire-insurance/**`
- `tools/marine-insurance/**`, `tools/crop-insurance-calc/**`, `tools/microinsurance/**`
- `tools/workers-comp/**`, `tools/claim-tracker/**`, `tools/insurance-fraud-checker/**`
- `engines/*-insurance-engine.js`, `engines/{motor-third-party,workers-comp,professional-indemnity,health-contribution,life-insurance-calc,funeral-insurance,marine-insurance,fire-insurance,business-insurance,crop-insurance-calc,microinsurance,travel-insurance,health-insurance-compare}-engine.js`
- `data/insurance/**`, `data/insurance-data.json`
- `assets/js/insurance-workbench.js`, `assets/css/insurance*.css`
- `scripts/update-insurance-source-ledger.js`

## Why this rule exists

Insurance holds perishable public numbers: motor third-party tariffs, comprehensive rate bands, statutory health-fund contribution rates, workers-compensation rates and penetration figures. Tariffs move with finance acts, regulator circulars and CIMA-code revisions. Until July 2026 the hub had no source ledger — unlike government, transport, telecom and energy — even though a regulator name already sat on every one of the 54 rows in `data/insurance/country-insurance-index.js`, unbound to the numbers it was meant to justify.

A July 2026 audit also found the site's dominant defect in these calculators: a required monetary input (`parseFloat(x)||0`) defaulting to `0` rendered a **premium of 0 — insurance shown as free**. The car-insurance tool returned "₦0 — ₦0" comprehensive cover whenever the vehicle value was left blank; workers-comp, professional-indemnity, marine, fire and business had the same shape. Separately, `health-contribution` returned **₦0 for every split-contribution market** (Nigeria, Egypt, Morocco) because the engine only read `contribution.rate` and ignored the `{ employee, employer }` shape.

## Rules

- Use `data/insurance/official-sources.json` as the source map before changing any public insurance fact. Run `npm run insurance:sources` after adding, removing, or changing source URLs; `npm run insurance:sources:check` for release proof.
- **Never** update a motor tariff, comprehensive rate band or statutory contribution rate because a URL's content hash changed. Open the page and read the gazetted circular or CIMA code article — same standard as `.claude/rules/government.md`.
- A regulator source always outranks an insurer, broker or aggregator page for the same claim. Comprehensive rate bands, life/business rates, HMO premiums and microinsurance terms are commercial and are recorded in the ledger as unsourced by design — never present them as regulated tariffs.
- Only 25 of 54 markets have a bound insurance-regulator URL today. The other 29 live in the ledger's `gaps.regulatorsWithoutUrl` block. Binding a regulator's home page is **not** the same as reading its tariff: a bound market's premium stays planning-grade until a published tariff is read and recorded in `verifiedFigures`. An entry there is a known liability, not a to-do. Do not delete one without either finding the source or showing the figure as planning-grade.
- Statutory health-fund rates (NHIA, SHIF/SHA, AMO/CNSS, CNAM, Mutuelle, CBHI, CMU) are set by national health funds, **not** by the insurance regulator. Kenya (SHA — SHI Regs 2024, LN 49, reg 17), Tunisia (CNAM — Loi 2004-71) and Tanzania (NHIF Act Cap 395) are bound and recorded in `verifiedFigures` with the date they were read. Bind each remaining fund's circular before presenting its rate as current.
- **Never invent an employer contribution.** A contribution is only ever an employer cost if the data carries an explicit `{ employee, employer }` split. Where a market publishes a single rate, the engine applies it to the salary and renders the employer share as **"Not published"**. The old `employer = rate × 1.5` heuristic fabricated employer cost — it told Kenyan employers they owed a 4.125% match that **does not exist in law** (SHIF is an employee deduction; the employer only remits), and turned Tunisia's real 2.75/4 split into 6.75/10.125. Statutory floors (e.g. Kenya's KES 300/month minimum) must be honoured via `contribution.min`.
- Anything recorded in `verifiedFigures` is the **only** class of figure that may be presented as current; it must name the country, field, value, the date read, and the `sourceId` it was read from. `insurance:sources:check` enforces that shape and warns once a verified figure passes `reviewCadenceDays`.
- Keep `gaps` honest. Do not delete an `unsourcedClaims` class without either binding a source or removing the claim it covers.

## Engines are build artifacts

`engines/*-engine.js` are **minified from `engines/src/*-engine.js`** by `scripts/minify.js`, which runs inside `build:deploy` on every Netlify build. **Edit the `src` file.** A fix applied only to the `engines/*.js` artifact is silently overwritten at deploy and never goes live — this happened in the July 2026 pass: the premium=0 guards shipped in `aadc3b7` had no effect until the same fixes were applied to `engines/src/` in `1d5101f`. Regenerate the artifact (`node scripts/minify.js --only=<engine>`) so src and artifact stay consistent, and verify the live file after deploy:
`curl -s https://afrotools.com/engines/<name>-engine.js | grep "<your guard string>"`.

## The bug class to watch for

`var v = parseFloat(input.vehicleValue) || 0` followed by `premium = v * rate` converts *missing input* into *free cover*, which then reads as "insurance costs 0". The fix pattern now lives in this category and must be preserved:

- The premium engines **force the user-entered monetary input** and return `{ error: "…" }` (surfaced by each page's `if(r.error){alert(r.error);return;}`) when the value is `<= 0`, rather than costing cover at zero. Required inputs: `vehicleValue` (car), `annualPayroll` (workers-comp), `annualRevenue`/`coverLimit` (professional-indemnity), `cifValue` (marine), `propertyValue` (fire), revenue/property/stock (business), `grossSalary` (health-contribution, percentage schemes), and at least one need component (life).
- **Data** lookups fall back to sensible **non-zero** defaults (e.g. `motor.thirdParty ? … : {min:5e3,max:15e3}`), never `0`.
- Third-party is a **regulated tariff**, not driver-risk-rated: `car-insurance` shows the published band as-is and does not discount a `min==max` statutory rate (e.g. Nigeria's NAICOM ₦15,000) below its floor.
- A genuine zero means "no priced product", not "free": South Africa has no compulsory motor third-party (RAF via fuel levy), so `thirdParty.min==max==0` renders **"Not applicable"**, never a fabricated premium.

Any calculator input or dropdown that can produce a `0`-cost result from a blank field is the tell. Copy the force-user-input pattern; never default a premium base to zero.

## Freshness

`data/insurance/country-insurance-index.js` carries **no** `lastUpdated` stamp. Freshness is tracked in the ledger against `data/insurance-data.json:_metadata.lastUpdated` as a floor, not a per-figure date. Surfaces that render a motor tariff or contribution rate older than `highRiskCadenceDays` (60) should label it planning-grade with its review date. Do not claim insurance prices are "updated regularly" — the codebase cannot support that claim, and `insurance:sources:check` will warn once the stamp passes the cadence. Adding a `lastUpdated` stamp to the calculator seed is a recorded gap.

## Validation

- `npm run insurance:sources:check`
- `npm run check-links` for broad route changes.
