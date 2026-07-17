# Swahili Deployment Safety Review

Generated: 2026-05-18T05:40:58.114Z

## Verdict

Deploy risk: **split Swahili changes first**.

Swahili readiness and checkout readiness are different here. The Swahili beta surface is release-ready with carried debt, but the working tree has broad generated and non-Swahili churn. A deployment package should split or explicitly review the Swahili source package before release.

## Dirty Tree Groups

- generated-or-non-swahili-i18n-churn: 126
- other-report-churn: 28
- shared-related-tools-nonprompt-churn: 4
- shared-swahili-discovery-shell: 6
- swahili-source-or-report: 132
- unknown-dirty: 164
- unrelated-product-code-churn: 609

## Swahili Evidence

- Hreflang final proof: 0 errors/warnings after `build:i18n:full` and reciprocity fix.
- Swahili SEO metadata sweep: clean after the `/sw/salary-tax/` alias self-hreflang fix.
- Search final regression: shared navbar/search fixed; only non-blocking `/sw/` hero search debt remains.
- Content debt backlog: 0 beta blockers.

## Required Before Deployment

- npm run build:deploy
- npm run audit:dist
- npm run security:scan

These were not run in Prompt 148 because the prompt explicitly requested review only and no deployment.
