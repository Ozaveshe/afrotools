# SEO Close-Out - 2026-05-13

## Result

The SEO close-out pass removed the fatal audit errors found in the stale close-out prompt. A follow-up i18n pass also cleared the carried hreflang reciprocity warnings, so the packaged hreflang validator now exits fully clean.

## Fixed

- Site audit parse errors are down to 0 via `scripts/fix-site-audit-jsonld-errors.js`, AfroAtlas template schema repair, and audit exclusions for private fragments/templates.
- `lang/pages/*.body.html` and `tools/afroatlas/_country-template.html` are excluded from deploy output.
- `_redirects` now includes French clean-route/fallback coverage for currency, tool, section, and manifest routes that appear on the French homepage.
- Legacy localized alias routes that still exist as files use forced `301!` redirects so production follows the canonical route instead of serving stale duplicate pages.
- `scripts/validate-hreflang.js` now respects real `_redirects` source routes and trailing-slash equivalence.
- `scripts/build-i18n.js` preserves self-referencing hreflang for top-level localized blog articles, prefers canonical Swahili category routes, and avoids mapping French blog mirrors into English alternate groups.
- `scripts/fix-hreflang-reciprocity.js` repairs missing reciprocal hreflang tags, adds required self/x-default tags where needed, removes duplicate same-language alternates, and retries transient Windows write locks.
- `npm run build:i18n:full` now runs the reciprocity fixer before validation.
- `npm run seo:og` and `npm run seo:report` were run after the SEO pass.

## Proof

- `node scripts/audit-pages.js`: 0 errors, 3166 warnings.
- `npm run check-links`: 8,357 HTML files scanned, 3,009 redirect rules loaded, 0 broken links.
- `npm run seo:report`: 0 missing canonical tags, 0 missing titles, 0 missing descriptions, 0 remaining hreflang violations, and 0 `/fr/` homepage broken-link warnings.
- `npm run build:i18n:full`: passed; 7,725 pages scanned, 7,723 pages with hreflang tags, 19,525 hreflang pairs validated, 0 errors, 0 warnings.
- `npm test`: passed, including link check, blog feed check, blog backend verification, tool audit, and PAYE/VAT tool verification.
- `npm run build:deploy`, `npm run audit:dist`, and `npm run security:scan`: passed after the hreflang/redirect changes.
- `npm run sitemap`: regenerated sitemap set during the build flow.

## Carried Debt

- No hreflang reciprocity debt remains in the validator as of this pass.
- Broader localization quality debt still exists outside hreflang mechanics: translated content depth, route naming strategy, and which secondary localized hubs should remain indexable versus redirect-only.
