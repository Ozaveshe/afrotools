# Cover-letter mobile progress overlap

The merged shared stylesheet forces progress steps to wrap. At 320px the sticky progress strip measured 446px in English, 468px in French and 457px in Swahili; a visible stage tab underneath it did not receive an actual pointer click even after cookie rejection.

The shared cover-letter runtime now adds a scoped `max-width:900px` rule: progress stays readable and wrapped in normal document flow, and the existing stage tabs use top:0. Desktop rules and content are unchanged. The tests do not claim the tabs remain viewport-sticky throughout every parent scroll region; they verify navigation after scrolling deeply and returning to a visible tab.

## Validation
Read-only combined source was served at http://127.0.0.1:4499 from `minimum-wage-fr-inflation-20260916/afrotools`. Only the shared cover-letter runtime response was intercepted with this candidate. This is explicitly injected-candidate evidence, not a built or deployed result.

`COVER_LETTER_INJECT_CANDIDATE=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:4499 PORT=4499` with `playwright test tests/e2e/cover-letter-mobile-navigation.spec.js --workers=1`: seven cases passed (6.8 seconds): EN/FR/SW at 320px and 390px plus desktop style comparison at 1280px. Each mobile case clicks the normal current Reject control, confirms declined storage/banner removal, scrolls the document, checks elementFromPoint and uses an actual mouse click. No forced click or hidden overlay.

With injection disabled, the English 320px control run fails specifically because the visible tab does not receive the pointer. Syntax and diff checks passed. Coordinator must independently run the test without injection after integration. No deployment or combined-tree edits were performed by this lane.
