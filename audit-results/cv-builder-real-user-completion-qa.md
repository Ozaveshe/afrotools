# CV Builder Real-User Completion QA

Date: 2026-05-20
Route tested: `/tools/cv-builder/`
Local smoke URL: `http://127.0.0.1:4301/tools/cv-builder/`
Grade: Ready for controlled ad testing after one minor ATS Plain PDF follow-up

## Scope

This pass tested AfroTools CV Builder as a real African job seeker starting from zero. The focus was completion, confidence, mobile usability, export quality, and saved-state reliability. No template engine rebuild, data model change, or major feature change was made.

## Issue Fixed

| Severity | Issue | Fix | Files |
| --- | --- | --- | --- |
| High | Mobile graduate/no-experience users could get blocked on a blank Work Experience step before reaching Education and Skills. This made the basic CV completion path feel broken for users with no work history. | Added a small completion-flow patch that labels Work Experience as optional for graduates, allows a blank Work Experience step to advance to Education, and keeps visible mobile CV controls at 16px or larger. | `tools/cv-builder/index.html`, `tools/cv-builder/js/cv-completion-flow-fix.js` |

## Pass/Fail Table

| Flow | Template(s) | Result | Evidence |
| --- | --- | --- | --- |
| Graduate / No Experience | Accra Graduate | Pass | `audit-results/cv-builder-real-user-completion-qa-screens/graduate-desktop-filled.png`, `audit-results/cv-builder-real-user-completion-qa-pdfs/graduate-profile-Ama-Mensah-CV-Graduate-Data-Analyst.pdf` |
| Professional | Lagos Corporate, Nairobi Tech | Pass | `audit-results/cv-builder-real-user-completion-qa-screens/professional-lagos-preview.png`, `audit-results/cv-builder-real-user-completion-qa-screens/professional-after-template-switch-nairobi.png`, `audit-results/cv-builder-real-user-completion-qa-pdfs/professional-profile-Chinedu-Okafor-CV-Operations-Analyst.pdf` |
| Executive | Cape Town Executive | Pass | `audit-results/cv-builder-real-user-completion-qa-screens/executive-cape-town-preview.png`, `audit-results/cv-builder-real-user-completion-qa-pdfs/executive-profile-Thandi-Mokoena-CV-Chief-Operations-Officer.pdf` |
| Minimal CV | ATS Classic | Pass | `audit-results/cv-builder-real-user-completion-qa-screens/minimal-ats-classic-preview.png`, `audit-results/cv-builder-real-user-completion-qa-pdfs/minimal-profile-Amina-Otieno-CV-Entry-Level-Accountant.pdf` |
| Long content | Nairobi Tech | Pass | `audit-results/cv-builder-real-user-completion-qa-screens/long-content-nairobi-preview.png`, `audit-results/cv-builder-real-user-completion-qa-pdfs/long-content-profile-Brian-Kamau-CV-Senior-Product-Analyst.pdf` |
| Saved CV reload | Accra Graduate | Pass | `audit-results/cv-builder-real-user-completion-qa-screens/graduate-after-reload-saved.png` |
| ATS analysis | Lagos Corporate | Pass | `audit-results/cv-builder-real-user-completion-qa-screens/professional-ats-analysis.png` |
| Mobile completion | 360x800, 390x844, 414x896 | Pass | `audit-results/cv-builder-real-user-completion-qa-results.json` |

## Mobile QA

| Viewport | Overflow | Personal info | Education and skills | Preview modal | Template modal | Export drawer | Result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 360x800 | 0px | Pass | Pass | Pass | Pass | Pass | Pass |
| 390x844 | 0px | Pass | Pass | Pass | Pass | Pass | Pass |
| 414x896 | 0px | Pass | Pass | Pass | Pass | Pass | Pass |

