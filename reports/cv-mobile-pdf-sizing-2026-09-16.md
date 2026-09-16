# Mobile CV PDF sizing repair — 2026-09-16

## Confirmed defect
Read-only browser export from coordinator `1954ea175fd6ed348c3054a57275eba2d902bd31`, completed `dist`, served on dedicated port4291. At320px the same synthetic CV produced1page in English Lagos Corporate and Nairobi Tech, but2pages in Swahili. A rendered Swahili firstpage visibly enlarged the document text. This was actual PDF evidence, not just a DOM estimate. An initial run against an older checkout was discarded and is not the basis of this finding.

## Scoped repair
- `assets/css/sw-document-pdf-a11y.css`: exclude only the detached `.cv-export-clone-wrap` from body-scoped app responsive rules. The live app and its mobile controls retain these rules.
- `tools/cv-builder/css/cv-export-polish.css`: remove the global mobile header viewport-width cap inside the export clone.
- No template data, routes, metadata, analytics or sensitive-data handling changes. No account or network export dependency added.

## Validation
The focused browser contract exports actual Lagos/Nairobi PDFs in EN/FR/SW at320px and390px, parses the PDFs, checks1page for the supplied complete synthetic fixture and checks embedded image dimensions reflect595px paper at2x raster resolution. It also checks app overflow and export-clone cleanup. Styled PDFs remain raster documents; parser success does not establish selectable text.

Rendered before/after PDFs are inspected separately. Full release build and production verification belong to the coordinator; this candidate is not a deployment claim. This scope does not accept all30CV templates or resolve the separate Pan-African Minimal field-completeness work.

Result: focused Playwright suite PASS (6 cases, 12 PDFs, 1.7 minutes) on own source port4216. Poppler-rendered EN Lagos and SW Lagos/Nairobi first pages show normal paper scale, readable full headers and restored two-column layout; the same synthetic fixture fits one page. git diff --check PASS. No full build or deployment performed by this lane.
