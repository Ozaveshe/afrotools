# Swahili Sitemap And Hreflang Final Proof

Generated: 2026-05-18T05:36:52.574Z

## Summary

- Swahili HTML source files: 854
- Indexable Swahili source rows: 852
- sitemap-sw.xml entries: 851
- Noindex rows included in sitemap: 0
- Indexable non-alias rows missing from sitemap: 0
- Canonical alias rows omitted from sitemap: 1
- Hreflang validation: 0 errors, 0 warnings after full build/fix pass
- New Swahili blog stubs included in sitemap: yes

## Actions

- Ran `npm run build:i18n:full`: passed; reciprocity fixer added 828 reciprocal tags and removed 2 duplicates.
- Ran `npm run sitemap` after detecting the two new Swahili blog stubs missing from `sitemap-sw.xml`.
- Ran `npm run validate:hreflang` after sitemap regeneration: passed with 0 errors.

## Alias Note

`sw/salary-tax/index.html` remains omitted from `sitemap-sw.xml` because it canonicalizes to `/sw/mshahara-na-kodi/`; that keeps the canonical sitemap stable while the alias page remains available.

## Dirty Tree Note

The full i18n/sitemap proof created broad generated/i18n churn in an already dirty checkout. Swahili sitemap and hreflang readiness are clean; unrelated generated/non-Swahili churn should be reviewed separately.
