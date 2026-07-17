# Trade & Customs Hub Rule

Applies to:

- `trade/index.html`
- `trade/**`
- `data/trade/**`
- `engines/landed-cost-engine.js`, `engines/src/landed-cost-engine.js`
- `assets/js/trade-toolkit.js`, `assets/js/pages/trade-focus.js`, `assets/css/trade-focus.css`
- `scripts/update-trade-source-ledger.js`
- Trade-category tools that rely on customs, tariff, freight, port, trade-finance or payment sources

## Why this rule exists

Trade holds the site's HIGH-stakes public numbers: import duty rates, CET bands, VAT and levies, AfCFTA/regional preference offers and rules-of-origin tests. A wrong duty rate or a falsely "free" preference misprices a shipment and can trigger a customs penalty. Until July 2026 the hub had no source ledger — even though every row in `data/trade/country-duty-rates.js` already named a customs authority (NCS, KRA, SARS, GRA, DGD…), unbound to the numbers it was supposed to justify.

## Rules

- Use `data/trade/official-sources.json` as the source map before changing any public trade fact.
- Run `npm run trade:sources` after adding, removing, or changing source URLs. Use `npm run trade:sources:check` for release proof.
- **Never** change a duty rate, CET band, VAT rate or levy because a URL's content hash changed. Open the tariff schedule or gazette and read it — same standard as `.claude/rules/government.md`. A national **Finance Act / budget** is the usual real trigger for a duty change.
- A national customs authority outranks any aggregator, freight forwarder or broker page for the duty/VAT/levy claim of its own country. A **regional secretariat** (AfCFTA, ECOWAS, EAC, SADC, COMESA) is authoritative for the bloc's CET bands, preference schedule and rules of origin; the national authority applies them.
- 15 of the 24 duty-rate markets have a bound customs-authority URL today. The other 9 live in the ledger's `gaps.authoritiesWithoutUrl` block. An entry there is a known liability, not a to-do. Do not delete one without either finding the source or showing the figure as planning-grade.
- Shipping/freight rates, port demurrage tariffs, LC bank fees, B2B payment-provider fees, trade-finance instrument costs and commodity spot prices are **commercial** market data, recorded in the ledger as unsourced by design. Never present them as an official or regulated rate.
- Treat blocked or unreachable customs portals (e.g. Morocco's WAF) as a manual-review queue. A page that did not load is not evidence the tariff is unchanged.
- Keep `gaps` honest. Do not delete an `unsourcedClaims` class without either binding a source or removing the claim it covers.

## The bug class to watch for

`var rate = country.dutyRates[ch].typical || 0`, `country.data.field || 0`, or `parseFloat(fxRate) || 1` converts *missing data* into *free* (or a wrong scale), which then wins a cost comparison — the same defect telecom's `roaming-cost` and energy's `generator-fuel` guarded against. The fix pattern already exists in this category and must be preserved:

- The landed-cost, import-duty and ECOWAS/EAC tools take the **duty rate as a user-overridable input** pre-filled from the dataset, not a fixed lookup. Keep it an input the user confirms against the destination authority.
- FX conversion must **force a user-entered rate** (or block the calculation) when a currency is missing, rather than silently using `1`. `engines/src/landed-cost-engine.js` uses `parseFloat(e.fxRate) || 1`; every landed-cost market currently has FX history so this is latent, but any new market added to `LANDED_COST_DATA` without an `fx-history.js` entry would silently convert at 1:1. Add the currency to `fx-history.js` or gate the calc — never ship the 1:1 fallback as a live path.
- Any dropdown that offers more markets than a dataset actually covers is the tell. Filter the dropdown to covered markets, or force user input — copy the pattern, never default to zero. `country-duty-rates.js` covers 24 markets; `landed-cost-data.js` covers 10; `fx-history.js` covers 15. A tool's country `<option>` list must not exceed the dataset it reads.

## Freshness

The duty datasets carry no per-figure date. `official-sources.json`'s `datasetReviewed` stamp (`2026-05`) is the floor, not a per-rate date. Surfaces that render a duty, CET, VAT or levy figure older than `highRiskCadenceDays` (45) should label it as a planning-grade default with its review date. Do not claim trade figures are "updated regularly" — the codebase cannot support that claim, and `trade:sources:check` warns once the stamp passes the cadence.

## Validation

- `npm run trade:sources:check`
- `npm run check-links` for broad route changes.
