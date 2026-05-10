# AfroTools French Localization Strategy

## Purpose

This document is the operating system for AfroTools French-market expansion.

The goal is not "translate everything." The goal is to turn French into a first-class product surface for African users and French SEO, starting with the highest-value money pages and country-specific tools.

## Why This Matters

French is a real product and search opportunity for AfroTools:

- Francophone Africa is a large and growing digital market.
- AfroTools already has strong financial and country-specific surfaces that map well to French search intent.
- Country-specific tax, salary, VAT, payroll, and business tools are especially suited to French localization because user intent is practical, high-conviction, and repetitive.

External context worth remembering:

- The International Organisation of La Francophonie says most French speakers live in Africa.
- GSMA's 2024 Sub-Saharan Africa review shows the continent still has a large mobile internet usage gap, but closing it creates major growth upside for digital services.

Treat French as a long-term acquisition channel, not a side translation project.

## Historical Repo Reality As Of April 15, 2026

The April baseline showed that the French layer was substantial but inconsistent:

- `1,488` French HTML pages exist in `/fr/`.
- Only `64` French registry entries exist in `assets/js/components/tool-registry.js`.
- Only `23` page-specific French translation packs exist under `lang/pages/**/fr.json`.
- `npm run validate:hreflang` currently reports `124` errors and `1,440` warnings.
- The French registry currently contains duplicate salary-page entries pointing to the same URLs.
- The repo uses a mixed model:
  - generated French pages from `scripts/build-i18n.js`
  - hand-authored French pages
  - French polish overlays such as `scripts/polish-fr-paye-batch.js`
  - French registry entries that do not fully represent all existing French pages

This mixed model is the main reason batch work feels messy and agents stop halfway.

## Strict Gate After Sets 21-29 As Of May 9, 2026

Set 30 regenerated the French localization ledger and ran the full validation stack. The current French scorecard is:

- `5,650` English source pages.
- `1,532` French HTML pages after the second cars generator slice.
- `27.12%` raw French page-count completion.
- `25.01%` English-backed route-mapping completion.
- `193` French registry entries.
- `36.29%` French registry coverage for registry-eligible French tool, money, and PDF routes (`188/518`).
- `1,388` URLs in `sitemap-fr.xml`.
- `1,144` warnings from `npm run validate:hreflang`, with exit code 0 after the targeted reciprocity pass.
- `0` French pages with visible English UI signals in the ledger.

Compared with the post-Set-20 target baseline, the measured Set 30 values are unchanged:

- French HTML pages stayed at `1,508`.
- English-backed route-mapping completion stayed at `24.58%`.
- French registry coverage stayed at `27.22%`.
- registry-eligible French pages missing from discovery stayed at `377`.
- ledger missing reciprocal French hreflang pairs stayed at `1,160`.
- visible English UI signal pages stayed at `35` before the telecom launch slice.
- duplicate French canonical groups stayed at `4`.

The current controlled-wave target is partly hit, but French is still not ready for broad long-tail translation:

- French registry coverage is `36.29%`, above the `35%` target.
- English-backed route-mapping completion is `25.01%`, still below the `25.5%` target.
- visible English UI signal pages are `0` in the regenerated ledger.
- ledger missing reciprocal French hreflang pairs are `1,086`, below the `<1,100` target, while `npm run validate:hreflang` still reports broader warnings.
- duplicate French canonical groups meet the guardrail at `4`.

French is still not ready for broad long-tail translation. It needs controlled, high-value expansion where each batch produces measurable movement in registry discovery, route mapping, visible UI quality, and hreflang proof.

## Gate After Sets 41-49 As Of May 10, 2026

The Sets 41-49 gate regenerated `reports/french-localization-ledger.json` and `reports/french-localization-ledger.md`, then ran the full validation stack. The current scorecard is:

- `5,735` English source pages.
- `1,581` French HTML pages.
- `27.57%` raw French page-count completion.
- `25.53%` English-backed route-mapping completion.
- `295` French registry entries.
- `55.60%` French registry coverage for registry-eligible French routes (`288/518`).
- `499` ledger French reciprocal hreflang gaps.
- `0` visible English UI signal pages in the ledger.
- `0` duplicate French canonical groups.
- `0` registry entries pointing to missing French routes.
- Telecom remains at `9/15` mapped routes, or `60%` mapped coverage.

