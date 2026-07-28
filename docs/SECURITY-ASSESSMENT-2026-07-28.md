# AfroTools Security Assessment — 2026-07-28

## Scope

First repository-wide security pass covering:

- Netlify publish boundaries, redirects, headers, scheduled functions, and
  server-function authentication
- source and deploy-artifact secret exposure
- runtime and build/test dependency advisories
- browser analytics privacy and AI consent
- auth/session regression coverage
- Supabase target identity and live security advisors

Baseline: `origin/main` at `8483eaa65e53ad3ce7d0e95e6d119830816de7cf`.
Remediation work is isolated on `codex/security-first-pass-20260728`.

## Threat Model

Primary untrusted inputs are public HTTP requests, headers, query strings,
JSON bodies, browser-entered tool content, uploaded document metadata, provider
responses, and public Supabase clients. Privileged assets are service-role
keys, admin secrets, payment/provider credentials, user account/session data,
saved sensitive documents, operational tables, scheduled write jobs, and the
Netlify publish artifact.

The required trust boundaries are:

1. public static content to authenticated/account data;
2. public HTTP requests to server-only service-role operations;
3. public/manual function routes to Netlify schedule-only execution;
4. source repository to the `dist/` publish artifact;
5. consented metadata analytics to raw user content.

## Confirmed Findings And Remediation

### P0 — scheduled signals used as authorization

`isScheduledEvent()` accepted caller-controlled `x-nf-event: schedule` or a
JSON `next_run` value. The affected handlers also had public rewrites, so the
code treated untrusted request data as an authorization bypass.

Remediation:

- split public/manual handlers from dedicated schedule-only wrappers;
- manual AfroStream, market-refresh, watchdog, and FX handlers now authenticate
  independently;
- schedule-only wrappers call an internal module export that public Netlify
  requests cannot select;
- `security:scan` now fails when any scheduled function is also a public
  rewrite target or when a public function imports caller-shaped schedule
  detection;
- `tests/scheduled-auth-boundary.test.js` proves spoofed schedule signals
  receive `401`.

### P0 — unauthenticated FX database refresh

`/api/scrape-fx` publicly rewrote to `scrape-fx-rates`, which could fetch
providers, delete the current day’s snapshots, and insert replacements without
an admin credential.

Remediation: the public handler now requires `x-admin-key`; scheduled execution
uses `scrape-fx-rates-scheduled`, which is schedule-only in `netlify.toml`.

### P1 — vulnerable production dependency tree

Baseline `npm audit --omit=dev` reported 11 advisories (four high), including
OpenTelemetry denial of service, `tmp` traversal, `uuid` bounds, and `ws`
memory/DoS issues.

Remediation:

- upgraded `@netlify/blobs` to `10.7.10`;
- upgraded `@supabase/supabase-js` to `2.110.9`;
- aligned `@opentelemetry/core` to `2.9.0` through a scoped override;
- added blocking `security:dependencies` to CI for runtime and build/test tooling.

Current result: zero runtime or development dependency advisories at the
configured moderate threshold.

### P1 — raw user text in analytics

General analytics sent the first 100 characters of searches and exception
messages. Users can paste identity, salary, health, legal, or career data into
these surfaces.

Remediation: events now send capped lengths plus stable metadata only.
`tests/analytics-payload-privacy.test.js` executes the helper with synthetic PII
and asserts that neither raw field nor raw value is emitted.

### P2 — over-broad CSP fallback

Microsoft Clarity and Bing origins were allowed in `default-src`, expanding
their fallback permissions beyond the directives actually required.

Remediation: `default-src` is now `'self'`; Clarity/Bing remain limited to
explicit `script-src`, `img-src`, and `connect-src` directives. Widget CSP
parity and consent tests cover the change.

## Residual Risks

1. CSP still requires `'unsafe-inline'` for the current static HTML estate.
   Removing it needs a nonce/hash migration and broad browser proof.
2. Auth/session compatibility still spans HttpOnly cookies, Bearer support,
   browser Supabase auth, and legacy caches. Existing cookie/session tests pass,
   but retirement must be incremental.
3. Browser-side account writes rely on correct Supabase RLS. The connector
   identity was verified as `zpclagtgczsygrgztlts`, but live security advisors
   timed out on three attempts, so live RLS posture is not proved by this pass.
4. `/api/email/unsubscribe` performs token-authorized state changes on GET.
   Migrate to a confirmation GET plus RFC-compliant one-click POST without
   breaking active email links.
5. Public read-only provider proxies depend on CDN/in-memory caching and
   upstream limits; platform-level per-IP rate-limit policy remains to be
   inventoried across the 104 public function rewrite targets.
6. The native Codex deep scanner could not complete because its discovery
   process failed locally with `spawn EPERM`; repo-native and manual review were
   used instead.

## Verification Results

### Repository and browser checks

- `npm run security:scan`: passed after the structural schedule/public-route
  checks were added.
- `npm run security:dependencies`: zero advisories across 103 runtime and
  development dependencies at the moderate threshold.
- `npm test`: 407 files passed, including 889 Node tests and seven repository
  audits.
- `npm run lint` and `npm run type-check`: passed.
- `npm run test:privacy-ai-consent`: three Playwright consent tests passed.
- Auth browser proof: five navbar-state tests, six dashboard-state tests, and
  five auth-funnel tests passed.
- `npm run build:i18n:validate`, `npm run validate:hreflang`, and
  `npm run seo:report`: passed their blocking contracts. The SEO report still
  lists unrelated auto-fixes that were not applied in this security branch.

### Publish artifact

- The full `npm run build:deploy` gate and `npm run audit:dist` passed.
- After unrelated generator drift was removed, `node scripts/build-dist.js`
  rebuilt the exact scoped source state: 16,025 files, followed by another
  passing `npm run audit:dist`.
- The generated core bundle contains `query_length` and
  `error_message_length`, with no raw shared search/error payload fields.
- The generated `_headers` contains `default-src 'self';`.

### Live evidence

- Netlify project identity was verified as `afrotools`, site ID
  `8aa543db-b4bd-4631-98f8-221440055c41`, primary URL
  `https://afrotools.com`.
- The current production deploy is ready on `main` at baseline commit
  `8483eaa65e53ad3ce7d0e95e6d119830816de7cf`; its platform secret scan
  reported no matches across 20,188 files.
- Current production returned `404` for `package.json`, `AGENTS.md`, a
  `netlify/functions` source path, and a `supabase/migrations` source path.
- Current production returned `200` for `robots.txt`, `sitemap.xml`, and
  `llms.txt`.
- Production still serves the previous broader `default-src` and its schedule
  inventory still uses the pre-hardening function names; this branch has not
  been deployed. No live write endpoint was invoked during the audit.
- The Supabase MCP target was verified as
  `https://zpclagtgczsygrgztlts.supabase.co`. Security advisors timed out on
  three bounded attempts, so no live RLS/advisor claim is made.

## Evidence Contract

Repository/source proof, generated `dist/` proof, live Netlify proof, and live
Supabase proof are separate. A passing source scan does not prove the deployed
artifact or database policies. Do not close residual items without the matching
evidence layer.
