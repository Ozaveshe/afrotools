# French education: SSCE pilot extension

The catalogue now contains 43 English education tools with native French destinations. The additional tool is `/tools/ssce-practice/`, paired with `/fr/tools/pratique-waec-neco/`. Existing category evidence remains in `reports/fr-education-parity-receipt.md`; this record covers the extension and the catalogue checks rerun for it.

The pilot contains 24 original Mathematics exercises and 16 original English exercises. Mathematics prompts, worked solutions and feedback are translated. English learning prompts, options and passages remain in English with explicit language attributes; their explanations and the surrounding interface are French. No examination year, official endorsement, full syllabus or external educator review is claimed.

Verified locally on 2026-09-13:

- `node --test tests/ssce-practice-french.test.js`: both tests passed. All 40 identities and answer positions are preserved; Mathematics option values are unchanged; the English bank is not mutated; saved progress and report content work across languages.
- `playwright test tests/e2e/ssce-practice-fr.spec.js tests/e2e/ssce-practice.spec.js --workers=2`: six tests passed. Includes 320px reflow, grading, explanations, actual downloaded report contents, backup restoration and storage-failure fallback.
- `playwright test tests/e2e/fr-education-category-parity.spec.js --workers=3`: 45 tests passed. Catalogue links, all 43 native destinations, metadata, themes and mobile reflow passed; the existing planner export was also checked.
- `node scripts/audit-fr-education-parity.js`: 43 routes, hub links, artwork references and French AI destinations; no failures.
- `node scripts/build-ai-french-route-map.js`: all 1,257 router records mapped; no missing or ambiguous route.

The learner flow is local-first. JSON backups and TXT reports require an explicit download; answering questions does not send their content to an AI service. The daily planning link is explicitly labelled as an English interface.

The final bilingual `npm run build:deploy` and `npm run audit:dist` passed. The packaged education run passed 28 browser tests, including both practice languages, student-day planning, application tracking, admission workflows and mobile reflow. `npm run build:i18n:validate` and `npm run validate:hreflang` also passed. The extended French owner declaration test verifies the 43 routes and the shared practice engine.

This is repository and packaged-browser evidence, not production deployment evidence. Full repository gates and verified deployment remain separate release checks.
