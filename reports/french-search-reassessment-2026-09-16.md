# French free-app search reassessment — 2026-09-16

## Observed Search Console baseline

Read from the existing signed-in Edge **domain property `sc-domain:afrotools.com`**; no separate French property was created. Web search, all countries/devices, page URLs containing `/fr/`. Current period **2026-08-18–2026-09-14**, compared with **2026-07-21–2026-08-17**. UI reported last update six hours ago. Numbers below are transcribed observations, not an API/export receipt; aggregate K values and CTR/position are UI-rounded. Filtered chart/table totals can be partial. The comparison chart accessibility date text was malformed, so dates were read from the Date range dialog instead.

| Scope | Clicks previous → current | Impressions previous → current | CTR previous → current | Position previous → current |
|---|---:|---:|---:|---:|
| All `/fr/` pages | 444 → 463 | 48.4K → 54.8K | 0.9% → 0.8% | 8.9 → 9.2 |
| `/fr/tools/suivi-carburant/tunisia/` | 2 → 11 | 1,202 → 3,947 | 0.2% → 0.3% | 7.1 → 9.5 |
| `/fr/tools/suivi-carburant/togo/` | 0 → 6 | 445 → 1,986 | 0% → 0.3% | 8.5 → 8.7 |
| `/fr/tools/suivi-carburant/mali/` | 1 → 6 | 587 → 1,854 | 0.2% → 0.3% | 9.7 → 7.4 |

Selection: Pages table sorted by current impressions. These are the highest-impression free-app country pages in the observed leading rows, excluding blogs; not three independent tool engines. CV, remittance and leave were excluded from edits. All three selected pages gained clicks and impressions versus the prior period; this reassessment does **not** establish a decline caused by earlier repairs. Low CTR and ranking/query mix are observations, not proof of a snippet defect or a causal uplift opportunity.

Exact-page query samples, current period (clicks / impressions / CTR / position):

- Tunisia: `prix essence tunisie` 0 / 385 / 0% / 9.6; `prix gasoil tunisie` 3 / 225 / 1.3% / 9.7; `prix litre essence tunisie` 0 / 188 / 0% / 10.2; `prix gasoil normal tunisie aujourd hui` 1 / 37 / 2.7% / 10.4.
- Togo: `prix du carburant au togo` 0 / 275 / 0% / 9.5; `prix de l'essence au togo` 2 / 105 / 1.9% / 8.1; `prix du carburant au togo aujourd hui` 0 / 80 / 0% / 8.6. `gas prices near me` also appeared, 0 / 109 / 0% / 5.1, demonstrating mixed intent; no station-location capability is inferred.
- Mali: `prix du carburant au mali` 0 / 171 / 0% / 7.7; `le prix du carburant au mali` 0 / 122 / 0% / 8.4; `prix essence mali` 1 / 52 / 1.9% / 5.8; `prix du litre d'essence au mali` 1 / 27 / 3.7% / 5.7.

These samples are not exhaustive query totals. No account identifiers, tokens, private browser state, or raw Search Console page export are saved in this report.

## Page and intent comparison

Read maintained source at coordinator `718a4795427ab960edb57fab495df63b970802c2` in a new isolated tree. Fresh `git fetch origin main` succeeded; observed `origin/main` was `0656bb1053a25b45a538cd65b1d92edff86423b9`. Existing leave tree preserved.

- EN `/tools/fuel-tracker/{tunisia,togo,mali}/`: country snapshot with petrol/diesel/LPG, local currency and USD comparison, generator estimate and comparison links. Title names fuel types; description embeds numeric snapshot prices without its date. Do not copy that freshness weakness into French.
- FR corresponding `/fr/tools/suivi-carburant/.../`: same country intent, native dated source/confidence labels plus working quantity × days × snapshot-price planner. Prior title only said “Prix du carburant”; query vocabulary and the important “today” limitation were less explicit near the top. The row is third-party data, not verified current official tariff. Tunisia row has a single diesel field, no commercial-grade breakdown.
- SW registry/hreflang counterpart `/sw/zana/ufuatiliaji-bei-za-mafuta/`: manual current/previous price scenario, monthly litres and update-lag inputs, rather than the selected country snapshot pages. Source inspection also finds LPG offered while inputs say litres. This is a **remaining functional/unit parity gap**, not repaired or accepted by this SEO slice. No equivalent SW country snapshot route was found in the bounded path inventory.

