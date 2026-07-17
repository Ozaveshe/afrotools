# WAEC/NECO Grade Calculator — Upside Audit

- **Live:** https://afrotools.com/tools/waec-calculator/
- **Source:** `tools/waec-calculator/index.html` + `waec-calculator.js` + `data/{exam-systems,subjects,universities,courses}.js`
- **Category:** Education (Nigeria/West Africa — very high search intent)
- **Audited:** 2026-07-13

---

## 1. What it does

Multi-system African O-Level aggregate calculator. Pick a country/exam system (12+: Nigeria WAEC/NECO, Ghana WASSCE, Sierra Leone/Liberia/Gambia, South Africa NSC, Kenya KCSE, Tanzania CSEE, Uganda UCE, Zimbabwe ZIMSEC, Francophone Bac /20, North Africa %), enter per-subject grades, and it computes a best-N aggregate + classification + credit (C6+) count, plus tabs for University Admission eligibility (Nigeria/Ghana, with optional JAMB cut-off check), an O-Level→GPA conversion table, and a course subject-requirements lookup. Share/PDF/action-pack export and an AI advisor round it out.

## 2. Grading accuracy — RED FLAGS

The WAEC/NECO core is **correct** (A1=1 … F9=9; best-5; min 5 / max 45; compulsory English + Maths; C6 credit threshold). But the multi-system generalization has real defects:

1. **Best-N selects the WORST subjects for "higher-is-better" systems (functional bug).** In `waec-calculator.js` `d()`:
   `s.sort(function(e,t){return c?t.points-e.points:e.points-t.points})` where `c = "ke-kcse"===t.id`.
   Only KCSE is special-cased to sort descending. **South Africa NSC/APS** (levels 1–7, higher = better), **Francophone Bac** (score /20, higher = better) and **North Africa** (percentage, higher = better) therefore sort *ascending* and `takeBest()` grabs the *lowest* N scores → understated APS/Bac. e.g. a student with six 7s and two 3s gets the two 3s counted. This is a correctness bug that will produce wrong APS for South African users.
2. **Kenya KCSE is summed, not meaned.** KCSE's official metric is a **mean grade** (total ÷ 7 → A…E). The tool sums 7 subjects to a 7–84 number and bands it. Result is non-standard; students expect "B+", not "72". Cluster/weighted points (the 48-point course system) is absent.
3. **No classification band for several systems.** `za-nsc` (`passTypes` only), `ug-uce`, `zw-zimsec`, and both Bac systems have no `aggregateRanges`/`classifications`/`divisions` mapped, so the classification badge renders empty/meaningless for those users.
4. **Credits count only works where `minCredit` is set** (WAEC family). NSC/KCSE/etc. always show 0 credits — acceptable but should be hidden, not shown as "0".
5. **Ghana core** hard-codes English/Maths/Integrated Science and omits Social Studies as an alternative core, and doesn't enforce the "best 3 electives" rule beyond count.

## 3. Competitor gaps (myschool.ng, flashlearners, campuscybercafe, waecvidit, pass.ng)

Top competitors focus narrowly on Nigeria and win on the **admission composite**, which this tool lacks:

1. **Combined JAMB + Post-UTME + O'Level composite screening score** — the #1 thing Nigerian applicants search ("aggregate score for admission"). Competitors compute e.g. `(JAMB/8) + (Post-UTME/2) + O'level points`, with per-school weighting variants (UI, UNILAG, etc.). This tool only checks JAMB against a static cut-off; it never returns the composite aggregate. (A separate `/tools/jamb-aggregate/` exists but the calculation is not surfaced here where users expect it.)
2. **Per-school / per-course cut-off + O'level weighting tables** — competitors publish school-specific screening formulas and departmental cut-offs by year. This tool uses one `typicalCutoff` per course.
3. **NABTEB + two-sitting combination** — combining best grades across WAEC + NECO + NABTEB sittings (FAQ mentions two sittings but the calculator can't model two result sets).

## 4. SEO audit

- **Title:** `WAEC/NECO Calculator 2026 | AfroTools` — good length (~38 chars), keyword + year. Keep.
- **Meta description:** ~200 chars, keyword-rich (WAEC, NECO, KCSE, NSC, admission checker, GPA). Slightly long; fine.
- **H1 is the biggest miss:** `Secondary School Grade Calculator` — **drops the primary keyword**. Title says WAEC/NECO; H1 doesn't. Nigerian intent ("calculate WAEC aggregate", "WAEC result calculator") isn't in the H1.
- **JSON-LD:** WebApplication + WebPage + BreadcrumbList + FAQPage all present and valid. **Missing HowTo** ("How to calculate your WAEC aggregate") — a strong rich-result fit for this query.
- **Canonical + hreflang** (en/fr/sw/ha + x-default) present and correct.
- **Content depth:** thin static HTML — one intro paragraph + FAQ. The grade-point tables, GPA table, and per-system rules are **JS-injected only** (converter tab), so they're weakly crawlable. The A1–F9 band table exists only inside FAQ prose.
- **Internal linking:** strong (JAMB subject hubs, university-admission, jamb-aggregate, related tools).

## 5. UI/UX + trust

- Input→result flow is clear: live recalculation, sticky mobile result bar, sample/clear buttons, empty state ("Enter grades…"). Good.
- Accessibility: tabs have `role`/`aria-selected`; inputs have `aria-label`. FAQ accordions are `div`-based (not `<button>`) — minor keyboard/a11y gap.
- **Missing visible disclaimer (confirmed).** The only "this is a guide, confirm with the exam body/institution" text lives inside the exported action-pack TXT. There is **no visible on-page disclaimer** near the result that grades/eligibility are indicative and that official WAEC/NECO/JAMB/university results govern. Important trust + liability signal for an admissions tool.
- No result for edge cases: entering grades for a higher-is-better system silently yields a wrong-but-plausible number (see §2.1) with no warning.

---

## 6. Prioritized fixes

### (A) Quick wins
1. **`waec-calculator.js` (`d()` sort)** → replace the KCSE-only descending flag with a per-system "higher-is-better" flag (KCSE, NSC, Bac /20, %-systems) so `takeBest` selects the actual best N. Fixes the APS/Bac under-scoring bug.
2. **`index.html` H1** → change `Secondary School Grade Calculator` to lead with the keyword, e.g. `WAEC / NECO Grade & Aggregate Calculator` (keep the multi-system subtitle). Aligns H1 with title/primary intent.
3. **`index.html`** → add a short visible disclaimer under the result card: grades/eligibility are a guide; official WAEC/NECO/JAMB and university decisions govern.
4. **`index.html`** → add a HowTo JSON-LD block ("How to calculate your WAEC aggregate") and mirror it as static, crawlable steps + a static A1–F9 point table (currently JS-only).
5. **`data/exam-systems.js`** → add `aggregateRanges`/classification bands for `za-nsc`, `ug-uce`, `zw-zimsec`, and Bac systems so the badge is meaningful; hide "Credits" where `minCredit` is undefined.

### (B) Feature upgrades vs competitors
1. **Composite admission aggregate** on the Admission tab: JAMB + Post-UTME (+ optional O'level points) with school-formula presets — the highest-intent Nigerian feature and the clearest competitor gap.
2. Represent KCSE as an official **mean grade** (A–E) alongside total points.
3. Support **NABTEB + two-sitting** best-grade combination.

### (C) Watch-outs
- FR/SW/HA `hreflang` alternates (`/fr/tools/calculateur-waec/`, `/sw/...`, `/ha/...`) must be kept in sync if H1/heading copy changes.
- `data/exam-systems.js` ends with a normalization IIFE that copies `grades/aggregateRanges/minCredit` from `useGradesFrom` — edit the source object, not the derived clones.
- No project rule marks these `data/*.js` as generated, but confirm before bulk edits; validate any SEO/canonical change with the narrowest SEO command per `.claude/rules/seo-pages.md`.

## Fixes applied 2026-07-14

- **Best-N selection generalized (correctness).** `waec-calculator.js` `d()` sort no longer special-cases only `ke-kcse`. Added helper `k(t)` deriving a per-system "higher-is-better" direction: true when `inputType` is `score`/`percentage` (fr-bac, na-bac) or the id is in `{za-nsc, ke-kcse}`. Descending sort now selects the actual best N for those systems; WAEC/NECO family and tz/ug/zw stay ascending (lower-is-better). `data/exam-systems.js` (shared) untouched.
- **Verified via node reproduction** (best subjects selected per system): KCSE (higher, best 7) drops the E, agg 63; South Africa APS (higher, integer keys) selects six 7s = 42 (not the two 3s); WAEC A1–F9 (lower, best 5) drops F9, agg 13; Bac /20 (score, higher) drops the 4, agg 69. Direction map correct across all 12 systems.
- **H1** now leads with the keyword: "WAEC / NECO Grade & Aggregate Calculator" (subtitle kept).
- **Visible disclaimer** added under the result card ("guide only; official WAEC/NECO/JAMB and institutional results govern").
- **JSON-LD** re-parsed — all 4 blocks valid; `applicationCategory` already `EducationalApplication` (no change needed).
- Deferred: KCSE mean-grade (A–E) representation; classification bands for za-nsc/ug-uce/zw-zimsec/Bac (needs shared `data/exam-systems.js` — see `_shared-fixes.md`); composite JAMB admission aggregate.