Measured against the latest health/telecom baseline:

- French registry coverage moved from about `36.29%` to `55.60%`, so the `>=42%` target is hit.
- English-backed route mapping moved from about `25.04%` to `25.53%`, so the `>=27%` target is missed.
- Telecom stayed at `9/15` mapped routes, so the `>=60%` telecom target is hit but has no buffer.
- Ledger reciprocal French hreflang gaps are now `499`, below the `<950` target.
- Duplicate French canonical groups did not increase.
- `npm run audit` reports `0` missing live/new registry pages.

Validation for this gate:

- `node scripts/build-french-localization-ledger.js` passed.
- `npm run build:i18n:validate` passed.
- `npm run validate:hreflang` passed with zero errors and `502` carried reciprocal warnings.
- `npm run seo:report` passed with no hreflang violations, but reported unrelated SEO debt in `reports/afrotools-api-ceo-brief-2026-05-10.html` and broad sitemap lastmod updates available.
- `npm run check-links` passed with no broken internal links.
- `npm run audit` passed with `0` missing live/new registry pages.

Verdict: French is stronger and discovery-ready in many high-value categories, but it is still not ready for broad long-tail translation. The missed `27%` mapped-coverage target means the next phase should stay controlled and focus on mapping, reciprocal hreflang, alias cleanup, and selected category waves rather than mass-generating French long-tail pages.

## Mapping Sprint 3 Guardrail

The first mapping-led pass after the Sets 41-49 gate found that the remaining unmapped French routes are not an 80-120 route pool. Most unmatched candidates point at source areas intentionally excluded from the public English source inventory (`docs`, `dashboard`, `pro`, `offline`, `404`) or are French-only editorial/bridge pages without an unambiguous English source route. The reusable rule is:

- Count `/fr/` as the French counterpart of the root English source even though the internal source key is empty.
- Keep `/fr/tools/**` mappings in `scripts/lib/french-tool-route-map.js` only for live, usable, non-alias tools whose English source is unambiguous.
- Do not count skipped source directories, noindex utility pages, iframe wrappers, deferred PDF wrappers, or French-only editorial bridges as mapped public English sources just to move the percentage.

After the root-source fix, mapped completion is `25.54%` (`1,465/5,735`). Reaching `27%` from the current page inventory is not possible through mapping alone; it needs either new usable French pages for existing public English routes or a generator-owned category wave such as cars/tools, with the same alias and noindex exclusions.

## Cars Generator Wave 4 As Of May 10, 2026

The first category-owned page wave after Mapping Sprint 3 expanded French cars through `scripts/generate-fr-cars-launch-pages.js`, not manual cloning. The generator now creates:

- `20` French cars country pages.
- `34` French cars make pages.
- `36` French cars model-index pages.
- `53` French cars year-detail pages.
- `/fr/cars/` as the French cars hub.

This moved mapped completion from `25.54%` (`1,465/5,735`) to `26.77%` (`1,535/5,735`). Cars moved from `76` to `146` unique mapped English sources, while duplicate French canonicals stayed at `0` and registry coverage was intentionally unchanged. Cars pages remain generator-owned, use French country slugs where the French product already does, and label non-rule-pack markets as estimates rather than official customs calculations.

The remaining lift to the `27%` mapped gate is about `14` unique English-backed French routes. The next safe route is another small generator-owned cars slice, not registry stuffing or alias promotion.

## Completed And Measured Waves Through Set 30

The completed French waves through Set 20 established the current baseline:

