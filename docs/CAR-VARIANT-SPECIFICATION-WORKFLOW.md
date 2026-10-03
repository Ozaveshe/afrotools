# Manufacturer variant specification review

Use `data/cars/variant-specifications.json` and `node scripts/car-variant-specifications.js check` to validate reviewed manufacturer facts by model year and explicit variant. Run `node scripts/car-variant-specifications.js research PRIVATE-RESEARCH.json` to inspect minimally stored listing facts and their explicit contexts. Keep this output outside the public repository.

The initial seven variants cover 2020 US Elantra SE/ECO/Sport, 2016 US C-Class C300/C450 AMG 4MATIC, and 2017 US E-Class E300 RWD/4MATIC. Hyundai facts come from its 2019-05-14 company press release distributed through PRNewswire; Mercedes C-Class facts come from its 2016 model brochure, copyright 2015 and document MC-15-1052, readable in the cited mirror; E-Class facts come from the official 2016-09-23 reference guide. Publication year is preserved when the exact day is unknown. Manufacturer specification coverage is seven variants across three catalog identities, not complete catalog or market coverage.

These sources describe original US configurations. They do not prove a Nigerian seller's stock, engine, condition, drivetrain, registration or mileage. No MSRP, asking price, seller content, photo or feed permission belongs in this specification ledger. The mirrored brochure's author and document identity are explicit; dealer-CDN and direct PDF retrieval failed in this review, so extracted brochure text is the readable evidence.

Match only reviewed aliases under the exact catalog ID/year. Case, spacing and punctuation normalize; bare E300 is unresolved because it does not distinguish RWD from 4MATIC. C300 accepts engine/cylinder checks but leaves drivetrain unresolved because that badge alone permits more than one drivetrain. Unknown/missing trim never falls back to another variant or a family average. Matching does not approve source access, observations, stock or prices.

Keep nominal litres separate from exact displacement. The manufacturer release labels the Elantra engines 1.4/1.6/2.0 L; it does not establish exact cc here. A claimed cc value may agree with that label after rounding to one decimal litre, but this remains a plausibility check. E300's guide supplies exact 1991 cc; only that exact value or the displayed nominal 2000 cc passes its check. Missing fields remain missing; diagnostics never copy an OEM default into the listing.

The private research command uses an explicit context drivetrain when supplied, or literal AWD/4MATIC/4x4/RWD/FWD tokens in the listing's trim. It never derives this claim from the manufacturer record or fills missing input fields. A bare badge remains unresolved. Conflicting literal drive tokens cannot pass a known drivetrain check.

Review contradictions alongside the actual page. Engine/cylinder/drivetrain conflicts are diagnostic signals; this script does not mutate the private ledger or automatically accept/reject a listing. Existing availability, model-year/identity, duplicate, age and condition holds remain in force even when manufacturer plausibility passes.

The current catalog's representative engine bands are also averaged to prefill import calculations. Extending a band to include another trim could silently change that default and leave a planning price unrelated to the selected variant. This candidate therefore records the evidence needed for explicit variant selection and price-scope review. Connecting the records to public engine selectors or changing catalog/price bands requires a separate validated consumer candidate. Public snapshot and SEO gates in `CAR-MARKET-EVIDENCE-WORKFLOW.md` continue to apply.

## Honda model-year references

The Honda additions brought the registry to 19 variants across six catalog identities. Twelve additions use four dated Honda US sources: 2010 Civic sedan LX/EX, 2022 Civic sedan LX/Sport/EX/Touring, 2022 Civic hatchback EX-L/Sport Touring, and 2023 CR-V EX AWD/EX-L AWD/Sport Hybrid/Sport Touring Hybrid AWD. Source dates precede the named model years; the hatchback press kit is dated September 29, 2021 and embeds September 20 specifications.

The 2010 Civic references supply exact 1799 cc. The 2022 sedan distinguishes 1996 cc LX/Sport from 1498 cc EX/Touring; the selected hatchback variants use 1498 cc. Bare sedan badges remain unresolved until the body variant is explicitly reviewed. EX-L and Sport Touring diagnostics refer to the US hatchback configuration and still need original-market and body confirmation. The cited 2022 tables do not establish drivetrain here, so it remains null.

The 2023 US CR-V reference separates 1498 cc petrol EX/EX-L from 1993 cc hybrid Sport/Sport Touring. AWD is optional on EX/EX-L and standard on Sport Touring. Only explicit AWD aliases select the reviewed petrol variants. A plug-in-hybrid label, bare Sport, or an equipment variant marked `w/o BSI` remains unresolved; the July 2022 release does not establish those aliases.

Manufacturer transmission options do not select an individual car's gearbox. The diagnostic command checks year, exact variant alias, engine, cylinders and literal drivetrain claims; it does not check body, original import market, transmission or equipment. Missing advert fields must stay missing. Review those facts, condition, inventory and source access separately before accepting observations or publishing prices. No catalog engine band, planning price, public selector, image permission or public price pack changes with these references.

## Kia Rio model-year references

Four US Rio 2015 sedan references bring the registry to 23 variants across seven catalog identities and eight sources. Kia's August 22, 2014 release supplies a nominal 1.6-litre gasoline four-cylinder engine, six-speed manual for LX, and six-speed automatic for LX/EX/SX. The release was read in the ordinary browser after web retrieval timed out. It does not establish exact displacement or drivetrain here, so both remain null where appropriate.

LX manual and automatic aliases are separate and require an explicit sedan/gearbox label. Bare LX/EX/SX and hatchback labels remain unresolved. A listing titled LX 6M but showing Automatic stays held for gearbox review even when its nominal engine agrees; the diagnostic does not check transmission or prove the original market or physical specification. No manufacturer default is copied into private facts, and no stock, source permission, price, engine band or public selector is approved.
