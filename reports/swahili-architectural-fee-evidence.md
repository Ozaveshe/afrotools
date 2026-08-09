# Swahili Architectural Fee parity evidence

Checked: 2026-08-09

## Scope and route ownership

- English owner: `/tools/architectural-fee/`
- Swahili owner: `/sw/zana/ada-za-ramani-za-usanifu/`
- Source owner: `scripts/build-sw-architectural-fee.js`
- Canonical and reciprocal `en`/`fr`/`sw`/`x-default` relationships are preserved.
- Both owners use the dedicated `/assets/img/tools/architectural-fee.webp` artwork.
- No acceptance ledger, AI map, locale-coverage artifact, sitemap, redirect, service worker, release file, or live service was changed.

## Product and calculation contract

The readable DOM-free engine is `engines/src/architectural-fee-engine.js`; `engines/architectural-fee-engine.js` is its generated minified pair.

For each low, typical, or high rate, the engine calculates:

`base fee = construction value × entered fee rate`

`scoped fee = base fee × entered scope share × entered practice adjustment`

`total = (scoped fee + entered disbursements) × (1 + entered tax rate)`

The result is then allocated across seven editable project stages whose weights must total 100%.

The engine retains the complete supported surface: ten named countries plus Other, eight project types, four service scopes, four practice categories, low/typical/high fee rates, scope share, practice adjustment, tax, disbursements, optional floor area, scope notes, exclusions, and seven editable phases.

### Source and freshness boundary

- External rate or regulator source URLs: none by design.
- Boundary checked: 2026-08-09.
- Country selection supplies only a country label and currency hint. It never injects a fee scale, cost-per-area value, market rate, or regulator rule.
- Every changing value is visibly user entered and marked as a low-confidence planning assumption.
- Both pages require confirmation that the user will verify professional registration, appointment scope, deliverables, exclusions, reimbursables, tax, and local requirements before accepting a fee.
- The tool never presents the result as an official scale, quote, approval, or live market value.

## Workflow and output parity

Both owners provide the same native workflow:

- calculate a low/typical/high range and seven-stage allocation;
- fail closed on missing confirmations, invalid rate order, or stage totals other than 100%;
- save, load, and reset a local draft;
- copy a summary;
- download and parse CSV, TXT, and PDF planning copies;
- download and reopen the complete JSON record;
- keep entered project values, notes, drafts, and exports local unless the user explicitly copies or downloads them.

No AI, email capture, registration gate, analytics payload, or network workflow was introduced. Browser privacy proof starts after the page is ready, so static font loading cannot be mistaken for transmission of entered project data.

## Surface preservation

| Owner | Bytes before → after | Visible words before → after | H2 before → after | Controls before → after | Buttons before → after | Links before → after |
|---|---:|---:|---:|---:|---:|---:|
| English | 17,287 → 19,291 | 455 → 494 | 4 → 5 | 13 → 36 | 3 → 10 | 8 → 8 |
| Swahili | 15,935 → 18,168 | 382 → 496 | 5 → 4 | 5 → 36 | 1 → 10 | 8 → 4 |

The four removed Swahili links were generic related-tool shortcuts inside the obsolete calculator block. The four category/source links in the route header remain. Product controls, task guidance, privacy copy, and native output breadth expanded materially; no route or file was deleted.

## Verification

- `node --test tests/architectural-fee-parity.test.js` — 7/7 passed.
  - exact calculation fixture;
  - complete inventory;
  - fail-closed invalid states;
  - no country-supplied rate/regulator data;
  - English/Swahili workflow parity;
  - canonical/schema/artwork/hreflang contract;
  - deterministic source generation.
- Focused Chromium `tests/e2e/sw-architectural-fee.spec.js` — 5/5 passed.
  - complete English and Swahili workflow;
  - JSON reopen;
  - CSV, TXT, and PDF parsed after download;
  - local save/load and reset;
  - invalid rate and stage allocation handling;
  - zero project-data network egress and zero console errors;
  - 320px and 375px at 200% text in light and dark modes;
  - labels, keyboard focus, and reduced-motion path.
- `node scripts/build-i18n.js --validate` — French, Swahili, Yoruba, and Hausa keys passed.
- `npm run lint` — passed.
- `npm run type-check` — passed.
- `git diff --check` — passed.
- Generated engine currentness — rerunning `node scripts/minify.js --only=architectural-fee-engine.js` produced the same SHA-256 `895CF1ABA107FC5E2C7FBA46C0F85886333DFEB38C2487A694E55B11A8B16FA6`.
- Encoding scan across all touched source, test, and owner files — no mojibake marker found.
- `git diff --diff-filter=D --summary` — empty; zero physical deletions.

## Residual risk

The calculator deliberately does not tell a user what rate is current or customary. Its accuracy depends on the construction value, fee range, scope allocation, tax, disbursements, and appointment assumptions the user enters. That limitation is visible before calculation and repeated in the exported result contract.
