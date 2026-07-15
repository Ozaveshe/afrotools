# Degree Checker — Audit (African Degree Equivalency Tool)

Live: https://afrotools.com/tools/degree-checker/
File: `tools/degree-checker/index.html` (logic in `tools/degree-checker/degree-checker.js`)

## What it does
A client-side "destination readiness bridge". User picks source country (14 African
countries), qualification level (bachelor/HND/PGD/master/PhD), classification, target
destination (7: UK/USA/CA/AU/DE/AE/NL), goal (study/work/migration) and route context
(general/regulated). `degree-checker.js` maps the qualification to a comparable level +
framework note (RQF/FHEQ, AQF, ZAB/anabin, etc.), a readiness state (broad / evaluation /
partial / unclear), grade read-across, credential-review likelihood, document checklist,
official route-owner links, and a "best next tool" hand-off (Study Abroad Cost, IELTS,
University Ranking, Scholarship Finder, Education Hub). It also pulls saved profile/cockpit
context via EduProfileSync/AfroEdu to personalise the route.

## Mapping defensibility
Reviewed the `s` (equivalency) and `l` (grade) tables. Mappings are appropriately hedged and
defensible: recognized African bachelor/master/PhD map "broad/evaluation" to level 6/7/8
frameworks; HND/PGD carry "partial/unclear" caution as bridge/sub-degree routes; grade
read-across (First→strong honours, 2:1/2:2 bands) is reasonable and labelled indicative. No
wrong or overconfident mapping found requiring correction. Every state is qualified with
"the destination route owner still decides."

## Gaps
- **Title** was generic ("Degree Checker & Destination Readiness Bridge") — no African/
  equivalency search intent.
- **Meta description** ~216 chars (over the 160 limit); did not name a credential body.
- **H1** lacked the primary keyword ("African").
- Static trust disclaimer named "credential-assessment bodies" generically but not the
  authorities users actually search (WES / UK ENIC/NARIC).
- Only 7 destinations / 14 source countries — reasonable scope, not a defect.

## SEO / structure
- Single H1 (good). FAQ (5 Q) rendered as `<details>` and mirrored exactly by FAQPage
  JSON-LD — verified identical.
- JSON-LD: WebApplication (applicationCategory `EducationalApplication`), FAQPage,
  BreadcrumbList — all three parse (node-validated).
- Canonical + en/fr/sw + x-default hreflang present. Breadcrumb has aria-label. Form uses
  wrapping `<label>` for every control. Mobile handled by shared tokens/global CSS.

## Fixes applied 2026-07-14
- `<title>` + og:title + twitter:title → "African Degree Equivalency Checker | Study & Work
  Abroad | AfroTools" (keyword + African intent).
- Meta description rewritten to 158 chars, now names formal evaluation bodies (WES, UK
  ENIC/NARIC).
- H1 → "African degree equivalency, turned into a real next-step plan." (adds primary
  keyword, keeps single H1).
- Static disclaimer upgraded to: "Indicative only. Formal credential evaluation (e.g. WES,
  UK ENIC/NARIC) and the destination university, employer, regulator, or immigration
  authority govern the final decision."
- Verified all 3 JSON-LD blocks parse via node. FAQPage still mirrors visible FAQ.

## Deferred
- Equivalency/grade tables and JS logic unchanged (mappings sound; no defect to fix).
- No shared-data edits were needed.
