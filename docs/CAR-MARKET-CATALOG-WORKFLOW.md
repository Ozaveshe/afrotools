# Car market identity additions

Use this alongside `docs/CAR-MARKET-EVIDENCE-WORKFLOW.md`. The private evidence catalog begins with the 482 identities in the existing price catalogs. Identity-only additions in `data/cars/market-identity-additions.csv` extend that catalog without inventing USD valuations. Run `node scripts/build-car-market-vehicle-seed.js --count` and verified live SQL for current counts. A catalog identity is not price evidence.

## Adding a real-listing gap

Check a missing make/model/year against manufacturer evidence and a real listing before adding it to the identity-only CSV. Record both evidence URLs and the review date. Keep price, engine, mileage and image claims out of this file. Existing USD price catalogs and public pages remain independent.

`scripts/car-market-catalog.js` supplies the shared identity view for research, accepted-observation intake and private seed SQL. It rejects conflicting duplicate IDs, the same make/model/year under a different ID, and unknown or price-bearing fields in additions. A known listing alias may share the manufacturer identity: the 2018 Lexus LX entry includes LX570 without creating another identity for that alias.

Generate a bounded seed for just the additions with `node scripts/build-car-market-vehicle-seed.js --ids ford-edge-2016,lexus-lx-2018,toyota-camry-2013,toyota-highlander-2018`. Verify the AfroTools project ref `zpclagtgczsygrgztlts` through its configured Supabase MCP before executing this SQL. Seed only identity metadata; do not manufacture valuation or specification fields.

## Matching private research

Seed new identities before assigning them to newly checked research. Research is append-only: retain old null-ID facts and append a matched revision after rechecking the listing. Report historical unmatched rows separately from the latest unresolved make/model/year gaps, and count distinct listings separately from historical revisions.

The first four additions resolve real-listing gaps for Ford Edge 2016, Lexus LX 570 2018, Toyota Camry 2013 and Toyota Highlander 2018. All original 482 identities remain. A newly matched research revision still does not approve an observation, image or public price. Price comparisons need separate review of condition, trim, engine, location, recency, availability and duplicate inventory under the evidence workflow.

On 2026-10-02, an individually checked Autochek Corolla 2015 detail page revealed another absent identity. Toyota Canada's dated October 17, 2014 release corroborates the 2015 Corolla sedan identity. The addition records that manufacturer reference and the checked listing link only; it does not establish the Nigerian vehicle's original market, trim, engine displacement, gearbox subtype, equipment, availability or valuation. Keep unshown listing fields unknown and retain the zero-mileage/loan-widget context on private review hold. Original coverage remains measured against 482; derive the current total and number of valid additions from the catalog rather than hiding original gaps in the larger denominator.
