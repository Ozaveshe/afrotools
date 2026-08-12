# Localization Coverage Report

Generated from `data/registry/locale-manifest.json`, `data/registry/locale-coverage-policy.json`, shared catalogs, and the public route graph.

## Summary

| Metric | Count |
|---|---:|
| rawPages | 11489 |
| native | 8909 |
| localizedShell | 2523 |
| englishFallback | 36 |
| unavailable | 20 |
| deprecated | 1 |
| indexableEligible | 10502 |
| sitemapEligible | 10502 |

## By locale

| Locale | Launch | Raw | Native | Shell | English fallback | Unavailable | Deprecated | Indexable | Catalog keys |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| en | default | 5949 | 5949 | 0 | 0 | 0 | 0 | 5098 | 180 |
| fr | launched | 3798 | 2177 | 1620 | 0 | 0 | 1 | 3726 | 180 |
| sw | launched | 1592 | 758 | 831 | 3 | 0 | 0 | 1581 | 180 |
| yo | partial | 45 | 9 | 13 | 3 | 20 | 0 | 22 | 180 |
| ha | partial | 105 | 16 | 59 | 30 | 0 | 0 | 75 | 180 |
| pt | planned | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ar | planned | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ig | planned | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

## By page type

| Page type | Raw | Native | Shell | English fallback | Unavailable | Deprecated | Indexable |
|---|---:|---:|---:|---:|---:|---:|---:|
| api | 3 | 3 | 0 | 0 | 0 | 0 | 3 |
| article | 487 | 487 | 0 | 0 | 0 | 0 | 485 |
| auth | 3 | 2 | 0 | 1 | 0 | 0 | 0 |
| category | 695 | 695 | 0 | 0 | 0 | 0 | 691 |
| country-tool | 514 | 186 | 327 | 0 | 0 | 1 | 510 |
| legal | 4 | 4 | 0 | 0 | 0 | 0 | 4 |
| page | 5401 | 4664 | 682 | 35 | 20 | 0 | 4777 |
| tool | 4003 | 2633 | 1370 | 0 | 0 | 0 | 3886 |
| widget | 379 | 235 | 144 | 0 | 0 | 0 | 146 |

## Definitions

- `native`: primary content and required shared UI are authored in the declared locale.
- `localizedShell`: localized UI around a declared language-neutral engine or dataset.
- `englishFallback`: an explicit, labelled English destination; never a translated equivalent.
- `unavailable`: no usable destination in the requested locale.
- `deprecated`: a documented former localized destination.
