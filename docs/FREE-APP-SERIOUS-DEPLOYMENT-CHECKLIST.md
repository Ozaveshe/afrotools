# AfroTools serious-app deployment checklist

Use this checklist for every free app before category closure or production deployment. A visual pass, a successful calculation, a clean build, and a live URL are separate proof layers; none substitutes for the others.

## 1. Product contract

- [ ] The user task, intended audience, jurisdiction, currency, input units, output meaning, and exclusions are explicit.
- [ ] The page does not promise filing, legal compliance, official approval, live data, AI, delivery, or guaranteed outcomes that the implementation cannot provide.
- [ ] Free, account, Pro, partner, and lead-generation boundaries match actual behavior.
- [ ] Every launched locale, alias, widget, API, server engine, and related route in the same product family is inventoried.

## 2. Authority, freshness, and confidence

- [ ] High-stakes rules use current primary official sources; secondary sources are only corroboration.
- [ ] Every changing rate, threshold, deadline, eligibility rule, exemption, and classification has a checked date and source URL.
- [ ] Conflicting, missing, or stale evidence is disclosed as a gap; the product pauses or requests user input instead of guessing.
- [ ] The UI shows source, review date, assumptions, jurisdiction, and a planning-estimate boundary beside the workflow or result.
- [ ] Source registry, tool-verification metadata, calculation-quality records, and public copy agree.

## 3. Formula and function correctness

- [ ] One shared pure engine owns the calculation when multiple pages, locales, widgets, APIs, or server functions expose it.
- [ ] Tests cover zero, blank, invalid, negative, decimal, boundary, threshold, high-value, optional-input, and stale-result cases.
- [ ] Units, periods, currencies, inclusive/exclusive thresholds, marginal/flat treatment, rounding, caps, floors, and ordering are verified.
- [ ] Reverse calculations, comparisons, invoice totals, employer costs, or scenarios reconcile with the primary calculation where offered.
- [ ] Protected formula changes have an explicit source review and fixture-delta receipt; unrelated formula drift is not accepted.
- [ ] Old engines, inline constants, APIs, widgets, and localized copies cannot contradict the canonical engine.
- [ ] Browser proof records zero uncaught exceptions and unexpected console errors; recoverable failures use clear inline or live-region feedback and never leave a stale result visible.
- [ ] Expected offline, missing-library, blocked-request, timeout, malformed-input, and export-failure paths are exercised where applicable, without silently changing the formula or claim.

## 4. Forms and interaction states

- [ ] Every input has a visible label, correct type/input mode, help text where needed, and realistic bounds.
- [ ] Required, optional, conditional, disabled, loading, empty, invalid, success, error, and reset states are deterministic.
- [ ] Invalid or changed inputs clear stale results and disable export/share actions until recalculation.
- [ ] Buttons, tabs, toggles, drawers, menus, dialogs, and dynamic rows work by keyboard and expose correct roles/states.
- [ ] Async and result changes use an appropriate live region without excessive announcements.

## 5. Mobile and responsive behavior

- [ ] Core workflows are tested at 320, 360, 375, and 768 CSS pixels where applicable.
- [ ] No horizontal page overflow, clipped text, off-screen menus, overlapping sticky UI, or hidden final controls exists.
- [ ] Touch targets are at least 44 by 44 CSS pixels and remain reachable above banners, keyboards, and safe areas.
- [ ] Tables, long identifiers, URLs, currency values, translated labels, and PDFs remain readable on narrow screens.
- [ ] The mobile experience preserves the complete task; it is not a reduced or broken desktop layout.

## 6. Visual design and dark mode

- [ ] The page follows AfroTools design doctrine while retaining an appropriate category/country identity.
- [ ] Hierarchy makes the primary task, inputs, result, assumptions, sources, and next action obvious.
- [ ] Light and dark modes cover every card, field, menu, modal, result, warning, table, footer, iframe, and third-party surface.
- [ ] Text, icons, borders, controls, status colors, and focus rings meet contrast requirements in both themes.
- [ ] Decorative motion respects reduced-motion preferences and is never required to understand the result.
- [ ] A human reviews representative screenshots; automated overflow/contrast checks do not replace visual acceptance.

## 7. Accessibility

