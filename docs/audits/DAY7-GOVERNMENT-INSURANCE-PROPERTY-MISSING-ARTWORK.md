# Day 7 missing-artwork list

Date: 2026-07-27

## Tool artwork

No tool-level artwork files are missing.

- Government scope: 16/16 hub-linked tools have a non-empty `assets/img/tools/{tool-id}.webp`.
- Insurance scope: 16/16 canonical tools have a non-empty `assets/img/tools/{tool-id}.webp`.
- Mortgage & Property scope: 28/28 hub-linked tools have a non-empty `assets/img/tools/{tool-id}.webp`.
- Total checked: 60/60.

The country-family routes intentionally reuse their canonical tool artwork. No country flag, government crest, regulator logo, insurer logo or provider logo should be generated or implied without a separate rights/source review.

## Optional category-hub artwork gaps

Two category-level image names do not exist:

- `assets/img/categories/government.png` or `.webp`
- `assets/img/categories/mortgage-property.png` or `.webp`

`assets/img/categories/insurance.png` exists.

These two gaps are **not broken-image defects** in this PR: the rebuilt hubs do not reference missing image URLs and use CSS-only hero treatments. If future category cards require dedicated artwork, create calm, non-official illustrations without government seals, flags presented as authority marks, insurer/provider branding, property valuations, approval badges or guaranteed-outcome imagery.

No images were generated or modified in this implementation pass.
