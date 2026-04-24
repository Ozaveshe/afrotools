# AfroTools Swahili Localization Strategy

## Purpose

This document is the operating system for AfroTools Swahili expansion.

The goal is not "translate all 2,550+ tools." The goal is to turn Swahili into a strong East African product surface with real acquisition value, strong local-language SEO, and a batch process that agents can actually finish.

## Why This Matters

Swahili is a real product and search opportunity for AfroTools:

- East Africa has a large and underserved local-language finance audience.
- Salary, PAYE, VAT, remittance, invoice, and mobile-money tools match strong practical search intent.
- Swahili works best when it feels native, modern, and useful, not like a classroom translation.
- If AfroTools becomes the default Kiswahili finance-tool surface, the SEO upside compounds while paid acquisition stays low.

Treat Swahili as a product line, not a localization checkbox.

## Repo Reality As Of April 15, 2026

The current Swahili surface is much larger than its maintenance layer:

- `189` Swahili HTML pages exist under `/sw/`.
- `0` page-specific Swahili translation packs exist under `lang/pages/**/sw.json`.
- Only `6` Swahili registry entries exist in `assets/js/components/tool-registry.js`.
- The Swahili surface currently includes roughly:
  - `54` country PAYE pages
  - `60` country hubs
  - `32` tool pages under `/sw/zana/**`
  - `16` agriculture pages
  - `9` salary cluster pages
- `npm run validate:hreflang` currently reports `124` errors and `1,440` warnings across the repo, including Swahili-specific broken mappings and many non-bidirectional language pairs.
- `scripts/build-i18n.js` supports `sw` and maps existing `/sw/` pages for hreflang and sitemap use.
- The same build script includes French-specific polish layers such as French PAYE fallbacks and French share-text overrides, but no equivalent Swahili polish layer.

This mixed model is the main reason Swahili work feels messy:

- the visible surface is large
- the source of truth is inconsistent
- the registry does not represent the real Swahili surface
- the build system can recognize Swahili, but it cannot yet polish Swahili the way it polishes French

## Strategic Thesis

AfroTools should win Swahili by doing four things in order:

1. Stabilize the architecture.
2. Polish the app shell and acquisition entry points.
3. Own the East Africa salary and PAYE wedge.
4. Expand into adjacent business-intent tools only after the core is clean.

Swahili should not start as "all of Africa in Kiswahili." It should start as "the best Swahili finance and work-tool experience for East Africa."

## Non-Negotiables

- Swahili must be treated as a product surface, not a string dump.
- High-value Swahili pages must read like native digital-product Kiswahili.
- Do not over-translate widely recognized finance terms if users actually search the English acronym.
- Use modern, practical Kiswahili and keep familiar terms such as `PAYE`, `VAT`, `PDF`, `NSSF`, `SHIF`, and `PAYE` where search behavior or product clarity makes that the better choice.
- Choose the source of truth before editing:
  - hand-authored `/sw/` page
  - `lang/pages/**/sw.json`
  - registry
  - generated output
- Do not mix generation strategy and manual page rewrites in the same batch unless the batch explicitly calls for both.
- Do not add a Swahili registry entry until the page is actually ship-ready.
- Keep batches small enough that Claude or Codex can finish without drifting.

## Immediate Risks To Fix Before Scaling Harder

### 1. Registry under-represents Swahili

The repo has `189` Swahili pages but only `6` Swahili registry entries.

That means:

- search relevance is skewed
- discovery cards under-represent Swahili
- counts and hub logic are misleading
- a page can exist without being properly discoverable

### 2. Swahili pages have almost no reusable source layer

There are currently `0` `lang/pages/**/sw.json` files.

That means the Swahili surface is hard to regenerate, hard to batch safely, and hard to keep consistent across repeated agent runs.

### 3. Hreflang and route mappings are noisy

Current Swahili issues include:

