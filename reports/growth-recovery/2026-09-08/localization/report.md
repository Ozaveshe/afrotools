# French money workflow recovery

Baseline: fetched `origin/main` `9b29eab0408eedd9442c98c2cabf567098da80ab`, 8 September 2026. Worktree: `C:/Users/Oza/.codex/worktrees/3466/afrotools`; branch: `codex/growth-fr-money-20260908`. Implementation commit is recorded in `handoff.json`.

This wave repairs three existing French routes. It does **not** establish complete French, Swahili, Hausa or Yoruba parity. All new language copy remains **pending-human-review**; local task tests establish behavior, not native-speaker editorial approval. Existing acceptance registries are preserved.

## Demand and ownership

The coordinator's September 7 dashboard observations recorded 14,627 impressions and 35 clicks for the French Orange Money guide, versus 54 clicks in the previous period. This is historical demand evidence, not today's analytics or proof that these changes improve CTR.

| Route | Source owner and repair | Fresh acceptance boundary |
| --- | --- | --- |
| `/fr/blog/frais-orange-money-guide-2026/` | Hand-authored `fr/blog/frais-orange-money-guide-2026/index.html`; both primary CTAs explain Orange tariffs are not embedded and lead to the manual French form | Mobile reading and CTA-to-comparison task tested; article's existing tariff review date retained |
| `/fr/blog/mobile-money-fees-africa-compared/` | `lang/pages/blog/mobile-money-fees-africa-compared/fr.body.html` and `scripts/build-french-mobile-money-editorial.js`; clarify integrated providers and manual comparison | Generated body/owner roundtrip and mobile discovery tested |
| `/fr/tools/frais-mobile-money/` | French branches of `scripts/build-mobile-money-fee-finder.js` and `assets/js/pages/mobile-money-quote-parity.js` | French tariff, validation, expiry, comparison, copy, JSON, reset, unavailable-catalog and mobile flows tested |

The Orange guide has a historical metadata pack at `lang/pages/blog/frais-orange-money-guide-2026/fr.json`, whose broad title/description are stale. It has no corresponding English article source, so `build-i18n.js` skips it even with an explicit overwrite request. The roundtrip regression proves current title/body survive that path. The stale pack remains metadata-owner debt; it must be reconciled before anyone creates an English counterpart or changes the source resolver.

Relevant pending branches were checked against main: the fee-finder branch, French growth execution branch, and old parity foundation PR #61 contain no ahead-of-main changes to the selected files. No pending fix was recreated.

## Behavior fixed

- Expiry results and copied summaries now use `Expiré`, `Non expiré` and `Expiration non renseignée`. Unknown expiry is not represented as guaranteed freshness.
- The JSON export has a French filename and readable French summary including country, amount, fees and verification date. Existing schema-v1 machine keys, methodology code and result enums remain compatible; English codes inside machine data are not UI translations.
- Denied/unavailable clipboard access yields French feedback with a JSON alternative. Validation focuses actual invalid controls; future verification and reversed expiry dates receive French errors. Reset disables/hides the third quote and clears stale errors/results.
- French country names and ISO2 aliases resolve through read-only `data/registry/countries.json`; unknown countries and mixed-country quotes are rejected with accessible French feedback. Quotes remain in the form. Currency and operation stay independent from language. The French form uses the country registry's African scope explicitly.
- French tariff source captions, validation and unavailable states are readable; changing provider/inputs clears stale results. Official URLs and calculation engines/rates are unchanged. Published tables and a French form limitation remain available without JavaScript.
- Visual review found a dark heading on a dark hero and pale caution text on a pale background. French-only generator CSS now gives both readable contrast, with an axe color-contrast check and empty-form mobile screenshots. Shared CSS is unchanged.
- Both articles explicitly distinguish the integrated MTN Uganda/Airtel Tanzania catalog from manually entered Orange Money quotes. This wave adds no Orange tariff engine or provider coverage.

## Coverage interpretation

`coverage.json` is reproducible using `node reports/growth-recovery/2026-09-08/localization/inventory.cjs`. It inventories all four locales against the existing 1,255 English free-app denominator, separately from page-policy counts. It records every app's mapping and verification status.

| Locale | Existing free-app ledger | Fresh work in this wave | Acceptance interpretation |
| --- | --- | --- | --- |
| French | 1,255 native candidates; 1,255 recorded accepted | One app's focused core workflow and two article journeys | July category-derived acceptance did not prevent the observed expiry/export/focus defects; remaining apps not browser-verified this wave |
| Swahili | 588 native candidates, 666 shell candidates, one missing; 1,254 recorded accepted | Fee-comparator export regression only | Existing acceptance evidence remains historical; no new full-flow language acceptance |
| Hausa | 71 owners mapped: 9 native, 56 shell, 6 fallback; 1,184 without established owner evidence | Inventory only | No free-app acceptance registry found in this baseline; no new browser or editorial acceptance |
| Yoruba | 36 owners mapped: 2 native, 13 shell, 3 fallback, 18 unavailable; 1,219 without established owner evidence | Inventory only | No free-app acceptance registry found in this baseline; fallbacks/unavailable routes remain incomplete |

