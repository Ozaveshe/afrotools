# App quality first wave — 8 September 2026

Baseline: freshly fetched `origin/main` at `9b29eab0408eedd9442c98c2cabf567098da80ab`; initially clean, isolated worktree `C:/Users/Oza/.codex/worktrees/befa/afrotools`, branch `codex/growth-app-quality-20260908`. Source commit: `bd64c6ca3d691ff164affd5f480eb5e899933206`.

## Useful-result criteria and historical context

The September 7 dashboard observations below are historical acquisition context, not current metrics or evidence of broken calculation logic.

| App | Historical recent clicks / impressions | Useful-result success criterion | Decision |
| --- | --- | --- | --- |
| Ghana amount in words | 197 / 20,626 | Enter a valid GHS amount, see matching figures and words including pesewas, and copy a usable document line. Invalid input must not become a different amount. | Fix exact decimals and accessible validation/copy completion. |
| Naira to words | 61 / 8,969; previous 122 clicks | Produce matching figures, words and copied NGN/kobo text from zero through the advertised maximum. | Same two focused improvements; preserve currency choices and document formats. |
| Market days | 39 / 12,916 | Select a date, identify its day using the existing anchor, find a named market and copy a trip brief while distinguishing market-day identity from actual opening hours. | No source change. Main workflow passes; residual source/fallback gaps below. |
| Lobola | 105 / 1,434; previous 140 clicks | Build a respectful budget using the user's livestock/cash/gift assumptions, review the breakdown, then copy or save the current plan locally. Country-page controls must survive shared navigation hydration. | Honor entered counts, invalidate outdated results, and repair the six country-page metadata collisions. |

## Severity-ranked evidence and fixes

1. **P1 — Amount correctness, both amount routes.** Live and baseline local Ghana `1.005` displayed `GHS 1.01` beside `GHANA CEDIS ONE ONLY`. Naira's advertised `999999999999999.99` became figures `1,000,000,000,000,000.00` with `One Naira Only`. Root cause: floating-point parsing/formatting and an overflow beyond supported word scales. `assets/js/engines/amount-words-input.js` now parses decimal strings into integer hundredths, rounds half up, checks the post-rounding maximum, and returns exact major/minor parts and a grouped figure. Both page controllers use those same parts for words, figures, review indicators and copied text. `1.005` now includes one pesewa/kobo; `999.995` carries to `1,000.00`; maximum carry is rejected. No money rates or currency-conversion logic added.
2. **P1 — Silent reinterpretation and stale amount copies.** `-50`, malformed punctuation and exponent text were stripped into different positive numbers. Both routes now reject malformed/negative input with a field-associated status, clear obsolete results, and refuse stale copy. The visible input help explains rounding. Ghana's labels now identify the field rather than its example. Copy works through the Clipboard API or an explicit manual-copy dialog; no account gate is added.
3. **P1 — Six country calculators erased after hydration.** The baseline Botswana page's `[data-lobola-quick-planner]` became literal `NG`. Writer trace: shared `country-selector.js` personalization calls its text setter on `[data-country-name]` and `[data-country-code]`, replacing the entire planner subtree. The six English country pages now use `data-lobola-country-name/code`. The readable `lobola-country-quick-planner.js` reads these first and retains legacy reads. After hydration and changing the global country to Nigeria, each country route keeps its original jurisdiction, controls and correct starter total. Shared country-selector behavior is unchanged. Synthetic legacy metadata still calculates correctly. No generator references to the planner marker were found in `scripts`; these English pages are treated as authored source.
4. **P2 — Lobola disregarded explicit user assumptions.** Zero livestock silently selected a country default; Zimbabwe input one became four through forced mother/father/general allocations. The main planner now distinguishes blank from zero, respects the selected count, uses a single editable livestock reference for Zimbabwe, and rejects invalid/out-of-range numeric input. Examples remain examples; no authoritative cultural prices or person-valuation factors were added. Zimbabwe blank still gives eight at the existing 500 example; zero gives zero; one gives 550 with the existing 10% buffer. The existing six-head/gifts/cash example remains 4,400.
5. **P2 — Lobola outdated result actions.** Editing inputs after calculating left copy/save actions pointing at the old plan. An edit now invalidates the in-memory result and hides its actions until recalculation. The previously saved plan remains safely preserved. Reset clears the Zimbabwe extra amount and URL-selected currency override. Result focus supports keyboard users and scrolling respects reduced motion.

## Local and live proof

- **Live browser reads:** all four public main routes were exercised in a separate agent-created tab. Ghana rounding/negative and Naira maximum bugs were reproduced; Naira typical 250,000.50 copied successfully. Market anchor January 1, directory empty-state recovery and trip generation worked. Zimbabwe zero/one failures were reproduced. No public input with personal information, live database operation or external sharing was performed.
- **Local baseline browser:** four workflow runs at the untouched baseline; amount screenshot recaptures explicitly served immutable baseline HTML. `before-*.txt/png` preserve observable results. The country baseline was separately reproduced with immutable Botswana HTML and shared personalization: container text `NG`.
- **Local candidate:** 13 focused browser checks passed, plus two additional desktop/save/print checks. Coverage includes 390px main routes, typical/empty/malformed/max amounts, copy contents, missing Clipboard API, offline use after load, keyboard access, local Lobola save and downstream gift-list handoff, zero/one/blank counts, stale-result invalidation, all six country presets after global-country changes, and a synthetic legacy-attribute fixture. Guest amount workflow save and print actions and Lobola print dispatch remain reachable. Print dispatch was checked; this is not document-parser certification or a claim that every print/PDF surface was redesigned.
- **Privacy:** optional synthetic payee input produced no matching network payload in the observed interaction. Calculation code has no network calls. Main Lobola save continues to store its existing country/currency/totals handoff, without private notes. Screenshots contain only public copy and synthetic amounts/counts. No analytics helper or event taxonomy changed.
- **Visual evidence:** `after-amount-words-gh-result.png`, `after-naira-to-words-result.png`, `after-lobola-calculator.png`, `after-market-days.png`, and `after-lobola-country.png`, with corresponding before images. Screenshots were visually inspected. Main workflows fit 390px; desktop amount/market layouts were also checked.