1. Set 1: localization ledger, route inventory, and baseline blocker list.
2. Set 2: French URL ownership and preferred route rules.
3. Set 3: main French entry points and honest hub state.
4. Set 4: registry-backed French discovery for existing live tools.
5. Sets 5-6: core and next-wave francophone salary/PAYE quality.
6. Set 7: VAT and business tax pairing for the salary cluster.
7. Set 8: pan-African French money tools.
8. Set 9: safe French document/PDF coverage.
9. Set 10: French blog quality and encoding cleanup.
10. Sets 11-12: main and remaining francophone country hubs.
11. Set 13: practical business and productivity tools.
12. Set 14: education tools and JAMB deferral decision.
13. Set 15: health, jobs, travel, and property support tools.
14. Set 16: agriculture quality audit rather than mass translation.
15. Set 17: first safe French cars launch slice.
16. Set 18: French widgets hub and iframe SEO audit.
17. Set 19: French account, auth, dashboard, and Pro entry surfaces.
18. Set 20: strict French scorecard and target-setting gate.
19. Set 30: target gate after the intended Sets 21-29 wave. The ledger did not show measurable movement against the next target, so the same controlled priorities remain active.
20. Set 31: first French telecom launch slice with `/fr/telecom/` plus eight usable telecom tools and registry-backed discovery.
21. Set 32: second French cars generator slice, expanding `/fr/cars/` from the initial six-market launch to ten markets and fifteen model-detail pages while keeping long-tail pages generator-owned.
22. Set 33: explicit French tool route mapping for 77 live, non-alias `/fr/tools/` pages through `scripts/lib/french-tool-route-map.js`.
23. Sets 41-49: controlled French category waves across education/jobs, travel, transport/import, energy utilities, and registry discovery. These waves moved registry coverage materially above target, but did not move mapped route coverage enough for long-tail translation.

## Next 10 Batch Recommendations

Use these batches before broad long-tail translation. Each batch should report before/after movement against the target metrics, especially mapped coverage.

1. French mapping sprint 3: add explicit mappings only for usable `/fr/tools/` pages whose English source is unambiguous, targeting enough pairs to move mapped coverage toward `27%`.
2. Salary/PAYE and VAT alias cleanup: reduce the remaining duplicate English mappings for Benin, Chad, Comoros, Djibouti, Madagascar, Mauritania, and ECOWAS levy without promoting aliases.
3. Country-code PAYE/VAT registry reconciliation: add or correct registry rows only for preferred French salary and VAT routes already live and useful.
4. Reciprocal hreflang repair batch: fix 100-150 clean en/fr pairs from the `499` ledger gap list, prioritizing preferred tools, country hubs, and salary/VAT routes.
5. Cars generator wave 4: increase mapped French cars coverage through generator-owned market/model pages, not manual long-tail duplication.
6. Widgets French parent-page batch: build or improve only real French widget parent pages, keeping iframe utilities noindex and out of sitemap promotion.
7. Trade/import/logistics follow-up: localize and map remaining live French trade tools such as Incoterms, demurrage, export docs, HS lookup, and AfCFTA tracker.
8. Energy/transport hub creation: create stable French hubs for energy and transport only after route ownership is clear, then connect existing French utility tools.
9. Blog reciprocal/discovery cleanup: keep article bodies stable, but repair French blog metadata, internal links, registry/discovery rows, and reciprocal alternates where sources are clear.
10. Gate after mapping sprint: rerun the ledger and validation suite; only consider broad long-tail translation if mapped coverage reaches `27%`, telecom stays at or above `60%`, duplicate canonicals remain `0`, and missing live/new registry pages remain `0`.

## Remaining High-Risk Route Families

- `/fr/cape-verde/*` and `/fr/eq-guinea/*`: duplicate canonical families plus English PAYE/VAT UI.
- French country-code PAYE/VAT aliases such as `/fr/*/*-paye` and `/fr/*/*-vat`: useful as aliases, risky as promoted routes.
- `/fr/cars/**`: generated launch slice now covers ten markets and fifteen model-detail pages, but the English car catalog is much larger and must not be copied by hand.
- `/fr/widgets/**` and `widgets/iframe/**`: keep iframe utility routes out of French SEO and sitemap promotion unless a real French parent tool exists.
- `/fr/dashboard/api/`, `/fr/dashboard/vault/`, `/fr/pro/success/`: account-adjacent wrappers need explicit ownership before promotion.
- `/fr/business/`, `/fr/data-productivity/`, `/fr/developers/`, `/fr/finance/`: redirect or bridge surfaces with mixed English labels.
- `/fr/blog/**`: strong page count, but registry discovery and visible UI polish still lag.
- `/fr/agriculture/**`: high raw coverage, but reciprocal hreflang debt is still broad.
- `/fr/telecom/**`: first launch slice now includes business internet; USSD, airtime, SIM registration, number portability, Starlink, and TV still need ownership decisions before French promotion.
- `/fr/tools/**`: still the largest long-tail gap, with only `13.03%` mapped coverage.

