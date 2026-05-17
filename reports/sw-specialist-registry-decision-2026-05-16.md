# Swahili Specialist Registry Decision - 2026-05-16

Prompt 108 reviewed the specialist queue after Prompts 104-107. No registry rows were added. The page copy is safer for general discoverability, but every route still carries health, religious/cultural, legal/government, education or finance risk that should not be promoted without domain review.

## Decision Summary

- Specialist routes reviewed: 22
- Promote now: 0
- Already in Swahili registry: 0
- Bridge-only: 14
- Human/domain review required: 8
- Broken Swahili registry hrefs before validation: 0

## Refused Routes

- /sw/zana/gharama-za-hospitali/ - human-review-required; Specialist-risk route is safe for general discoverability only after disclaimers; registry promotion should wait for human/domain review.
- /sw/zana/kalenda-ya-kiislamu/ - bridge-only; Report still classifies this as bridge-only; do not expose as registry-quality.
- /sw/zana/kalenda-ya-uzingatiaji/ - bridge-only; Report still classifies this as bridge-only; do not expose as registry-quality.
- /sw/zana/kalori-za-vyakula-vya-afrika/ - human-review-required; Specialist-risk route is safe for general discoverability only after disclaimers; registry promotion should wait for human/domain review.
- /sw/zana/kifuatiliaji-alama/ - human-review-required; Specialist-risk route is safe for general discoverability only after disclaimers; registry promotion should wait for human/domain review.
- /sw/zana/kikokotoo-dhamana/ - bridge-only; Report still classifies this as bridge-only; do not expose as registry-quality.
- /sw/zana/kikokotoo-fungu-la-kumi-na-sadaka/ - bridge-only; Report still classifies this as bridge-only; do not expose as registry-quality.
- /sw/zana/kikokotoo-lobola-na-mahari/ - bridge-only; Report still classifies this as bridge-only; do not expose as registry-quality.
- /sw/zana/kikokotoo-ovulation/ - human-review-required; Specialist-risk route is safe for general discoverability only after disclaimers; registry promotion should wait for human/domain review.
- /sw/zana/kikokotoo-zakat/ - bridge-only; Report still classifies this as bridge-only; do not expose as registry-quality.
- /sw/zana/maandalizi-ya-mahojiano/ - human-review-required; Specialist-risk route is safe for general discoverability only after disclaimers; registry promotion should wait for human/domain review.
- /sw/zana/mkataba-wa-ubia/ - bridge-only; Report still classifies this as bridge-only; do not expose as registry-quality.
- /sw/zana/mshauri-seli-mundu/ - bridge-only; Report still classifies this as bridge-only; do not expose as registry-quality.
- /sw/zana/posho-ya-national-service-ghana/ - bridge-only; Report still classifies this as bridge-only; do not expose as registry-quality.
- /sw/zana/posho-ya-nysc/ - bridge-only; Report still classifies this as bridge-only; do not expose as registry-quality.
- /sw/zana/tarehe-ya-kujifungua/ - human-review-required; Specialist-risk route is safe for general discoverability only after disclaimers; registry promotion should wait for human/domain review.
- /sw/zana/uchunguzi-wa-mpangaji/ - bridge-only; Report still classifies this as bridge-only; do not expose as registry-quality.
- /sw/zana/ukaguzi-wa-halal/ - bridge-only; Report still classifies this as bridge-only; do not expose as registry-quality.
- /sw/zana/ukuaji-wa-mtoto/ - bridge-only; Report still classifies this as bridge-only; do not expose as registry-quality.
- /sw/zana/urithi-wa-faraid/ - bridge-only; Report still classifies this as bridge-only; do not expose as registry-quality.
- /sw/zana/utayari-wa-kustaafu/ - human-review-required; Specialist-risk route is safe for general discoverability only after disclaimers; registry promotion should wait for human/domain review.
- /sw/zana/uwiano-wa-kiuno-na-nyonga/ - human-review-required; Specialist-risk route is safe for general discoverability only after disclaimers; registry promotion should wait for human/domain review.

## Registry Action

- `assets/js/components/tool-registry.js` was not edited.
- No navbar fallback or minified companion change was required.

## Validation

- `npm run audit` passed: 2370 registry rows, 2365 live/new rows have landing pages, missing page 0.
- `npm run check-links` passed: 8485 HTML files scanned, 80869 internal links checked, 0 broken internal links.
- `npm run build:i18n:validate` passed for `fr`, `sw`, `yo`, and `ha`.
- `npm run validate:hreflang` passed with 1 carried warning: `sw/blogu/index.html` references `fr/blog/index.html` without reciprocity.
