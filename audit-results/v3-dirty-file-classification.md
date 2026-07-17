# V3 Dirty File Classification

Generated from `audit-results/v3-git-status-after.txt`, `audit-results/v3-diff-stat-after.txt`, and `audit-results/v3-dirty-file-classification.json`.

## Summary

- Dirty status entries: 8662
- Diff files: 8476
- Diff stat: 31535 insertions, 125087 deletions
- `git diff --check`: pass after trimming the trailing blank line in `reports/mobile-network-smoke.md`
- Raw checkout reviewability: not reviewable as one release diff
- Packaged reviewability: reviewable if split into source/styles/scripts/tests, generated content, minified/data output, and audit artifacts

## Categories

| Group | Count | Decision | Notes |
|---|---:|---|---|
| Source code | 12 | Keep v3-relevant, manual review carryover | V3-relevant source changes are small, but this group also contains carried scholarship and automation work that is outside the v3 blocker sprint. |
| Styles | 8 | Keep | Mobile, dark mode, form, result, and card guardrails. |
| Scripts | 18 | Keep v3-relevant, manual review carryover | V3 audit/fix scripts, retry-safe file writing, mobile audit, network smoke, crawl, and HTML bundle rules. Some automation/scholarship audit scripts are carried debt. |
| Tests | 2 | Keep | Product-quality Playwright coverage expanded from 6 to 14 tests. |
| Content/localization | 8432 | Regenerate or commit separately | Mostly generated or post-processed HTML from labels, cache-busting, bundle rewriting, and minification/build passes. Do not hide source changes inside this group. |
| Generated build output | 3 | Regenerate or commit separately if tracked | `data/search-index.json`, `data/tool-directory.json`, `service-worker.js`. |
| Audit output | 175 | Exclude from product release commit unless audit evidence is intentionally tracked | Required evidence for v2/v3, crawl reports, command logs, and final reports. |
| Screenshots | 1 root entry | Exclude unless audit evidence is intentionally tracked | Dark-mode screenshots live under `audit-results/dark-mode-screenshots/` as audit evidence. |
| Minified/generated assets | 6 | Regenerate from source | CSS/JS minified outputs after `npm run minify` and `build:deploy`. |
| Suspicious or unrelated | 5 | Manual review before release packaging | See list below. These should not be silently shipped as part of the v3 blocker closure. |

## V3 Direct Changes To Keep

- `assets/css/design-system.css`
- `assets/css/global.css`
- `assets/css/money-page-commercial.css`
- `assets/css/seo-clusters.css`
- `assets/css/sw-zana-mobile.css`
- `assets/css/tokens.css`
- `assets/css/vat-calculator.css`
- `scripts/mobile-audit.js`
- `scripts/mobile-network-smoke.js`
- `scripts/comprehensive-quality-crawl.js`
- `scripts/lib/safe-write.js`
- `scripts/minify.js`
- `scripts/build-search-index.js`
- `scripts/build-salary-tax-index.js`
- `scripts/update-html-bundles.js`
- `scripts/prune-unused-registry.js`
- `scripts/apply-v3-dark-mode-fixes.js`
- `scripts/fix-form-label-associations.js`
- `scripts/fix-v3-accessibility-tail.js`
- `tests/e2e/product-quality-v2.spec.js`
- `tests/e2e/product-quality-v3.spec.js`
- `search/index.html`
- `salary-tax/index.html`
- `tools/mobile-money-fees/index.html`
- `tools/market-stall-profit/index.html`
- `tools/unit-converter/index.html`
- `sw/zana/kubadilisha-vipimo/index.html`
- `fr/tools/assurance-auto/index.html`
- `nigeria/ng-salary-tax.html`

## Suspicious Or Unrelated Items

- `llms-full.txt`
- `data/audits/`
- `data/automation/`
- `data/scholarships/`
- `docs/AUTOMATION-REGISTRY.md`

Decision: manual review. These are not direct v3 blocker-closure changes and should be packaged separately or explicitly approved.

## Release Hygiene Decision

Do not review or ship this checkout as one giant mixed diff. The release can move forward only if the package is split:

1. Source, style, script, and Playwright changes for v3 blockers.
2. Generated HTML/data/minified assets regenerated from the approved sources.
3. Audit evidence, kept outside the product release unless the team intentionally tracks it.
4. Suspicious carryover files reviewed separately.
