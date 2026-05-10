---
name: afrotools-transport-source-workflow
description: Refresh or review the AfroTools transport hub official-source workflow.
argument-hint: "[refresh|check|repair]"
disable-model-invocation: true
user-invocable: false
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
---

# AfroTools Transport Source Workflow

Use this when the task touches `/transport/`, transport-category tools, official transport sources, fuel prices, vehicle import duties, vehicle registration, roadworthiness, tolls, port handling, customs clearance, shipping rules, ride-hailing fare assumptions, city parking, public route fares, or domestic Africa flight source freshness.

Read first:

1. `docs/TRANSPORT-SOURCE-WORKFLOW.md`
2. `transport/index.html`
3. `data/transport/official-sources.json`
4. `scripts/update-transport-source-ledger.js`

Workflow:

1. Confirm the public hub count against visible tool cards, JSON-LD `numberOfItems`, and the source manifest.
2. Run `npm run transport:sources` for a refresh, or `npm run transport:sources:check` for review-only proof.
3. Treat `changed` sources as a review queue. Inspect the official page before changing tool facts.
4. Treat blocked authority portals and operator pages as manual review. Do not infer fees, routes, or requirements from an unavailable source.
5. Keep edits scoped to transport hub files, source manifests, docs, and affected tool pages.
6. Run `npm run check-links` after route or hub-link changes.

Report:

- Changed official sources.
- Broken official sources.
- Manual-review sources.
- Tool routes affected.
- Validation commands run.
