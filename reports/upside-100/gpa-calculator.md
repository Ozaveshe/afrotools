# GPA / CGPA Calculator — Audit (upside-100)

- Live: https://afrotools.com/tools/gpa-calculator/
- File: `tools/gpa-calculator/index.html`
- Data/logic: `tools/gpa-calculator/gpa-calculator.js` (minified), `tools/gpa-calculator/data/grading-systems.js` (not edited — logic verified only)

## What it does

Semester GPA + cumulative CGPA calculator covering 9 African grading systems (Nigerian Federal 5.0, Nigerian Private 4.0, Kenyan 4.0 +/-, Ghanaian 4.0, South African %, East African 5.0, Ethiopian 4.0, Francophone /20, Egyptian %). Four tabs: multi-semester GPA entry with prefilled faculty course templates; transcript paste + CSV upload auto-parse; bidirectional scale converter (incl. UK/US) with a reference table; and a What-If calculator (target GPA, target class, grade-replacement retake). Right rail shows a live CGPA gauge, class badge, credits/points, semester-trend bars, scholarship eligibility matcher, share (WhatsApp/X/copy/PDF) and a copy/download/save "GPA action pack."

## Competitors & gaps

Real competitors: gpacalculator.io, rapidtables GPA, CollegeSimply — all US-4.0-centric with weighted/credit-hour and semester CGPA. AfroTools' genuine edge is the **9 African-specific scales in one tool** (5.0 vs 4.0 vs /20 vs percentage), scholarship matching (Chevening etc.), and classification bands (First Class / 2:1). Gaps vs competitors already covered here: weighted credit-hour ✓, multi-semester CGPA ✓, scale conversion ✓, what-if projection ✓. Remaining gaps: no weighted/honours-course multiplier (US AP style — not relevant to most African systems, low priority); percentage systems (SA/Egypt) report a weighted-percentage "CGPA" rather than a 4.0 conversion on the main gauge (the converter does offer the 4.0 mapping).

## SEO

- Title: WAS `GPA Calculator Africa 2026 | AfroTools` (38 chars, keyword ok but no CGPA). Changed to `GPA & CGPA Calculator for African Universities | AfroTools` (58 chars) — adds CGPA + clearer African intent. OG/Twitter titles synced.
- Meta description: WAS 239 chars (truncates in SERP). Rewritten to 151 chars keeping GPA & CGPA, 9 systems, Nigerian 5.0/4.0, Kenyan, Ghanaian, Francophone /20, scholarship + converter.
- H1: `GPA Calculator for African Universities` — single, unique, keyworded. Kept as-is (already good).
- Canonical + hreflang (en/fr/sw/ha/x-default) present and correct.
- JSON-LD: WebApplication (EducationalApplication) + WebPage + BreadcrumbList + FAQPage — all present, all parse.
- **FAQPage mismatch (fixed):** schema had only 5 Q&A and its question/answer text diverged from the 10 visible FAQ items (a Google rich-result eligibility risk). Rebuilt to mirror all 10 visible questions with exact visible answer text.

## UX / correctness

- Input→result is instant/live (animated gauge, mobile bottom bar). Add/remove semester + course, clear all, collapse — all present. Transcript + CSV parsing and sample download work.
- **GPA math verified correct** (read from minified JS, `function C()` + `function x()`): per course `points × credits` summed; semester GPA = semPoints/semCredits; CGPA = Σpoints / Σcredits across all semesters (standard weighted credit-hour). Percentage/score systems weight the raw score by credits. What-if required-GPA formula `(target×(cur+up) − curCGPA×cur)/up` is correct. Node checks:
  - Nigerian 5.0 A(3),B(3),C(2) → CGPA 4.125, 8 cr, 33 pts ✓
  - Kenyan A-(3.7,3),B+(3.3,4),C(2,3) → 3.03, 10 cr ✓
  - Multi-semester (33/8cr + 20/6cr) → 3.79 ✓
  - What-if: cur 3.20/45cr, target 3.50, +18cr → needs 4.25 ✓
- a11y: grading/preset/converter selects and what-if number inputs all have `<label for>` or `aria-label`. Good baseline. Dynamically generated course-row inputs live in JS (deferred).
- **Disclaimer gap (fixed):** no visible "verify with your institution" note near the result (it only existed inside the exported TXT). Added a disclaimer line in the results glass card.

## Fixes applied 2026-07-14

1. `<title>` → `GPA & CGPA Calculator for African Universities | AfroTools` (adds CGPA + African intent); OG + Twitter titles synced to match.
2. Meta description rewritten 239→151 chars (in the 120–160 window), keyword-rich.
3. FAQPage JSON-LD rebuilt from 5 → 10 questions, mirroring the visible FAQ section verbatim (question + answer text) to restore rich-result eligibility.
4. Added a visible verification disclaimer inside the results panel: "Estimate only. Always verify against your institution's official grading scale, classification cut-offs, and transcript rules before relying on this result."
5. Verified GPA/CGPA math across scales with a Node harness (results above) — no code change needed; math is correct.

Validation: all 4 `application/ld+json` blocks parse via Node; FAQPage now carries 10 questions. No shared files edited. No `df` blocks or planning-summary widget touched.
