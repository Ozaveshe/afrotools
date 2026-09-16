# CV long unbroken content — bounded repair

Confirmed defects: long summary and website values extended beyond production-template paper and were clipped; an unbroken imported date in expanded templates forced the capture from 595px to 1689px, shrinking the whole PDF. Synthetic fixtures used 700 summary characters, a 350-character URL component and a 300-character imported date value, with distinct end markers.

The shared CV document stylesheet now permits wrapping within production and expanded layouts, lets grid/flex children shrink within their columns, and caps expanded date spans at 55% of the row. Normal saved data is preserved; values are wrapped, not shortened. This stylesheet also belongs to the print window.

Validation:
- Three Chromium tests passed at 320px, producing six actual styled PDFs (Lagos and Cape Town in EN/FR/SW) plus three actual Chromium print PDFs.
- Styled captures remain 595px wide, have no overflowing descendants in these fixtures, retain end markers and reference content, and pass actual PDF image-transform paper bounds.
- Print PDFs parse back the entire long summary, URL and date plus reference tail. Separate parsing confirms the complete accented name in all three print PDFs.
- SW Cape Town's first styled page was rendered with Poppler and inspected: native section headings, complete wrapped URL/summary/date and normal two-column sizing.
- A fresh EN editor DOM diagnostic across all 30 template selections found no overflowing descendants with this fixture. This is DOM evidence, not 30-template PDF acceptance.

The initial print parser failures came from Chromium request interception preventing all four local print stylesheets from loading. This was reproduced with and without interception at the same mobile width. The test now removes interception before the local print window, waits for the actual stylesheet rule and fonts, then creates the print PDF. No product print-sizing change was inferred from that harness failure. No user AI/network send was added.

Artifact hashes and page counts: cv-long-unbroken-exports-2026-09-16.json. PDFs are preserved locally in ../cv-long-unbroken-fixed-proof. The prior 120-PDF matrix documents its earlier default-export source state; this new stylesheet has representative output proof above, not a new full 120-artifact sweep. Automatic split avoidance, every manual-break combination and comprehensive print-layout parity remain open.
