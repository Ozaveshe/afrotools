# Search Snippet Quality: English, French, Swahili, Yoruba, Hausa

## Evidence boundary

- All current indexable public-locale route owners were inspected (English, French, Swahili, Yoruba, Hausa).
- The checked-in 28-day baseline covers 54,311 impressions and 446 clicks (0.82% CTR) across seven English routes.
- The repository contains a seven-route English GSC baseline, but no granular query/page export for other public locales. Static signals cannot prove what Google displayed or why a particular impression did not click.
- Length, duplication, brand order and language-marker findings are review signals. Search engines may rewrite snippets, so these are not ranking or CTR guarantees.

## Exact denominator

| Locale | Indexable pages | Native | Localized shell | Pages with errors | Pages with review signals |
|---|---:|---:|---:|---:|---:|
| en | 4019 | 4019 | 0 | 0 | 406 |
| fr | 2165 | 723 | 1442 | 0 | 122 |
| sw | 1584 | 762 | 822 | 0 | 87 |
| yo | 23 | 10 | 13 | 0 | 1 |
| ha | 81 | 23 | 58 | 0 | 1 |

## Signal counts

| Signal | Pages |
|---|---:|
| TITLE_LONG | 513 |
| DESCRIPTION_LONG | 125 |
| TITLE_SHORT | 22 |
| DESCRIPTION_SHORT | 11 |

## Ranked interpretation

1. Page-volume parity is not native-content parity. Localized shells are valid only where the neutral engine and surrounding task copy are genuinely useful; they need separate CTR review from native pages.
2. Exact same-locale title or description families weaken page differentiation. Repeated country templates should put the country and user job early in the snippet.
3. Localized routes that retain an English equivalent's entire title or description are the clearest snippet defects and should be fixed at the owning generator or manifest.
4. Brand-first and vague/length signals are secondary opportunities, not automatic failures. Actual GSC query/page rows should decide which high-impression pages move first.

## Largest exact-title families

| Locale | Pages | Title | Example routes |
|---|---:|---|---|

The row-level CSV is `reports/search-snippet-quality.csv`.
