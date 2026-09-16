# Native CV print decoration — 2026-09-16

Nairobi's template-owned `candidate.profile` decoration now reads `profil.candidat` in French and `wasifu.wa.mwombaji` in Swahili. Empty-reference fallback wording and the expanded renderer's default Professional CV role are native too. User names, job titles and custom headings remain unchanged. Expanded badges matching advertised template names remain design identities; this is not an app-wide chrome localization audit.

Validation: eight model contracts passed; three EN/FR/SW actual print PDFs at 320px passed parsed native-decoration and literal-user-heading assertions (session29860,27.1s). Source syntax and diff checks passed. SW first page rendered with Poppler and visually inspected: localized label fits the existing header.

Important residual: the short complete-form fixture's SW Nairobi print placed only the header on page1 and moved content to later pages. Parsed full text remains present, but this is a layout defect requiring separate automatic block-break investigation. The earlier long-family print fixture has separate first-role-on-page1 proof and does not cover this shorter fixture. No whole-template acceptance is claimed.
