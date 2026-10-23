# 2022 G-Wagon exact engine displacement review

Reviewed on 22 October 2026.

The combined G 550 / G 63 row now uses 3,982-3,982 cc. The original 4,000-6,300 cc range produced a fictitious 5,150 cc midpoint. The superseded nominal 4,000-4,000 cc correction removed that midpoint but rounded both engines across a real 4,000 cc tax boundary. A 4.0-litre marketing label must not substitute for exact displacement.

Evidence inspected on 22 October:

- [2022 G-Class, Mercedes-Benz of Ontario](https://www.mbontario.com/mercedes-benz/g-class/2022-suv/): the 2022 G 550 context and 416 hp specifications explicitly state displacement 3,982 cc. This is a Mercedes-Benz dealer page, not a manufacturer-hosted technical publication; its publication date is not stated.
- [2022 G-Class SUV AMG Order Guide](https://www.exoticcarhacks.com/wp-content/uploads/2024/04/2022-g-class-suv-AMG-order-guide-en_us.pdf), manufacturer-authored guide hosted by a third-party mirror: cover identifies the 2022 model year; page 16, G63W4 specifications, explicitly states Displacement (cc) 3,982. The actual PDF page was visually inspected in the browser, not inferred from its filename. The mirror's URL date is not the vehicle or publication date. No local raw-PDF hash is claimed.
- [2021 G-Class quick reference guide, Mercedes-Benz USA](https://media.mbusa.com/news/2021-g-class-quick-reference-guide): both G 550 and AMG G 63 columns state 3,982 cc. This is corroboration for the preceding model year, not a 2022 source.

The same-year MBUSA parts pages previously inspected establish the nominal 4.0-litre class only. They do not establish exact 4,000 cc. Vehicle registration/VIN documents still govern individual variants and modifications. The combined catalogue row remains a model-level default, not individual-vehicle certification.

Regenerate with `node scripts/car-catalog-manager.js sync-seed-json`, inspect the cumulative seed diff, then run the final selected `node scripts/generate-car-price-pages.js`. Against current main, only the G-Wagon seed bounds change from [4000,6300] to [3982,3982]. No prices, dates, FX, tax rates, fuel consumption, finance formulas, or other model specifications change. The regression retains all six country calculation-input and calculator-link checks, expecting 3,982 cc.

[Nigeria's 2026 Green Tax schedule, Fifth Schedule, printed page B281](https://cms.customs.gov.ng/wp-content/uploads/2026/07/TT-2026-CIRCULAR-NO-10-APPROVAL-FOR-THE-IMPLEMENT-OF-THE-2026-FISCAL-POLICY-MEASURES-AND-TARIFF-AMENDMENTS_0001-3-25.pdf) separates 2,000-3,999 cc from 4,000 cc and above. This is why nominal rounding is unsafe. This source correction does not implement, validate, or change that tax, its valuation base, or any customs assessment.
