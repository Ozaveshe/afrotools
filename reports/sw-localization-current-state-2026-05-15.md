# Swahili Localization Current State - 2026-05-15

This report syncs the Swahili operating record with the current source tree and registry after Wave 6 search and registry work. It is documentation-only: no page copy, French pages, generated output, or `dist/` files were changed.

## Inputs Read

- `reports/sw-localization-audit.json`
- `reports/sw-registry-promotion-wave4.json`
- `reports/sw-registry-promotion-wave5.json`
- `reports/sw-registry-promotion-wave6.json`
- `reports/sw-browser-search-qa-wave6.json`
- `reports/non-swahili-hreflang-backlog-plan.md`
- `sw/**/*.html`
- `assets/js/components/tool-registry.js`

## Recomputed Source-Tree Counts

| Metric | Current value |
| --- | ---: |
| Swahili HTML routes under `/sw/` | 852 |
| Indexable Swahili routes | 850 |
| Noindex Swahili routes | 2 |
| HTML routes under `/sw/zana/` | 519 |
| Direct `/sw/zana/<slug>/` routes | 465 |
| Nested `/sw/zana/mwongozo-tin/<country>/` routes | 54 |
| Indexable direct `/sw/zana/<slug>/` routes | 465 |

## Recomputed Registry Counts

| Metric | Current value |
| --- | ---: |
| Unique Swahili registry hrefs | 620 |
| Resolving Swahili registry hrefs | 620 |
| Broken Swahili registry hrefs | 0 |
| Unique registry hrefs under `/sw/zana/` | 369 |
| Resolving registry hrefs under `/sw/zana/` | 369 |
| Broken registry hrefs under `/sw/zana/` | 0 |
| Direct `/sw/zana/<slug>/` routes covered by registry | 315 |
| Direct `/sw/zana/<slug>/` registry coverage | 67.74% |

The old `6` Swahili registry entry baseline is historical. Current planning should use `620/620` resolving Swahili registry hrefs and `369/369` resolving `/sw/zana/` registry hrefs.

## Registry Category Mix

| Category | Swahili rows |
| --- | ---: |
| ecommerce | 160 |
| financial | 90 |
| african | 55 |
| document-pdf | 35 |
| agriculture | 33 |
| hr-payroll | 32 |
| legal | 32 |
| education | 22 |
| image-design | 21 |
| energy | 18 |
| personal-finance | 15 |
| government | 14 |
| insurance | 13 |
| trade | 12 |
| health | 11 |
| telecom | 11 |
| fintech | 10 |
| transport | 9 |
| engineering | 8 |
| climate | 6 |
| religious-cultural | 5 |
| small-business | 4 |
| data-productivity | 2 |
| diaspora | 1 |
| travel-tourism | 1 |

## Wave 4-6 Registry History

| Wave | Result |
| --- | --- |
| Historical May 9 audit | `6` Swahili registry entries |
| May 9 discovery repair | raised Swahili registry rows to `352` |
| Wave 4 | added `52` strong existing `/sw/zana/` routes |
| Wave 5 | added `30` screened `/sw/zana/` routes |
| Wave 6 | accepted `7`, refused `150`, kept `40` in the polish queue |

## Search QA Status

`reports/sw-browser-search-qa-wave6.json` tested `/sw/`, `/sw/zana-zote/`, and `/sw/tools/` at desktop and mobile widths.

| Metric | Wave 6 value |
| --- | ---: |
| Page and viewport checks | 6 |
| Query checks | 42 |
| Search buckets | 21 |
| Buckets marked good | 21 |
| Missing expected result queries | 0 |
| English-only result queries | 0 |
| Duplicate href queries | 0 |

Search is healthy at the Wave 6 checkpoint. This does not make refused routes promotion-ready; it only proves the shared search surface is not the blocker.

## Hreflang Status

`reports/non-swahili-hreflang-backlog-plan.md` records the prior separated backlog as `502` carried hreflang warnings and `0` involving `/sw/`.

The May 15 validation rerun is cleaner:

| Command | Result |
| --- | --- |
| `npm run build:i18n:validate` | Passed for `fr`, `sw`, `yo`, and `ha` key parity |
| `npm run validate:hreflang` | Scanned `7,750` pages, checked `7,748` pages with hreflang tags, validated `19,665` pairs, and reported all checks passed with `0` errors and no warnings printed |

Zero `/sw/` hreflang warning status is still true. Keep Swahili at zero `/sw/` warnings and treat any future French/global reciprocal warnings as a separate backlog unless a future validation run shows a Swahili regression.

## Recommendation

Polish refused and high-potential pages before more registry promotion. Prompts 62-69 should make the refused lanes genuinely useful first; Prompt 70 should promote only from those polished pages rather than scanning the whole `/sw/zana/` tree for easy count gains.
