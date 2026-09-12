# Mathematics uncovered review 002

Examined the next 20 exact baseline IDs (offsets 9–28 inclusive): 3 candidates, 17 individual holds. Owner PDF SHA and printed pages 14, 16–20 and 22 were checked; equations, choices and diagrams were visually inspected. The imported 1988 Q1 is actually printed 1989 Q1 and remains held for no correct sequence. Source identity was corrected privately without inventing another paper.

Candidates: 1987 Q19 (B, inverse-square variation), 1987 Q50 (A, 3/5 probability), and 1988 Q25 (A, quadratic roots 1.6 and −0.6). Q25 is fully specified by its printed equation; explicit decimal precision follows all four printed alternatives. No diagram is needed to solve that complete equation. No candidate depends on an unreconstructed figure.

Holds distinguish impossibility, duplicate correct answers, incomplete premises and illegible source alternatives. For example, the 1986 secant diagram places R before S but the supplied lengths yield TR=16 > TS=12; a pyramid's stated edge is shorter than its centre-to-corner distance; the pole question has two algebraically identical correct alternatives. Two holds have solvable main questions but damaged alternative text and remain leads for better-source recovery, not claims that the main calculation is unknown.

Validation passed:

- `check-uncovered-002.cjs --source-root=<coordinator> --pdf=<owner PDF>`: source hash, pinned batch and baseline ID order, 20 original fingerprints, 3 actual publication checks, 9 wrong-answer negatives, 6 publication mutation/missing-review negatives, 17 unchanged-held guards and arithmetic checks of selected source contradictions.
- `check-uncovered-002.cjs --integrated`: portable default repository path and committed source provenance replay with no private PDF.
- `test-uncovered-002-replay.cjs`: three synthetic intaken candidates accepted; missing accepted ledger, wrong ledger hash and changed held question rejected; no shared writes.
- `check-uncovered-mobile.cjs math-uncovered-002`: three private 390 px content fixtures, collapsed/open explanations and no horizontal overflow; final screenshot visually inspected. This is not live route evidence.
- `git diff --check`.

The original 77-ID baseline audit is unchanged. Separate `uncovered-progress-002.json` records 29 examined since baseline: 5 candidates and 24 holds. Total documented examination is now 487/535, with 48 still unexamined. After all five private candidates are accepted, the baseline arithmetic is 388 accepted + 99 documented held + 48 unexamined. Coordinator acceptance and production deployment are separate events.

Next exact original: `mathematics-1988-41-c2890efe3a69`.
