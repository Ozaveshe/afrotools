---
name: afrotools-french-localization-coordinator
description: AfroTools workflow for coordinating French localization, French SEO rollout, prompt generation for translation agents, and safe batch planning across `/fr/`, registry-backed surfaces, and i18n sources.
---
# AfroTools French Localization Coordinator

Use this skill when the task is about:

- French localization strategy
- francophone Africa rollout planning
- French SEO prioritization
- prompt generation for Claude or Codex translation batches
- deciding what to localize first in French
- coordinating French app, hub, tool, and metadata work

## Read First

- `docs/FRENCH-LOCALIZATION-STRATEGY.md`
- `docs/codex-playbook.md`
- `docs/known-traps.md`
- `.claude/rules/i18n.md`

## Core Rules

- Treat French as a product surface, not a string dump.
- Country-related tools for francophone markets should get French front-facing apps before lower-value generic translation work.
- Prefer native French rewrites over literal translation.
- Choose the source of truth before editing:
  - registry
  - `lang/pages/**`
  - generated output
  - hand-authored French page
- Keep batches small enough to finish cleanly.

## Workflow

1. Audit the current French surface:
   - registry entries
   - page counts
   - duplicate French routes
   - hreflang health
2. Decide the wave:
   - front-facing French entry points
   - salary/PAYE cluster
   - VAT/business tax cluster
   - pan-African French financial apps
   - supporting content
3. Create a bounded prompt pack for the implementation agent.
4. Run the narrowest validation that proves the batch:
   - `npm run build:i18n:validate`
   - `npm run validate:hreflang`
   - optionally `npm run seo:report`
5. Record the workflow in docs if the repo gains a new repeatable pattern.

## Preferred Batch Sizes

- `1` French hub page plus `3-5` tool pages
- or `4-6` pages from one country family
- or `1` tool family plus `1` QA pass

Avoid large unbounded "translate everything" runs.

## Prompt Guidance

Every prompt should include:

- the exact file list
- the source-of-truth question
- a no-scope-expansion instruction
- a requirement to remove leftover English UI
- a validation summary requirement

## Validation Minimum

After meaningful French work:

- `npm run build:i18n:validate`
- `npm run validate:hreflang`

If metadata or internal links changed, also consider:

- `npm run seo:report`
