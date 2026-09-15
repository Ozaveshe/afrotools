# Shared country picker keyboard repair

## Problem and change

The homepage's shared country picker filtered and selected countries, but had no Escape or arrow-key handler. Escape left its open panel and search focus unchanged. Selection rebuilt the component without deliberately restoring focus.

`assets/js/components/country-selector.js` now closes on Escape and restores its trigger, moves between filtered options using arrows and Home/End, and restores trigger focus after selecting a country. Normal search typing and Tab remain native. No country data, personalization values, networking, or calculation rules were changed.

The existing component is a tracked compact legacy source with no separate readable source owner; the new handler is written readably within that file.

## Evidence

- Three regression tests failed against the prior behavior and pass after repair: Escape/trigger focus; filtered arrow navigation; Home/End with native typing, Tab and empty-result handling.
- Local source browser: filtering Kenya then ArrowDown focuses the Kenya option. Escape returns focus to the trigger with `aria-expanded=false`. Enter selects Kenya and returns focus to the updated trigger. No captured console errors.
- Asset versions regenerated with `node scripts/cachebust.js --only=assets/js/components/country-selector.js`, then `node scripts/stamp-sw.js`.
- `npm run calculation-quality:check` still passes: 789 artifacts, 307/307 fixtures, one stale dataset warning.
- The previously completed full deploy build passed. Final `build-dist.js` packaging and `npm run audit:dist` passed after the keyboard repair, as did the repeated security scan.
- Final packaged homepage at 390px: ArrowDown focuses the filtered Ghana option; Escape closes the panel and restores trigger focus. Document client and scroll widths both 384px; zero broken completed images and no captured console errors. The packaged service worker equals source and references the current navbar version.

No production deployment performed.
