# Government first 80 imports: integration handoff

Reviewed 2026-09-12. Private candidate evidence only.

Inventory contains 2,655 Government imports. Batches 001 and 002 examine the first 80 unique IDs in existing pool order: 54 publication candidates, 26 held, and 2,575 imports still unchecked. Batch001 has23 candidates/17 held; batch002 has31 candidates/9 held. No claim of complete Government coverage is made.

## Source identities and recovered headings

- GOVERNMENT-JAMB-Past-Questions.pdf: 56 pages; SHA2564358c2374e67cf910a003772d78a15f9e03ae1ec9967dfa102ace980d6d096db; dated1983-2004 compilation.
- Government-JAMB-Past-Questions-And-Answers.pdf: 210 pages; SHA256bed3547606cb6eae48563f53699f35bf432c0dcd4e69917c1d73d5b93bd6b319.

The 210-page PDF has42 visually inspected set headings covering1978-2020, with1996 absent. Most headings use outlined text missing from pypdf extraction. Each heading was rendered and inspected; printed-header-map.json pins the page/year pairs and render hashes. Header renders are in C:/Users/Oza/.codex/visualizations/2026/09/09/three-area-integration/government-header-{page}.png. Years are read from the printed source, not inferred from chronological order. Compilation provenance is not official examination-board authentication.

Each record has its own source_id, source_pdf_sha256, source_pdf_page, actual_source_year and actual_source_number. Intake must resolve record.source_id against batch.sources. Do not assign one batch-wide PDF to every record. Of these80 records,79 use the210-page PDF as primary. The truncated1985 question about implementing laws is recovered from the56-page PDF page8, question2, including its full source context. No PDFs have been mixed under one source ID.

Repeated occurrences across different dated sets keep the year of their selected primary source. Existing duplicate import IDs are listed privately to assist future deduplication. The checker rejects duplicate candidate source slots across these batches; later work must consult existing candidate slots before adding another occurrence of the same source question. Do not assume an imported year is reliable.

## Answer verification and limits

Candidates have independently reasoned subject explanations and valid publication fields, including nested ai-source-checked verification. Source compilation answer keys were not trusted as official truth. The first independence question's key is corrected to1960; democracy to rule by the people; monetary/constitutional terms and UN rotation answers have been independently checked. UN, UNOSSC, OPEC, UK Parliament and ECOWAS primary sources support the associated specific claims; URLs are private record metadata.

Held items have question-specific reasons: incomplete stems, missing valid options, ambiguous categories, conflicting source nouns, and historical legal/institutional claims needing their exact period source. These records are not waiting for a named person to approve them. They need evidence or substantive recovery. Repair histories and source-review details remain outside student explanations.

## Validation

Both batches passed normal and integrated candidate checks, integrated operation with absent PDFs, and rejection tests for absent normal-mode PDFs, wrong source bytes, source-ID/SHA/page/year changes, reordered options, candidate drift, held drift and prior drift (batch002). Printed heading map, selection files, prior batch bytes, source registry and candidate fingerprints are pinned. Syntax checks and git diff --check passed.

No shared pool, ledger, public bank or student route was edited. Browser, build and deployment checks were not run for this private candidate-only lane; coordinator integration owns those stages. Rollback is to omit these candidates from intake. Preserve Economics history and the coordinator's mixed-prior guard during integration.
