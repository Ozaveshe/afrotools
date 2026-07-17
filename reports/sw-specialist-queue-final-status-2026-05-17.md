# Swahili Specialist Queue Final Status

Date: 2026-05-17

Prompt: 124 - Swahili Specialist Queue Final Status Audit

## Summary

Review-only audit. No page copy was edited.

- Specialist queue entries: `22`.
- Already in Swahili registry: `0`.
- Safe to remain discoverable with disclaimers: `8`.
- Bridge-only until specialist or official-source review: `14`.
- Human/domain review needed before registry: `22`.
- Not-for-registry right now: `22`.

No specialist-risk route is currently in `assets/js/components/tool-registry.js`, which is acceptable. These pages can remain indexable when their copy frames the output as planning, education, or bridge content, but they should not be promoted until a later specialist decision gate explicitly accepts them.

## Risk Buckets

| Bucket | Count | Current status |
| --- | ---: | --- |
| Health | 7 | Mixed: 5 safe-with-disclaimers discoverable pages, 2 bridge-only pages. |
| Religious/cultural | 6 | Bridge-only until religious, cultural, or legal context is reviewed. |
| Legal | 4 | Bridge-only until jurisdiction/legal review. |
| Government/admin | 2 | Bridge-only until official-source review. |
| Education | 1 | Safe to remain discoverable with school-verification disclaimer. |
| Legal-HR | 1 | Safe to remain discoverable with HR/legal-verification disclaimer. |
| Finance | 1 | Safe to remain discoverable with finance-planning disclaimer. |

## Safe With Disclaimers

- `/sw/zana/gharama-za-hospitali/` - health cost planning; keep clinician, insurer, and hospital verification language.
- `/sw/zana/kalori-za-vyakula-vya-afrika/` - nutrition education; avoid diet prescription.
- `/sw/zana/kifuatiliaji-alama/` - education planning; avoid official GPA/admission claims.
- `/sw/zana/kikokotoo-ovulation/` - cycle estimate; avoid pregnancy certainty or clinical advice.
- `/sw/zana/maandalizi-ya-mahojiano/` - interview preparation; avoid employment or legal outcome claims.
- `/sw/zana/tarehe-ya-kujifungua/` - pregnancy date estimate; direct users to clinicians.
- `/sw/zana/utayari-wa-kustaafu/` - finance planning; avoid investment or retirement guarantee language.
- `/sw/zana/uwiano-wa-kiuno-na-nyonga/` - health education; avoid diagnosis language.

## Bridge-Only Or Human-Review Required

- `/sw/zana/kalenda-ya-kiislamu/`
- `/sw/zana/kalenda-ya-uzingatiaji/`
- `/sw/zana/kikokotoo-dhamana/`
- `/sw/zana/kikokotoo-fungu-la-kumi-na-sadaka/`
- `/sw/zana/kikokotoo-lobola-na-mahari/`
- `/sw/zana/kikokotoo-zakat/`
- `/sw/zana/mkataba-wa-ubia/`
- `/sw/zana/mshauri-seli-mundu/`
- `/sw/zana/posho-ya-national-service-ghana/`
- `/sw/zana/posho-ya-nysc/`
- `/sw/zana/uchunguzi-wa-mpangaji/`
- `/sw/zana/ukaguzi-wa-halal/`
- `/sw/zana/ukuaji-wa-mtoto/`
- `/sw/zana/urithi-wa-faraid/`

## Registry Check

The audit compared every specialist queue route with current Swahili registry hrefs. Result: `0/22` specialist-risk routes are in the registry.

This is the correct default posture. The queue can be revisited after conservative rewrites, but none should be promoted merely to improve coverage.

## Prompt 125 Legal/Admin Rewrite

Scoped rewrite completed for legal, legal-HR, and government/admin queue pages.

- Edited `/sw/zana/mkataba-wa-ubia/` to label the output as a planning draft, not a verified legal contract.
- Edited `/sw/zana/maandalizi-ya-mahojiano/` to make interview-prep copy explicit that it does not promise a job, salary, contract, or offer; also corrected the page JSON-LD `offers` property.
- Reviewed `/sw/zana/kalenda-ya-uzingatiaji/`, `/sw/zana/kikokotoo-dhamana/`, `/sw/zana/uchunguzi-wa-mpangaji/`, `/sw/zana/posho-ya-national-service-ghana/`, and `/sw/zana/posho-ya-nysc/`; existing disclaimer posture remains conservative.

Legal/admin pages remain human-review-before-registry.

## Prompt 126 Health Rewrite

Scoped health rewrite completed.

- Edited `/sw/zana/gharama-za-hospitali/` metadata and JSON-LD so the page does not imply final hospital prices, insurance approval, diagnosis, or treatment advice.
- Edited `/sw/zana/kalori-za-vyakula-vya-afrika/` metadata and JSON-LD to frame calorie output as food-planning education, not medical nutrition therapy or a diet prescription.
- Edited `/sw/zana/tarehe-ya-kujifungua/` metadata, JSON-LD, and hero copy to avoid due-date or pregnancy certainty.
- Edited `/sw/zana/mshauri-seli-mundu/` social metadata and FAQ JSON-LD so genotype wording points back to testing, clinicians, and genetic counselors.
- Reviewed `/sw/zana/kikokotoo-ovulation/`, `/sw/zana/ukuaji-wa-mtoto/`, and `/sw/zana/uwiano-wa-kiuno-na-nyonga/`; existing disclaimer posture remains conservative.

Health pages remain safe to discover as educational/planning aids, but human/domain review is still required before registry promotion.

## Prompt 127 Religious/Cultural Rewrite

Scoped religious and cultural rewrite completed.

- Edited `/sw/zana/kikokotoo-zakat/` hero copy so the page prepares zakat questions for a scholar rather than implying a final ruling.
- Edited `/sw/zana/urithi-wa-faraid/` hero copy so the page is an inheritance planning aid for scholar/court review rather than a final Faraid distribution.
- Reviewed `/sw/zana/kalenda-ya-kiislamu/`, `/sw/zana/kikokotoo-fungu-la-kumi-na-sadaka/`, `/sw/zana/kikokotoo-lobola-na-mahari/`, and `/sw/zana/ukaguzi-wa-halal/`; existing copy already avoids doctrine, official calendar, certificate, price, and cultural-prescription claims.

Religious/cultural pages remain bridge-only or human-review-before-registry.

## Prompt 128 Finance And Education Rewrite

Scoped finance and education rewrite completed.

- Edited `/sw/zana/kifuatiliaji-alama/` metadata, social metadata, JSON-LD, and grading-system copy so the page is framed as study planning, not an official transcript, admission decision, or guaranteed GPA record.
- Edited `/sw/zana/utayari-wa-kustaafu/` warning and FAQ copy so retirement output is clearly a planning estimate, not an investment-return, pension, tax, or retirement-readiness guarantee.

Finance and education queue pages are safe for general discoverability as planning aids, but they still require human/domain review before any registry promotion.
