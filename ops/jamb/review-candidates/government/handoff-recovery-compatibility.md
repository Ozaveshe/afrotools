# Government recovery001 compatibility

This commit permits only the eleven exact candidates in recovery-001.json to overlay their immutable held first-pass records after acceptance. No bank or ledger files are changed.

## Coordinator integration

- Preserve the coordinator's amended check-batch.cjs source/semantic pins. Its only required edits are `ledger=(mixedPrior||integrated)?...` and passing `current` in the existing poolRecordHash argument object.
- accepted-recovery-hash.cjs pins the complete recovery manifest, exact historical row, original and candidate fingerprints, source identity/SHA/filename, all three accepted review statuses and actual assessQuestion eligibility.
- pool-record-hash.cjs consults that helper only in integrated/mixed-prior modes; existing candidate/current/prior behavior is retained.
- test-final-coverage.cjs carries forward the coordinator's strict 96ab8aa4-era source/candidate/ledger checks and adds only the exact accepted recovery branch. Historical receipt counts stay1117/1538; recovered content does not rewrite those historical decisions.

Tested against the coordinator's read-only checkout at 9d9a68adb9c2d185da1be01ad6f06b79dec8276c, with all eleven candidate and accepted-ledger substitutions made in memory. The source checker from that checkout was used, preserving all coordinator accepted-option amendment pins. The older worker trust implementation differs from current coordinator eligibility rules, so new eligibility fixtures explicitly load the coordinator implementation.

## Verification

- test-recovery-compatibility.cjs <coordinator>: reproduced both baseline failures; all67 integrated Government batch checks and test-final-coverage --integrated passed with recoveries;11 forged-ledger/pool scenarios failed on both paths (22 checks).
- test-accepted-recovery-hash.cjs <coordinator>: all11 recoveries accepted,66 historical source/year/number/original identity mutations rejected.
- test-pool-record-hash.cjs: existing mixed-prior/current/held guard regression passed.
- test-final-coverage.cjs: original2655 coverage and four tail negatives passed.
- test-recovery-001.cjs <coordinator>: normal/integrated/absence,16 negatives and11 actual publication plus11 duplicate-option negatives passed.
- test-accepted-option-amendment-067.cjs:58-hash portable plan, virtual010/067 and amended-source negatives passed.
- git diff --check passed.

Only private validation code and this handoff changed. No public UI/build/deployment changes; those checks were not rerun. English audit agent was informed and remained read-only. No push/deploy or coordinator writes.
