# V4 Reviewable Change Map

## Baseline

Fresh v4 baseline before packaging reports:

- `git status --short`: 1 dirty file, `jamb/index.html`
- `git diff --stat`: 1 file changed, 1 insertion
- `git diff --name-only`: `jamb/index.html`
- `git diff --check`: pass

Branch delta versus `main`:

- `AGENTS.md`
- `data/seo-priority/.gitignore`
- `data/seo-priority/README.md`
- `package.json`
- `reports/seo-priority-report.json`
- `scripts/seo-priority-report.js`

## A. Core Source Changes

Keep / separate:

- `scripts/build-dist.js`: v4 packaging hardening. Keep.
- `jamb/index.html`: one education CSS include. Manual decision; not part of v3 packaging.
- Product-backbone/CV/study-abroad files: manual decision; separate product batch.

## B. Styles

Manual decision:

- `assets/css/product-backbone.css`
- `tools/cv-builder/css/cv-builder-entry.css`
- `tools/cv-builder/css/cv-builder-entry-mobile.css`

No v4 style fix was required beyond build packaging.

## C. Scripts

Keep:

- `scripts/build-dist.js`

Already committed branch script:

- `scripts/seo-priority-report.js`

Manual decision:

- `assets/js/components/product-backbone.js`
- `tools/study-abroad-cost/study-abroad-backbone.js`

## D. Tests

No new v4 tests were added. V3 product-quality tests remain tracked and passing.

## E. Content / Localization

Manual decision:

- `jamb/index.html`
- `sw/zana/mjenzi-cv/index.html`
- `tools/cv-builder/index.html`
- `tools/scholarship-finder/index.html`
- `tools/study-abroad-cost/index.html`

These are product/content changes outside the v4 packaging scope.

## F. Generated Output

Regenerate/separate:

- `reports/mobile-audit.json`
- `reports/mobile-audit.md`
- `reports/mobile-network-smoke.json`
- `reports/mobile-network-smoke.md`
- `audit-results/final-summary.md`
- `audit-results/metadata-issues.csv`
- `audit-results/page-crawl-report.json`

Do not commit `dist/`; it is ignored and regenerated.

## G. Audit Evidence

Keep as evidence, separate from product release:

- `audit-results/v4-*`
- `audit-results/dark-mode-v4-final-v2.*`
- `audit-results/cv-builder-*`
- `reports/cv-builder-flagship-audit-2026-05-20.md`
- `reports/product-backbone/**`

## H. Suspicious / Carryover

Already committed in v3-era `43e6f10`:

- `llms-full.txt`
- `data/audits/public-claim-registry.json`
- `data/automation/automation-registry.json`
- `data/scholarships/official-sources.json`
- `docs/AUTOMATION-REGISTRY.md`

Decision: keep only as separate automation/public-claim/scholarship release surfaces. They are not v4 packaging changes.
