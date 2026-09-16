# CV mobile Print path — 2026-09-16

Source candidate: `306efe62` (product source from `b4d0e0f7`). Local server: port 4216, career-parity-20260916 worktree.

Three real pointer workflows passed at 320 × 844: English, French and Swahili. The path is Build My CV → More → Preview → preview Export → review checkbox → Print. Tests populated a synthetic complete fixture through the supported state API before interaction, then parsed the actual three print PDFs for accented name, reference relationship, custom content and project URL. They wait for every popup stylesheet and document fonts before capturing the PDF.

Command: `PORT=4216 AFROTOOLS_TEST_DISABLE_ANALYTICS=1 playwright test tests/e2e/cv-mobile-print-action.spec.js --workers=1` — 3 passed, session 91232, 1.2 minutes.

Limits and open findings:
- This validates one template (Pan-African Minimal), a complete synthetic fixture and the explicit reviewed path. It does not certify every mobile editor interaction or every template/mode.
- Direct mobile More → Print calls the review guard while the review checkbox is in a hidden separate drawer. The shortcut did not open a print window in an unchecked state; improving its guidance/navigation remains pending.
- The test waits for resources before PDF capture. It does not establish that the product's automatic window.print callback waits for delayed fonts. That readiness investigation remains pending.
- Template-owned Nairobi decoration `candidate.profile` remains English in FR/SW; native decorative-label followup remains pending. User content must remain untouched.

No product source, route, analytics or network behavior changed in this evidence-only candidate. Only synthetic fixture data was used.
