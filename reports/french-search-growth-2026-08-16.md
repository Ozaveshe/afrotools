# French organic-search growth review — 16 August 2026

## Outcome

French search is not invisible, and hreflang is not the present blocker. In the last 28 days, `/fr/` earned **450 clicks from 46,066 impressions**, a **1.0% CTR**, and an average position of **8.9**. Clicks grew 65% and impressions roughly doubled versus the preceding 28 days, while CTR fell from 1.2% to 1.0%.

The urgent problem was search-product quality inside the impression growth: high-impression French routes still exposed English body copy or schema, generic snippets, unsupported tariff claims, and English country names in discovery surfaces. This pass repaired the four largest confirmed low-CTR clusters and added tests or deterministic owners so broad rebuilds cannot silently reverse the fixes.

## Evidence boundary

- Search evidence: authenticated Google Search Console exports for the 28 days ending 15 August 2026, plus the preceding 28-day comparison.
- The headline chart is complete. GSC page/query/country/device tables are capped or anonymized; table sums are therefore treated as directional subsets, not a full denominator.
- Repository evidence is not deployment evidence. This report records the validated branch state only.
- No ranking, traffic, or 10,000-click outcome is guaranteed.

### Live crawl baseline before this release

A live fetch on 17 August 2026 found no delivery-level suppression: `robots.txt` returned 200 and explicitly allowed `/fr/`; `sitemap-index.xml` returned 200 as XML; sampled French pages returned 200 HTML without an `X-Robots-Tag`; and the sitemap index referenced the French and i18n sitemaps. The live defect was content and discovery state, not a server-wide crawl block. The deployed `sitemap-fr.xml` still contained 3,095 URLs, zero individual French widget parents, and both stale root-level salary duplicates. Sampled repaired pages also still served the pre-branch content. These observations are the production baseline, not proof that this branch is deployed.

## Baseline and target math

| Measure | Current evidence | Meaning |
|---|---:|---|
| French clicks | 450 / 28 days | 16.1 per day |
| French impressions | 46,066 / 28 days | 1,645 per day |
| French CTR | 1.0% | Visibility is growing faster than clicks |
| French average position | 8.9 | Many impressions already occur on page one |
| Whole-site clicks | 8,138 / 92 days | About 88–90 per day in the available site baseline |
| Year-end target | 10,000 clicks per day | About 111× the current whole-site daily rate |

At the current French impression volume, even a 5% CTR would produce only about **82 French clicks per day**. Reaching 10,000 clicks per day requires both CTR recovery and a much larger qualified-demand portfolio: about **200,000 daily impressions at 5% CTR**, or **333,000 daily impressions at 3% CTR**. Technical SEO alone cannot supply that denominator.

The exported GSC page table shows where the current French opportunity is concentrated. Because Google caps this table, these figures are a directional subset rather than a full denominator.

| Route family | Rows in export | Current clicks | Current impressions | Previous clicks | Previous impressions |
|---|---:|---:|---:|---:|---:|
| French blog | 59 | 76 | 16,851 | 54 | 8,631 |
| Fuel tracker family | 55 | 29 | 13,225 | 16 | 3,544 |
| Salary calculators | 22 | 153 | 5,633 | 86 | 3,439 |
| VAT calculators | 20 | 24 | 2,908 | 24 | 1,992 |
| Other French routes | 1,184 | 168 | 7,332 | 91 | 4,656 |

The blog and fuel families account for 30,076 of the 45,990 impressions represented in the exported page table, about 65%. That concentration is why this pass prioritized those routes before broad metadata churn.

The capped country and device tables add two product signals. Mobile contributes 8,160 of 12,524 represented impressions and 34 of 58 represented clicks, with position 8.56 but only 0.42% CTR. The largest represented Francophone demand pockets are Cameroon (1,977 impressions, 0.10% CTR), Senegal (1,075, 0.37%), Côte d'Ivoire (1,057, 0.09%), Tunisia (1,011, 0.10%), France (825, 0.24%), Morocco (765, 0.13%) and Algeria (614, 0.16%). These table totals are not the complete GSC denominator, but they reinforce an Africa-first, mobile-first CTR and product-quality program rather than a France-only publishing plan.

