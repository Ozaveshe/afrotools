# Localization Coverage Report

Generated from `data/registry/locale-manifest.json`, `data/registry/locale-coverage-policy.json`, shared catalogs, and the public route graph.

## Summary

| Metric | Count |
|---|---:|
| rawPages | 10695 |
| native | 8136 |
| localizedShell | 2499 |
| englishFallback | 38 |
| unavailable | 20 |
| deprecated | 2 |
| indexableEligible | 9706 |
| sitemapEligible | 9706 |

## By locale

| Locale | Launch | Raw | Native | Shell | English fallback | Unavailable | Deprecated | Indexable | Catalog keys |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| en | default | 5873 | 5873 | 0 | 0 | 0 | 0 | 5022 | 180 |
| fr | launched | 3715 | 2092 | 1621 | 0 | 0 | 2 | 3638 | 180 |
| sw | launched | 957 | 148 | 806 | 3 | 0 | 0 | 951 | 180 |
| yo | partial | 45 | 9 | 13 | 3 | 20 | 0 | 22 | 180 |
| ha | partial | 105 | 14 | 59 | 32 | 0 | 0 | 73 | 180 |
| pt | planned | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ar | planned | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ig | planned | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

## By page type

| Page type | Raw | Native | Shell | English fallback | Unavailable | Deprecated | Indexable |
|---|---:|---:|---:|---:|---:|---:|---:|
| api | 3 | 3 | 0 | 0 | 0 | 0 | 3 |
| article | 382 | 382 | 0 | 0 | 0 | 0 | 380 |
| auth | 3 | 2 | 0 | 1 | 0 | 0 | 0 |
| category | 694 | 694 | 0 | 0 | 0 | 0 | 690 |
| country-tool | 497 | 113 | 382 | 0 | 0 | 2 | 466 |
| legal | 4 | 4 | 0 | 0 | 0 | 0 | 4 |
| page | 4790 | 4106 | 627 | 37 | 20 | 0 | 4158 |
| tool | 3943 | 2597 | 1346 | 0 | 0 | 0 | 3859 |
| widget | 379 | 235 | 144 | 0 | 0 | 0 | 146 |

## Definitions

- `native`: primary content and required shared UI are authored in the declared locale.
- `localizedShell`: localized UI around a declared language-neutral engine or dataset.
- `englishFallback`: an explicit, labelled English destination; never a translated equivalent.
- `unavailable`: no usable destination in the requested locale.
- `deprecated`: a documented former localized destination.
