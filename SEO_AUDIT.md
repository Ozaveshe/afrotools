# AfroTools SEO Audit

Date: 2026-04-10

## Executive Summary

AfroTools already has real SEO foundations:

- Most key page types ship with canonicals, meta descriptions, hreflang, and schema.
- Tool pages usually include `WebApplication`, `WebPage`, `FAQPage`, and `BreadcrumbList`.
- Article pages usually include `Article`, `FAQPage`, and `BreadcrumbList`.
- Country and category hubs already contain substantial topical copy.

The problem is not "no SEO system." The problem is that the site currently behaves like several partial SEO systems layered on top of each other:

- hand-authored metadata and CTA blocks
- page-local related sections
- generic internal-link injection scripts
- tool-related components
- two overlapping sitemap generators

That fragmentation makes the site harder to tune for CTR, topical clustering, and article-to-tool conversion. The highest-value work is to centralize priority-page optimization, cluster linking, and technical SEO generation without adding front-end bloat.

## Scope Audited

- Metadata and schema generation
- Canonicals, hreflang, robots, sitemap logic
- Tool, article, hub, category, and country templates
- Reusable internal linking and related-content systems
- Conversion paths from article traffic into tools
- Repo validators and SEO helper scripts

## Repo SEO System Map

### Metadata, canonicals, OG, Twitter

Observed pattern:

- Homepage, tools, blog pages, and many hubs define metadata directly in static HTML.
- Metadata is mostly page-local, not centrally generated from one source of truth.
- `scripts/audit-seo.js` audits only `index.html` pages up to depth 2.
- `scripts/audit-meta.js` and `scripts/audit-meta-tags.js` exist, but the live repo still relies mainly on hand-authored tags.

What is working:

- `rel="canonical"` is present on audited index pages.
- Meta descriptions are broadly present on audited index pages.
- Many pages also define Open Graph and Twitter tags.

What is weak:

- Metadata overrides and experiments are not centrally configurable.
- CTR-critical pages are not managed through a repeatable "priority pages" layer.
- `audit-seo.js` found `266` index pages missing `og:image`.
- `audit-seo.js` found `211` long titles over 65 characters.

### Structured data

Observed pattern:

- Tool pages commonly include:
  - `WebApplication`
  - `WebPage`
  - `FAQPage`
  - `BreadcrumbList`
- Article pages commonly include:
  - `Article`
  - `FAQPage`
  - `BreadcrumbList`
- Hub pages usually include:
  - `WebPage` or `CollectionPage`
  - `BreadcrumbList`

What is working:

- Schema coverage is materially better than a typical early-stage static site.
- Breadcrumb schema exists on many important pages.

What is weak:

- `ItemList` coverage is inconsistent on hubs, categories, and directories.
- Structured data is still mostly hand-authored page-by-page.
- Related content blocks are not reflected by a central taxonomy system.
- Tool pages do not consistently express stronger "next step" relationships to guides and sibling tools.

### Hreflang

Observed pattern:

- English, French, and Swahili alternates are used on many templates.
- `scripts/seo-daily-fix.js` exists to patch trailing-slash hreflang issues.
- `npm run validate:hreflang` exists, which is a good sign.

What is weak:

- Historical drift is still visible in the repo.
- A large share of broken internal links are French-path mismatches, untranslated tool references, or bad localized aliases.

### Robots and sitemap

Observed pattern:

- `robots.txt` points to `https://afrotools.com/sitemap-index.xml`.
- Two sitemap generators exist:
  - `scripts/generate-sitemap.js`
  - `scripts/generate-sitemaps.js`
- Netlify uses `generate-sitemaps.js`, not `generate-sitemap.js`.

Important finding:

- `generate-sitemap.js` is effectively a legacy generator and does not match the live multi-sitemap architecture.
- `generate-sitemaps.js` generates sub-sitemaps plus `sitemap-index.xml` and also replaces `sitemap.xml` with the index.
- Current checked-in files show drift:
  - `sitemap-index.xml` lists the main sub-sitemaps
  - `sitemap.xml` includes an extra `jamb/sitemap.xml` entry that `sitemap-index.xml` does not

Technical risks:

- All generated `<lastmod>` values use today's date rather than file-level freshness.
- Redirect/alias pages can be picked up unless explicitly excluded.
- Two overlapping generators increase the risk of silent divergence.

### Templates by content type

Tool pages:

- Strongest template family in the repo.
- Often include trust signals, FAQs, breadcrumb UI, schema, and related tools.
- Conversion surfaces exist, but article/guide links are often manual and inconsistent.

Article pages:

- Usually include `Article` + `FAQPage` + breadcrumbs.
- Many already contain CTA boxes and related articles.
- CTA quality varies widely page to page.
- Most article-to-tool funneling is hand-authored, not centrally governed.

Country hubs:

- Often include strong contextual copy and breadcrumb schema.
- Usually include generic injected `seo-links` nav sections.
- Do not consistently express a clean hub-and-spoke cluster with guides, best-entry tools, and ItemList schema.

Category and directory hubs:

- `all-tools/`, `blog/`, `categories/`, and category hubs are visually strong.
- They are still weaker than they could be as crawlable topical authority pages.
- ItemList and cluster ownership are inconsistent.

### Internal linking system

Observed reusable systems:

- `scripts/inject-internal-links.js`
  - injects generic `seo-links` blocks
  - mostly sibling/country/category lists
- `assets/js/components/related-tools.js`
  - renders related tools by tool category
- `assets/js/lib/cross-tool-nav.js`
  - injects related tool strips by inferred category/country

What is working:

- There is already some automation for cross-linking.

What is weak:

- The current linking logic is mostly category- or sibling-based, not intent-cluster-based.
- Article-to-tool linking is not centrally managed.
- Tool-to-guide linking is not centrally managed.
- There is no clear priority-page engine for import duty, PAYE, VAT, mobile money, japa, or construction clusters.

