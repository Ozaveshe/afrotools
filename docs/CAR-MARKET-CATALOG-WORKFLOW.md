# Car market identity additions

Use this alongside `docs/CAR-MARKET-EVIDENCE-WORKFLOW.md`. The private evidence catalog begins with the 482 identities in the existing price catalogs. Identity-only additions in `data/cars/market-identity-additions.csv` extend that catalog without inventing USD valuations. Run `node scripts/build-car-market-vehicle-seed.js --count` and verified live SQL for current counts. A catalog identity is not price evidence.

## Adding a real-listing gap

Check a missing make/model/year against manufacturer evidence and a real listing before adding it to the identity-only CSV. Record both evidence URLs and the review date. Keep price, engine, mileage and image claims out of this file. Existing USD price catalogs and public pages remain independent.

## Reconciled identity view

On 2026-10-03, thirteen previously validated additions from retained producer commits were reconciled with the verified native catalog. The shared view now contains the original 482 identities plus nineteen additions, for 501 identities. The original manufacturer/listing URLs and October 2–3 review dates are preserved; this reconciliation is not a new listing visit, price review or source licence. No live identity seed is required: all nineteen additions already exist in the native ledger. Never replay earlier seed or research SQL.

The additions cover Corolla 2015/2000, Axio 2011, Accent 2019, Fit 2009/2010/2012, Vitz 2014, RAV4 2005, Harrier 2008, Fit Shuttle 2011/2014 and Noah 2006. A new identity does not establish an individual vehicle's engine, origin, condition, availability, asking-price representativeness, image rights or public valuation. Preserve the original 482 coverage denominator and report reviewed price coverage separately.

Cars-ZM catalog evidence may use exactly `https://cars-zambia.com/listing.php?type=car&id=<positive decimal ID>` with at most ten ID digits and that parameter order. Other query keys, duplicate keys, tracking/contact tokens, fragments, credentials, ports, hosts and paths are refused. Manufacturer evidence and all other listing evidence remain query-free. This catalog-only exception does not relax private research intake, accepted-observation or publication gates; the separate private nullable-condition migration and URL guard remain publisher work.

`scripts/car-market-catalog.js` supplies the shared identity view for research, accepted-observation intake and private seed SQL. It rejects conflicting duplicate IDs, the same make/model/year under a different ID, and unknown or price-bearing fields in additions. A known listing alias may share the manufacturer identity: the 2018 Lexus LX entry includes LX570 without creating another identity for that alias.

The shared view includes `Prado / Land Cruiser Prado` for the nine existing Toyota Prado identities, matching the aliases already stored live. Toyota's dated April 18, 2024 manufacturer release at `https://global.toyota/en/newsroom/toyota/40658942.html` identifies the distinct light-duty lineage. Preserve the actual listing model. The alias does not match separate `Land Cruiser`, bare `Land Cruiser 250` or trim-bearing names and does not infer a vehicle's year, generation or specifications. Original IDs, years and priced catalog files are unchanged.

This is a fresh catalog-only successor to the retained identity portions of runs 21/23/28/30/31/35/39/41. Preserve their immutable receipts, already-applied native actions, quarantines and other independent scope. The publisher must reconcile older catalog/script/doc overlaps before integration; this consolidated view does not authorize deployment or public prices.

Generate a bounded seed for just the additions with `node scripts/build-car-market-vehicle-seed.js --ids ford-edge-2016,lexus-lx-2018,toyota-camry-2013,toyota-highlander-2018`. Verify the AfroTools project ref `zpclagtgczsygrgztlts` through its configured Supabase MCP before executing this SQL. Seed only identity metadata; do not manufacture valuation or specification fields.

## Matching private research

Seed new identities before assigning them to newly checked research. Research is append-only: retain old null-ID facts and append a matched revision after rechecking the listing. Report historical unmatched rows separately from the latest unresolved make/model/year gaps, and count distinct listings separately from historical revisions.

The first four additions resolve real-listing gaps for Ford Edge 2016, Lexus LX 570 2018, Toyota Camry 2013 and Toyota Highlander 2018. All original 482 identities remain. A newly matched research revision still does not approve an observation, image or public price. Price comparisons need separate review of condition, trim, engine, location, recency, availability and duplicate inventory under the evidence workflow.
