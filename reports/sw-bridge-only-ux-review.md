# Swahili Bridge-Only UX Review - 2026-05-16

## Summary

- Bridge files reviewed: 20
- Acceptable bridge UX after this pass: 20
- Bridges needing content work after this pass: 0
- Bridges recommended for noindex: 0
- Bridges that should not be registry-promoted while bridge-only: 20

## English-Only Blog/API Bridges Retained

- /blog/how-to-calculate-paye-nigeria-2026/ -> fallback /sw/nigeria/kikokotoo-kodi-mshahara/: PAYE Nigeria article remains English; Swahili users get the Nigeria PAYE calculator.
- /blog/kenya-paye-calculator-guide-2025/ -> fallback /sw/kenya/kikokotoo-kodi-mshahara/: Kenya PAYE guide remains English; Swahili users get the Kenya PAYE calculator.
- /blog/vat-rates-africa-2026/ -> fallback /sw/zana/kikokotoo-vat/: VAT rates article remains English; Swahili users get the pan-African VAT calculator.
- /blog/mobile-money-fees-africa-compared/ -> fallback /sw/fintech/: Mobile-money fees article remains English; Swahili users get the fintech hub.
- /blog/salary-after-tax-nigeria/ -> fallback /sw/mshahara-na-kodi/: Salary-after-tax article remains English; Swahili users get the salary and tax hub.
- /blog/dollar-to-naira-rate-today/ -> fallback /sw/sarafu/: FX article remains English; Swahili users get the currency hub.
- /blog/crop-yield-calculator-african-farming/ -> fallback /sw/kilimo/: Crop-yield article remains English; Swahili users get the agriculture hub.
- /api/docs/ -> fallback /sw/api/: API docs remain English; Swahili API bridge explains endpoints, token, JSON and production expectations.
- /api/pricing -> fallback /sw/api/: API pricing remains English; Swahili API bridge tells developers to verify billing and limits there.

## Reviewed Bridge Files

- /sw/blogu/ (sw/blogu/index.html): acceptable bridge UX; do not promote while classified bridge-only.
- /sw/api/ (sw/api/index.html): acceptable bridge UX; do not promote while classified bridge-only.
- /sw/zana-za-developer/ (sw/zana-za-developer/index.html): acceptable bridge UX; do not promote while classified bridge-only.
- /sw/zana/saraka-ya-api-afrika/ (sw/zana/saraka-ya-api-afrika/index.html): acceptable bridge UX; do not promote while classified bridge-only.
- /sw/zana/kituo-cha-developer/ (sw/zana/kituo-cha-developer/index.html): acceptable bridge UX; do not promote while classified bridge-only.
- /sw/zana/jikoni/ (sw/zana/jikoni/index.html): acceptable bridge UX; do not promote while classified bridge-only.
- /sw/zana/kalenda-ya-kiislamu/ (sw/zana/kalenda-ya-kiislamu/index.html): acceptable bridge UX; do not promote while classified bridge-only.
- /sw/zana/kalenda-ya-uzingatiaji/ (sw/zana/kalenda-ya-uzingatiaji/index.html): acceptable bridge UX; do not promote while classified bridge-only.
- /sw/zana/kikokotoo-dhamana/ (sw/zana/kikokotoo-dhamana/index.html): acceptable bridge UX; do not promote while classified bridge-only.
- /sw/zana/kikokotoo-fungu-la-kumi-na-sadaka/ (sw/zana/kikokotoo-fungu-la-kumi-na-sadaka/index.html): acceptable bridge UX; do not promote while classified bridge-only.
- /sw/zana/kikokotoo-lobola-na-mahari/ (sw/zana/kikokotoo-lobola-na-mahari/index.html): acceptable bridge UX; do not promote while classified bridge-only.
- /sw/zana/kikokotoo-zakat/ (sw/zana/kikokotoo-zakat/index.html): acceptable bridge UX; do not promote while classified bridge-only.
- /sw/zana/mkataba-wa-ubia/ (sw/zana/mkataba-wa-ubia/index.html): acceptable bridge UX; do not promote while classified bridge-only.
- /sw/zana/mshauri-seli-mundu/ (sw/zana/mshauri-seli-mundu/index.html): acceptable bridge UX; do not promote while classified bridge-only.
- /sw/zana/posho-ya-national-service-ghana/ (sw/zana/posho-ya-national-service-ghana/index.html): acceptable bridge UX; do not promote while classified bridge-only.
- /sw/zana/posho-ya-nysc/ (sw/zana/posho-ya-nysc/index.html): acceptable bridge UX; do not promote while classified bridge-only.
- /sw/zana/uchunguzi-wa-mpangaji/ (sw/zana/uchunguzi-wa-mpangaji/index.html): acceptable bridge UX; do not promote while classified bridge-only.
- /sw/zana/ukaguzi-wa-halal/ (sw/zana/ukaguzi-wa-halal/index.html): acceptable bridge UX; do not promote while classified bridge-only.
- /sw/zana/ukuaji-wa-mtoto/ (sw/zana/ukuaji-wa-mtoto/index.html): acceptable bridge UX; do not promote while classified bridge-only.
- /sw/zana/urithi-wa-faraid/ (sw/zana/urithi-wa-faraid/index.html): acceptable bridge UX; do not promote while classified bridge-only.

## Validation

- npm run check-links: passed, 0 broken internal links
- npm run build:i18n:validate: passed
- npm run validate:hreflang: passed with 2 carried warnings
- npm run seo:report: passed with 20 carried French JSON-LD candidates
