# French Personal Finance parity evidence

Date: 2026-07-29

Scope: one French Personal Finance hub and exactly five canonical app owners.

## Routes

- `/fr/tools/budget-50-30-20/`
- `/fr/tools/budget-album-ep/`
- `/fr/tools/budget-film/`
- `/fr/tools/fonds-d-urgence-et-de-securite/`
- `/fr/tools/classement-d-activites-complementaires/`

Hub: `/fr/personal-finance/`

## Frozen English owners

SHA-256 receipts are asserted by `tests/french-personal-finance-parity.test.js`.

- `tools/50-30-20-budget/index.html`: `412974ACC585666C62AFA7DC97274D5FB096287CC553D004C451CE617ACFC042`
- `tools/album-budget/index.html`: `50746512BF62DFCD0008B22912065B3DF3BEEB5ED426DE8EB3DB51C9DA51162`
- `tools/film-budget/index.html`: `4A8CB0185C0D2DC53273B5F6D71243D6201A7FA16955426A270FB83CA053C6FB`
- `tools/security-emergency-fund/index.html`: `F8F1A6316E7731A72F89B02061A4D5C0EBE45D2E89B46BA035A9E04FFB0A42B3`
- `tools/side-hustle-ranker/index.html`: `71EB4E1436E2456D3F124A4AD59BFB2CFA3C05755202240480593F74E2527D61`

## Automated proof

- `npm run fr:personal-finance:check` — PASS, generator owns 5/5 apps plus one hub.
- `npm run test:fr-personal-finance` — PASS, 9/9.
- `node --test tests/ai-french-discovery.test.js` — PASS, 5/5.
- `npm run test:fr-personal-finance:browser` with isolated port `49327` — PASS, 6/6 serial Chromium tests.
- `npm run validate:hreflang` — PASS, 30,499 relationships and 5,147 equivalence groups.
- `npm run ai:french-routes:check` — PASS.
- `npm run fr:surface:check` — PASS.
- `npm run check-links` — PASS, 126,195 internal links across 10,838 HTML files.
- `npm run audit` — PASS; the audit separately reports two existing missing registry pages outside this scope.
- `npm run lint` — PASS, 45 JavaScript files.
- `npm run type-check` — PASS.
- Scoped accessibility scanner — PASS, zero critical/serious findings on the hub and five app pages.
- Representative light/dark foreground, muted text and primary control pairs — PASS WCAG AA.

The Playwright matrix covers 320px, 375px, 200% zoom, light/manual-dark/system-dark themes, keyboard and error focus, accessible names, local save/reopen, TXT and JSON downloads, JSON import, print/PDF invocation, console errors, failed responses, XHR/fetch, and raw financial-value network leakage.

## Deliberate proof boundary

`npm run build:i18n:validate` stops at `LOCALIZATION_ARTIFACT_STALE` for the committed coverage JSON/Markdown. Those global generated artifacts were intentionally not regenerated because this lane explicitly excludes ledgers and broad outputs. Direct hreflang, French surface, link, registry and focused route tests pass.

No sitemap, locale ledger, other-locale file, deploy artifact, live environment, push, pull request, merge or deployment is part of this evidence.

## Strict 320px follow-up

The follow-up after independent rejection of `0a27f2b3` adds a binding browser oracle at a fixed 320px viewport with the root font size set to 32px:

- recursively checks every rendered element in the light DOM and every open shadow root;
- checks each direct visible text node through `Range.getClientRects()`;
- excludes only closed, hidden, inert and standard 1px clipped assistive-text subtrees;
- runs before and after calculation and with the mobile navbar drawer open;
- removes the fixed 520px result-table minimum and forces bounded wrapping;
- bounds side-hustle form, result and document content;
- restores the English owner’s exact side-hustle hour values `5`, `10`, `20`, `40`;
- resets the form before JSON import and verifies the result is reopened;
- verifies downloaded TXT content;
- emits and parses a real Chromium PDF containing the calculated result;
- permits only the navbar’s static JSON GET during open-shadow geometry checks and requires zero XHR/fetch during financial calculation and export actions.

The final strict Playwright run passes the hub and all five apps (`6/6`).

## Invalid-state follow-up

The shared runtime now clears and hides the rendered result, sets `_lastCalculation` to `null`, and focuses the invalid field whenever any of the five formulas rejects current inputs. Export actions always revalidate the current form instead of reusing a prior calculation.

The browser regression exercises both stale-state paths on every app. It first calculates a valid result and submits an invalid value, then restores a valid result and invokes copy, TXT, JSON and print/PDF after making the form invalid again without manually recalculating. Both paths must hide and empty the result, clear the cached calculation, and show and focus the correct validation error; the direct-export path must also leave Blob, clipboard and print counters unchanged.

Coverage was regenerated only with:

`node scripts/build-localization-platform.js --write`

Exact owned artifact delta:

- one added coverage record: `/fr/personal-finance/|fr`;
- no removed or changed coverage records;
- raw pages `10,660 → 10,661`;
- native pages `8,125 → 8,126`;
- indexable and sitemap-eligible pages `9,709 → 9,710`;
- French pages `3,679 → 3,680`, French native `2,081 → 2,082`;
- discrepancies unchanged.

## Screenshots

- `hub-375-light.png`
- `budget-50-30-20-375-light.png`
- `budget-album-ep-375-light.png`
- `budget-film-375-light.png`
- `fonds-urgence-securite-375-light.png`
- `classement-activites-complementaires-375-light.png`