### Conversion architecture

What is working:

- Many tool pages already feel "money-page ready."
- Many articles already have CTA boxes.
- Tool pages often communicate trust with "last verified" and source references.

What is weak:

- Article traffic is not systematically routed into the best tool for that topic.
- CTA variants are not configurable per priority page.
- Some educational pages use generic or mismatched CTA choices.
- The homepage and big hubs are stronger at conversion than many impression-winning supporting pages.

## Validator Findings

### Second-pass update: OG image coverage

Command run:

- `node scripts/audit-seo.js`

Updated result after the OG fallback pass:

- Missing `og:image` on audited real index pages: `0`
- Redirect/canonical alias pages skipped by the audit: `46`

Implication:

- Real audited pages now have a link-preview image fallback.
- Redirect-style placeholders no longer inflate the missing-image count.

### Repo validator: broken internal links

Command run:

- `node scripts/check-links.js`

Result:

- `552` broken internal links across `256` unique targets.

Second-pass update after source-level alias cleanup:

- `255` broken internal links across `230` unique targets.

Remaining high-volume categories:

- planned or missing tool pages
- country short-code VAT aliases such as `/ao/`, `/bj/`, and `/cv/`
- French localized content gaps
- a small set of asset/login/feed paths

Highest-volume clusters:

- broken French tool routes such as `/fr/tools/vat-calculator/` and `/fr/tools/paye-calculator/`
- broken legacy money-page aliases such as:
  - `/kenya/ke-salary-tax`
  - `/nigeria/ng-paye`
  - `/south-africa/za-salary-tax`
- broken article slug mismatch:
  - `/blog/import-duty-kenya-2026/` vs existing `import-duty-calculator-kenya-2026`
- broken category links such as `/categories/financial/`
- hubs linking to planned or missing tools

Implication:

- This is both an SEO hygiene issue and a conversion leak.
- The biggest wins are not random one-off fixes; they are centralized redirects, alias cleanup, and hub guardrails.

### Repo validator: metadata hygiene

Command run:

- `node scripts/audit-seo.js`

Result:

- Missing canonicals on audited index pages: `0`
- Missing meta descriptions on audited index pages: `0`
- Missing `og:image` on audited index pages: `266`
- Long titles over 65 characters: `211`
- Short descriptions under 50 characters: `1`

Implication:

- Metadata coverage exists, but CTR and social-preview quality are still inconsistent.

## Ranked Issues

| Priority | Issue | Impact | Effort | Risk | Why it matters |
| --- | --- | --- | --- | --- | --- |
| 1 | No central priority-page SEO operating layer | High | Medium | Low | CTR, intros, FAQ, and CTA improvements are trapped in manual page edits |
| 2 | Internal linking is generic, not cluster-driven | High | Medium | Low | Weakens non-brand discovery and article-to-tool conversion |
| 3 | Broken internal links at scale | High | Medium | Low | Wastes crawl budget, weakens trust, and leaks users on key funnels |
| 4 | Sitemap generation is split across two systems | High | Medium | Medium | Creates quiet technical drift and invalid freshness signals |
| 5 | Hubs lack consistent ItemList/authority structure | High | Medium | Low | Limits cluster ownership and SERP clarity for directory pages |
| 6 | Tool pages lack a standardized related-guides layer | High | Medium | Low | Tools capture demand but do not consistently deepen topical authority |
| 7 | Article CTA blocks are inconsistent and not reusable | High | Medium | Low | Supporting content does not funnel hard enough into tools |
| 8 | Metadata tuning is not centrally editable | Medium | Medium | Low | Slows CTR iteration on pages already earning impressions |
| 9 | Many hubs link to planned or missing destinations | Medium | Medium | Low | Makes the site feel broader than it really is and weakens trust |
| 10 | OG image coverage and title discipline are uneven | Medium | Low | Low | Limits CTR and shareability on existing impression winners |

## Top 10 Highest-Value Changes

1. Create a central SEO priority-page config for titles, meta descriptions, intro blocks, FAQs, and CTA variants.
2. Add a reusable cluster engine that links articles, tools, and sibling pages by topic and country rather than only by generic category.
3. Ship reusable article funnel blocks: quick answer, primary tool CTA, related guides, and related tools.
4. Ship reusable tool-side educational blocks: practical guides, compare tools, and next-step actions.
5. Fix the highest-volume broken links using a mix of redirects, alias cleanup, and safer hub linking.
6. Consolidate sitemap generation logic and switch `lastmod` to file freshness rather than "today for everything."
7. Add stronger `ItemList` schema to key hubs and directories.
8. Add hub guardrails so pages with few live links still feel intentional and do not over-link to missing destinations.
9. Normalize metadata for priority pages so CTR tests are centrally editable and repeatable.
10. Use the new system first on high-intent clusters:
   - Nigeria import duty
   - Ghana/Nigeria/South Africa PAYE and tax
   - VAT by country
   - mobile money fees
   - japa / relocation cost
   - construction / BOQ / materials cost

## Recommended Implementation Order

1. Build the source-of-truth SEO config and cluster data layer.
2. Add reusable article/tool cluster components and apply them to priority pages.
3. Fix top broken-link aliases and redirects.
4. Improve sitemap generation and freshness signals.
5. Strengthen hub/directory schema and cluster ownership sections.

## Notes on Tradeoffs

- The repo already uses static HTML heavily. The cleanest practical path is not a full template rewrite.
- The best fit here is a small build-time SEO system plus lightweight reusable front-end blocks.
- We should avoid heavy JS and avoid making every page fetch remote config at runtime.
- We should improve clusters and conversions without making the site feel spammy or ad-like.