## Strategic Thesis

AfroTools should win French by doing four things in order:

1. Stabilize the architecture.
2. Prioritize the revenue and search clusters.
3. Localize in small, controlled batches.
4. Treat French SEO as a rewrite and product-design problem, not a string-replacement problem.

## Non-Negotiables

- Country-related tools for francophone or French-first markets must have a real French front-facing app surface.
- French pages must be rewritten for native search intent, not mechanically translated.
- Each batch must choose a source of truth first:
  - registry
  - `lang/pages/**`
  - generated output
  - hand-authored French page
- Do not mix generated and hand-authored edits in the same batch unless the batch explicitly calls for both.
- Keep implementation batches small enough that an agent can finish cleanly without timing out or drifting.
- After meaningful French or language-routing changes, run:
  - `npm run build:i18n:validate`
  - `npm run validate:hreflang`

## Immediate Risks To Fix Before Scaling Harder

### 1. Hreflang debt

French SEO upside will be capped while hreflang is noisy.

Current failures include:

- French pages referencing non-existent English URLs
- pages with the wrong `<html lang="">`
- missing self-references
- duplicate hreflang tags
- English-path pages that actually contain French content

### 2. Registry duplication

Multiple French salary routes currently have duplicate registry rows pointing to the same URL, for example:

- `/fr/cote-divoire/calculateur-salaire-net`
- `/fr/senegal/calculateur-salaire-net`
- `/fr/cameroun/calculateur-salaire-net`
- `/fr/rdc/calculateur-salaire-net`
- `/fr/maroc/calculateur-salaire-net`

This distorts counts, hub rendering, filtering, and internal linking.

### 3. URL strategy drift

French content currently lives under a mix of patterns:

- `/fr/<country>/calculateur-salaire-net`
- `/fr/<country>/<cc>-paye`
- `/salary-tax/francophone/` with French content on a non-`/fr/` path

Choose one durable strategy per surface and stop improvising.

#### Current URL ownership rule

As of May 2026, French country and money pages should use semantic French routes as the source of truth:

- country hubs: `/fr/<french-country-slug>/`
- salary and PAYE pages: `/fr/<french-country-slug>/calculateur-salaire-net`
- VAT pages: `/fr/<french-country-slug>/calculateur-tva`
- PDF/document hub: `/fr/document-pdf/`

Country-code routes such as `/fr/<country>/<cc>-paye`, `/fr/<country>/<cc>-vat`, and English-country French paths such as `/fr/morocco/ma-paye` are aliases only when `_redirects` already maps them to a preferred French route and the preferred target exists. Do not add registry rows, hub links, or new translation work to alias routes.

`scripts/build-i18n.js` must resolve English counterparts to the preferred French route before falling back to discovered `/fr/` files. This keeps generated hreflang, alternate maps, and localization ledgers from treating old aliases as independent French pages.

### 4. Visible placeholder or internal copy

Some French hubs still read like internal implementation notes rather than finished market-facing copy.

#### Current French entry-point rule

The main French entry points should behave like a French product surface, not a translated copy of the English catalogue. Keep these pages honest:

- `/fr/` introduces the French product and links to real French hubs.
- `/fr/all-tools/` lists registry entries already marked as French, not the full English catalogue.
- `/fr/countries/` links to preferred French country routes when those routes exist.
- `/fr/salary-tax/` and `/fr/vat-business-tax/` promote available French salary and VAT routes only.
- `/fr/document-pdf/` is the safe promoted PDF hub. Do not promote deferred PDF wrappers such as `/fr/tools/espace-pdf/`, `/fr/tools/workflow-pdf/`, or `/fr/tools/editeur-pdf/` until their source of truth is settled.

