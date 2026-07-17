---
name: afrotools-tool-quality-ranking
description: Use when scoring, ranking, browser-testing, or competitively auditing all AfroTools tool pages before deciding which low-ranked tools to improve.
---
# AfroTools Tool Quality Ranking

## Read First

- `docs/TOOL-QUALITY-RANKING.md`
- `docs/codex-playbook.md`
- `docs/known-traps.md`
- `docs/AFROTOOLS-50K-EXECUTION-HANDOFF.md`

## Workflow

1. Keep unrelated dirty files out of scope.
2. Run `npm run audit` and `npm run tools:quality`.
3. For a serious product audit, run `npm run tools:quality:browser`.
4. Read `reports/tool-quality-ranking.md` first, then use the CSV/JSON for the
   full per-tool ledger.
5. Triage in this order:
   - `P0-browser-failure`
   - `P0-high-value-repair`
   - `P1-high-value-upgrade`
   - category-wide recurring gaps
6. Improve low-ranked tools by source pattern or category, not one random page
   at a time.
7. Rerun the quality script and the narrow validation for touched surfaces.

## Validation

- Tool registry/page existence: `npm run audit`
- Full scorecard: `npm run tools:quality`
- Rendered route smoke: `npm run tools:quality:browser`
- Registry/navigation edits: `npm run check-links` and `npm run audit`
- SEO edits: `npm run seo:report`
