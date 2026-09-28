# Nigeria exam-content development

Scope: JAMB, WAEC and NECO Mathematics and English. Do not count an app feature,
original exercise or external resource link as an imported past question.

## Coverage and acquisition

Run `node scripts/audit-nigeria-exam-coverage.js` after question-bank changes.
Use `--check` to detect stale reports. Outputs under `ops/nigeria-exams/` are
internal evidence, not a public data feed. `source-candidates.json` records
source leads, inspection results and the next concrete acquisition step.

JAMB publication remains owned by `scripts/build-jamb-reviewed-data.js`,
`ops/jamb/source-pool.json` and `data/jamb/review-ledger.json`. Do not bypass
that review contract or insert new questions directly into generated pools.

A complete paper requires a source fingerprint, exam/subject/year/session/paper
identity, original instructions and a reconciled inventory of every question
and subpart. Verify all passages, figures, answers and source-use basis. Counts,
year labels and consecutive numbering alone do not prove completeness.
UTME compilations may combine more than one version. Preserve unknown expected
totals as null; do not substitute an assumed examination length.

Priority: acquire recent 2021–2026 JAMB Mathematics and English sources; resolve
the six recorded WAEC 2023 Mathematics source defects; acquire the missing WAEC
English comprehension/summary material; authenticate recent NECO internal and
external papers separately. Never invent missing text, dates or answer keys.

## Written practice

`assets/js/lib/ssce-written-bank.js` owns original tasks and separately labelled
WAEC/NECO source-linked companions. The companions provide adapted question briefs, with redrawn geometry figures
where needed. Original wording, passages and diagrams generally remain at the linked source.
The two selected NECO 2023 English reading tasks include complete matching passages
and question parts, with independently authored optional self-review guidance; a
companion is not a complete hosted paper. Only include guides
whose necessary source context has actually been inspected. Changes to a
mathematical guide require independent numerical checks in
`tests/ssce-written.test.js`. Narrative and writing tasks use self-review, not
an invented official score or an automatic essay-quality grade.

The WAEC 2022 school-candidate English Paper 2 composition selection covers
questions 1–5 as adapted writing companions. The official WAEC hub and each
question page establish the sitting, task and examiner observation; they do not
show the common Section A instruction or word minimum. A secondary 2022 paper
transcription says to answer one question in at least 450 words, but the
companion does not attribute or enforce that threshold as an official rubric.
The original wording stays at WAEC. The related selected-components ledger
records source links and the distinct fingerprint basis used for these pages.

The NECO 2023 English Paper II Section A selection covers all four writing choices in the inspected scan. The shared instruction asks candidates to choose one and write at least 450 words. The existing Q5 and Q6 reading tasks now include their complete matching passages and parts, including both continuation pages. Keep the same task IDs, bank version and three checklist positions so saved answers and backups remain compatible. Q5 vocabulary replacements must preserve context and grammar; Q6 accepts any six distinct functions supported by its passage. The selection is not a complete English paper or an official marking scheme, and the scan does not authenticate an internal/external sitting. The private selected-components record documents the selected educational source use without inventing a licence or board approval.

`assets/js/lib/ssce-written.js` owns validated local state and report exports;
`assets/js/pages/ssce-written.js` owns the editor. Keep responses out of analytics,
URLs, AI requests and server storage. Preserve corrupt or unavailable storage,
keep the editor usable, and allow a local backup. Import must validate before
modifying the current session and preserve existing responses on overlap.

The initial written-practice feature is on the English page. The existing
French quick-question bank and its shared progress contract remain separate.
Do not claim the new written companion has French parity until it is translated
and tested. Neither route claims complete WAEC/NECO syllabus coverage.

Checks: `node --test tests/ssce-written.test.js`, existing SSCE node tests,
`npx playwright test tests/e2e/ssce-written.spec.js tests/e2e/ssce-practice.spec.js tests/e2e/ssce-practice-fr.spec.js`.