Mobile screenshots:
- `audit-results/cv-builder-real-user-completion-qa-screens/mobile-360x800-personal.png`
- `audit-results/cv-builder-real-user-completion-qa-screens/mobile-360x800-education-skills.png`
- `audit-results/cv-builder-real-user-completion-qa-screens/mobile-360x800-preview.png`
- `audit-results/cv-builder-real-user-completion-qa-screens/mobile-360x800-template-modal.png`
- `audit-results/cv-builder-real-user-completion-qa-screens/mobile-360x800-export-drawer.png`
- `audit-results/cv-builder-real-user-completion-qa-screens/mobile-390x844-personal.png`
- `audit-results/cv-builder-real-user-completion-qa-screens/mobile-390x844-education-skills.png`
- `audit-results/cv-builder-real-user-completion-qa-screens/mobile-390x844-preview.png`
- `audit-results/cv-builder-real-user-completion-qa-screens/mobile-390x844-template-modal.png`
- `audit-results/cv-builder-real-user-completion-qa-screens/mobile-390x844-export-drawer.png`
- `audit-results/cv-builder-real-user-completion-qa-screens/mobile-414x896-personal.png`
- `audit-results/cv-builder-real-user-completion-qa-screens/mobile-414x896-education-skills.png`
- `audit-results/cv-builder-real-user-completion-qa-screens/mobile-414x896-preview.png`
- `audit-results/cv-builder-real-user-completion-qa-screens/mobile-414x896-template-modal.png`
- `audit-results/cv-builder-real-user-completion-qa-screens/mobile-414x896-export-drawer.png`

## PDF Output

| Profile | Template | PDF | Pages | Result |
| --- | --- | --- | --- | --- |
| Graduate | Accra Graduate | `audit-results/cv-builder-real-user-completion-qa-pdfs/graduate-profile-Ama-Mensah-CV-Graduate-Data-Analyst.pdf` | 1 | Pass |
| Professional | Lagos Corporate | `audit-results/cv-builder-real-user-completion-qa-pdfs/professional-profile-Chinedu-Okafor-CV-Operations-Analyst.pdf` | 1 | Pass |
| Executive | Cape Town Executive | `audit-results/cv-builder-real-user-completion-qa-pdfs/executive-profile-Thandi-Mokoena-CV-Chief-Operations-Officer.pdf` | 2 | Pass |
| Minimal | ATS Classic | `audit-results/cv-builder-real-user-completion-qa-pdfs/minimal-profile-Amina-Otieno-CV-Entry-Level-Accountant.pdf` | 1 | Pass |
| ATS Plain | ATS Classic | `audit-results/cv-builder-real-user-completion-qa-pdfs/minimal-profile-ats-plain-Amina-Otieno-CV-Entry-Level-Accountant-ATS.pdf` | parse warning | Downloaded |
| Long content | Nairobi Tech | `audit-results/cv-builder-real-user-completion-qa-pdfs/long-content-profile-Brian-Kamau-CV-Senior-Product-Analyst.pdf` | 1 | Pass |
| Post-fix smoke | ATS Classic | `audit-results/cv-builder-real-user-completion-qa-pdfs/post-fix-smoke-QA-Candidate-CV-Operations-Analyst.pdf` | 1 | Pass |

PDF checks passed for the main exported PDFs: no ugly blank second page, no cut-off sections, readable font sizes, professional margins, selected template reflected in output, and clean filename pattern. The ATS Plain PDF downloaded successfully, but `pdf-parse` could not read it because of a `bad XRef entry`; this is a minor follow-up for PDF structure/metadata, not a completion blocker.

## Saved State

Saved CV persistence was verified in the initial browser run and again in a post-fix reload smoke. Template switching after reload preserved CV data and updated the preview/export context.

## Browser Notes

- Cookie consent was dismissed during the browser QA setup before testing the CV flow.
- Browser console check: no CV app console error groups recorded.
- Horizontal overflow check: 0px in all tested mobile viewports.
- Sponsor zones remained outside the active editing form.

## Validation

| Command | Result | Notes |
| --- | --- | --- |
| `git diff --check` | Pass | No whitespace errors. |
| `npm run test:cv-template-registry` | Pass | 8 registered, 8 visible export-ready templates, 0 hidden. |
| `npm run pdf:verify` | Pass | PDF category workflow verification passed. |
| `npm test` | Pass | Existing repo-wide public-claim and automation warnings remain non-blocking; failures 0. |
| `npm run build` | Pass | Completed successfully. The build produced normal generated churn: minified assets, sitemap/feed updates, cachebusting, service-worker stamp, and generated redirect output. |
| Browser smoke | Pass | `/tools/cv-builder/` loaded locally, flows completed, PDFs exported. |
| Mobile smoke at 390x844 | Pass | No horizontal overflow, preview modal, template modal, and export drawer usable. |

Machine-readable evidence: `audit-results/cv-builder-real-user-completion-qa-results.json`

## Remaining Blockers Before Paid Ads

No critical blocker remains for controlled ad testing. Before scaling spend, fix the ATS Plain PDF parse warning so external PDF parsers can read it reliably, and do one more live-domain smoke after deploy because this QA was run against the local static server.