## What was wrong

### 1. Hreflang had historical defects, but the current graph is valid

The overlapping locale-impressions session retired 394 French English-iframe wrappers and 723 false reciprocal relationships. The current validator represents 11,499 public pages, 9,915 pages with declared hreflang, 32,376 relationships, and 5,224 equivalence groups with no invalid native equivalent, canonical, locale, or reciprocity error.

Conclusion: do not spend the next growth cycle repeatedly rewriting valid hreflang. Keep the validator as a release gate and move effort to qualified demand, snippets, sources, and native behavior.

### 2. The French fuel family was attracting demand with English content

The family earned 29 clicks from 13,225 impressions at about 0.22% CTR, up from 16 clicks and 3,544 impressions. GSC exposed mixed queries such as English “gas prices near me” alongside French country fuel searches. The French URLs contained English copy/schema and were covered by an explicit English-fallback exemption.

All 54 country pages now have native French titles, body copy, FAQ, Dataset/ItemList/Breadcrumb schema, country names, date formatting, related links, and localized planner output. The fallback exemption is retired. Source freshness validation passes for all 54 legacy rows and the maintained-market ledger.

### 3. The highest-impression article had weak query alignment and unsupported claims

`/fr/blog/frais-orange-money-guide-2026/` earned 54 clicks from 14,247 impressions at 0.38% CTR and average position 8.0. The largest visible query cluster is explicitly Cameroon withdrawal tariffs for 2026, while the previous article mixed unsourced country tables and continental claims.

The article now answers that intent in the title and opening, separates Cameroon, Senegal, Mali, and Côte d’Ivoire, links each official Orange source, records the verification date, and removes unsupported user-volume and Western Union comparisons.

### 4. A page marked “native French” still leaked English across every search layer

`/fr/blog/mobile-money-fees-africa-compared/` earned one click from 870 impressions at position 8.71. Its old title contained “compares”, its BlogPosting/FAQ/Breadcrumb schema was English, its visible breadcrumb, metadata, FAQ, author card, related cards, and SEO cluster contained English, and its body asserted unsourced continental winners and user totals.

A dedicated French editorial owner now rebuilds the page after i18n generation. It uses official Orange Cameroon, Orange Senegal, MTN Uganda, Airtel Uganda, and Safaricom sources; keeps cross-currency comparisons honest; removes the fallback exemption; restores French content IDs and asset paths; and has a 390 px browser regression test.

### 5. A ranking Wave/Orange comparison had its core tariffs reversed

`/fr/blog/wave-vs-orange-money-senegal-2026/` earned 10 clicks from 791 impressions at position 7.68. The old article asserted that Wave transfers were free and withdrawals cost 1%, claimed the reverse for Orange Money, declared the services non-interoperable, and cited no external source. Current first-party pages show Wave advertising free deposits/withdrawals and 1% transfers, while Orange Senegal advertises wallet operations without operator fees and withdrawals at 1% capped at 5,000 F CFA. Orange also documents a separate 0.5% Senegal transaction tax, capped at 2,000 F CFA, for affected operations since December 2025.

The article now separates provider fees from tax, removes the unsupported network-size and universal-interoperability claims, links first-party Wave, Orange Senegal, and BCEAO sources, records the verification date, and tells users to compare the final pre-confirmation total. A focused regression test locks the corrected direction of the tariffs, schema, source set, and snippet length.

### 6. The Senegal IRPP article contradicted the official family-parts table

`/fr/blog/guide-irpp-senegal-2026/` earned 5 clicks from 368 impressions at position 7.52. It published no external source, omitted the 43% top band, assigned 2 parts to a married taxpayer without children without stating the one-income condition, and used that assumption in invented worked examples. The published CGI table starts that situation at 1.5 parts and describes a separate half-part rule when only one spouse has taxable income.

The rebuilt guide now carries all seven published bands, links the Ministry of Finance, DGID parts simulator, DGID procedures, and DGTSS IPRES report, removes the unsafe examples, and states the actual calculator boundary: it estimates IRPP before the family-charge reduction. The Senegal calculator and country hub now link back to the guide, turning a two-page orphan edge into a reciprocal source-and-tool path. A source/schema/content test and the 390 px browser suite lock this contract.

