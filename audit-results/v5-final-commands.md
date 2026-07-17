# AfroTools v5 Final Commands

## npm run build:deploy

- Exit code: 0
- Duration: 711.9s
- Log: audit-results/v5-build-deploy.log

Tail:
```text
- codex:pdf-document-workflow-gate: no recent Codex run evidence in the 2026-05-15 to 2026-05-19 report.
- codex:pension-projection-automation: no recent Codex run evidence in the 2026-05-15 to 2026-05-19 report.
- codex:pro-architecture-readiness-gate: no recent Codex run evidence in the 2026-05-15 to 2026-05-19 report.
- codex:property-management-fee-automation: no recent Codex run evidence in the 2026-05-15 to 2026-05-19 report.
- codex:school-fees-freshness-automation: no recent Codex run evidence in the 2026-05-15 to 2026-05-19 report.
- codex:social-security-source-automation: no recent Codex run evidence in the 2026-05-15 to 2026-05-19 report.
- codex:supabase-project-advisor-watch: no recent Codex run evidence in the 2026-05-15 to 2026-05-19 report.

No missing production runner schedules were found.
  SW    CACHE_VERSION stamped: 12739cfc
Tool verification metadata and panels verified for 395 PAYE/VAT pages.
Built dist: 10910 files copied, 30 directories skipped, 84 files skipped.
```

## npm test

- Exit code: 0
- Duration: 27.3s
- Log: audit-results/v5-npm-test.log

Tail:
```text
- codex:payroll-pack-support-automation: latest report includes non-completed status "in progress".
- codex:pdf-document-workflow-gate: no recent Codex run evidence in the 2026-05-15 to 2026-05-19 report.
- codex:pension-projection-automation: no recent Codex run evidence in the 2026-05-15 to 2026-05-19 report.
- codex:pro-architecture-readiness-gate: no recent Codex run evidence in the 2026-05-15 to 2026-05-19 report.
- codex:property-management-fee-automation: no recent Codex run evidence in the 2026-05-15 to 2026-05-19 report.
- codex:school-fees-freshness-automation: no recent Codex run evidence in the 2026-05-15 to 2026-05-19 report.
- codex:social-security-source-automation: no recent Codex run evidence in the 2026-05-15 to 2026-05-19 report.
- codex:supabase-project-advisor-watch: no recent Codex run evidence in the 2026-05-15 to 2026-05-19 report.

No missing production runner schedules were found.
Study Abroad data trust policy verified.
Tool verification metadata and panels verified for 395 PAYE/VAT pages.
```

## node scripts/comprehensive-quality-crawl.js

- Exit code: 0
- Duration: 478.6s
- Log: audit-results/v5-comprehensive-quality-crawl.log

Tail:
```text
Comprehensive crawl complete: 8501 routes, 8501 pages audited.
Broken pages: 0; broken internal links: 0; metadata issues: 3354; dark-mode risks: 457; copy issues: 135.
Reports written under audit-results/.
```

## npm run seo:report

- Exit code: 0
- Duration: 71s
- Log: audit-results/v5-seo-report.log

Tail:
```text

[1m── Remaining issues (manual review) ────────────────────[0m
  [32mMissing canonical tags: 0[0m
  [32mMissing <title> tags: 0[0m
  [32mMissing meta descriptions: 0[0m
  [32mRemaining hreflang violations: 0[0m
  [32m/fr/ homepage broken links (no static file — verify _redirects): 0[0m
  [32mNoindex pages skipped from metadata report: 871[0m

[1m── Summary ─────────────────────────────────────────────[0m
  [32m✓ No auto-fixes needed — site is clean.[0m

```

## npm run security:scan

- Exit code: 0
- Duration: 19.6s
- Log: audit-results/v5-security-scan.log

Tail:
```text

> afrotools@1.0.0 security:scan
> node scripts/security-scan.js

Security scan passed.
```

## npm run audit:dist

- Exit code: 0
- Duration: 364.2s
- Log: audit-results/v5-audit-dist.log

Tail:
```text

> afrotools@1.0.0 audit:dist
> node scripts/audit-dist.js

Deploy artifact audit passed.
```

## npm run validate:hreflang

- Exit code: 0
- Duration: 5.9s
- Log: audit-results/v5-validate-hreflang.log

Tail:
```text

🔍 Hreflang Validation Report
════════════════════════════════════════════════════════════
📄 7889 pages scanned
🏷️  7887 pages with hreflang tags
🔗 20495 hreflang pairs found

✅ All checks passed!
✅ 7887 pages checked
✅ 20495 hreflang pairs validated
✅ 0 errors

```

## npm run mobile:audit

- Exit code: 0
- Duration: 461.8s
- Log: audit-results/v5-mobile-audit.log

Tail:
```text

> afrotools@1.0.0 mobile:audit
> node scripts/mobile-audit.js

Mobile audit complete for 8461 HTML pages
  Issue-bearing pages: 97
  Top cluster: pro: Multi-column layout stays multi-column too long
  Output JSON: reports/mobile-audit.json
  Output Markdown: reports/mobile-audit.md
```

## npm run mobile:network

- Exit code: 0
- Duration: 74s
- Log: audit-results/v5-mobile-network.log

