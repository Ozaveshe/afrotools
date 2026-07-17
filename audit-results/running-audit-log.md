# AfroTools Comprehensive Audit Log

Started: 2026-05-18

## Scope

- Full static-first repo audit covering build health, route inventory, global UI, dark mode, copy quality, accessibility, SEO, mobile readiness, and production release checks.
- Bias toward safe global source fixes in shared CSS, shared components, scripts, and templates.
- Generated outputs are treated as artifacts unless a validation script intentionally regenerates them.

## Initial Findings

- The existing log claimed the repository was clean, but the current checkout was dirty when this session began. Treat unrelated localization/tool-quality/build churn as pre-existing unless listed below as part of this pass.
- Dependencies are already installed through `package-lock.json` and `node_modules`.
- Architecture is plain HTML/CSS/JS with generated build scripts, shared Web Components, registry-backed discovery, and Netlify publishing from `dist/`.
- No explicit lint or TypeScript scripts are configured in `package.json`; validation is script-driven.

## Current Session Checkpoint

- 2026-05-18 rerun note: the current checkout is not clean. `git status --short` shows pre-existing localization/tool-quality edits and the untracked `audit-results/` folder.
- This pass will preserve unrelated dirty work and keep new audit artifacts clearly scoped.

## Running Command Log

| Command | Result | Notes |
| --- | --- | --- |
| `npm run audit` | Passed | 2,417 registry rows; 2,412 live/new landing pages; 0 missing live/new pages; homepage claim remains `2,594+` live tools. |
| `npm run seo:report` | Passed | 0 missing canonical tags, titles, descriptions, hreflang violations, sitemap fixes, or `/fr/` homepage broken-link warnings. |
| `npm run check-links` | Passed | Scanned 8,504 HTML files and 81,030 internal links; 0 broken internal links. |
| `node scripts/comprehensive-quality-crawl.js` | Passed | Final post-build crawl audited 8,501 routes; 0 broken pages, 0 broken internal links, 0 broken images. |
| `node scripts/check-registry-syntax.js` | Passed | Registry parses; final total 2,459 tool rows. |
| `npm test` | Passed | Link check, blog feed check, blog backend, tool audit, and 395 PAYE/VAT metadata panels passed. |
| `npm run build:i18n:validate` | Passed | `fr`, `sw`, `yo`, and `ha` translation keys match `en.json`. |
| `npm run validate:hreflang` | Passed with warnings | Final post-build summary: 7,889 pages scanned, 7,887 pages with hreflang tags, 19,660 pairs, 836 bidirectionality warnings. `npm run seo:report` reported 0 remaining hreflang violations after build. |
| `npm run vat-business-tax:verify` | Passed | VAT/business-tax workflow verified across 82 registry tools. |
| `npm run legal-workflow:verify` | Passed | Legal workflow verified across 69 tool routes. |
| `npm run category-workflow:verify` | Passed | Category workflow lite verification passed. |
| `npm run pdf:verify` | Passed | PDF category and Document & PDF workflow gates passed. |
| `npm run salary-tax:verify` | Passed | Salary/PAYE workflow verified across 6 report-enabled PAYE pages. |
| `npm run mobile:audit` | Passed with findings | 8,461 HTML pages audited; 1,067 pages with mobile issues; top cluster is `sw / zana` late multi-column collapse. |
| `npm run mobile:network` | Passed with WARN verdict | 6 constrained-network routes tested; no horizontal overflow or sub-16px controls, but several routes had slow DCL/load under 900 Kbps. |
| Browser smoke: unit converter pressure path | Passed | English and Swahili unit converter pages returned `2.5 bar -> 36.25942 PSI` and had 0 unlabeled selects. |
| `npm run build:deploy` | Passed | Build completed; `dist/` built with 10,877 copied files and public live tool count `2,594+`. |
| `npm run security:scan` | Passed | Security scan passed after build. |
| `npm run audit:dist` | Passed | Deploy artifact audit passed. |
| `git diff --check` | Passed | No whitespace or conflict-marker issues after trimming a trailing blank line in the mobile network report. |

## Issues Found

| Severity | Area | Issue | Status |
| --- | --- | --- | --- |
| High | Functionality/accessibility | Unit converter pressure "to unit" select used duplicated `presFromU2` id and runtime id rewriting, blocking the generic converter path and leaving selects unlabeled. | Fixed in English and Swahili unit converter pages; browser-smoked. |
| Medium | Dark mode | VAT calculator dark-mode CSS used `var(--color-text)` as a background token, risking dark-on-dark or inverted theme behavior. | Fixed in shared VAT calculator CSS with background/surface tokens. |
| Medium | Content quality | Three Swahili country registry entries had mojibake in visible names and placeholder icons. | Fixed source and minified registry entries for Eswatini, Ethiopia, and Zimbabwe. |
| Medium | Audit coverage | Existing scripts did not produce the requested consolidated 6,000+ page crawl artifacts. | Added `scripts/comprehensive-quality-crawl.js` and generated JSON/CSV/Markdown reports. |
| Carryover | Mobile UX | 988 source-level mobile risks remain after final crawl; top repo-native cluster is late multi-column collapse in `sw / zana`. | Reported in `reports/mobile-audit.md`; left for next focused batch. |
| Carryover | Metadata/a11y/copy | Final crawl still reports 3,356 metadata signals, 2,632 a11y signals, and 137 copy signals. | Reports generated; fixed the highest confirmed unit-converter a11y/functionality issue in this pass. |

## Files Changed During Audit

| File | Reason |
| --- | --- |
| `scripts/comprehensive-quality-crawl.js` | New static crawl/report automation for route inventory, metadata, links/images, dark-mode risk, copy risk, a11y risk, mobile risk, and final summaries. |
| `audit-results/page-crawl-report.json` | Final machine-readable crawl result for 8,501 routes. |
| `audit-results/broken-links.csv` | Final broken-link export; header only because no broken internal links were found. |
| `audit-results/metadata-issues.csv` | Metadata/a11y-style issue export for follow-up prioritization. |
| `audit-results/dark-mode-issues.csv` | Dark-mode risk export for remaining template/CSS work. |
| `audit-results/copy-quality-issues.csv` | Placeholder, jargon, and mojibake signal export for copy cleanup. |
| `audit-results/final-summary.md` | Human-readable final crawl summary. |
| `audit-results/running-audit-log.md` | Running log for this audit session and proof commands. |
| `assets/css/vat-calculator.css` | Replaced dark-mode text-token backgrounds with background/surface tokens. |
| `assets/js/components/tool-registry.js` | Fixed three Swahili country-hub mojibake names and placeholder icons. |
| `assets/js/components/tool-registry.min.js` | Kept the live minified registry aligned with the source fixes. |
| `tools/unit-converter/index.html` | Added accessible labels to all unit selects and replaced the broken pressure select id with `presToU`. |
| `sw/zana/kubadilisha-vipimo/index.html` | Same unit-select accessibility and pressure conversion fix for the Swahili surface. |