## Commands and results

| Command | Result |
| --- | --- |
| `npm ci --no-audit --no-fund` | Pass; dependencies installed in this worktree. |
| `node --test tests/amount-words-input.test.js` | Pass, four groups covering parser boundaries and both real inline word functions. |
| `node tests/market-days-engine.test.js` | Pass, 12 existing anchor/timezone/directory checks. |
| `node tests/lobola-cluster-contract.test.js` | Pass, including English namespaced metadata and existing legacy contracts. |
| `PORT=4187 npx playwright test tests/e2e/growth-app-quality.spec.js tests/e2e/lobola-cluster.spec.js --grep-invert 'French calculator and supporting' --workers=1` | Pass, 13 checks before the two additional cases were added. Log: `browser-final.log`. |
| `PORT=4187 npx playwright test tests/e2e/growth-app-quality.spec.js -g 'existing amount\|desktop completion' --workers=1` | Pass, two additional checks. Log: `additional-browser.log`. |
| Existing unfiltered Lobola browser suite | Initially seven failures: six country UI defects now fixed, and an unrelated stale French heading assertion. Current main French source says `Calculateur de budget Lobola`; test expects `Calculateur Lobola`. French source was not changed. |
| `npm run security:scan` | Pass. |
| `npm run build:deploy` / `npm run audit:dist` | Pass. Built 17,908 files; artifact audit passed. Logs: `build-deploy.log`, `audit-dist.log`. |
| `git diff --check` | Pass before final evidence commit. |

The first expanded copy-fallback test run was interrupted because its dialog test handler waited for click completion before dismissing the dialog. The test harness was corrected to dismiss in the dialog event; the final run passes. This was a test deadlock, not a product failure.

## Ownership, generated files and release limits

Owned source: the two amount pages, main Lobola page, six English Lobola country pages, the new exact amount parser, readable Lobola country controller, and four focused test files. No market-day source, global registry, global CSS, shared analytics, locale manifest, Pro, pricing, billing or AI quota changes. Existing PR 50 concerns generic cultural workflow injection and does not contain these fixes; the old Lobola release branch is a generated checkpoint, not an alternate source fix.

The full build's incidental outputs were reviewed. Most broad intermediate changes normalized during later generator stages; the final ten unrelated paths in `incidental-generated-paths.json` were restored from the known clean baseline. The scoped source retains owner-generated cache hashes for the two changed runtimes. No standalone generated files are committed. `dist` is a local build artifact, not committed source. No merge, deployment, database write, paid service, purchase, campaign or external outreach occurred. The coordinator alone owns integration and release.

## Residual gaps and next wave

- Market days remains unchanged. Without JavaScript, its current main page displays a baked `Friday, 17 April 2026` answer. Clearing a date also retains the last valid result. A follow-up should replace the baked answer with an honest unloaded state and define date-clear behavior through a recovered readable owner. Current `assets/js/pages/market-days.js` and `assets/js/engines/igbo-market-days.js` are minified; neither has a minify source/output pair. Git provenance includes the mass-deletion recovery commit. No minified file was hand edited.
- The existing market anchor and source labels were preserved. Re-reading the [Amujzi calendar](https://mkomigbo.com/igbo-calendar/?y=2026) produced a JavaScript loading shell; the [Igbozuru event](https://igbozuru.com/events/orie-ukwu-2026-01-05/) returned a verification page. This turn proves deterministic agreement with the existing anchor, not a new independent cultural-source certification or current opening hours for every listed market.
- French Lobola still has the legacy attributes and separate UI/test issues; the controller fallback preserves compatibility but does not repair that page's shared-personalization collision. Coordinate with localization before changes.
- Existing currency choices/subunit catalogue beyond NGN/GHS were retained, not re-audited against central-bank practices. Lobola preset amounts remain explicitly editable placeholders. Country quick planners and the full planner still use different budget models (additive cash versus an optional override); do not present their different starting totals as authoritative prices.
- Cold offline navigation, actual third-party share delivery, print/PDF parsing, authenticated account sync, and post-release analytics were not verified. Offline completion tests start from a loaded page.
- Full-suite `npm test` was not run; focused arithmetic, contract, browser and required release-artifact checks target the changed workflows.

## Measurement goals, not outcome claims

For a post-release observed test with at least ten users per main app, target at least 90% completing its useful-result criterion without help, 100% agreement between amount figures and words, and zero stale-result saves in edited-input tasks. Define amount completion as a successful copy of valid current words/document text; market completion as a copied relevant trip brief; Lobola completion as a reviewed current budget copied or saved. Track these against task starts using consented event metadata or moderated observation; do not log entered amounts, names or notes. Establish a fresh denominator and baseline before comparing rates. No click recovery, conversion-rate gain or retention improvement is claimed from these local tests.

Four core workflow browser checks also passed against the optimized dist artifact at http://127.0.0.1:4197; see dist-browser.log. This verifies local publish files, not Netlify routing, hosted deployment or production state. The artifact was generated before incidental-output cleanup; the coordinator should rebuild on integration.