#### French registry discovery rule

French tool discovery should promote one registry row per useful live French route. Add `lang: 'fr'`, accurate `category`, `countries`, `status`, and `priority`; do not add rows for alias URLs, noindex redirect pages, iframe-only wrappers, or deferred wrappers. When a French route is a localized counterpart of an English tool, keep the French row separate from the English id and use the preferred French href.

French tool route ownership for non-matching slugs lives in `scripts/lib/french-tool-route-map.js`. Add to that map only when the French page is live, usable, non-alias, and has a clear English source route. `scripts/build-i18n.js` and `scripts/build-french-localization-ledger.js` both consume this map so sitemap/hreflang discovery and ledger metrics use the same source of truth.

For document/PDF discovery, `/fr/document-pdf/` may read safe French PDF tools from the registry, but it must continue to exclude `/fr/tools/espace-pdf/`, `/fr/tools/workflow-pdf/`, `/fr/tools/editeur-pdf/`, and `/fr/tools/document-pdf/`.

#### French cars launch rule

Cars are generated from `data/cars/price-intelligence.json`, `data/cars/master-vehicle-catalog.csv`, and the English route generator in `scripts/generate-car-price-pages.js`. Do not hand-create hundreds of French car pages.

The French cars surface starts with `/fr/cars/` plus a small set of country and model pages generated by `scripts/generate-fr-cars-launch-pages.js`. French cars routes should use French country slugs where that is the rest of the French product, for example:

- `/fr/cars/cameroun/` maps to `/cars/cameroon/`
- `/fr/cars/maroc/` maps to `/cars/morocco/`
- `/fr/cars/algerie/` maps to `/cars/algeria/`
- `/fr/cars/tunisie/` maps to `/cars/tunisia/`

The current French cars slice is intentionally limited to ten markets and fifteen model pages. Pages for countries without full customs rule packs must say they are directory estimates and must not present themselves as official import-duty calculators. Future French car expansion should extend the generator with make/model category pages and selected import-vs-local comparison pages, not manually duplicate the English catalog.

#### French widget generation rule

French widget-facing pages should promote usable French tool surfaces, not iframe utility routes. `/fr/widgets/` is the French widget hub, and `/fr/widgets/demo/` may explain the technical gallery while making clear that the gallery still contains English widgets.

Keep `widgets/iframe/` and any French iframe wrappers as integration utilities: `noindex, follow`, canonicalized to the full parent tool or, for templates without a parent tool, the French widgets hub. Do not put iframe utility pages in sitemap generation, registry-backed discovery, or French completion counts. A widget becomes promotable in French only when the visible tool or its parent page is usable in French.

## What To Prioritize First

### Priority 1: Front-facing French financial entry points

These define whether French feels like a product:

- `fr/index.html`
- `fr/salary-tax/index.html`
- French Francophone financial hub
- top French country hubs

These pages should feel intentional, polished, and conversion-ready before bulk expansion continues.

### Priority 2: Salary and PAYE cluster

This is the strongest French wedge because intent is practical and country-specific.

Focus on:

- Côte d'Ivoire
- Sénégal
- Cameroun
- RDC
- Maroc
- Algérie
- Tunisie
- Burkina Faso
- Mali
- Niger
- Guinée
- Bénin
- Togo
- Gabon
- Congo
- Madagascar

Rule: if a tool is country-related and the country is meaningfully French-speaking or French-administered in practice, the French version should exist before lower-value generic localization work.

### Priority 3: VAT and business-tax pairings for the same countries

After salary/PAYE pages, pair each market with its adjacent tax-intent surfaces:

- VAT
- invoice generation
- import duty
- transfer/remittance comparison
- mobile money fee comparison

This builds topical authority instead of isolated pages.

### Priority 4: Pan-African French financial tools

Prioritize tools already present in the French registry:

- currency converter
- invoice generator
- VAT calculator
- import duty calculator
- mobile money fees
- money transfer comparison

### Priority 5: Supporting French content

