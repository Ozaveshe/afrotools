# CV Template Quality Scorecard

Date: 2026-05-20
Route: `/tools/cv-builder/`
Scope: Visible CV Builder templates backed by `tools/cv-builder/js/cv-template-registry.js`, rendered through `tools/cv-builder/js/cv-pdf-templates.js`, and exported through the current CV PDF export flow.

## Executive Summary

The app currently exposes 8 selectable, export-ready templates. All 8 have production renderers, preview classes, print classes, and successful PDF export evidence. No visible template is broken enough to hide from the gallery in this pass.

Decision:

- Keep all 8 visible.
- Keep `NGO Development` and `Creative Portfolio` visible only with their current ATS caution messaging.
- No template needs to be hidden or marked beta today.
- The gallery count remains honest at `8 export-ready templates`.

## Evidence

Generated evidence folder:

`audit-results/cv-template-quality-scorecard-assets/`

Evidence files:

- `quality-evidence.json`
- `ats-classic-desktop-preview.png`
- `lagos-corporate-desktop-preview.png`
- `nairobi-tech-desktop-preview.png`
- `accra-graduate-desktop-preview.png`
- `cape-town-executive-desktop-preview.png`
- `ngo-development-desktop-preview.png`
- `diaspora-international-desktop-preview.png`
- `creative-portfolio-desktop-preview.png`
- `mobile-preview-ats-classic.png`
- `ats-classic.pdf`
- `lagos-corporate.pdf`
- `nairobi-tech.pdf`
- `accra-graduate.pdf`
- `cape-town-executive.pdf`
- `ngo-development.pdf`
- `diaspora-international.pdf`
- `creative-portfolio.pdf`

Browser/export smoke result:

- Visible templates tested: 8
- Console errors: 0
- Page errors: 0
- PDFs exported: 8
- Preview overflow flags: 0

Note: current PDF output is image-based, so `pdf-parse` reports `textLength: 0`. That is expected for this export path and was not used as a failure for visual PDF quality. ATS Plain PDF/text export should remain the preferred machine-readable format.

## Scoring System

Each category is scored from 1 to 10.

Grades:

- `Ready`: 82 to 100, no critical PDF/export or preview blockers.
- `Needs minor fixes`: 70 to 81, usable and export-ready, but needs polish before being treated as a flagship template.
- `Not ad-ready`: 60 to 69, should be marked beta before public promotion.
- `Hide from gallery`: below 60, or any critical broken preview/export issue.

Required gate:

- Any template with broken preview, missing renderer, missing print class, failed PDF export, or visible content cutoff must be `hidden` or `beta`.
- Any template with `atsFriendly: false` must show an ATS caution in the gallery/modal.
- Gallery copy must count only visible templates with production renderers.

## Score Summary

| Template | Visual polish | ATS safety | Mobile preview | PDF quality | A4 breaks | One-page | Two-page | Section coverage | Missing data | Long content | Total | Grade | Gallery action |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|---|
| ATS Classic | 8 | 10 | 8 | 9 | 8 | 7 | 9 | 10 | 9 | 8 | 86 | Ready | Keep visible |
| Lagos Corporate | 9 | 8 | 8 | 9 | 8 | 7 | 9 | 10 | 9 | 8 | 85 | Ready | Keep visible |
| Nairobi Tech | 9 | 8 | 8 | 9 | 8 | 8 | 8 | 10 | 9 | 8 | 85 | Ready | Keep visible |
| Accra Graduate | 8 | 8 | 8 | 8 | 7 | 9 | 7 | 9 | 8 | 7 | 79 | Needs minor fixes | Keep visible |
| Cape Town Executive | 9 | 8 | 8 | 9 | 8 | 8 | 9 | 8 | 9 | 7 | 83 | Ready | Keep visible |
| NGO Development | 8 | 6 | 7 | 8 | 7 | 7 | 8 | 10 | 8 | 7 | 76 | Needs minor fixes | Keep visible with ATS caution |
| Diaspora International | 8 | 10 | 8 | 9 | 8 | 7 | 9 | 10 | 9 | 8 | 86 | Ready | Keep visible |
| Creative Portfolio | 8 | 5 | 7 | 8 | 7 | 6 | 8 | 9 | 8 | 7 | 73 | Needs minor fixes | Keep visible with ATS caution |

## Template Findings

### ATS Classic

Grade: Ready

Strengths:

- Strongest ATS-safe option.
- One-column layout, no photo, no sidebar, no icons.
- Handles broad section coverage without visual clutter.
- Best default for job portals and conservative applications.

Weaknesses:

- Visual polish is intentionally plain.
- One-page suitability drops when users add projects, certifications, languages, references, and extras.

Next fix:

- Add a compact one-page toggle reminder when this template exceeds one A4 page.

### Lagos Corporate

Grade: Ready

Strengths:

