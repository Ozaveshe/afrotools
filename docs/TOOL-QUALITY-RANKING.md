# AfroTools Tool Quality Ranking

This workflow scores every live/new registry row against product quality,
browser health, trust, SEO/accessibility, and category-specific competitor
benchmarks.

## Commands

```powershell
npm run tools:quality
npm run tools:quality:browser
```

Use the browser run for a serious product audit. It starts the local static test
server if needed, visits each unique live/new tool route with Playwright, and
folds status, rendered interactivity, and console/page errors into the score.

Outputs:

- `reports/tool-quality-ranking.json` - full per-tool evidence and scores.
- `reports/tool-quality-ranking.csv` - sortable ledger for triage.
- `reports/tool-quality-ranking.md` - summary, P0 queue, P1 queue, and lowest
  ranked tools.

## Score Bands

- `A`, 85-100: competitor-grade.
- `B`, 75-84: standard-grade.
- `C`, 65-74: usable but upgrade-needed.
- `D`, 50-64: below industry standard.
- `F`, 0-49: repair-first.

## Benchmark Model

Each tool is compared with the profile for its category. Examples:

- PDF tools: iLovePDF, Smallpdf, Adobe Acrobat online. Expected signals include
  file upload, privacy/local-processing language where true, visible workflow,
  output/download, and no runtime errors.
- Image/design tools: Canva, Adobe Express, TinyPNG, remove.bg. Expected signals
  include upload, preview, edit controls, export, batch or format clarity, and
  privacy expectations.
- Tax and finance tools: Taxngr, TaxCalc.ng, TaxTim, Calc.ke. Expected signals
  include current-year assumptions, source links, methodology, disclaimers,
  clear inputs/results, and save/export or business next steps.
- Developer tools: JSONLint, Regex101, Code Beautify, MDN examples. Expected
  signals include direct input, validation or transformation, copy/download, and
  no runtime errors.

The score is deliberately strict. A page can pass route/link checks and still
rank low if it is thin, stale, unsourced, not visibly interactive, or missing
the continuation paths users expect from a standard web tool.

## Improvement Order

1. Fix `P0-browser-failure` and `P0-high-value-repair`.
2. Upgrade `P1-high-value-upgrade`, especially high-traffic money, tax, PDF,
   image, payroll, trade, and live-data tools.
3. Batch-fix category patterns, such as missing source blocks, weak
   methodology, missing output panels, or missing export actions.
4. Add fixture-level tests for the low-ranked cohort after the browser smoke
   and static score are clean.

## Notes

Expanded country-instance counts inherit the score of their registry family
when they share one route, such as an all-countries calculator. The CSV keeps
`instance_count` so ranking can be weighted by public surface area, not only
registry row count.
