# V4 Packaging Plan

## Current Repo Reality

- Current branch: `codex/search-priority-reporting`.
- `origin/main` already contains the large v3 package in `43e6f10 chore: ship automation and quality audit updates`.
- The original 8662-entry v3 dirty tree is no longer present as a working-tree diff in this checkout.
- Fresh v4 baseline before packaging work showed one dirty file: `jamb/index.html`.
- Current branch delta against `main` is the committed SEO priority module in `ca034dc`.

## 1. Source / Style / Script / Test Changes To Keep

Keep as v4 packaging hardening:

- `scripts/build-dist.js`
  - Clears the contents of `dist/` instead of deleting the folder root, avoiding Windows directory-handle `EPERM`.
  - Excludes `audit-results/` from Netlify publish artifact generation.

Keep as already committed current-branch work, separate from v3 packaging:

- `scripts/seo-priority-report.js`
- `data/seo-priority/.gitignore`
- `data/seo-priority/README.md`
- `reports/seo-priority-report.json`
- `package.json`
- `AGENTS.md`

Do not auto-include without human approval:

- `jamb/index.html`
- `assets/css/product-backbone.css`
- `assets/js/components/product-backbone.js`
- `tools/cv-builder/**`
- `tools/study-abroad-cost/**`
- `docs/product-backbone/**`
- `reports/product-backbone/**`

These appeared outside the v3 packaging lane and must be reviewed as a separate product-backbone/CV/study-abroad batch.

## 2. Generated Output To Regenerate Or Separate

- `dist/` is generated, ignored by git, and must not be committed.
- Root/static generated HTML is tracked in this repo when produced by build/post-processing, but it must be committed separately from source changes.
- Minified assets and generated JSON should be regenerated from source and reviewed separately.
- Current v4 build outputs updated `reports/mobile-audit.*`, `reports/mobile-network-smoke.*`, and crawl audit outputs; treat them as evidence, not product source.

## 3. Audit Artifacts To Keep For Evidence

Keep as local/review evidence unless the team intentionally tracks release reports:

- `audit-results/v4-*.txt`
- `audit-results/v4-*.md`
- `audit-results/release-packaging-report-v4.md`
- `audit-results/dark-mode-v4-final-v2.*`
- `audit-results/cv-builder-*`
- `reports/cv-builder-flagship-audit-2026-05-20.md`

## 4. Suspicious / Carryover Files Requiring Manual Review

From v3 classification, now committed in `43e6f10`:

- `llms-full.txt`
- `data/audits/public-claim-registry.json`
- `data/automation/automation-registry.json`
- `data/scholarships/official-sources.json`
- `docs/AUTOMATION-REGISTRY.md`

Decision: safe only as separate automation/public-claim/scholarship truth commits, not as hidden v3 mobile/dark/a11y packaging.

## 5. Files To Revert Or Exclude

Do not revert automatically. Exclude from the v4 packaging commit unless explicitly approved:

- `jamb/index.html`
- product-backbone/CV/study-abroad files listed above
- v4 audit artifacts, if the product release should stay clean

## 6. Does Generated Dist Belong In Git?

No. `dist/` is ignored by `.gitignore` and must remain generated-only. Netlify publishes `dist/`, but the repo should commit source and tracked generated site outputs separately from the deploy artifact.
