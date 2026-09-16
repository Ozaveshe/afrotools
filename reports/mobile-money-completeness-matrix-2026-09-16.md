# Mobile Money app completeness review — 16 September 2026

Routes: EN `/tools/mobile-money-fees/`, FR `/fr/tools/frais-mobile-money/`, SW `/sw/zana/ada-pesa-simu/`. Review builds on candidates `8bee631f`, `bd7afb7b`, `85e22cef` and parent copy fix `14bd1f00`. It is local source/browser evidence, not a full-app certification or production verification.

## Confirmed defects fixed in this slice

- EN/SW planning warning had 1.04:1 contrast: `#e8f2ff` text on `#fff5e7`. Four initial matrix cases failed at 320/390px light mode. Scoped shared CSS now uses the warning text color.
- Manual screenshot inspection showed dark EN heading text on its dark gradient. Axe did not report it because of the gradient. App-scoped CSS now gives the heading a light foreground; the test separately measures at least 3:1 against both gradient stops for this large text. Dark mode's existing off-white override is valid and preserved.
- SW hero badges and MTN source title were English. Native copy is now generated from the same owner. The explicit `--sync-badges` mode changes only one exact badge container, preserving every surrounding byte; tests reject missing/duplicate owners. Runtime config and tariff tables use their existing bounded owner modes. Only the SW generated page changes.

## Dimension matrix

| Dimension | EN | FR | SW | Evidence and limits |
| --- | --- | --- | --- | --- |
| Built-in controls | MTN UG / Airtel TZ | Same | Same | Provider/action/currency changes verified. MTN send, agent withdrawal, agent cash-in; Airtel own-network send and agent withdrawal. No Orange built-in tariff. |
| Published arithmetic | Shared engine | Same | Same | Previous source review covers every exposed band boundary; matrix rechecks Airtel 3,000 TZS → 590 charge. Current source limitations below remain. |
| Manual fields | Nine fields per quote | Same | Same | Label, market, currency, action, amount, sender fee, recipient fee, checked date and optional expiry. |
| Two/three-quote comparison | Working | Working | Working | Keyboard-enable third quote; 35/25/15 XOF total fees; three results and lowest 15. Earlier tests cover expired/incomparable states and refreshed exports. |
| Market interpretation | Free text, recognized country aliases normalized | African country-list validation | Free text, recognized country aliases normalized | Existing deliberate product difference, not identical capability. French rejects unknown market names; EN/SW retain them. No new restriction introduced. |
| Validation/reset | Native, precise field focus | Same | Same | Earlier 23-case tariff/readiness and 22-case manual/copy evidence covers invalidation, bad values/dates, exceptions, dependency failure and quote-C reset. No tariff-reset button is advertised. |
| Copy/JSON | Native summary and machine result | Native résumé and machine result | Native summary and machine result | Reopened JSON preserves all three totals and accented synthetic user text. Existing copy success/denial/missing-API tests passed. Machine expiry enums remain machine-readable. |
| Privacy | Local calculation/export | Same | Same | Matrix asserts synthetic quote identifier absent from observed request URLs and bodies. Analytics disabled in local server; this does not certify production analytics configuration or account infrastructure. |
| 320/390px | No horizontal overflow | Same | Same | All three-quote result and tariff states exercised at both widths. No desktop, browser zoom or every device model claim. |
| Light/manual dark | Readable after fix | Readable | Readable after fix | Actual navbar theme action; hero plus main axe serious/critical WCAG2 A/AA check; gradient heading measured separately. Initial persisted-dark loading is not a separate test here. |
| Keyboard/accessibility | Tested core operations | Same | Same | Space enables third quote; Enter calculates; prior tests verify reset and exact invalid-field focus. This is not an exhaustive keyboard traversal or assistive-technology certification; navbar/footer accessibility not included in app axe scope. |
| Native visible copy | English | French | SW gaps above fixed | Native result/error/expiry/summary feedback checked in prior cases; this slice checks SW badges/source title. Not a linguistic review of every country name. |
| Saved drafts/import/PDF | Not offered | Not offered | Not offered | English has no such manual workflow capability to port. JSON download is an export, not an import or auto-save claim. No unsupported PDF feature added. |
| Discovery/SEO | Existing route/canonical | Existing route plus Orange guide handoff | Existing route/canonical | No metadata/canonical changes in this slice. Prior guide handoff tests cover FR country/action/currency prefill. No new GSC results or CTR uplift claimed. |

## Unresolved correctness/source dimensions

- Airtel's currently linked official PDF explicitly covers January–March 2026. September validity remains unconfirmed; native warnings retain this fact.
- MTN fees match the inspected official table, but exact withdrawal tax/rounding and an inconsistent last-band source maximum remain unresolved. The engine returns an unknown all-in total, not zero tax.
- Actual account-tier eligibility and operator confirmation are outside these deterministic reference calculations.
- Browser evidence is Chromium on the local candidate, not a live transaction, production deployment or all-browser test.

## Validation record

- Baseline matrix: 8 passed, four EN/SW light warning-contrast failures, `../money-completeness-before`.
- An intermediate test required exact white heading text and rejected the legitimate dark-mode off-white override; replaced with a contrast requirement. Diagnostic output retained in `../money-completeness-final`.
- Final matrix: **12 passed in 1.4 minutes**, output `../money-completeness-contrast-final` (all locale/width/theme cases).
- Native configuration/badge/table owner tests: 6 passed. Fee-finder node tests passed. Normal generator check: all three routes, zero drift. Whitespace check passed.
- Before/after inspected screenshots: `../money-hero-before.png`, `../money-hero-after.png`.

No push, deployment, tariff-data edits or acceptance-ledger changes. Existing source and legal uncertainties remain open.
