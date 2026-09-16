# French search and Swahili parity review

Status: implementation and local release validation complete; deployment authorized and pending. No production deployment or search uplift verified in this report.

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
- French and Swahili SSCE practice now support the latest English app's 52 quick questions and 37 written tasks, including the subsequently released Physics and mathematics additions. English assessment content stays in English with explicit language boundaries; guidance and controls are localized. Backup identities remain compatible.
- Twelve Swahili salary pages use the result keys expected by annual results and exports. Tanzania has restored annual/reverse workflow and correct sector labels. Shared Swahili PAYE output keeps period, explanations and exports consistent.
- Tunisia's four English/French/Swahili routes now share the dated-source calculation, localized workflow and exports. Job-loss contribution deductibility is an explicit planning assumption with both treatments available; actual collection remains unverified. See `docs/TUNISIA-PAYE-2026.md`.
- Sierra Leone Swahili PAYE no longer executes a legacy analytics configuration before consent defaults. Actual-provider tests found no analytics cookies after rejection and expected cookies after acceptance; synthetic salary was absent from captured requests. Disclosed cookieless measurement remains.
- French fleet, truck-load and vehicle-operating-cost tools use French advice in results and reopened exports. Calculation formulas were preserved.
- French HTML numeric/hexadecimal encoding now uses the same Unicode engine as English; French URL encoding adds RFC 3986 and form-value modes. Four coordinator browser tests passed with the analytics-disabled seam. The revised six-test suite passed with default analytics and with analytics disabled; payload checks inspect all request URLs/bodies for synthetic input, without mistaking disclosed cookieless telemetry for input transmission.
- Morocco's four English/French/Swahili routes now share ordinary private-sector payroll calculations, explicit dependent and contribution scenarios, period-aware exports and consent controls. CNSS and selected employer rates remain clearly identified planning assumptions; see docs/MOROCCO-PAYE-2026.md.
- French engineering generation now composes the navigation, visible-language and category owners. Retired generic decision panels follow the current English cleanup; native calculator controls were preserved. French bill-of-quantities descriptions reach the results and CSV, while item quantities, rates and totals match English. Architectural-fee forms, results and human-readable exports now use French while retaining user-entered fee assumptions.
- The shared French visible-language pass preserves submitted values and visible URLs. It previously attempted to translate internal monthly/annual period values in the new Tunisia form. Three focused helper tests and the French product-surface check passed.

## Evidence and its limits

