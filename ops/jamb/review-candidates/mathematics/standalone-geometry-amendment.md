# Standalone geometry wording amendment

Only `mathematics-1998-35-83f041836999` changed: removed the phrase referring to a figure from a question already containing all required lengths, angle and collinearity. Answer, explanation and mathematical data are unchanged. The source fixture and generated candidate fingerprint were updated, along with the batch003 hash in later-firstpass coverage. Other candidate fingerprints remain unchanged.

Actual coordinator `assessQuestion` checked all194 private candidates using an in-memory ledger: all eligible. A negative regression recreating the old phrase is rejected for `missing_visual_or_description`. No eligibility gate changes or shared ledger writes.

Passed: publication eligibility scanner, batch003 source/calculation checker with87wrong letters rejected, candidate-applied/held guards, exact250record coverage checker, and `git diff --check`. No public files or deployment changed.