### 7. French discovery used English country labels

The registry generator used English country names for generated French energy, insurance, contract, solar, and fuel rows. It now reads `displayNames.fr` from the country registry. The generated registry and `/fr/all-tools/` directory now expose native labels such as Cameroun, Maroc, Tunisie, Algérie, Guinée, Gambie, and Mauritanie. The repair covers 406 generated rows across ten families and fixes a parent-row deletion/reinsertion defect in the generator.

### 8. The curated French blog hub omitted a proven native route

GSC listed 46 French blog URLs receiving at least one table row that were absent from the curated French blog manifest. Most are deliberate noindex English fallbacks or older native-looking pages without sufficient source proof, so bulk promotion would be unsafe. The repaired `/fr/blog/mobile-money-fees-africa-compared/` route is the exception: it is now source-owned, native, tested, and already earned 870 impressions. It has been added to the French blog manifest and regenerated hub, increasing the curated native catalog from 41 to 42 guides without legitimizing the fallback inventory.

### 9. The Senegal calculator carried a second, contradictory tax engine

The live calculator correctly delegates to the shared Senegal PAYE engine, whose seven IRPP bands include the 43% band above 25 million F CFA. The same HTML file also retained an unused inline `calcAnnualPAYE` implementation that stopped at 40% above 13.5 million F CFA. It did not drive current results, but it was a dangerous second owner that could be reconnected during a future UI edit and silently disagree with the guide and server engine.

The obsolete function has been removed. The PAYE regression suite now verifies the browser engine, server engine, public calculator page, 43% band, IPRES ceiling, and excluded family-reduction boundary as one contract.

### 10. Teacher-salary impressions were landing on the wrong product promise

`/fr/tools/salaire-enseignant/` earned 6 clicks from 495 impressions at position 7.62. The visible query sample is dominated by national salary-grid searches, including Togo and Niger, while the page is intentionally a deterministic calculator for a user-entered offer, allowances, deductions and workload. Its old “Feuille de rémunération enseignante” snippet did not make that boundary clear enough.

The generator, page metadata, schema, heading and registry now call the product a `Calculateur de salaire enseignant` and name the real outputs: monthly gross, entered net deductions, annual total and hourly rate. The copy explicitly refuses to invent a national scale. A focused test prevents either search copy or discovery metadata from drifting back into an unsupported salary-grid claim.

### 11. The Algeria salary page ranked with an incomplete tax model and unsafe data paths

`/fr/algerie/calculateur-salaire-net` earned 1 click from 359 impressions at position 10.87, versus 3 clicks from 153 impressions in the preceding period. Impressions more than doubled while CTR fell from 1.96% to 0.28%. Repository inspection found that the page displayed the current six IRG bands but calculated the raw progressive amount without the DGI salary abatements: the monthly exemption through 30,000 DA, the 40% abatement bounded between 1,000 and 1,500 DA per month, and the special 30,001 to 35,000 DA formula. It also showed a 26% employer CNAS contribution, while the CNAS general case is 25% employer, 9% employee and 0.5% for social works. Exact salaries were silently posted to an AI endpoint, and the primary PDF path required email and posted the gross salary.

