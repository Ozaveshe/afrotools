## Changed Files
- Exact decimal parser and both English Ghana/Naira amount converters.
- Main Lobola planner, six English country pages and their readable controller.
- Focused tests and `reports/growth-recovery/2026-09-08/app-quality/` evidence.

## User-Facing Changes
- Amount figures, words and copied lines now agree through decimal rounding and maximum values. Invalid/negative inputs produce an accessible error rather than a different positive amount.
- Lobola respects zero/one livestock counts, invalidates outdated results after edits, and keeps country calculators intact when shared country personalization runs.
- Market-days workflow was exercised and left unchanged.

## Tests Run
- [x] `git diff --check`
- [x] Exact-decimal unit tests, existing market-engine tests and Lobola contract checks.
- [x] 15 focused source-browser checks, including mobile, desktop, copy, offline use, local handoff and country changes.
- [x] `npm run build:deploy`, `npm run audit:dist`, `npm run security:scan`.
- [x] Four core browser checks against the optimized local `dist` artifact.
- Full `npm test` not run; focused checks cover the changed workflows. An existing French Lobola test expects an outdated heading and was excluded from final focused coverage; French source is unchanged.

## Screenshots Needed
- Before/after result and country-planner screenshots included in the lane report directory.

## Risk Notes
- Privacy: local calculation/copy/save remain intact; no raw input added to analytics or network calls.
- Accessibility: descriptive amount labels, live validation/copy statuses and result focus; 390px checks pass.
- SEO/routes: existing routes, canonicals and locale launch states preserved.
- Analytics: no shared helper or event changes; no conversion/retention improvement claimed.
- Source freshness/confidence: Lobola values remain editable examples. Existing market anchor preserved; independent current source confirmation remains limited.
- Generated output: owner-generated runtime cache hashes retained in touched HTML. Unrelated generated changes restored; no sitemap or minified source edits.

## Rollout Flag
- Flag/config: none. Draft for coordinator review; not merged or deployed.
- Rollback path: revert the source commit and rebuild through the normal owner pipeline.
