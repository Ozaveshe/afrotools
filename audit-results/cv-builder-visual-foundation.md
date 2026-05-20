# CV Builder Visual Foundation PR Summary

Date: 2026-05-20
Route: `/tools/cv-builder/`

## Scope

This PR converts the CV Builder design enforcement standard into a reusable visual foundation. It does not rebuild CV data logic, template rendering, ATS scoring, import parsing, saved CV logic, or PDF export logic.

## What Changed

- Added a late-loading CV Builder design token layer: `tools/cv-builder/css/cv-design-foundation.css`.
- Added a visual helper for session state and toolbar label cleanup: `tools/cv-builder/js/cv-design-foundation.js`.
- Loaded the new CSS/JS from `tools/cv-builder/index.html`.
- Updated above-the-fold copy to the agreed honest product framing:
  - Free CV Builder for African Job Seekers
  - Clean country-aware CV
  - Templates, ATS checks, cover letter tools, PDF export
  - Local browser privacy reassurance
- Rebalanced the workspace shell:
  - Static product top bar so it no longer overlays the editor.
  - Stronger green primary actions, blue secondary action states, deep navy badges, yellow accent.
  - More generous form spacing and larger mobile controls.
  - Clear state styling for success, warning, danger, neutral, saved, unsaved, ATS-safe, ATS-warning, incomplete, and completed states.
  - A4 preview now leads the desktop and mobile preview panel before template/export controls.
  - Mobile sticky action bar is hidden until the user actually enters the builder.
  - Global floating save/chat widgets are hidden on mobile CV Builder and during active editing to prevent overlap with core CV actions.

## Files Inspected

- Route/page: `tools/cv-builder/index.html`
- Core styling: `tools/cv-builder/css/cv-builder.css`
- Entry/landing styling: `tools/cv-builder/css/cv-builder-entry.css`, `tools/cv-builder/css/cv-builder-entry-mobile.css`, `tools/cv-builder/css/cv-builder-entry-accessibility.css`
- Workspace styling: `tools/cv-builder/css/cv-builder-workspace.css`
- Template gallery/studio styling: `tools/cv-builder/css/cv-template-gallery.css`, `tools/cv-builder/css/cv-template-studio.css`
- Feature styling: `tools/cv-builder/css/cv-country-rules.css`, `tools/cv-builder/css/cv-ats-matcher.css`, `tools/cv-builder/css/cv-import-assistant.css`, `tools/cv-builder/css/cv-improvement-assistant.css`, `tools/cv-builder/css/cv-application-pack.css`, `tools/cv-builder/css/cv-job-tracker.css`, `tools/cv-builder/css/cv-export-upgrade.css`, `tools/cv-builder/css/cv-sponsors.css`
- Main app/save/localStorage: `tools/cv-builder/js/cv-app.js`
- Workspace wizard/mobile preview: `tools/cv-builder/js/cv-workspace-enhancer.js`
- Template rendering: `tools/cv-builder/js/cv-templates.js`, `tools/cv-builder/js/cv-template-studio.js`, `tools/cv-builder/js/cv-template-gallery.js`
- Export/PDF: `tools/cv-builder/js/cv-export-upgrade.js`, `tools/cv-builder/js/cv-export-pdf-quality.js`
- Analytics hooks: `tools/cv-builder/js/cv-analytics.js`
- Country rules and ATS logic: `tools/cv-builder/js/cv-country-rules.js`, `tools/cv-builder/js/cv-ats-matcher.js`

## Screenshots

Before screenshots from the previous ad-readiness audit:

- Desktop above fold: `audit-results/cv-builder-ad-readiness-screenshots/desktop-landing.png`
- Desktop editor: `audit-results/cv-builder-ad-readiness-screenshots/desktop-editor.png`
- Desktop preview: `audit-results/cv-builder-ad-readiness-screenshots/desktop-preview.png`
- Mobile above fold: `audit-results/cv-builder-ad-readiness-screenshots/mobile-landing.png`
- Mobile form: `audit-results/cv-builder-ad-readiness-screenshots/mobile-form.png`
- Mobile preview/export: `audit-results/cv-builder-ad-readiness-screenshots/mobile-preview-export.png`

After screenshots captured for this PR:

- Desktop above fold: `audit-results/cv-builder-visual-foundation-screenshots/desktop-above-fold.png`
- Desktop builder: `audit-results/cv-builder-visual-foundation-screenshots/desktop-builder.png`
- Desktop preview: `audit-results/cv-builder-visual-foundation-screenshots/desktop-preview.png`
- Mobile above fold: `audit-results/cv-builder-visual-foundation-screenshots/mobile-above-fold.png`
- Mobile form: `audit-results/cv-builder-visual-foundation-screenshots/mobile-form.png`
- Mobile preview/export: `audit-results/cv-builder-visual-foundation-screenshots/mobile-preview-export.png`

Additional export artifact:

- PDF smoke output: `audit-results/cv-builder-visual-foundation-screenshots/Nandi-Moyo-CV-Senior-Product-Operations-Manager.pdf`

Machine-readable evidence:

- Screenshot and console evidence: `audit-results/cv-builder-visual-foundation-evidence.json`
- PDF smoke evidence: `audit-results/cv-builder-visual-foundation-pdf-smoke.json`

## Print/PDF Note

The new CSS avoids changing the rendered CV template internals and keeps print-specific hiding limited to UI chrome. PDF smoke confirmed that a demo CV exported successfully with no console or page errors.

## Validation Evidence

- `node --check tools/cv-builder/js/cv-design-foundation.js` - passed.
- `git diff --check -- tools/cv-builder/index.html tools/cv-builder/css/cv-design-foundation.css tools/cv-builder/js/cv-design-foundation.js` - passed.
- Manual Playwright screenshot pass - passed, no console errors and no page errors.
- Manual PDF smoke - passed, downloaded `Nandi-Moyo-CV-Senior-Product-Operations-Manager.pdf`, 510,619 bytes.
- `npm run audit` - passed.
- `npm run check-links` - passed, 80,815 internal links checked with no broken internal links.
- `npm test` - passed. Existing repo warnings remain in public-claim and automation audits, with no failures.

Not run:

- `npm run build` was not run in this scoped visual PR because the full build rewrites broad generated/cachebust outputs across the production checkout. The targeted source, browser, PDF, link, audit, and full `npm test` checks above were run instead.

## Acceptance Criteria

- CV Builder looks visibly more premium: passed.
- Above-the-fold section clearly explains the product: passed.
- Mobile layout is cleaner and easier to use: passed.
- Buttons, badges, forms, and cards follow the new design standard: passed.
- No CV logic regression observed: passed in browser smoke.
- No PDF/export regression observed: passed in PDF smoke.
- No console errors: passed in screenshot and PDF smoke runs.
