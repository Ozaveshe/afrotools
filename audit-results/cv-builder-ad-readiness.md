# AfroTools CV Builder Ad-Readiness QA

Date: 2026-05-20
Route: `/tools/cv-builder/`
Grade: **Ready with minor fixes**

## Bottom Line

The CV Builder is strong enough for controlled ad testing. The first screen clearly sells the value proposition, the editor now feels like a real CV workspace, and the full zero-to-export journey worked in browser testing. I found **no critical blocker** after one tiny analytics fix to the PDF-quality export path.

Do not scale broad paid traffic yet without the minor fixes below. The mobile experience is good, but not yet excellent because the sticky wizard actions are visible while the user is still on the hero, and the mobile preview opens at template/export controls before the A4 paper. Accessibility also needs a cleanup pass for unlabeled generated controls.

## Evidence

### Screenshots

| State | Screenshot |
| --- | --- |
| Desktop landing | `audit-results/cv-builder-ad-readiness-screenshots/desktop-landing.png` |
| Desktop editor and preview | `audit-results/cv-builder-ad-readiness-screenshots/desktop-editor.png` |
| Desktop preview viewport | `audit-results/cv-builder-ad-readiness-screenshots/desktop-preview.png` |
| Saved CV state | `audit-results/cv-builder-ad-readiness-screenshots/saved-cv-state.png` |
| Template selection | `audit-results/cv-builder-ad-readiness-screenshots/template-selection.png` |
| Import modal | `audit-results/cv-builder-ad-readiness-screenshots/import-modal.png` |
| ATS scoring | `audit-results/cv-builder-ad-readiness-screenshots/ats-scoring.png` |
| Application Pack | `audit-results/cv-builder-ad-readiness-screenshots/application-pack.png` |
| Plain ATS export | `audit-results/cv-builder-ad-readiness-screenshots/plain-ats-export.png` |
| PDF export state | `audit-results/cv-builder-ad-readiness-screenshots/pdf-export-state.png` |
| Job tracker | `audit-results/cv-builder-ad-readiness-screenshots/job-tracker.png` |
| Mobile landing | `audit-results/cv-builder-ad-readiness-screenshots/mobile-landing.png` |
| Mobile form | `audit-results/cv-builder-ad-readiness-screenshots/mobile-form.png` |
| Mobile preview/export | `audit-results/cv-builder-ad-readiness-screenshots/mobile-preview-export.png` |

Additional evidence:

- Browser journey evidence: `audit-results/cv-builder-ad-readiness-evidence.json`
- PDF analytics re-smoke: `audit-results/cv-builder-pdf-analytics-smoke.json`
- Saved PDF artifact: `audit-results/cv-builder-ad-readiness-screenshots/Jane-Doe-CV-Target-Role.pdf`

## QA Results

