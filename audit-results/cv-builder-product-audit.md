# CV Builder Product Audit

Date: 2026-05-20

Route audited: `/tools/cv-builder/`

Local URL used: `http://127.0.0.1:4182/tools/cv-builder/`

Scope: audit only. No product rebuild or visual code changes were made.

## Screenshot Evidence

| State | Screenshot |
| --- | --- |
| Desktop above the fold | `audit-results/cv-builder-screenshots/01-desktop-above-fold.png` |
| Desktop editor state | `audit-results/cv-builder-screenshots/02-desktop-editor-state.png` |
| Desktop preview state | `audit-results/cv-builder-screenshots/03-desktop-preview-state.png` |
| Mobile above the fold | `audit-results/cv-builder-screenshots/04-mobile-above-fold.png` |
| Mobile form state | `audit-results/cv-builder-screenshots/05-mobile-form-state.png` |
| Mobile preview/export state | `audit-results/cv-builder-screenshots/06-mobile-preview-export-state.png` |
| Empty state | `audit-results/cv-builder-screenshots/07-empty-state.png` |
| Saved CV state | `audit-results/cv-builder-screenshots/08-saved-cv-state.png` |
| ATS scoring state | `audit-results/cv-builder-screenshots/09-ats-scoring-state.png` |
| Cover letter state | `audit-results/cv-builder-screenshots/10-cover-letter-state.png` |
| Template selection state | `audit-results/cv-builder-screenshots/11-template-selection-state.png` |

Detailed browser evidence is in `audit-results/cv-builder-product-audit-evidence.json`.

## Current Product Summary

The CV Builder is not a thin page. It has a real editor, live preview, 22 templates, country-aware fields, local saves, version snapshots, PDF export, ATS scoring, job-description matching, AI summary and bullet tooling, cover letter modal, LinkedIn kit, and a local job tracker.

The problem is not capability. The problem is product packaging, discoverability, mobile ergonomics, and claim trust. As a flagship product for paid acquisition, it currently feels like a powerful internal workbench that has been compressed into the first viewport, not a guided resume-builder journey.

## Severity-Ranked Issues

### Critical

1. Hidden advanced controls make advertised features unreachable from the main desktop toolbar.

- Evidence: desktop browser metrics showed `Import`, `ATS`, `Cover Letter`, and `History` in the DOM but `display:none`.
- User impact: paid traffic sees claims for import, ATS, cover letter, and saved versions, but the obvious controls are not available. This is a conversion and trust break.
- Files/components: `tools/cv-builder/index.html`, `tools/cv-builder/css/cv-career-copilot-compact.css`, `tools/cv-builder/js/cv-advanced.js`, `tools/cv-builder/js/cv-career-copilot.js`.
- Screenshot: `audit-results/cv-builder-screenshots/01-desktop-above-fold.png`.

2. Mobile editing and export are not mobile-first enough for social ad traffic.

- Evidence: at `390x844`, `scrollWidth` was `403` against `innerWidth` `390`. The mobile action bar rendered thousands of pixels below the editing viewport instead of staying available. In captured states, action bar top positions included `6402`, `5260`, and `1743`.
- User impact: TikTok, Instagram, Facebook, and student-community users will struggle to preview, export, or use advanced tools on phones.
- Files/components: `tools/cv-builder/css/cv-builder.css`, `tools/cv-builder/css/cv-career-copilot-compact.css`, `.cv-action-bar`, `.cv-copilot-workflow`, `.cv-toolbar`.
- Screenshots: `audit-results/cv-builder-screenshots/04-mobile-above-fold.png`, `audit-results/cv-builder-screenshots/06-mobile-preview-export-state.png`.

3. Public copy overstates country coverage and source confidence.

- Evidence: page copy claims all 54 African countries, but the country selector exposes 27 options, with generic `Other African` fallback. Country rules are hard-coded in `COUNTRY_NORMS`, not surfaced with source dates or verification notes.
- User impact: the Africa-first promise becomes fragile under scrutiny, especially for Google Search and LinkedIn audiences.
- Files/components: `tools/cv-builder/index.html`, `tools/cv-builder/js/cv-data.js`, `tools/cv-builder/js/cv-ai.js`, `netlify/functions/ai-advisor.js`.
- Screenshots: `audit-results/cv-builder-screenshots/01-desktop-above-fold.png`, `audit-results/cv-builder-screenshots/07-empty-state.png`.

