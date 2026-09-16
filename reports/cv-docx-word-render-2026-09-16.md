# CV DOCX relationships and Word rendering — 2026-09-16

The DOCX package now links its document to `styles.xml` and `numbering.xml`; paragraph style children also follow the required paragraph-properties/run-properties order. Microsoft Word now applies native section heading styles, title sizing and true bullet numbering. This repairs the concrete missing-relationships finding from the multiline audit.

Validation:
-12 DOCX/portable node contracts PASS, including relationships and style order.
-9 actual DOCX exports across EN/FR/SW and Pan-African Minimal/Nairobi Tech/Creative Portfolio passed multiline, valid Unicode and native-heading parser checks; invalid XML inputs blocked without mutating saved data (run99204,3browsercasesPASS).
-Microsoft Word16.0 opened all9 read-only files in a separate hidden instance and produced18 PDF pages (run55746). All9 PDFs parsed with expected fixture fields, accented name and actual bullet character. All18pages rendered with Poppler and allthree contact sheets visually reviewed. Intended styles and bullets are now visible.

Exact DOCX/PDF hashes and LF-normalized source hashes: `cv-docx-word-render-2026-09-16.json`. Artifacts: `C:/Users/Oza/.codex/worktrees/career-parity-20260916/cv-docx-linked-word-proof`. Original unlinked artifacts remain separately preserved.

DOCX uses its current linear editable layout with template accent and country policy; it does not reproduce the styled PDF's columns/photo. The nine tested exports have matching structural behavior across locales. This is actual local Microsoft Word rendering evidence for these fixtures, not every Word version, OS, font or arbitrary script. Current DOCX import parser loading/soft-break extraction remains a separate pending repair. No deploy.
