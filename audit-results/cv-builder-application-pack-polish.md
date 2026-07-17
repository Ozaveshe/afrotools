# CV Builder Application Pack Polish

Date: 2026-05-21

## Scope

Focused polish for the `/tools/cv-builder/` Application Pack section after the live UI showed an oversized, blank-heavy generator area.

## What Changed

- Reframed the Application Pack as a compact asset studio instead of a tall stacked form.
- Added an advisor strip with:
  - `Run checklist`
  - `Open AI Advisor`
- Wired advisor actions to existing `CVApp.aiAnalyzeCV()` and `CVApp.aiOpenChat()` hooks.
- Moved generated outputs into a single active output panel with compact output tabs.
- Added empty-state guidance for each asset type.
- Relocated the `cover-letter` sponsor zone after the studio so it no longer sits inside the active Cover Letter output.
- Cleaned the setup/action column so the job description and action buttons do not overlap.

## Screenshots

- Desktop Application Pack: `audit-results/cv-builder-application-pack-polish/desktop-application-pack-polish.png`
- Desktop AI Advisor open: `audit-results/cv-builder-application-pack-polish/desktop-ai-advisor-open.png`
- Mobile 390px Application Pack: `audit-results/cv-builder-application-pack-polish/mobile-390-application-pack-polish.png`

## Browser Smoke Results

- Desktop panel height: `498px`
- Body height: `400px`
- Cover letter generated text length: `610`
- Sponsor inside active output: `false`
- Sponsor relocated after panel: `true`
- AI Advisor script loaded: `true`
- AI Advisor panel opened: `true`
- Desktop horizontal overflow: `0`
- Mobile panel height at 390px: `592px`
- Mobile horizontal overflow: `0`
- Mobile minimum visible control font size: `16px`
- Mobile small touch targets: `0`
- Console errors: `0`

## Validation

- `node --check tools\cv-builder\js\cv-application-pack-polish.js`
- `npm run test:cv-template-registry`
- `npm run pdf:verify`
- Browser smoke on `/tools/cv-builder/`
- Mobile smoke at `390x844`

## Remaining Notes

- This is a local/source fix. It still needs normal deploy-preview smoke before claiming production is fixed.
- The Application Pack is still below the AI Career Cockpit; a later workflow PR could make it a dedicated workspace mode if the page still feels too long after live review.
