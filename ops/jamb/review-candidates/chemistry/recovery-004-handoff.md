# Chemistry recovery004 handoff

Private candidate-only recovery: 10 previously held records examined, 5 recovered, 5 still held. Historical first-pass files remain unchanged. Prior recoveries001–003 are pinned by file hash and exact 19-ID allowlist. This batch adds 5 IDs; effective Chemistry totals after all four recoveries are 596 candidates and254 held across850 unique records. These are review totals, not a production claim.

## Recovered

| Stable ID | PDF page | Answer | Recovery and independent evidence |
|---|---:|---|---|
| chemistry-1988-35-627a1c1213ea |22|C|Full matching Myschool14209 restores nitrogen(I)oxide distractor; independently balanced copper nitrate decomposition. |
| chemistry-1989-6-535ca7d67eb1 |23|A|Full matching27560 restores D783mmHg; Dalton subtraction760−23=737. PDF question6 retained. |
| chemistry-1989-10-852ec5fa3e6d |24|B|Full matching27563 restores D; nucleus55protons78neutrons independently calculated. |
| chemistry-1990-7-39772334f209 |27|D|Full matching12914 restores diffusion stem/A. Explicit fastest-to-slowest Graham approximation; molecular masses28,34,46,64. |
| chemistry-1998-37-b93f36da8f72 |52|D|Full matching13923 restores all observation options; independent Fe(OH)3 precipitation supported by Chemguide cation analysis. |

## Still held

- chemistry-1988-5-4ea8e59bf179: combined gas law0.600dm3; no option matches.
- chemistry-1989-25-466c59821354: silver product charge malformed; exact matching intact equation not recovered.
- chemistry-1990-11-09f43f913f50: X(g) transformation lacks charges/electron; cannot infer ionisation from key.
- chemistry-1990-21-d41f23ee6430: dilution0.00454545dm3 absent from options; no nearest choice accepted.
- chemistry-1990-29-0f24907ea575: concentration wording permits compression effect; missing catalyst distractor alone does not resolve ambiguity.

## Validation

Passed test-recovery-004-modes.cjs: pre-intake with PDF, simulated integrated with PDF, integrated without private PDF. Negative cases reject unavailable pre-intake PDF, available wrong PDF, unauthorized held mutation and prior recovered candidate mutation. Source SHA pinned to d70da60adbad7d2c2b972ea2e71d33d9f5f512869f416aa73cbc8594c205bc75 in three identity fields. Candidate fingerprints and historical file/record fingerprints checked. Independent numerical, charge/atom-balance and context checks passed. check-first-pass.cjs remains850/572/278. Syntax and staged whitespace checks passed.

No assets, public/generated files, routes or shared ledger changed. No deployment or browser/build run: this is private question evidence only. Student explanations contain teaching content; recovery history remains private. Coordinator should intake only the five exact candidate fingerprints after prior recovery001–003.
