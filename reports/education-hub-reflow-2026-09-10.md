# Education Hub card reflow — 2026-09-10

Reviewed base: `b07f38a5e3ef3baa0facfc778bf719ce1da8cfd2`.

Hosted inspection of immutable preview `45f159c5b55b7422001b0cd8e4d0e1f63ff2a5a8` found child text outside Education Hub cards at 320px and 200% text. The same clipping remained with the preview Drawer hidden. The shared `.top-level-page-ui-refresh a[href]` touch-target rule changed summary links from grid to a horizontal flex row. The two-column source banner also exceeded its available space. An ancestor could clip content while document overflow still reported zero.

The existing page-specific readable CSS now restores vertical grid composition for readiness, connected-tool, next-action and study-route links. Source status stacks above its explanation. Children can shrink and wrap; touch-target sizes, links, text, stored data, calculation code, privacy and shared CSS remain unchanged.

Six new browser cases inspect child bounds and scrollable text inside the affected containers at 320, 390 and 1280px with 100% and 200% text. Before the fix, five failed and one passed. After the fix, all six and the sixteen existing Education Hub app/journey cases passed (22 total). The 320px enlarged-text readiness section was also inspected visually.

Preview test setup was separately corrected: local-storage fixtures now apply only to the top-level document, avoiding writes in third-party/sandboxed preview frames. The study journey waits for the same explicit planner-ready flag through Playwright's navigation-aware function wait; a transient navigation destroyed the previous one-shot evaluation context. Product error assertions and expected results are unchanged. After integrating the Mobile Money readiness change, all 57 combined local browser cases passed, including these harness changes. The six reflow and eleven Mobile Money readiness cases are included in CI smoke.

The four previously affected provider/navigation cases passed against immutable hosted preview `45f159c5` using the corrected setup and Netlify's documented initial-navigation `ntl-drawer-state=hidden` option. All original product error assertions remain active. This isolates the provider-specific setup from the two real product defects; it does not claim that the new card CSS or Mobile Money readiness change is deployed.

This is local source/browser proof for the card fix. Cache keys, deploy artifact, hosted CI and production evidence remain pending the combined release. No claim of authenticated education cloud synchronization or real student retention is made.
