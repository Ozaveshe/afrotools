# SEO Changelog

Date: 2026-06-18

## 2026-06-18 Maintenance Refresh

- Rebuilt the registry-backed public tool directory and search indexes from `assets/js/components/tool-registry.js`.
- Synced public count copy to the current generated total of `2,595+` live tool instances.
- Regenerated the sitemap index and public sitemap set: `sitemap.xml`, `sitemap-index.xml`, `sitemap-tools.xml`, `sitemap-countries.xml`, `sitemap-agriculture.xml`, `sitemap-blog.xml`, `sitemap-fr.xml`, `sitemap-sw.xml`, `sitemap-ha.xml`, `sitemap-yo.xml`, `sitemap-cars.xml`, `sitemap-misc.xml`, `sitemap-i18n.xml`, and `jamb/sitemap.xml`.
- Ran SEO normalization after sitemap generation so canonical route metadata, sitemap lastmod values, and structured-data URLs stay aligned.
- Expanded `scripts/fix-seo-alias-links.js` with legacy utility and French route aliases, then reran link validation to clear all broken internal links.

## 2026-04-10 SEO System Update

## What Changed

- Added a central SEO operating layer in `data/seo/priority-pages.json` for titles, descriptions, CTA copy, quick answers, related guides, and related tools.
- Added a build-time injector in `scripts/build-seo-system.js` that patches priority pages from that config.
- Injected static SEO cluster blocks into 16 high-intent pages across import duty, income tax, mobile money, japa, and BOQ clusters.
- Synced common JSON-LD fields on those priority pages so schema copy matches the latest page titles and descriptions.
- Strengthened hub and directory schema on `blog/`, `tools/`, `all-tools/`, and `categories/` using `CollectionPage` and `ItemList`.
- Consolidated the active sitemap flow around `scripts/generate-sitemaps.js`, added file-based `lastmod`, and excluded redirect-style pages from sitemap output.
- Added redirect cleanup in `netlify.toml` for broken legacy aliases, especially old salary-tax and French tool routes.
- Added a second-pass OG fallback script so real pages missing `og:image` and `twitter:image` use the existing default AfroTools preview image.
- Updated the SEO audit script to skip redirect/canonical alias pages before counting missing metadata.
- Added a source-level alias-link cleanup script and used it to reduce broken internal links from `552` to `255`.

## Why It Changed

- Too much organic value was concentrated in a few pages and too much tuning lived in hand-edited HTML.
- Article traffic was not being routed hard enough into tools.
- Internal linking existed, but it was generic rather than cluster-aware.
- Sitemap freshness and alias handling were too fragile for a growing static site.

## Expected SEO Impact

- Better CTR control on impression-winning pages because title and description tuning is now centralized.
- Stronger internal linking for search engines because priority cluster blocks are now written directly into source HTML.
- Better conversion from article traffic into tool usage through consistent quick-answer and CTA sections.
- Cleaner crawl signals from more trustworthy sitemap freshness and targeted redirect cleanup.
- Stronger hub ownership for directories and category-style pages through `ItemList` and `CollectionPage` schema.

## Rollback Risk

- Low to medium.
- Most changes are additive and centralized, which makes rollback straightforward.
- The main shared-risk files are `scripts/build-seo-system.js`, `scripts/generate-sitemaps.js`, `package.json`, and `netlify.toml`.
- If a rollback is needed, the safest order is:
  1. revert the priority-page injector changes
  2. revert sitemap generation changes
  3. revert redirect additions

## Follow-Up Watchlist

- Upgrade important money pages from the default OG fallback to category- or page-specific preview images where useful.
- Expand the priority-page config to VAT pages, more country tax guides, and additional money pages.
- Replace more hardcoded page-local CTA boxes with centrally managed cluster patterns over time.
- Continue source-level broken-link cleanup for planned/missing tools, localized French gaps, and country short-code VAT aliases.
