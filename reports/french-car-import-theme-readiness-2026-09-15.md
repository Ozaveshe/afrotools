# French car-import theme readiness

Separate follow-up after telecom contract commit c7620221. No CSS color or calculation changes.

Coordinator reported13 advanced-label contrast failures after manual dark selection. Same-source local repeated tests initially passed3/3. Further inspection showed labels in closed details retained computed light color even with the dark selector active; demanding paint from every hidden label left readiness unsettled indefinitely. Closed details are skipped rendering content, so that observation does not prove a visible CSS contrast defect.

The readiness owner now checks expected advanced-label colors when the details are open, alongside quick-card paint. Opening/closing advanced details rechecks readiness. Retry uses the existing render frames and a version token, with a3-second deadline; failure remains unready/unsettled rather than claiming success. No arbitrary success delay was added.

Tests lay out text before sampling styles, explicitly open advanced fields during manual toggles, and verify contrast at320/390 with both initial light and dark. A deterministic injected delayed-label style proves ready stays false while labels retain the wrong color. Rapid theme changes, restoration of the style, and opening details after a theme change are covered. The existing initial-dark and manual-toggle suites remain intact.

This distinguishes skipped-content computed-style artifacts from actual visible text: all asserted contrast measurements use displayed content. No verified visible contrast regression is claimed from the hidden-label observation.

Validation: source syntax and git diff --check passed. Focused Chromium final outcome appended below. No deployment or acceptance-ledger edits.

Final Chromium:3/3 PASS (33.8s), including existing initial-dark/manual-dark tests and deterministic delayed-label/rapid-toggle coverage at320/390. Server4197 with existing analytics-disabled isolation; output sibling fr-theme-readiness-final2-output.

