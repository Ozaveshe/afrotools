# CV Builder Export, Empty Preview, and Mobile Polish QA

Date: 2026-05-20
Route: `/tools/cv-builder/`

## Scope

Focused polish pass only. This PR does not rebuild the template engine, change the CV data model, or change the PDF generation pipeline. The 8 export-ready templates, autosave, template switching, ATS analysis, Advisor, Import CV, Saved CVs, and existing export handlers remain wired.

## Changed Files

- `tools/cv-builder/index.html`
- `tools/cv-builder/css/cv-export-empty-polish.css`
- `tools/cv-builder/js/cv-export-empty-polish.js`
- `audit-results/cv-builder-export-empty-preview-polish-responsive-smoke.json`
- `audit-results/cv-builder-export-empty-preview-polish-postbuild-smoke.json`
- `audit-results/cv-builder-export-empty-preview-polish-screens/`

Note: the working tree already contained prior layout-decongestion files and generated/version-hash churn before this focused polish pass. This report separates the current polish layer from that existing checkout state.

## What Changed

### Empty Preview State

Before: low-data CVs still felt like a mostly blank A4 preview, which read as broken rather than intentional.

After: low-data CVs show a polished ghost CV card, clear guidance text, and a "Start with Personal Information" CTA. The actual A4 preview is hidden until enough user data exists, so the preview panel no longer feels empty or unfinished.

### Mobile Mode Tabs

Before: mobile mode tabs looked like a cramped strip.

After: the tabs have a stronger active state, pill styling, deliberate horizontal scrolling, clearer contrast, and stable touch sizing. Labels are not clipped in the tested mobile widths.

### Export Flow

Before: export options lived inside the preview/export context and competed with the preview.

After: export options open in a dedicated drawer/panel with the existing export actions and a non-blocking readiness checklist:

- name added
- email added
- professional title added
- at least one experience or education section
- selected template
- country format selected

The panel warns on incomplete CVs but does not block export. Existing export buttons remain the source of the actual PDF, print, ATS/plain, text, and backup actions where available.

### Template Drawer Polish

Before: the drawer could inherit an off-screen top offset on desktop and the mobile sticky action bar could sit above drawer content.

After: the drawer is pinned to the visible viewport, uses clearer max-width constraints, remains usable at desktop and mobile sizes, and hides the mobile bottom action bar while open.

### Sponsor Placement

Sponsor content remains out of the active editing form and is presented as "Helpful next steps" after the tool workflow or within non-editing contexts.

## Screenshots

- Desktop above/edit state: `audit-results/cv-builder-export-empty-preview-polish-screens/1440x900-edit-empty.png`
- Desktop template drawer: `audit-results/cv-builder-export-empty-preview-polish-screens/1440x900-template-drawer.png`
- Desktop export drawer: `audit-results/cv-builder-export-empty-preview-polish-screens/1440x900-export-drawer.png`
- Large desktop edit state: `audit-results/cv-builder-export-empty-preview-polish-screens/1920x1080-edit-empty.png`
- Large desktop export drawer: `audit-results/cv-builder-export-empty-preview-polish-screens/1920x1080-export-drawer.png`
- Mobile edit state: `audit-results/cv-builder-export-empty-preview-polish-screens/390x844-edit-empty.png`
- Mobile preview empty state: `audit-results/cv-builder-export-empty-preview-polish-screens/390x844-preview-empty.png`
- Mobile template drawer: `audit-results/cv-builder-export-empty-preview-polish-screens/390x844-template-drawer.png`
- Mobile export drawer: `audit-results/cv-builder-export-empty-preview-polish-screens/390x844-export-drawer.png`
- Small mobile export drawer: `audit-results/cv-builder-export-empty-preview-polish-screens/360x800-export-drawer.png`
- Tablet template drawer: `audit-results/cv-builder-export-empty-preview-polish-screens/768x1024-template-drawer.png`

## Responsive QA Notes

Browser smoke source: `audit-results/cv-builder-export-empty-preview-polish-responsive-smoke.json`

| Viewport | Overflow | Toolbar overlap | Template drawer | Export panel | Console errors |
| --- | --- | --- | --- | --- | --- |
| 360 x 800 | Pass | Pass | Pass | Pass | 0 |
| 390 x 844 | Pass | Pass | Pass | Pass | 0 |
| 414 x 896 | Pass | Pass | Pass | Pass | 0 |
| 768 x 1024 | Pass | Pass | Pass | Pass | 0 |
| 1024 x 768 | Pass | Pass | Pass | Pass | 0 |
| 1366 x 768 | Pass | Pass | Pass | Pass | 0 |
| 1440 x 900 | Pass | Pass | Pass | Pass | 0 |
| 1920 x 1080 | Pass | Pass | Pass | Pass | 0 |

Additional checks from the browser smoke:

- Empty preview polish detected in every tested viewport.
- Sponsor zones were not found inside the active form panel.
- Mobile bottom action bar is visible in edit mode and hidden while template/export drawers are open.
- Export drawer includes the readiness checklist and existing export actions.

## Export Flow Notes

- The top-level `PDF` action now opens the export panel first, reducing accidental export and giving users a final readiness check.
- The primary export button inside the drawer still uses the existing `data-cv-export="pdf"` export handler.
- The drawer is non-blocking: incomplete CVs show warnings, but export remains available.
- No PDF rendering or pagination logic was changed in this pass.

## Remaining Blockers Before Ads

- Full ad-readiness still depends on validating real user sample flows from blank CV to exported PDF after the broader generated/build output is settled.
- The readiness checklist is intentionally lightweight and does not replace ATS/job-match analysis.
- The export drawer is now visually usable, but a later PR could add richer filename preview and post-export next-step messaging.
- Template engine, PDF engine, and data model were intentionally left unchanged in this pass.

## Validation

Completed:

- `git diff --check` - passed before and after build.
- `npm run test:cv-template-registry` - passed; 8 registered, 8 visible export-ready templates, 0 hidden.
- `npm run pdf:verify` - passed; PDF category and document workflow verification passed.
- `npm test` - passed. Public-claims and automation audits emitted existing warnings, with 0 failures.
- `npm run build` - passed. Build generated the expected cachebust/minify/sitemap/service-worker output.
- Browser responsive smoke on `/tools/cv-builder/` - passed for all requested viewports.
- Post-build browser smoke on `390x844` and `1440x900` - passed.
- Console error check - 0 browser console errors in the responsive and post-build smokes.
- Horizontal overflow check - passed across all requested viewports.