### High

4. The first viewport has no guided onboarding, despite competitor expectations.

- Evidence: users land directly in a dense cockpit plus form/preview split. There is no clear "start here" journey for country, role, experience level, template family, and target job.
- User impact: users from ads get power before clarity. That raises bounce risk even though the product has strong features.
- Files/components: `tools/cv-builder/index.html`, `tools/cv-builder/js/cv-app.js`, `tools/cv-builder/js/cv-career-copilot.js`.
- Screenshots: `audit-results/cv-builder-screenshots/01-desktop-above-fold.png`, `audit-results/cv-builder-screenshots/04-mobile-above-fold.png`.

5. Template selection exists, but it is not a modern template gallery.

- Evidence: 22 templates render as a horizontal selector with mini thumbnails. It is functional, but not comparable to major resume builders that show larger visual previews, use-case filters, and template confidence labels.
- User impact: users cannot easily choose based on industry, ATS friendliness, graduate use, or country convention.
- Files/components: `tools/cv-builder/js/cv-data.js`, `tools/cv-builder/js/cv-template-studio.js`, `tools/cv-builder/css/cv-template-studio.css`, `.cv-preview-top`.
- Screenshot: `audit-results/cv-builder-screenshots/11-template-selection-state.png`.

6. The privacy and paywall story is unclear.

- Evidence: the page says free/no sign-up in SEO copy, but PDF export is intercepted by `email-gate-modal` if no lead email is present. Local save, browser-only preview, account sync, AI calls, and email capture are not explained together at the point of action.
- User impact: "free" can feel like a hidden gate. For CV data, privacy clarity is a core conversion requirement.
- Files/components: `tools/cv-builder/index.html`, `assets/js/lib/pdf-download-gate.js`, `tools/cv-builder/js/cv-workspace-sync.js`, `assets/js/lib/workspace-sync.js`.
- Screenshots: `audit-results/cv-builder-screenshots/03-desktop-preview-state.png`, `audit-results/cv-builder-screenshots/06-mobile-preview-export-state.png`.

7. Empty state is too blank for a flagship resume builder.

- Evidence: empty state drops users into blank fields and an empty preview. It does not offer a starter path, sample data, target role presets, import prompt, or "start from graduate/experienced" shortcut.
- User impact: new users must understand the whole tool before receiving value.
- Files/components: `tools/cv-builder/js/cv-app.js`, `tools/cv-builder/js/cv-career-copilot.js`.
- Screenshot: `audit-results/cv-builder-screenshots/07-empty-state.png`.

### Medium

8. ATS and job matching are real, but the labeling is too strong for the implementation.

- Evidence: ATS score is a local checklist and heuristic scoring system in `cv-advanced.js` and `cv-career-copilot.js`. It is useful, but not a real ATS parser certification.
- User impact: users may over-trust the score. SEO and ads should avoid implying guaranteed applicant tracking system compatibility.
- Files/components: `tools/cv-builder/js/cv-advanced.js`, `tools/cv-builder/js/cv-career-copilot.js`, `tools/cv-builder/index.html`.
- Screenshot: `audit-results/cv-builder-screenshots/09-ats-scoring-state.png`.

9. Saved CVs work, but saved versions are not positioned as a first-class product feature.

- Evidence: saved CV cards render when `afro_cv_list` exists, and snapshots live in `afro_cv_versions`. The UX does not clearly explain device-only saves versus account-backed workspace sync.
- User impact: users may not understand whether a CV is safe across devices, especially after coming back later from an ad or community link.
- Files/components: `tools/cv-builder/js/cv-app.js`, `tools/cv-builder/js/cv-workspace-sync.js`, `assets/js/lib/workspace-sync.js`.
- Screenshot: `audit-results/cv-builder-screenshots/08-saved-cv-state.png`.

