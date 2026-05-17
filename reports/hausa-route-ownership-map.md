# Hausa Route Ownership Map

Snapshot date: 2026-05-16

## Summary

- Public Hausa routes: 67 under `/ha/`.
- Hausa registry rows: 62.
- Registry rows with missing Hausa targets: 0.
- Registry rows with `lang: 'ha'` pointing outside `/ha/`: 0.
- Source strategy: keep the Hausa lane manual and route-first. `build-i18n` can validate Hausa keys, but it is not the owner for these natural Hausa slugs.

## Ownership Groups

### Hand-authored hubs

These pages own Hausa-first navigation, fallback policy, and card copy:

- `/ha/` -> `/`
- `/ha/kayan-aiki/` -> `/all-tools/`
- `/ha/najeriya/` -> `/nigeria/`
- `/ha/albashi-da-haraji/` -> `/salary-tax/`
- `/ha/kasuwanci-da-haraji/` -> `/vat-business-tax/`
- `/ha/ilimi/` -> `/education/`
- `/ha/jamb/` -> `/jamb/`
- `/ha/takardu-da-pdf/` -> `/document-pdf/`
- `/ha/harshe-da-fassara/` -> `/language/`
- `/ha/sadarwa/` -> `/telecom/`
- `/ha/noma/` -> `/agriculture/`
- `/ha/lafiya/` -> `/health/`

### Copied or adapted tool pages

These routes are Hausa-owned pages that preserve logic/data from the English source:

- `/ha/najeriya/harajin-albashi/` -> `/nigeria/ng-salary-tax`
- `/ha/kayan-aiki/kalkuletan-vat/` -> `/tools/vat-calculator/`
- `/ha/kayan-aiki/kalkuletan-jamb/` -> `/tools/jamb-aggregate/`
- `/ha/kayan-aiki/kalkuletan-waec-neco/` -> `/tools/waec-calculator/`
- `/ha/kayan-aiki/kalkuletan-gpa-cgpa/` -> `/tools/gpa-calculator/`
- `/ha/kayan-aiki/alawus-na-nysc/` -> `/tools/nysc-allowance/`
- `/ha/kayan-aiki/naira-zuwa-kalmomi/` -> `/tools/naira-to-words/`
- `/ha/kayan-aiki/kirkiro-invoice/` -> `/tools/invoice-generator/`
- `/ha/kayan-aiki/kirkiro-resit/` -> `/tools/receipt-generator/`
- `/ha/kayan-aiki/hada-da-raba-pdf/` -> `/tools/pdf-merge-split/`
- `/ha/kayan-aiki/matsa-pdf/` -> `/tools/pdf-compress/`
- `/ha/kayan-aiki/canza-pdf/` -> `/tools/pdf-convert/`
- `/ha/kayan-aiki/wurin-aikin-pdf/` -> `/tools/pdf-workspace/`
- `/ha/kayan-aiki/gina-cv/` -> `/tools/cv-builder/`
- `/ha/kayan-aiki/rubuta-wasikar-aiki/` -> `/tools/cover-letter-generator/`
- `/ha/kayan-aiki/mai-fassara-hausa/` -> `/tools/hausa-translator/`
- `/ha/kayan-aiki/whatsapp-link/` -> `/tools/whatsapp-link/`
- `/ha/kayan-aiki/lambobin-ussd/` -> `/telecom/ussd-directory/`
- `/ha/kayan-aiki/amfanin-bayanan-intanet/` -> `/telecom/data-usage-calc/`
- `/ha/kayan-aiki/kwatanta-kunshin-intanet/` -> `/telecom/data-plan-compare/`
- `/ha/kayan-aiki/darajar-katin-waya/` -> `/telecom/airtime-value/`
- `/ha/kayan-aiki/kudin-tura-kudi-ta-waya/` -> `/tools/mobile-money-fees/`
- `/ha/kayan-aiki/rajistar-layin-waya-nin/` -> `/telecom/sim-registration/`

### Nigeria tax and business pages

These are Hausa route-visible adaptations of Nigeria tax/business sources:

- `/ha/kayan-aiki/cit-najeriya/` -> `/tools/ng-cit/`
- `/ha/kayan-aiki/wht-najeriya/` -> `/tools/ng-wht/`
- `/ha/kayan-aiki/jagorar-tin-najeriya/` -> `/tools/tin-guide/nigeria`
- `/ha/kayan-aiki/fansho-najeriya/` -> `/tools/ng-pension/`
- `/ha/kayan-aiki/nhf-najeriya/` -> `/tools/ng-nhf/`

### JAMB route-visible shells and subject pages

These pages keep JAMB source behavior honest and mark English-only archives or tutor flows where needed:

- `/ha/jamb/cbt/` -> `/jamb/cbt/`
- `/ha/jamb/tutor/` -> `/jamb/tutor/`
- `/ha/jamb/past-questions/` -> `/jamb/past-questions/`
- `/ha/jamb/turanci/` -> `/jamb/english/`
- `/ha/jamb/lissafi/` -> `/jamb/mathematics/`
- `/ha/jamb/fisiks/` -> `/jamb/physics/`
- `/ha/jamb/kimiyya/` -> `/jamb/chemistry/`
- `/ha/jamb/halittu/` -> `/jamb/biology/`

### Agriculture pages

These routes form the Nigeria-first Hausa agriculture cluster:

- `/ha/noma/amfanin-gona-najeriya/` -> `/agriculture/crop-yield/nigeria`
- `/ha/noma/taki-najeriya/` -> `/agriculture/fertilizer/nigeria`
- `/ha/noma/ban-ruwa-najeriya/` -> `/agriculture/irrigation/nigeria`
- `/ha/noma/yawan-iri-najeriya/` -> `/agriculture/seed-rate/nigeria`
- `/ha/kayan-aiki/ribar-gona/` -> `/agriculture/farm-profit/nigeria`
- `/ha/kayan-aiki/sarrafa-rogo/` -> `/agriculture/cassava-processing/nigeria`
- `/ha/kayan-aiki/kwandon-kasuwa/` -> `/tools/staple-basket/`
- `/ha/kayan-aiki/farashin-kayayyakin-gona/` -> `/agriculture/commodity-prices/`
- `/ha/kayan-aiki/abincin-dabbobi/` -> `/agriculture/livestock-feed/nigeria`
- `/ha/kayan-aiki/ribar-kiwon-kifi/` -> `/agriculture/fish-farming/nigeria`

### Health pages

These pages are informational only and must not promise diagnosis, treatment, emergency care, or certain pricing:

- `/ha/kayan-aiki/kudin-asibiti/` -> `/tools/hospital-cost/`
- `/ha/kayan-aiki/kwatanta-farashin-magani/` -> `/tools/drug-price-compare/`
- `/ha/kayan-aiki/duba-genotype/` -> `/tools/genotype-checker/`
- `/ha/kayan-aiki/sickle-cell/` -> `/tools/sickle-cell/`
- `/ha/kayan-aiki/kudin-haihuwa/` -> `/tools/childbirth-cost/`
- `/ha/kayan-aiki/abincin-afirka/` -> `/tools/african-meal-plan/`

### Routes without clear source owner

None in the current 67-route lane. Some registry rows still omit `sourceId`, but every Hausa route has an English counterpart through hreflang or an obvious source surface.

## Rules For Future Batches

- Do not generate over these routes from English-shaped page packs.
- Do not store English fallback links as `lang: 'ha'` registry rows.
- If a route is a Hausa shell around an English workflow, label that boundary in Hausa.
- If shared navbar, footer, or registry rows change, run the component minify workflow before final validation.
