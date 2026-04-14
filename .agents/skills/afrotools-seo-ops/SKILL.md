---
name: afrotools-seo-ops
description: AfroTools SEO operations workflow for canonical tags, OG tags, internal linking, sitemap generation, alias fixes, and SEO maintenance scripts. Use when updating metadata, running SEO sweeps, repairing search-facing pages, or choosing between manual edits and the repo's SEO scripts.
---
# AfroTools SEO Ops

Use this skill to route SEO work through the repo's existing maintenance layer.

## Read First

- `AGENTS.md`
- `docs/codex-playbook.md`
- `docs/known-traps.md`

## Working Rules

- Prefer an existing script over a new one.
- Prefer a targeted script over a full rebuild.
- Do not hand-edit sitemap files as a first move.

## Primary Scripts

- `npm run seo`
- `npm run seo:report`
- `npm run seo:priority`
- `npm run seo:og`
- `npm run seo:links`
- `node scripts/build-seo-system.js`
- `node scripts/apply-og-fallbacks.js`
- `node scripts/inject-internal-links.js`
- `node scripts/fix-seo-alias-links.js`

## Workflow

1. Classify the issue: metadata, OG image, canonical, internal links, sitemap, alias, or content quality.
2. Inspect the nearest script in `scripts/` before editing pages by hand.
3. Apply the smallest source-level fix.
4. Run the narrowest SEO validation that proves the fix.
5. Update docs if the repo gains a new recurring SEO pattern.