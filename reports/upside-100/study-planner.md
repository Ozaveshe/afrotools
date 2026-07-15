# Study Planner & Timetable — Audit

Live: https://afrotools.com/tools/study-planner/ · File: `tools/study-planner/index.html`

## What it does
Client-side study-timetable generator for African exams. Pick a preset (WAEC, JAMB, KCSE, ECZ Grade 12, NECTA CSEE, SA NSC, University, Custom) or add subjects with an Easy/Med/Hard weight and per-subject exam date. Set hours/day, days/week, session length, start time. It allocates sessions proportionally (Hard 3x, Med 2x, Easy 1x), builds a deterministic (seeded) shuffled weekly grid, shows stats (weekly hours, subjects, days-to-nearest-exam), a weighted subject breakdown, a plan summary with source notes + handoff links (countdown, exam timetable, flashcards, grade tracker), and a printable table. Extras: per-session completion checkboxes with progress %, copy plan/progress, shuffle, reset, and a Pomodoro focus timer.

## Correctness / persistence — verified working
- Subjects + prefs persist to `localStorage` (`sp_subjects`, `sp_prefs`) on every add/remove/difficulty change and restore on return.
- Session completion persists (`afrotools.studyPlanner.sessionProgress.v1`); session IDs are deterministic so ticks survive a regenerate with identical inputs.
- Query-param deep links (`?exam=`) load a preset and auto-generate. Allocation, seeded shuffle, day totals and countdown math are correct. Past exam dates are rejected.

## Competitors & gaps
- My Study Life / Notion templates: calendar sync, reminders/notifications, cross-device cloud sync, recurring term structure. AfroTools wins on Africa-exam presets + source-linked handoffs and zero-signup local persistence.
- Gaps (deferred, out of surgical scope): no ICS/calendar export or reminders; timetable not auto-re-rendered on return visit (user must click Generate); no HowTo steps block; allocation can drop a subject to very low sessions when subject count > total sessions.

## SEO / UX / a11y findings
- Title/meta good and in-range; FAQPage mirrored visible FAQ; WebApplication uses `EducationalApplication`. All 4 JSON-LD blocks valid.
- H1 lacked the primary keyword ("Plan your study.") — fixed.
- Date input had an awkward aria-label ("Sp exam date") — fixed.
- Restored preset button had no `.selected` highlight after localStorage restore — fixed.
- Mobile 375px layout, scrollable table, empty state ("No timetable yet"), and print CSS all present and correct.

## Fixes applied 2026-07-14
- H1 now keyword-led: `Study Planner & Timetable. Ace your exams.` (one unique keyword H1, intent kept).
- Subject date input `aria-label` "Sp exam date" -> "Exam date".
- FAQPage JSON-LD Q2 answer aligned to exactly mirror the visible `"Print / PDF"` wording (still valid JSON).
- `loadFromLocal()` now re-applies the `.selected` class to the restored preset button (state/persistence fix).
- Verified: all 4 ld+json blocks parse via node after edits. Only files under `tools/study-planner/` touched; no shared files edited.
