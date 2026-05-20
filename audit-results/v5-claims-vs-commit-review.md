# v5 Claims Versus 43e6f10 Review

## Evidence Read

Reviewed v3/v4 reports and compared them against `43e6f10` file membership:

- `audit-results/release-readiness-report-v3.md`
- `audit-results/v3-final-commands.md`
- `audit-results/v3-dirty-file-classification.md`
- `audit-results/release-packaging-report-v4.md`
- `audit-results/v4-final-commands.md`
- `audit-results/v4-reviewable-change-map.md`
- `audit-results/v4-suspicious-carryover-review.md`

## Claim Support Matrix

| v3/v4 claim | Supported by 43e6f10? | Evidence | Risk |
| --- | --- | --- | --- |
| Mobile issues improved from 614 to 97 | Yes | Source CSS changes plus `scripts/mobile-audit.js`, generated/static HTML, and audit reports. | Supported, but source and generated output are mixed. |
| Accessibility crawl issues improved from 2406 to 0 | Yes | `scripts/fix-form-label-associations.js`, `scripts/fix-v3-accessibility-tail.js`, product templates/static HTML, and audit reports. | Supported, but many fixes are visible in generated HTML rather than isolated templates. |
| Dark-mode sampled contrast issues improved to 0 | Yes | `assets/css/theme-dark.css`, `design-system.css`, `tokens.css`, `vat-calculator.css`, `scripts/dark-mode-visual-audit.js`, screenshots. | Supported. Needs ongoing sample coverage for pages outside the v3 set. |
| Hreflang warnings stayed at 0 | Mostly | Validation reports and localized generated pages are present. | The exact source-level cause is less isolated than the generated output. |
| Comprehensive crawl correctness | Yes | `scripts/comprehensive-quality-crawl.js` plus v3/v4/v5 crawl logs. | Supported. Crawl still reports metadata/dark/copy risk counts even with 0 broken pages/links/images. |
| Product-quality Playwright expansion | Yes | `tests/e2e/product-quality-v2.spec.js` and `tests/e2e/product-quality-v3.spec.js`. | Supported. Full suite still needed v5 repairs. |
| Network/performance work | Yes | `scripts/mobile-network-smoke.js`, search/salary index build changes, registry pruning, bundle update workflow, and generated index files. | Network still WARN on 4 of 6 routes under constrained profile. |
| Generated output included | Yes | 8,437 content/static pages plus generated indexes, service worker, minified assets, and audit outputs. | Biggest reviewability issue. |
| Unrelated JAMB/CV/study-abroad/product-backbone changes | Mixed | `jamb/index.html`, `tools/cv-builder/index.html`, and `tools/study-abroad-cost/index.html` appear in 43e6f10. `assets/css/product-backbone.css` is not in 43e6f10 and appears in later history/current dirty state. | Requires manual product-owner review before bundling with any follow-up release. |

## Supported Improvements

The product-quality claims are not just report-only. The commit includes source-level changes for mobile, dark mode, accessibility, crawl scripts, network smoke checks, and Playwright coverage. Current v5 verification also confirms the important gates still pass.

## Weak Spots

- The commit is too large to review as one logical change.
- A large share of the diff is generated or post-processed HTML.
- Audit artifacts and screenshots are mixed with product source.
- Automation/source-truth and scholarship registry work are mixed with product-quality fixes.
- Some v3/v4 gains are easiest to see through generated output and audit logs, not clean source diffs.

## Conclusion

The v3/v4 quality improvements are real enough to keep, but `43e6f10` should be followed by cleanup commits and manual review rather than treated as a clean release unit.
