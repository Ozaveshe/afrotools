# AfroTools v6 Tracked File Review

Date: 2026-05-20

## Snapshot note

The initial v6 safety snapshot recorded two tracked changed files. After Git refreshed the index/stat cache during diff inspection, the live tracked dirty set expanded to seven tracked files. The extra five were not created by the v6 staging work; they are carryover/product-surface changes that were not safe to stage blindly.

## Tracked files reviewed

| Path | What changed | Why it changed | v5 Playwright/product fix? | Packaging fix? | Suspicious/carryover? | Stage now? | Later action | Risk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `assets/css/global.css` | Removed `[class*="-hero"]` from the global `view-transition-name: hero` selector. | Re-applied the v5 fix that prevents duplicate hero view-transition names across pages with multiple hero-like blocks. | Yes | No | No | Yes | Commit in first reviewed v5 fix set. | Low |
| `assets/css/global.min.css` | Same selector change in the minified counterpart. | Keeps served CSS aligned with source CSS. | Yes | No | No | Yes | Commit in first reviewed v5 fix set. | Low |
| `audit-results/study-abroad-source-gap-report.json` | Only `generatedAt` changed. | Timestamp churn from a prior/current study-abroad audit run. | No | No | Audit/generated carryover | No | Leave unstaged; regenerate or revert in a study-abroad evidence commit if needed. | Low |
| `docs/product-backbone/free-apps-backbone.md` | Added confidence-gated result layout, interpretation-card, feedback-loop, sponsor-placement guidance, and extra study-abroad analytics events. | Product-backbone carryover, not required for v5 Playwright green state. | No | No | Yes, product-backbone manual-review area | No | Human review as a product-backbone/content-governance change. | Medium |
| `package.json` | Added `node tests/study-abroad-conversion-layer.test.js` to `npm test`. | Tied to untracked Study Abroad conversion-layer work. | No | No | Yes, study-abroad carryover | No | Stage only with the conversion-layer source/test after review. | Medium |
| `tools/cv-builder/index.html` | Added CSS/JS includes for `cv-layout-decongestion`. | Tied to untracked CV Builder layout decongestion assets and screenshot evidence. | No | No | Yes, CV-builder manual-review area | No | Review with the new CV layout files and screenshots as a separate commit. | High |
| `tools/study-abroad-cost/index.html` | Added conversion-layer CSS/JS includes and rewrote hero/intro/trust copy. | Tied to untracked Study Abroad conversion-layer assets and conversion-layer test. | No | No | Yes, study-abroad manual-review area | No | Review with conversion-layer source, CSS, and test as a separate commit. | High |

## Classification

### A. Safe v5 fixes to stage first

- `assets/css/global.css`
- `assets/css/global.min.css`

The other v5 fixes listed in the v5 report are already present in `HEAD` or otherwise not dirty in the current working tree:

- `tools/afropayroll-os/workspace.html`
- `playwright.config.js`
- `tests/e2e/auth-funnel.spec.js`
- `tests/e2e/automation-smoke.spec.js`
- `tests/e2e/dashboard-auth-handlers.spec.js`
- `tests/e2e/dashboard-logout-recovery.spec.js`
- `tests/e2e/privacy-ai-consent.spec.js`
- `tests/e2e/tool-discovery.spec.js`

### B. Safe packaging/deploy fix

No tracked packaging/deploy fix is currently dirty. The v5 report says `scripts/build-dist.js` was already present in source and not dirty.

### C. Manual review required

- Product backbone: `docs/product-backbone/free-apps-backbone.md`
- CV Builder: `tools/cv-builder/index.html` plus untracked CV layout assets/evidence
- Study Abroad: `tools/study-abroad-cost/index.html`, `package.json`, conversion-layer assets/test, and source-gap evidence churn

### D. Audit artifacts

- `audit-results/study-abroad-source-gap-report.json` is tracked evidence churn only.

### E. Do not stage

Do not stage CV Builder, Study Abroad, product-backbone, package test-script, or audit timestamp churn in the first v6 commit.
