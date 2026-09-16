# Long invoice PDF pagination — 16 September 2026

The original exporter checked only the starting Y coordinate of a row, not its height. Actual long descriptions ran below the printed page; text extraction still found that hidden text. Payment instructions and notes were written as unpaginated arrays, and party details could collide with a fixed metadata block.

The invoice-generator PDF owner now paginates description lines, repeats table headings on continuation pages, keeps each quantity/rate/line amount on the first segment only, advances both party columns together, keeps totals together, and paginates payment instructions and notes. Every page receives a footer and page count. Existing input/totals functions and monetary calculations are unchanged.

## Evidence

- Baseline failure: `invoice-long-before` captures page text below the printable area and an actual clipped description raster.
- EN/FR/SW long fixtures each produce nine readable pages. All 14 start/end item markers and 14 line amounts, 55 payment instructions, 35 notes and the independently expected USD 280 total survive parsed PDFs.
- Every page is rendered with the repository's PDF.js. Text bounds and pairwise text-box intersections are checked, and PNGs are retained for each page. First, continuation, totals, payment and notes pages were visually inspected; French and Kiswahili totals/payment labels remain native.
- The strengthened three-locale test passes in `invoice-pagination-count-proof` (33 seconds). The combined long-PDF plus standard invoice saved-state/export regression run passes all six cases in `invoice-pagination-final` (3.8 minutes).
- `h()` and `y()` remain byte-identical. Syntax and whitespace checks pass.

Supported accented names `Élodie Diop` and `François Bâ` survive. A separate actual PDF demonstrates that the pre-existing Helvetica font corrupts extended Latin names `Adéjọkẹ́ Ọlá` and `Kɔfi Ŋku`; that font issue is intentionally a separate candidate using existing licensed Noto assets. No deployment, tax-source update or acceptance change is included. Logos, extremely wide numeric values and all historical invoice templates are outside this bounded fixture.
