# CV Builder Live Ad-Readiness Blocker Fix

Date: 2026-05-21

Target route: `/tools/cv-builder/`

## Verdict

Source and deploy artifact are ready for a preview or production deploy smoke. Current live production is still serving the old HTML until a deploy happens, so live-domain verdict remains **Not ready on current production**, with source/dist evidence ready for controlled-ad smoke after deployment.

Live fetch after local fixes:

- `liveHasAtsFixScript`: false
- `liveHasMobileControlFix`: false
- Meaning: production has not picked up this checkout yet.

## Changed Files

- `_headers`
- `tools/cv-builder/index.html`
- `tools/cv-builder/css/cv-mobile-control-fix.css`
- `tools/cv-builder/js/cv-ai.js`
- `tools/cv-builder/js/cv-analytics.js`
- `scripts/verify-cv-ats-plain-pdf.js`
- `audit-results/cv-builder-live-ad-readiness-blocker-fix/*`

Existing CV Builder source files already present in this checkout and confirmed in the generated artifact:

- `tools/cv-builder/js/cv-ats-plain-pdf-fix.js`
- `tools/cv-builder/js/cv-layout-decongestion.js`
- `tools/cv-builder/js/cv-export-empty-polish.js`
- `tools/cv-builder/js/cv-completion-flow-fix.js`
- `tools/cv-builder/css/cv-layout-decongestion.css`
- `tools/cv-builder/css/cv-export-empty-polish.css`

## Root Causes And Fixes

### 1. Missing ATS Plain PDF script on production HTML

Root cause: live production HTML is stale and does not include the ATS Plain PDF fix script. The source page now explicitly references `cv-ats-plain-pdf-fix.js`, and `dist/tools/cv-builder/index.html` now includes the script after regeneration.

Evidence:

- Source: `tools/cv-builder/index.html`
- Dist: `dist/tools/cv-builder/index.html`
- Dist script present: `cv-ats-plain-pdf-fix.js`
- Smoke flag: `hasAtsFixScript: true`

### 2. ATS Plain PDF strict parser failure

Root cause: live production is still using the old ATS Plain PDF path. The current source/dist path uses `CVExportAtsPlainPdf` and passes strict `pdf-parse(fs.readFileSync(...))` verification.

Evidence:

- Local strict parser PDF: `audit-results/cv-builder-ats-plain-pdf-fix/Parser-Candidate-CV-Data-Analyst-ATS.pdf`
- Dist strict parser PDF: `audit-results/cv-builder-live-ad-readiness-blocker-fix/dist-ats-plain.pdf`
- Dist parser result: 1 page, 11675 bytes, selectable text includes candidate name, email, and `EDUCATION`.

### 3. Google Analytics CSP error

Root cause: production GA sent collection requests to `https://www.google.com/g/collect`, but `_headers` did not allow `https://www.google.com` in `connect-src`.

Fix: added `https://www.google.com` to `connect-src` without broad wildcards.

### 4. Analyze API failure noise

Root cause: expected AI API failures logged `AI call failed: Error: API error` during the normal Analyze flow.

Fix: `cv-ai.js` now treats that expected AI endpoint failure as a local fallback path. The user sees:

> AI analysis is temporarily unavailable. You can still export your CV and use the checklist.

The deterministic checklist and score still render. The fallback event `cv_analyze_fallback_shown` is allowlisted and verified locally without sending PII.

### 5. Mobile controls below target size

Root cause: layout-decongestion toolbar rules forced compact 38px controls with `!important`, overriding the global mobile control baseline.

Fix: added `cv-mobile-control-fix.css` with scoped mobile overrides for toolbar, drawer, export, template, and form controls.

Evidence:

- 390x844: no horizontal overflow, min visible control font 16px, no visible controls below 44px high.
- 360x800: no horizontal overflow, min visible control font 16px, no visible controls below 44px high.

## Smoke Evidence

Screenshots:

- Desktop local smoke: `audit-results/cv-builder-live-ad-readiness-blocker-fix/desktop-local-smoke.png`
- Mobile 390 local smoke: `audit-results/cv-builder-live-ad-readiness-blocker-fix/mobile-390x844-local-smoke.png`
- Mobile 360 local smoke: `audit-results/cv-builder-live-ad-readiness-blocker-fix/mobile-360x800-local-smoke.png`
- Mobile ATS/export smoke 390: `audit-results/cv-builder-ats-plain-pdf-fix/mobile-390x844-export-smoke.png`
- Mobile ATS/export smoke 360: `audit-results/cv-builder-ats-plain-pdf-fix/mobile-360x800-export-smoke.png`

PDFs:

- Normal designed PDF: `audit-results/cv-builder-ats-plain-pdf-fix/Parser-Candidate-CV-Data-Analyst.pdf`
- ATS Plain PDF: `audit-results/cv-builder-ats-plain-pdf-fix/Parser-Candidate-CV-Data-Analyst-ATS.pdf`
- Dist ATS Plain PDF: `audit-results/cv-builder-live-ad-readiness-blocker-fix/dist-ats-plain.pdf`

JSON evidence:

- Parser and mobile check: `audit-results/cv-builder-ats-plain-pdf-fix/parser-check.json`
- Local completion smoke: `audit-results/cv-builder-live-ad-readiness-blocker-fix/local-smoke.json`
- Dist ATS parser check: `audit-results/cv-builder-live-ad-readiness-blocker-fix/dist-ats-plain-check.json`

## Validation Commands

Passed:

- `node --check tools\cv-builder\js\cv-ai.js`
- `node --check tools\cv-builder\js\cv-analytics.js`
- `node --check tools\cv-builder\js\cv-ats-plain-pdf-fix.js`
- `node --check scripts\verify-cv-ats-plain-pdf.js`
- `npm run test:cv-template-registry`
- `npm run pdf:verify`
- `git diff --check`
- `node scripts\verify-cv-ats-plain-pdf.js`
- `npm run build`
- `npm test`
- `npm run security:scan`
- `node scripts\build-dist.js`
- `npm run audit:dist`
- Local browser smoke on `/tools/cv-builder/`
- Mobile smoke at 390x844 and 360x800
- Dist ATS Plain strict parser check

Build note:

- Two initial `npm run build` attempts failed during `scripts/update-html-bundles.js` because orphaned build child processes kept Windows file handles open on unrelated AfroKitchen recipe pages. After clearing only those stale build child processes and rerunning `node scripts\update-html-bundles.js`, the full `npm run build` passed.

## Remaining Blocker Before Live Ads

Deploy this source/dist artifact and rerun live-domain smoke on:

- desktop 1440x900
- mobile 390x844
- mobile 360x800

Production currently still lacks `cv-ats-plain-pdf-fix.js`, so the live route cannot be marked ready until deployment and live smoke confirm the new artifact is served.
