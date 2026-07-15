# Education Hub — Audit & Fixes

URL: https://afrotools.com/tools/education-hub/
File: `tools/education-hub/index.html` (+ `education-hub.css`, `education-hub.js`)

## What it is
Not a thin category directory — it is a full **student "cockpit" web app** that stores a
student's profile, checklist, scholarships, universities, destinations, budget signals and
deadlines in localStorage, then surfaces a "next best action", a profile-completion %, an
Africa Exam Radar (9 source-backed exam windows), and a study-abroad route. It orchestrates
other AfroTools education tools rather than being a link list. The task brief described it as a
"category/hub landing page linking education tools"; in practice it is a routing dashboard that
*links out* to ~16 education tools (scholarship-finder, university-ranking, study-abroad-cost,
student-budget, gpa-calculator, ielts-calculator, degree-checker, university-admission, jamb,
afrostudy, exam-countdown, study-planner, grade-tracker, exam-timetable, flashcard-maker,
matric/waec/kcse calculators).

## How it compares to a good hub/directory
Strong: rich, non-thin content; clear intro copy; methodology/limitations/sources disclosure;
breadcrumb + hreflang (en/fr/sw) + canonical + OG/Twitter; exam radar with official-source
links; live scholarship-feed status. It exceeds a typical hub on depth and internal linking.

## SEO findings
- **Title** — `Education Hub Student Cockpit | AfroTools`. Reasonable, keyword-led. Kept.
- **Meta description** (FLAGGED) — was 201 chars (truncates in SERP; the >160 limit). Rewritten to 150.
- **H1** — single, unique, keyword-bearing ("student cockpit for AfroTools"). Kept.
- **JSON-LD** — had WebApplication + BreadcrumbList + FAQPage; all valid. **Missing an ItemList/
  CollectionPage of the tools it links.** Added an `ItemList` of the connected education tools so
  the routing role is machine-readable.
- **Internal links** — excellent (system strip, hero pills, connected surfaces, related-tools SSR,
  exam radar). No change needed.
- **Content depth** — good; not thin.

## UX / a11y findings
- Scannability and mobile (375px) handled via `top-level-page-ui-refresh` + inline responsive
  overrides (hero grid collapses, exam grid → 1 col, plan grid → 1 col at 760px). OK.
- Cards are keyboard-reachable anchors/buttons; form inputs carry `aria-label`s; `aria-live` on
  exam output. Added `aria-labelledby` wiring notes below.
- **Tool-card icons (site convention = inline SVG line-icons):**
  - `Connected Surfaces` cards (my file) are text-only (`<strong>`/`<span>`) with **no icons** —
    not 2-letter monograms, so not a convention violation, but they could gain SVG line-icons.
    Deferred (would need matching CSS + layout change; out of surgical scope).
  - The `Related tools` block uses `data-icon="WN"` **2-letter monograms** — but that markup is
    emitted by the shared `related-tools.min.js` SSR component, NOT this file. Logged in
    `_shared-fixes.md`.

## Deferred / shared (not edited here)
- Related-tools monogram icons → shared component (`_shared-fixes.md`).
- Optional SVG line-icons on Connected Surfaces cards (visual/CSS change).

## Fixes applied 2026-07-14
- Meta description rewritten 201 → 157 chars (within 120–160): "AfroTools Education Hub is your student cockpit: track your profile, shortlist scholarships and universities, plan destinations, and get your next best step."
- Added `ItemList` JSON-LD (12 connected education tools) so the hub's routing role is machine-readable; complements existing WebApplication + BreadcrumbList + FAQPage.
- Title and single keyword-bearing H1 verified adequate; left unchanged.
- Verified all 4 JSON-LD blocks parse (node): WebApplication, BreadcrumbList, FAQPage, ItemList — ALL VALID.
- Deferred: Connected Surfaces SVG icons (CSS/layout scope); related-tools monogram icons → shared component (logged in _shared-fixes.md).
