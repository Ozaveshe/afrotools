# French native oracle source review — Ghana amount wording

Compared `tools/amount-words-gh/index.html` with `bd49328d8728cf5e57a07a6e439df881cfab9ff2`. The English converter now uses `Ghana Cedi` when the major amount is one and `Pesewa` when the minor amount is one. It keeps the existing currency-first order, zero wording, amount parser, case options, and document-line builder. The French route and shared input-engine dependency are unchanged. The dark-result CSS from PR #150 is present in the reviewed base page and is untouched by this change.

The native oracle's English input is GHS 1,450.50, so its expected plural output is unchanged. Focused converter tests cover singular and plural combinations, including GHS 1.01. The normalized English page SHA-256 with both changes is `2ef96b6234a106ff0ef731e9809f1a6fdb025a00c1321e9e8dd5974b5b0eb004`; the fixture changes only this fingerprint and its review metadata.
