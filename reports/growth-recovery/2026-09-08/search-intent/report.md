# Search-intent recovery: first implementation wave

Four existing English articles now answer their immediate task more accurately. NYSC leads with the officially announced ₦77,000 allowance; construction stops presenting unsourced city prices as current; Ghana explains decimal pesewas; WAEC separates official result retrieval from grade interpretation. These are local implementation results, not evidence of recovered organic clicks.

## Scope and baseline

- Worktree: `C:/Users/Oza/.codex/worktrees/37d9/afrotools`.
- Branch: `codex/search-intent-recovery-20260908`.
- Fetched starting SHA: `9b29eab0408eedd9442c98c2cabf567098da80ab`.
- Implementation commit: `c90ccf811d2c94c991bb6150bf804806b46ad598`. All five source paths were clean after that commit.
- Source and metadata deltas: see `handoff.json` and `before-after.json` in this directory.
- Coordinator approved only the four English article sources and the Ghana/WAEC page records in `data/seo/priority-pages.json`. No global CSS, analytics, tool, registry, locale, Pro, payment or function edits are included.
- Inspected open PRs and path history outside `origin/main`. Existing GSC wave `1e597ee7` differs from main's Ghana/WAEC pages in generated asset tags; its substantive grading/wording work is already present. It still contains the old NYSC ₦33,000 content. This wave preserves its useful content and does not reproduce it.

The historical comparison below was supplied from the owner's September 7 GSC observation, latest 28 days versus previous 28 days. Exact query/country/device mixes and page positions were not supplied with that observation.

| Article | Recent clicks / impressions | Previous clicks / impressions | Calculated recent CTR | Calculated previous CTR |
| --- | ---: | ---: | ---: | ---: |
| Construction | 61 / 4,858 | 75 / 2,283 | 1.26% | 3.29% |
| NYSC | 10 / 8,592 | 4 / 3,699 | 0.12% | 0.11% |
| Ghana cedi words | 36 / 11,492 | 21 / 6,882 | 0.31% | 0.31% |
| WAEC | 31 / 3,831 | 57 / 4,301 | 0.81% | 1.33% |

NYSC received additional coordinator evidence on September 8: exact page, Google Web, August 9–September 5, 2026, 10 clicks, displayed 8.59K impressions, displayed CTR 0.1%, average position 7.8. Visible queries included `how much is nysc allowance 2026` (2/323), `states that pay nysc allowance 2026` (1/48), `nysc allowance 2026` (0/61), `nysc salary 2026` (0/32), `nysc budget 2026` (0/20), and `list of states that pay corpers and the amount 2026` (0/16). These are partial, privacy-filtered query rows, not a complete denominator. Country and device were not inspected. No GSC/Bing collection was performed by this lane.

## Changes and rationale

### Construction material prices

1. Replace unsupported current-price tables, nationwide cheapest-brand rankings, blanket quantities and house-cost estimates with a material-by-material quote checklist: specification, unit, delivery, exclusions and quote validity. Title, description, H1 and FAQs now explicitly promise a quote checklist, not a current price list.
2. Link directly to the existing Building Materials Cost Worksheet and explain its actual input-based calculation. Retain a BOQ Builder handoff for itemised project work without claiming engineering design or a live price feed.

This is an accuracy repair with an acquisition tradeoff. People wanting a current cement/rebar price may prefer a verified dated price source; this page currently cannot fully satisfy that demand. Removing unsupported numbers may reduce clicks for price-list queries. It avoids acquiring those clicks through a claim the site cannot substantiate. A later wave needs attributable, dated supplier quotations with location, unit, delivery and validity before numeric prices return. No current retail-price dataset was verified, and the material-price recovery objective is not declared complete.

The prior click decline alongside greater impressions cannot be attributed to title weakness alone. Position, query mix and location remain missing. Public search results surfaced fresh retail-price reporting alongside manufacturer pages; no stable rank or market-price consensus is inferred from that observation.

### NYSC allowance

1. Answer the demonstrated amount query immediately with ₦77,000, citing the official March 25, 2025 policy announcement and effective month. Replace contradictory structured data and remove unsupported state totals, payment-reliability labels, precise pay days, outside-work permission, investment yields and savings claims.
2. Replace category-hub links labelled as calculators with direct Monthly Budget Planner and Savings Goal Planner handoffs. Explain how to separate actual credits, expected support, in-kind support and one-off awards.

The official announcement is evidence of the published rate and effective date. It does not verify any individual's September 2026 credit, arrears or a fresh 2026 increase. The page's useful average position and visible amount queries support making the answer clearer; the incomplete query set does not establish the cause of all low CTR.

### Ghana cedi words

1. Add the .05 versus .50 distinction to the source-owned quick answer and worked table. Cite the Bank of Ghana's cedi/pesewa relationship and add a direct converter step near the decimal explanation.
2. Remove unsupported universal cheque-acceptance/correction claims from body and FAQs; distinguish a consistent wording convention from an issuing bank's requirements. Preserve the established title and route.

Clicks rose with impressions while calculated CTR was nearly flat. There is no observed click decline to recover on this page. The change improves task completion and snippet specificity; ranking and query-level opportunity remain unverified.

### WAEC results

1. Add official Nigeria and Ghana checker links, expected fields and a clear split between retrieving a result and interpreting grades already obtained. No PIN or candidate identifier is collected by the article or passed to AfroTools tools.
2. Preserve the useful A1–F9/credits/aggregate content and existing grading title, adding a table-of-contents entry and direct grade-calculator handoff. Source date reflects the new checker-instruction review, not a claim that every 2026 result series is released.

