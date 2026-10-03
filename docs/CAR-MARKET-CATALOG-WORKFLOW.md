# Car market identity additions

Use this alongside `docs/CAR-MARKET-EVIDENCE-WORKFLOW.md`. The private evidence catalog begins with the 482 identities in the existing price catalogs. Identity-only additions in `data/cars/market-identity-additions.csv` extend that catalog without inventing USD valuations. Run `node scripts/build-car-market-vehicle-seed.js --count` and verified live SQL for current counts. A catalog identity is not price evidence.

## Adding a real-listing gap

Check a missing make/model/year against manufacturer evidence and a real listing before adding it to the identity-only CSV. Record both evidence URLs and the review date. Keep price, engine, mileage and image claims out of this file. Existing USD price catalogs and public pages remain independent.

`scripts/car-market-catalog.js` supplies the shared identity view for research, accepted-observation intake and private seed SQL. It rejects conflicting duplicate IDs, the same make/model/year under a different ID, and unknown or price-bearing fields in additions. A known listing alias may share the manufacturer identity: the 2018 Lexus LX entry includes LX570 without creating another identity for that alias.

### Prado listing name

On 2026-10-03, an individual Kenyan advert reported `Land Cruiser Prado`, while the existing private identity view used `Prado`. [Toyota's April 18, 2024 release](https://global.toyota/en/newsroom/toyota/40658942.html) describes Land Cruiser Prado as a distinct light-duty lineage within the Land Cruiser range. The shared private view now includes `Prado / Land Cruiser Prado` for the nine existing Toyota Prado identities. This preserves their IDs, years and priced catalog source files; it does not add another vehicle or change public prices.

Preserve the actual listing model in research. Seed only selected existing identities with the bounded identity-only generator and verify the native model alias before matching new research. Keep the separate `Land Cruiser` identity, bare `Land Cruiser 250`, and trim-bearing names outside this exact alias. A family-name match does not establish generation, engine, trim, stock, model-year accuracy, source rights or a public price. Older research remains append-only.

Generate a bounded seed for just the additions with `node scripts/build-car-market-vehicle-seed.js --ids ford-edge-2016,lexus-lx-2018,toyota-camry-2013,toyota-highlander-2018`. Verify the AfroTools project ref `zpclagtgczsygrgztlts` through its configured Supabase MCP before executing this SQL. Seed only identity metadata; do not manufacture valuation or specification fields.

## Matching private research

Seed new identities before assigning them to newly checked research. Research is append-only: retain old null-ID facts and append a matched revision after rechecking the listing. Report historical unmatched rows separately from the latest unresolved make/model/year gaps, and count distinct listings separately from historical revisions.

The first four additions resolve real-listing gaps for Ford Edge 2016, Lexus LX 570 2018, Toyota Camry 2013 and Toyota Highlander 2018. All original 482 identities remain. A newly matched research revision still does not approve an observation, image or public price. Price comparisons need separate review of condition, trim, engine, location, recency, availability and duplicate inventory under the evidence workflow.