A dedicated Algeria engine now owns the browser and Netlify calculations. It applies the six DGI bands, monthly employee rules and both abatement paths, exposes the before/after IRG amounts, uses the CNAS general-case split, and states the exclusions for non-monthly pay, disability/pension regimes and employer reductions. The page links the official [DGI salary IRG guidance](https://www.mfdgi.gov.dz/fr/particuliers/irg-traitements-et-salaires) and [CNAS employer rates](https://cnas.dz/fr/employeur/), both checked on 17 August 2026. Calculation and PDF export are now local with no AI salary transmission or email gate. Seven focused tests lock official boundary cases, source links, server/browser parity, privacy and the removal of the stale inline engine.

### 12. The Burkina Faso VAT page denied an official reduced rate

`/fr/burkina-faso/calculateur-tva` earned 2 clicks from 206 impressions at position 8.26. The visible query table includes `tva au burkina` and `taux de tva au burkina faso`, both with zero clicks in the current period. Its title and calculator exposed only 18 %, while its FAQ stated that Burkina Faso had no true reduced VAT rate. The DGI's published CGI says in Article 317 that the standard rate is 18 % and that a 10 % rate applies to accommodation and restaurant services supplied by approved hotels, restaurants and similar establishments. The DGI VAT declaration form also exposes separate 18 % and 10 % rows.

The page now answers both rate intents in its snippet and schema, keeps 18 % as the default, and exposes 10 % only after the user confirms the qualifying service and approved establishment. It links the [DGI CGI](https://dgi.bf/verification/CGI) and [official VAT declaration form](https://dgi.bf/wp-content/uploads/2023/10/DECLARATION-DE-LA-TAXE-SUR-LA-VALEUR-AJOUTEE.pdf), records the 17 August 2026 review, and removes unsupported broad exemption claims. Static and mobile tests lock the Article 317 wording, evidence gate, arithmetic, source owner and local-only behavior.

### 13. “Fully translated” and “native product” are not the same denominator

The French surface audit initially classified 3,240 indexable pages as 1,794 native pages and 1,446 localized shells. After consolidating two duplicate root-level French articles into their maintained `/fr/` owners, the truthful denominator is 3,238: 1,792 native pages and 1,446 localized shells. A shell can be legitimate when French controls wrap a shared deterministic engine, so this label is not itself an error. A narrower inventory found 264 indexable pages owned by `scripts/generate-fr-tool-gap-pages.js`; 262 are preparation pages that hand off to a fuller English route rather than completing the workflow in French.

This class is real product debt, but it is not the present impressions blocker. Only 23 of the 264 explicit gap pages appear in the exported GSC page table, together earning 4 clicks from 148 impressions. One route contributes 114 impressions, `/fr/tools/calculateur-de-tarif-independant-senegal/`, but 104 visible query impressions are navigational searches for `artdecosenegal.com`, not demand for a freelancer-rate calculator. A blanket noindex or emergency translation wave would therefore sacrifice scope without addressing the current qualified-demand clusters. Keep these routes out of the “native tool” success denominator, then promote or consolidate them only when GSC shows relevant intent and the workflow can finish in French.

### 14. The RDC salary guide ranked by inventing the answer it could not source

`/fr/blog/salaire-moyen-rdc-2026/` earned no clicks from 99 impressions at position 7.46, compared with no clicks from 246 impressions at position 8.16 in the preceding period. It promised a 2026 salary average, then generated sector ranges as high as 14 million CDF and automatic city multipliers without a cited wage survey or an official source for those figures.

The guide now gives the current answer that can be substantiated: Decree No. 25/22 sets the ordinary-worker SMIG at 21,500 CDF per day from January 2026 and uses category coefficients to create the salary tension. A local checker compares a user-entered offer with that daily rate, paid days and an explicit coefficient. It does not infer a job category, sector average or city premium. The page links the official [RDC work directory publication](https://annuairetravail-rdc.cd/detail?slug=decret-n-25-22-du-30-mai-2025-portant-fixation-du-salaire-minimum-interprofessionnel-garanti-des-allocations-familiales-minima-et-de-la-contre--valeur-du-logement) and the [DGI IPR guidance](https://www.dgi.gouv.cd/impot-professionnel-sur-les-remunerations-ipr/), states that the result is gross rather than net, and keeps calculation, copy and download local. Static and mobile tests lock the official rate, formula, source, no-invented-range boundary and 390 px behavior.

### 15. The Nigeria salary article fabricated a market dataset and the product behind it

`/fr/blog/average-salary-nigeria-2026/` earned no clicks from 48 impressions at position 7.62, compared with no clicks from 45 impressions at position 7.93. The article published precise sector ranges up to 5 million NGN, remote engineering ranges up to 10 million NGN, automatic city premiums, cost-of-living thresholds and claims that foreign remote work paid two to five times more. It had no external source. It also told readers that AfroTools compared them with anonymized salaries from other Nigerian professionals, while the linked product is actually a private worksheet that only compares two user-entered offers.

The rebuilt guide answers with what official evidence supports: the 70,000 NGN national minimum signed in 2024, the scope boundary that must be checked in the applicable text, the NBS labour-force survey and the NSIWC public-sector circular catalog. It explains why raw NBS response categories cannot be presented as a weighted national average, removes every unsupported sector, city and remote-work number, and gives a reproducible method for building a dated comparable-offer sample. Handoffs now point to the real private [salary offer comparator](/fr/tools/comparateur-salaires/) and canonical [Nigeria PAYE calculator](/fr/nigeria/ng-salary-tax). Static and mobile tests lock the sources, removed figures, honest tool boundary and 390 px behavior.

### 16. The South Africa salary guide missed both current official numbers

`/fr/blog/average-salary-south-africa-2026/` earned no clicks from 57 impressions at position 14.26, compared with one click from 50 impressions at position 14.80. It had no external source, published invented sector and city salary tables, stated a 2026 minimum of R27.58 per hour, and told users that agricultural and domestic workers generally had lower rates. The February 2026 Gazette instead sets R30.23 per ordinary hour from 1 March for the national rate, agricultural workers and domestic workers alike. It gives R16.62 as the separate EPWP rate.

The rebuilt guide now gives the two current official answers without merging their denominators. Stats SA reports average monthly earnings of R29,997 in February 2026 for employees in the formal non-agricultural QES population; the Gazette sets the hourly legal floor. The page explains that the QES figure is an arithmetic mean, not a national median or net salary, and uses the ministry's own 40-hour and 45-hour monthly illustrations. It links Stats SA, the Gazette and the official flyer, then hands users to the canonical South Africa PAYE calculator and private two-offer comparator. Static and mobile tests lock the figures, populations, links, removed stale rate and 390 px behavior.

### 17. Visible encoding damage also existed in the discovery source

`/fr/tools/suivi-carburant/` earned 3 clicks from 683 impressions at position 7.68, up from no clicks and 77 impressions at position 9.94. A live fetch on 17 August confirmed that its proof panel visibly rendered `d?rive`, `Re?us`, `autorit?`, `Source ? vérifier` and `Point ? confirmer`. The same old panel corruption existed on `/fr/tools/cout-employe/`. Existing Unicode checks did not catch question-mark replacement because `?` is valid ASCII.

Both panels now contain the intended French words and accessible labels. A full audit then found a malformed medical-tax FAQ and 23 damaged French descriptions in the tool registry. Those registry descriptions are discovery owners used by dynamic search, related-tool data and generated directories; only two happened to be pre-rendered on the current French developer directory. The registry owner, affected FAQ and generated directory are repaired.

The new `audit:fr-visible-mojibake` gate strips non-visible script, style, SVG and template content, scans every indexable French HTML page, and rejects replacement characters, common UTF-8-as-Latin-1 damage, damaged proof labels and question marks embedded inside French words. It currently passes all 3,247 indexable pages out of 3,885 French HTML files. Its token rule deliberately distinguishes `fran?ais` from legitimate query strings such as `/api/rates?metric=price`.

### 18. The French Mobile Money tool stopped being French at the first interaction

`/fr/tools/frais-mobile-money/` earned 3 clicks from 188 impressions at position 11.67, up from one click and 126 impressions at position 14.84. Its metadata and every static label dropped French accents. The visible trust badges were English, the manual comparator used English legends, transaction choices and privacy instructions, and calculated results exposed English country names, caveats, rule text, status messages, internal fee-component keys and raw error codes. The page also presented a broad country-and-provider promise even though its verified built-in catalog currently contains only MTN Uganda and Airtel Tanzania.

The generator now names that exact catalog boundary in the title and description, restores native French labels throughout the static form, renders Ouganda and Tanzanie, and links the calculator to the three source-reviewed French Mobile Money guides. Runtime result, unavailable and error states now translate the country, rule, caveat, fee-component and reason-code layers rather than switching back to English after submit. The local user-entered quote comparison and JSON export remain intact. Four focused Chromium tests cover tariff calculation, the native French result and unavailable states, 375 px overflow and local export.

### 19. The route contract advertised 142 French widget pages that no sitemap could discover

Before canonical consolidation, the route graph classified 3,240 French pages as indexable and sitemap-eligible, but `sitemap-fr.xml` contained only 3,095 URLs. Cross-sitemap reconciliation found that 142 self-canonical `/fr/widgets/{slug}/` parent pages were absent from every sitemap. These are the public French explanation and integration pages generated by `scripts/generate-fr-widget-parent-pages.js`, not the technical iframe utilities. The French localization strategy explicitly makes that parent page the promotable surface and keeps only iframe routes out of SEO discovery.

The sitemap walker excluded any nested directory named `widgets`, although its comment described a root non-content exclusion. It now applies that exclusion only to the root `/widgets/` embed tree and passes nested locale pages through the existing canonical, robots and route-contract gates. After the separate two-route canonical consolidation, `sitemap-fr.xml` contains all 3,238 remaining indexable French routes. A focused regression test inventories every generated French widget parent and proves that it is present while every `/fr/widgets/iframe/` utility remains absent.

### 20. Two stale French salary articles competed outside the `/fr/` measurement filter

The route graph exposed two pairs where both a root-level French article and its `/fr/blog/` counterpart were independently indexable: Senegal net salary and RDC average salary. The legacy Senegal article still published a five-band IRPP model ending at 37 %, while the maintained French owner uses all seven bands through 43 %. The legacy RDC article still published the obsolete 7,075 CDF daily SMIG, unsourced sector and city salary tables, cost-of-living claims and precise employer ranges, while the repaired owner uses the current official 21,500 CDF daily floor and refuses to invent market data. Because the GSC evidence filter was `/fr/`, any cannibalization or impressions on the root routes were invisible in the headline French baseline.

Both legacy routes now resolve in one forced 301 hop to the maintained `/fr/blog/` owner through explicit equity-preserving route-policy decisions. Route synchronization removed both legacy URLs from the indexable and sitemap denominators and rewrote three internal links. The RDC registry row and French blog-hub card also now describe the sourced SMIG checker instead of promising sector and city market data. Focused tests lock redirect state, final destination, sitemap exclusion, canonical owner indexability and discovery copy.

### 21. French pages sent hundreds of navigation links back to English hubs

The old `fix-fr-internal-links.js` reported 909 English targets but could not distinguish a localization leak from an honest handoff to an English-only workflow. A route-aware review found an even larger mixed set and confirmed that broad prefix replacement would be unsafe. French car pages, for example, deliberately label the English directory or full app they open.

A new deterministic owner therefore repairs only an explicit high-confidence navigation set: home, tools, blog, health, insurance, transport, engineering, developer, API, AI, privacy, terms, legal, contact, business enquiry, custom calculator and selected country/category hubs. It rewrote 493 breadcrumb, logo, category, privacy and support links across 318 French files while preserving the query string or fragment. Anchors explicitly labelled as English or `anglais` remain untouched. The repair runs after static internal-link injection in the SEO build, has a no-write drift check, and passes a regression test that proves both French navigation and honest English handoffs.

### 22. Materially rebuilt French pages still advertised June modification dates

The sitemap generator intentionally preserves historical `<lastmod>` values, but it had no narrow way to record a reviewed content rebuild. As a result, the Orange Money, Mobile Money, Wave, Senegal IRPP, Algeria payroll, Burkina VAT and salary-guide repairs in this work still advertised dates from 18 to 23 June. The 54 rebuilt fuel country pages likewise retained 21 June. A global refresh would falsely restamp thousands of unchanged URLs and violate the repository's SEO maintenance contract.

A source-owned override registry now records only routes whose search-facing content changed materially. The sitemap owner validates every selector and date, takes the later of the historical and reviewed date, and supports a prefix only for the one generator-owned fuel family that was rebuilt in full. The 11 exact repaired routes plus the fuel hub and all 54 country pages now expose 17 August 2026, while unrelated French and English routes retain their historical values. A regression test proves the covered routes, the 55-page family denominator, stated reasons and the absence of broad `/`, `/fr/`, `/fr/tools/` or `/fr/blog/` restamps.

## Current validation

- 9,818 indexable EN/FR/SW pages in the snippet audit; 0 hard errors.
- 3,238 indexable French pages: 1,792 native and 1,446 localized shells after two duplicate root-level French salary articles were consolidated. A localized shell is a French route/UI around a shared deterministic engine, not automatically an English fallback.
- 42 source-reviewed guides are now linked from the French blog hub; the newly admitted route has a manifest and hub-link regression check.
- 152 French editorial length-review signals remain; these are review candidates, not canonical/hreflang errors.
- 11,721 HTML pages pass content integrity with 0 blockers and 0 warnings.
- 11,727 pages and 141,477 internal links pass with 0 broken links.
- Twelve French hotspot browser tests pass at 390 px with no overflow, missing resources, or console errors. The refreshed Wave/Orange and Senegal IRPP articles also have four-part source/snippet/schema regression tests, seven Senegal PAYE engine/page checks pass, three teacher-salary search-contract checks pass, three Burkina VAT source/search/evidence checks pass, three checks each cover the RDC, Nigeria and South Africa salary guides, three visible-mojibake checks pass, and seven Algeria PAYE correctness/privacy checks pass.
- The repository-wide visible-mojibake audit passes all 3,247 indexable French pages and the French registry contains no remaining letter-question-letter corruption.
- The Mobile Money finder passes its static owner contract and four Chromium flows, including native French calculated and unavailable states at mobile width.
- `sitemap-fr.xml` contains all 3,238 remaining indexable French routes; 142 previously omitted public widget parent pages are now included, two stale duplicate salary articles are excluded, and technical French iframe utilities remain excluded. Both focused sitemap and canonical-consolidation suites pass.
- Sixty-six materially rebuilt French routes now expose a reviewed 17 August 2026 sitemap modification date without restamping unchanged routes. The selective freshness contract passes its focused suite.
- 493 high-confidence French navigation links across 318 files now remain inside the French home, hub, legal and support graph. Explicitly labelled English workflow handoffs are preserved, and the navigation drift test passes.
- The calculation-quality gate passes for 788 artifacts and 307/307 golden fixtures after accepting the reviewed Algeria browser/server/route changes, Senegal route digest and Burkina VAT route mapping. The Algeria and Burkina source-registry rows pass selected-entry checks without rewriting unrelated freshness records.
- French surface, registry, progressive-directory, iframe-retirement, sports-parity, localization, and Unicode contracts pass.

## Path toward 10,000 daily clicks

The target should be managed as a portfolio scoreboard, not as a forecast.

| Gate | Required outcome | Leading indicators |
|---|---|---|
| 100 French clicks/day | Recover existing page-one CTR and remove remaining false-native hotspots | Top 20 impression pages; non-brand CTR; source coverage; browser-native status |
| 500 French clicks/day | Publish verified country-intent clusters modeled on the healthy salary pages | New qualified impressions; pages with >2% CTR; indexed source-backed routes |
| 2,000 total clicks/day | Add authority and breadth beyond calculators | Referring domains; repeat users; branded demand; topical cluster coverage |
| 10,000 total clicks/day | Sustain roughly 200k–333k qualified daily impressions at a 3–5% portfolio CTR | Weekly clicks, qualified impressions, top-3/top-10 share, source freshness, conversion to useful tool actions |

### Next three growth bets

1. **Finish the high-impression French queue, not the longest title queue.** Use GSC impressions × CTR gap × source confidence to select pages. Wave/Orange Senegal, IRPP Senegal, VAT Burkina Faso and the unsafe RDC, Nigeria and South Africa salary guides are now repaired; continue with the remaining highest-impression VAT country routes and only sourceable salary intents.
2. **Scale the patterns that already win.** Madagascar, Guinea, Benin, and Mali salary pages are producing 3–6% CTR. Expand adjacent payroll questions only where a current national source and deterministic engine exist.
3. **Build authority around useful country decisions.** Create source-backed French clusters for payroll, VAT, mobile money, fuel, and business documents; connect each article to a working tool and an official-source freshness contract. Avoid mass pages whose only distinction is a translated country name.

The spreadsheet-ready opportunity ledger is in `reports/french-search-growth-opportunities-2026-08-16.csv`.
