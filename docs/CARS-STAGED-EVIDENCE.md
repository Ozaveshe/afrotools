# Cars Staged Evidence

`data/cars/verified-real-data-batch-1.json` is the staging file for source-backed vehicle observations that are not yet safe to promote into the live catalog.

## Rules

- Store only observed prices tied to real listing or official pricing URLs.
- Do not model, estimate, or round missing values into this file.
- Keep promotion blockers explicit.
- Treat licensed imagery as a separate requirement from pricing verification.

## Schema

Each entry still keeps a primary summary at the top level:

- `countryCode`
- `sourceMarket`
- `localMarketSample`
- `sourceMarketSample`

Schema v2 also supports optional multi-market storage:

- `primaryEvidenceIndex`
- `marketEvidence`

`marketEvidence` is an array of observed market pairs for the same `vehicleId`.

Each market evidence item should include:

- `countryCode`
- `sourceMarket`
- `localMarketSample`
- `sourceMarketSample`

Use `primaryEvidenceIndex` to choose which pair should drive queue exports and other backward-compatible summaries.

## Workflow

1. Add the first verified market pair to the top-level fields.
2. If the same `vehicleId` is later verified in another African market or against a different source market, append that pair to `marketEvidence`.
3. Keep the strongest or clearest pair as the primary summary and point `primaryEvidenceIndex` at it.
4. Rebuild the research queues after staged evidence changes.

## Validation

- `npm run cars:research:queue`
- `npm run cars:research:queue:wave2`
- `npm run test:car-price-intelligence`
