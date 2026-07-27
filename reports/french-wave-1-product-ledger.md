# French Product Wave 1 Ledger

Review date: 2026-07-27

Search evidence window: launch-to-date. AfroTools launched at the end of March
2026, so 32-week and 16-month history requirements are not applicable. Search
Console evidence must record its actual start and end dates when available.

| Surface | Product correctness | Mobile / dark | Privacy / export | SEO / discovery | Status |
| --- | --- | --- | --- | --- | --- |
| `/fr/` and `/fr/all-tools/` | Four direct product journeys; search query reaches and filters the French directory | 375px browser check; token-based dark surfaces and focus states | No sensitive inputs | French counts, metadata, CollectionPage and ItemList schema | Complete |
| `/fr/senegal/calculateur-salaire-net` | Seven IRPP bands; 43% top band; IPRES capped at 5,184,000 XOF; false employee CSS deduction removed; browser and server engines aligned; limitations visible | 390px browser check, no overflow or console errors | Salary stays local; AI salary send removed; PDF has no email gate; share is route-only | French metadata, locale, breadcrumb and truthful FAQ schema | Complete |
| `/fr/cote-divoire/calculateur-tva` | Classification controls calculation; special treatment requires user confirmation; unknown state fails back to 18%; XOF has no decimals | Targeted browser suite | Local calculation and PDF | `fr_CI` Open Graph locale and breadcrumb schema | Complete |
| `/fr/tools/generateur-factures/` | Numeric validation, safe local state restore, French terms and status labels | 390px browser check; former 129px overflow removed; no console errors | PDF downloads without account/email gate; share is route-only; entered HTML remains inert | French route and product copy reviewed | Complete |
| `/fr/tools/convertisseur-devises/` | Requires a fresh USD-base snapshot; rejects wrong-base data; invalidates stale results; francophone corridors | Targeted browser suite and responsive corridor controls | Manual fail-closed mode; localized CSV export | French currency names, source labels and corridor intent | Complete |

## Validation

- `npm run test:fr-surface` — passed.
- Focused Node tests for French homepage, Senegal payroll, and Côte d’Ivoire VAT — passed.
- Senegal payroll engine contract — 6/6 passed, including browser/server parity, the 43% top band, and the IPRES ceiling.
- Senegal payroll Playwright suite — 3/3 passed against an isolated Wave 1 server, including formula, privacy, and 390px layout checks.
- Côte d’Ivoire VAT Playwright suite — 8/8 passed.
- Currency converter Playwright suite — 8/8 passed.
- Homepage Playwright subset — 4/4 passed.
- Manual browser proof at 375px/390px — homepage, search handoff, Senegal payroll, invoice calculation and PDF.
- `npm run validate:hreflang` — passed, 30,177 relationships and zero contract errors.
- `npm run build:i18n:validate` — passed.
- `npm run check-links` — passed, 124,757 internal links and zero broken links.
- `npm run seo:report` — zero missing canonical, title, description, hreflang, or French-homepage-link issues. The report still lists broad pre-existing auto-fix opportunities outside this wave; they were not applied.
- `git diff --check` — passed.
- `npm run security:scan` — passed.
- Senegal formula review — `paye-browser-sn`, `paye-server-sn`, `route-sn-paye`, and `route-sn-paye-fr` accepted; unrelated formula drift was not modified.
- Full calculation-quality check — still fails on the same broad formula-registry backlog reproduced on clean `origin/main`; the Wave 1 filename crash and all Senegal PAYE mismatches are resolved.
- `npm run build:deploy` — incomplete locally: the broad generated-output pass exceeded the 10-minute command window. Its unrelated source restamps were removed.
- `npm run audit:dist` — incomplete locally: the partial artifact audit exceeded its 2-minute command window and is not accepted as deploy proof.

## Evidence still needed

- Search Console launch-to-date export for the French route cohort. This is
  `not yet measurable` in the repository, not a failed product gate.
- A clean CI/Netlify build and deploy-artifact audit for the exact Wave 1
  commit.
- Production deploy and live-route proof after the Wave 1 batch is merged.
