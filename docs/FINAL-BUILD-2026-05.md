# Final Build Proof - 2026-05-13

## Last Full Proof Set

These commands passed during the close-out pass:

- `npm run build`
- `npm run build:deploy`
- `npm test`
- `npm run audit`
- `npm run seo:report`
- `npm run pro:verify`
- `npm run audit:dist`
- `npm run security:scan`
- `npm run pdf:verify`
- `npm run salary-tax:verify`
- `npm run vat-business-tax:verify`
- `npm run legal-workflow:verify`
- `npm run category-workflow:verify`
- `npm run afrokitchen:verify-intelligence`
- `npm run cars:catalog:refresh`
- `npm run test:car-price-intelligence`
- `npm run government:sources`
- `npm run government:sources:check`
- `npm run transport:sources`
- `npm run transport:sources:check`
- `npm run blog:verify`
- `npm run widgets:build`
- `npm run seo:widgets`
- `npm run test:api-docs`
- `npm run afropayroll:qa`
- `npm run test:afropayroll-pro`
- `npm run afrotax:verify`
- `npm run afrotax:qa`
- `npm run afrobooks:qa`
- `npm run afrohr:qa`
- `npm run afrohr:verify`
- `npm run afroseller:qa`
- `npm run build:i18n:full`

## Gap Check - 2026-05-14

These commands passed after the hreflang reciprocity close-out and deploy-artifact rebuild:

- `npm run build:i18n:full`: 7,725 pages scanned, 7,723 pages with hreflang tags, 19,525 hreflang pairs validated, 0 errors.
- `npm test`: link check, blog feed check, blog backend verification, tool audit, and PAYE/VAT verification passed.
- `npm run pro:verify`: Pro architecture, AfroTax, AfroPayroll, AfroSeller, AfroBooks, and AfroHR verifiers passed.
- `npm run build:deploy`: rebuilt the site and copied 10,678 files into `dist/`.
- `npm run audit:dist`: deploy artifact audit passed.
- `npm run security:scan`: security scan passed.
- `npm run check-links`: 8,357 HTML files scanned, 3,009 redirect rules loaded, 0 broken links.
- `npm run seo:report`: 0 missing canonical tags, 0 missing titles, 0 missing descriptions, 0 remaining hreflang violations, and 0 `/fr/` homepage broken-link warnings.

## Free Tools Debug Check - 2026-05-15

These commands passed during the free-tools close-out recheck:

- `npm run audit`: 2,194 registry rows, 2,183 live/new rows with pages, 0 missing pages, and 41 full `app.html` apps.
- `npm run check-links`: 8,357 HTML files scanned, 3,009 redirect rules loaded, 0 broken links.
- `npm run seo:report`: 0 missing canonical tags, 0 missing titles, 0 missing descriptions, 0 remaining hreflang violations, and 0 `/fr/` homepage broken-link warnings.
- `npm run build:i18n:validate`: English, French, Swahili, Yoruba, and Hausa translation keys match.
- `npm run validate:hreflang`: 7,725 pages scanned, 7,723 pages with hreflang tags, 19,525 hreflang pairs validated, 0 errors.
- `npm run pdf:verify`: PDF category and Document & PDF workflow gates passed.
- `npm run salary-tax:verify`, `npm run vat-business-tax:verify`, `npm run legal-workflow:verify`, and `npm run category-workflow:verify`: free-tool workflow gates passed.
- `npm test`: link check, blog feed check, blog backend verification, tool audit, and PAYE/VAT verification passed.
- `npm run pro:verify`: Pro fence and shell-app architecture checks passed.
- `npm run security:scan`: security scan passed.
- `npm run build:deploy`: rebuilt the site, stamped the service worker, kept the public live tool count at 2,594+, and copied 10,678 files into `dist/`.
- `npm run audit:dist`: deploy artifact audit passed.
- `git diff --check`: passed.

## Artifacts

- `admin/data/site-inventory-2026-05-13.json`
- `data/cars/frozen-2026-05-13.json`
- `supabase/snapshots/2026-05-13/`
- `reports/government-source-ledger.md`
- `reports/transport-source-ledger.md`

## Notes

- AfroPayroll QA fixture ran in dry-run mode because no safe live QA identity was configured.
- Government and transport source checks are green with manual-review queues, not automatic fact updates.
- Hreflang validation is clean after the 2026-05-14 gap check; no bidirectional warning debt remains in `npm run build:i18n:full`.
- Final SEO report has 0 missing canonical tags, 0 missing titles, 0 missing descriptions, 0 remaining hreflang violations, and 0 `/fr/` homepage broken-link warnings.
- Final deploy artifact audit and security scan both passed after `dist/` was rebuilt.
