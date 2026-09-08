# Indexing recovery: country-prefill routes

Baseline: fetched `origin/main` `9b29eab0408eedd9442c98c2cabf567098da80ab`, 8 September 2026. Worktree: `C:/Users/Oza/.codex/worktrees/7325/afrotools`. Branch: `codex/growth-indexing-2026-09-08`.

## Findings and implemented scope

Two connected root causes are repaired: the car-import fallback rule matched its own destination, and the destination controller silently calculated Nigeria for unsupported country input. A synthetic local Mozambique request produced a Nigeria estimate and replaced `country=MZ` with `country=NG` before the repair. Neither the calculation engine nor any country tax/rate pack was changed.

The replacement is an exact, non-forced allowlist of 14 existing car-directory markets. Each alias redirects to `/tools/car-import-cost/#requested-country=XX`. Netlify passes incoming query parameters through before the fragment. The fragment preserves the requested market for bare URLs, vehicle-only URLs, and conflicting country queries. The controller treats this marker as untrusted input: only the 14 configured country codes are accepted, and malformed or forged supported-country markers block calculation rather than authorize a default.

The English alias visitor sees a country-availability status message, retains vehicle details, and must deliberately select a supported country before calculating. Selection updates the country query and removes the marker, so reload/Back can restore the selected quote. Direct canonical requests without a country retain the existing default; supported country prefills retain their existing behavior. The shared notice has English, French and Swahili text, but existing localized privacy adapters intentionally discard URL state before controller restoration; the alias guarantee applies to the English destination. Exports and calculator engines are unchanged.

All affected paths are `/tools/car-import-cost/{slug}/`, for: `south-africa`, `egypt`, `morocco`, `cote-divoire`, `senegal`, `cameroon`, `ethiopia`, `rwanda`, `angola`, `algeria`, `tunisia`, `mozambique`, `botswana`, `namibia`. Trailing-slash normalization covers the corresponding paths without a trailing slash. Arbitrary countries, deeper paths and invented routes are not redirected. The six real country pages remain owned by their files: Nigeria, Kenya, Ghana, Uganda, Zambia and Tanzania.

## Search and live evidence

GSC was read through a separate agent-owned Edge tab for `sc-domain:afrotools.com`. On 8 September, the All known pages report still said **last updated 4 September**: 9.6K indexed, 18.2K not indexed. No indexing submission, validation request, property change or owner's-tab takeover occurred. The September 7 business review supplied historical context, not fresh performance measurements.

`gsc-samples.json` records all six server-error examples, the single redirect-error example, and the latest 25 displayed 404 examples (32 reported URLs). `live-http.json` records timestamped production HTTP chains, status, final canonical and robots metadata. Seven additional existing destination routes were checked in `live-destinations.json`; no public HTTP crawl exceeded 50 representative URLs.

| Sample class | Count | Current evidence and action |
|---|---:|---|
| Car-import country links reported 404 | 8 | All still returned 404. The existing `buildCalculatorUrl` export in `assets/js/lib/car-price-intelligence.js` emits this route shape. Highest-confidence actionable group; repaired locally. |
| Historical 5xx | 6 | All resolve to 200 now: five through a single 301, one direct intentional French noindex fallback. GSC last crawl was April/July. No current server outage reproduced. |
| Historical redirect error | 1 | `/fr/eq-guinea/gq-paye` now returns 200 with intentional `noindex, follow`; unchanged. |
| Retired routes | 2 | `/matchday-os/prizes/` and `/.netlify/functions/crypto-scam` now return 410; unchanged. |
| Other reported 404s | 15 | Eight unrecognized `/en-KE/` routes, three malformed markup-shaped paths, a data directory and three historical route names. No blanket redirects or invented equivalences. |

The eight observed car-import countries were Mozambique, Cameroon, Ethiopia, Botswana, Angola, Rwanda, Senegal and South Africa. The other six repaired aliases are also emitted by the existing 20-market directory. This is search-report plus internal-link evidence, not a claim of measured backlinks or lost clicks for each URL. Bing backlink data was not refreshed; the historical 29 domains/77 pages was not used as current route-level proof.

Production checks at 03:02–03:03 UTC on 8 September confirmed the canonical calculator and all six real country pages returned 200 with exact self-canonicals. Production remains unchanged by this branch; the eight sampled bad country routes still returned 404 at measurement time. No production deployment or indexing recovery is claimed.

## Ownership and existing work

- `_redirects`: replaced only the unmanaged car-import fallback/comment block. The owning route synchronizer preserves it. No `netlify.toml`, global registry, locale manifest, analytics, global CSS, Pro or SEO Studio changes.
- `assets/js/car-import-cost.js`: sole existing browser-controller source, documented in `docs/car-import-cost-implementation-note.md`. It was compressed in place; no readable paired owner or regenerating source was found. `scripts/minify.js` has no source/output pair for this controller; `scripts/build-dist.js` minifies its deploy copy. Formatting was restored with installed Terser using `compress:false`, `mangle:false`; normalized syntax equivalence passed. The mechanical-only commit is `e5fa1cb6` and precedes semantic changes.
- `tests/car-import-country-redirects.test.js`: emitted-link coverage, exact allowlist boundaries and generator retention.
- `tests/car-import-country-entry.browser.js`: HTTP and actual-controller browser checks, with an optional local Netlify origin. No external calls or real user fixtures.
- `scripts/cachebust.js --only=assets/js/car-import-cost.js` owns script-hash updates in seven English pages and the two existing French/Swahili consumers. These are generated tag-only changes, not page-copy edits.
- The route graph and route reports are regenerated by `scripts/build-route-contract.js`. Most graph-line churn comes from `_redirects` line-number provenance after replacing one pattern with 14 exact rules. Indexable-page/sitemap eligibility counts stay unchanged.

