# SEO Implementation Plan

Date: 2026-04-10

## Goal

Turn AfroTools into a more systematic acquisition engine by centralizing priority-page SEO control, strengthening cluster linking, improving article-to-tool conversion, and tightening technical SEO hygiene without adding front-end bloat.

## Phase 1: Source Of Truth

Status: implemented

Delivered:

- `data/seo/priority-pages.json`
- cluster definitions for import duty, country income tax, mobile money, japa, and construction-cost journeys
- page-level overrides for titles, descriptions, CTA copy, quick-answer copy, related guides, and related tools

Why it matters:

- Editors now have a single operating layer for high-priority organic pages.
- Future SEO work can be done by extending one JSON file instead of hand-editing many pages.

## Phase 2: Reusable Cluster Blocks

Status: implemented

Delivered:

- `scripts/build-seo-system.js` as the build-time injector
- `assets/css/seo-clusters.css` for lightweight shared styling
- static HTML cluster blocks injected into source HTML for priority pages
- structured-data syncing so updated page titles and descriptions also flow into common JSON-LD blocks

Important tradeoff:

- The first pass used a JS custom element, but that was replaced with build-time static HTML so internal links and CTA blocks are fully crawlable and work without JavaScript.

## Phase 3: Priority Page Rollout

Status: implemented for first 16 pages

Rolled out clusters:

- Import duty:
  - `/tools/import-duty/`
  - `/blog/import-duty-nigeria-2026/`
  - `/blog/import-duty-calculator-kenya-2026/`
  - `/blog/import-duty-ghana-2026/`
  - `/blog/import-duty-south-africa-2026/`
- PAYE / tax:
  - `/nigeria/ng-salary-tax/`
  - `/south-africa/za-paye/`
  - `/blog/complete-guide-nigeria-income-tax-2026/`
  - `/blog/complete-guide-kenya-income-tax-2026/`
  - `/blog/complete-guide-south-africa-income-tax-2026/`
- Mobile money:
  - `/tools/mobile-money-fees/`
  - `/blog/mobile-money-fees-africa-compared/`
- Japa / relocation:
  - `/tools/japa-calculator/`
  - `/blog/japa-cost-nigeria/`
- Construction / BOQ:
  - `/tools/boq-generator/`
  - `/blog/boq-construction-nigeria-2026/`

What changed on those pages:

- stronger title and description overrides
- stronger article-to-tool CTA blocks
- related guides and related tools based on topical cluster, not only generic category matching
- common quick-answer blocks that improve scannability and conversion

## Phase 4: Technical SEO Hygiene

Status: implemented for highest-value fixes, with second-pass OG cleanup added

Delivered:

- package build now uses `generate-sitemaps.js` as the active sitemap generator
- `generate-sitemaps.js` now uses file freshness for `lastmod`
- redirect or canonical-mismatch pages are excluded from sitemap output
- `jamb/sitemap.xml` is included in the sitemap index
- `netlify.toml` now includes targeted alias redirects for high-volume broken-link patterns
- `scripts/apply-og-fallbacks.js` backfills missing `og:image` and `twitter:image` tags with the existing AfroTools default preview image
- `scripts/audit-seo.js` now skips redirect-style or canonical-alias pages so the report reflects real pages
- `scripts/fix-seo-alias-links.js` rewrites obvious source-level href aliases that already have Netlify redirect coverage

Still worth doing later:

- broader broken-link cleanup inside source HTML, especially localized French legacy links and planned/missing tool destinations
- category-specific OG image assignment where a stronger image already exists and is worth using instead of the default fallback

## Phase 5: Hub Reinforcement

Status: implemented for core hubs

Delivered:

- stronger `CollectionPage` and `ItemList` schema on:
  - `blog/`
  - `tools/`
  - `all-tools/`
  - `categories/`
- better hub-level signaling around priority entry points and tool discovery

Next likely expansion:

- strengthen country hubs around Nigeria, Kenya, Ghana, and South Africa with clearer cluster ownership blocks

## Success Criteria

- Priority pages are easier to optimize from one config file.
- Article pages route users into tools more consistently.
- Tool pages route users into educational content more consistently.
- Broken-link leakage is reduced on important acquisition paths.
- Sitemap and crawl signals are more trustworthy.
- The system stays static-friendly, mobile-safe, and maintainable.
