# CV Builder Layout Decongestion QA

Date: 2026-05-20

## Scope

Target route: `/tools/cv-builder/`

This PR decongests the CV Builder shell without rebuilding the template engine, CV data model, autosave, ATS logic, or PDF generation pipeline.

## Changed Files

- `tools/cv-builder/index.html`
- `tools/cv-builder/css/cv-layout-decongestion.css`
- `tools/cv-builder/js/cv-layout-decongestion.js`
- `tools/cv-builder/js/cv-sponsors.js`
- `audit-results/cv-builder-layout-decongestion.md`
- `audit-results/cv-builder-layout-decongestion-screens/`

Build validation also refreshed generated/cachebusted site output across many HTML and sitemap files. Those generated changes came from `npm run build`, not manual product edits.

## Screenshots

Before:
- Desktop: `audit-results/cv-builder-layout-decongestion-screens/before-desktop.png`
- Mobile: `audit-results/cv-builder-layout-decongestion-screens/before-mobile.png`

After:
- Desktop builder empty state: `audit-results/cv-builder-layout-decongestion-screens/after-desktop-builder-empty.png`
- Desktop builder with sample data: `audit-results/cv-builder-layout-decongestion-screens/after-desktop-builder-filled.png`
- Desktop template drawer: `audit-results/cv-builder-layout-decongestion-screens/after-desktop-template-drawer.png`
- Mobile above fold: `audit-results/cv-builder-layout-decongestion-screens/after-mobile-above-fold.png`
- Mobile edit wizard: `audit-results/cv-builder-layout-decongestion-screens/after-mobile-edit.png`
- Mobile preview/export state: `audit-results/cv-builder-layout-decongestion-screens/after-mobile-preview-export.png`
- Mobile template modal: `audit-results/cv-builder-layout-decongestion-screens/after-mobile-template-modal.png`
- Post-build mobile edit: `audit-results/cv-builder-layout-decongestion-screens/post-build-mobile-edit.png`
- Post-build desktop template drawer: `audit-results/cv-builder-layout-decongestion-screens/post-build-desktop-template-drawer.png`
- Browser-exported sample PDF: `audit-results/cv-builder-layout-decongestion-screens/after-layout-export.pdf`

Smoke evidence:
- `audit-results/cv-builder-layout-decongestion-screens/after-smoke.json`
- `audit-results/cv-builder-layout-decongestion-screens/post-build-smoke.json`

## What Changed

- Replaced the crowded top action row with a compact CV toolbar: title, template selector, country selector, language selector, save status, PDF, and a More menu for secondary actions.
- Moved secondary actions into More: Print, Analyze, Advisor, Import CV, ATS score, Cover letter, and Saved CVs.
- Moved the template gallery out of the persistent preview column into a drawer/modal shell attached to `body`.
- Added a compact selected-template card in the preview panel so the user still knows which style is active.
- Preserved the accent color controls by moving them into the More menu instead of hiding them.
- Added mobile workspace modes: Edit, Preview, Templates, Analyze, Export.
- Reduced mobile sticky actions to Back, Preview, and Next.
- Added a polished preview empty state for low-data CVs.
- Moved after-score/sidebar sponsor zones into a below-builder “Helpful next steps” area so sponsored content is not beside the active editing form.

## Acceptance Checks

- Template gallery is now modal/drawer: Yes.
- Sponsor cards moved away from active editing column: Yes. `after-score` and `sidebar` zones mount in `.cv-helper-next-steps`; cover letter, job tracker, export, and footer sponsor zones remain in their contextual panels.
- Mobile horizontal overflow: No overflow detected at 390px.
- Preview empty state exists: Yes.
- Existing 8 templates remain selectable/export-ready: Yes, registry test still reports 8 visible export-ready templates.
- PDF export still callable: Yes, browser smoke called `CVExportUpgrade.exportPdf`.
- Console errors: None in browser smoke.

## Validation

- `git diff --check` - passed.
- `npm run test:cv-template-registry` - passed. Output: 8 registered, 8 visible export-ready templates, 0 hidden.
- `npm run pdf:verify` - passed.
- `npm test` - passed. Existing public-claim and automation evidence warnings printed, with 0 failures.
- `npm run build` - passed. Build refreshed generated/cachebusted output.
- Browser smoke on `/tools/cv-builder/` - passed.
- Mobile viewport smoke at 390x844 - passed.
- Post-build browser smoke - passed.

Post-build smoke summary:
- Mobile above fold overflow: false.
- Mobile template drawer width: 390px.
- Mobile sticky buttons: Back, Preview, Next.
- Desktop horizontal overflow: false.
- Template gallery parent: `BODY`.
- Visible sponsor in editor/sidebar: false.
- Console/page errors: none.

## Remaining Known Issues

- The mobile mode tabs intentionally use a compact horizontal strip to avoid a tall toolbar; a future PR could add icons if the design system standardizes them.
- The export options panel still lives in the preview/export context. It is no longer part of the editing form, but a future Export drawer could make this even calmer.
- The empty preview state preserves the real A4 preview underneath for parity; a future visual polish pass could replace the ghost A4 with a stronger sample CV thumbnail.