10. Cover letter builder exists, but it is buried behind a hidden control.

- Evidence: the modal can be opened programmatically and is functional as a form shell, but the desktop toolbar action is hidden and mobile has no visible Cover Letter access.
- User impact: a competitor-parity feature is effectively invisible in normal use.
- Files/components: `tools/cv-builder/js/cv-advanced.js`, `tools/cv-builder/css/cv-career-copilot-compact.css`.
- Screenshot: `audit-results/cv-builder-screenshots/10-cover-letter-state.png`.

11. Growth and analytics events are too thin for paid acquisition learning.

- Evidence: `cv-app.js` fires `page_view`, `template_selected`, `cv_downloaded`, and `cv-ai.js` fires `ai_analysis_used`. There is no clear funnel for onboarding started, target role added, ATS modal opened, cover letter started, saved CV created, export gated, export completed, or job lead saved.
- User impact: paid channels cannot be optimized beyond shallow traffic and download signals.
- Files/components: `tools/cv-builder/js/cv-app.js`, `tools/cv-builder/js/cv-ai.js`, `tools/cv-builder/js/cv-career-copilot.js`.

### Low

12. The visual language still leans on emoji and dense controls.

- Evidence: toolbar and section labels use emoji-first controls. This is understandable, but weaker than a polished flagship UI using the existing design-system icon/control patterns.
- User impact: product feels less premium than the feature set.
- Files/components: `tools/cv-builder/index.html`, `tools/cv-builder/js/cv-app.js`, `tools/cv-builder/css/cv-builder.css`.

13. SEO is structurally clean but not fully product-truth aligned.

- Evidence: canonical, title, description, OG, schema, and hreflang are present. `npm run seo:report` stayed clean in the prior audit pass. The weakness is wording: AI score, all-country support, and no-sign-up/free export claims need product-truth cleanup.
- Files/components: `tools/cv-builder/index.html`, `assets/js/components/tool-registry.js`.

## Competitor Expectation Check

| Expectation | Current state | Verdict |
| --- | --- | --- |
| Modern template gallery | 22 templates with mini selectors, not a gallery | Partial |
| Guided onboarding | No guided first-run flow | Missing |
| Live preview | Live A4 preview works | Strong |
| ATS score | Local ATS simulator/checklist works | Partial, relabel needed |
| Job-description matching | Career cockpit supports role/JD matching | Strong but dense |
| AI bullet improvement | Achievement lab and bullet rewrite exist | Partial, hidden in cockpit |
| Cover letter builder | Modal exists | Implemented but hidden |
| LinkedIn profile helper | LinkedIn kit exists | Implemented but buried |
| Saved versions | Local saved CVs and version snapshots exist | Partial, trust copy needed |
| Export PDF | PDF export works after email gate state | Functional, copy/gate mismatch |
| Mobile-first editing | Mobile layout works but overflows and action bar is not sticky | Weak |
| Trust signals | Some privacy/local behavior exists, not clearly messaged | Weak |
| No hidden paywall | No paywall found, but email gate conflicts with "no sign-up" feel | Needs clarity |
| Clear privacy message | No concise CV-data privacy message in primary workflow | Missing |

## Exact Files, Routes, And Components Involved

- Route: `tools/cv-builder/index.html`
- Registry: `assets/js/components/tool-registry.js`, `cv-builder` row currently advertises premium templates
- Country rules and template data: `tools/cv-builder/js/cv-data.js`
- Main app, save logic, PDF export, analytics: `tools/cv-builder/js/cv-app.js`
- ATS, import, cover letter, version history: `tools/cv-builder/js/cv-advanced.js`
- Job match, achievement lab, LinkedIn kit, job tracker: `tools/cv-builder/js/cv-career-copilot.js`
- AI adviser and rewrite paths: `tools/cv-builder/js/cv-ai.js`, `netlify/functions/ai-advisor.js`
- Template rendering: `tools/cv-builder/js/cv-templates.js`, `tools/cv-builder/js/cv-template-studio.js`
- Workspace sync: `tools/cv-builder/js/cv-workspace-sync.js`, `assets/js/lib/workspace-sync.js`
- Primary styling: `tools/cv-builder/css/cv-builder.css`
- Career cockpit styling: `tools/cv-builder/css/cv-career-copilot.css`, `tools/cv-builder/css/cv-career-copilot-compact.css`
- Template styling: `tools/cv-builder/css/cv-template-studio.css`
- Download gate: `assets/js/lib/pdf-download-gate.js`, `email-gate-modal` usage in `tools/cv-builder/index.html`