- `/sw/404.html` self-reference failures
- Swahili pages pointing to non-existent English targets
- many Swahili pages that are not bidirectional with their English or French counterparts
- category-level mappings that resolve to tool URLs that do not exist

SEO upside will be capped while this remains noisy.

### 4. The build pipeline is Swahili-aware but not Swahili-polished

The i18n system can build and map Swahili, but the baked-in polish helpers are still French-specific.

That means high-value Swahili pages should not rely on naive build output alone.

### 5. Scope is too wide for good local-language quality

The current `/sw/` surface already stretches across:

- East Africa money tools
- agriculture
- work documents
- AI tools
- broad country coverage

This is too much to perfect at once.

## What To Prioritize First

### Priority 1: App shell and front-facing Swahili entry points

These pages define whether Swahili feels like a real product:

- `sw/index.html`
- `sw/zana-zote/index.html`
- `sw/mshahara-na-kodi/index.html`
- `sw/nchi/index.html`
- shared search, autocomplete, nav, footer, empty states, share text, PDF flows, and result labels

If the shell is mixed or inconsistent, the rest of the rollout will feel fake.

### Priority 2: East Africa salary and PAYE cluster

This is the strongest Swahili wedge.

Start with:

- Kenya
- Tanzania
- Uganda
- Rwanda
- Burundi

For each market, aim to complete:

- country hub
- PAYE page
- category routing from Swahili salary hub
- internal links back to Swahili entry points

### Priority 3: Adjacent high-intent business tools

Only after the salary cluster is stable:

- VAT calculator
- invoice generator
- currency converter
- remittance comparison
- mobile-money fee comparison

Choose tools with clear East African search intent before broader generic tools.

### Priority 4: Supporting content

After the shell and core tools are solid:

- one Swahili comparison page
- one country-specific explainer
- one FAQ-led page for salary or tax understanding

Supporting content should reinforce the cluster, not replace it.

## Markets By Wave

### Wave 0: Architecture and SEO stabilization

- Decide source-of-truth ownership for `/sw/`
- fix the most visible hreflang and route mismatches on Swahili core pages
- define Swahili slug conventions
- stop adding new Swahili surfaces until the ownership model is clear

### Wave 1: Core Swahili product shell

- homepage
- all-tools page
- salary/PAYE hub
- countries hub
- shared UI copy and states

### Wave 2: East Africa salary/PAYE wedge

- Kenya
- Tanzania
- Uganda
- Rwanda
- Burundi

Why:

- strongest Swahili-language fit
- strongest salary-intent overlap
- easiest place to build repeatable terminology rules

### Wave 3: East Africa business-intent expansion

- currency converter
- invoice generator
- VAT calculator
- remittance comparison
- mobile-money fees

### Wave 4: Secondary expansion

- Eastern DRC where Swahili fit is strategically relevant
- selected agriculture or work-document surfaces only if they support the East Africa thesis
- only after the core money surfaces are clean

## Source-Of-Truth Strategy

Swahili needs explicit ownership by surface.

### Use hand-authored `/sw/` pages for:

- front-facing acquisition pages
- homepage and category hubs
- strategic pages with heavy SEO rewriting
- shell pages where layout and copy both matter

### Use `lang/pages/**/sw.json` for:

- repeatable calculator families
- pages where English HTML structure is already strong
- pages likely to be regenerated often

### Use registry updates for:

- discoverability after a page is complete
- Swahili search prioritization
- routing and card coverage

### Avoid:

- generating a page and then hand-polishing the output repeatedly without documenting the true source
- assuming `lang/sw.json` alone is enough for page-level quality
- creating pages that exist only in `/sw/` without a clear English source or explicit manual ownership

## Batch Design Rules

To avoid agent stalls and half-finished Swahili waves, keep batches narrow.

### Safe batch sizes

- `1` shell page plus `2-4` linked tool pages
- or `1` country hub plus `1-2` calculators plus `1` QA pass
- or `1` tool family plus metadata, schema, and link QA

