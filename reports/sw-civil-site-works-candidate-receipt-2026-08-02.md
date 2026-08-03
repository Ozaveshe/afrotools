# Swahili civil site-works parity candidate receipt — 2026-08-02

## Outcome

- Candidate result: **ACCEPT 2 / BLOCK 0**.
- Accepted IDs: `site-clearance`, `road-construction-cost`.
- Coordinator base: `8354e321ff34caf60a33a3393cd0dcddfb00c023`.
- This is an isolated candidate receipt, not central-ledger acceptance and not release/deployment proof.
- Mining six and accepted Energy `solar-sizing`, `battery-sizing`, and `backup-duration` were excluded. No Climate or other Engineering/Energy rows were edited.

## Exact owners and routes

| ID | Maintained English owner | Authoritative DOM-free engine | Native Kiswahili route |
| --- | --- | --- | --- |
| `site-clearance` | `/tools/site-clearing/` | `engines/src/site-clearing-engine.js` | `/sw/zana/utayarishaji-wa-eneo/` |
| `road-construction-cost` | `/tools/road-construction-cost/` | `engines/src/road-construction-cost-engine.js` | `/sw/zana/gharama-ya-ujenzi-wa-barabara/` |

The inventory ID/owner mismatch for `site-clearance` is explicit: the product ID is `site-clearance`, while its maintained English route and engine use `site-clearing`. The manifest records both instead of inventing a second owner.

## Engine and workflow proof

- Source and public engine builds produced the same exact results; the localized controller contains no rate tables or calculation formulas.
- `site-clearance` Tanzania oracle: total **TZS 28,110,000**, **TZS 23,425/m²**, topsoil **270 m³**, duration **7 days**. Component outputs matched exactly.
- `road-construction-cost` Tanzania oracle: base **TZS 587,125,000/km**, road **TZS 1,467,812,500**, drainage **TZS 293,562,500**, lighting **TZS 112,500,000**, total **TZS 1,873,875,000**. All four surface comparisons matched exactly.
- Minimum valid boundaries passed: site area `50 m²` and road length `0.1 km`. Zero/invalid values fail closed.
- Any input/change immediately hides the prior result, removes raw output values and disables copy/JSON/TXT. Failed calculation cannot combine current inputs with stale results.
- Recursive finite-value checks cover nested road-comparison rows; UI, copied text and both downloads reject `NaN`, `Infinity`, and undefined numeric output.

## Export, privacy and consent proof

- Every advertised output was exercised: current-result copy, JSON and TXT. Clipboard text was read back and parsed through the normal Clipboard API and a forced local textarea/`execCommand` fallback on both routes.
- A second copy after each minimum-boundary calculation was parsed to prove it contained the new current total rather than the earlier primary-oracle result. Input invalidation then disabled all three result actions.
- JSON was reopened after a page reload. Inputs were restored and results were recalculated with the current authoritative engine rather than trusting serialized result values.
- Exported JSON identifies `planningOnly: true`, the engine owner, static-rate state, git-backed engine last-change date and low-for-procurement confidence.
- No local network writes, local resource failures, console/page errors or app-specific local storage were observed.
- The AI link remains keyboard-disabled until explicit consent. The only handoff is `/sw/ai/?tool=<tool-id>`; project inputs and results are not placed in the URL or sent by this controller.

## Source, freshness and confidence boundary

- The visible source is the maintained English DOM-free engine for each route.
- `2026-07-30` is the git-backed last-change date of both engine sources (commit `ba2589068db44d22a85a93576cf228eb0ee75948`), not a market-price refresh claim.
- Rates remain clearly labelled as static planning assumptions. They are not described as live, official, tender-ready or guaranteed.
- Confidence is visibly **low for procurement**. Users are directed to current site surveys, engineering/BOQ work and dated contractor/supplier quotes.

## Browser and accessibility proof

- Playwright: **2/2 passed** on the two routes, one worker, isolated port.
- Controls measured per route: 8. Across explicit light, explicit dark, system-light and system-dark:
  - control-boundary minimum: **3.476:1**;
  - keyboard-focus minimum: **3.200:1**;
  - control-text minimum: **15.810:1**.
- Visible normal page text was computed independently:
  - light/system-light minimum: **4.759:1**;
  - dark/system-dark minimum: **5.261:1**;
  - measured text nodes: 62 on site clearance and 65 on road construction.
- Visible controls have accessible names and minimum 44px targets. Keyboard submit, result focus, consent focus and export actions passed.
- 320px and 375px at 200% root text had no horizontal overflow or clipped scoped controls. Explicit themes and system themes are distinct; reduced motion was emulated.

## SEO, metadata and artwork

- Both pages are native `lang="sw"`, self-canonical, indexable, and use WebApplication, BreadcrumbList and FAQPage structured data.
- English and French owners have exact reciprocal `hreflang="sw"`; Swahili pages reciprocate `en`, `fr`, `sw` and `x-default` without UI/runtime changes to French.
- Full validator: **31,082 relationships / 5,276 equivalence groups**, all passed.
- Existing maintained artwork was reused with truthful dimensions and no stretch: site clearance **800×450**, road construction **600×450**. See `reports/sw-civil-site-works-artwork-queue-2026-08-02.json`.

## Validation record

- `node --test tests/sw-civil-site-works-parity.test.js` — **7/7 passed**.
- `npx playwright test -c playwright.sw-civil-site-works.config.js` — **2/2 passed**.
- `node scripts/generate-sw-civil-site-works-parity.js --check` — **2/2 source-owned pages current**.
- `npm run validate:hreflang` — **passed**, 31,082 relationships / 5,276 groups.
- `npm run check-links` — **passed**, 133,204 links / 11,074 pages, zero broken links.
- `npm run build:i18n:validate` — **expected coordinator-owned artifact drift only**: `locale-page-coverage.json` and the two localization-coverage reports are stale because this candidate intentionally does not regenerate central coverage artifacts. Yoruba orthography, Unicode and fallback checks passed before that stop.
- `git diff --check` — to be rerun immediately before handoff.

## Carried boundary

- Central Swahili acceptance inventory/ledger, shared AI route map, sitemap, locale coverage artifacts, registry/search generated output, `dist`, deployment and release surfaces remain coordinator-owned and were not changed.
- No push, merge or deployment is part of this candidate.
