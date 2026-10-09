# Localization Coverage Report

Generated from `data/registry/locale-manifest.json`, `data/registry/locale-coverage-policy.json`, shared catalogs, and the public route graph.

## Summary

| Metric | Count |
|---|---:|
| rawPages | 11702 |
| native | 9135 |
| localizedShell | 2513 |
| englishFallback | 33 |
| unavailable | 20 |
| deprecated | 1 |
| indexableEligible | 7887 |
| sitemapEligible | 7887 |

## By locale

| Locale | Launch | Raw | Native | Shell | English fallback | Unavailable | Deprecated | Indexable | Catalog keys |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| en | default | 6147 | 6147 | 0 | 0 | 0 | 0 | 4020 | 180 |
| fr | launched | 3807 | 2192 | 1614 | 0 | 0 | 1 | 2179 | 180 |
| sw | launched | 1596 | 763 | 828 | 5 | 0 | 0 | 1584 | 180 |
| yo | partial | 46 | 10 | 13 | 3 | 20 | 0 | 23 | 180 |
| ha | launched | 106 | 23 | 58 | 25 | 0 | 0 | 81 | 180 |
| pt | planned | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ar | planned | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ig | planned | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

## By page type

| Page type | Raw | Native | Shell | English fallback | Unavailable | Deprecated | Indexable |
|---|---:|---:|---:|---:|---:|---:|---:|
| api | 3 | 3 | 0 | 0 | 0 | 0 | 3 |
| article | 550 | 550 | 0 | 0 | 0 | 0 | 420 |
| auth | 3 | 2 | 0 | 1 | 0 | 0 | 0 |
| category | 695 | 695 | 0 | 0 | 0 | 0 | 691 |
| country-tool | 514 | 186 | 327 | 0 | 0 | 1 | 510 |
| legal | 4 | 4 | 0 | 0 | 0 | 0 | 4 |
| page | 5544 | 4814 | 678 | 32 | 20 | 0 | 2454 |
| tool | 4010 | 2646 | 1364 | 0 | 0 | 0 | 3660 |
| widget | 379 | 235 | 144 | 0 | 0 | 0 | 145 |

## Definitions

- `native`: primary content and required shared UI are authored in the declared locale.
- `localizedShell`: localized UI around a declared language-neutral engine or dataset.
- `englishFallback`: an explicit, labelled English destination; never a translated equivalent.
- `unavailable`: no usable destination in the requested locale.
- `deprecated`: a documented former localized destination.
