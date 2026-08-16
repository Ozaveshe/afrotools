# French organic-search growth review — 16 August 2026

## Outcome

French search is not invisible, and hreflang is not the present blocker. In the last 28 days, `/fr/` earned **450 clicks from 46,066 impressions**, a **1.0% CTR**, and an average position of **8.9**. Clicks grew 65% and impressions roughly doubled versus the preceding 28 days, while CTR fell from 1.2% to 1.0%.

The urgent problem was search-product quality inside the impression growth: high-impression French routes still exposed English body copy or schema, generic snippets, unsupported tariff claims, and English country names in discovery surfaces. This pass repaired the three largest confirmed low-CTR clusters and added deterministic owners so broad rebuilds cannot silently reverse the fixes.

## Evidence boundary

- Search evidence: authenticated Google Search Console exports for the 28 days ending 15 August 2026, plus the preceding 28-day comparison.
- The headline chart is complete. GSC page/query/country/device tables are capped or anonymized; table sums are therefore treated as directional subsets, not a full denominator.
- Repository evidence is not deployment evidence. This report records the validated branch state only.
- No ranking, traffic, or 10,000-click outcome is guaranteed.

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

### 5. French discovery used English country labels

The registry generator used English country names for generated French energy, insurance, contract, solar, and fuel rows. It now reads `displayNames.fr` from the country registry. The generated registry and `/fr/all-tools/` directory now expose native labels such as Cameroun, Maroc, Tunisie, Algérie, Guinée, Gambie, and Mauritanie. The repair covers 406 generated rows across ten families and fixes a parent-row deletion/reinsertion defect in the generator.

## Current validation

- 9,818 indexable EN/FR/SW pages in the snippet audit; 0 hard errors.
- 3,240 indexable French pages: 1,794 native and 1,446 localized shells. A localized shell is a French route/UI around a shared deterministic engine, not automatically an English fallback.
- 152 French editorial length-review signals remain; these are review candidates, not canonical/hreflang errors.
- 11,721 HTML pages pass content integrity with 0 blockers and 0 warnings.
- 11,727 pages and 141,479 internal links pass with 0 broken links.
- Three French hotspot browser tests pass at 390 px with no overflow, missing resources, or console errors.
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

1. **Finish the high-impression French queue, not the longest title queue.** Use GSC impressions × CTR gap × source confidence to select pages. Start with Wave/Orange Senegal, teacher salary, IRPP Senegal, and the highest-impression VAT country routes.
2. **Scale the patterns that already win.** Madagascar, Guinea, Benin, and Mali salary pages are producing 3–6% CTR. Expand adjacent payroll questions only where a current national source and deterministic engine exist.
3. **Build authority around useful country decisions.** Create source-backed French clusters for payroll, VAT, mobile money, fuel, and business documents; connect each article to a working tool and an official-source freshness contract. Avoid mass pages whose only distinction is a translated country name.

The spreadsheet-ready opportunity ledger is in `reports/french-search-growth-opportunities-2026-08-16.csv`.