Only after the core money surfaces are stable:

- comparison pages
- tax explainers
- FAQ-led blog posts
- country-specific guides

## Markets By Wave

### Wave 1: Core francophone revenue markets

- Côte d'Ivoire
- Sénégal
- Cameroun
- RDC
- Maroc
- Algérie
- Tunisie

Why:

- strongest fit for salary, payroll, VAT, and business-intent searches
- already partially represented in French registry and page set
- good foundation for a French financial authority cluster

### Wave 2: West and Central African expansion

- Burkina Faso
- Mali
- Niger
- Guinée
- Bénin
- Togo
- Gabon
- Congo

Why:

- language fit remains strong
- same salary-and-tax pattern repeats cleanly
- efficient batching opportunity

### Wave 3: Secondary but strategically useful markets

- Madagascar
- Burundi
- Djibouti
- Mauritanie
- Centrafrique
- Comores
- Guinée équatoriale
- Cap-Vert

Why:

- lower immediate traffic, but strong topical completeness
- good follow-on set once the main cluster is clean

## Batch Design Rules

To avoid agent stalls and half-finished waves, keep batches narrow.

### Safe batch sizes

- `1` French hub page plus `3-5` calculator pages
- or `4-6` pages from one country family
- or `1` tool family plus `1` QA pass

Avoid:

- "translate the whole category"
- mixed salary, agriculture, blog, and app work in one run
- large unbounded prompt chains

### Preferred batch structure

Batch A:

- one strategic hub
- three to five linked French tools
- one QA pass

Batch B:

- one country hub
- one salary/PAYE page
- one VAT page
- one supporting explainer or comparison page

Batch C:

- one pan-African French tool family
- metadata pass
- schema pass
- link pass

## French SEO Playbook

### 1. Build clusters, not isolated pages

The winning pattern is:

- French hub
- country hub
- salary/PAYE page
- VAT page
- comparison page
- explainer or FAQ article

### 2. Write for search intent in French

Target phrases users actually search for, such as:

- `calculateur salaire net`
- `calculateur paye`
- `barème irpp`
- `cotisations cnps`
- `calculateur tva`
- `coût employeur`
- `salaire brut net`
- `impôt sur le revenu`

Do not simply mirror English phrasing when a native French formulation is more obvious.

### 3. Localize terminology by market

Use market-appropriate language:

- `salaire net`
- `salaire brut`
- `cotisations`
- `retenues`
- `coût employeur`
- `barème`
- `tranches`
- `impôt`
- `TVA`

Do not over-standardize across countries when local institutions differ.

### 4. Make the app itself French

French SEO gains are weakened if the metadata is French but the app UI, errors, PDF flow, share text, and result labels are still partly English.

### 5. Keep schema and FAQs native

French pages should have:

- French title and description
- French FAQ schema
- French breadcrumb labels
- French `inLanguage`
- country-specific financial wording

## Definition Of Done For A French Tool

A French tool page is done only when all of the following are true:

- the page copy reads like native French, not translated English
- the app UI is French
- result labels and share/PDF flows are French
- metadata and OG copy are French
- FAQ and schema are French
- canonical is self-referential
- hreflang is correct and bidirectional where appropriate
- the French route appears exactly once in the registry
- the page is linked from the correct French hub

## Prompt Design Rules For Claude

### General rules

- Always define the exact file scope.
- Always define the batch size.
- Always tell Claude not to expand scope.
- Always require source-of-truth selection before editing.
- Always require a post-edit validation report.

### Reusable prompt: French batch planner

```text
You are coordinating a French localization batch for AfroTools.

Goal:
- Improve French-market product quality and French SEO.
- Do not translate mechanically.
- Do not expand scope beyond the listed files.

Before editing:
1. Identify the source of truth for each target:
   - registry
   - lang/pages JSON
   - generated output
   - hand-authored French page
2. Flag any conflicts before touching files.
3. Keep the batch small enough to finish cleanly.

Batch scope:
- [LIST FILES HERE]

Required outputs:
1. Short assessment of the source of truth per file.
2. Exact edits made.
3. Any SEO or hreflang risks discovered.
4. Validation run and result summary.

Constraints:
- Rewrite for native French search intent.
- Preserve calculator logic.
- Keep app UI fully French.
- Do not create duplicate registry entries.
- Do not touch unrelated files.
```

