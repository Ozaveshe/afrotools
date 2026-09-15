# Morocco ordinary private-sector salary model

`engines/src/morocco-paye.js` is the readable calculation owner. `scripts/build-morocco-paye.js` owns the English, public French, legacy French and Swahili pages. Locale copy and runtime live in `scripts/lib/morocco-paye-content.js` and `assets/js/pages/morocco-paye.js`. The legacy French page retains the public French canonical. Minified engines are generated with `scripts/minify.js --only=engines/src/<name>.js`.

## Evidence checked 15 September 2026

- DGI CGI 2026: https://www.finances.gov.ma/Publication/dgi/2025/CGI-2026-FR.pdf . The ministry URL was indexed, but direct retrieval timed out. The DGI-authored copy at https://apsf.ma/wp-content/uploads/2026/01/DGI_CODE-GENERAL-DES-IMPOTS-CGI-2026.pdf was inspected; byte identity with the ministry file could not be established.
- CGI printed pages 98–100 / PDF indexes 96–98: article 59 ordinary professional expenses, excluded benefits and social deductions. Printed page119 / PDF117: article73 annual bands. Printed pages125–126 / PDF123–124: article74 dependent eligibility. Printed pages607 and610: January2025 band applicability and January2026 family-relief applicability.
- Ministry corroboration for family relief: https://www.finances.gov.ma/Maliya%20tawassol/SLF2026-Fr.pdf , printed page40, indexed text.
- https://www.acaps.ma/fr/grand-public/sante/couverture-medicale-de-base-amo : current regulator page inspected. Private active employees share4.52% equally; employer adds1.85%. The contribution covers total salary, unlike public-sector capped AMO.
- https://www.acaps.ma/fr/files/fichesynthetiquecnsspdf : older regulator factsheet, indexed content supports the6,000 MAD monthly salary ceiling. Direct access returned a verification challenge. https://www.cnss.ma/fr/content/taux-de-cotisation could not be accessed. Regulator/government searches did not establish an exact2026 contribution schedule or exhaustive amendment check.

The CNSS4.48%/8.98%, employer family6.4% and training1.6% parameters are retained planning assumptions, not newly verified2026 rates. This unresolved status appears in all locales and exports. The global official-sources Morocco gap is not marked resolved.

## Scope and calculation

Only ordinary private-sector employment, equal pay over12months, salary as sole income, unchanged dependent eligibility all year, no benefits/exempt allowances/special occupations or additional personal deductions. Annual CNSS salary ceiling72,000 is valid only under that equal-month assumption. Turning off CNSS/AMO is a comparison scenario, not eligibility advice.

Professional expenses are computed from gross taxable salary excluding benefits, not after deducting CNSS/AMO. The expense-rate change above78,000 creates a possible net-pay drop. Reverse calculation searches both sides separately for the lowest gross cent meeting the target. Family relief is capped at the tax otherwise due. Employer output is a subtotal and excludes accident insurance and other costs.

`FrancoPayeEngine.calculate('MA', annualGross)` delegates to the shared model; browser callers must load `morocco-paye.js` first. Its socialSecurity total now contains CNSS and AMO; `rate` is null because the bases differ, and components are explicit. Non-rate country metadata remains. No current page caller of FrancoPayeEngine was found by repository search; the four owned routes load the model directly. The Swahili adapter also delegates.

## Verification and release

Run `node --test tests/morocco-paye.test.js tests/morocco-release-generation.test.js` and `tests/e2e/morocco-paye-parity.spec.js` on an isolated static server. Tests must cover boundary values, reverse discontinuity, scenarios, all four routes, portable period context, parsed PDF, keyboard/mobile, stale inputs and AI consent. Build owners skip these native pages and the dedicated builder runs at the end of surface generation. Combined release/i18n checks and independent acceptance remain coordinator work; this source change does not self-accept or deploy.
