# Swahili CV application-pack language and exports

Fetched remote baseline: `e9fed80dd64f54f84866f33ea849c9de8c99b1ce`. Branch baseline: coordinator's integrated local first-release candidate `2ef6c2d74ea08f0f4c047bf639908e68ff36099a`, which includes the first Swahili document repair and shared awaited ZIP/PDF helper. Isolated worktree: `C:/Users/Oza/.codex/worktrees/sw-cv-pack-20261005/afrotools`; branch: `codex/sw-cv-pack-language-20261005`. This is a separate second batch for integration after the first product release.

## Confirmed audit findings

Actual browser downloads from the English/French/Swahili routes showed that shared application-pack templates generate ordinary English letter, email, recruiter, interview-preparation and follow-up prose. Swahili ZIP cover-letter TXT/PDF and email TXT remained English; the CV TXT headings already followed the selected locale. French also retained those generated prose fragments despite a localized runtime build.

The standalone Swahili pack TXT had English headings/date labels, and tracker CSV had 15 English column names. UI status `Imetolewa pakiti kamili ya programu kutoka kwa CV ya sasa` incorrectly described a software package. `Okoa na maombi ya kazi`, `Barua ya jalada`, and PDF failure wording ending in `DOC usafirishaji` needed context. Native target validation and copy-failure messages already existed.

Real standalone PDF parsing also exposed a carried Helvetica Unicode defect: accented author names were encoded incorrectly. The ZIP PDF helper already supported the needed embedded font after the shared first-batch fix. The mobile command bar intercepted a pack PDF pointer click; this batch fixes that locally, rather than relying on forced or centered test clicks.

## Scoped owners and files

- Source copy: `data/localization/sw-cv-application-pack-copy.json` owns complete generated prose and reviewed fragments, all five tone labels, pack controls/failures, and CSV presentation labels.
- Generator: `scripts/build-swahili-cv-application-pack-runtime.js` reads exactly `cv-application-pack.js`, `cv-application-pack-export.js`, `cv-application-pack-polish.js`, and `cv-job-tracker.js` under `tools/cv-builder/js`. AST edits protect object keys and stored status/tone/source/identifier values. CSV mapping is limited to the header, printable status and attachment boolean labels.
- PDF adapter: the generated Swahili standalone pack export calls the existing awaited `CVExportAtsPlainPdf.buildPdf` helper, preserving authored Unicode. The shared English/French writers are not edited.
- Mobile source: `assets/css/sw-cv-application-pack.css` keeps the command bar in normal flow only on the Swahili route while pack controls have focus.
- Page source owner: `scripts/build-swahili-document-pdf-parity.js` builds these scoped modules and rewrites CV-only script references, with output-hash cache versions.
- Generated output: the four modules plus `application-pack-manifest.json` under `sw/zana/mjenzi-cv/js/`, and `sw/zana/mjenzi-cv/index.html`.
- Regression sources: `tests/swahili-cv-application-pack.test.js`, `tests/e2e/swahili-cv-application-pack.spec.js`; strategy documents the repeatable owner/build workflow.

## Validation

- PASS: native module generation and `--apps=cv-builder --check`; all four outputs and source hashes reconcile.
- PASS: 14 combined targeted node tests, including five tone variants, authored phrase collisions, protected machine keys/enums and generated route references.
- PASS: new pack browser suite (4/4): real TXT/DOC/standalone PDF/ZIP downloads; native headings/prose/fallback email; reopened PDF bytes and text; stored JSON keys/tone and edited author text retained; native CSV headers/status/attachment labels; copy, target, PDF and ZIP failure states.
- PASS: extended real TXT/PDF pointer clicks at both 320 and 390 widths, without forced/centered clicks. The command bar's active pack position is verified, PDF Unicode is parsed, and document overflow is checked.
- PASS: existing Swahili CV backup browser suite (2/2): restore/reload, parsed ATS PDF and DOCX accented text, invalid JSON, keyboard focus/Escape and 320px layout.
- PASS: `npm run build:i18n:validate`, `npm run validate:hreflang`, changed JS syntax and `git diff --check`.
- PASS: `npm run security:scan`.

## Boundaries and remaining work

User-entered names, contact values, job titles, companies, skills, achievements and edited pack bodies remain verbatim in the tested slots and exports. Existing deterministic extraction/selection, state keys, status/tone codes, filenames, local storage and analytics event names retain their contract. No AI/network service or new content-send path is added; tests use synthetic data with traces, screenshots and videos disabled, and detected no synthetic private values in request URLs/bodies.

The fixture uses `afrotools_cookie_consent='declined'`. Current owners permit documented limited cookieless measurement; this is a private-data preservation check, not a complete analytics-consent audit.

The existing tracker keeps an already-mounted in-memory lead list after the pack writes shared local storage. The CSV roundtrip re-enters the page to load those saved leads. This inherited refresh behavior is not repaired here. English/French pack prose, their legacy standalone PDF Unicode behavior, wider CV editor wording, and broad/native-human editorial approval remain pending outside this batch.

Canonical routes, hreflang, platform counts, calculation/data matching rules and account/export gates are unchanged. Existing 32-row document receipt JSON is untouched. The coordinator must regenerate from final released shared owners, run integrated build/deploy/dist checks and provide exact production proof; this child neither deploys nor claims live production parity.

Rollback: revert this scoped commit and regenerate `--apps=cv-builder` from the retained owners.
