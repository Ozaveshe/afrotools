# French Insurance 16-App Parity Evidence

Date: 2026-07-29

Scope: local implementation and verification only

Acceptance denominator: 16 canonical English Insurance app owners

## Denominator

- Canonical English app owners: 16/16
- Expanded English experiences: 322 (reported separately; not an app-owner denominator)
- Canonical French app owners: 16/16
- Existing expanded French Insurance records: 115 (reported separately; not accepted by implication)
- Native French hub cards and ItemList entries: 16/16

The accepted owners are:

1. `car-insurance` -> `/fr/tools/assurance-auto/`
2. `health-insurance-compare` -> `/fr/tools/comparateur-assurance-sante/`
3. `life-insurance-calc` -> `/fr/tools/assurance-vie/`
4. `funeral-insurance` -> `/fr/tools/assurance-obseques/`
5. `motor-third-party` -> `/fr/tools/prime-responsabilite-auto/`
6. `business-insurance` -> `/fr/tools/assurance-entreprise/`
7. `travel-insurance` -> `/fr/tools/assurance-voyage/`
8. `workers-comp` -> `/fr/tools/indemnisation-accident-travail/`
9. `health-contribution` -> `/fr/tools/contribution-sante/`
10. `claim-tracker` -> `/fr/tools/suivi-sinistre-assurance/`
11. `crop-insurance-calc` -> `/fr/tools/assurance-recolte/`
12. `fire-insurance` -> `/fr/tools/assurance-incendie/`
13. `insurance-fraud-checker` -> `/fr/tools/signaux-fraude-assurance/`
14. `marine-insurance` -> `/fr/tools/assurance-maritime-cargo/`
15. `microinsurance` -> `/fr/tools/prime-microassurance/`
16. `professional-indemnity` -> `/fr/tools/assurance-responsabilite-professionnelle/`

## Product Contract

- The English formulas are frozen in `data/insurance/assumption-contract.json` and executed by the DOM-free shared engine.
- French pages use native labels and risk prompts, explicit currencies without silent FX conversion, invalid-state feedback, local copy/JSON/print-PDF exports, and source/freshness/confidence boundaries.
- No page claims a binding quote, policy, coverage, eligibility, insurer availability, valid claim, legal obligation, or official advice.
- Form values stay local. Optional AI help requires explicit consent; deterministic local routing remains available.
- Every page has a self-canonical, reciprocal English/French hreflang, French OG metadata, WebApplication/FAQ/Breadcrumb schema with `inLanguage: fr`, and its dedicated app artwork.

## Verification

Passed:

- `npm run fr:insurance:verify` - 8 contract/oracle/registry/SEO/privacy/export/AI tests
- `node --test tests/day7-insurance-family-contract.test.js` - all 322 English Insurance routes remain valid
- `playwright test --config=playwright.fr-insurance.config.js` - 17/17 browser tests, including the hub and all 16 apps
- `npm run test:privacy-ai-consent` - 3/3 browser consent tests plus server consent test
- `npm run test:fr-discovery` - 32 categories and 1,452 published French rows reconciled
- `npm run check-links`
- `npm run audit`
- `npm run audit:public-claims`
- `npm run category-workflow:verify`
- `npm run lint`
- `npm run type-check`
- `npm run seo:report`
- `git diff --check`
- `git diff --diff-filter=D --summary` - no deleted files

Browser coverage includes 320px and 375px widths, 200% app-content reflow, light/manual/system dark modes, reduced motion, keyboard/focus behavior, invalid states, formula oracles, JSON download and reopen parsing, print/PDF invocation, and no console errors or network writes.

## Explicit Proof Boundaries

- No master parity ledger, sitemap, unrelated locale, broad generated localization artifact, deploy output, preview, production route, push, PR, or merge was changed or claimed. Only the scoped French category and all-tools discovery fallbacks were regenerated.
- `npm run insurance:sources:check` validates the ledger but reports the carried advisories documented below.
- The global hreflang validator also requests Swahili equivalence-group edits and refreshed localization artifacts. Those outputs are outside this French-only lane. English/French reciprocity is enforced by the scoped parity test.

## Carried Source Gaps

- Insurance dataset freshness stamp: 2026-03-29; the check reported 121 days old against a 60-day high-risk cadence.
- Sources: 28 total, including 25 regulator sources.
- Markets: 54 in the dataset; 25 have bound regulator sources and 29 remain recorded regulator-URL gaps.
- Eight claim classes remain explicitly recorded as unsourced.
- The source gate therefore keeps tariff and contribution figures planning-grade. French pages use only user-entered rates and do not turn these records into quotes or policy advice.
