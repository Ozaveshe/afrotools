# Education workspace maintenance

The English Education Hub, Study Planner, Flashcard Maker, SSCE practice,
Scholarship Finder and University Admission pages share
`assets/css/education-workspace.css`. The French SSCE pilot also uses that
composition layer. It relies on the existing design tokens and DM Sans, and
does not replace each tool's calculation or storage engine.

Keep the six-link `Education workspace` navigation consistent across these
English source pages. Mark only the current route with `aria-current="page"`.
The Hub's daily study and application tracker remain directly available;
optional admission planning is inside `#planning-details`.
`assets/js/pages/education-workspace.js` opens enclosing disclosures for
existing fragment links, including reloads and links from other tools.

The optional assistant stays in the footer on these pages, so it cannot cover
questions or form controls. Keep source freshness notices visible near the
relevant workflow; a visual refresh does not establish data freshness.

For changes to this layout, run `tests/e2e/education-workspace.spec.js` alongside
the affected education journey specs. The workspace spec covers 320, 390, 768
and 1280px, enlarged text, dark appearance, deep links, checklist evidence,
manual planning persistence and storage failure. CI also runs it against the
packaged deploy artifact. Use synthetic records and keep screenshots outside
the public build.

Browser tests establish the tested local workflows. They do not prove account
sync, live scholarship-feed freshness, complete curricula or compatibility
with every device and assistive technology.