- Combined SSCE, Tanzania, period/export and clipboard browser run: 15 passed before the latest integration.
- Post-main-integration fuel/RDC browser run: 7 passed; focused fuel/SSCE/source-generation tests: 12 passed.
- French transport agent run: all 18 workflows passed with reopened TXT/PDF exports. Coordinator independently passed the four affected workflows. A hidden-label style-cache issue prompted a readiness correction; all three independent theme tests now pass, including opened labels and rapid changes.
- French personal-finance browser review: 6 passed.
- French telecom agent browser review: 17 passed after distinguishing the existing static auth SDK download from data requests. The revised guard still rejects bodies, writes, API calls and input state in URL queries.
- Tunisia coordinator verification after integration: 12 source tests and 10 browser tests passed, including source boundaries, all four routes, saved-input migration, PDF parsing, monthly export context and late AI response safety.
- Restored Tunisia's legacy French canonical, OG URL and schema URL to the existing normalized primary. Five coordinator source/release tests passed; the French telecom inventory gate then passed in the agent worktree without changing historical acceptance.
- Swahili PAYE directory: all 54 destinations and 320/375px reflow passed. The extended Rwanda/Uganda export/privacy tests exceeded the default 60-second test budget during their deliberate delayed-network wait; Rwanda and Uganda both passed serial reruns with a 120-second budget.
- Current localization tests passed. Hreflang validation represented 11,558 public pages, 32,528 declared relationships and 5,287 equivalence groups; native equivalents passed canonical, language, indexing and reciprocity checks.
- Current Swahili surface suite: 12 passed, covering home/navigation, directory fallback/search, currency-data failure and manual-rate recovery, VAT validation, mobile layouts, consent links and useful HTML without JavaScript. Old currency/VAT selectors and consent wording were updated to the current owned interfaces; the final run used the real consent-loading path.
- French Wave/Orange and pan-African mobile-money article mobile checks: 2 passed. Updated Wave/Orange link-to-form-to-comparison workflow: 1 passed, plus 4 article source/schema tests.
- Selected Swahili PAYE export/Tanzania regression: 19 passed in the agent worktree. Coordinator independently passed the focused Kenya PDF, validation, consent and stale-response workflow after integration; three agent before/after fixtures confirmed unchanged calculation values apart from the repaired key.
- Fresh Swahili remittance regression passed its engine tests and two browser cases. Eight document apps passed generator, locale/canonical/indexability and visual/accessibility checks: cv-builder, cover-letter, business-plan, freelance-invoice, invoice-generator, pdf-merge-split, pdf-compress, pdf-convert. The visual cases cover themes, keyboard focus, boundaries, contrast and 200% reflow. These focused runs did not rewrite historical acceptance receipts. Browser runs used the existing analytics-disabled test seam; they do not establish production analytics behavior.
- Read-only French category sweep ran 27 commands across 26 categories: 24 passed initially. The Tunisia inventory mismatch and engineering generation composition were repaired. All 80 French developer browser checks then passed, covering the 32-app catalog's workflows, reopened exports, language, metadata and structured data; its owner hashes were refreshed without changing accepted counts. Six categories had no permitted static command in that sweep and were not counted as passed.
- Final source integration passed 22 combined Morocco/Tunisia node tests. The coordinator's 17-case browser run passed Morocco, architectural-fee and bill-of-quantities workflows together, including reopened exports, mobile layout and consent/stale-response handling. The Morocco peer separately passed all 9 source and 11 browser tests; source-law confidence remains limited as documented.
- Engineering's full 26-owner generation check passed after integration; Morocco, Tunisia and all 134 Swahili employment snippets also matched their owners.
- Full deploy build at source `45d25390` passed, producing 18,083 files. Its artifact audit and security scan passed. A separate SSCE source-comparison gate failed after postprocessing; the comparison was repaired and tested against the actual built pages while preserving schema and metadata checks.
- The later combined deploy build at product source `e2eb4026` passed in 681.8 seconds, producing 18,093 files. Artifact audit and security scan passed. All 17 focused artifact browser tests passed in 51.2 seconds. Built-source pretest passed across 11,785 HTML pages with zero content-integrity blockers or warnings and three reviewed exceptions.
- Morocco and Tunisia engine registration now passes the calculation-quality gate: 791 artifacts and 328 fixtures, including 21 new literal fixtures. The quality-system tests passed. Both new formula records retain `review-required` source status; registration does not resolve the documented source assumptions.
- A separate broad diagnostic at unbuilt source `e2eb4026` completed with 2,873 passing and 17 failing Node tests; its seven repository audits passed. Its `npm test` invocation stopped at pretest provenance. The later built pretest passed, but the broad result remains a failure until its remaining contracts and generated-state checks are reconciled. No failures are classified as pre-existing without baseline reproduction.
- That successful artifact predates the verification-panel and latest-main integration changes. Final release checks must cover those changes before delivery.
- The verification panels and localized calculation-error reporting links were integrated for all eight Morocco/Tunisia routes. Their source checks and mobile link checks passed; protected calculation digests and engine arithmetic were unchanged. Both route generators now recognize only their specifically identified release-generated related-tools component, with negative tests retaining unrelated mutations.
- Latest live-main changes at `ab47607e` were merged before deployment, preserving the education banks and mobile-design repairs. Expanded SSCE verification passed 17 node tests and six browser tests, covering all 37 written tasks in both locales, Physics, backup and exports. Coordinator integration subsequently passed 13 focused tests, lint and type checks.
- Swahili payroll current-source review preserves the historical receipts and numerical expectations. The 13 repaired controllers have explicitly linked reviewed hashes; 43 distinct browser checks passed across the initial run and the targeted Uganda scenario rerun. Both source guards still rejected a deliberate calculation mutation.
- The later generated-state recheck passed all nine assigned files and 24 tests. The remaining finder route discrepancy was identical canonical/hreflang tags in a different order after first-time content-ID injection. Public health also crossed its 30-day source threshold on September 16; regeneration must retain the original verification date and display the resulting stale status.

The effective Swahili inventory records 1,256 accepted current app routes, including the finder and SSCE acceptances added here, with zero missing, fallback or unaccepted routes. The raw ledger has one additional historical prepaid-meter entry outside that inventory. Most acceptance records are historical. These counts are not evidence that every current calculation or workflow was freshly retested.

## Remaining work

The production build at product source `7b708f37` passed and produced 18,095 files. The health snapshot and finder metadata ordering were refreshed through their owners, and the artifact was repackaged. Final `build:checks`, `seo:report`, `build:i18n:validate`, `validate:hreflang`, lint, type checks, artifact audit, security scan and whitespace checks passed. All 43 final artifact browser tests passed, including the priority French pages, dedicated payroll tools, engineering exports, expanded SSCE and Swahili finder.

The final local `npm test` ran 1,070 files: 2,906 of 2,907 Node tests passed and all seven audits passed. Its sole failure was the legacy French SSCE test expecting 40 questions. The corrected contract now checks 52 questions, all 37 written tasks, answer preservation, native guidance, backup compatibility and Physics reporting; all four corrected coordinator tests and the agent's 24 SSCE tests passed. The full local suite was not repeated after this test-only correction; remote CI remains a separate check.

No generated file deletions were introduced. The independent source review found no additional actionable product defect in the reviewed scope. Historical acceptance and fresh regression evidence remain distinct.

1. Commit the reviewed generated outputs, publish the authorized merged release and verify the live pages and remote CI.
2. Record deployment proof separately. Search results need an appropriate post-release comparison window; no click improvement can be claimed from local tests.
