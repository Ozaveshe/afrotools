# Localization Coverage Report

Generated from `data/registry/locale-manifest.json`, `data/registry/locale-coverage-policy.json`, shared catalogs, and the public route graph.

## Summary

| Metric | Count |
|---|---:|
| rawPages | 11516 |
| native | 8946 |
| localizedShell | 2516 |
| englishFallback | 33 |
| unavailable | 20 |
| deprecated | 1 |
| indexableEligible | 9937 |
| sitemapEligible | 9937 |

## By locale

| Locale | Launch | Raw | Native | Shell | English fallback | Unavailable | Deprecated | Indexable | Catalog keys |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| en | default | 5970 | 5970 | 0 | 0 | 0 | 0 | 5010 | 180 |
| fr | launched | 3802 | 2183 | 1618 | 0 | 0 | 1 | 3243 | 180 |
| sw | launched | 1594 | 762 | 827 | 5 | 0 | 0 | 1582 | 180 |
| yo | partial | 45 | 9 | 13 | 3 | 20 | 0 | 22 | 180 |
| ha | launched | 105 | 22 | 58 | 25 | 0 | 0 | 80 | 180 |
| pt | planned | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ar | planned | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ig | planned | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

## By page type

| Page type | Raw | Native | Shell | English fallback | Unavailable | Deprecated | Indexable |
|---|---:|---:|---:|---:|---:|---:|---:|
| api | 3 | 3 | 0 | 0 | 0 | 0 | 3 |
| article | 517 | 517 | 0 | 0 | 0 | 0 | 387 |
| auth | 3 | 2 | 0 | 1 | 0 | 0 | 0 |
| category | 695 | 695 | 0 | 0 | 0 | 0 | 691 |
| country-tool | 514 | 186 | 327 | 0 | 0 | 1 | 510 |
| legal | 4 | 4 | 0 | 0 | 0 | 0 | 4 |
| page | 5401 | 4672 | 677 | 32 | 20 | 0 | 4546 |
| tool | 4000 | 2632 | 1368 | 0 | 0 | 0 | 3651 |
| widget | 379 | 235 | 144 | 0 | 0 | 0 | 145 |

## Definitions

- `native`: primary content and required shared UI are authored in the declared locale.
- `localizedShell`: localized UI around a declared language-neutral engine or dataset.
- `englishFallback`: an explicit, labelled English destination; never a translated equivalent.
- `unavailable`: no usable destination in the requested locale.
- `deprecated`: a documented former localized destination.
