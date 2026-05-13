# SEO Close-Out - 2026-05-13

## Result

The SEO close-out pass removed the fatal audit errors found in the stale close-out prompt. Remaining hreflang issues are warnings, not fatal validator errors, and are treated as carried localization reciprocity debt.

## Fixed

- Site audit parse errors are down to 0 via `scripts/fix-site-audit-jsonld-errors.js`, AfroAtlas template schema repair, and audit exclusions for private fragments/templates.
- `lang/pages/*.body.html` and `tools/afroatlas/_country-template.html` are excluded from deploy output.
- `_redirects` now includes French clean-route/fallback coverage for currency, tool, section, and manifest routes that appear on the French homepage.
- `scripts/validate-hreflang.js` now respects real `_redirects` source routes and trailing-slash equivalence.
- `scripts/build-i18n.js` preserves self-referencing hreflang for top-level localized blog articles.
- `npm run seo:og` and `npm run seo:report` were run after the SEO pass.

## Proof

- `node scripts/audit-pages.js`: 0 errors, 3166 warnings.
- `npm run check-links`: 0 broken links.
- `npm run seo:report`: 0 missing canonical tags, 0 missing titles, 0 missing descriptions, 0 remaining hreflang violations, and 0 `/fr/` homepage broken-link warnings.
- `npm run build:i18n:full`: passed, with 814 carried bidirectional warnings.
- `npm run sitemap`: regenerated sitemap set during the build flow.

## Carried Debt

- 814 hreflang bidirectional warnings remain, mostly FR/SW/HA reciprocal route gaps and generated localization surfaces.
- These are not new regressions from this pass. They are the remaining localization roadmap, not a release-blocking source or deploy artifact failure.
