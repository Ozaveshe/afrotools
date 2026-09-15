# French and Swahili SSCE practice review

Candidate: `716c4a7171f82106a8af5badc90250b5624405cd`, integrated as `e1b64c3e`.

Both locales provide 40 quick questions and 28 written tasks from the current English source. English assessment questions, options, passages and writing requirements retain their language and identity; mathematics, teaching, controls, feedback and reports are localized. Storage and backup identities remain compatible across English, French and Swahili.

Source owners are `scripts/build-ssce-practice-locales.js` and the locale content modules under `scripts/lib/`. The generator owns the localized banks and pages; no duplicate application engine was introduced.

## Independent coordinator evidence

- Five Node locale tests passed: all 68 identities, numerical meanings, grading, cross-language backups, malformed-backup rejection and source regeneration.
- Four browser cases passed on the candidate, then again on the combined coordinator checkout: French and Swahili quick and written workflows, retries, local exports, parsed downloads, cross-language import, assessment-language boundaries, request privacy, keyboard controls and 320/375px layouts.
- Coordinator inspected the French and Swahili mobile screenshots from the browser run.
- A separate source reviewer found an incomplete Swahili definition of a regular polygon. The owner added equal angles as well as equal sides before the candidate commit; the independent tests ran after that correction.
- The implementation agent additionally reported 18 browser and 14 Node tests passing, including existing English and French regressions, plus links and locale checks. These are agent evidence, distinct from the coordinator runs above.

## Limits

This is acceptance evidence for this application family. It does not renew historical acceptance of other apps or establish deployment, search performance, complete WAEC/NECO syllabus coverage, official endorsement or automatic grading of written responses. Combined generated coverage, release checks and production proof are separate gates.