Tail:
```text

> afrotools@1.0.0 mobile:network
> node scripts/mobile-network-smoke.js

Mobile network smoke complete for 6 routes
  Profile: Africa mobile 3G/low 4G
  Verdict: WARN
  Output JSON: reports/mobile-network-smoke.json
  Output Markdown: reports/mobile-network-smoke.md
```

## npx playwright test

- Exit code: 0
- Duration: 112.3s
- Log: audit-results/v5-playwright-final.log

Tail:
```text
  ok 72 [chromium] › tests\e2e\yoruba-localization.spec.js:246:5 › Yoruba localized route browser fixtures › Yoruba PDF merge and split is stable on desktop and mobile (4.2s)
  ok 73 [chromium] › tests\e2e\yoruba-localization.spec.js:246:5 › Yoruba localized route browser fixtures › Yoruba PDF compress is stable on desktop and mobile (3.7s)
  ok 57 [chromium] › tests\e2e\product-quality-v2.spec.js:98:1 › representative finance, property, business, and health tools calculate results (39.5s)
  ok 74 [chromium] › tests\e2e\yoruba-localization.spec.js:246:5 › Yoruba localized route browser fixtures › Yoruba JAMB calculator is stable on desktop and mobile (6.6s)
  ok 75 [chromium] › tests\e2e\yoruba-localization.spec.js:246:5 › Yoruba localized route browser fixtures › Yoruba USSD directory is stable on desktop and mobile (6.5s)
  ok 76 [chromium] › tests\e2e\yoruba-localization.spec.js:246:5 › Yoruba localized route browser fixtures › Yoruba genotype checker is stable on desktop and mobile (5.4s)
  ok 77 [chromium] › tests\e2e\yoruba-localization.spec.js:246:5 › Yoruba localized route browser fixtures › Yoruba farm budget is stable on desktop and mobile (4.3s)
  ok 78 [chromium] › tests\e2e\yoruba-localization.spec.js:246:5 › Yoruba localized route browser fixtures › Yoruba phrase translator is stable on desktop and mobile (4.3s)
  ok 79 [chromium] › tests\e2e\yoruba-localization.spec.js:276:3 › Yoruba localized route browser fixtures › Yoruba mobile navbar opens and language links stay resolvable (3.0s)
  ok 68 [chromium] › tests\e2e\tool-discovery.spec.js:39:1 › tool search finds Nigeria PAYE and PDF Workspace, then clears back to full results (29.3s)

  79 passed (1.8m)
```

## git diff --check

- Exit code: 2
- Duration: 54.5s
- Log: audit-results/v5-git-diff-check.log

Tail:
```text
reports/mobile-network-smoke.md:30: new blank line at EOF.
```

## git status --short

- Exit code: 0
- Duration: 10.3s
- Log: audit-results/v5-git-status-short.log

Tail:
```text
?? audit-results/v5-playwright-full-before.txt
?? audit-results/v5-playwright-product-quality-after.txt
?? audit-results/v5-security-scan.log
?? audit-results/v5-seo-report.log
?? audit-results/v5-validate-hreflang.log
?? scripts/verify-cv-template-registry.js
?? tests/study-abroad-data-trust.test.js
?? tools/cv-builder/css/cv-design-foundation.css
?? tools/cv-builder/js/cv-design-foundation.js
?? tools/cv-builder/js/cv-template-registry.js
?? tools/study-abroad-cost/study-abroad-data-trust.js
?? tools/study-abroad-cost/study-abroad-hero-sources.js
```

## git log --oneline -5

- Exit code: 0
- Duration: 0.2s
- Log: audit-results/v5-git-log-oneline-5.log

Tail:
```text
9fc01d3 feat: upgrade CV and education product surfaces
ca034dc Add SEO priority reporting module
edc8cbe Add curated scholarship seeding pipeline
43e6f10 chore: ship automation and quality audit updates
bd5ac36 chore: refresh sitemap index outputs
```


## git diff --check after generated EOF fix

- Exit code: 0
- Log: audit-results/v5-git-diff-check-after.log
- Release-blocking: No

The initial final run found one generated-report whitespace issue in `reports/mobile-network-smoke.md`. The trailing blank line was removed and `git diff --check` passed on rerun.

## Post-restore correction and rerun

During final status refresh, an unexpected broad `git restore -- .` process was found running outside the planned v5 command set. It was stopped, the stale `.git/index.lock` was removed after no destructive git process remained, and the v5 fixes were re-applied where the restore had reverted them.

Post-restore verification:

- `node --check audit-results/v5-afropayroll-inline-script.js`: PASS
- `npx playwright test tests/e2e/afropayroll-pro.spec.js:331 --reporter=list`: PASS, 1 passed
- `npx playwright test tests/e2e/tool-discovery.spec.js --reporter=list`: PASS, 2 passed
- `npx playwright test tests/e2e/country-onboarding.spec.js --reporter=list`: PASS, 5 passed
- affected v5 Playwright set: PASS, 34 passed
- `npx playwright test`: PASS, 79 passed
- product-quality Playwright subset: PASS, 14 passed
- `npm test`: PASS post-restore with automation evidence warnings
- `npm run audit:dist`: PASS post-restore
- `git diff --check`: PASS after EOF cleanup and LF normalization for `playwright.config.js`
- `git status --short`: 95 entries
- `git diff --name-only`: 22 tracked changed files
- `git diff --stat`: 22 files changed, 1,301 insertions, 1,223 deletions
