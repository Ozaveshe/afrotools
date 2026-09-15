# Swahili PAYE authority finder candidate

Base: `e2a41182ab087e2c540207049fbfc1fa1571d9e8` (origin/main).
Route: `/sw/zana/tafuta-mamlaka-ya-paye/`.
Status: implemented and locally verified; independent coordinator acceptance pending.

## Product and ownership

- `scripts/build-sw-paye-authority-finder.js` owns the Swahili page and exact EN/FR reciprocal alternate tags; it runs in `sw:surface:build` after French surface generation.
- `assets/js/pages/paye-authority-finder.js` shares English matching behaviour and adds Swahili messages and existing accepted Swahili calculator destinations.
- `assets/js/engines/paye-authority-router-engine.js` and `data/salary-tax/authority-router.json` remain the matching/data owners. No new tax formulas or rates.
- Search input stays local; the ambiguous-match analytics event now records only match count rather than raw query text. Existing event names remain unchanged.
- All seven supported countries have static localized links when JavaScript or the dataset is unavailable. Official institution names remain proper names.
- The page displays the dataset's actual 2026-08-13 verification date. This work does not claim renewed official-source verification.
- This finder advertises no exports; calculation and export workflows belong to destination calculators.

## Actual checks

- PASS `node scripts/build-sw-paye-authority-finder.js --check`
- PASS `node -c assets/js/pages/paye-authority-finder.js`
- PASS `node tests/sw-paye-authority-finder.test.js`
- PASS Chromium `tests/e2e/sw-paye-authority-finder.spec.js`: 7/7 tests; exact seven-country currencies, official URLs and localized handoffs; MRA/LRA ambiguity; unsupported input; keyboard activation; 320/375px doubled-root-font reflow in light/dark; dataset failure; English regression; no page errors in the main workflow.
- Initial 320px doubled-font overflow failed and was repaired with text wrapping; all seven checks passed on rerun.
- PASS `npm run build:i18n:validate`
- PASS `npm run validate:hreflang`: 11,556 public pages, 32,520 declared relationships, 5,286 equivalence groups.
- PASS `npm run check-links`: 141,807 internal links across 11,789 HTML files.
- PASS `npm run audit`: all 3,697 live/new registry rows have pages.
- PASS `node tests/swahili-free-app-parity-inventory.test.js`
- PASS `node tests/swahili-ai-route-map.test.js`
- PASS `node scripts/build-ai-swahili-route-map.js --check`
- PASS `git diff --check`
- Mobile 375px screenshot visually inspected locally; the form and native copy render without clipped controls.

## Acceptance and remaining work

### Extended verification before coordinator acceptance

The coordinator requested actual axe contrast checks and successful-submit privacy proof. Axe exposed a light-mode status contrast failure and dark-mode undefined legacy background/text tokens, warning text, and CTA contrast failures. The Swahili generator now maps the legacy finder tokens to the current design-system tokens and explicitly preserves accessible status and CTA colors despite shared dark-mode overrides. No shared design-system stylesheet was changed.

The expanded Chromium suite passes 10/10 checks, including axe WCAG A/AA checks for serious/critical violations within the complete main workflow in both ambiguous and resolved states in light/dark. A successful synthetic query exercises ambiguity and resolution; captured analytics contain only approved metadata, and captured network requests, storage and URL contain no raw query. Source data was not renewed. The source contract, generator check and whitespace checks also pass after the fix.

The current denominator is 1,256 free English apps. The inventory retains 1,254 historical accepts, the PAYE finder as an unaccepted mapped candidate, and SSCE practice as missing. The AI route map remains unchanged and excludes this candidate until independent acceptance.

No acceptance ledger entry was added. The coordinator must independently review the committed candidate and record acceptance through the existing receipt workflow. Sitemaps, minification/cache versions, deployment build/security/dist validation and production verification belong to integration/release and were not run here. No push or deployment occurred.