### Avoid

- "translate all Swahili pages"
- mixing salary, agriculture, AI tools, and blog work in one pass
- adding registry, hreflang, UI rewrite, and tool-copy rewrites for dozens of pages at once

## Swahili Country-Hub Salary Rollout Pattern

Use this pattern before adding more `/sw/<country>/index.html` salary discovery work. The goal is to stop reinventing the same hub pass every batch.

### Pattern types

There are two valid country-hub rollout modes.

#### 1. Strong salary-entry hub

Use strong treatment when the country is a real salary-intent entry market and at least one of the following is true:

- a live Swahili local PAYE route already exists and is good enough to feature first
- the market is a regional anchor with high salary/payroll search value
- there are already localized Sw salary tools that make the country page feel like a real salary hub, not just a bridge
- the country helps a comparison cluster that users actually browse across

Canonical examples:

- `sw/kenya/index.html`
- `sw/tanzania/index.html`
- `sw/nigeria/index.html`
- `sw/south-africa/index.html`
- `sw/morocco/index.html`
- `sw/ethiopia/index.html`
- `sw/zambia/index.html`

#### 2. Lighter bridge hub

Use bridge treatment when the country needs salary/pay orientation, but the surrounding localized salary depth is still thin.

Use bridge treatment when:

- the local Sw PAYE page exists, but adjacent localized salary depth is limited
- the best user experience is still to route people into `sw/mshahara-na-kodi/index.html` and `sw/tools/index.html`
- the market matters, but it is not yet ready to act like a full salary-entry hub

Canonical examples:

- `sw/mozambique/index.html`
- `sw/malawi/index.html`

### Standard section order

For a Sw salary-first country hub, keep the section order stable unless the page has a structural reason not to.

1. Hero with salary-first support copy
2. Local tax or payroll summary cards already native to the country page
3. Any existing local tax, PAYE, VAT, or social-security tables already on the page
4. Divider
5. `Mishahara Kwanza` section for strong hubs, or `Njia ya Mishahara` for lighter bridge hubs
6. Existing tools section relabeled to `Zana za Mishahara na Ajira`
7. Back-links to Sw entry points, paired English page, and optional nearby comparison markets

Do not move the whole page into a new template just to follow this order. Fit the pattern into the current shell.

### Hero and support-copy rules

The hero should stop sounding like a generic finance directory and start sounding like a salary-entry surface.

Rules:

- keep the country name and core tax identity in the title
- make the support copy salary-first, not broad-finance-first
- lead with the local salary problem the user is trying to solve:
  - PAYE
  - social-security deductions
  - overtime
  - leave
  - salary comparison
  - retirement or housing-fund planning
- keep acronyms users actually search, such as `PAYE`, `VAT`, `NSSF`, `UIF`, `CNSS`, `SSNIT`, `NAPSA`, `USD/US$`
- use the outline CTA as the bridge back to `sw/mshahara-na-kodi/` when the page is in the salary rollout lane

### `Mishahara Kwanza` section rules

This section is the repeatable discovery block for Sw salary hubs.

For strong salary-entry hubs:

- use the label `Mishahara Kwanza`
- include `4` featured cards when space allows
- local Sw PAYE should be the first card if it is live and user-ready
- end with a bridge sentence linking to `sw/mshahara-na-kodi/index.html`
- where helpful, link to nearby comparison markets such as Kenya, Tanzania, Uganda, Ghana, Nigeria, or South Africa

For lighter bridge hubs:

- use `Njia ya Mishahara` if the page is more of a bridge than a full salary hub
- include `3` cards in most cases
- local Sw PAYE still goes first if it exists and is good enough
- the second and third cards should usually be:
  - `sw/mshahara-na-kodi/index.html`
  - `sw/tools/index.html`
- use one adjacent localized salary tool only if it adds real value without making the hub feel falsely deep

