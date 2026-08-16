# Localization Coverage Report

Generated from `data/registry/locale-manifest.json`, `data/registry/locale-coverage-policy.json`, shared catalogs, and the public route graph.

## Summary

| Metric | Count |
|---|---:|
| rawPages | 11499 |
| native | 8926 |
| localizedShell | 2516 |
| englishFallback | 36 |
| unavailable | 20 |
| deprecated | 1 |
| indexableEligible | 9916 |
| sitemapEligible | 9916 |

## By locale

| Locale | Launch | Raw | Native | Shell | English fallback | Unavailable | Deprecated | Indexable | Catalog keys |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| en | default | 5956 | 5956 | 0 | 0 | 0 | 0 | 4996 | 180 |
| fr | launched | 3799 | 2180 | 1618 | 0 | 0 | 1 | 3240 | 180 |
| sw | launched | 1594 | 762 | 829 | 3 | 0 | 0 | 1583 | 180 |
| yo | partial | 45 | 9 | 13 | 3 | 20 | 0 | 22 | 180 |
| ha | partial | 105 | 19 | 56 | 30 | 0 | 0 | 75 | 180 |
| pt | planned | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ar | planned | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ig | planned | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

## By page type

| Page type | Raw | Native | Shell | English fallback | Unavailable | Deprecated | Indexable |
|---|---:|---:|---:|---:|---:|---:|---:|
| api | 3 | 3 | 0 | 0 | 0 | 0 | 3 |
| article | 501 | 501 | 0 | 0 | 0 | 0 | 371 |
| auth | 3 | 2 | 0 | 1 | 0 | 0 | 0 |
| category | 695 | 695 | 0 | 0 | 0 | 0 | 691 |
| country-tool | 514 | 186 | 327 | 0 | 0 | 1 | 510 |
| legal | 4 | 4 | 0 | 0 | 0 | 0 | 4 |
| page | 5400 | 4668 | 677 | 35 | 20 | 0 | 4541 |
| tool | 4000 | 2632 | 1368 | 0 | 0 | 0 | 3651 |
| widget | 379 | 235 | 144 | 0 | 0 | 0 | 145 |

## Definitions

- `native`: primary content and required shared UI are authored in the declared locale.
- `localizedShell`: localized UI around a declared language-neutral engine or dataset.
- `englishFallback`: an explicit, labelled English destination; never a translated equivalent.
- `unavailable`: no usable destination in the requested locale.
- `deprecated`: a documented former localized destination.
