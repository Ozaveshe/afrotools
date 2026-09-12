# Government recovery001

Reviewed 40 previously held, nonduplicate originals. Recovered 11 candidates; 29 remain held. Historical first-pass coverage remains 2,655 examined / 1,117 candidates / 1,538 held. If these 11 are accepted, effective unique disposition becomes 1,128 candidates / 1,527 held. These are private candidates, not deployed results.

## Integration

Use recovery-001.json integration_allowlist and each record's source_id. Each selected original is pinned to its exact first-pass row and original fingerprint. No historical batch, coverage, source pool or shared review ledger was changed. Whole historical batch byte hashes are deliberately not required: the coordinator's already-authorized accepted-option amendment changes dependent prior-batch hashes while preserving these held rows. The checker still requires the exact original held row, not merely its ID.

The eleven recovered indices are 1, 3, 6, 9, 12, 13, 17, 29, 35, 36 and 39 (zero-based). Private record evidence includes the inspected source and reasoning; public explanations teach the subject without repair history. Question source remains the 210-page compilation, SHA bed3547606cb6eae48563f53699f35bf432c0dcd4e69917c1d73d5b93bd6b319. External historical evidence corroborates answers and is not substituted for the question's source identity.

Original 1979 Constitution visual checks: PDF39 / printed32 / section85 fixes Assembly membership at three times federal seats; PDF55 / printed48 / section140 lists the three named constitutional executive councils and excludes the education council; PDF112 / printed105 / Third Schedule1(i) includes one chief from each state's Council of Chiefs on the Council of State. Exact corroborating PDF hash is in evidence_documents. Do not substitute 1999 rules.

## Remaining holds

29 selected records are still private, not permanently unusable. ECOWAS Tribunal D is conventional, but the Court's official mandate also supports member-state proceedings, so B overlaps in the present wording. NYM founding versus renaming, CDC appointment versus reporting year, ambiguous source summaries, and several exact colonial institutional claims still need stronger historical evidence. No edition collision was promoted or historical collision ledger changed. No product decision is required to integrate these eleven.

## Validation

- check-recovery-001.cjs: normal passed.
- test-recovery-001.cjs <coordinator>: normal, simulated integrated, integrated PDF absence passed; 16 negative fixtures passed; actual coordinator assessQuestion accepted all11 and rejected all11 duplicate-option fixtures with temporary in-memory ledger.
- test-final-coverage.cjs: exact2655 and four coverage negatives passed.
- test-accepted-option-amendment-067.cjs: portable58-batch plan, virtual010/067 checks and source/option negatives passed; original snapshots unchanged.
- git diff --check passed.

No public UI, assets, routes, SEO, analytics, generated outputs, shared bank or deployment changed. Browser/build/release checks are not applicable to this candidate-only change and were not rerun. Coordinator owns integration and deployment.