### Link priority inside the salary cluster

When choosing which localized Sw salary/pay tools to feature first, use this priority order unless the market has a strong country-specific reason to vary it:

1. local Sw PAYE route
2. `sw/zana/kikokotoo-michango-ya-hifadhi-ya-jamii/index.html`
3. `sw/zana/kikokotoo-kima-cha-chini-cha-mshahara/index.html`
4. `sw/zana/kikokotoo-muda-wa-ziada/index.html`
5. `sw/zana/kikokotoo-likizo/index.html`
6. `sw/zana/kilinganisha-mishahara/index.html`
7. `sw/zana/mpango-wa-kustaafu-mapema/index.html`
8. `sw/zana/kikokotoo-mfuko-wa-nyumba/index.html`

Use the earliest tools in the list that are already localized and actually useful for that market.

### When to feature local PAYE vs broader salary-cluster links

Feature local PAYE first when:

- the Sw route is live
- the page is not just an English fallback wrapper
- the route is already used as a real local calculator entry point

Do not make local PAYE the lead card when:

- the Sw route is weak, stale, or still mostly a fallback shell
- the country page would over-promise salary depth that does not yet exist

In those cases:

- point the outline CTA to `sw/mshahara-na-kodi/index.html`
- make the discovery section bridge into the broader salary cluster
- keep `sw/tools/index.html` as the secondary discovery target

### Reciprocal hreflang rule for paired English hubs

If a Sw country hub is touched as part of a salary-first hub rollout and the paired English hub is in scope, add or verify:

- `hreflang="sw"` on the paired English hub
- existing `hreflang="en"` and `x-default` stay intact unless clearly wrong

Do not broaden that into a repo-wide hreflang cleanup during the same batch.

### Validation checklist for country-hub salary passes

For a real country-hub salary surfacing batch, run:

- `npm run check-links`
- `npm run audit`
- `npm run build:i18n:validate`
- `npm run validate:hreflang`
- `npm run seo:report`

When summarizing results, separate:

- baseline repo debt
- net-new issues caused by the batch

Use this rule:

- if the touched Sw hubs and paired English hubs do not appear directly in the failure output, treat the remaining failures as baseline debt
- if the only remaining nearby warnings are older one-way references from untouched French pages into the paired English hubs, treat those as baseline debt
- only call an issue net-new if the touched pages themselves appear in the failing output after the batch

### Recommended execution clusters for remaining Sw country hubs

After the current Kenya/Tanzania/Uganda/Rwanda/Burundi, Nigeria/South Africa/Ghana/Egypt, and Morocco/Ethiopia/Zambia/Mozambique/Malawi passes, use this rollout order next:

1. Southern follow-on cluster:
   - Botswana
   - Namibia
   - Lesotho
2. Francophone and Central salary-discovery cluster:
   - Cameroon
   - Cote d'Ivoire
   - Senegal
3. North Africa follow-on cleanup:
   - Libya
   - Tunisia
   - Algeria only if the salary-entry case is clear

Why this order:

- the southern cluster extends the Zambia, Malawi, Mozambique, and South Africa salary graph cleanly
- the Francophone and Central cluster is valuable, but should ride on a more mature Sw salary-hub process
- the North Africa follow-on batch should happen after the current Morocco pattern is proven stable in multiple adjacent markets

## Swahili SEO Playbook

### 1. Build clusters, not isolated pages

The strongest pattern is:

- Swahili homepage or category hub
- country hub
- PAYE page
- adjacent finance tool
- supporting explainer or comparison page

### 2. Write for how East African users actually search

Use a mix of Kiswahili and established financial shorthand, such as:

- `kikokotoo cha kodi ya mshahara`
- `PAYE Kenya`
- `PAYE Tanzania`
- `mshahara halisi`
- `mshahara baada ya kodi`
- `makato ya mshahara`
- `VAT calculator`
- `kibadilishaji cha sarafu`
- `ada za kutuma pesa`

