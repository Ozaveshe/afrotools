# Localization Coverage Report

Generated from `data/registry/locale-manifest.json`, `data/registry/locale-coverage-policy.json`, shared catalogs, and the public route graph.

## Summary

| Metric | Count |
|---|---:|
| rawPages | 11502 |
| native | 8924 |
| localizedShell | 2521 |
| englishFallback | 36 |
| unavailable | 20 |
| deprecated | 1 |
| indexableEligible | 10298 |
| sitemapEligible | 10298 |

## By locale

| Locale | Launch | Raw | Native | Shell | English fallback | Unavailable | Deprecated | Indexable | Catalog keys |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| en | default | 5955 | 5955 | 0 | 0 | 0 | 0 | 4995 | 180 |
| fr | launched | 3802 | 2180 | 1621 | 0 | 0 | 1 | 3622 | 180 |
| sw | launched | 1595 | 761 | 831 | 3 | 0 | 0 | 1584 | 180 |
| yo | partial | 45 | 9 | 13 | 3 | 20 | 0 | 22 | 180 |
| ha | partial | 105 | 19 | 56 | 30 | 0 | 0 | 75 | 180 |
| pt | planned | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ar | planned | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ig | planned | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

## By page type

| Page type | Raw | Native | Shell | English fallback | Unavailable | Deprecated | Indexable |
|---|---:|---:|---:|---:|---:|---:|---:|
| api | 3 | 3 | 0 | 0 | 0 | 0 | 3 |
| article | 495 | 495 | 0 | 0 | 0 | 0 | 493 |
| auth | 3 | 2 | 0 | 1 | 0 | 0 | 0 |
| category | 695 | 695 | 0 | 0 | 0 | 0 | 691 |
| country-tool | 514 | 186 | 327 | 0 | 0 | 1 | 510 |
| legal | 4 | 4 | 0 | 0 | 0 | 0 | 4 |
| page | 5404 | 4670 | 679 | 35 | 20 | 0 | 4780 |
| tool | 4005 | 2634 | 1371 | 0 | 0 | 0 | 3671 |
| widget | 379 | 235 | 144 | 0 | 0 | 0 | 146 |

## Definitions

- `native`: primary content and required shared UI are authored in the declared locale.
- `localizedShell`: localized UI around a declared language-neutral engine or dataset.
- `englishFallback`: an explicit, labelled English destination; never a translated equivalent.
- `unavailable`: no usable destination in the requested locale.
- `deprecated`: a documented former localized destination.
