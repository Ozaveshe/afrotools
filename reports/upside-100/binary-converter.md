# Binary Converter — Number Base Converter

- Live: https://afrotools.com/tools/binary-converter/
- File: `tools/binary-converter/index.html` (single self-contained page)

## What it does

A feature-rich number base converter. Live-converts a typed value between binary,
decimal, hexadecimal, octal and any custom base 2–36. Handles negatives and
fractional values. Beyond bare conversion it also provides: a step-by-step
positional-math + division-remainder explanation, ASCII lookup (0–127), bit-length
/ smallest-type sizing, two's complement (8/16/32-bit), IEEE 754 single/double
float bit layout (colour-coded), live bitwise ops (AND/OR/XOR/NOT/shifts), and
binary add/subtract with carry visualisation. Copy-per-result, copy full report,
download TXT, digit grouping, swap, clear.

## Competitors & gaps

- rapidtables, calculator.net: cover bin/oct/dec/hex + arbitrary base + steps.
- This tool already exceeds both on breadth (IEEE 754, two's complement, bitwise,
  binary arithmetic, ASCII, bit-sizing) — it is NOT a thin/bare converter.
- Genuine gap found: near-zero explanatory prose (only FAQ). Search-wise the page
  was thin on indexable long-form content and had no HowTo markup.

## SEO / correctness audit

- title, meta (148 chars), canonical, hreflang (en/fr), OG/Twitter: all present & good.
- H1 "Binary Converter" — unique, keyword-appropriate.
- JSON-LD present: WebApplication, WebPage, FAQPage (mirrors 5 visible FAQs),
  BreadcrumbList — all valid.
- Correctness: verified in node — all conversions correct (see below).
- UX/a11y: copy-to-clipboard with fallback already present; inputs already have
  aria-labels; responsive 768px breakpoint collapses grids to single column.
- Brand: inline CSS carried green residue (`rgba(0,135,81,…)`, `rgba(93,219,158,…)`)
  from the old green theme, against the blue brand.

## Conversion test results (node, replicating the page's own functions)

- 255 dec → bin 11111111, oct 377, hex FF ✓
- 11111111 bin → 255 dec / 377 oct / FF hex ✓
- FF hex → 255 ✓ ; 777 oct → 511 dec / 1FF hex ✓
- 10.625 dec → bin 1010.101, oct 12.5, hex A.A ✓ (fractional)
- -42 dec → hex -2A, oct -52 ✓ (negative)
- DEAD hex → 57005 dec ✓
- Two's complement −42 8-bit → 11010110 ✓
- 0.1 dec → 0.0001100110… (correctly truncated at 10 frac digits) ✓

## Fixes applied 2026-07-14

- Added a "How to convert numbers between bases" supporting-content section
  (definition of radix, 4-step usage list, manual positional-math + divide-by-base
  method, feature summary) — fills the thin-content gap with indexable prose.
- Added valid `HowTo` JSON-LD (4 steps) mirroring the new section.
- Changed the main app JSON-LD `@type` `WebApplication` → `EducationalApplication`
  (more precise; `applicationCategory` was already EducationalApplication).
- Fixed non-brand green accent residue in inline CSS to the blue brand
  (`rgba(0,135,81,…)`→`rgba(0,98,204,…)`, `rgba(93,219,158,…)`→`rgba(77,163,255,…)`):
  focus ring, badge bg/border, copy-button bg/border/hover.
- Verified all 5 JSON-LD blocks parse (EducationalApplication, WebPage, FAQPage,
  BreadcrumbList, HowTo). Green residue count now 0.

## Deferred

- FR mirror `/fr/tools/convertisseur-binaire/` must inherit the new HowTo + prose
  via the French localization pipeline (do not hand-author unaccented FR copy).
- Title/meta already good — left unchanged.
