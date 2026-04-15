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

## Repo Reality As Of April 15, 2026

The current French layer is substantial but inconsistent:

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

### 4. Visible placeholder or internal copy

Some French hubs still read like internal implementation notes rather than finished market-facing copy.

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
