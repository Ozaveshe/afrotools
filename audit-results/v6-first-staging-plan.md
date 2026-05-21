# AfroTools v6 First Safe Staging Plan

Date: 2026-05-20

## Verdict

Stage only the restored v5 global CSS fix.

The broader v5 Playwright/product fixes are already present in current source and have no dirty diff. The remaining dirty CV Builder, Study Abroad, product-backbone, package-script, and audit timestamp changes are not part of the reviewed v5 first-commit set.

## Files to stage

| File | Reason | Risk | Verification command | Affected by interrupted restore? |
| --- | --- | --- | --- | --- |
| `assets/css/global.css` | Restores the v5 safety fix that limits `view-transition-name: hero` to `.hero` and `.compare-hero`, preventing duplicate transition names on pages with multiple `*-hero` sections. | Low | `npx playwright test` and `git diff --cached --check` | Yes, the fix was missing and re-applied in v6. |
| `assets/css/global.min.css` | Served/minified counterpart of the same CSS fix. | Low | `npx playwright test` and `git diff --cached --check` | Yes, the fix was missing and re-applied in v6. |

## Files explicitly excluded from first staging set

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
- `audit-results/cv-builder-layout-server.err.log`
- `audit-results/cv-builder-layout-server.out.log`
- v6 audit evidence files

## Rationale

This first set is reviewable and directly tied to v5 Playwright suite stability. It avoids suspicious/carryover areas and avoids staging audit artifacts or generated churn.
