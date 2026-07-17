# Swahili Complete Localization Finish Pass - 2026-05-18

## Verdict
Swahili is shippable with carried specialist and bridge debt. This pass polished and promoted the remaining safe low-risk direct `/sw/zana/` routes from the near-completion pool, strengthened `/sw/` search for core bridge queries, and left specialist-risk pages out of registry discovery.

## Current Metrics
- Total Swahili HTML routes: 854
- Indexable Swahili HTML routes: 850
- Unique Swahili registry hrefs: 724
- Broken Swahili registry hrefs: 0
- Direct /sw/zana/ routes: 519
- Unique /sw/zana/ registry hrefs: 493
- Direct /sw/zana/ coverage: 493/519 (94.99%)
- Remaining direct /sw/zana/ gap: 26

## Promoted In This Pass
- /sw/zana/jedwali-la-vipengele/
- /sw/zana/kikokotoo-ielts/
- /sw/zana/kisuluhishi-algebra/
- /sw/zana/kubadilisha-vipimo/
- /sw/zana/mapato-ya-mtayarishi/
- /sw/zana/methali-za-afrika/
- /sw/zana/mkopo-wa-gari-dhidi-ya-fedha-taslimu/
- /sw/zana/mpangaji-ramani-ya-sakafu/
- /sw/zana/mpango-bajeti/
- /sw/zana/nambari-za-kiarabu/
- /sw/zana/orodha-ya-kupakia/
- /sw/zana/orodha-ya-side-hustle/
- /sw/zana/roi-ya-brand-collab/
- /sw/zana/startup-runway/
- /sw/zana/takwimu-za-mtayarishi/
- /sw/zana/ukaguzi-wa-personal-brand/
- /sw/zana/ukaguzi-wa-roadworthiness/
- /sw/zana/ukubwa-wa-septic-tank/
- /sw/zana/ukurasa-wa-mtayarishi/
- /sw/zana/umri-na-jina-la-siku-afrika/
- /sw/zana/unit-economics/
- /sw/zana/vichwa-vya-maudhui/
- /sw/zana/vikoa-vya-afrika/
- /sw/zana/viwango-vya-freelancer/

## Remaining Unpromoted Gap
These routes remain outside registry discovery because prior Swahili reports classify them as specialist-review, bridge-only, duplicate/alias, or not safe for registry promotion without a dedicated gate:
- /sw/zana/gharama-za-hospitali/
- /sw/zana/jikoni/
- /sw/zana/kalenda-ya-kiislamu/
- /sw/zana/kalenda-ya-uzingatiaji/
- /sw/zana/kalori-za-vyakula-vya-afrika/
- /sw/zana/kifuatiliaji-alama/
- /sw/zana/kikokotoo-dhamana/
- /sw/zana/kikokotoo-fungu-la-kumi-na-sadaka/
- /sw/zana/kikokotoo-lobola-na-mahari/
- /sw/zana/kikokotoo-ovulation/
- /sw/zana/kikokotoo-zakat/
- /sw/zana/kituo-cha-developer/
- /sw/zana/maana-ya-majina-ya-afrika/
- /sw/zana/maandalizi-ya-mahojiano/
- /sw/zana/mkataba-wa-ubia/
- /sw/zana/mshauri-seli-mundu/
- /sw/zana/posho-ya-national-service-ghana/
- /sw/zana/posho-ya-nysc/
- /sw/zana/saraka-ya-api-afrika/
- /sw/zana/tarehe-ya-kujifungua/
- /sw/zana/uchunguzi-wa-mpangaji/
- /sw/zana/ukaguzi-wa-halal/
- /sw/zana/ukuaji-wa-mtoto/
- /sw/zana/urithi-wa-faraid/
- /sw/zana/utayari-wa-kustaafu/
- /sw/zana/uwiano-wa-kiuno-na-nyonga/

## Validation
- checkLinks: PASS - npm run check-links - 0 broken internal links, 81345 links across 8524 HTML files
- audit: PASS - npm run audit - 0 missing live/new pages, 2459 registry rows
- buildI18nValidate: PASS - npm run build:i18n:validate - fr/sw/yo/ha keys match en.json
- validateHreflang: PASS WITH WARNINGS - npm run validate:hreflang exited 0. Current direct rerun counted 843 non-bidirectional warnings; this is carried reciprocal hreflang debt, not a broken-link failure.
- seoReport: PASS - npm run seo:report - no auto-fixes needed and 0 remaining hreflang violations in SEO report mode
- diffCheck: PASS - git diff --check - no whitespace errors
- syntax: PASS - node --check registry source/minified and selected inline JS checks passed

## Files Intentionally Changed
- sw/index.html
- assets/js/components/tool-registry.js
- assets/js/components/tool-registry.min.js
- sw/zana/jedwali-la-vipengele/index.html
- sw/zana/kikokotoo-ielts/index.html
- sw/zana/kisuluhishi-algebra/index.html
- sw/zana/kubadilisha-vipimo/index.html
- sw/zana/mapato-ya-mtayarishi/index.html
- sw/zana/methali-za-afrika/index.html
- sw/zana/mkopo-wa-gari-dhidi-ya-fedha-taslimu/index.html
- sw/zana/mpangaji-ramani-ya-sakafu/index.html
- sw/zana/mpango-bajeti/index.html
- sw/zana/nambari-za-kiarabu/index.html
- sw/zana/orodha-ya-kupakia/index.html
- sw/zana/orodha-ya-side-hustle/index.html
- sw/zana/roi-ya-brand-collab/index.html
- sw/zana/startup-runway/index.html
- sw/zana/takwimu-za-mtayarishi/index.html
- sw/zana/ukaguzi-wa-personal-brand/index.html
- sw/zana/ukaguzi-wa-roadworthiness/index.html
- sw/zana/ukubwa-wa-septic-tank/index.html
- sw/zana/ukurasa-wa-mtayarishi/index.html
- sw/zana/umri-na-jina-la-siku-afrika/index.html
- sw/zana/unit-economics/index.html
- sw/zana/vichwa-vya-maudhui/index.html
- sw/zana/vikoa-vya-afrika/index.html
- sw/zana/viwango-vya-freelancer/index.html
- reports/sw-complete-localization-finish-pass-2026-05-18.md
- reports/sw-complete-localization-finish-pass-2026-05-18.json

## Notes
- The old 465 direct `/sw/zana/` baseline is stale in this checkout; the live tree now has 519 direct `/sw/zana/` routes because other generated/source work has added Swahili pages.
- `validate:hreflang` still reports reciprocal warning debt, including Swahili-to-English pairs. The command exits 0 and `seo:report` reports 0 remaining hreflang violations, so this is carried proof debt rather than a hard Swahili release blocker.
- Specialist-risk pages such as medical, legal, religious, finance and education pages remain planning aids and need domain review before registry promotion.
