# Mining & Extractives Hub Rule

Applies to:

- `mining/index.html`
- `tools/mining-royalty/**`
- `data/mining/**`
- `scripts/update-mining-source-ledger.js`
- Mining-category tools that rely on official mines-ministry, minerals-commission, revenue-authority, or Mining Code / Finance Act sources

## Why this rule exists

Mining royalty rates are legally significant and price-perishable: each is set by a jurisdiction's Mining Code or Finance Act and revised at budget, and several regimes (South Africa's profit formula, Zambia copper, and the gold scales in Ghana, Zimbabwe, Mali, Burkina Faso, Côte d'Ivoire, Egypt and Gabon) use price- or profit-based **sliding scales**, not a flat rate. Until July 2026 the `/mining/` hub was a facade — 10 tool cards all badged "LIVE" but every one linked back to `/mining/` itself; no tool existed, no data, no source ledger. This rule governs the real tools that replaced those cards and the dataset and ledger behind them.

**How fast these rates move:** a July 2026 review found **8 of the original 12** defaults had changed in 2023-2026, all upward or restructured — Nigeria gold ~3%→**15%** (Nigeria Tax Act 2025), Ghana gold flat 5%→**sliding 5-12%** (L.I. 2517), Kenya all four rates cut (LN 106/2024), Zimbabwe platinum 2.5%→7% and lithium 5%→7% (2026 budget), Zambia copper bands + cobalt 5%→8% (2024 Act), Mali and Burkina Faso gold → sliding. Only Tanzania, South Africa, DR Congo, Botswana and Namibia were unchanged. Treat any rate older than one budget cycle as suspect.

## Rules

- Use `data/mining/official-sources.json` as the source map before changing any public mining fact (royalty rate, levy, band).
- Run `npm run mining:sources` after adding, removing, or changing source URLs. Use `npm run mining:sources:check` for release proof.
- **Never** update a royalty rate because a URL's content hash changed. Open the Mining Code / Finance Act / regulator schedule and read it — same standard as `.claude/rules/government.md` and `.claude/rules/energy.md`.
- A mines ministry, minerals commission or revenue authority always outranks an aggregator, law-firm mining guide or news report for the same claim. A law-firm guide is a sanity check, never a citation.
- Royalty rates are presented in the calculator as **editable, planning-grade defaults** shown with a review date, never as current gazetted rates. Keep it that way — do not restyle the tool to assert a rate as "current."
- Only 18 of Africa's ~35 significant mining jurisdictions have a bound royalty source today. The remaining five (Guinea, Angola, Mozambique, Sudan, Mauritania) live in the ledger's `gaps.jurisdictionsWithoutSource` block because their official URL could not be verified reachable. An entry there is a known liability, not a to-do. Do not present an unbound market's rate as fact, and do not delete a gap without either binding the source or removing the claim it covers.
- **Every source carries a `confidence` field.** Only Kenya (Kenya Law primary text) and Ghana (gazetted L.I. 2517) rest on primary instruments read directly; every other figure is secondary-corroborated. Do not promote a rate to "verified/current gazetted" without reading the operative Act or gazette yourself.
- Keep `gaps` honest. Do not delete an `unsourcedClaims` class (sliding-scale regimes, additional levies) without either binding a source or removing the claim it covers.

## The bug class to watch for

`country.minerals[m].rate || 0` (or `country.extraLevyPct || 0`) turns a missing or formula-based rate into **0%**, which makes the royalty vanish and understates a miner's cost — the same defect telecom's `roaming-cost` and energy's `generator-fuel` were built to avoid. The fix pattern is already in this category and must be preserved:

- `mining-royalty` **filters the country dropdown** to jurisdictions the dataset actually covers (energy/`tv-compare` pattern).
- A mineral with a `variable`/sliding-scale rate carries `rate: null` plus a numeric `min`/`max` band; the UI shows the band and **forces the user to enter their effective rate** rather than prefilling a guess.
- A blank or non-positive rate **blocks the calculation** with "a missing rate is not zero" — it is never costed at 0%. `scripts/update-mining-source-ledger.js` also fails the build if any dataset mineral carries a zero/negative flat rate.

Any dropdown that offers more countries or minerals than the dataset actually covers is the tell.

## Freshness

`data/mining/mining-royalties.js` carries one `lastUpdated` stamp for all rows — a floor, not a per-figure date. Surfaces that render a royalty rate older than the ledger's `highRiskCadenceDays` (90) should label it planning-grade with its review date, exactly as the tool does ("Bundled default reviewed 2026-07 — planning-grade, not a current gazetted rate"). Do not claim mining rates are "updated regularly" — the codebase cannot support that claim, and `mining:sources:check` will warn once the stamp passes the cadence.

## Validation

- `npm run mining:sources:check` — ledger/dataset consistency; fails on a zero/negative flat rate or dataset↔ledger source drift.
- `npm run test:mining` — pins every mining FAQPage JSON-LD to the visible FAQ verbatim, and enforces the hub honesty invariants (no `/mining/` self-links; a LIVE badge must resolve to a real page on disk).
- `npm run check-links` for broad route changes (the hub's tool cards were dead self-links; keep them pointed at real routes).
