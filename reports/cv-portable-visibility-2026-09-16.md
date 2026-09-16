# CV portable export visibility repair — 2026-09-16

Actual downloaded ATS PDF and DOCX fixtures in EN/FR/SW confirmed that stored project/reference rows were exported even with their visible switches disabled. Both export owners now respect showProjs/showRefs; project URLs are retained when projects are enabled. No stored-row-count opt-in remains in these branches. Sensitive-field policy is unchanged by this commit.

Validation: 6 DOCX node contracts pass; 3 browser cases pass, each exporting ATS PDF and DOCX with switches enabled and disabled (12 actual files). ATS output parsed with pdf-parse using Uint8Array; DOCX uncompressed XML content inspected. Synthetic accented names and literal user text preserved. French runtime regenerated through build-french-cv-runtime.js.

This is not complete export acceptance. Full optional/country-field coverage and all-template styled pagination/visual checks remain separate work. No push/deploy or production claim.
