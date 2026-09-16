# Expanded CV PDF layout repair — 2026-09-16

Actual mobile exports showed global responsive grid rules collapsing expanded two-column/sidebar CV layouts. The durable CV renderer now gives its paper grids explicit column priority and minimum widths. Pale skill chips have explicit dark foreground, preventing inherited white-on-pale sidebar text. No global CSS changed.

Evidence: pre-fix and post-fix actual PDF contact sheets under the agent workspace `cv-all-template-pdf-proof` and `cv-all-template-pdf-fixed-proof`; Poppler rendered the saved PDF pages. Post-fix Cape Town/Cairo preserve two columns and Kigali preserves its narrow sidebar. Three focused browser cases pass (EN/FR/SW): actual downloaded PDF validity plus the export canvas dark-sidebar pixel width (<50% of page) and chip foreground. Full 90-artifact collection is still a separate ongoing acceptance task, not claimed complete here.

No deployment. This changes only expanded renderers and their regression test; existing production renderer functions are preserved.
