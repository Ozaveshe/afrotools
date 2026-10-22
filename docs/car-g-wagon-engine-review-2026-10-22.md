# 2022 G-Wagon engine input review

Reviewed on 22 October 2026.

The combined G 550 / G 63 catalogue row incorrectly used a 4,000–6,300 cc range. Its midpoint became a 5,150 cc default in the car profile's import estimate and calculator link. The maintained catalogue now uses 4,000–4,000 cc: the nominal 4.0-litre engine class supported for both named 2022 variants.

Manufacturer-hosted same-year sources inspected:

- [2022 G550, Mercedes-Benz USA parts catalogue](https://mbparts.mbusa.com/v-2022-mercedes-benz-g550--base--4-0l-v8-gas/fuel-system--closed-fuel-evaporation-control-system): the selected vehicle is identified as Base 4.0L V8 Gas.
- [2022 G63 AMG, Mercedes-Benz Classic USA parts catalogue](https://classicparts.mbusa.com/v-2022-mercedes-benz-g63-amg--base--4-0l-v8-gas/engine--mounts): the selected vehicle is identified as Base 4.0L V8 Gas.

4,000 is the nominal value used by this combined catalogue entry, not a newly verified exact displacement for every individual vehicle. Vehicle documents govern the exact specification. Source pages do not provide a publication date; 22 October is our observation date. This correction does not update price observation dates, certify seller stock, change tariffs, or validate the existing finance/risk models.

Regeneration: run node scripts/car-catalog-manager.js sync-seed-json, then node scripts/generate-car-price-pages.js. The data projection changes only the G-Wagon engine maximum from 6,300 to 4,000; all prices and existing dates remain unchanged. The focused regression checks the source row, generated vehicle, and both calculation input and calculator link across the six supported import markets.
