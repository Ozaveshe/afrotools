# Electricity result identity — 2026-09-17

A read-only browser diagnostic reproduced stale results in all three locales on f309e89d. After calculating12.83kWh from the maintained Uganda record, changing the amount left that result visible. Switching to Ghana custom-rate mode also left the Uganda result and assumptions visible alongside changed source details.

The shared readable owner assets/js/pages/electricity-cost-prepaid-units.js now invalidates the visible estimate and cached result on form input/change events before source/control handlers run. The calculation engine, rates, source records and locale routes are unchanged.

Root browser session62500 passed three EN/FR/SW cases in28seconds at320px. Cases cover amount/country/tariff/custom-rate/fixed-charge/tax/deduction/currency edits, successful recalculation, custom66-to20kWh arithmetic and15/16kWh lifeline boundaries. Tests deliberately use the record's2026-08-15 date through the existing test hook; they prove deterministic workflow behavior, not current tariff validity. Diagnostic JSON and test artifacts are retained privately. No observed horizontal overflow in these fixtures.

Remaining scope: native dataset-note translation is incomplete (the French diagnostic contained mixed-language assumptions), exhaustive provider/class coverage, source freshness, exports and full accessibility are unverified. This is a bounded result-identity repair, not whole-tool parity. No live or full-build claim for this batch yet.

## Release identity-test investigation — 2026-09-26

The release artifact exposed intermittent hidden-result failures during automated pointer clicks. The original Swahili failure kept the standard tariff selected and its source panel current, while the prior lifeline amount remained in a hidden result. A later French failure occurred after selecting lifeline and entering 15 kWh. Its retained trace shows repeated instability, sticky-navigation interception and the source panel crossing the attempted click location; the form result remained hidden. This evidence supports a missed pointer activation during scrolling rather than a demonstrated wrong-tariff calculation.

### Correction to the initial test change

The first adjustment in `8da775cd` (integrated as `def3c015`) incorrectly used `test.use({ reducedMotion: 'reduce' })`. Installed Playwright 1.59.1 has no top-level reducedMotion fixture: its `_combinedContextOptions` merges the nested `contextOptions` object. The top-level setting was ineffective. The earlier three-case pass in 37.5 seconds therefore did **not** prove reduced motion was active. A separate direct `browser.newPage({reducedMotion:'reduce'})` check used a valid but different API and did not establish the spec's actual context. The later French failure's Create context record explicitly contains reducedMotion undefined; no reduced-motion emulation call was made. This was a test configuration mistake, not an artifact config override or a demonstrated arithmetic regression.

The follow-up uses `test.use({ contextOptions: { reducedMotion: 'reduce' } })` and asserts, before interaction, both `matchMedia('(prefers-reduced-motion: reduce)').matches === true` and computed document `scrollBehavior === 'auto'`. It keeps real locator clicks, the visible-result assertion after every click, all exact arithmetic expectations and existing input invalidation assertions. There are no force-clicks, direct form submissions, retries, sleeps or relaxed numeric assertions in the spec.

### Bounded verification and evidence

- Three EN/FR/SW identity cases passed in **43.1 seconds**, served from the coordinator's unchanged optimized `dist` built from product source `a9821c33`, through a separate read-only local server on port 4524.
- All three complete passing traces were retained. Independent trace extraction confirms each actual browser context has `reducedMotion: reduce`, and each effective-condition evaluation returned true / auto. Results include 15 kWh lifeline = 3,750 UGX, 16 kWh lifeline = 4,529.4 UGX and 16 kWh standard = 12,470.4 UGX, with visible results.
- Syntax and whitespace checks passed. No product runtime, CSS, tariff data, formula, generated output, source dates or analytics changed. The full 21-case suite was not rerun; this is the focused correction, and integration owns broader release validation.
- The earlier independent ordinary-motion diagnostics remain separate: three full input sequences, five CPU-throttled sequences and three 80–250 ms pointer-press cases calculated correctly. Separate 320px mobile touch contexts across EN/FR/SW correctly submitted both lifeline and standard after the real button was positioned in view. These are bounded checks, not proof of every mobile platform or moving-content tap.

Private evidence directory: `C:/Users/Oza/.codex/worktrees/cover-letter-parity-20260916/electricity-identity-investigation/`.

- `def3c015-fr-failure-trace.zip`: preserved original failed trace; SHA256 `82E3BA12C42F4B4C8647D6557989E35E90703ECDFDB3BCC98C00EA93CA39FD1D`.
- `def3c015-fr-error-context.md`, `def3c015-combined-energy.log`, extracted `def3c015-fr-0-trace.trace.jsonl` / `def3c015-fr-test.trace.jsonl` and click frames preserve the original French failure. Their source was the coordinator's `language-resume-final-energy-artifacts/electricity-result-identit-413b2-o-current-inputs-and-source-chromium/` output from terminal run 61266 (20/21 passed).
- `corrected-context-tests.log`, `corrected-context-artifacts/` and `corrected-effective-context.json` preserve the corrected three-case result and actual context assertions in a distinct directory.
- **Evidence limitation:** the original Swahili ZIP/complete trace JSON was not copied before the coordinator reused its output directory, and is no longer available there. Extracted original frames `electricity-click-86152.jpeg`, `electricity-click-86181.jpeg`, `electricity-click-86217.jpeg` and other neighboring frames remain in the parent evidence folder. Independently collected `electricity-peer-diagnostic.json`, `electricity-peer-throttled.json`, `electricity-peer-press-duration.json` and `electricity-peer-touch.json` also remain; they must not be presented as the original failed trace.

Scroll ownership: `assets/css/global.css` and `assets/css/design-system.css` set document smooth scrolling; global CSS switches it to auto for reduced motion. The electricity runtime and Swahili localizer do not issue scroll calls during tariff selection or calculation. A pointer/tap during moving content can still miss a button; no new product scrolling behavior is changed or universal mobile usability claim made. This report does not establish deployment or current tariff validity.