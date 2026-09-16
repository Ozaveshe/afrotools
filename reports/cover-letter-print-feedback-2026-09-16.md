# Cover-letter print feedback exclusion

Poppler inspection of actual FR/SW print PDFs found the active download notification at the page bottom. The shared cover-letter runtime now installs a tool-scoped print-only style hiding `#toast`; normal screen feedback remains visible.

Final run 42562 passed all seven browser cases (1.4 minutes). Printed output is now asserted equal to the complete letter text after whitespace normalization, not merely to contain it: EN/FR/SW edited letters and FR/SW generated letters. The final two native print PDFs were rendered and visually inspected; both preserve the final signature and exclude the notification. The earlier print-notification finding in `cover-letter-native-drafts-2026-09-16.md` is resolved by this commit.

`cover-letter-export-proof-2026-09-16.json` records explicit LF-normalized source hashes and actual artifact hashes. The three DOC inputs rendered by Word match final downloaded DOC bytes exactly. This remains bounded short-fixture proof; arbitrary long letters, all system print dialogs, all writing systems, external AI behavior and complete app parity remain unaccepted. No deployment occurred.