`route-semantic-delta.json` verifies the generated graph against the baseline: ignoring only each route's generated `id` and `source.line`, all **14,770 retained rows are identical**, with exactly 14 car aliases added and the self-matching pattern removed. IDs incorporate `owner:line` in `scripts/lib/route-contract.js:469`, explaining the large diff. The only other changes are summary counts and one shadowed-rule line number; shadowed-rule semantics, equivalence groups, conflicts and policy are unchanged.

The existing unmerged `origin/fix/car-import-cost-redirect` commit `41ad9a456ea36d0c520e4ee8954109e3b0b9bc19` supplied the self-matching-splat diagnosis. Its placeholder implementation would also capture arbitrary names and did not guard the destination. This wave intentionally narrows that repair and adds the necessary destination safeguard. Open PR 52 (canonical/OG permanent-destination repair) and daily SEO PRs were inspected and not recreated.

## Netlify and browser proof

Installed Netlify CLI **27.0.0** was run offline in a separate temporary fixture, with no production project linkage or functions. Its real redirector and HTTP proxy produced:

| Request suffix after `/tools/car-import-cost/mozambique/` | 301 Location |
|---|---|
| none | `/tools/car-import-cost/#requested-country=MZ` |
| `?make=Toyota&engineCc=2600` | `/tools/car-import-cost/?make=Toyota&engineCc=2600#requested-country=MZ` |
| `?country=KE&make=Toyota` | `/tools/car-import-cost/?country=KE&make=Toyota#requested-country=MZ` |
| `?country=MZ&source=japan` | `/tools/car-import-cost/?country=MZ&source=japan#requested-country=MZ` |

This matches Netlify's [documented query pass-through, file shadowing and slash normalization](https://docs.netlify.com/manage/routing/redirects/redirect-options/). The installed CLI's `dist/utils/proxy.js` constructs the destination URL, copies request parameters only when the destination has no query, and preserves its hash. The fixture runs the real controller using local assets. This is strong local provider proof, not a deployed-edge test.

Mobile checks use 390×844, synthetic vehicle fields and reduced motion. They cover all 14 alias markets with original, absent, vehicle-only, conflicting supported and invalid country queries; invalid fragments; unchanged supported/absent-country entry; explicit recovery; reload/Back; and the localized consumers. The initial 78-case matrix passed before adding the localized checks. Final command results are recorded in `handoff.json`.

Localized baseline contracts were verified separately. `assets/js/pages/swahili-car-import-cost.js` strips query/hash, prevents local draft persistence and hides the initial result. Manually entered vehicle fields remain in the form, and explicit Kenya selection/submission calculates with no URL payload or saved draft. `assets/js/pages/french-transport-parity.js` also strips query/hash and prevents persistence, but **still displays an initial default Nigeria result with exports disabled**. This is a pre-existing residual, not repaired by the English aliases. Its manual Kenya recovery and privacy/export gate are checked. The coordinator assigned the French adapter issue to the separate French owner; neither adapter is edited here. The initial localized test deliberately failed on these differing contracts before their source owners were inspected; the final test records the observed baseline, not a claim that French initial-result suppression passes.

An existing Chromium `Transition was skipped` warning occurs during the history-navigation case because the unchanged global CSS opts into cross-document View Transitions. The test retains it separately as a navigation warning; it does not suppress controller exceptions. Initial entry/calculation controls had no controller errors or horizontal overflow. `mobile-country-availability.png` shows the blocked state.

## Validation and residual work

The first `npm run build:deploy` attempt stopped on Windows `UNKNOWN` while the untouched French-energy generator copied `tarifs-electricite/index.html` to `compteur-prepaye/index.html`. A bounded retry passed the complete build/deploy-artifact creation. The final localized guard received a further full validation run. Unrelated generated FX, status, public-claims and sitemap-date churn is excluded from the candidate. No sitemap membership or lastmod manipulation is part of this repair.

The coordinator caught trailing whitespace introduced by the mechanical formatting commit. Follow-up `33ec5199` trims only line endings and regenerates the nine owned script tags; normalized Terser syntax equivalence, syntax checking and **baseline-to-HEAD** `git diff --check` pass. The build, artifact audit and dist browser evidence validate semantic commit `a86262cb`; the whitespace-only follow-up is equivalent code with refreshed source tags. The coordinator's cumulative rebuild must provide the final integrated artifact proof.

Priorities after integration:

1. Deploy through the coordinator/publisher, then verify the exact source commit and the 14 edge aliases, query/fragment preservation, canonical 200 and existing six country pages. Recheck the eight GSC samples after Google's next crawl; do not promise clicks/indexing gains from local tests.
2. Trace fresh referring-page/URL-inspection evidence for `/sw/zana/alama-maji-pdf/`, `/tools/cost-of-living-compare/` and `/club/`. Current source searches found no exact owner/reference sufficient to invent a redirect. Hand any demonstrated localized-content defect to its owner.
3. Inspect historical `/en-KE/` and malformed markup-shaped URLs only if fresh internal or backlink evidence identifies their emitter. Leave the data directory and legitimate retired/noindex pages alone.
4. Keep the engine's legacy fallback under review for other callers; this wave guards the car-import browser entry and intentionally does not change shared math or broaden country coverage.
5. Integrate the separate French owner's initial-result fix and reconcile the localized baseline assertion in this test to that new contract.

No live database actions, outbound messages, paid services, main merge or deployment were performed. The source rates were not refreshed because this repair changes route/entry behavior only.
