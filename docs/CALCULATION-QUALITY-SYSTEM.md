# AfroTools Calculation Quality System

## Purpose

This system makes calculator and jurisdictional-data changes reviewable without
claiming that an unsourced formula is correct. It inventories executable
calculation artifacts, records formula versions and provenance, runs golden
fixtures, validates live-data compatibility, and blocks silent formula drift.

It does not update a rate or statutory rule. A formula change still requires a
current primary source and human review.

## Sources of truth

- `data/calculation-quality/engine-inventory.json` lists every configured engine artifact and risk classification.
- `data/calculation-quality/formula-registry.json` records protected formula versions, applicability, sources, parameters or protected parameter references, dates, rounding, assumptions, exclusions, and disclaimers.
- `data/calculation-quality/golden-fixtures.json` stores current expected results and boundary cases.
- `data/calculation-quality/external-data-contracts.json` defines schema, retrieval, staleness, and last-known-good policy for protected live-data keys.
- `data/calculation-quality/fixture-deltas.json` records approved result changes. An empty array means no existing expected results changed.
- `data/calculation-quality/calculation-quality.schema.json` defines the machine-readable contracts.
- `reports/calculation-quality-report.json` and `.md` are generated evidence, not editable sources.

The risk inventory covers tax/payroll, pensions/benefits, loans and financial
projections, utilities and meters, exchange rates, health, agriculture,
legal/regulatory calculations, and low-risk general utilities.

## Commands

Check committed data and current formula digests:

```powershell
npm run calculation-quality:check
```

Run the direct acceptance tests:

```powershell
npm run test:calculation-quality
```

Create the initial inventory or refresh non-formula discovery output:

```powershell
npm run calculation-quality:build
```

The build command refuses to refresh an existing protected formula digest or
golden expected value after executable formula code changes. That is deliberate.

## Formula update workflow

1. Obtain a primary authority, regulator, statute, official schedule, or other appropriate authoritative source.
2. Identify the affected formula ids and effective period. Do not overwrite an older version when historical dates still need it.
3. Change the versioned parameters or executable artifact.
4. Add boundary fixtures for every changed threshold, band, cap, rate, date, and rounding stage.
5. Create a review JSON from `docs/formula-change-review-template.json`.
6. List every changed fixture with its previous and next expected values. An empty delta list is invalid when results changed.
7. Run the explicit reviewed update command:

```powershell
node scripts/build-calculation-quality.js --write --accept-formula-change --review-file=path/to/review.json --as-of=YYYY-MM-DD
```

8. Run `npm run calculation-quality:check`, the affected workflow verifier, `npm test`, and relevant build/release gates.
9. Obtain the CODEOWNERS review required for protected formula and data paths.

Changing a page title, disclaimer, or source panel must not be used to refresh a
formula digest. Changing expected fixture values to match a regression is not a
valid review.

## Effective dates and unsupported inputs

Formula resolution is strict. It matches the requested formula family,
jurisdiction, and declared effective interval. Unknown countries return
`UNSUPPORTED_JURISDICTION`; out-of-period dates return `UNSUPPORTED_DATE`.
There is no nearest-country or newest-formula fallback.

Legacy records whose effective period cannot be established from current repo
evidence are marked `review-required`. That is an explicit limitation, not an
open-ended assertion that the rules remain current.

## External data and last-known-good behavior

`forex-latest`, `fuel-latest`, and `rates-latest` are protected keys. Their
payloads must include a matching schema version, source metadata, and retrieval
timestamp before `data-store` persists them. An incompatible payload is rejected
before Supabase or Blob writes, retaining the existing value. Static committed
snapshots remain the final fallback.

Freshness is separate from compatibility. A structurally valid old payload may
remain usable as last-known-good data, but the public state is `stale` and its
label cannot claim `live`, `current`, or `official verified`.

## Current baseline

The generated report is the authoritative count. At the 2026-07-12 baseline it
records 407 artifacts, 119/119 protected PAYE/VAT mappings, 167/167 passing
golden fixtures, and zero expected-result changes. The committed forex, fuel,
and policy-rate snapshots are correctly reported as stale. The same report
keeps unresolved provenance visible: 171 high-risk effective periods, 18
medium-risk source reviews, and one currency override remain explicitly
`review-required`; none is silently presented as verified.

## Known review-required exception

The Zimbabwe server PAYE artifact declares USD while the canonical country
registry declares ZWG. The formula registry records this as an explicit
`review-required` currency override. The quality system does not silently relabel
the engine or alter its bands; an authoritative Zimbabwe payroll review is
required before changing that behavior.
