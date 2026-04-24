---
name: afrotools-release-qa
description: AfroTools release and regression workflow for static pages, registry changes, SEO edits, i18n output, cars data, and Netlify surfaces. Use when preparing to ship, reviewing a risky change, selecting the right validation commands, or turning touched files into a focused release checklist.
---
# AfroTools Release QA

Use this skill to avoid over-testing the wrong things and under-testing the risky ones.

## Read First

- `docs/release-checklist.md`
- `docs/known-traps.md`

## Workflow

1. Group touched files by surface: content, registry, SEO, i18n, cars, Netlify, or Supabase.
2. Choose the narrowest command set that covers those surfaces.
3. Run syntax checks for changed JS files when useful.
4. Call out any residual risk if a full check was not run.

## Common Commands

- `npm test`
- `npm run check-links`
- `npm run audit`
- `npm run seo:report`
- `npm run build:i18n:validate`
- `npm run validate:hreflang`
- `npm run cars:catalog:refresh`
- `npm run build`
- `npm run build:deploy`
- `npm run audit:dist`
- `npm run security:scan`