Do not force purely literal terms when mixed-language search intent is stronger.

### 3. Standardize register, not every noun

Be consistent in:

- tone
- verb choices
- CTA structure
- result labels
- headings

But allow country-specific institutions and familiar acronyms to stay native to user behavior.

### 4. Make the app itself Swahili

SEO gains are weakened if the page title is in Swahili but the rest of the app is still half-English.

That includes:

- search states
- validation errors
- result cards
- share text
- PDF flows
- schema and FAQ copy
- toast messages

### 5. Only index what is truly ready

Because Swahili registry coverage is still thin, do not push unfinished pages into the discovery layer just to increase counts.

## Definition Of Done For A Swahili Tool

A Swahili tool page is done only when all of the following are true:

- the copy reads like native digital-product Kiswahili
- the calculator logic is unchanged and correct
- the visible UI is Swahili
- result labels and share/PDF flows are Swahili or intentionally bilingual where search behavior requires it
- metadata and OG copy are Swahili
- FAQ and schema are Swahili
- canonical is self-referential
- hreflang is correct and bidirectional where appropriate
- the page appears exactly once in the registry if it is meant to be discoverable
- the page is linked from the correct Swahili hub

## Prompt Design Rules For Claude

### General rules

- Always define the exact file scope.
- Always require source-of-truth identification first.
- Always say whether the batch is hand-authored, generated, or mixed.
- Always forbid scope expansion.
- Always require a validation summary.
- Always require removal of leftover English UI.
- Always require terminology consistency notes.

### Reusable prompt: Swahili batch planner

```text
You are coordinating a Swahili localization batch for AfroTools.

Goal:
- Improve Swahili product quality and Swahili SEO.
- Do not translate mechanically.
- Do not expand scope beyond the listed files.

Before editing:
1. Identify the source of truth for each target:
   - hand-authored /sw/ page
   - lang/pages/**/sw.json
   - registry
   - generated output
2. Flag any conflicts before touching files.
3. Keep the batch small enough to finish cleanly.

Batch scope:
- [LIST FILES HERE]

Required outputs:
1. Short source-of-truth assessment per file.
2. Exact edits made.
3. Any SEO, hreflang, registry, or terminology risks discovered.
4. Validation run and result summary.

Constraints:
- Rewrite for natural East African Kiswahili.
- Preserve calculator logic.
- Keep app UI fully Swahili unless a finance acronym is intentionally retained.
- Do not create duplicate registry entries.
- Do not touch unrelated files.
```

### Reusable prompt: Swahili tool rewrite

```text
Rewrite this AfroTools calculator page for native Swahili-speaking users in East Africa.

Do not do a literal translation.
Write as a strong localized financial product page.

You must:
- preserve the calculation logic
- improve the Swahili title, meta description, hero copy, labels, FAQs, and schema
- use natural digital-product Kiswahili
- keep familiar finance acronyms where users expect them
- make the UI feel like it was written by a local product team

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
- note any term choices that were intentionally left bilingual
```

### Reusable prompt: Swahili app shell polish

```text
Improve this Swahili front-facing AfroTools page so it works as a real acquisition and navigation page, not just a translated shell.

Focus on:
- stronger Swahili headline and intro
- clearer hierarchy
- honest tool counts
- stronger CTAs
- natural search and navigation wording
- consistency across nav, empty states, buttons, result labels, and helper copy

Do not:
- claim coverage that does not exist
- use stiff classroom Kiswahili
- leave mixed English states behind
- touch unrelated files

Files:
- [LIST FILES HERE]
```

### Reusable prompt: Swahili SEO QA reviewer

