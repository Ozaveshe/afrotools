# CV Builder Flagship Audit - 2026-05-20

Target route: `/tools/cv-builder/`

Scope: audit-only first PR. No visual or product behavior changes were made.

## 1. What exists and works

- The page is a real single-page CV builder, not a static shell. It has guided CV fields, country selection, live preview, 22 templates, color selection, named saved CVs, autosave, version snapshots, PDF download, print, share button injection, and related tools.
- Country-aware fields are implemented through `COUNTRY_NORMS` and currently expose 27 selector options, including Nigeria, Kenya, South Africa, Ghana, Egypt, multiple regional markets, `Other African`, and `International`.
- PDF export works in browser smoke when the email gate is already satisfied. Playwright downloaded `CV__CV_AfroTools.pdf` without console errors.
- Saved state exists in localStorage through `afro_cv_data`, `afro_cv_list`, and `afro_cv_versions`. Signed-in workspace mirroring is wired through `tools/cv-builder/js/cv-workspace-sync.js` and `assets/js/lib/workspace-sync.js`.
- ATS scoring exists as a local heuristic in `cv-advanced.js`; job-description matching, achievement lab, recruiter scan, LinkedIn kit, application pack, saved job leads, and job tracker exist in `cv-career-copilot.js`.
- The AI-backed import, cover letter, analysis, chat, summary rewrite, and bullet rewrite paths call `/.netlify/functions/ai-advisor` with a CV-builder context that warns not to invent credentials or metrics.
- SEO basics are present: canonical, OG/Twitter metadata, SoftwareApplication JSON-LD, WebPage JSON-LD, BreadcrumbList JSON-LD, hreflang alternates, and a tool registry row for `cv-builder`.

## 2. What is fake, overstated, or claimed but not fully implemented

- The page claims support for all 54 African countries, but the country selector has 27 options and many markets fall into a generic `Other African` rule.
- The page claims "no sign-up required" for PDF download, but the PDF click is intercepted by an email gate when no prior lead email is stored. It is still free, but the copy should not imply a completely ungated download.
- "AI job-match scoring" is partly overstated. The visible readiness score and keyword gaps are local heuristic matching unless the user triggers specific AI rewrite actions. This needs clearer labeling.
- ATS readiness is not a real ATS parser. It is a useful rules checklist, but the page should call it an ATS readiness check or simulator, not imply certified compatibility with all applicant tracking systems.
- Country legal/convention claims are hard-coded and not backed by a visible source or verification panel. South Africa Employment Equity, Nigeria NYSC, Kenya KCSE/KCPE, Ghana NSS, Egypt military service, and Francophone norms need dated source notes or softer wording.
- The registry row still says `Premium templates` / `Premium templates` revenue, while the page markets "free PDF download" and no watermarks. That commercial truth should be reconciled before ads.

## 3. What is ugly or weak in UI/UX

- The first viewport is dense and tool-like, but not flagship-advertizable yet. It opens into a cramped toolbar plus cockpit instead of a clear "build, score, export, track" user flow.
- The advanced features are scattered across toolbar buttons, cockpit actions, modal tools, SEO copy, and hidden controls. A user cannot easily understand the main workflow order.
- Important controls still rely on emoji-heavy labels and inline styles, which feels less polished than the rest of the AfroTools design system.
- The form is functional but long and visually repetitive. It lacks strong progress grouping, sample CV starter data, role presets in the main form, and a clearer "next best action" path.
- Trust copy is buried in SEO text instead of being part of the product surface: privacy/local processing, email gate, local versus account-backed saves, and AI limitations are not obvious at the point of action.

## 4. What breaks on mobile

- Browser smoke at `390x844` found horizontal overflow: `scrollWidth` was `403` against `innerWidth` `390`.
- The mobile action bar is not sticky. It rendered after the long page content around `top: 5475`, so it is not available while editing.
- The mobile action bar itself overflows: first button starts at `left: -13` and the ATS button ends at `right: 403` on a 390px viewport.
- Import, Cover Letter, and History are hidden on mobile with no alternate access point. ATS has a duplicate mobile button, but the other advanced features become unreachable.
- The cockpit workflow rail scrolls horizontally and contributes to the mobile overflow. LinkedIn Kit, Save Job Lead, and Job Tracker sit off the first mobile viewport.

## 5. What is missing compared with major resume builders

- A source-backed country rules panel with dates, confidence labels, and "verify locally" disclaimers.
- A clear onboarding flow: choose country, target role, experience level, template family, then build.
- Role-specific starter templates and sample phrases for students, graduates, finance, tech, healthcare, operations, NGOs, public sector, and diaspora applications.
- True import options beyond paste-to-AI: DOCX/PDF upload parsing, plain text import fallback, and review-before-apply mapping.
- Stronger ATS controls: keyword density, section parsing preview, file-name guidance, formatting warnings, and before/after improvement plan.
- Account-backed saved CV versions and job tracker as first-class features, with clear local-only fallback when signed out.
- Export breadth: PDF quality controls, DOCX export, plain text ATS export, cover letter PDF bundle, and application pack ZIP.
- Conversion and ad readiness: testimonials or example outputs, privacy trust module, student/community landing copy, retargeting-safe events, and a simpler mobile conversion path.

## 6. What should be fixed in the next PRs

1. PR 2 - Fix hidden advanced controls and mobile access. Restore visible access to Import, ATS, Cover Letter, and History on desktop, add a mobile "More" menu or sheet, and make the bottom action bar sticky and non-overflowing.
2. PR 3 - Truth cleanup. Align copy, schema, and registry revenue around free versus gated export, 27 country profiles versus 54-country generic support, heuristic ATS scoring, and local versus account-backed saves.
3. PR 4 - Source and trust layer. Add a compact country rules and limitations panel with dated source notes, privacy/local processing explanations, and AI limitation copy.
4. PR 5 - Flagship workflow redesign. Rework the first viewport around a guided CV-building journey without removing existing features.
5. PR 6 - Resume-builder parity. Add stronger import/export options, ATS report detail, role presets, and a cleaner application pack flow.

## Audit Proof

- Read `AGENTS.md` and the first-read docs requested by the repo guide.
- Inspected `tools/cv-builder/index.html`, `tools/cv-builder/js/*.js`, `tools/cv-builder/css/*.css`, registry entry, SEO/schema, workspace sync, PDF export, ATS, cover letter, country rules, analytics, and mobile audit artifacts.
- Browser smoke: desktop `1440x900` and mobile `390x844` against local `http://127.0.0.1:4181/tools/cv-builder/`.
- `node --check` passed for all CV Builder JS files.
- `npm run audit` passed with 2,459 registry rows and 0 missing live/new pages.
- `npm run seo:report` passed with 0 missing canonicals, 0 missing titles, 0 missing descriptions, and 0 remaining hreflang violations.
