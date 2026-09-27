# Naira-to-Words owner fingerprint review — 28 September 2026

Compared `tools/naira-to-words/index.html` with `bd49328d8728cf5e57a07a6e439df881cfab9ff2`. The change gives the currency selector its own visible label, keeps the amount field visibly labeled, and uses a two-column layout until mobile width. The GHS option adds singular unit names, which `amountToWords` selects only when the corresponding amount is one. NGN and all other currency option data remain unchanged. The FAQ contrast change from PR #154 is already present in the reviewed base and is untouched.

The French native oracle uses the default NGN option with 2,500.75, so its expected output is unchanged. The French route and shared decimal parser are unchanged. The normalized English owner SHA-256 is `67d9d33b1d136892a1883e9401a429f5389932d41f4947503dca3d49d5008ff9`; the fixture updates only this source fingerprint and review metadata.
