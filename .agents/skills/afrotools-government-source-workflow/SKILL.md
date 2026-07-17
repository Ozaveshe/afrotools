---
name: afrotools-government-source-workflow
description: Refresh or review the AfroTools government hub official-source workflow.
argument-hint: "[refresh|check|repair]"
disable-model-invocation: true
user-invocable: false
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
---

# AfroTools Government Source Workflow

Use this when the task touches `/government/`, official civic sources, government fees, public-service requirements, or source freshness for passports, national ID, voter registration, work permits, civil certificates, pensions, land registry, FOI, budgets, scholarships, social welfare, public holidays, or Kenya DPA.

Read first:

1. `docs/GOVERNMENT-SOURCE-WORKFLOW.md`
2. `government/index.html`
3. `data/government/official-sources.json`
4. `scripts/update-government-source-ledger.js`

Workflow:

1. Confirm the public hub count against visible tool cards, JSON-LD `numberOfItems`, and the source manifest.
2. Run `npm run government:sources` for a refresh, or `npm run government:sources:check` for review-only proof.
3. Treat `changed` sources as a review queue. Inspect the official page before changing tool facts.
4. Treat blocked login portals as manual review. Do not infer fees or requirements from an unavailable source.
5. Keep edits scoped to government hub files, source manifests, and affected tool pages.
6. Run `npm run check-links` after route or hub-link changes.

Report:

- Changed official sources.
- Broken official sources.
- Manual-review sources.
- Tool routes affected.
- Validation commands run.
