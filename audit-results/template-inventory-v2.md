# Template Inventory V2

Generated: 2026-05-19T02:54:59.892Z

Source HTML files counted: 8524

Coverage language used in this sprint:

- Automated crawl means static HTML and link/metadata heuristics were checked across discovered routes.
- Rendered browser test means Playwright opened a representative route.
- Visual dark mode test means light/dark screenshots or computed styles were inspected for representative routes.
- Mobile layout test means viewport-specific checks were run at 360, 390, 768, or 1024px.
- Functionality test means inputs/buttons/results were exercised, not merely that the page loaded.

| Template | Affected pages | Example URLs | Source files/components | Major risks | Current v2 check state |
|---|---:|---|---|---|---|
| Homepage | 1 | / | index.html; assets/css/design-system.css; assets/js/components/navbar.js; assets/js/components/footer.js | High traffic entry point; nav, search, mobile weight, dark mode, trust copy. | Inventory complete; mobile/dark/copy/functionality checks pending in later v2 work units. |
| Tool pages | 2524 | /tools/50-30-20-budget/<br>/tools/afcfta-tracker/<br>/tools/afcon-predictor/<br>/tools/affidavit-generator/<br>/tools/africa-conflict/actors | tools/**/index.html; assets/js/components/tool-registry.js; assets/css/tool-layout.css; assets/css/calculator.css | Many independently authored tools; form labels, result clarity, mobile controls, dark mode, related links. | Inventory complete; mobile/dark/copy/functionality checks pending in later v2 work units. |
| Calculator and estimator pages | 2398 | /admin/car-import-cost-rules<br>/admin/car-price-intelligence<br>/admin/cocoa-prices<br>/admin/coffee-prices<br>/admin/commodity-prices | tools/**; country calculator pages; assets/js/engines/**; assets/css/calculator.css; tool-specific scripts | Formula correctness, invalid input handling, result readability, labels, mobile overflow. | Inventory complete; mobile/dark/copy/functionality checks pending in later v2 work units. |
| Country pages | 163 | /algeria/dz-paye<br>/algeria/dz-vat<br>/algeria/<br>/angola/ao-paye<br>/angola/ao-vat | country directories; assets/js/components/country-tools.js; assets/js/components/tool-registry.js | Localized/country-specific links, thin metadata, card grids, mobile category navigation. | Inventory complete; mobile/dark/copy/functionality checks pending in later v2 work units. |
| Category pages | 2318 | /african/<br>/agriculture/cassava-processing/angola<br>/agriculture/cassava-processing/benin<br>/agriculture/cassava-processing/cameroon<br>/agriculture/cassava-processing/cote-d-ivoire | category directories; shared card grids; assets/js/components/tool-registry.js | Repeated grid/card layout, generic copy, metadata duplication, mobile collapse. | Inventory complete; mobile/dark/copy/functionality checks pending in later v2 work units. |
| Blog and content pages | 193 | /blog/afcfta-import-duties-africa-2026/<br>/blog/african-recipes/<br>/blog/african-startup-funding-2026/<br>/blog/ajo-interest-calculation/<br>/blog/ajo-savings-group/ | blog/**/index.html; scripts/generate-blog-feed.js; shared article styles | Long-form readability, headings, metadata, feed consistency, images/alt. | Inventory complete; mobile/dark/copy/functionality checks pending in later v2 work units. |
| Localized pages | 2698 | /fr/404<br>/fr/about/<br>/fr/advertise/<br>/fr/african/<br>/fr/agriculture/cassava-processing/angola | fr/**; sw/**; ha/**; yo/**; scripts/build-i18n.js; scripts/validate-hreflang.js; language catalogs | Hreflang reciprocity, mixed-language leakage, generated output drift, copy quality. | Inventory complete; mobile/dark/copy/functionality checks pending in later v2 work units. |
| Swahili pages | 854 | /sw/404<br>/sw/afya-na-bima/<br>/sw/afya/<br>/sw/algeria/<br>/sw/algeria/kikokotoo-gharama-ya-kibali-cha-kazi/ | sw/**; scripts/build-i18n.js; assets/js/components/tool-registry.js localized entries | Swahili route discovery, localized nav, language alternates, mobile shell. | Inventory complete; mobile/dark/copy/functionality checks pending in later v2 work units. |
| Legal and policy pages | 6 | /about/<br>/contact/<br>/faq/<br>/privacy/<br>/security/ | privacy/**; terms/**; security/**; about/**; contact/**; faq/** | Trust/compliance copy, headings, contact paths, noindex mistakes. | Inventory complete; mobile/dark/copy/functionality checks pending in later v2 work units. |
| Search and listing pages | 5 | /all-tools/<br>/categories/<br>/countries/<br>/search/<br>/tools/ | search/**; all-tools/**; categories/**; countries/**; assets/js/components/tool-registry.js; data/search-index.json | Registry/search data correctness, keyboard search, empty states, result card accessibility. | Inventory complete; mobile/dark/copy/functionality checks pending in later v2 work units. |
| 404 and offline pages | 2 | /404<br>/offline | 404.html; offline.html; service-worker.js | 404 discovery paths, internal links, offline fallback clarity. | Inventory complete; mobile/dark/copy/functionality checks pending in later v2 work units. |
| Special landing and product pages | 272 | /advertise/<br>/api/docs/<br>/api/<br>/api/pricing<br>/auth/ | pro/**; pricing/**; developers/**; dashboard/**; auth/**; api/**; widgets/**; netlify/functions/** where relevant | Auth/dashboard/pro flows, Netlify functions, protected-state copy, release-surface risk. | Inventory complete; mobile/dark/copy/functionality checks pending in later v2 work units. |

## Notes

- Counts are filesystem route counts, not proof that every page was browser-rendered or visually audited.
- Some pages match multiple templates, for example localized tool pages and calculator pages. Template counts therefore intentionally overlap.
- `dist/`, `output/`, test artifacts, git internals, and dependencies are excluded from source template counts.