## Recommended PR Sequence

### PR 1 - Restore Discoverability And Mobile Actions

Goal: make existing features reachable without redesigning the product.

Acceptance criteria:

- At desktop `1440x900`, users can reach Import, ATS, Cover Letter, and History from visible controls or one visible More menu.
- At mobile `390x844`, users can reach Import, ATS, Cover Letter, History, Save, Preview, and PDF without horizontal overflow.
- `.cv-action-bar` is sticky or otherwise available during editing and preview.
- Playwright proof includes desktop and mobile screenshots for advanced-menu access.
- No existing CV editing, preview, save, PDF, or cockpit features are removed.

### PR 2 - Truth, Trust, And Privacy Cleanup

Goal: make ads, SEO, and product copy match implementation.

Acceptance criteria:

- Replace "all 54 African countries" with accurate wording such as country profiles plus generic African fallback unless 54 explicit rules are added.
- Clarify free PDF export versus email capture, using plain language before the PDF click.
- Add a concise CV privacy panel covering browser-local drafts, AI requests, email gate, account sync, and what is not uploaded by default.
- Relabel ATS as a readiness check/simulator unless a real parser/export proof is added.
- Registry revenue copy no longer conflicts with free export page copy.
- `npm run seo:report` remains clean.

### PR 3 - Guided First-Run Flow

Goal: turn the first viewport into an advertisable product journey.

Acceptance criteria:

- New users see a clear start path: country, target role, experience level, template direction, and import/manual choice.
- Empty state offers starter samples, role presets, and a visible import path.
- Returning users still see saved CVs and can continue quickly.
- First-run flow works without sign-in.
- Browser screenshots prove desktop, mobile, empty state, and saved state.

### PR 4 - Template Gallery Upgrade

Goal: make template selection competitor-grade.

Acceptance criteria:

- Template picker shows larger previews or a gallery mode with filters for ATS, graduate, executive, tech, finance, public sector, diaspora, and country-specific templates.
- Each template has a clear best-for label and warns where a template includes photo/personal details.
- Mobile template selection does not create horizontal page overflow.
- Existing 22 templates remain available.

### PR 5 - ATS And Job Match Report Upgrade

Goal: make scoring more useful and more honest.

Acceptance criteria:

- ATS report separates parsing readiness, keyword match, formatting risks, and country-specific checks.
- Job-description matching includes matched keywords, missing keywords, evidence gaps, and suggested truthful edits.
- "Add true gaps to skills" requires confirmation and does not silently add unsupported skills.
- Scores include explanation and limitations.
- Analytics fire for ATS opened, JD pasted, match scored, recommendation applied, and report copied/exported.

### PR 6 - Export, Saved Versions, And Application Pack

Goal: make the CV Builder a full application workspace.

Acceptance criteria:

- Saved CVs and versions clearly show local-only versus account-synced status.
- PDF export, cover letter export, LinkedIn kit export, and application pack export are grouped into one clear export surface.
- Export gate messaging is explicit and does not feel like a hidden paywall.
- Job tracker can attach a saved CV/version to a target role.
- Browser proof covers saved CV, version history, cover letter, LinkedIn kit, job tracker, and PDF export.

## Validation Run

- Started a local static server with `npx http-server . -p 4182 -c-1 --silent`.
- Captured all requested screenshots with Playwright.
- Desktop viewport: `1440x900`.
- Mobile viewport: `390x844`.
- No browser console errors were recorded in the screenshot evidence run.
- Evidence JSON: `audit-results/cv-builder-product-audit-evidence.json`.
