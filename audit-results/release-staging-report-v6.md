# AfroTools v6 Release Staging Report

Date: 2026-05-20

## 1. Final verdict

SAFE TO COMMIT FIRST REVIEWED FIX SET.

This does not mean the whole working tree is safe to stage or release. It means the current staged diff is clean, tiny, and reviewed:

- `assets/css/global.css`
- `assets/css/global.min.css`

The rest of the working tree must remain unstaged until generated output and carryover product areas are reviewed.

## 2. Active mutation processes

An unexpected CV Builder visual-audit writer was found before the snapshot. It was writing screenshots/logs under:

- `audit-results/cv-builder-layout-decongestion-screens/`

It was stopped. A later process check found only read-only/transient Git commands, local static servers, Codex helper processes, Adobe processes, and an unrelated SimbiOS dev server. No active `git restore`, `git reset`, `git checkout`, or `git clean` process was found after the stop.

See `audit-results/v6-process-safety-check.md`.

## 3. Safety patch

Created successfully before v6 edits:

- `audit-results/v6-working-tree-safety.patch`

Important caveat: the initial snapshot captured the dirty state Git reported at that moment, which showed two tracked files. After verification and a full Git refresh, broad generated/static HTML cache-bust churn became visible again. No broad restore, reset, or clean command was used.

## 4. Current dirty status

Final counts after staging and verification:

| Metric | Count |
| --- | ---: |
| `git status --short` entries | 7,995 |
| Unstaged tracked files from `git diff --name-only` | 7,946 |
| Staged files | 2 |
| Untracked files | 61 |
| Unstaged HTML files | 7,942 |
| Unstaged files with `global.min.css?v=` diff | 7,892 |

The broad dirty set is mostly generated/static HTML cache-bust output tied to the changed `global.min.css` hash. It is deliberately not staged.

## 5. Tracked changed file count

For the first reviewed commit:

- Staged tracked files: 2
- Staged diff: 2 files changed, 2 insertions, 3 deletions

For the remaining unstaged tree:

- 7,946 tracked files remain unstaged.
- Most visible churn is static HTML cache-bust output.

## 6. Untracked file count

Final untracked count: 61.

Untracked groups include:

- v6 audit reports/logs
- CV Builder screenshot/log evidence
- CV Builder layout decongestion CSS/JS
- Study Abroad conversion-layer CSS/JS/test

## 7. Exact files recommended for first commit

Currently staged and recommended for the first commit:

- `assets/css/global.css`
- `assets/css/global.min.css`

Reason: this restores the v5 fix that narrows `view-transition-name: hero` from all `*-hero` classes to only `.hero` and `.compare-hero`, preventing duplicate view-transition-name browser failures.

## 8. Exact files deliberately excluded

Excluded from the first commit:

- `audit-results/study-abroad-source-gap-report.json`
- `docs/product-backbone/free-apps-backbone.md`
- `package.json`
- `tools/cv-builder/index.html`
- `tools/study-abroad-cost/index.html`
- `tests/study-abroad-conversion-layer.test.js`
- `tools/cv-builder/css/cv-layout-decongestion.css`
- `tools/cv-builder/js/cv-layout-decongestion.js`
- `tools/study-abroad-cost/study-abroad-conversion-layer.css`
- `tools/study-abroad-cost/study-abroad-conversion-layer.js`
- `audit-results/cv-builder-layout-decongestion-screens/`
- CV Builder server logs
- v6 audit reports/logs
- 7,892 generated/static HTML cache-bust diffs

## 9. Suspicious/carryover areas still requiring manual review

- JAMB: no obvious current v6 dirty files, but v5 marked landed-history JAMB changes for manual review.
- Product-backbone: `docs/product-backbone/free-apps-backbone.md`.
- CV Builder: new layout decongestion CSS/JS, index includes, screenshots, and logs.
- Study Abroad: conversion-layer CSS/JS/test, index changes, package script, and audit timestamp churn.
- Automation/source-truth carryover: still requires history review from the v5 list.
- Generated/static HTML: decide whether cache-busted output belongs in a separate generated commit.

See `audit-results/v6-manual-review-queue.md`.

## 10. Playwright result

`npx playwright test`: PASS.

- 79/79 passed
- Exit code 0

## 11. npm test result

`npm test`: PASS.

Key counts:

- 8,524 HTML files scanned
- 80,818 internal links checked
- 0 broken internal links
- Public claim audit: 83 warnings, 0 failures
- Automation registry audit passed
- CV template registry verified
- Study Abroad data trust, FX policy, confidence gate, and conversion layer verified
- Tool verification metadata/panels verified for 395 PAYE/VAT pages

Caveat: because `package.json` and `tests/study-abroad-conversion-layer.test.js` are unstaged but present, this command verified the current working tree, not an isolated staged-only commit.

## 12. audit:dist result

`npm run audit:dist`: PASS.

- Deploy artifact audit passed.

## 13. build:deploy

`npm run build:deploy`: not run in v6.

Reason: this sprint is a staging/reviewability pass, and build/deploy generation can create broad output churn. v5 already recorded `build:deploy` as passed. Before a release/package approval, run it again after the generated-output decision is made.

## 14. First staged set reviewability

Reviewable: yes.

`git diff --cached --name-status`:

```text
M	assets/css/global.css
M	assets/css/global.min.css
```

`git diff --cached --check`: passed.

No suspicious/carryover files, generated HTML, audit artifacts, or untracked files are staged.

## 15. Exact next human command

If the maintainer accepts the first reviewed fix set:

```powershell
git diff --cached --check
git commit -m "fix: narrow global hero view transition selector"
```

After that commit, handle generated/static HTML cache-bust churn and CV Builder/Study Abroad/product-backbone carryover in separate reviewed commits or explicit cleanup decisions.
