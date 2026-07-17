# Matric APS Score Calculator — Upside Audit

- **Live:** https://afrotools.com/tools/matric-points/
- **Source:** `tools/matric-points/index.html` (self-contained — inline JS/CSS, no shared engine/data)
- **Category:** Education (South Africa — very high seasonal search intent, Nov–Jan results season)
- **Audited:** 2026-07-14

---

## 1. What it does

South-African NSC Matric APS (Admission Point Score) calculator. Users add subjects (33-subject dropdown incl. all 11 official languages) and pick an achievement level (1–7) per subject; it excludes Life Orientation, takes the best 6, sums the levels into an APS (max 42), classifies the NSC pass type (Bachelor's / Diploma / Higher Certificate), and checks the score against 26 hard-coded university-programme minimums (UCT, Wits, UP, Stellenbosch, UJ, UKZN, NWU, Rhodes, UFS, TUT) with Likely/Possible/Below badges. Adds an "application action pack" (closest programmes, stretch targets, weakest counted subject, Maths/Physics rule reminder) with copy/download-TXT/save-local and links to study-planner, timetable, flashcards, grade-tracker, and a DBE source.

## 2. APS-scale correctness — VERIFIED CORRECT

- **7-point scale is right:** Level 7 (80–100%)=7 … Level 1 (0–29%)=1, level = points. Matches the official NSC scale.
- **Calculation is right:** excludes Life Orientation, `filtered.sort((a,b)=>b.lvl-a.lvl)` sorts **descending** and `slice(0,6)` takes the genuine best 6, `reduce(sum+lvl)` → APS, max 42. Node spot-check: six 7s + weak subjects → best-6 = 42 (correct). **Importantly this standalone tool does NOT carry the best-N bug flagged in the shared `data/exam-systems.js`** (that ascending-sort defect belongs to the separate `/tools/waec-calculator/` NSC path — see `_shared-fixes.md`). No fix needed here.
- **Pass-type logic is a simplification, not a bug:** Bachelor's = 4+ non-LO subjects at level ≥4; Diploma = 4+ at level ≥3; else Higher Certificate. It omits the Home-Language-40%, two-subjects-at-30%, and designated-subject-list requirements, so it can over-classify an edge case. Acceptable for a planning estimate; documented via the new disclaimer.

## 3. Competitor gaps (university own calculators, matric.co.za, careerwise, apscalculator.co.za, EduConnect)

1. **Per-university APS *method* variance (biggest gap).** UCT does not use a plain level-sum APS — it uses a **Faculty Points Score** (best 6 excl LO/first-additional-language weighting) plus NBT; **Wits** uses a **composite index** (matric % + NBT), not the 7-point sum. The tool applies one generic APS model to all 10 institutions, so UCT/Wits numbers are indicative only. Competitors that publish per-university APS tables win here.
2. **Life Orientation handling is one-size.** Always excludes LO. Some routes/institutions historically **count LO (or LO÷2)** or use it as a tiebreaker — no toggle exists.
3. **No subject-requirement gating of the result.** Maths vs Maths Literacy, and programme minimums (e.g., Maths L5 / Physical Sciences L5 for Engineering/Medicine) are only mentioned in the action-pack text; the eligibility badges ignore them, so a low-Maths student can still read "Likely" for Engineering.
4. **No NBT integration**, and university minimums are static (no year/programme granularity or "points fill from the top" ranking note beyond prose).

## 4. SEO audit

- **Title (was weak):** `Matric APS Score Calculator | South Africa | AfroTools` → now `Matric APS Calculator 2026 - South African Universities | AfroTools` (year + SA intent).
- **Meta description (was ~185 chars, too long):** trimmed to ~157 chars, keyword-rich (UCT/Wits/UP/Stellenbosch/UJ).
- **H1:** `Matric APS Score Calculator` — single, keyword-leading, unique. Kept.
- **JSON-LD:** WebApplication (`EducationalApplication`) + WebPage + BreadcrumbList + FAQPage present. Added a **HowTo** block (3 steps mirroring the visible input flow). FAQPage answers now **mirror the visible FAQ verbatim** (were previously truncated). All 5 blocks node-parse.
- **Canonical + hreflang** (en/fr/sw + x-default) present.
- **Content depth:** solid static intro (4 paras) + FAQ + point-scale/pass-type sidebar — genuinely crawlable, better than most tools in this batch.

## 5. UI/UX + a11y + trust

- Input→result flow is clear (pre-filled sample rows, add/sample/reset buttons, live points echo, smooth-scroll to result, form status live-region). Mobile grid collapses to 1-col at 768px; subject rows re-flow at 375px.
- **a11y (fixed):** subject/level selects had terse `aria-label="Sub"`/`"Lvl"` → now `"Subject N"` / `"Achievement level (1 to 7) for subject N"`.
- **Disclaimer (was missing on-page; fixed):** the "confirm with the university" caveat previously lived only in the exported TXT. Added a visible `.matric-disclaimer` note in the input card: "APS varies by university & programme — confirm official requirements…".

---

## 6. Prioritized follow-ups (deferred — out of surgical scope)

1. Gate eligibility badges on subject minimums (Maths/Physical Sciences levels, Maths-Lit exclusion) so "Likely" respects programme rules.
2. Add a UCT/Wits note (or separate FPS/composite mode) so those institutions aren't scored with the generic level-sum APS.
3. Optional Life-Orientation toggle for the minority of routes that count it.
4. Migrate the inline violet accent set (`--accent:#7c3aed`, hero gradient, buttons) toward `var(--color-primary)` on the next education-category recolour pass (left this pass — surgical scope).

## Fixes applied 2026-07-14

- **APS-scale check:** verified correct (7-point level=points, best-6 excl LO, descending sort selects true best 6, max 42, node-confirmed). No scale bug in this standalone tool — the shared `data/exam-systems.js` best-N defect does not apply here. Pass-type is a documented simplification. No code change to the calculation.
- **`<title>`** → `Matric APS Calculator 2026 - South African Universities | AfroTools` (year + SA intent keyword).
- **Meta description** → trimmed from ~185 to ~157 chars (in 120–160 band), kept UCT/Wits/UP/Stellenbosch/UJ.
- **FAQPage JSON-LD** → answers rewritten to mirror the visible FAQ text verbatim (previously truncated).
- **Added HowTo JSON-LD** (3 steps mirroring the visible enter-subjects → select-levels → calculate flow).
- **Visible disclaimer** added in the input card: "APS varies by university & programme — confirm official requirements with each institution before applying."
- **a11y** → descriptive `aria-label`s on subject/level selects (were `"Sub"`/`"Lvl"`).
- **Validation:** all 5 `ld+json` blocks parse via node (WebApplication, WebPage, BreadcrumbList, FAQPage, HowTo).
