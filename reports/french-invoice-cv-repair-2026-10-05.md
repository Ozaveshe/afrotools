# French invoice and CV workflow repair

Date: 5 October 2026. Base: `e9fed80dd64f54f84866f33ea849c9de8c99b1ce`. Branch: `codex/fr-document-parity-20261005`. Scope: French invoice and CV terminology, template metadata/controls, private text integrity and supported exports. This batch does not establish complete French parity or native-human editorial approval.

## Changed files

- `data/localization/fr-document-pdf-lexicon-overrides.json` owns the contextual French copy; `fr-document-pdf-lexicon.json` is its scoped generated vocabulary.
- `scripts/build-french-cv-runtime.js` owns dynamic French template copy, fragments and CSV headings. Object keys stay unchanged.
- `scripts/build-french-document-pdf-parity.js` owns invoice currency-prefix protection and private preview boundaries.
- `assets/js/lib/fr-document-pdf-localizer.js` preserves private CV preview/saved-name text during initial and interactive localization. `assets/js/pages/fr-document-pdf-export-localization.js` leaves CV Blob data unchanged; source runtimes supply French labels before serialization.
- `fr/tools/generateur-factures/index.html`, `fr/tools/generateur-cv/index.html` and the French CV runtime/manifest are generated outputs. Eight runtime modules gain French owners because newly reviewed copy now applies to them.
- `tools/cv-builder/js/src/cv-application-pack-export.js` establishes a readable shared source owner. Its generated English runtime and French runtime now wait for asynchronous PDF bytes before adding ATS and cover-letter PDFs to ZIPs.
- `tests/french-document-context.test.js`, `tests/cv-application-pack-pdf.test.js` and `tests/e2e/french-document-context.spec.js` add behavioral regressions.

## User-facing changes

- Invoice terminology uses *Lignes de facture*, *Ajouter une ligne* and matching accessible/validation/review labels. All currency-option prefixes remain their ISO identifiers, including GHS and SDG. Currency-only selection preserves an entered tax rate of 9.
- The CV front door describes ATS compatibility without suggesting security. *Global Compact* becomes *Compact international*. All 30 expanded template names and descriptions have contextual French copy; gallery actions, facts, filters and modal labels are localized.
- User text that happens to match labels or template names survives preview, backup and exports. Synthetic collision strings are used in the regression checks.
- Application-pack ZIPs contain PDF bytes rather than the string representation of an unfinished Promise. This shared fix applies to English and French, and can be reused by other locale generators.

## Tests run

- PASS: `node --test tests/cv-application-pack-pdf.test.js tests/french-document-context.test.js tests/french-cv-consent-owner.test.js tests/french-document-json-integrity.test.js tests/french-document-pdf-parity.test.js` — 50 tests. The 30-template test compares renderer IDs, layouts, countries, filters, ATS flags, photo flags and status against English. ZIP tests reopen all three embedded PDFs through pdf-lib for English and French.
- PASS: scoped lexicon checks with `--app=cv-builder --reviewed-only` and `--app=invoice-generator --reviewed-only`; both require zero external translation requests. Scoped parity `--check` returns zero stale output for both routes.
- PASS: `npm run build:i18n:validate`; `npm run validate:hreflang` — 11,695 public pages, 4,253 equivalence groups, reciprocal native equivalents.
- PASS: `npm run lint`; `npm run type-check`; changed shared source/runtime syntax checks; `git diff --check`.
- PASS: the existing French invoice JSON collision/import case and French freelance JSON/CSV/TXT/DOC/PDF preservation case (two browser cases).
- PASS: the existing full French CV browser export case — PDF, DOCX, TXT, JSON, CSV, ZIP and print; synthetic privacy/network checks. Native OS printing is not verified.
- PASS: `npx playwright test tests/e2e/french-document-context.spec.js --workers=1` — two cases; invoice label/currency/tax/preview/native PDF/JSON; 30-template gallery, keyboard modal close/focus return, actual selection and editor input, private TXT/JSON/CSV values, and 390/320 pixel reflow.
- PASS: `npx playwright test tests/e2e/french-document-pdf-parity.spec.js --grep 'cv-builder:|invoice-generator:' --workers=1` — two cases; 375/320 pixel layouts, 200% zoom, light/dark themes, reduced motion, keyboard focus, zero blocking console/page errors and zero same-origin network failures. All browser runs used the isolated static server on port 4184 with analytics disabled.

The first full CV export attempt exposed the existing Promise-in-ZIP defect; that case passed after the source repair. The combined three-case invocation had two passes and one failure from the new CSV test's stale fixture expectation; the corrected new suite subsequently passed both cases. Two new test-fixture expectations were corrected to the actual French ATS heading and mounted target-control contract. Historical category-wide receipt files are preserved; a filtered run must not replace them with a misleading 32-workflow acceptance claim.

## Risk and review limits

- Privacy: processing remains local; no real client/CV records were used. No new AI/provider, storage, account or network capability is introduced. CSV display headings change while stored field names and user values remain literal.
- Accessibility: localized action names and editor names, keyboard activation, Escape/focus return, and mobile overflow are exercised. Full native-language accessibility review remains pending.
- SEO/routes: public paths, canonicals, registry membership and hreflang contracts remain stable. Regeneration inherits current English assets/consent wiring; release postprocessing should restamp asset hashes.
- Analytics: event identifiers are unchanged. Country/template/renderer identifiers are preserved. No real sensitive fixtures or raw user records were logged.
- Editorial: French wording is an agent-reviewed draft. Native editor and independent reviewer approval, all 30 exported template layouts, the remaining CV assistance text and complete site-wide French parity are not established by this batch.
- Release: no push to main, deployment, Supabase operation or production/live-provider verification occurred here. Integration owns release checks and exact-SHA production proof.

## Integration

Add the shared source/output pair to `scripts/minify.js`: `tools/cv-builder/js/src/cv-application-pack-export.js` → `tools/cv-builder/js/cv-application-pack-export.js`. Then regenerate the French CV runtime.

After integrating the parent's current English invoice source, run `node scripts/build-french-document-pdf-parity.js --write --app=invoice-generator` to inherit its mobile sticky-bar z-index repair. Regenerate the CV route with `node scripts/build-french-document-pdf-parity.js --write --app=cv-builder` if integration changes its runtime ownership.

Rollback: revert this scoped repair commit and regenerate outputs from the restored source owners.
