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
This is still a smoke test: a loaded route and a visible button are not proof
that a calculation changed, an export reopened, or the result is accurate.
Category acceptance must keep fixture-level action and calculation oracles.
If repo-local `node_modules` is not installed, the script will try the Codex
bundled Node package directory. You can also set `AFROTOOLS_NODE_MODULE_DIR` to
a directory containing `playwright`.

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

Two integrity caps prevent keyword padding from manufacturing a high rank:

- A live/new registry row that resolves to a `noindex` page is capped at 44
  (`F`) until the page or registry ownership is corrected.
- A score-oriented generic `df-upgrade` workspace is capped at 64 (`D`). A
  workflow-specific panel is not penalized merely for sharing the component
  class; the generic copy and field signatures must also match.
- Explicit ID aliases and compatibility-route aliases in
  `data/registry/catalog-policy.json` remain visible to catalog audits but are
  excluded from app-quality scoring. Their canonical owner must meet the app
  quality standard.

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

## Runtime reliability gate

Use a dedicated local port and isolated outputs for review runs:

```powershell
node scripts/audit-tool-quality.js --browser --route /fr/tools/assurance-auto/ghana/,/fr/tools/accroches-de-contenu-pour-createur/ --port=4217 --output-dir artifacts/reliability-targeted --gate
node scripts/audit-tool-quality.js --browser --port=4217 --output-dir artifacts/reliability-full --gate
node --test tests/browser-reliability.test.js
node --test tests/analytics-creative-privacy.browser.test.js
```

`--gate` exits nonzero for observed failures, unresolved review cases, disabled
browser testing or incomplete selected-route coverage. A passing load gate does
not certify actions, exports, calculations, consented live services or production.
Use owner action tests for those claims. An occupied port is refused to avoid
silently testing another checkout.

The JSON records `runtime` per row, categories in the browser summary, and the
source commit. Review working-tree changes alongside that commit. Static-only
rows explicitly have `runtime.gate = unverified`; their grades are structural.
HTTP/navigation failures and runtime exceptions cap scores at 44 (F). Policy
conflicts, unknown errors, third-party uncertainty and local API uncertainty cap
scores at 84 (B) and require review. Multiple categories can apply to a route.

A slash route returning local 404 is classified as a local redirect-emulation
gap only when its sibling `.html` returns 200 and declares the same canonical
path. This is local evidence, not production verification. It remains a review
gate and cannot receive A. Compare representative production status, final URL,
canonical and H1 separately; retain the original local response in the report.
Do not rewrite public routes to satisfy the local server.

Third-party requests deliberately blocked by this harness are listed separately
from observed third-party failures. Errors are not automatically called transient;
that requires a dated successful retry. Likewise an intentional fallback requires
a named passing assertion and cannot excuse an unrelated runtime exception.
Local API failures remain unverified against production. Uncategorized errors
stay visible and block the strict gate rather than being silently allowlisted.

French pages with the existing `fr-creative-privacy-bootstrap.js` script marker
are excluded from shared analytics initialization. The loader waits for parsing
when needed so an early async bootstrap cannot miss this marker. This deliberately
excludes their GA measurement, even with previously accepted consent, and keeps
the existing CSP and local-only processing boundary. Unmarked pages retain the
existing consent-mode behavior, including denied-storage initialization. Both
loader entry points resolve through this same guarded runtime.
Service-worker registration is blocked by `scripts/lib/browser-smoke-context.js`
inside fresh contexts. Its getter guard handles only the sandbox-origin
`SecurityError`; it does not filter page errors. This avoids the exception injected
by Playwright's unguarded `serviceWorkers: block` script in opaque-origin frames.
`browser-progress.json` checkpoints each 25 routes, with the startup commit and
dirty-state flag. Interrupted progress is not a completed gate result.
