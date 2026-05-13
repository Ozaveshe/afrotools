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

## Artifacts

- `admin/data/site-inventory-2026-05-13.json`
- `data/cars/frozen-2026-05-13.json`
- `supabase/snapshots/2026-05-13/`
- `reports/government-source-ledger.md`
- `reports/transport-source-ledger.md`

## Notes

- AfroPayroll QA fixture ran in dry-run mode because no safe live QA identity was configured.
- Government and transport source checks are green with manual-review queues, not automatic fact updates.
- Hreflang validation passes with warnings only.
- Final SEO report has 0 missing canonical tags, 0 missing titles, 0 missing descriptions, 0 remaining hreflang violations, and 0 `/fr/` homepage broken-link warnings.
- Final deploy artifact audit and security scan both passed after `dist/` was rebuilt.
