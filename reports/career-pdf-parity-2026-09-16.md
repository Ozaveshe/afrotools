# Career PDF parity check — 2026-09-16

## Scope and candidate

Base: `6183e6395a8168a55fdb1c1591113c368179edac`. Isolated branch `codex/career-parity-20260916`.

The CV ATS PDF previously normalized away accents and deleted non-ASCII text. The cover-letter PDF retained French accents but silently lost unsupported scripts. Both were reproduced with synthetic text and PDF extraction.

The career-only PDF helper now embeds local Noto Sans regular/bold through the existing jsPDF runtime. It checks every character against both fonts before rendering, measures line wrapping with those fonts, preserves selectable text and supports multipage output. It performs no document upload. Only static font/library requests occur. The cover-letter export snapshots the reviewed draft and cancels if it changes during font loading.

Fonts, license and source-byte hashes: `assets/fonts/noto-sans/provenance.json`. Pinned upstream commit `ffebf8c1ee449e544955a7e813c54f9b73848eac`; unmodified OFL 1.1 font files, approximately 1.1 MB combined, fetched locally on first PDF export and cached in the current page.

## Fresh proof

- `node --test tests/cv-ats-pdf-character-preservation.test.js`: 14 passed. Full text extraction checks for EN/FR/SW, extended Latin, NFC combining accents, punctuation, long-word wrapping, multipage content, unsupported-character failure and pinned source hashes.
- `node --test tests/french-document-pdf-parity.test.js`: 40 passed. These are existing contract checks, not fresh all-feature acceptance.
- `playwright test tests/e2e/cv-ats-pdf-character-preservation.spec.js --workers=1`: all 14 tests passed together on the completed native-label/stale-state followup. Static server is this worktree at port 4216, with analytics disabled and external requests blocked.
- Actual CV ATS PDF downloads tested on `/tools/cv-builder/`, `/fr/tools/generateur-cv/`, `/sw/zana/mjenzi-cv/`.
- Actual cover-letter PDF, TXT, JSON and Word-compatible HTML/DOC downloads inspected on `/tools/cover-letter-generator/app.html`, `/fr/tools/generateur-lettre-motivation/app.html`, `/sw/zana/barua-ombi/`. PDF text was parsed independently; JSON was parsed. Word was inspected as its actual HTML/DOC format, not claimed as DOCX or tested in Microsoft Word.
- All six routes checked for document overflow at 320px and 390px. This is not a complete visual/accessibility audit.
- Synthetic PDF rendered with Poppler and visually inspected for extended Latin and punctuation; no missing-glyph boxes or clipping in the checked fixture.
- `git diff --check`: passed.

## Limitations and remaining parity work

- Noto Sans is not a universal Unicode font. Missing glyphs stop the download with localized Word/DOCX or TXT guidance. Complex script shaping and arbitrary scripts are not accepted by this work.
- This repairs CV ATS PDF and cover-letter PDF; other CV templates, text/PDF/DOCX resume import, all templates, optional AI consent/failure flows and Microsoft Word compatibility have not been freshly retested.
- Cover-letter action inventory matches across the three routes: copy, local save, PDF, rebuild, Word, TXT, JSON, import and print. Presence is not full behavioral proof for unexercised actions.
- CV section headings, generated date labels, placeholders and reference fallback text now use the page locale. Full generated-text-to-PDF tests preserve user-entered content unchanged. CV data/template/country changes during font loading cancel the pending PDF and preserve the snapshot filename.
- The editable ATS modal now exports its current textarea to TXT/PDF, keeps the original CV fields unchanged, rejects empty text, and cancels a PDF if the textarea changes during font loading. Modal labels and its textarea accessible name are native in EN/FR/SW.
- No public route, SEO metadata, analytics event name or generated page changed. Normal release asset hashing/build remains required. No deployment or production parity claim.

Followup checks: existing French document/PDF contracts (40), CV DOCX/application-pack verifier, `build:i18n:validate`, and `validate:hreflang` passed.

Edited-text followup: `tests/e2e/cv-ats-edited-text.spec.js` passed all four cases together (EN/FR/SW keyboard TXT/PDF downloads and delayed-font stale-editor cancellation). Complete extracted text matches the edited textarea; original CV state is unchanged; no fixture content appears in network URLs/bodies. The 14-case character/label suite passed before this separate modal change; the 14 node tests and DOCX/application-pack verifier passed again after it. The French runtime was regenerated through `build-french-cv-runtime.js` and an independent owner-output equality check passed.

Harness followup: the combined edited-export plus empty-validation test exceeded its 60-second total budget on repeated EN/FR runs. Trace inspection showed successful individual actions and rendered feedback near the deadline. The checks are now separate bounded cases, and feedback assertions target the actual toast rather than the entire page. No assertion or timeout was relaxed. Earlier pointer-stability waits remain an open observation; keyboard activation does not establish pointer usability.
Harness validation on port 4216: all 7 edited/empty/stale cases passed together (1.6 minutes); all 14 character/native-feedback cases passed together separately (1.3 minutes). Product source was unchanged.

## DOCX field and language followup

Actual EN/FR/SW DOCX downloads omitted website and portfolio whenever GitHub was supplied. The source now retains each contact URL independently, localizes generated headings/date labels/defaults and export guidance, and emits an actual bullet in the Word numbering XML. User text is preserved. French runtime was regenerated through its owner.

