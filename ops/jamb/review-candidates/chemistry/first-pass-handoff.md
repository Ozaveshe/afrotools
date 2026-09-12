# Chemistry first-pass handoff — 12 September 2026

The first pass covers all **850 unique stable IDs** in the normalized Chemistry pool exactly once: **572 publication candidates prepared; 278 held for source recovery or unresolved content defects**. No Chemistry pool IDs remain unchecked. These are candidate-preparation totals, not integration or deployment totals.

The 22 separate batches retain original records, candidate fingerprints, actual source year/number, PDF page, private repair history and independently reasoned teaching explanations. Source PDF SHA-256 is `d70da60adbad7d2c2b972ea2e71d33d9f5f512869f416aa73cbc8594c205bc75`.

## Final assignment batches

| Batch | Examined | Prepared | Held | Commit |
|---|---:|---:|---:|---|
| 019 | 40 | 35 | 5 | 5ad74480 |
| 020 | 40 | 26 | 14 | f9259874 |
| 021 | 40 | 32 | 8 | d90218e6 |
| 022 | 10 | 7 | 3 | This commit |
| Assignment total | 130 | 100 | 30 | |

## Held-work categories and next recovery actions

The categories below overlap; no category totals are asserted. Every one of the 278 held IDs and its specific reason is retained in `review-inventory.json`.

1. **Readable figures still needing a complete accessible representation.** Examples include `chemistry-1983-13-226552c20011` (porous-plug diffusion), `chemistry-1983-17-ff5dd9189448` (series electrolysis) and `chemistry-1984-16-917ac93637fa` (energy plot). These are strong first recovery targets: use a faithful full text description or owned redraw, preserve all quantities/connections, and re-run the context gate.
2. **Missing, blurred, misplaced or mismatched figures/structures.** Examples include `chemistry-2004-36-a45b0343b69d` (wrong atomic drawing instead of gas apparatus), `chemistry-2004-20-87a0c6f71a95` (displaced structural bonds) and the 2001 solubility graph pair. Obtain the actual readable matching source; an answer key alone cannot reconstruct missing content.
3. **Incomplete, duplicated or chemically corrupted options/stems.** Examples include `chemistry-2002-23-227693af459a` (missing proton-mass distractor) and `chemistry-2003-26-9508b1bb52e3` (sulfur-to-carbon equation). Recover all alternatives from a matching full question, keeping option order and source identity auditable.
4. **Numerical data or units inconsistent with every answer.** Examples include `chemistry-2003-19-f21f76193a39` (2.5 M is absent) and `chemistry-2004-8-52860021acb5` (reaction enthalpy versus per-mole basis). Preserve the independent calculation and seek corrected source data/options. Do not choose a nearest answer or infer a missing value from the key.
5. **Several valid answers or missing conditions.** Examples include `chemistry-2004-1-ccbf87763565` (platinum/carbon anodes), `chemistry-2002-39-efc1e433a4a3` (mercury oxidation state), `chemistry-2004-47-d148598bfb15` (overlapping sodium-storage reasons) and `chemistry-2004-50-1765791d1822` (oxygen/chlorine downward delivery). Recover a genuine distinguishing premise. Do not invent one and attribute it to the historical exam.
6. **Incorrect or overgeneralised scientific claims.** Examples include vulcanisation as universal double-bond removal, carbon tetravalence attributed solely to hybridisation, and unspecified pollutant rankings. Where no faithful corrected source exists, retain the original as held. A separately identified original practice question can teach the intended topic without pretending to be a recovered exam record.

No item is held for teacher, owner or examination-board approval. The remaining work is evidence/content recovery. Routine spelling and wording corrections are private; student explanations teach chemistry only.

## Validation

- Each final batch passed its default pre-intake checker and an in-memory simulated integrated checker. The shared pool was never changed.
- PDF identity, full candidate/original fingerprints, source context gates and focused independent numerical/chemical checks passed.
- `check-first-pass.cjs` confirms exact set equality with all850 Chemistry pool IDs, unique coverage, 572/278 counts, original/candidate fingerprints and held reasons. It supports `--integrated` for coordinator intake.
- `build-review-inventory.cjs --check` confirms the cumulative inventory matches all22 batches.
- Candidate-only scope: no public generated bank, trust code, route, database or deployment changes. Broad application build/browser/release tests remain the coordinator's responsibility.

The first pass stops here as instructed. Prepared candidates still require the coordinator's technical intake, and the held recovery work remains open.