- Strong corporate header and premium business feel.
- Good fit for finance, operations, consulting, and business roles.
- Good two-page suitability and strong section coverage.

Weaknesses:

- Two-column layout is less ATS-safe than ATS Classic.
- Skill pills can become visually heavy with very long skill lists.

Next fix:

- Cap sidebar skill density more aggressively in one-page attempt mode.

### Nairobi Tech

Grade: Ready

Strengths:

- Best project-forward template.
- Good hierarchy for tech, data, product, and analyst roles.
- Compact PDF output on the tested profile.

Weaknesses:

- Two-column layout is not the safest strict-ATS format.
- Long project descriptions can crowd the main column.

Next fix:

- Add project truncation or compact project spacing for one-page attempt mode.

### Accra Graduate

Grade: Needs minor fixes

Strengths:

- Strong fit for graduates, interns, volunteering, projects, and education-first CVs.
- Best one-page candidate among the non-plain templates.
- Handles missing work history better than professional templates.

Weaknesses:

- A dense professional sample pushes it beyond the ideal graduate use case.
- Long content needs more graceful compression.

Next fix:

- Add graduate-specific content guidance and optional section priority rules for one-page export.

### Cape Town Executive

Grade: Ready

Strengths:

- Best senior profile feel.
- Strong summary and leadership hierarchy.
- Conservative enough for executive and professional applications.

Weaknesses:

- Section coverage is intentionally selective, so projects/extras are less prominent.
- Long achievements or awards can make the layout dense.

Next fix:

- Add optional achievement-summary controls for long executive profiles.

### NGO Development

Grade: Needs minor fixes

Strengths:

- Best section match for field work, grants, programmes, languages, certifications, and development roles.
- High section coverage.
- Good human-review layout for NGO and impact applications.

Weaknesses:

- Marked `atsFriendly: false`, so it should not be promoted as an ATS-first option.
- Impact cards add visual weight and reduce strict ATS safety.
- Dense project/field-work content needs tighter page-break tuning.

Next fix:

- Keep ATS warning visible.
- Add a companion `NGO ATS Plain` export recommendation when selected.

### Diaspora International

Grade: Ready

Strengths:

- Strong international default.
- No photo and no sensitive fields by default.
- High ATS safety and good two-page behavior.

Weaknesses:

- One-page suitability is moderate when projects and certifications are included.
- Plain global style is less visually distinctive than the branded regional templates.

Next fix:

- Add a one-page international resume preset for tighter global applications.

### Creative Portfolio

Grade: Needs minor fixes

Strengths:

- Most visually distinctive option.
- Good fit for designers, marketers, creators, and portfolio-led applications.
- Handles contact, skills, languages, projects, and experience in a clear human-review layout.

Weaknesses:

- Marked `atsFriendly: false`, correctly.
- Sidebar and visual skill pills make it unsuitable for strict job portals.
- One-page suitability is the weakest among visible templates when content is long.

Next fix:

- Keep ATS warning visible.
- Add stronger "Use ATS Classic for portals" guidance in export options.
- Tighten sidebar skill pills for long lists.

## Gallery Visibility Decision

Visible templates:

- `ats-classic`: Ready
- `lagos-corporate`: Ready
- `nairobi-tech`: Ready
- `accra-graduate`: Needs minor fixes, but export-ready and not broken
- `cape-town-executive`: Ready
- `ngo-development`: Needs minor fixes, visible with ATS caution
- `diaspora-international`: Ready
- `creative-portfolio`: Needs minor fixes, visible with ATS caution

Templates to hide:

- None.

Templates to mark beta:

- None in this pass.

Reasoning:

- No template failed preview rendering.
- No template failed PDF export.
- No template showed measured preview overflow.
- The lower-scoring templates are weaker by suitability, not broken by implementation.

## Recommended Next PRs

1. Add score metadata to the template registry.

Acceptance criteria:

- Each visible template has internal `qualityScore`, `qualityGrade`, and `qualityNotes`.
- The gallery can show a non-user-facing QA flag in development mode only.
- `scripts/verify-cv-template-registry.js` fails if a visible template lacks a score.

2. Improve one-page controls for graduate and visual templates.

Acceptance criteria:

- Accra Graduate, NGO Development, and Creative Portfolio have a stronger compact mode.
- Optional low-priority sections are identified before one-page export.
- User confirmation is required before hiding optional sections.

3. Add selected-template export guidance.

Acceptance criteria:

- ATS-unsafe templates show a clear export warning.
- Users can choose ATS Plain PDF from the warning.
- The app never implies creative/sidebar templates are best for strict job portals.

4. Add automated PDF QA snapshots.

Acceptance criteria:

- A script exports all visible templates using a shared sample CV.
- The script records PDF size, page count, preview overflow, console errors, and screenshot paths.
- CI or local PR checks fail when a visible template cannot export.
