# Flashcard Study Tool — Audit

URL: https://afrotools.com/tools/flashcard-maker/
File: `tools/flashcard-maker/index.html`

## What it does
Client-side flashcard app for African exam prep. Ships 19 pre-made "starter" decks (JAMB EN/Maths/Physics/Chemistry, WAEC Biology, KCSE Kiswahili/History, SA Matric, plus ECZ, UNEB, NECTA CSEE, NSC, Ghana WAEC, KNEC KCSE, ZIMSEC, University study skills). Users create/edit decks, add cards, bulk import (tab/CSV), export CSV. Three study modes: Flip (space/arrow keys), Quiz (typed active recall with fuzzy match), Match (term↔definition game with 4/6/8/10 pairs). Lightweight spaced repetition via `buildStudyOrder()` (unmastered cards repeat 2+reviewCount times, shuffled). Progress tab: mastery %, stats, session summary, streak tracking, card breakdown filters, and a copy/download "Review Pack" TXT. Exam decks deep-link into timetable/study-planner/countdown/grade-tracker with official-source links. Persists to `localStorage` (`afro_flashcards`, `afro_fc_streak`) + optional `EduCloudSync`.

## Competitors & gaps
- **Quizlet** — largest; sets, Learn/Test/Match, sharing, mobile app. AfroTools lacks account-based deck sharing/public library and import from images.
- **Anki** — powerful SM-2 spaced repetition + sync. AfroTools SR is heuristic (repeat count), not interval-scheduled; no due-date scheduling.
- **Brainscape** — confidence-based repetition, curated market decks. Comparable curation angle; AfroTools wins on Africa-exam specificity.
- **Cram / StudyStack** — free web flashcards, games. AfroTools matches modes and adds exam-ecosystem handoffs.
- Key gaps: no cross-device share links, no true interval SR/due dates, no deck rename, match/reset controls are `div onclick` (not keyboard-focusable).

## SEO
- Title: strong, 53 chars, keyworded. Good.
- Meta description: WAS 201 chars (over the 160 limit) — fixed to 156.
- H1: WAS "Study smarter. Remember more." (no product keyword) — fixed to keyword-led.
- JSON-LD: WebApplication (EducationalApplication), WebPage, BreadcrumbList, FAQPage — all valid. FAQPage previously carried 3 of the 5 visible FAQs with paraphrased answers; expanded to mirror all 5 visible Q&As verbatim.
- Content depth: solid SEO section + 5 FAQs + curated deck data. hreflang en/fr/sw + canonical present.

## UX / a11y / trust
- Create→study flow works; auto-switches to Study on preset load; `?exam=`/`?deck=` query pre-loads decks.
- Persistence is solid (save() on every mutation; graceful JSON parse guard; activeDeck bounds-checked on load). No persistence bug found.
- Empty states are clear across Decks, Study, Progress, Review Pack, Breakdown.
- Form inputs have `<label for>`/`aria-label`; live regions on exam context + review pack.
- Deferred: match/breakdown items are non-focusable divs (keyboard/screen-reader gap); no true interval scheduling; no deck rename.

## Fixes applied 2026-07-14
- Meta description rewritten 201→156 chars, kept core exam keywords + modes + spaced repetition.
- H1 changed to keyword-led: "Free flashcard maker to study smarter." (was "Study smarter. Remember more.").
- FAQPage JSON-LD expanded from 3 paraphrased to all 5 visible FAQs, answers mirroring on-page text verbatim.
- All 4 JSON-LD blocks re-validated via node — parse clean.
- Deferred (not in scope / larger change): keyboard-accessible match & breakdown items; interval-based spaced repetition with due dates; deck rename; public deck sharing.
