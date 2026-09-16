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
- This repairs CV ATS PDF and cover-letter PDF; other CV templates, complete resume import/backup, all templates, optional AI consent/failure flows and Microsoft Word compatibility have not been freshly retested.
- Cover-letter action inventory matches across the three routes: copy, local save, PDF, rebuild, Word, TXT, JSON, import and print. Presence is not full behavioral proof for unexercised actions.
- CV section headings, generated date labels, placeholders and reference fallback text now use the page locale. Full generated-text-to-PDF tests preserve user-entered content unchanged. CV data/template/country changes during font loading cancel the pending PDF and preserve the snapshot filename.
- The editable ATS modal now exports its current textarea to TXT/PDF, keeps the original CV fields unchanged, rejects empty text, and cancels a PDF if the textarea changes during font loading. Modal labels and its textarea accessible name are native in EN/FR/SW.
- No public route, SEO metadata, analytics event name or generated page changed. Normal release asset hashing/build remains required. No deployment or production parity claim.

Followup checks: existing French document/PDF contracts (40), CV DOCX/application-pack verifier, `build:i18n:validate`, and `validate:hreflang` passed.

Edited-text followup: `tests/e2e/cv-ats-edited-text.spec.js` passed all four cases together (EN/FR/SW keyboard TXT/PDF downloads and delayed-font stale-editor cancellation). Complete extracted text matches the edited textarea; original CV state is unchanged; no fixture content appears in network URLs/bodies. The 14-case character/label suite passed before this separate modal change; the 14 node tests and DOCX/application-pack verifier passed again after it. The French runtime was regenerated through `build-french-cv-runtime.js` and an independent owner-output equality check passed.
