# Non-Swahili Hreflang Backlog Plan

This is a separate French/global hreflang plan, not a Swahili blocker. The current validator output contains **502 carried hreflang warnings** and **0 warnings involving /sw/**. No site pages were edited in this pass.

## Validation Snapshot

- Command: `npm run validate:hreflang`
- Pages scanned: 7,788
- Pages with hreflang tags: 4,362
- Hreflang pairs found: 12,993
- Warnings parsed: 502
- Swahili warnings: 0

## Language Pair Groups

| Language pair | Warnings |
| --- | ---: |
| fr->en | 499 |
| en->fr | 3 |

## Route Family Groups

| Route family | Warnings |
| --- | ---: |
| tool-pages | 205 |
| blog-content | 145 |
| country-hubs-and-tax | 97 |
| misc-routes | 29 |
| top-level-hubs | 19 |
| travel | 4 |
| api-developer | 2 |
| trade-logistics | 1 |

## Separated Lanes

- French-related warnings: 502
- Hausa-related warnings: 0
- Yoruba-related warnings: 0
- English reciprocal missing for localized page: 499
- Localized reciprocal missing for English page: 3
- Likely generated-output issues: 452
- Likely script-mapping issues: 321
- Swahili out-of-scope warnings: 0

## Likely Source Owners

| Source owner | Warnings |
| --- | ---: |
| assets/js/components/tool-registry.js for discovery labels, scripts/build-i18n.js for route mapping, and page-level/generated tool HTML for reciprocal tags | 205 |
| blog/static content generation and paired English/French blog HTML | 145 |
| scripts/build-i18n.js country/PAYE/VAT mapping plus paired country or calculator HTML | 97 |
| page-level HTML unless a generator owns this family | 29 |
| page-level hub HTML and scripts/build-i18n.js top-level route mapping | 19 |
| travel route HTML and route alias mapping | 4 |
| page-level API/developer bridge HTML and any i18n route map aliases | 2 |
| trade/logistics route HTML or generator plus reciprocal English/French mappings | 1 |

## Fix Risk

| Risk | Warnings |
| --- | ---: |
| high | 205 |
| medium | 152 |
| medium-high | 97 |
| low-medium | 48 |

## Highest-Value Cleanup Order

1. **tool-pages**: 205 warnings. Owner: assets/js/components/tool-registry.js for discovery labels, scripts/build-i18n.js for route mapping, and page-level/generated tool HTML for reciprocal tags. Risk: high.
2. **blog-content**: 145 warnings. Owner: blog/static content generation and paired English/French blog HTML. Risk: medium.
3. **country-hubs-and-tax**: 97 warnings. Owner: scripts/build-i18n.js country/PAYE/VAT mapping plus paired country or calculator HTML. Risk: medium-high.
4. **misc-routes**: 29 warnings. Owner: page-level HTML unless a generator owns this family. Risk: low-medium.
5. **top-level-hubs**: 19 warnings. Owner: page-level hub HTML and scripts/build-i18n.js top-level route mapping. Risk: low-medium.
6. **travel**: 4 warnings. Owner: travel route HTML and route alias mapping. Risk: medium.
7. **api-developer**: 2 warnings. Owner: page-level API/developer bridge HTML and any i18n route map aliases. Risk: medium.
8. **trade-logistics**: 1 warnings. Owner: trade/logistics route HTML or generator plus reciprocal English/French mappings. Risk: medium.

## Recommended Prompt Batches

### FR-HREFLANG-1: French country, PAYE, and VAT reciprocal cleanup

Scope: French/English country hubs and tax calculators only, starting with high-count country-hubs-and-tax warnings.

Guardrails: Do not touch /sw/. Edit scripts/build-i18n.js only when route mapping owns the pair. Patch exact paired English/French pages only when reciprocal tags are page-level.

Validation: `npm run validate:hreflang`, `npm run build:i18n:validate`

### FR-HREFLANG-2: French tool-page reciprocal cleanup by generated source owner

Scope: French /outils/ and English /tools/ reciprocal pairs, grouped by registry-backed or generated tool families.

Guardrails: Do not rewrite tool copy. Do not hand-patch generated output when a generator owns it. Keep registry behavior unchanged unless a route alias is wrong.

Validation: `npm run validate:hreflang`, `npm run audit`, `npm run check-links`

### FR-HREFLANG-3: French top-level hubs and bridge pages

Scope: Top-level French hubs, API/developer bridges, travel/trade/agriculture hubs with missing English or French reciprocals.

Guardrails: Keep Swahili completion track separate. Mark English-only bridge pages honestly if discovered, but do not translate content in this hreflang prompt.

Validation: `npm run validate:hreflang`, `npm run seo:report`

### GLOBAL-HREFLANG-1: Hausa and Yoruba mapping audit before fixes

Scope: Read-only audit of any ha/ and yo/ warnings plus route map ownership.

Guardrails: Do not generate pages. Do not borrow French fixes blindly. Return a language-specific readiness verdict before edits.

Validation: `npm run validate:hreflang`

### GLOBAL-HREFLANG-2: Generated-output hreflang source repair

Scope: Resolve warnings whose true owner is generated output or script mapping, especially widgets, blog, and generated tool families.

Guardrails: Prefer source generator changes. Do not manually edit dist/. No broad build unless the generator requires it for source artifacts.

Validation: `npm run validate:hreflang`, `npm run build:i18n:validate`, `npm run seo:report`

## Swahili Boundary

Anything involving `/sw/` is out of scope for this backlog plan. The parsed validator output shows zero Swahili warnings, so this work should stay outside the Swahili completion track unless a future validation run regresses from zero.
