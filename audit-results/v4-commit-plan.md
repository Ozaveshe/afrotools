# V4 Commit Plan

No commits were created in this sprint.

## Commit 1: Deploy Artifact Packaging Hardening

Files:

- `scripts/build-dist.js`

Purpose:

- Keep `audit-results/` out of `dist/`.
- Avoid Windows `EPERM` failures when the `dist/` directory root is held open.

Verification:

- `npm run build:deploy`
- `npm run audit:dist`
- `npm run security:scan`
- `git diff --check`

Generated output included: no.

## Commit 2: V4 Packaging Evidence

Files:

- `audit-results/v4-*`
- `audit-results/release-packaging-report-v4.md`

Purpose:

- Preserve packaging decisions, command logs, and manual review map.

Verification:

- `git diff --check`

Generated output included: audit evidence only.

## Commit 3: Current Branch SEO Priority Module

Already committed as `ca034dc Add SEO priority reporting module`.

Files:

- `AGENTS.md`
- `data/seo-priority/.gitignore`
- `data/seo-priority/README.md`
- `package.json`
- `reports/seo-priority-report.json`
- `scripts/seo-priority-report.js`

Purpose:

- SEO priority reporting.

Verification:

- Run the package script added by the commit.
- `npm run seo:report`

Generated output included: `reports/seo-priority-report.json`.

## Commit 4: Manual Decision - Product Backbone / CV / Study Abroad Batch

Files:

- `assets/css/product-backbone.css`
- `assets/js/components/product-backbone.js`
- `docs/product-backbone/**`
- `reports/product-backbone/**`
- `tools/cv-builder/**`
- `tools/study-abroad-cost/**`
- `sw/zana/mjenzi-cv/index.html`
- `tools/scholarship-finder/index.html`

Purpose:

- Unknown in v4 context. These appeared during the packaging sprint and are outside the v3 release-packaging scope.

Verification:

- Product-specific browser tests for CV builder, study abroad cost, scholarship finder.
- `npm test`
- Product-quality Playwright subset.

Generated output included: likely cache-busted HTML/report outputs; review manually.

## Commit 5: Manual Decision - JAMB CSS Include

Files:

- `jamb/index.html`

Purpose:

- Adds `/assets/css/education-ecosystem-strip.css`.

Verification:

- Browser smoke `/jamb/`.
- `npm test`.

Generated output included: no.

## Historical V3 Split Plan If Main History Is Reworked

If the team wants the already-committed v3 work to be truly reviewable, split `43e6f10` into:

1. Accessibility label/crawl fixes.
2. Mobile layout and audit fixes.
3. Dark-mode fixes.
4. Network/performance fixes.
5. Product-quality Playwright tests.
6. Copy/claim cleanup.
7. Automation/public-claim/scholarship source-truth carryover.
8. Generated HTML/data/minified outputs.
9. Audit evidence.

That requires an intentional history rewrite or revert/cherry-pick workflow and was not performed here.