| Area | Result | Evidence |
| --- | --- | --- |
| Desktop visual quality | Pass | Premium hero, strong CTA, app workspace, preview, template gallery, and sponsor zones are visually coherent. |
| Mobile visual quality | Pass with minor fixes | No horizontal overflow. Sticky actions appear too early on the hero and mobile preview starts at controls rather than the A4 paper. |
| Page speed | Pass | Local smoke: DOMContentLoaded 165 ms, load 893 ms, 67 resources, about 2.0 MB resource transfer. Needs Lighthouse on deploy preview before major spend. |
| Accessibility | Pass with minor fixes | 1 H1, no missing image alt in smoke. Heuristic found unlabeled copilot inputs, country override checkboxes, month fields, and export checkboxes. |
| Form completion | Pass | Filled personal, summary, experience, education, and skills from zero. |
| Autosave | Pass | `localStorage.afro_cv_data` updated after form entry. |
| Saved CV switching | Pass | Saved CV reloaded after starting a new CV. |
| Import | Pass | Paste import parsed sections, showed review, and populated fields after confirmation. |
| Template switching | Pass | Data persisted while switching to another template. |
| ATS score | Pass | ATS score modal generated score cards and checklist. |
| Job matching | Pass | Job description generated match score, missing keyword chips, matched skills, and suggestions. |
| Cover letter | Pass | Application Pack generated cover letter text. |
| LinkedIn kit | Pass | Application Pack generated LinkedIn headline/About output. |
| PDF export | Pass | Downloaded `Jane-Doe-CV-Target-Role.pdf`, 80,522 bytes, valid EOF, 1 page in smoke. |
| Plain ATS export | Pass | Generated editable plain text and downloaded `Jane-Doe-CV-Target-Role-ATS.txt`. |
| Job tracker | Pass | Manual job saved to local job pipeline. |
| Privacy message | Pass | Browser-local save message visible. |
| Sponsor labels | Pass | 15 visible sponsored labels detected; sponsor copy avoids fake partner logos. |
| Analytics | Pass after tiny fix | Required event coverage passed except PDF in first run; patched `cv-export-pdf-quality.js`, focused re-smoke confirmed `cv_pdf_exported`. |
| SEO metadata | Pass | Title, description, canonical, H1, and useful below-app content present. |
| Schema | Pass | 4 JSON-LD blocks parsed: `SoftwareApplication`, `WebPage`, `BreadcrumbList`, `FAQPage`. |
| Broken links | Pass | `npm run check-links` found no broken internal links across 8,524 HTML files and 80,814 internal links. |
| Console errors | Pass | No page errors or console errors in the main browser journey. |

## Remaining Blockers

### High

None found.

### Medium

1. **Mobile sticky actions appear on the landing hero.**
   Users see Back, Preview, Save, and Next before they have reached the editor. This makes the mobile hero feel slightly app-internal too soon.
   - Files: `tools/cv-builder/js/cv-workspace-enhancer.js`, `tools/cv-builder/css/cv-builder-workspace.css`
   - Fix: Hide `.cv-action-bar` until the user enters or scrolls to `.cv-app`, or anchor "Build My CV" directly into the first wizard step.

2. **Mobile preview opens at template/export controls, not the CV paper.**
   The preview action works, but the first mobile viewport shows template gallery and export controls. A job seeker expects to see the CV preview first.
   - Files: `tools/cv-builder/js/cv-workspace-enhancer.js`, `tools/cv-builder/css/cv-builder-workspace.css`, `tools/cv-builder/css/cv-export-upgrade.css`
   - Fix: In mobile preview mode, put A4 preview first and collapse template/export controls behind tabs or accordions.

3. **Accessibility labels need a cleanup pass.**
   Generated inputs and checkboxes rely on visual labels that are not always programmatically connected.
   - Files: `tools/cv-builder/js/cv-career-copilot.js`, `tools/cv-builder/js/cv-country-rules.js`, `tools/cv-builder/js/cv-app.js`, `tools/cv-builder/js/cv-export-upgrade.js`
   - Fix: Add explicit `aria-label`, `aria-labelledby`, or real `<label for>` wiring.

### Low

1. Inline SEO footer links are smaller than ideal mobile tap targets. They are not blocking, but paid social users will be on mobile.
2. The page is resource-heavy for a free tool. It still loads quickly locally, but a deploy-preview Lighthouse run should be done before large campaign spend.
3. The PDF smoke covered a one-page CV. Run a multi-page export matrix before claiming all templates are print-perfect.

## Grade Rationale

**Ready with minor fixes** is the right grade.

Why not "Ready for ads": mobile has two visible polish issues and accessibility labels need cleanup.

Why not "Not ready": the actual product journey works end to end, PDF export works, no console errors appeared, SEO/schema are healthy, sponsor labels are present, and the page looks much stronger than a raw form.

## Design Enforcement Standard

Use this as the post-coding visual QA gate for the next CV Builder PRs.

The CV Builder should feel like a **modern African SaaS product**, not a childish template toy and not an ugly government form. Every new UI change should preserve:

