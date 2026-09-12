# Chemistry recovery002 handoff

10 additional held records examined, excluding all 20 recovery001 IDs: 6 recovered candidates and 4 still held. No new unique records. First-pass evidence remains 850 unique / 572 candidates / 278 held. After recovery001 and recovery002 intake, effective Chemistry totals become 850 unique / 588 candidates / 262 held.

## Recovered

- chemistry-1983-19-6db7b926e93a: PDF3 structure fully readable; matching Myschool30810 restores distinct optionC. Complete condensed formula retains every bond without requiring an image. Independently named2-methylbut-1-ene.
- chemistry-1983-42-902170fab371: matching Myschool30861 restores completeA/D. Web reader failed, but directHTTP200 response contained the matching question and allfive alternatives; inspected actual response. Neutralisation independently yields potassium nitrate and water. Sulfuric-acid naming corrected privately.
- chemistry-1984-15-6b596ad90e06: full matching Myschool27623 restores Fe3+/I− reactants. Independent atom/charge and oxidation-number reasoning verifiesC.
- chemistry-1985-3-6c6ede9833fe: full matching Myschool44469 restores formula optionsA/E. Independent mole ratio6:12:1 verifiesD.
- chemistry-1985-48-62e67b81750c: full matching Myschool14134 restores Na+/Zn2+ alternatives. Independently verifiedPb2+ keyE and hydroxide/chloride explanation; erroneous online explanatory claims were not reused.
- chemistry-1995-17-ae6ef0ede9c2: full matching Myschool13639 restores light-scattering distractorA. OpenStax11.5 independently supportsD for ordinary standing conditions.

No new assets: the one source structure is represented completely in condensed formula; other recovered questions are textual. No answer-revealing structure name is embedded in its prompt.

## Still held

- chemistry-1984-4-3b1c65a2d6c4: exact missing coefficient alternative remains uncorroborated; other exams/user reconstructions differ.
- chemistry-1986-15-33066af3d455: readable cell, but alternative ion charges/subscripts remain incomplete.
- chemistry-1989-23-74f5d9db9c5c: matching transcription still lacks sulfur-oxyanion subscript; correct cathode chemistry cannot establish original distractor.
- chemistry-1993-23-105c9ec94528: full matching page repeats malformed alternative reactions; no complete scientifically coherent source set.

## Validation and intake

Use recovery-002.json exact six-ID integration_allowlist. Original records, original fingerprints, entire historical held records and historical byte hashes remain attached. Historical batch files and tests are unchanged.

Passed: check-recovery-002.cjs; test-recovery-002-modes.cjs; check-first-pass.cjs; build-review-inventory.cjs --check; Node syntax and staged whitespace checks. Mode tests exercise original PDF bytes, simulated integrated candidates with the PDF, integrated mode without privatePDF, and rejection of missing pre-intakePDF, wrong availablePDF, and unauthorized mutation of a still-held record.

Source identity is pinned in batch/source/reuse metadata, matching the original supplied PDF. Matching question pages establish recovered source text only; answers were independently solved. Repair provenance remains private. No shared pool, ledger, public routes/assets, live data or deployment changed. No product/browser release claim; no new UI or image assets require browser checks in this batch.
