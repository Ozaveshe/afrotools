# Cover-letter backup and export slice

## Scope
EN `/tools/cover-letter-generator/app.html`, FR `/fr/tools/generateur-lettre-motivation/app.html`, SW `/sw/zana/barua-ombi/` share `assets/js/pages/cover-letter-generator.js`. Isolated branch started at 8958ba5a after fetching origin/main 7e2fba2b3cc82959cf903b72172ada1231f91a13.

## Repair
JSON imports now validate the full input before mutation, reject invalid shapes/types/unknown versions/prototype keys/unknown options and oversized files, and clear the incoming saved ID. Saving an imported draft creates a new local entry instead of overwriting the original. Empty letter text restores faithfully and remains empty after reload. Missing optional fields clear consistently; existing unversioned backups remain supported. New exports identify schema version 1. Native import feedback and file-reader failure feedback preserve the current draft. No account, server or AI gate was added.

## Evidence
`tests/e2e/cover-letter-backup-parity.spec.js` exercises actual downloaded JSON, malformed imports, saved-entry count, all exported form values, empty restore/reload, actual PDF/DOC/TXT exports, copy and print across three locales at 320px. PDF and print outputs are parsed with pdf-parse; DOC is HTML-based Word-compatible `.doc` and is inspected structurally, not certified as native DOCX. The copy test observes the local clipboard API call. Print verifies the normal Print command then captures Chromium print output; it does not automate a physical printer dialog. Synthetic fixture only; request checks prohibit sending the fixture text and mobile document overflow is checked.

## Remaining app gaps
Fresh actual FR/SW generated drafts are still English: the shared runtime supplies English template prose, dates, salutations and placeholders. This is confirmed and is the next separate repair. Word application rendering, all template/tone/length combinations, long-document visual layout and print chrome remain unaccepted. These focused checks do not certify complete app parity or production deployment.
