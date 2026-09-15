# French architectural-fee native workflow

## Before
The French owner inherited the updated English form with data-locale=en. The old browser fixture expected automatic fee values, but the current shared engine correctly requires user-entered assumptions. French runtime and export prose consequently remained English.

## Change
- Extract the existing EN/SW form renderer into a pure shared module and add French form copy with identical machine values and validation requirements. Prior EN/SW renderer output was compared byte-for-byte and is unchanged.
- Compose the French form in the engineering owner. Shared runtime supports French status, phase labels, TXT/PDF descriptions and copy. Engine arithmetic, countries, stages, initial weights and required fee assumptions are unchanged. CSV and JSON retain portable machine keys and original numerical data.
- Correct the broad architectural-fee fixture to enter explicit synthetic assumptions. No invented fee defaults or official-rate claim.

## Checks
- node --test tests/fr-architectural-fee.test.js tests/architectural-fee-parity.test.js:9 passed (includes engine/original EN/SW contracts).
- Chromium fr-architectural-fee.spec.js:5 passed. EN and FR each calculate533500KES for the same synthetic fixture, reopen JSON/CSV/TXT/PDF, verify parsed PDF and local copy. French phase and export labels verified. No request writes or bodies after input begins; external assets blocked.
- 320/375px,200% text, light/dark, keyboard labels:passed.
- Additional stronger valid-result then invalid-input test:passed; prior result and export actions hidden immediately.
- Combined architecture-only broad slice FLOW_START=20 FLOW_END=21 plus new BOQ totals test:2 passed. This does not claim all26 broad workflows were rerun in this candidate.
- Full engineering --check:0 changes across26 owners. git diff --check passed.

No acceptance-ledger updates, deployment, rate edits or network functionality added.