The page-policy baseline contains FR 2,183 native / 1,618 shell / 1 deprecated; SW 762 native / 827 shell / 5 fallback; HA 22 native / 58 shell / 25 fallback; YO 9 native / 13 shell / 3 fallback / 20 unavailable. These include articles, hubs, widgets and utilities. They are **not** app-completion counts. A shell policy can wrap a working neutral engine, so it is an inspection queue, not automatic proof of a broken translation. Conversely, a native label is not current end-to-end proof.

For HA/YO, `missing-owner-evidence` means no equivalence/fallback/registry-source/hreflang mapping was established, not proof that no physical translation exists. Mapping and source-owner reconciliation should precede new pages to avoid duplicates.

## Next bounded waves

1. **Swahili:** establish the missing `/tools/paye-authority-finder/` equivalent, then audit `/sw/zana/ada-pesa-simu/` and its local remittance companion through expiry, validation and parsed exports. The selected shared runtime still emits raw expiry enums for Swahili; this was observed in the regression test and deliberately kept outside the approved French repair.
2. **Hausa:** native-speaker-assisted core-flow review of `/ha/kayan-aiki/kudin-tura-kudi-ta-waya/`, `/ha/kayan-aiki/kwatanta-aika-kudi/` and `/ha/kayan-aiki/canja-kudi/`. These are declared shells. Inspect `ha/assets/ha-surface.js` and the route-first owners before adding anything; require country/currency, stale/empty/error and copy/export task proof. Preserve existing explicit fallback pages until accepted replacements exist.
3. **Yoruba:** prioritize the existing explicit fallbacks `/yo/awon-ise/naira-si-oro/`, `/yo/awon-ise/kalkuletan-vat/` and `/yo/awon-ise/amulo-data/`. Use `data/registry/yoruba-route-manifest.json` plus their route owners; require reviewed Yoruba number/diacritic terminology and parser-checked exports. Naira-to-words is a useful money-workflow candidate based on the coordinator's English acquisition evidence, not measured Yoruba demand. Keep fallback/noindex truth until functional review succeeds.
4. **French tax follow-up:** canonical registry mappings verified for `mg-paye` -> `/fr/madagascar/calculateur-salaire-net/` and `cnps-guide` -> `/fr/tools/guide-de-la-cnps-en-cote-d-ivoire/`. Both have older recorded acceptance; neither received a fresh task review here. CNPS is an editorial guide with no payroll calculation/filing, not a calculator to translate. Recheck dated official sources before a separate tax wave.

## Residual shared-engine defect

`assets/js/engines/mobile-money-quote-engine.js`, `build()` constructs `comparisonKey` from currency, transaction type and amount, excluding market. Two synthetic quotes for Senegal and Mali, both XOF/send/10,000 with fees 100 and 50, produce one eligible group and a 50 XOF minimum. The French UI now rejects this pair; English/Swahili retain baseline behavior as authorized. A future shared-engine change needs consumer/schema review and all-locale tests. This wave does not silently change that shared engine.

## Proof and limits

Validation outcomes and source/generated lists are recorded in `handoff.json`. Browser data was synthetic; downloads were parsed locally and no entered values were submitted to an API. No database operation, provider mutation, payment, merge, deployment or outbound message occurred, apart from authorized coordination with the owner task.

The full `build:deploy` passed. Final scoped generation and the owner analytics/provenance/cache steps were followed by a fresh `build-dist.js` artifact and artifact audit. Twelve incidental tracked build outputs were restored; EN/SW cache-reference output was also restored to keep the agreed source boundary. Four pre-existing malformed JAMB documents were skipped by the analytics injector; its eligible-page coverage passed. An intermediate content check caught the fee page's missing generated provenance marker after regeneration; its owner script restored it. No global manifest, registry, analytics source or stylesheet change is included.

Official Orange Cameroon and Senegal pages were read on September 8 and supported the corresponding existing cited tariff models. Other operator tariffs and verification dates were not refreshed. Existing August article/catalog review dates remain explicit. No current-GSC/Bing, live-production calculator or post-deploy acceptance claim is made.

Source references: [Orange Cameroon](https://orangemoney.orange.cm/fr/tarification-orange-money.html), [Orange Senegal](https://www.orange.sn/assistance/tutoriels/lancement-du-nouveau-modele-orange-money-0).
