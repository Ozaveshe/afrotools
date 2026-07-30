# Localization Coverage Report

Generated from `data/registry/locale-manifest.json`, `data/registry/locale-coverage-policy.json`, shared catalogs, and the public route graph.

## Summary

| Metric | Count |
|---|---:|
| rawPages | 10734 |
| native | 8177 |
| localizedShell | 2498 |
| englishFallback | 38 |
| unavailable | 20 |
| deprecated | 1 |
| indexableEligible | 9751 |
| sitemapEligible | 9751 |

## By locale

| Locale | Launch | Raw | Native | Shell | English fallback | Unavailable | Deprecated | Indexable | Catalog keys |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| en | default | 5874 | 5874 | 0 | 0 | 0 | 0 | 5023 | 180 |
| fr | launched | 3755 | 2134 | 1620 | 0 | 0 | 1 | 3683 | 180 |
| sw | launched | 955 | 146 | 806 | 3 | 0 | 0 | 950 | 180 |
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
| category | 695 | 695 | 0 | 0 | 0 | 0 | 691 |
| country-tool | 473 | 116 | 356 | 0 | 0 | 1 | 469 |
| legal | 4 | 4 | 0 | 0 | 0 | 0 | 4 |
| page | 4792 | 4107 | 628 | 37 | 20 | 0 | 4172 |
| tool | 4003 | 2633 | 1370 | 0 | 0 | 0 | 3886 |
| widget | 379 | 235 | 144 | 0 | 0 | 0 | 146 |

## Definitions

- `native`: primary content and required shared UI are authored in the declared locale.
- `localizedShell`: localized UI around a declared language-neutral engine or dataset.
- `englishFallback`: an explicit, labelled English destination; never a translated equivalent.
- `unavailable`: no usable destination in the requested locale.
- `deprecated`: a documented former localized destination.