Declining clicks and impressions could reflect position, query mix or examination timing. The lane has no page/query position evidence establishing the cause. Public search surfaced official checker and 2026 examination notices; this supports the task split, not a release prediction or a proven seasonal explanation.

## Sources checked September 8, 2026

| Source | Supported claim and limit |
| --- | --- |
| [Official Youth Initiative allowance announcement](https://yid.fmyd.gov.ng/nysc-monthly-allowance-increased-to-%E2%82%A677000-a-milestone-in-youth-empowerment/) | March 25, 2025 announcement: ₦33,000 to ₦77,000, effective March 2025. Web extraction was intermittent; direct public HTML read succeeded. No payment-ledger claim. |
| [NYSC bye-laws](https://www.nysc.gov.ng/downloads/nysc-bye-laws.php) and [contact page](https://www.nysc.gov.ng/contact.html) | Official service-rule and enquiry routes. No blanket permission for outside business inferred. |
| [BUA distributors](https://www.buacement.com/distributors) and [manufacturer site](https://www.buacement.com/) | Primary-source route to distributor/product information; not proof of any current retail price in the removed table. |
| [Bank of Ghana 2007 annual report](https://www.bog.gov.gh/wp-content/uploads/2019/07/AnnRep-2007.pdf) | GH¢1.00 = 100Gp. Historical authoritative currency-unit evidence, not a cheque-acceptance rule. |
| [Nigeria WAECDIRECT](https://www.waecdirect.org/) | Checker fields and official support route; no result submission performed. |
| [Ghana WAECDIRECT](https://ghana.waecdirect.org/) | Index/exam/year/voucher fields and conditional date-of-birth request. No private result retrieval. |

Public reads of all four production articles succeeded and still showed the pre-change content. Production has not been changed by this lane.

## Validation and generated ownership

`verify.cjs` exercises the actual `build-seo-system.js` generator in memory with only the two approved records, asserts byte-for-byte output stability, and asserts every other owner record is unchanged. It checks 12 route/viewport combinations at 360, 390 and 1280 pixels, canonical and description/schema consistency, substantive modified dates, visible FAQ/schema parity, anchors, overflow and JavaScript exceptions. It also verifies keyboard handoff and synthetic control interaction on four existing tools. External browser requests are aborted, analytics consent is declined and service workers are blocked, so this is local static proof with the repository's test-server limitations.

Four 390px reading screenshots were visually inspected. They show readable body text and no horizontal page overflow. The new tables have captions and row/column headers; new links are keyboard reachable. Shared layout, existing WAEC FAQ controls and tools were not redesigned. Existing long quick-answer tables use their own horizontal scrolling containers.

The Ghana and WAEC HTML files are mixed ownership: body edits are authored source; metadata/quick-answer/FAQ schema fields are output from the two approved priority-page records. No minified assets or sitemap files are hand-edited. The feed check was current, and the blog backend verified 321 publishable articles, 313 hub cards and 40 feed items. Coordinator owns cumulative hub/manifest/feed/search/sitemap regeneration; old hub-card titles/descriptions must be reconciled at integration, particularly construction's removed price-list promise.

Command outcomes: `npm test` passed all 2,010 tests across 775 files and all seven audits, with zero quarantined tests. `npm run security:scan`, `npm run build:deploy`, `npm run audit:dist`, `npm run check-links`, `npm run blog:feed:check`, `npm run blog:verify` and `git diff --check` passed. The build produced 17,907 dist files. All five owned source files remained byte-identical through the full build (`build-source-drift.json`), and all four dist metadata records match source (`dist-page-proof.json`). No deployed result is implied.
+
+The full test command ran after build generation. Fifteen unrelated generated changes were subsequently restored, with their exact paths in `cleanup.json`; the focused page/owner/browser check was repeated on the cleaned candidate. No source file was deleted. Broad diagnostics include a non-blocking historical publisher-report warning and four untouched malformed JAMB pages skipped by the analytics scan. They did not fail the build or tests and are outside this lane.
+
+Coordinator preliminary source review found no new blocker. Detailed outcomes and implementation commit are recorded in `handoff.json`. Logs are local evidence, not release approval.

## Measurement and next wave

Use actual production deployment date D, not this commit date, as the intervention start. At D+14 compare 14 complete post-deploy days with the preceding equivalent 14 days; at D+28 compare 28 complete days with the preceding 28. Allow for Search Console data latency and exclude partial days. Record recrawl/indexing observations separately and annotate any later edit.

Keep Google Web and Bing separate. For each unchanged canonical, export clicks, impressions, CTR and average position for the same exact page/query/country/device combinations. Define query cohorts from actual pre-change rows, retain those exact queries for paired analysis, and report new/lost queries separately. Use the same country/device filters in both periods; do not invent missing values or treat privacy-suppressed rows as zero. Evaluate page totals alongside paired cohorts because exported queries do not reconcile to the page total. Separate position changes and query-mix effects from CTR changes; use previous-year examination timing only if comparable data exists.

For consented product evidence, use existing events only if their route and denominator definitions are verified by the coordinator. This lane adds no tracking. A link click is not a completed calculation; local synthetic completion is not production conversion. No ranking or click uplift is guaranteed.

Next wave: obtain a verified construction quote dataset; obtain current official state-specific NYSC notices before restoring any state table; request Ghana/WAEC query-position-country-device aggregates; then assess the same-page cohorts after release. Preserve routes and useful existing tool workflows.
