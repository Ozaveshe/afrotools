# French Repair Report - 2026-05-17

## Scope

This pass focused on the French public entry surface, especially `/fr/`, its durable homepage translator, the route aliases that were sending French users through English slugs, and the registry/hreflang gaps that made the French product look less complete than it is.

## Current French Ledger

- English source pages: 5,746
- French pages: 1,707
- Raw completion: 29.71%
- Mapped completion: 24.23%
- Registry coverage: 73.23%
- Blockers remaining in ledger: 14
- Missing reciprocal French hreflang pairs: 0
- French pages with English title/H1/UI signals: 0
- Registry entries pointing to missing French routes: 0
- Registry-eligible French pages still missing from discovery: 125

## 25 Key Fixes

1. Localized the French homepage signup banner ARIA label.
2. Replaced the signup banner body copy with French copy.
3. Replaced the signup CTA from "Save and sync" to French.
4. Localized the no-JavaScript fallback nav labels.
5. Changed no-JavaScript PDF, currency, VAT, CV, and invoice links to direct French slugs.
6. Kept the main hero "Explore local tools" CTA on `/fr/all-tools/` instead of the English `/fr/tools/` redirect trap.
7. Kept the secondary hero CTA on `/fr/countries/` instead of the English `/fr/start/` redirect trap.
8. Localized the hero badge, subcopy, search placeholder, search label, and search button.
9. Localized the hero country selector labels, search help, diaspora prefix, and empty state.
10. Localized the hero trust stat labels.
11. Localized the popular workflow preview panel.
12. Localized the PAYE and VAT preview labels and explanatory copy.
13. Added page-scoped country preview localization so the shared country selector no longer re-injects English preview text on `/fr/`.
14. Changed the six main homepage tool cards to direct French slugs for PDF, invoices, currency, and CV.
15. Localized the feature showcase heading and finance panel.
16. Localized the creator panel labels, bullets, mockup tiles, and footer.
17. Localized the legal and compliance panel labels, bullets, checklist statuses, and CTA.
18. Localized the FX panel labels, dynamic starter text, and CTA.
19. Normalized the tools grid to direct French slugs for PDF, currency, VAT, CV, invoices, transfers, import duty, japa, WAEC, and mobile money.
20. Localized the tools grid CTAs and several English tool descriptions.
21. Normalized education links to direct French slugs for education hub, GPA, WAEC, JAMB, and IELTS.
22. Localized the category cards and changed the all-categories card from `/fr/tools/` to `/fr/all-tools/`.
23. Localized the market data section and moved its FX, fuel, and rates cards to direct French slugs.
24. Localized live FX fallback/update messages and the search dropdown "see all results" footer.
25. Localized the testimonials and unique AfroTools discovery sections so the lower homepage no longer drops back into English marketing copy.

## Durable Fixes

- Updated `scripts/translate-fr-homepage.js` so the newer French homepage shell, direct French route aliases, and key visible-copy fixes survive future homepage refreshes.
- Updated `scripts/build-french-localization-ledger.js` so redirect, alias, and noindex French routes no longer inflate the registry-eligible denominator.
- Added French route source labels for `_redirects` aliases and HTML redirect aliases, making the ledger clearer for future route cleanup.
- Added `18` French PAYE/VAT registry entries for existing high-value country routes.
- Minified `assets/js/components/tool-registry.min.js` from the updated registry source.
- Repointed French page anchors away from English-slug `/fr/tools/<english-slug>/` aliases to direct French slugs where canonical French pages already exist.
- Fixed the two remaining French-involved hreflang reciprocity gaps found by the ledger.
- Removed the remaining visible English UI signal from the French ledger by correcting the URL encoder sample copy.
- Rebuilt `reports/french-localization-ledger.json` and `reports/french-localization-ledger.md` from the current checkout.

## Next-Step Closeout

The requested next-step lanes were handled as follows:

1. Visual/render proof for `/fr/`: passed in Chromium against `http://127.0.0.1:4177/fr/`; screenshot saved at `reports/fr-homepage-smoke-2026-05-17.png`.
2. Scoped commit preparation: related files were identified, but the checkout contains pre-existing unrelated dirty hunks in shared files, so staging must be hunk-scoped before committing.
3. Ledger blockers: blockers moved from `15` to `14`; the visible English UI, reciprocal French hreflang, missing registry href, duplicate canonical, and duplicate mapping blockers are now at `0`.
4. Route/redirect cleanup: direct French anchors were normalized in `11` French HTML files so user-facing links avoid English alias routes.
5. Hreflang warning cleanup: the two French-involved ledger gaps were repaired; global `npm run validate:hreflang` still exits clean with broader warning-only backlog outside this French closeout.
6. Registry coverage: French registry coverage moved from `60.89%` to `73.23%` (`342/467`) after adding the existing PAYE/VAT country routes and excluding aliases/noindex routes from the denominator.
7. Content wave: high-visibility English leakage was fixed on French Kenya PAYE, Nigeria salary tax, and URL encoder surfaces.

## Proof

- `node -c scripts\translate-fr-homepage.js` passed.
- `node -c scripts\build-french-localization-ledger.js` passed.
- `node -c assets\js\components\tool-registry.js` passed.
- `npm run build:i18n:validate` passed for fr, sw, yo, and ha keys.
- `node scripts\build-french-localization-ledger.js` completed and refreshed the French ledger.
- Direct route existence check passed for 19 French homepage targets.
- `npm run validate:hreflang` exited 0, with 797 existing warning-only bidirectionality warnings still present.
- `npm run check-links` passed: 80,421 internal links checked across 8,494 HTML files with no broken internal links found.
- `npm run audit` passed with 2,412 registry rows and 0 missing live/new tool pages.
- `npm run seo:report` passed with 0 missing canonical/title/meta issues and 0 remaining hreflang violations.
- `git diff --check` passed for the touched French homepage, translator, and ledger/report files.

## Remaining Risk

- The French lane is still incomplete overall: the current ledger shows 29.71% raw completion, 24.23% mapped completion, 73.23% registry coverage, and 14 blockers.
- `125` registry-eligible French pages are still missing from `tool-registry.js`; the next batch should keep adding only preferred, existing, non-alias routes.
- `123` French routes still need source-of-truth ownership decisions.
- The checkout contains unrelated dirty files outside this pass. This report only claims the French localization, ledger, registry, route, and proof work listed above.
