# Localization Coverage Report

Generated from `data/registry/locale-manifest.json`, `data/registry/locale-coverage-policy.json`, shared catalogs, and the public route graph.

## Summary

| Metric | Count |
|---|---:|
| rawPages | 10283 |
| native | 8103 |
| localizedShell | 2121 |
| englishFallback | 38 |
| unavailable | 21 |
| deprecated | 0 |
| indexableEligible | 9301 |
| sitemapEligible | 9301 |

## By locale

| Locale | Launch | Raw | Native | Shell | English fallback | Unavailable | Deprecated | Indexable | Catalog keys |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| en | default | 5852 | 5852 | 0 | 0 | 0 | 0 | 5012 | 180 |
| fr | launched | 3421 | 2087 | 1334 | 0 | 0 | 0 | 3341 | 180 |
| sw | launched | 860 | 144 | 713 | 3 | 0 | 0 | 854 | 180 |
| yo | partial | 45 | 8 | 13 | 3 | 21 | 0 | 21 | 180 |
| ha | partial | 105 | 12 | 61 | 32 | 0 | 0 | 73 | 180 |
| pt | planned | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ar | planned | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ig | planned | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

## By page type

| Page type | Raw | Native | Shell | English fallback | Unavailable | Deprecated | Indexable |
|---|---:|---:|---:|---:|---:|---:|---:|
| api | 3 | 3 | 0 | 0 | 0 | 0 | 3 |
| article | 377 | 377 | 0 | 0 | 0 | 0 | 375 |
| auth | 3 | 2 | 0 | 1 | 0 | 0 | 0 |
| category | 694 | 694 | 0 | 0 | 0 | 0 | 690 |
| country-tool | 497 | 107 | 390 | 0 | 0 | 0 | 463 |
| legal | 3 | 3 | 0 | 0 | 0 | 0 | 3 |
| page | 4697 | 4104 | 535 | 37 | 21 | 0 | 4064 |
| tool | 3640 | 2588 | 1052 | 0 | 0 | 0 | 3557 |
| widget | 369 | 225 | 144 | 0 | 0 | 0 | 146 |

## Definitions

- `native`: primary content and required shared UI are authored in the declared locale.
- `localizedShell`: localized UI around a declared language-neutral engine or dataset.
- `englishFallback`: an explicit, labelled English destination; never a translated equivalent.
- `unavailable`: no usable destination in the requested locale.
- `deprecated`: a documented former localized destination.
