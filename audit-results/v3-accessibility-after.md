# V3 Accessibility After

Command: `node scripts/comprehensive-quality-crawl.js`

Evidence:

- `audit-results/v3-final-comprehensive-crawl.txt`
- `audit-results/v3-final-page-crawl-report.json`

After fixes:

- Pages audited: 8501
- Broken pages: 0
- Broken internal links: 0
- Broken images: 0
- Accessibility issue pages: 0
- Total accessibility issues: 0

Required outcome:

- Reusable calculator input/select label debt: 0 known in the crawl.
- Unnamed reusable button debt: 0 known in the crawl.
- Remaining accessibility issues: none reported by the comprehensive crawl.

Limit:

This is a static crawl plus representative Playwright coverage. A future axe-driven browser sweep should still be added for runtime states, modals, focus traps, and generated result announcements.
