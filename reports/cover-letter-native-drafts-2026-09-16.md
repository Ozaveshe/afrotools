# Cover-letter native generation and user-text boundary

## Confirmed defects and repair
Fresh FR and SW routes generated English salutations, dates and paragraphs. The shared owner now generates native French/Swahili drafts, retaining all ten sector selections, five tones, three length modes, market context and supplied optional fields. User values are inserted without translation. Missing identity/role/organisation/achievement information uses explicit native placeholders, blocked from export until completed instead of invented evidence. Template/tone/length choices keep stable stored values and native visible labels. Generation/edit/export feedback and saved-title scaffolding are native.

The previous localizers changed literal user `Language` to `Langue` in French and `Skills/Language/Reference` to `Ujuzi/Lugha/Rejea` in Swahili print previews. Explicit markers now protect only user paragraphs, saved titles and keyword chips. Ordinary chrome still localizes, including separate receipt-route regression cases. Empty-preview guidance is not excluded.

## Validation
- Three node tests exercise 300 locale/template/tone/length combinations with exact supplied-field retention and native closing text.
- Seven browser tests passed in run 48478 (1.3 minutes): EN/FR/SW 320px restore/export workflow; actual FR/SW ten-template generation at 390px, placeholder guard, native parsed PDF and print output, saved-title/user-text collision safety, and unrelated receipt chrome.
- Forty French Document/PDF source contracts passed. `build:i18n:validate`, `validate:hreflang`, and syntax/diff checks passed in this isolated branch. These checks are not production proof.
- Microsoft Word 16 opened all three actual HTML-based DOC exports read-only and exported three single-page PDFs. All three were parsed for fixture content, rendered with Poppler and visually inspected; layout, accents, line breaks and final signature were present. The files remain Word-compatible DOC, not DOCX packages.
- Native FR/SW downloaded PDFs were rendered and inspected: readable text and complete final signatures. Native browser print captures also preserve all text, but inspection found the transient download toast printed at the page bottom. This is a confirmed separate fix, not accepted print parity.

## Limits
Word visual proof uses one equivalent edited fixture per locale, not every generated configuration. Long-document pagination, all-script font shaping, every score/help string, share-link privacy, cover-letter CV/JD imports and AI consent paths remain unverified in this wave. Older `cv-ats-pdf-character-preservation.test.js` CV heading fixtures fail because they omit the now-required project/reference visibility flags; no CV code changed here. No deployment, account gate or external data operation occurred.
