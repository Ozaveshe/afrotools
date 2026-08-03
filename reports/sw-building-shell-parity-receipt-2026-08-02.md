# Swahili Engineering building-shell parity receipt

Date: 2026-08-02
Coordinator base: `8354e321ff34caf60a33a3393cd0dcddfb00c023`
Candidate scope: exactly 2 Engineering rows
Candidate result: **ACCEPT 2 / BLOCK 0**
Central acceptance: not recorded; the coordinator owns the acceptance ledger and inventory regeneration.

## Exact manifest

| ID | English owner | Maintained engine | Native Swahili route | Result |
| --- | --- | --- | --- | --- |
| `scaffolding-calc` | `/tools/scaffolding-calc/` | `engines/src/scaffolding-engine.js` | `/sw/zana/kikokotoo-cha-kiunzi/` | ACCEPT candidate |
| `window-door-sizing` | `/tools/window-door-sizing/` | `engines/src/window-door-sizing-engine.js` | `/sw/zana/vipimo-vya-madirisha-na-milango/` | ACCEPT candidate |

Mining 6, the independently accepted Energy exact-three, the remaining Energy rows, the other Engineering rows, and all Climate rows are outside this candidate. No central ledger, AI route map, master registry, sitemap, `dist`, deployment, or unrelated generated output was edited.

## Product and engine parity

- Both Swahili routes load the same public DOM-free engine used by the English owner. Browser tests calculate through the English owner and then through the Swahili route with the same manifest oracle.
- `scaffolding-calc` preserves country, perimeter, height, tube-and-coupler/system/bamboo type, rent/buy mode, required weeks, labour toggle, area, quantities, material/labour/total cost and cost per square metre.
- Tube-and-coupler and system choices visibly disclose that the maintained owner normalizes both to the steel calculation. Weeks remain visibly required for buy mode because that is the owner contract.
- Bamboo buy is fail-closed because the maintained owner has no purchase rate. Bamboo rent is fail-closed for a country with a zero owner rate (proved with ZA). Neither state is represented as a free or zero market price; results are hidden and all result exports are disabled.
- `window-door-sizing` preserves building type, room count and area, door counts, window and door materials/types, glazing and ventilation checks, cost components, and the four-row schedule. The UI/TXT schedule translates every product token, including `Lump sum` as `Jumla ya mkupuo`; JSON deliberately preserves the engine's raw schedule tokens for machine portability.
- Exact primary and boundary oracles are finite and numeric with explicit no-NaN checks. Invalid edits and failed calculations synchronously clear stale results and disable copy/JSON/TXT, so current inputs cannot be combined with previous results.

## Exports, privacy and AI boundary

- Normal Clipboard API copy and the local `execCommand` fallback were parsed and compared with current results.
- Downloaded JSON was parsed, reopened through the file input, and recalculated. Downloaded TXT was read and checked for current values and translated user-facing tokens.
- Requests were intercepted during the full workflow. Both routes made zero non-local network requests, zero local writes, and produced no console, resource, or page faults. No calculation data was written to local or session storage.
- The AI link stays unavailable until explicit consent. After consent it exposes only the candidate tool ID in `/sw/ai/?tool=...`; no calculation inputs or results are placed in the URL or sent. Shared AI routing was not edited.

## Sources, freshness and planning limits

- Each route shows its maintained engine path, static/planning data state, confidence boundary and the engine file-history date `2026-07-30` from commit `ba2589068db44d22a85a93576cf228eb0ee75948`.
- The date is explicitly described as repository file history, not market-price verification. The routes claim no live price, official quote, certified design, code approval or guaranteed outcome.
- The visible boundary says the result is a planning estimate and requires local engineering, safety, BOQ and quote verification.

## Accessibility, layout and SEO proof

- Browser proof covers keyboard focus for every input/select, visible labels/names, 44px targets, invalid states, live status, light, dark, system-light and system-dark.
- Computed minima across both routes and all four theme modes: control boundary **3.476:1**, focus indicator **3.200:1**, control text **15.810:1**, normal text **4.759:1**, and large/hero text **6.893:1**.
- Both routes pass at 320px and 375px and at 200% text reflow with no horizontal overflow or clipped controls. A source-path reflow fault was repaired by allowing evidence/code text to wrap.
- Canonical, Open Graph URL/image, `WebApplication`, `FAQPage`, `BreadcrumbList`, locale, artwork dimensions and reciprocal English/French/Swahili hreflang are asserted per route.

## Verification

- PASS — `node --test tests/sw-building-shell-parity.test.js` — 7/7.
- PASS — `npx playwright test tests/e2e/sw-building-shell-parity.spec.js --config=playwright.sw-building-shell.config.js --project=chromium --workers=1` — 2/2.
- PASS — `node scripts/generate-sw-building-shell-parity.js --check` — 2 routes current.
- PASS — `npm run validate:hreflang` — 10,855 pages, 31,082 relationships, 5,276 equivalence groups.
- PASS — `npm run check-links` — 133,204 links across 11,074 HTML files.
- PASS — `node scripts/build-i18n.js --validate` — French, Swahili, Yoruba and Hausa key parity.
- EXPECTED COORDINATOR ACTION — `npm run sw:parity:check` reports `reports/swahili-free-app-parity-inventory.json` stale because this scoped candidate intentionally does not regenerate the coordinator-owned central inventory.
- PASS — syntax checks for the controller, generator, Playwright config and browser spec.
- PASS — `git diff --check`; zero deleted files.

## Carried risks

- Country rates are maintained static assumptions and may be stale; users must verify local prices and currencies.
- Scaffolding geometry, load class, ties, foundations, wind, access, erection sequence and inspection are outside the engine.
- Window/door values are planning allowances; building type currently does not branch the formula, and the 5% ventilation target is not a local-code determination.
- Coordinator review must regenerate and review the central Swahili parity inventory before any acceptance update. No deployment or live-route proof is claimed.