Validation: `node --test tests/cv-docx-localized-fields.test.js` (3 passed); `node scripts/verify-cv-docx-export.js` (passed); `playwright test tests/e2e/cv-docx-localized-fields.spec.js --workers=1` (3 passed, port 4216). Actual downloaded ZIP/XML preserves accented names, all supplied contact links, education details and reference relationship text. This checks DOCX package content, not Microsoft Word rendering. Styled PDF and JSON restoration followups are documented below.

## Styled PDF scope and remaining inventory

The current registry exposes 30 template IDs. Fresh baseline downloads covered Lagos Corporate in EN/FR/SW, plus Pan-African Minimal and Nairobi Tech in EN. This is three distinct templates, not all-template acceptance. Styled PDF uses a raster image; selectable/parser-compatible text remains the separate ATS PDF mode.

The active production-template owner now retains alternate phone, GitHub, website, portfolio, education description and reference relationship. Generated section headings and current-employment dates use native copy. Dark-header names inherit white, and Lagos role text uses a readable light color. The shared Swahili accessibility layer excludes only CV preview/export documents from color overrides, retaining application chrome rules. A real French 320px overflow in saved-draft action labels was fixed by wrapping the card actions.

Validation: five node renderer/locale tests passed; three browser cases passed together across EN/FR/SW (two production templates per locale, complete supplied-field assertions, dark-header colors, 320/390px reflow and toolbar keyboard focus). Synthetic actual PDFs were rendered with Poppler and visually inspected for readable names, retained links/details and clipping. This is bounded fixture proof, not every template, arbitrary-content pagination or full accessibility acceptance.

The initially confirmed Pan-African Minimal field gap and JSON restoration gap were subsequently repaired as documented below. Other template families, print and application-pack behavior remain incompletely exercised. The earlier ATS pointer-stability observation remains open.

## JSON backup restoration

Current schema-v1 AfroTools CV backups can now be restored from the existing import dialog in EN/FR/SW. A native preview and Restore action apply the backup as a new local CV version, preserving the prior master and named versions. No additional consent checkbox or network submission is involved. The JSON file retains original field content, country, template and accent settings.

Validation rejects malformed JSON, unsupported schema/source, prototype keys, invalid field shapes, unknown templates/countries and remote photo URLs before state mutation. Storage failure restores the prior draft state and storage values. JSON review supports keyboard focus containment and Escape; its 320px layout was checked.

Fresh proof: `node --test tests/cv-json-backup.test.js` passed 12 tests. `tests/e2e/cv-json-backup.spec.js` covers six distinct browser cases: actual JSON export, new draft, reviewed import, reload, exact recovered data/settings, and parsed ATS PDF/DOCX recovery in all three locales; plus invalid-file and keyboard checks. The initial final run passed five cases and caught French error-copy encoding corruption. After correcting UTF-8 source handling, both French cases passed in the targeted rerun. All six distinct cases therefore have passing proof; they were not rerun together after that copy-only correction. Tests use synthetic content and verify no fixture content in request URLs or bodies.

Existing French document contracts (40) and CV DOCX/application-pack verifier passed. The French importer was regenerated through `build-french-cv-runtime.js`. PDF proof covers ATS PDF; this restoration change does not establish new acceptance for all styled templates, arbitrary Unicode scripts or Microsoft Word rendering. No deployment was performed.

JSON final followups: all three roundtrip cases passed again after synchronizing the immediate saved-CV list with the existing version-system mirror. Known legacy renderer IDs remain compatible: a focused `slate` backup import/reload case passed after resolving the legacy global binding. There are seven distinct browser cases with passing evidence across these runs. `npm run build:i18n:validate` passed. No broad build/deployment was run for this next-batch candidate.


## Pan-African Minimal field completeness

The editor reads the lexical `CVTemplates` binding, while expanded renderers register on a distinct `window.CVTemplates` object. Selecting Pan-African Minimal therefore fell back to Slate in the real editor/export path. Its reviewed renderer is now registered on both bindings in `tools/cv-builder/js/cv-pdf-templates.js`; other expanded IDs are not newly activated or accepted.

The text-first, intentionally photo-free template retains independent contact links, alternate phone, education grade and description, reference relationship, native section/date labels and all supplied skills. Existing shared helpers retain enabled projects, certifications, languages and optional extra sections. ATS text export also now retains both website and portfolio, and both education grade and description, instead of selecting one value with `||`. French ATS runtime was regenerated through its owner.

Validation after the separately committed mobile sizing repair:17 node tests passed (three template-binding/field/native tests plus14 PDF character/native contracts); three browser cases passed together in44.2seconds on port4216. Each locale exported a real styled PDF and ATS PDF from a320px input viewport. Styled PDFs parsed as one page with paper-resolution image streams; ATS parser output retained every checked contact, education and reference value.320/390px app overflow and synthetic-content network checks passed. Poppler-rendered EN/FR/SW styled first pages were visually inspected: native headings, readable accented name, full-width header, retained contacts and education/reference details, no visible clipping in this fixture.

This is bounded template/fixture evidence, not all30-template acceptance, arbitrary-length pagination or universal script shaping. Styled PDFs remain raster; ATS PDF provides selectable text. The independent sizing repair is documented in `reports/cv-mobile-pdf-sizing-2026-09-16.md`. No push or deployment was performed.

Pan-African Minimal owner/route checks: CV template registry verifier PASS, French CV runtime regeneration completed, build:i18n:validate PASS, git diff --check PASS. Full release checks remain coordinator-owned.