Public web-tool reads of Togo/Mali returned indexed page content with different crawl times (Togo cached five days earlier, Mali reported today); Tunisia tool fetch failed. This does not prove the current deployed artifact identity or Google's selected title/snippet. Repository metadata and local browser output are separately tested below.

## Bounded source-owned repair

Owner `scripts/build-french-fuel-country-pages.js`, exact country allowlist TN/TG/ML:

1. Titles and H1s use essence/gasoil vocabulary; Togo/Mali retain the broad “prix du carburant” intent.
2. Description/OG/Twitter/WebPage description retain the actual row date, add local currency and explicitly describe the existing monthly budget calculator. No numeric price, rate, date, official-validation flag or freshness claim was changed.
3. Visible introductory note and matching existing FAQ answer explain that the dated snapshot does not confirm today's pump tariff. Tunisia explicitly avoids equating the single diesel row with a specific commercial gasoil grade. Compare the same unit/fuel with the station's displayed price before budgeting.

No keyword stuffing, station-locator claim, current-official-price claim, new tax/rate source, canonical/hreflang change or added FAQ count. This is a relevance/expectation improvement hypothesis; **no CTR uplift is claimed**. The largest remaining mismatch for “today” queries is actual authoritative data freshness, not copy length.

## Validation and generation boundary

- Clean baseline `node scripts/build-french-fuel-country-pages.js --check`: **54 stale before edits**. Independently loaded the HEAD owner and compared all 54 physical pages: every difference was solely removal of `?v=...` from `/assets/js/pages/fr-fuel-country-planner.js`, introduced by global release cache stamping. No baseline content/rate drift found by that comparison.
- Generated only TN/TG/ML using the exported `localizePage` owner with `data/fuel/latest.json`, country registry and `registryByCode`, writing the three outputs. Compared old/new owner output for all other 51 countries: byte-identical. The selected three outputs are byte-identical on a second owner pass; tests also simulate a release cache suffix and verify it normalizes to the same output. The normal full-family generator applies the same allowlist; no permanent divergent output path.
- `node -c scripts/build-french-fuel-country-pages.js`: PASS.
- `node --test tests/french-fuel-country-pages.test.js`: **6 PASS**, covering all 54 native/schema/unit/source contracts plus new three-page snippet/FAQ/date/idempotence controls.
- `PORT=4363 CI=1 AFROTOOLS_TEST_DISABLE_ANALYTICS=1 node <dependency-tree>/@playwright/test/cli.js test tests/e2e/french-fuel-country-planner.spec.js --project=chromium --workers=1 --grep 'tunisia|togo|mali'`: **3 PASS**. Actual 390px calculator values, GPL/kg, zero/invalid values, keyboard and source disclosure.
- `PORT=4364 CI=1 AFROTOOLS_TEST_DISABLE_ANALYTICS=1 node <dependency-tree>/@playwright/test/cli.js test tests/e2e/french-fuel-search-intent.spec.js --project=chromium --workers=1`: **3 PASS**, visible new copy, native FAQ keyboard interaction, canonical and 390px overflow. Dependency tree/NODE_PATH: `C:/Users/Oza/.codex/worktrees/language-director-20260915/afrotools/node_modules`.
- `git diff --check`: PASS.
- No full build/deploy, rate refresh, broad SW remediation or post-release GSC outcome verification in this candidate.

Next measurement: after actual deployment and recrawl, compare a complete subsequent 28-day period with this recorded baseline, retaining page/query/device/country scope and checking ranking/impression mix. Do not interpret a short partial window as causal copy uplift.

### Final visual follow-up

The first 390px hero image exposed a white H1 on a pale background. The generator now applies a dark heading color only to the three reviewed countries. Final rerun on PORT4365: the three search-intent browser tests PASS including an axe `color-contrast` check on each H1; six node tests PASS again. This is a targeted heading check, not a full-page accessibility certification. Final Tunisia hero image was visually inspected at:
`C:/Users/Oza/.codex/worktrees/fr-search-reassessment-20260916/afrotools/test-results/french-fuel-search-intent--66f55-visible-and-native-at-390px-chromium/french-fuel-tunisia-hero-390.png`.
