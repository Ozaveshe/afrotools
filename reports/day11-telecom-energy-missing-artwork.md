# Day 11 Telecom + Energy missing artwork

Reviewed: 2026-07-27

## Needed

1. **Telecom category social / Open Graph artwork**
   - Target: `assets/img/categories/telecom-og.webp`
   - Size: 1200 x 630 px
   - Use: `/telecom/` Open Graph and Twitter preview
   - Direction: an Africa-first mobile and fixed-connectivity planning scene with phone, SIM, router, signal, and message-route cues; no operator logos, price claims, coverage promises, or tiny embedded text.
   - Current fallback: `assets/img/og-default.png`

2. **Energy category social / Open Graph artwork**
   - Target: `assets/img/categories/energy-og.webp`
   - Size: 1200 x 630 px
   - Use: `/energy/` Open Graph and Twitter preview
   - Direction: an Africa-first household and small-business planning scene with a bill or meter, solar panel, battery, and generator or utility connection; no brand logos, tariff claims, or tiny embedded text.
   - Current fallback: `assets/img/og-default.png`

3. **Telecom category icon**
   - Target: `assets/img/categories/telecom.png`
   - Size: 64 x 64 px
   - Use: category-card/icon surfaces where a dedicated Telecom asset is expected
   - Direction: simple phone/signal/router mark matching the existing category icon family; no operator logo or price/coverage implication.

## Already covered

- All 14 Telecom canonical owners have a matching `assets/img/tools/<tool-id>.webp` file.
- All 20 Energy canonical owners have a matching `assets/img/tools/<tool-id>.webp` file.
- `assets/img/categories/energy.png` already exists for Energy icon-sized surfaces.
- Country-family variants reuse their canonical owner artwork; no route-specific country image is required for acceptance.
