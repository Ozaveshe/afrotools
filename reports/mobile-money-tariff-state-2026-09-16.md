# Tariff result state parity — 16 September 2026

## Reproduced defect

On candidate `8bee631f`, calculate MTN Uganda send for UGX 500, change the amount to 600, then clear it and submit. Actual Chromium baseline:

| Locale | Metrics retained after editing | Metrics retained after invalid submit | Error marking |
| --- | ---: | ---: | --- |
| English | 7 | 7 | none; status still said calculated |
| French | 0 | 0 | native error, `aria-invalid=true` |
| Swahili | 7 | 7 | none; status still said calculated |

The shared tariff controller guarded invalidation and custom validation with `if(french)`. English and Swahili browser validation prevented the submit handler from clearing old results. The engine-error catch also retained prior results in all locales.

## Change

- All three locales use the same tariff validation and immediate input/action/provider invalidation. Invalid submissions clear results, mark/focus the amount field and announce native feedback.
- The input maximum follows the existing engine maximum; no tariff or fee rules changed.
- Engine exceptions and unavailable/invalid catalogs clear output and provide native failure feedback. Catalog failure disables the tariff controls.
- Standard `form.reset()` clears output and reconciles provider, action and currency after native defaults are restored. No tariff reset button is advertised or added; the reset test exercises this programmatic integration explicitly.
- Swahili unavailable reasons are native rather than raw engine codes.
- Manual comparator source, including its summary and clipboard handler, is unchanged (verified by comparing the entire preceding controller). No sensitive input, new network send, analytics event or export behavior was added.
- Generator COPY owns the new labels. Only the exact runtime configuration blocks were regenerated through `--sync-runtime-config`; release markup is preserved.

## Validation

- Chromium: `mobile-money-tariff-state.spec.js`, `mobile-money-readiness.spec.js`, `mobile-money-tariff-truth.spec.js`: **23 passed in 60.0 seconds**, isolated server 4234, evidence `../tariff-state-proof`.
- Covers real successful calculation then editing/blank/negative/excessive amount, provider and action changes, recovery after invalid input, standard reset integration, injected engine error, network and malformed-catalog failures, loading/delayed dependency recovery and existing 390px tariff results in all locales.
- Native reset and engine exceptions are explicitly injected contract tests; they are not claims of a visible reset control or naturally occurring engine crash.
- `node --test tests/mobile-money-runtime-config-sync.test.js`: 5 passed.
- `node tests/mobile-money-fee-finder.test.js`: passed.
- Generator check: 3 routes, zero drift. Runtime syntax and `git diff --check`: passed.

No deployment, acceptance update or source freshness change. Earlier tariff-source limitations remain unchanged. Parent owns integration and release checks.
