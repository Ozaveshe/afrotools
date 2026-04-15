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
3. Create a bounded prompt pack for the implementation agent.
4. Run the narrowest validation that proves the batch:
   - `npm run build:i18n:validate`
   - `npm run validate:hreflang`
   - optionally `npm run seo:report`
5. Record the workflow in docs if the repo gains a new repeatable pattern.

## Preferred Batch Sizes

- `1` shell page plus `2-4` tool pages
- or `1` country hub plus `1-2` calculators
- or `1` tool family plus `1` QA pass

Avoid large unbounded "translate all of Swahili" runs.

## Prompt Guidance

Every prompt should include:

- the exact file list
- the source-of-truth question
- a no-scope-expansion instruction
- a terminology consistency requirement
- a requirement to remove leftover English UI
- a validation summary requirement

## Validation Minimum

After meaningful Swahili work:

- `npm run build:i18n:validate`
- `npm run validate:hreflang`

If metadata or internal links changed, also consider:

- `npm run seo:report`