- [ ] Heading order, landmarks, page title, skip path, labels, descriptions, error associations, and status semantics are sound.
- [ ] The complete workflow works with keyboard only, with visible focus and logical focus order.
- [ ] Dialogs/drawers trap and restore focus, close with Escape, and expose modal/name/description semantics.
- [ ] Meaning is not conveyed by color, position, animation, placeholder, icon, or hover alone.
- [ ] Zoom, text enlargement, screen-reader names, and language attributes are appropriate for each launched locale.

## 8. Privacy, consent, and data handling

- [ ] Financial, career, legal, health, identity, document, and other sensitive inputs remain local by default.
- [ ] No raw input or result appears in analytics, console output, URLs, referrers, screenshots, test artifacts, server logs, or third-party requests.
- [ ] Any AI, account sync, cloud save, email, lead, share, or partner handoff has explicit action, field disclosure, purpose, and consent.
- [ ] A local-only alternative remains available when a network feature is optional.
- [ ] Storage keys, retention, deletion/reset behavior, and remote-vs-local boundaries are visible and tested.
- [ ] Tests use synthetic data and inspect storage plus all non-GET requests.

## 9. Share, save, import, and export

- [ ] Sharing is route-only by default; including sensitive values requires a separate explicit action and warning.
- [ ] Copy, save, import, JSON/TXT/CSV, image, print, and download labels describe what actually happens.
- [ ] Primary exports are not gated by registration, email capture, lead capture, or payment unless the product contract explicitly requires it.
- [ ] File names, MIME types, encodings, page sizes, rounding, locale labels, source text, assumptions, and timestamps are correct.
- [ ] Exported state can be re-imported safely when portability is offered; malformed files fail clearly.

## 10. PDF and document proof

- [ ] A claimed PDF download produces a real `%PDF-` file, not only a print dialog or renamed text/blob.
- [ ] The PDF is parser-readable and contains the expected inputs, totals, methodology, source, checked date, limitations, and locale labels.
- [ ] Page breaks, tables, long text, fonts, currency glyphs, headers/footers, and dark-mode independence are checked.
- [ ] Sensitive content is excluded from unrelated banners, analytics, metadata, and network calls during export.
- [ ] ATS/parser compatibility is tested separately for resume/CV/document workflows where required.

## 11. Network, API, function, and failure paths

- [ ] Every request is necessary, documented, correctly scoped, and uses the intended product/backend identity.
- [ ] Authentication, authorization, validation, rate limiting, CORS, timeouts, retries, error mapping, and abuse controls are appropriate.
- [ ] Offline, slow, empty, malformed, unauthorized, expired, rate-limited, server-error, and partial-response paths are tested.
- [ ] Server and browser calculations use the same versioned contract or have explicit parity fixtures.
- [ ] Secrets, internal URLs, stack traces, source maps, private schemas, and debug output are absent from publish surfaces.

## 12. SEO, routes, and structured data

- [ ] Title, description, canonical, robots, OG/Twitter metadata, and public claims are truthful, unique, and bounded.
- [ ] Canonical routes, aliases, redirects, trailing slashes, app subroutes, and noindex pages resolve as intended.
- [ ] Structured data parses and describes visible functionality only; unsupported FAQ/review/rating/official claims are absent.
- [ ] Internal links and related-tool cards resolve, use the correct registry identity, and show real artwork/fallbacks.
- [ ] The intended route appears in the correct sitemap and noindex/private/fallback routes do not.
- [ ] The page gives a concise, visible answer to its primary task, then exposes assumptions, formula/method, source authority, checked date, limitations, and next step in semantic headings and readable text.
- [ ] Search index, tool directory, category membership, related-tool identity, and AI tool catalog use the same canonical tool id, route, locale, capability, and freshness contract.
- [ ] AI-search context is source-coupled for changing tax/rate/rule facts; generated context contains the reviewed formula id/version and does not repeat stale page copy as authority.
- [ ] AI manifest capabilities are truthful: `prefill`, export formats, API/network behavior, comparison, account, and lead actions are advertised only when an implemented and tested consumer exists.
- [ ] Structured data and AI/search summaries do not expose contradictory rates, unsupported official status, hidden instructions, private content, or claims that are absent from the visible page.
- [ ] These SEO and AI-search checks run during the individual page VIP pass; Day 13 is regression and reconciliation, not their first evaluation.

## 13. Localization

