# SSCE practice localization

`scripts/build-ssce-practice-locales.js` owns the French and Swahili practice pages and generated banks. Run `npm run ssce:locales:build`, then `npm run ssce:locales:check`. The normal surface build invokes this owner before locale coverage synchronization.

## Sources

- Quick English questions: `assets/js/lib/ssce-practice-bank.js`.
- Existing French quick adaptation: `assets/js/lib/ssce-practice-bank-fr.js`.
- Swahili quick teaching: `scripts/lib/ssce-practice-sw-content.js`.
- English written tasks: `assets/js/lib/ssce-written-bank.js`.
- French/Swahili written teaching: `scripts/lib/ssce-written-locale-content.js`.
- Shared localized controls, errors and provenance: `scripts/lib/ssce-locale-ui.js`.
- Page copy and output routes: `scripts/build-ssce-practice-locales.js`.

Do not edit generated Swahili quick or French/Swahili written banks directly. The generator fails when question identities or written checklist counts drift. If English adds a task or changes a checklist, review every locale before rebuilding. Keep checklist meanings in the original order so backups retain their meaning.

## Assessment language and source boundaries

English assessment questions, options, passages and model English responses remain English, with explicit language attributes. Translate the surrounding instruction, feedback and teaching guidance. Mathematics translation must retain the quantities, formulas, answer positions and jurisdiction. A Swahili interface does not turn WAEC/NECO into an East African examination.

Preserve original bank IDs, question IDs and source metadata. Original exercises have no exam-year attribution. WAEC companions retain their source year, question number and links. Neither localization nor the self-review checklist constitutes official marking, full-paper coverage, syllabus completeness or external educator approval.

Both workflows retain the shared local backup keys and engines. Written responses are never sent for grading. JSON backups and TXT reports are explicit user downloads. Do not log entered responses or store them in analytics.

## Validation

- `npm run test:ssce-locales`: identity, English-text preservation, cross-language backup and report contracts.
- `npm run test:ssce-locales:browser`: bilingual mobile controls, all written tasks, diagrams, parsed downloads, import and private-data network checks.
- Existing `tests/ssce-practice*.test.js`, `tests/ssce-written.test.js` and corresponding browser specs protect English and existing French behavior.
- Regenerate locale coverage and route contracts through their existing owners before localization/hreflang validation and release packaging.

These checks produce candidate evidence. They do not set a locale acceptance record or prove production deployment.

## Upstream education integration, 16 September 2026

Production source ab47607e expanded the shared English bank to 52 quick questions and 37 written tasks. FR and SW now retain all 89 identities, including 12 original Physics questions and nine WAEC 2022 mathematics companions. New assessment prompts and answers remain English and carry `lang=en`; localized teaching steps, pitfalls, checklists, subject/topic labels and the page boundary explain this choice. Existing localized mathematics and English assessment boundaries remain unchanged. Sources, numerical answer indices, subparts and backup identities are preserved. The former 40/28 counts describe the earlier checkpoint only.

The reviewed French quick-content base is `scripts/lib/ssce-practice-fr-base.js`; the locale generator now owns both emitted quick banks. New guidance is owned by `scripts/lib/ssce-2022-physics-locale-content.js`. This does not claim full examination coverage or official marking.
