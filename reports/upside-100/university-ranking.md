# University Ranking — audit & upside

**Tool:** African University Rankings / Shortlist Builder
**Live:** https://afrotools.com/tools/university-ranking/
**File:** `tools/university-ranking/index.html`

## What it does
Client-rendered ranking table of 50 leading African universities (rank, country, public/private type, student numbers, indicative annual fee band, scholarship flag) built from an inline `UNIVERSITIES` array in the page. On top of the table it layers filters (search, country, type, subject strength, fee band, scholarship), sortable columns, and a heuristic **Fit score** (affordability posture + saved study fields + saved destinations + scholarship flag + ranking strength). Users "save" schools into an Education-Hub cockpit (`AfroEdu` bridge), which drives a compare rail, a sample-shortlist loader, and an exportable "application pack" (copy / TXT / localStorage). Strong product depth; genuinely more than a static table.

## Competitors & gaps
Real SERP rivals for "best/top universities in Africa" and "African university rankings" are **QS**, **Times Higher Education (THE)**, **Webometrics**, **uniRank**, and EduRank. Those win on authority and methodology transparency. AfroTools cannot out-authority them, but its differentiator is **actionability** (shortlist → affordability → scholarships → Education Hub) plus **fee bands in USD** and scholarship flags the big rankers don't surface. Gaps vs competitors: (1) no per-university profile/detail pages (they rank on long-tail "University of X ranking" queries — AfroTools has one URL for all 50); (2) dataset is only 50 schools; (3) no year-over-year movement or methodology score visible per row.

## Ranking data source, methodology & freshness (trust)
This was the main trust question. **Now adequately handled.** The page carries a visible "How it works — methodology & sources" section (open `<details>`) stating the table is a *curated editorial dataset* ordered by overall reputation rank, that fee bands are indicative annual USD estimates, and that the Fit score is a heuristic, **not** an admission probability. Sources are cited (institutional prospectus/fee pages, cross-checked against THE and QS) and dated "Last verified 2026" / "Updated for 2026". Honest framing — it does not falsely claim to be an official ranking. Weakness: rank order is editorial with no per-row source or published weighting, so it should never be presented as authoritative; the disclaimers correctly manage that.

## SEO
- **Title (was weak):** previously "African University Shortlist Builder | AfroTools" — abandoned the high-volume "rankings" intent. Fixed → keyword + year + intent.
- **Meta description (was weak):** previously ~197 chars of buzzwords, over the 160 limit, no ranking keyword. Fixed → 154 chars, keyword-led.
- **H1:** single H1 present but lacked the ranking keyword. Tightened to carry it (still unique).
- **JSON-LD:** had WebApplication + BreadcrumbList + FAQPage (FAQ mirrors visible FAQ — good). **Missing ItemList** for the actually-ranked list. Added (50 CollegeOrUniversity ListItems, ascending order).
- Canonical, hreflang (en/fr/sw), OG/Twitter all present and correct.
- Content depth is high (methodology, FAQ, how-to, related tools SSR).

## UX / a11y
- Filters have proper `<label for>`; sort headers are real `<button>`s; status region uses `role=status aria-live`. Good baseline.
- Table lacked `<caption>` and `scope="col"` on headers — added (caption also restates the "indicative, not official" note for screen readers).
- Mobile: dedicated `@media(max-width:640px)` makes toolbar buttons full-width; table is in `.ur-table-wrap` (scrollable). Reasonable at 375px.
- Emoji flags are decorative and rendered by JS (not edited).

## Deferred
- No per-university detail pages / dataset expansion (product + generator work, out of surgical scope).
- `aria-sort` state on sort buttons would need JS in `university-ranking.js` (tool-local JS not touched to stay surgical).
- Methodology section uses hardcoded `#111`/`#64748b` and `'Inter'` font inline rather than brand tokens — cosmetic, left as-is.

## Fixes applied 2026-07-14
- `<title>` → "African University Rankings 2026 — Compare & Shortlist Top 50 | AfroTools" (recovers ranking search intent).
- `<meta name="description">` → 154-char keyword-led copy within 120–160.
- `<h1>` → "Compare African university rankings, then build a shortlist you can act on." (one unique H1, carries keyword).
- Added **ItemList** JSON-LD: 50 ListItems / CollegeOrUniversity with position + addressCountry, mirroring the visible ranked table, `itemListOrder` ascending, `numberOfItems:50`.
- BreadcrumbList JSON-LD already present (unchanged).
- Visible methodology + sources + "indicative estimates only… verify with each institution's official admissions office" note already present — confirmed, not duplicated.
- a11y: added visually-hidden `<caption>` and `scope="col"` on all 8 table headers.
- **JSON-LD validity:** all 4 blocks parse via `node` (WebApplication, BreadcrumbList, ItemList=50, FAQPage).
- No shared data/JS files edited (the `UNIVERSITIES` array is inline in this page, read-only for ItemList generation). Nothing appended to `_shared-fixes.md`.