- [ ] Every launched sibling is native or is clearly marked as an English fallback according to locale policy.
- [ ] UI, dynamic validation, results, sources, dates, numbers, currency, share text, file names, and PDF content are localized.
- [ ] Canonical and hreflang links are reciprocal, locale-correct, indexability-compatible, and route-real.
- [ ] No mojibake, replacement character, mixed-language iframe, stale translated formula, or English-only error path remains.
- [ ] Longer labels and locale-specific number formatting pass mobile and dark-mode tests.

## 14. Performance and resilience

- [ ] Critical UI works without unnecessary third-party libraries, duplicate frameworks, or blocking assets.
- [ ] Images have appropriate dimensions/formats, lazy loading, fallbacks, and no avoidable layout shift.
- [ ] Repeated actions do not leak listeners, duplicate components, grow storage, or degrade responsiveness.
- [ ] Service-worker/cache behavior cannot trap users on obsolete formulas or broken assets.
- [ ] Representative mobile performance and core-web-vitals risks are reviewed before broad release.

## 15. Security

- [ ] Inputs and imported content are safely parsed/escaped; DOM injection and formula/spreadsheet injection paths are tested.
- [ ] External links, downloads, iframes, postMessage, clipboard, file handling, and redirects use safe boundaries.
- [ ] Dependencies, functions, headers, CSP-relevant changes, redirects, and publish artifacts pass the relevant security checks.
- [ ] No admin-only controls, internal markers, TODOs, test credentials, keys, tokens, PII, or confidential files are published.

## 16. Repository and generated-output integrity

- [ ] Source owners are edited instead of minified, localized, sitemap, bundle, or `dist` outputs.
- [ ] Required generators rebuild all dependent registries, indexes, bundles, hashes, localized pages, redirects, sitemaps, and service-worker stamps.
- [ ] Source diffs are reviewed separately from generated churn; unrelated dirty work is preserved.
- [ ] `git diff --check`, focused syntax/tests, category validators, link checks, SEO, localization, and calculation-quality gates pass.

## 17. Build and deploy artifact

- [ ] `npm run build:deploy` completes from the exact intended source SHA.
- [ ] `npm run audit:dist` verifies the publish artifact rather than only the source tree.
- [ ] `npm run security:scan` passes and the artifact contains every required route/asset with no private files.
- [ ] Redirects, headers, functions, bundles, minified files, image fallbacks, offline behavior, and cache stamps are checked in `dist`.
- [ ] Build warnings are classified; no unexplained warning is silently treated as a pass.

## 18. Commit, push, CI, and deployment identity

- [ ] The release commit contains only intended source and owned generated output; evidence junk is excluded.
- [ ] The pushed branch and remote SHA match the reviewed commit, with no unresolved remote divergence.
- [ ] CI checks complete against that exact SHA.
- [ ] Netlify/site/project identity is verified before deployment; preview, draft, and production are clearly distinguished.
- [ ] Netlify production-deploy capacity is active for the team; operational-only credits, a successful preview, or a still-serving prior production site are not deployment authority.
- [ ] Production deployment reports the exact commit/deploy identity and has a documented rollback path.

## 19. Live production verification

- [ ] Representative hub, app, locale, alias, widget, asset, PDF, and function routes return the intended production content.
- [ ] Browser checks on production repeat the core calculation, invalid/stale clearing, mobile, dark, keyboard, PDF, share, and privacy assertions.
- [ ] Console, network, storage, redirects, canonical/hreflang, structured data, images, and cache headers are inspected live.
- [ ] Scheduled workers, live data, databases, forms, auth, payment, and partner flows receive separate production proof when applicable.
- [ ] Local, CI, deploy, live-route, database, and scheduled-worker evidence remain separately labeled.

## 20. Acceptance and ledger closeout

- [ ] The hub and every canonical free app in the category have an individual receipt; partial rows are not rounded up.
- [ ] P0/P1 defects are closed; accepted residual risks are explicit, bounded, and assigned.
- [ ] The ledger records exact counts, routes, tests, screenshots, source dates, formula reviews, deployment SHA, and live proof.
- [ ] A random cross-category production sample is selected only after deployment and includes mobile, dark, formula, PDF/export, locale, and failure-path coverage.
- [ ] The category moves from `IN REVIEW` to `LOCAL PASS` only after local proof, and to `LIVE PASS` only after exact-SHA deployment plus live verification.
