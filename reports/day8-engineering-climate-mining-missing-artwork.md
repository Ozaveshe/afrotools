# Day 8 missing artwork — Engineering, Climate, Mining

Audit date: 2026-07-27

This is an artwork queue only. No images were generated or substituted during the Day 8 implementation pass.

## Bespoke artwork still needed

The following public surfaces currently fall back to the valid shared `assets/img/og-default.png` image:

- `/engineering/` — Engineering hub artwork
- `/climate/` — Climate hub artwork
- `/mining/` — Mining hub artwork
- `/tools/diamond-valuation/` — diamond valuation workflow artwork
- `/tools/oil-well-production/` — oil-well planning workflow artwork
- `/tools/oil-gas-revenue/` — oil/gas revenue workflow artwork
- `/tools/mining-license-fee/` — mining licence planning artwork
- `/tools/mining-royalty/` — mining royalty planning artwork
- `/tools/artisanal-mining-income/` — artisanal mining income planning artwork

Suggested destinations for approved assets are `assets/img/tools/{route-slug}.webp` for apps and a category-specific equivalent for hubs. Artwork must avoid implying official status, guaranteed commodity values, permits, reserves, production forecasts, environmental outcomes, or live integrations.

## Existing coverage

- All 46 Day 8 hub-linked routes have a valid, existing local Open Graph image reference.
- All 39 registry-backed Engineering and Climate routes have either a route-specific image or an intentional registry alias to an existing image.
- `/tools/commodity-tracker/` already uses `assets/img/tools/commodity-tracker.webp`.
- No broken local Open Graph image reference was found.
