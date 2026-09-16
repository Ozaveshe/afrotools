# Swahili CV paper padding — 2026-09-16

The generic document mobile rule applied 3vw horizontal padding to every `main`, including nested CV document mains. Actual Creative PDFs consequently used 9.6px padding at320px instead of their26px design padding, changing the identical long fixture from3pages EN/FR to2pages SW. The rule now excludes only CV production/expanded document main nodes, retaining app-page/mobile chrome behavior.

Two focused actual-download browser tests pass at320/390px: long Creative PDF3pages, full1190px raster width, native document padding26px, no page overflow. Final Swahili30-template and10-long-family repetitions are being collected separately from the prior90/30 matrices; they supersede affected Swahili artifacts after this correction. No deployment or full acceptance claim in this commit.
