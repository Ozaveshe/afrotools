# Swahili Beta Release Candidate Notes

Generated: 2026-05-18T05:39:19.473Z

## Current Proof Snapshot

- Swahili source routes: 854 total; 852 indexable
- Direct /sw/zana/ routes: 465; registry-covered direct routes: 415/465 (89.25%)
- Swahili registry hrefs: 700/700 resolving after trailing-slash normalization; broken: 0
- Swahili /sw/zana/ registry hrefs: 469/469 resolving; broken: 0
- Hreflang: final full build and validation passed with 0 errors/warnings
- Links: latest check-links pass found 0 broken internal links across 8,501 HTML files
- SEO metadata: Swahili sweep clean after adding self hreflang to the /sw/salary-tax/ canonical alias
- Sitemap: sitemap-sw.xml includes 851 canonical Swahili URLs; the only omitted indexable route is the /sw/salary-tax/ alias canonicalizing to /sw/mshahara-na-kodi/

## What Shipped

- Stable Swahili shell for `/sw/`, `/sw/zana-zote/`, `/sw/tools/`, category hubs, country hubs, and direct tool routes.
- Registry/search discovery is strong for core lanes: PAYE, VAT, PDF, salary, work/CV, trade/forodha, construction, translation, communications, health/insurance, business, agriculture, government, developer, religious/cultural, and transport.
- Specialist-risk routes are safer and intentionally held out of registry promotion unless a domain review clears them.
- Blog and API bridges are honest: English-only destinations are labeled, and two low-risk Swahili blog stubs now exist.
- Shared footer and navbar now route Swahili users to Swahili pages where those pages exist and label English-only links clearly.

## Carried Debt

- Specialist queue: 22 routes remain human/domain-review-before-registry.
- Registry near-completion: 50 direct /sw/zana/ routes remain outside direct registry coverage, mostly polish-first or specialist-risk.
- Source-layer migration: dry-run route safety exists for PAYE planning, but real page-pack writing remains blocked until the writer is alias-aware and metadata-only safe.
- Blog/API content: more Swahili explainers can replace English-only bridges, but current bridges are honest.
- Search: shared navbar/search is stable; the `/sw/` hero search has a few weak query rows that are non-blocking.
- Dirty checkout: unrelated French, Hausa, Yoruba, generated, and report churn remains and should be separated before deployment packaging.

## Validation Before Deployment

Run `npm run build:i18n:full`, `npm run validate:hreflang`, `npm run check-links`, `npm run audit`, `npm run seo:report`, and `git diff --check`. If deploying from this dirty checkout, also run the repo deploy/security stack requested by the release checklist and separate non-Swahili churn from the Swahili source package.
