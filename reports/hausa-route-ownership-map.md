# Hausa Route Ownership Map

Snapshot date: 2026-05-18

## Summary

- Public Hausa routes: 72 under `/ha/`.
- Hausa registry rows: 67.
- Registry rows with missing Hausa targets: 0.
- Registry rows with duplicate Hausa ids: 0.
- Registry rows with `lang: 'ha'` pointing outside `/ha/`: 0.
- Visible-copy blockers: 0.
- Source strategy: keep the Hausa lane manual and route-first. `build-i18n`
  can validate Hausa keys, but it is not the owner for these natural Hausa
  slugs.
- Historical Batch 5 baseline: 67 routes and 62 registry rows. The current
  lane includes five additional Batch 6 shells: bank charges, currency
  converter, CAC checker, business registration, and PDF Sign.

## Ownership Groups

### Hand-authored Hausa hubs

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

### Hausa route-visible shells

These routes are valid Hausa public pages, but they deliberately keep part of
the source workflow, archive, data table, or official action on the English
counterpart. They must keep the boundary visible with labels such as `Shafi na
Turanci` or explanatory Hausa copy.

- `/ha/jamb/cbt/` -> `/jamb/cbt/`
- `/ha/jamb/tutor/` -> `/jamb/tutor/`
- `/ha/jamb/past-questions/` -> `/jamb/past-questions/`
- `/ha/jamb/turanci/` -> `/jamb/english/`
- `/ha/jamb/lissafi/` -> `/jamb/mathematics/`
- `/ha/jamb/fisiks/` -> `/jamb/physics/`
- `/ha/jamb/kimiyya/` -> `/jamb/chemistry/`
- `/ha/jamb/halittu/` -> `/jamb/biology/`
- `/ha/kayan-aiki/canza-pdf/` -> `/tools/pdf-convert/`
- `/ha/kayan-aiki/wurin-aikin-pdf/` -> `/tools/pdf-workspace/`
- `/ha/kayan-aiki/sanya-hannu-pdf/` -> `/tools/pdf-sign/`
- `/ha/kayan-aiki/gina-cv/` -> `/tools/cv-builder/`
- `/ha/kayan-aiki/kwatanta-kudin-makaranta/` -> `/tools/school-fees/`
- `/ha/kayan-aiki/kwatanta-kunshin-intanet/` -> `/telecom/data-plan-compare/`
- `/ha/kayan-aiki/mai-fassara-hausa/` -> `/tools/hausa-translator/`
- `/ha/kayan-aiki/rajistar-kasuwanci/` -> `/tools/business-registration/`
- `/ha/kayan-aiki/duba-cac/` -> `/tools/cac-checker/`
- `/ha/kayan-aiki/canja-kudi/` -> `/tools/currency-converter/`
- `/ha/kayan-aiki/cajin-banki/` -> `/tools/bank-charges/`

### Translated or adapted tool pages

These routes are Hausa-owned pages that preserve logic, formulas, data, source
warnings, and download gates from the English source while localizing visible
copy:

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
- `/ha/kayan-aiki/rubuta-wasikar-aiki/` -> `/tools/cover-letter-generator/`
- `/ha/kayan-aiki/whatsapp-link/` -> `/tools/whatsapp-link/`
- `/ha/kayan-aiki/lambobin-ussd/` -> `/telecom/ussd-directory/`
- `/ha/kayan-aiki/amfanin-bayanan-intanet/` -> `/telecom/data-usage-calc/`
- `/ha/kayan-aiki/darajar-katin-waya/` -> `/telecom/airtime-value/`
- `/ha/kayan-aiki/kudin-tura-kudi-ta-waya/` -> `/tools/mobile-money-fees/`
- `/ha/kayan-aiki/rajistar-layin-waya-nin/` -> `/telecom/sim-registration/`
- `/ha/kayan-aiki/kasafin-dalibi/` -> `/tools/student-budget/`
- `/ha/kayan-aiki/neman-tallafin-karatu/` -> `/tools/scholarship-finder/`

### Nigeria tax and business pages

These are Hausa route-visible adaptations of Nigeria tax/business sources:

- `/ha/kayan-aiki/cit-najeriya/` -> `/tools/ng-cit/`
- `/ha/kayan-aiki/wht-najeriya/` -> `/tools/ng-wht/`
- `/ha/kayan-aiki/jagorar-tin-najeriya/` -> `/tools/tin-guide/nigeria`
- `/ha/kayan-aiki/fansho-najeriya/` -> `/tools/ng-pension/`
- `/ha/kayan-aiki/nhf-najeriya/` -> `/tools/ng-nhf/`

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

These pages are informational only and must not promise diagnosis, treatment,
emergency care, or certain pricing:

- `/ha/kayan-aiki/kudin-asibiti/` -> `/tools/hospital-cost/`
- `/ha/kayan-aiki/kwatanta-farashin-magani/` -> `/tools/drug-price-compare/`
- `/ha/kayan-aiki/duba-genotype/` -> `/tools/genotype-checker/`
- `/ha/kayan-aiki/sickle-cell/` -> `/tools/sickle-cell/`
- `/ha/kayan-aiki/kudin-haihuwa/` -> `/tools/childbirth-cost/`
- `/ha/kayan-aiki/abincin-afirka/` -> `/tools/african-meal-plan/`

### Fallback-only surfaces

These do not currently have Hausa route ownership. Hubs may link to them only
with honest Hausa fallback labels:

- Salary and payroll follow-ons: CGT Nigeria, payroll slip, employee cost,
  minimum wage, salary compare, overtime, leave, AfroPayroll, and Africa PAYE.
- Business and payments: Paystack fee, payment rails, mobile wallet compare,
  remittance compare, profit margin, break-even, markup, business plan, loan,
  mortgage, savings, inflation, and investment-return helpers.
- Education/JAMB: yearly past-question archives, extra subject archives, study
  planner, flashcards, and cutoff helpers until scoped.
- Documents/PDF: PDF editor, PDF page numbers, OCR/extract text, and advanced
  full-workspace editing.
- Language: PDF translate, word counter, African proverbs, and broader language
  utilities.
- Agriculture: planting calendar, drought risk, farm payroll, and market-price
  follow-ons where the Nigeria source has not been reviewed for Hausa.

### Deferred candidates

These are good Batch 6 or Batch 7 candidates, but they should stay out of the
Hausa registry until a prompt verifies source maturity and fallback honesty:

- PDF Editor guide-only shell.
- JAMB Economics, Government, Commerce, Literature, CRS/IRS, and Geography
  subject guides.
- JAMB study planner, flashcards, cutoff helper, and additional non-yearly exam
  surfaces.
- CGT Nigeria, payroll slip, employee cost, Paystack fee, break-even, profit
  margin, and markup.
- USSD simulator, mobile wallet comparison, remittance comparison, and deeper
  SIM/NIN helpers.
- PDF page numbers, OCR/extract-text guide, and cover/CV export polish.
- Planting calendar, drought risk, farm payroll, market price, and additional
  livestock/feed follow-ons.

### Routes without clear source owner

None in the current 72-route lane. Some route-visible shells intentionally keep
the full workflow on an English counterpart, but each public Hausa page has a
clear source surface or English counterpart.

## Rules For Future Batches

- Do not generate over these routes from English-shaped page packs.
- Do not store English fallback links as `lang: 'ha'` registry rows.
- If a route is a Hausa shell around an English workflow, label that boundary in
  Hausa.
- If shared navbar, footer, or registry rows change, run the component minify
  workflow before final validation.
- Keep `dist/`, generated deploy output, and hand-edited minified files out of
  Hausa docs-only batches.
