# French search and Swahili parity review

Status: implementation and validation in progress. No production deployment or search uplift verified.

## Search baseline

Read from Microsoft Edge Search Console, property `sc-domain:afrotools.com`, Web search, 17 August–13 September 2026. French uses a page filter containing `https://afrotools.com/fr/`; it does not need a separate property.

| Scope | Clicks | Impressions | CTR | Average position |
| --- | ---: | ---: | ---: | ---: |
| Whole property | 2.67K | 291K | 0.9% | 11.8 |
| French pages | 460 | 54.7K | 0.8% | 9.2 |

These are rounded UI totals, not an exported dataset. Page-level findings prioritize inspection; they do not establish which wording caused low clicks.

| French page | Clicks | Impressions | CTR | Position |
| --- | ---: | ---: | ---: | ---: |
| Orange Money guide | 26 | 10,056 | 0.3% | 8.5 |
| Tunisia fuel | 10 | 3,790 | 0.3% | 9.5 |
| Wave versus Orange Money Senegal | 10 | 3,140 | 0.3% | 8.1 |
| Mobile money comparison | 6 | 2,040 | 0.3% | 9.2 |
| Togo fuel | 6 | 1,998 | 0.3% | 8.7 |
| Mali fuel | 6 | 1,750 | 0.3% | 7.4 |
| Niger fuel | 1 | 1,276 | 0.1% | 8.5 |
| RDC salary guide | 0 | 831 | 0% | 8.1 |

## Integrated improvements

- French search-snippet audit decodes HTML entities correctly. Reduced review counts are a measurement correction, not an SEO gain.
- French country discovery filters actually apply the selected country and retain category/search controls.
- Orange Money guide provides country and transaction intent links and verified Cameroon withdrawal-limit context without inventing a fee for a transaction above the limit.
- Wave/Orange Senegal guide now states the calculator's actual tariff coverage and links directly to entering verified quotes, avoiding an implied built-in Senegal tariff calculation. Tariff review dates and amounts are unchanged.
- All 54 French fuel country planners use the appropriate unit, reject invalid input, permit zero quantity, and disclose recorded dates/source confidence. Current main-branch fuel data was preserved during integration; this task did not independently verify every price.
- RDC salary guide distinguishes minimum wage from national average, brings calculator actions into the opening, and requires an explicit positive exchange rate for USD comparisons. Invalid input clears results and prevents stale exports. Existing factual review date retained.
- Swahili PAYE authority finder has a native workflow, accessible feedback, country matching and explicit ambiguity handling without sending raw search text to analytics.
- Swahili homepage guidance now uses practical Kiswahili instead of implementation jargon about routes, owners and internal calculation code.
- Kenya's Swahili tax breakdown and PDF use the correct result key. Its repaired AI action now requires confirmation of the exact payload and offers a local explanation. Editing inputs clears stale results and prevents late AI replies from restoring them; calculation rates were unchanged.
- French and Swahili SSCE practice now support the English app's 40 quick questions and 28 written tasks. English assessment content stays in English; guidance and controls are localized. Backup identities remain compatible.
- Twelve Swahili salary pages use the result keys expected by annual results and exports. Tanzania has restored annual/reverse workflow and correct sector labels. Shared Swahili PAYE output keeps period, explanations and exports consistent.
- Tunisia's four English/French/Swahili routes now share the dated-source calculation, localized workflow and exports. Job-loss contribution deductibility is an explicit planning assumption with both treatments available; actual collection remains unverified. See `docs/TUNISIA-PAYE-2026.md`.
- Sierra Leone Swahili PAYE no longer executes a legacy analytics configuration before consent defaults. Actual-provider tests found no analytics cookies after rejection and expected cookies after acceptance; synthetic salary was absent from captured requests. Disclosed cookieless measurement remains.
- French fleet, truck-load and vehicle-operating-cost tools use French advice in results and reopened exports. Calculation formulas were preserved.

## Evidence and its limits

- Combined SSCE, Tanzania, period/export and clipboard browser run: 15 passed before the latest integration.
- Post-main-integration fuel/RDC browser run: 7 passed; focused fuel/SSCE/source-generation tests: 12 passed.
- French transport agent run: all 18 workflows passed with reopened TXT/PDF exports. Coordinator independently passed the four affected workflows. A hidden-label style-cache issue prompted a readiness correction; all three independent theme tests now pass, including opened labels and rapid changes.
- French personal-finance browser review: 6 passed.
- French telecom agent browser review: 17 passed after distinguishing the existing static auth SDK download from data requests. The revised guard still rejects bodies, writes, API calls and input state in URL queries.
- Tunisia coordinator verification after integration: 12 source tests and 10 browser tests passed, including source boundaries, all four routes, saved-input migration, PDF parsing, monthly export context and late AI response safety.
- Swahili PAYE directory: all 54 destinations and 320/375px reflow passed. The extended Rwanda/Uganda export/privacy tests exceeded the default 60-second test budget during their deliberate delayed-network wait; Rwanda and Uganda both passed serial reruns with a 120-second budget.
- Current localization tests passed. Hreflang validation represented 11,558 public pages, 32,528 declared relationships and 5,287 equivalence groups; native equivalents passed canonical, language, indexing and reciprocity checks.
- Current Swahili surface suite: 12 passed, covering home/navigation, directory fallback/search, currency-data failure and manual-rate recovery, VAT validation, mobile layouts, consent links and useful HTML without JavaScript. Old currency/VAT selectors and consent wording were updated to the current owned interfaces; the final run used the real consent-loading path.
- French Wave/Orange and pan-African mobile-money article mobile checks: 2 passed. Updated Wave/Orange link-to-form-to-comparison workflow: 1 passed, plus 4 article source/schema tests.
- Selected Swahili PAYE export/Tanzania regression: 19 passed in the agent worktree. Coordinator independently passed the focused Kenya PDF, validation, consent and stale-response workflow after integration; three agent before/after fixtures confirmed unchanged calculation values apart from the repaired key.
- Full deploy build at source `45d25390` passed, producing 18,083 files. Its artifact audit and security scan passed. A separate SSCE source-comparison gate failed after postprocessing; the comparison was repaired and tested against the actual built pages while preserving schema and metadata checks.
- That build does not cover subsequent commits. A final combined build, release gates and artifact checks are still required.

The Swahili ledger records 1,256 accepted current app routes, including the finder and SSCE acceptances added here. Most acceptance records are historical. That count is not evidence that every current calculation or workflow was freshly retested.

## Remaining work

1. Finish and independently verify shared Morocco calculations against dated sources, exposing unresolved contribution assumptions rather than treating an old English engine as authoritative.
2. Include the verified French car-import readiness and telecom request-contract changes in final combined validation.
3. Finish the acceptance-evidence freshness review and French category source regressions. Distinguish historical unchanged evidence from changed owners that need new workflow verification.
4. Regenerate the combined source tree and pass release checks on the final candidate. Preserve current upstream data and unrelated canonical-checkout work.
5. Report deployment separately. Search results need an appropriate post-release comparison window; no click improvement can be claimed from local tests.
