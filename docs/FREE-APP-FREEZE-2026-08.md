# AfroTools Free-App Freeze — 2026-08

## Decision

The English, French, and Swahili free-app parity programmes are in maintenance
mode from 2026-08-10. Product expansion is frozen through at least 2026-10-10,
with a review no later than 2026-11-10.

The active product priorities during this window are:

1. Hausa route-by-route parity.
2. Yoruba route-by-route parity and Unicode quality.
3. Pro product completion, entitlement, billing, and live QA.

This is a scope freeze, not an abandonment of operational responsibility.

## Frozen Scope

- Do not add new English, French, or Swahili free apps merely to expand the
  catalog.
- Do not introduce alternate routes, aliases, thin wrappers, or duplicate app
  identities without a release-critical reason.
- Do not change accepted formulas, workflow semantics, exports, or locale
  ownership as opportunistic cleanup inside Hausa, Yoruba, or Pro work.
- Keep the 1,257 English free-app denominator and the accepted French and
  Swahili mappings stable unless a reviewed source-of-truth correction requires
  a change.

## Allowed Maintenance

The freeze does not block:

- security, privacy, accessibility, or production reliability fixes;
- broken-route, canonical, hreflang, sitemap, structured-data, analytics, or
  internal-link repairs;
- source-freshness updates for tax, legal, government, transport, market, or
  other changing evidence;
- browser or export regressions where advertised behavior no longer works;
- explicitly approved Pro integrations that reuse a free-app engine safely.

Every exception should be narrow, source-owned, tested, and described as
maintenance rather than catalog expansion.

## SEO Maintenance Contract

- Sitemaps remain generated from the route contract; never hand-edit sitemap
  XML as the first fix.
- Preserve historical `<lastmod>` values unless a route or its search-facing
  content actually changed.
- Keep canonical, `og:url`, JSON-LD self URLs, hreflang, redirects, internal
  links, route maps, and sitemap entries aligned in the release build.
- Continue normal SEO, source-freshness, link, security, and deploy monitoring
  during the freeze.

## Exit Criteria

Reopen English, French, or Swahili free-app expansion only after an explicit
review that considers Hausa progress, Yoruba progress, Pro readiness, user
demand, source maintenance capacity, and release risk.
