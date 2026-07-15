# Citation Generator — Audit

Live: https://afrotools.com/tools/citation-generator/
File: tools/citation-generator/index.html

## What it does
Client-side citation generator. User picks one of 8 styles (APA 7, MLA 9, Chicago author-date, Harvard, Vancouver, IEEE, OSCOLA, Turabian) and one of 12 source types (book, journal, website, newspaper, government report, thesis, conference, legal case, legislation, interview, social media, video). It renders all 8 styles at once in a live preview plus the matching in-text/footnote citation, with copy buttons, a bibliography builder (add/reorder/delete, copy-all, export .txt, save/restore via localStorage), an AI auto-fill (DOI/ISBN/URL via ai-advisor), an AI "check my citation" panel, and an AI advisor chat. Strong African slant: AJOL/African journals, African universities/newspapers/cities datalists, jurisdiction lists (Nigeria, Kenya, SA, Ghana…), OSCOLA for legal work.

## Competitors & gaps
Cite This For Me, Scribbr, ZoteroBib, MyBibliography, EasyBib. They offer live source lookup (search a title → pick result), browser extensions, and account-synced projects. Gaps here: auto-fill depends on the AI endpoint (no deterministic Crossref/OpenLibrary lookup, so it can miss fields); no per-entry edit once added to bibliography (delete + re-add only); export is .txt only (no Word/RIS/BibTeX); no alphabetical auto-sort of the reference list. African-source depth and 8-style simultaneous output are genuine differentiators.

## Citation-format check (CRITICAL)
Checked author order, date placement, italics, punctuation for APA 7 and MLA 9 across source types.
- APA 7 book: `Author, A. (Year). *Title* (ed.). Publisher.` — correct; correctly omits place of publication (APA 7 rule). Good.
- APA 7 journal: **BUG FOUND & FIXED** — volume number was wrapped in `<strong>` (bold). APA 7 italicizes the volume number (same as the journal title), it is never bold. Changed `<strong>volume</strong>` → `<em>volume</em>`. Issue number and pages correctly left roman.
- MLA 9 book: `Last, First. *Title*. Publisher, Year.` — correct.
- MLA 9 journal: `Author. "Title." *Journal*, vol. X, no. Y, Year, pp. Z. DOI.` — correct.
- MLA in-text `(Author page)` (no comma) — correct; APA in-text `(Author, Year)` with `&` for two authors — correct.
- Minor residual (not fixed, data-dependent): APA newspaper uses `(year, pub_date)` where pub_date is a yyyy-mm-dd field, so it can render the year twice, e.g. `(2020, 2020-05-01)`. Noted for later; needs date-parsing, out of surgical scope.

## SEO
- Old `<title>` "Free Citation Generator | AfroTools" — no style keywords. Old meta 181 chars (too long). H1 was bare "Citation Generator".
- A generic FAQ schema had been removed earlier and there was NO visible FAQ.

## UX / a11y
- Input → live preview → copy works; copy buttons on each style + in-text. Bibliography save/restore/export solid.
- Many emoji icons render as `??` in source (mojibake) incl. source-card icons and the advisor send button (was just `?`). The advisor send button had no accessible label. Fixed that button; broader emoji repair left out of scope.
- Responsive grid collapses to 1 col at 1024/768px; controls use tokens. Mobile 375px OK.

## Changes applied
1. APA journal volume `<strong>` → `<em>` (format fix).
2. `<title>` → "Free Citation Generator: APA, MLA, Chicago & Harvard | AfroTools".
3. meta description rewritten to 144 chars (was 181).
4. H1 → "Free Citation Generator for APA, MLA, Chicago & Harvard" (unique, keyworded).
5. Added visible "How to create a citation in 4 steps" + a real visible FAQ (6 Q&As).
6. Added HowTo + FAQPage JSON-LD matching the visible content. WebApplication already carried `applicationCategory: EducationalApplication`.
7. a11y: advisor send button given text ("Ask") + aria-label.

## Deferred
- Deterministic Crossref/OpenLibrary auto-fill; per-entry inline edit; Word/RIS/BibTeX export; APA newspaper double-year date parsing; sitewide emoji mojibake repair.

## JSON-LD
All 5 blocks parse via node (BreadcrumbList, WebApplication, WebPage, HowTo, FAQPage).

## Fixes applied 2026-07-14
- APA journal volume italic fix; title/meta/H1 SEO; visible HowTo + FAQ; HowTo + FAQPage JSON-LD; advisor-button a11y. All JSON-LD validated.