### Reusable prompt: French tool rewrite

```text
Rewrite this AfroTools calculator page for native French users in Africa.

Do not do a literal translation.
Write as a strong localized financial product page.

You must:
- preserve the calculation logic
- improve the French title, meta description, hero copy, labels, FAQs, and schema
- make the UI feel written by a native French product team
- use country-specific fiscal terminology
- keep the tone practical, clear, and authoritative

You must not:
- invent tax rules
- add unsupported features
- leave English UI fragments behind
- change scope outside the listed files

Files:
- [LIST FILES HERE]

Validation required:
- confirm canonical and hreflang state
- confirm any registry edits
- report anything still English after the pass
```

### Reusable prompt: French hub/page architecture pass

```text
Improve this French hub page so it works as a real acquisition and navigation page, not a placeholder.

Focus on:
- stronger French-market headline and intro
- clear hierarchy
- honest tool counts
- internal linking to the right French pages
- category framing that makes sense in French
- SEO-focused but natural copy

Do not:
- claim coverage that does not exist
- use internal planning language in the final copy
- add generic filler paragraphs

Files:
- [LIST FILES HERE]
```

### Reusable prompt: French SEO QA reviewer

```text
Review this French batch like a strict SEO and localization editor.

Check:
- natural French phrasing
- country-specific terminology
- title and meta quality
- canonical correctness
- hreflang correctness
- internal links to French surfaces
- schema language
- duplicated registry rows
- leftover English text

Return:
1. Critical issues
2. Medium issues
3. Nice-to-have improvements

Do not rewrite files unless asked.
```

## Recommended Execution Order

### Phase 0: Stabilize

- choose canonical French URL conventions
- enforce preferred French route ownership in `scripts/build-i18n.js`
- clean duplicate French registry rows
- fix the highest-signal hreflang issues on French financial surfaces

### Phase 1: French money entry points

- `fr/index.html`
- `fr/salary-tax/index.html`
- Francophone financial hub
- core country hubs

### Phase 2: Salary/PAYE wave

Start with the seven core markets, then expand to the next eight.

### Phase 3: VAT and adjacent business tools

Pair each strong salary market with VAT and business-intent tools.

### Phase 4: Content support

Add French comparison and explainer content only after the underlying tool cluster is solid.

## What Not To Do

- Do not localize everything at once.
- Do not start with huge low-monetization categories just because many pages already exist.
- Do not trust registry counts if duplicate French routes still exist.
- Do not ship French pages with mixed English UI.
- Do not grow French SEO on top of broken hreflang foundations.

## Recommended Metrics

Track French progress with simple operational numbers:

- French registry entries
- French tool routes with unique canonical URLs
- French financial pages with clean hreflang
- French country clusters completed
- French app surfaces fully localized
- French pages linked from French hubs

## Default Working Principle

French should expand like a product line:

- architecture first
- money pages second
- country clusters third
- supporting content fourth

If there is a tradeoff, choose the option that produces fewer but better French pages with cleaner SEO and clearer ownership.

### Education And JAMB Rule

Education localization should prioritize pan-African or francophone-relevant tools first: GPA/CGPA, university comparison, scholarship and study-planning surfaces, and broad exam calculators.

JAMB is different. AfroJAMB is a Nigeria-specific acquisition surface with 255 English pages. Do not mass-translate `/jamb/**` into French unless there is a clear market reason, such as verified francophone Nigeria demand, search data for French JAMB queries, or a campaign aimed at French-speaking candidates applying to Nigerian universities.

Current decision:

- Keep `/jamb/**` English.
- Keep `/fr/tools/calculateur-jamb/` as a narrow French bridge for the aggregate calculator only.
- Do not add `/fr/jamb/**` SEO pages in general French batches.
- A future JAMB batch, if approved, should start with one French explainer hub, the aggregate calculator, and at most 5-10 highest-intent subject/year pages before expanding further.
