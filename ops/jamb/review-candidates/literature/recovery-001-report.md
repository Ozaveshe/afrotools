# Literature recovery 001

Candidate-only recovery from base `7567fecd`: 40 previously held leads revisited, seven recovered and 33 still held. Effective original-pool totals are 141 candidates and 220 held out of 361; no original remains unchecked. Revisited leads are not new imports. No shared pool, review ledger, production route or deployment was changed.

The seven recovered IDs and original/new fingerprints are in `recovery-001-coverage.json`. Original owner-PDF page, year and question number remain pinned in each record. All nine first-pass batch files are byte-identical to the base. Historical first-pass coverage is preserved.

Supplementary evidence is identified per candidate in the private solution fixture. The University of Cape Coast reader reproduces Rubadiri's poem (PDF pages 35–36). The Sons and Daughters and Cope sources are original academic close readings, not complete editions or official answer keys. The SciELO study quotes the exact blooming-thorns line from Adeoti. These sources support independently reasoned answers; they do not establish official endorsement. No supplementary copyrighted passage was added to the public questions.

The Penguin publisher sample confirms competing descriptions of Agbadi and does not reach later scenes; those questions remain held. Missing dialogue, unresolved literary interpretation, malformed options and unavailable set-text details also remain private holds, not a request for owner approval.

Validation passed: source/solution checker; 21 wrong-answer mutations; applied-pool and held-state guards; current coordinator assessQuestion gate for all 141 candidates and 141 fingerprint mutations; recovery provenance checks and three tampering negatives; seven 390px mobile explanation fixtures. The mobile screenshot was visually inspected: readable options and explanation, no overflow. This is private fixture evidence, not live route evidence. Broad build/deploy checks are outside this candidate-only scope.

Reproduce from repository root:

```
node ops/jamb/review-candidates/literature/check-batch.cjs literature-recovery-001
node ops/jamb/review-candidates/literature/test-batch-guards.cjs literature-recovery-001
node ops/jamb/review-candidates/literature/check-publication.cjs
node ops/jamb/review-candidates/literature/check-recovery-001.cjs
node ops/jamb/review-candidates/literature/check-mobile.cjs literature-recovery-001
```

User-facing wording contains educational explanations only. Repair history stays private. No SEO, analytics, translation or generated public output changed.
