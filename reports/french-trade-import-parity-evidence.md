# French Trade & Import parity evidence

## Scope identity

- Baseline: `8ce5cac175e42201968b1f7540752d6acf92d4ca`
- Exact denominator: 22 English canonical Trade & Import owners
- Manifest: `data/localization/fr-trade-import-parity.json`
- Browser server root: `C:\Users\Oza\.codex\worktrees\fr-parity-product-20260728`
- Reserved browser port: `43029`

## Accepted scope

- Accepted routes: **22/22**
- Physical French routes: 22/22
- Native French owners: 22/22
- English iframe/transplant routes: 0/22
- Canonical, OG and reciprocal hreflang contract: 22/22
- Dedicated local WebP artwork: 22/22
- French AI owner routing: 22/22
- French Trade hub: exact 22-owner set; unrelated customs-duty adjunct excluded
- Deleted tracked files: 0

## Product and engine parity

The 20 generated native pages are owned by
`scripts/build-fr-trade-parity-pages.js`; ECOWAS Levy and EAC CET retain their
existing native owners. Established families call the same accepted data or
calculation owners as English: HS Lookup, AfCFTA, Landed Cost, Shipping,
FX Impact, LC Fees, Export Documents, COO, Demurrage, Incoterms, Trade Finance,
Commodity, Payment, ECOWAS, SADC and EAC.

`engines/src/trade-utility-engine.js` remains the shared DOM-free owner for the
six utility families. Proforma and Packing List now expose ten item rows and
the richer party, routing and document fields present in English. Bill of
Lading includes booking, issue/on-board, receipt/delivery, originals, freight
and jurisdiction fields. Cross-border Data is no longer a mismatched checklist:
it is a 15-country law, regulator, mechanism and compliance-step explorer using
the shared country-profile owner. Customs Time now reproduces the English
10-port/corridor profiles, six goods families, three documentation states,
agent-fee and storage model through the shared customs-clearance owner.

All 22 routes have valid fixtures, fail-closed invalid coverage where the
workflow accepts numeric/user inputs, and locally generated exports. The
programme export suite downloads and reopens JSON, CSV, TXT and PDF for every
route; PDF content is parsed rather than accepted by signature alone.

## Browser and quality proof

- 41/41 owner/workflow/export browser tests passed.
- 23/23 route-and-hub browser tests passed.
- Every physical route was checked at 320px and 375px, at 200% reflow, in
  explicit light/dark and system dark modes, with keyboard focus, no horizontal
  overflow, and no console/page errors.
- Shared utility engine fixtures: 6/6 passed.
- English pre/post owner parity fixtures: 5/5 passed.
- Static parity contract: 22/22 passed.
- Hreflang validator: all native equivalents indexable, self-canonical,
  locale-correct and reciprocal.
- AI French route-map check, lint, type-check and `git diff --check`: passed.

## Privacy, source and limitation boundaries

All calculations and document exports remain local to the browser and ungated.
The cross-border page requests only a country selection and never personal
data. Regulatory, tariff, port and corridor results retain planning-only
warnings and official-source links; none claim live authority responses,
official classification, filing, legal approval or guaranteed clearance.

## Commands

- `node tests/fr-trade-utility-engine.test.js`
- `node tests/trade-utility-english-parity.test.js`
- `node scripts/audit-fr-trade-parity.js`
- `PORT=43029 playwright test tests/e2e/fr-trade-established-engine.spec.js tests/e2e/fr-trade-utility-workflows.spec.js --workers=1`
- `PORT=43029 playwright test tests/e2e/fr-trade-import-parity.spec.js --workers=1`
- `npm run ai:french-routes:check`
- `npm run validate:hreflang`
- `npm run lint`
- `npm run type-check`
- `git diff --check`
- `git diff --diff-filter=D --summary`
