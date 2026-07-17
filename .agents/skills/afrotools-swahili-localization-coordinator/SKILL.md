---
name: afrotools-swahili-localization-coordinator
description: AfroTools workflow for coordinating Swahili localization, Swahili SEO rollout, prompt generation for translation agents, and safe batch planning across `/sw/`, registry-backed surfaces, and i18n sources.
---
# AfroTools Swahili Localization Coordinator

Use this skill when the task is about:

- Swahili localization strategy
- East Africa rollout planning
- Swahili SEO prioritization
- prompt generation for Claude or Codex translation batches
- deciding what to localize first in Swahili
- coordinating Swahili app, hub, tool, and metadata work

## Read First

- `docs/SWAHILI-LOCALIZATION-STRATEGY.md`
- `docs/codex-playbook.md`
- `docs/known-traps.md`
- `.claude/rules/i18n.md`

## Core Rules

- Treat Swahili as a product surface, not a string dump.
- Prioritize East Africa front-facing pages and salary/PAYE surfaces before lower-value generic translation work.
- Prefer native Kiswahili rewrites over literal translation.
- Keep familiar financial acronyms when users actually search them that way.
- For Sw country-hub salary batches, classify each target as either:
  - a strong salary-entry hub
  - a lighter bridge hub
- Choose the source of truth before editing:
  - hand-authored `/sw/` page
  - `lang/pages/**`
  - generated output
  - registry
- Keep batches small enough to finish cleanly.

## Workflow

1. Audit the current Swahili surface:
   - page counts
   - registry coverage
   - source-of-truth gaps
   - hreflang health
2. Decide the wave:
   - app shell and front-facing entry points
   - East Africa salary/PAYE cluster
   - adjacent business-intent tools
   - supporting content
3. If the task includes country hubs, assign the hub mode:
   - strong salary-entry hub
   - lighter bridge hub
4. Create a bounded prompt pack for the implementation agent.
5. Run the narrowest validation that proves the batch:
   - `npm run build:i18n:validate`
   - `npm run validate:hreflang`
   - optionally `npm run seo:report`
6. Record the workflow in docs if the repo gains a new repeatable pattern.

## Preferred Batch Sizes

- `1` shell page plus `2-4` tool pages
- or `1` country hub plus `1-2` calculators
- or `1` tool family plus `1` QA pass

Avoid large unbounded "translate all of Swahili" runs.

## Country-Hub Salary Pattern

When generating prompts for Sw salary-and-tax country-hub work, always inherit the pattern documented in `docs/SWAHILI-LOCALIZATION-STRATEGY.md`.

### Strong salary-entry hubs

Use strong treatment when the country has:

- a live local Sw PAYE route that is ready to feature first
- real salary-entry potential as a regional anchor
- enough localized salary tools to make the page feel like a true salary hub

Prompt requirements for strong hubs:

- make hero and support copy salary-first
- use `/sw/mshahara-na-kodi/` as the outline CTA target unless the task says otherwise
- add a `Mishahara Kwanza` section
- put local PAYE first if the route is live and good enough
- usually feature `4` cards
- relabel the tools section to `Zana za Mishahara na Ajira`
- add a closing bridge sentence back to the Sw salary hub and, when useful, nearby comparison markets

### Lighter bridge hubs

Use bridge treatment when local salary depth is thinner and the page should mainly route users into the wider Sw salary cluster.

Prompt requirements for bridge hubs:

- hero still needs salary/pay orientation
- outline CTA should usually point to `/sw/mshahara-na-kodi/`
- use `Njia ya Mishahara` when the page is primarily a bridge
- usually feature `3` cards
- first card is local Sw PAYE only if it is live and user-ready
- the next links should usually be:
  - `/sw/mshahara-na-kodi/`
  - `/sw/tools/`
- relabel the tools section to `Zana za Mishahara na Ajira`

### Salary-tool link priority

Unless the market clearly needs a different order, prompt generators should prefer this link order:

1. local Sw PAYE
2. social security
3. minimum wage
4. overtime
5. leave
6. salary comparison
7. retirement
8. housing fund

Only feature tools that are already localized and genuinely useful for the target country.

### Paired English hub rule

If the Sw country hub is in scope and the paired English hub is in scope, the prompt should require reciprocal `hreflang="sw"` on the English hub.

Do not broaden that into a repo-wide hreflang cleanup prompt.

## Prompt Guidance

Every prompt should include:

- the exact file list
- the source-of-truth question
- a no-scope-expansion instruction
- a terminology consistency requirement
- a requirement to remove leftover English UI
- if country hubs are included, the required hub mode for each target:
  - strong salary-entry hub
  - lighter bridge hub
- if country hubs are included, the standard section-order requirement:
  - salary-first hero
  - local summary
  - existing local tax tables
  - divider
  - `Mishahara Kwanza` or `Njia ya Mishahara`
  - `Zana za Mishahara na Ajira`
- if paired English hubs are in scope, a reciprocal hreflang requirement
- a validation summary requirement

## Validation Minimum

After meaningful Swahili work:

- `npm run build:i18n:validate`
- `npm run validate:hreflang`

If metadata or internal links changed, also consider:

- `npm run seo:report`

For country-hub salary batches, prefer the fuller checklist:

- `npm run check-links`
- `npm run audit`
- `npm run build:i18n:validate`
- `npm run validate:hreflang`
- `npm run seo:report`

Prompt outputs should explicitly separate:

- baseline repo debt
- net-new issues caused by the batch
