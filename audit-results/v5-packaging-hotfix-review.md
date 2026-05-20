# v5 Packaging Hotfix Review

## File Reviewed

`scripts/build-dist.js`

## Findings

- Windows-held `dist/` folder root no longer has to be removed. `clearDistWithRetry()` removes children inside `dist/` and preserves the root directory.
- `removePathWithRetry()` is present for retryable file/directory removal.
- `audit-results/` is listed in blocked top-level directories and is skipped from deploy output.
- `verifyDist()` also forbids `audit-results`, so audit evidence cannot be published accidentally.
- Required deploy files are still required: `index.html`, `404.html`, `_redirects`, `_headers`, `assets`, and `tools`.
- No legitimate deploy path was found to be excluded by the `audit-results/` rule. The rule is top-level and specific.

## Verification

| Command | Result |
| --- | --- |
| `npm run build:deploy` | Passed. `Built dist: 10910 files copied, 30 directories skipped, 84 files skipped.` |
| `npm run audit:dist` | Passed. Deploy artifact audit passed. |
| `git diff --check` | Initially found a trailing blank line in `reports/mobile-network-smoke.md`; after trimming that generated report, rerun passed. |

## Decision

The `scripts/build-dist.js` hotfix is present in the current source and is not part of the remaining dirty diff. If a maintainer needs to audit history, keep it separate conceptually from Playwright triage and generated/static output churn.
