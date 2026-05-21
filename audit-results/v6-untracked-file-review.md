# AfroTools v6 Untracked File Review

Date: 2026-05-20

## Commands run

- `git ls-files --others --exclude-standard`
- `git ls-files --modified`
- `git ls-files --deleted`

Generated command outputs:

- `audit-results/v6-untracked-files.txt`
- `audit-results/v6-modified-files.txt`
- `audit-results/v6-deleted-files.txt`

## Untracked groups

### Audit reports and v6 safety evidence

Files:

- `audit-results/v6-process-safety-check.md`
- `audit-results/v6-status-before.txt`
- `audit-results/v6-porcelain-before.txt`
- `audit-results/v6-diff-stat-before.txt`
- `audit-results/v6-name-status-before.txt`
- `audit-results/v6-diff-check-before.txt`
- `audit-results/v6-log-before.txt`
- `audit-results/v6-working-tree-safety.patch`
- `audit-results/v6-untracked-files.txt`
- `audit-results/v6-modified-files.txt`
- `audit-results/v6-deleted-files.txt`
- v6 review/planning/report files created during this sprint

Decision: keep as local audit evidence, but do not stage by default.

### CV Builder screenshots/logs

Files:

- `audit-results/cv-builder-layout-decongestion-screens/after-desktop-empty.png`
- `audit-results/cv-builder-layout-decongestion-screens/after-desktop-filled.png`
- `audit-results/cv-builder-layout-decongestion-screens/after-desktop-template-drawer.png`
- `audit-results/cv-builder-layout-decongestion-screens/after-layout-export.pdf`
- `audit-results/cv-builder-layout-decongestion-screens/after-mobile-edit.png`
- `audit-results/cv-builder-layout-decongestion-screens/after-mobile-preview.png`
- `audit-results/cv-builder-layout-decongestion-screens/before-desktop.png`
- `audit-results/cv-builder-layout-decongestion-screens/before-metrics.json`
- `audit-results/cv-builder-layout-decongestion-screens/before-mobile.png`
- `audit-results/cv-builder-layout-server.err.log`
- `audit-results/cv-builder-layout-server.out.log`

Decision: manual-review evidence only. Do not stage with v5 fixes.

### CV Builder source carryover

Files:

- `tools/cv-builder/css/cv-layout-decongestion.css`
- `tools/cv-builder/js/cv-layout-decongestion.js`

Observed: these files are sizable new UI assets for a CV Builder layout decongestion layer. `tools/cv-builder/index.html` currently references them.

Decision: manual review required. Do not stage in first v6 commit.

### Study Abroad source/test carryover

Files:

- `tools/study-abroad-cost/study-abroad-conversion-layer.css`
- `tools/study-abroad-cost/study-abroad-conversion-layer.js`
- `tests/study-abroad-conversion-layer.test.js`

Observed: the JS implements a Study Abroad conversion/result layer with source confidence, share/scholarship context, feedback, sponsor slots, and tracking. The test exercises conversion-layer behavior and is referenced by the current dirty `package.json`.

Decision: manual review required. Do not stage in first v6 commit.

## Deleted files

`git ls-files --deleted` returned no deleted tracked files.

## Files that should be ignored

No `.gitignore` change was made in v6. The screenshot/log artifacts under `audit-results/` may be worth excluding from routine release commits if the team wants audit evidence stored outside Git or in a separate evidence-only commit.
