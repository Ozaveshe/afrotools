# CV DOCX multiline and Unicode — 2026-09-16

The DOCX serializer previously collapsed line breaks in summary, education details and project descriptions. It now emits Word line breaks and tabs, preserves valid Unicode code points, and rejects invalid XML control characters/unpaired surrogates before download. Native EN/FR/SW guidance leaves saved data unchanged and points to JSON backup. Export errors no longer log exception objects that could contain document content. French runtime regenerated through its owner.

Validation:12 existing DOCX/portable node tests PASS; actual9 downloaded DOCX files (Pan-African Minimal, Nairobi Tech, Creative Portfolio × EN/FR/SW) passed bundled Mammoth HTML-parser content checks, including multiline/blank lines, accented names, combining marks, Arabic, Chinese and emoji. Six invalid-character cases blocked download and retained state (browser run57355,3passed). The parser was explicitly loaded by the test; current product lazy-loading and raw-text import break handling remain separate defects.

Microsoft Word16.0 opened all9 read-only documents and exported18 PDF pages through a new hidden local instance; no user Word process was running. All18pages rendered with Poppler and three contact sheets reviewed; a detailed SW page confirms multiline text and the tested script examples appear. This does not establish universal Unicode shaping or font coverage on other systems.

Confirmed separate package defect: `word/_rels/document.xml.rels` is missing, so Word ignores the supplied styles/numbering parts. The visual work detail appears numbered rather than as its intended bullet, and heading styles are not applied. That repair follows separately. DOCX currently uses one editable linear layout with selected-template accent/country policy, not the styled PDF layout; photo remains intentionally omitted in this portable format.

Artifacts: `C:/Users/Oza/.codex/worktrees/career-parity-20260916/cv-docx-word-proof` and `cv-docx-multiline-results`. No Word/PDF visual acceptance beyond these fixtures; no deployment.