```text
Review this Swahili batch like a strict localization and SEO editor.

Check:
- natural Kiswahili phrasing
- consistency of terminology
- title and meta quality
- canonical correctness
- hreflang correctness
- internal links to Swahili surfaces
- schema language
- duplicate registry rows
- leftover English text
- places where English acronyms should stay versus be explained

Return:
1. Critical issues
2. Medium issues
3. Nice-to-have improvements

Do not rewrite files unless asked.
```

### Reusable prompt: Swahili terminology governor

```text
You are the terminology governor for an AfroTools Swahili batch.

Build or refine a mini glossary for this batch before rewriting.

For each important term, choose one of:
- translate fully into Kiswahili
- keep the English acronym or English term
- use bilingual treatment on first mention, then shorter follow-up wording

Focus on:
- PAYE
- VAT
- gross salary
- net salary
- deductions
- taxable income
- invoice
- remittance
- exchange rate
- PDF

Return:
1. Approved term list
2. Terms to avoid
3. Any country-specific terminology notes

Do not edit files in this step unless asked.
```

## Business and Compliance Pattern

For Swahili business/compliance expansion, treat VAT, invoices, TIN, business registration, break-even, and profit margin as one practical path instead of isolated translated tools.

- Start with task intent: price with VAT, issue an invoice, confirm TIN, register the business, then test break-even and margin.
- Keep official acronyms when they help search or filing clarity, but explain them naturally on first mention.
- Use repo source data and existing calculator behavior; do not add legal or tax rules that are not present in the source.
- Link business pages back to salary/PAYE when payroll, employer tax, or staff costs become relevant.
- Prefer hand-authored Swahili product pages and persistent hub links over registry-dependent discovery for priority compliance paths.

### All-Country TIN Coverage

When Swahili TIN coverage is expanded to all African countries, keep it as a compliance discovery surface rather than a generic legal directory.

- Use `data/legal/tin-guide-data.js` as the source of truth for country facts.
- Keep country pages hand-authored in Swahili, but do not invent requirements beyond the source data.
- Group the TIN hub by region so users can scan all 54 countries quickly.
- Link TIN pages to VAT, invoice, business registration, and salary/PAYE where those workflows naturally meet.
- Add reciprocal Swahili hreflang only on the paired English TIN pages in the batch.


## Recommended Execution Order

### Phase 0: Stabilize

- choose Swahili URL and ownership conventions
- fix the highest-signal hreflang issues on Swahili core pages
- decide which pages stay hand-authored versus generated

### Phase 1: Swahili product shell

- `sw/index.html`
- `sw/zana-zote/index.html`
- `sw/mshahara-na-kodi/index.html`
- `sw/nchi/index.html`
- shared search, nav, footer, result-state, share, and PDF copy

### Phase 2: East Africa salary/PAYE wave

- Kenya
- Tanzania
- Uganda
- Rwanda
- Burundi

### Phase 3: Adjacent tools

- VAT
- invoices
- remittance
- mobile money
- currency conversion

### Phase 4: Supporting content and expansion

- comparison pages
- explainers
- selected secondary markets

## What Not To Do

- Do not translate the whole `/sw/` tree at once.
- Do not assume existing `/sw/` pages are all high quality just because they exist.
- Do not rely on `lang/sw.json` alone for high-value page quality.
- Do not add more Swahili registry entries than you can actually QA.
- Do not expand into many categories before the shell and salary/PAYE wedge are solid.
- Do not borrow French wording directly; only borrow the process discipline.

## Recommended Metrics

Track Swahili progress with simple operational numbers:

- Swahili pages with documented source of truth
- Swahili registry entries that map to real finished pages
- Swahili core pages with clean hreflang
- East Africa salary clusters completed
- Swahili pages with no leftover English UI
- Swahili pages linked from Swahili hubs

## Default Working Principle

Swahili should expand like a product line:

- architecture first
- app shell second
- East Africa salary/PAYE third
- adjacent money tools fourth
- supporting content fifth

If there is a tradeoff, choose fewer but better Swahili pages with cleaner SEO, better copy, and clearer ownership.
