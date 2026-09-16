# French CV ongoing-date wording — 2026-09-16

Template-owned ongoing employment labels now use `En cours` rather than the literal `Aujourd’hui`. The source change covers the current-date editor label, all production/expanded renderers, ATS plain output and DOCX. Stored end dates and user-supplied headings/descriptions are unchanged. French runtime and its manifest were regenerated through `build-french-cv-runtime.js`.

Validation:15node contracts PASS, including all30 French renderers with ongoing employment and user literal `Aujourd’hui`. One actual French browser case PASS (69889): disabled end-date editor label, ATS text, downloaded/locally parsed DOCX and actual print PDF all contain `En cours`; user description remains literal and stored end date stays2025-02. This is a wording followup, not a new audit of arbitrary date parsing or month formatting.

No route, analytics, saved-state or external-send changes. Earlier Word-render evidence remains tied to its recorded source hashes; this followup has the focused current-label proof above. No deployment.