- Clean white or soft neutral backgrounds.
- Dark readable text with strong contrast.
- Strong green and blue accents for important actions and success states.
- Card-based layout with generous spacing.
- Premium shadows used sparingly for hierarchy.
- Clear primary and secondary buttons.
- Sticky actions where they help completion, especially on mobile.
- A real product-dashboard feeling across editor, preview, scoring, application pack, and tracker surfaces.

Avoid in future implementation:

- Cramped controls.
- Pale unreadable badges.
- Too many buttons in one row.
- Low-quality gradients.
- Random decorative icons.
- Walls of text inside the active app workspace.
- Tiny mobile fields.
- Templates that look like old Word defaults.

Acceptance criteria for the next coding pass:

- Mobile first screen and editor pass a visual QA screenshot review before final sign-off.
- Primary action is always visually dominant and obvious.
- Important states such as ATS score, save state, export readiness, and sponsor labels use high-contrast badges.
- Toolbars wrap or collapse cleanly instead of compressing controls.
- Preview and templates look intentionally designed, not like generic document placeholders.

## Suggested Ad Angles

1. Free African CV Builder with no watermark.
2. Build a CV, cover letter, LinkedIn profile, and job tracker in one place.
3. ATS score and job match before you apply.
4. Country-aware CV guidance for Nigeria, Kenya, South Africa, Ghana, Egypt, Morocco, Ethiopia, and more.
5. Graduate CV builder for students with little or no experience.
6. Diaspora CV format for international applications.
7. Import your old CV and improve it.
8. Download PDF free, save locally, edit anytime.

## Suggested Landing Page Copy

Headline: **Free CV Builder for African Job Seekers**

Subheadline: **Create a country-aware, ATS-ready CV with cover letter, LinkedIn profile, and job tracker. Download PDF free, no watermark.**

CTA: **Build My CV**

Secondary CTA: **Import Existing CV**

Trust line: **Made for 54 African countries. Saved in your browser. No watermark PDF.**

## First 10 Social Posts

1. Need a CV today? Build a free, ATS-ready African CV and download the PDF with no watermark.
2. Nigerian CV? Kenyan CV? South African CV? Pick your country and get safer format guidance before you apply.
3. Graduating soon? Start with a no-experience CV template and turn projects, skills, and education into job-ready proof.
4. Paste a job description and see what your CV is missing before you send it.
5. Your CV should not stop at a PDF. Generate a cover letter, LinkedIn headline, recruiter message, and job tracker in one place.
6. Applying abroad? Use the diaspora/international CV path: no photo, no date of birth, no marital status, cleaner ATS format.
7. Import your old CV, review the extracted sections, and rebuild it into a cleaner AfroTools template.
8. The job hunt is messy. Track saved, applied, interview, offer, and follow-up stages inside the CV Builder.
9. Free means free: build, preview, save locally, and export PDF without a watermark.
10. Before you apply, check your ATS readiness, missing evidence, formatting risks, and next actions.

## First 5 Video Hooks

1. "Stop sending the same CV to every job. Watch this free tool match your CV to the job description."
2. "I built a Nigerian-ready CV, cover letter, LinkedIn headline, and job tracker in one place."
3. "If you are a graduate with no experience, start your CV like this."
4. "Before you upload your CV to a job portal, check these ATS risks."
5. "Applying from Africa to international jobs? Remove these risky details first."

## Recommended Next PRs

1. Mobile polish PR: hide wizard actions until app entry, make preview modal start with A4 preview, and keep export controls below.
2. Accessibility PR: label generated inputs, month fields, checkboxes, and copilot fields.
3. PDF matrix PR: run one-page, two-page, photo, no-photo, ATS-simple, and creative templates through PDF export screenshots.
4. Performance PR: lazy-load deeper CV modules after app entry while preserving SEO content and first-screen speed.
5. Campaign instrumentation PR: mark `cv_builder_started`, `cv_saved`, `cv_pdf_exported`, and `cv_job_match_generated` as campaign funnel events in the analytics dashboard.
