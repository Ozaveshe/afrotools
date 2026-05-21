# AfroTools v6 Manual Review Queue

Date: 2026-05-20

## Do not stage broadly

The first reviewed staging set contains only:

- `assets/css/global.css`
- `assets/css/global.min.css`

Everything below remains outside the first commit.

## Generated/static HTML cache-bust churn

Current finding after Git refresh:

- 7,946 unstaged tracked files
- 7,942 unstaged HTML files
- 7,892 files whose diff includes `global.min.css?v=`

Why not staged:

- This is broad generated/static output churn, not reviewable as part of the first source fix.
- It appears tied to cache-busting the changed `global.min.css` asset hash.

Human review:

- Decide whether static HTML cache-bust output is committed in this project or regenerated during build/deploy.
- If committed, put it in a separate generated-output commit after confirming it was produced by the intended build/cachebust command.
- If not committed, leave it out and rely on deployment/build generation.

Possible later command after human decision:

```powershell
git add <reviewed generated HTML set>
git commit -m "chore: refresh global CSS cache-bust output"
```

Do not run a broad restore/clean without first saving any wanted generated output.

## JAMB

Current dirty tree:

- No obvious current unstaged JAMB files in the v6 sampled dirty list.

Why not staged:

- v5 still marked JAMB changes from the landed mega-commit as requiring human review in history.

Human review:

- Inspect JAMB changes in `43e6f10` and any later commits separately.
- Confirm they are intentional, sourced, and not mixed with this v6 staging set.

## Product-backbone

Files:

- `docs/product-backbone/free-apps-backbone.md`

Why not staged:

- Adds product-backbone guidance for confidence-gated result layouts, interpretation cards, feedback loops, sponsor placement, and extra study-abroad analytics events.
- Not needed for the v5 Playwright fix commit.

Human review:

- Confirm this doctrine change is intended and aligns with product governance.
- Stage in a separate documentation/product-backbone commit if accepted.

## CV Builder

Files:

- `tools/cv-builder/index.html`
- `tools/cv-builder/css/cv-layout-decongestion.css`
- `tools/cv-builder/js/cv-layout-decongestion.js`
- `audit-results/cv-builder-layout-decongestion-screens/`
- `audit-results/cv-builder-layout-server.err.log`
- `audit-results/cv-builder-layout-server.out.log`

Why not staged:

- This is a separate CV Builder layout decongestion product change with new source files and visual evidence.
- It was also the source of the unexpected live screenshot writer found at the start of v6.

Human review:

- Review UI behavior, mobile layout, accessibility, dark mode, and export flow.
- Confirm the new CSS/JS assets should be loaded by `tools/cv-builder/index.html`.
- Decide whether screenshot evidence belongs in Git or outside the repo.

## Study Abroad

Files:

- `tools/study-abroad-cost/index.html`
- `tools/study-abroad-cost/study-abroad-conversion-layer.css`
- `tools/study-abroad-cost/study-abroad-conversion-layer.js`
- `tests/study-abroad-conversion-layer.test.js`
- `package.json`
- `audit-results/study-abroad-source-gap-report.json`

Why not staged:

- This is a separate Study Abroad conversion/result-layer product change.
- `package.json` now references an unstaged new test file.
- The tracked audit JSON currently has timestamp-only churn.

Human review:

- Review the conversion-layer UX, source-confidence language, sponsor slots, feedback storage, analytics events, and scholarship handoff.
- Stage code, test, and package script together only if accepted.
- Leave timestamp-only audit churn out unless evidence artifacts are intentionally committed.

## Automation/source-truth carryover

Current dirty tree:

- No current v6 sampled dirty files from the v5 automation/source-truth list.

Why not staged:

- v5 identified automation/source-truth carryover in the landed mega-commit history, not necessarily in the current dirty tree.

Human review:

- Review `data/audits/public-claim-registry.json`, `data/automation/automation-registry.json`, `data/scholarships/official-sources.json`, `docs/AUTOMATION-REGISTRY.md`, and `llms-full.txt` in history before treating them as fully accepted release truth.

## Audit artifacts and temporary files

Files:

- v6 reports/logs under `audit-results/`
- CV Builder screenshots/logs under `audit-results/`

Why not staged:

- Audit artifacts are evidence, not product source.
- They should be committed only if the maintainer wants a separate evidence commit.

Human review:

- Decide whether to keep reports in Git, move evidence elsewhere, or leave them untracked.
