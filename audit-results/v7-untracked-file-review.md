# v7 untracked file review

## Count

Latest reviewed untracked file list: 117 files.

The count increased during v7 because this sprint created additional audit evidence files.

## Classification

### Audit reports and evidence

111 files.

These are v5/v6/v7 audit logs, generated-churn safety patches, HTML diff files, JSON/CSV/Markdown analysis, and screenshot/report evidence. They should not be added by default unless the maintainer wants audit evidence committed.

### Source/carryover requiring manual review

6 files:

- `tests/study-abroad-conversion-layer.test.js`
- `tools/cv-builder/css/cv-layout-decongestion.css`
- `tools/cv-builder/js/cv-layout-decongestion.js`
- `tools/study-abroad-cost/study-abroad-conversion-auto.js`
- `tools/study-abroad-cost/study-abroad-conversion-layer.css`
- `tools/study-abroad-cost/study-abroad-conversion-layer.js`

These are not generated cache-bust artifacts. They should not be staged with generated HTML. They require manual product review.

### Generated output

0 untracked generated-output files found in the latest classification.

### Temporary files

0 untracked temporary files found in the latest classification.

### Suspicious files

0 untracked files outside audit evidence and known CV/Study Abroad carryover were found in the latest classification.

## Decision

Do not add untracked files by default. Keep audit evidence separate, and review the six source/carryover files in their own product decision.
