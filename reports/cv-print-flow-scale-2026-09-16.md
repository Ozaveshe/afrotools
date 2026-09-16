# CV print flow and paper scale — bounded candidate

After the blank-wrapper repair, fully loaded print output still moved oversized work sections to a mostly empty following page. Nairobi also produced an empty tail page. The dedicated print CSS now lets unmarked long sections flow while retaining keep-together behavior for marked fitting blocks.

The 595px template design is explicitly mapped to the print window's 194mm paper area. The prior nested design occupied about157mm inside that wrapper. A matching595px root override prevents an older190mm width rule from expanding the zoomed document. This changes dedicated print output only.

Evidence:
- Three Chromium family cases pass, producing30 actual EN/FR/SW print PDFs across ten layout families at320px input width, with all stylesheets and fonts loaded.
- All105 pages were rendered with Poppler and inspected in contact sheets. Every PDF has the first work entry on its first page and has no blank pages. Native headings, full name, ordinary field markers and ten work entries survive parsing; text bounds fit A4.
- Actual PDF text transforms verify heading scale against the194mm paper mapping. The parser's glyph height differs from the font transform and is not used as a substitute for font size.
- A separate reparse of all30 final artifacts verifies all60 complete long work paragraphs per document; this assertion is also preserved in the browser contract.
- Six manual-break/Nairobi-bound browser regressions and16 node contracts pass after these changes.

Source hashes,30 artifact hashes and105-page count are in cv-print-family-final-2026-09-16.json. It supersedes the earlier108-page print baseline, whose hashes remain preserved. Local PDFs and contact sheets are in ../cv-print-flow-final-proof.

The separate mobile More-menu→Print interaction test is still under investigation and is not a claimed pass. This candidate covers actual print outputs, not every template/mode/control combination or other browser print drivers. The120 styled-PDF historical matrix remains separate; no whole-CV acceptance or deployment is claimed.

Hash encoding clarification: the original sourceHashes matched raw CRLF file bytes in the verification worktree. The matrix now explicitly records that normalization and adds sourceHashesLF for portable LF comparisons. Original source hashes and all PDF artifact hashes are preserved unchanged.
