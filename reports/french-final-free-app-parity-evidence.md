# French final free-app parity evidence

Scope is exactly two previously mis-owned French free-app counterparts:

- `boq-gen` → `/fr/tools/generateur-boq/`
- `export-docs-trade` → `/fr/tools/documents-export/`

Both are native French applications, use the English owner workflow/engine, retain local-first privacy and source/assumption boundaries, have reciprocal English/French/Swahili hreflang, French schema and dedicated artwork. Registry ownership now points to the exact English IDs.

Export contracts:

- BOQ: CSV, local JSON state export/reopen, print/PDF.
- Export documents: PDF, CSV, JSON, TXT, plus local JSON reopen.

Source ownership is fail-closed through `scripts/build-french-final-free-app-parity.js`, which scopes the established Engineering and Trade generators to these two owners.

Focused proof:

- `node scripts/build-french-final-free-app-parity.js`
- `node tests/french-final-free-app-parity.test.js`
- `npx playwright test tests/e2e/french-final-free-app-browser.spec.js --workers=1` — 2/2 passed on isolated port 43151. This covers calculation mutation, invalid states, JSON export/reopen, CSV/TXT/PDF parsing, print interception, 320/375 px, 200% text reflow, light/dark presentation, keyboard focus, console cleanliness and absence of network writes.
- `node -c assets/js/pages/fr-trade-parity.js`
- `git diff --check`

No acceptance registry, master ledger, sitemap, other locale, push, merge or deployment changes are included.
