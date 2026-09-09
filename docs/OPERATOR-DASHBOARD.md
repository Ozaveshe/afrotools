# Operator dashboard

Production entry: `/mc-7a2f9x.html` (the extensionless route is an alias).
Netlify rewrites both to `operator-dashboard.mjs`. No dashboard HTML, controller,
CSS, snapshot, legacy console or image-generation ledger is copied into `dist/`.

## Authentication and serving

Use the existing AfroTools `ADMIN_KEY` credential; `ADMIN_SECRET` is the fallback
when `ADMIN_KEY` is absent, matching `api-admin-session.js`. No new credential or
public environment variable is required. Missing configuration returns 503.

The function serves a minimal login form to anonymous dashboard requests and
returns 401 for private resources. Successful POST login sets a signed, random,
30-minute `__Host-afro_ops` cookie with Secure, HttpOnly, SameSite=Strict and Path=/.
The credential is sent only in the POST body and is not logged, placed in URLs,
or saved in local/session storage. Signature checks use constant-time comparison;
credential rotation invalidates existing sessions. Logout clears the cookie.
A copied session remains valid until expiry or credential rotation: sessions are
stateless, with no server-side per-session revocation store.

Login/logout require a matching Origin. All responses are private/no-store at
browser and CDN layers, deny framing and indexing, and restrict resources using
CSP. Referrer-Policy is same-origin so same-origin form POSTs retain Origin while
cross-origin navigation does not receive a referrer. Netlify function configuration
limits requests to 30 per minute per IP/domain; local harness tests do not prove
platform rate enforcement. The dashboard reloads when restored from bfcache.

`/api/operator-dashboard/` exposes only these authenticated resources:

- `dashboard.js`, `dashboard.css`, `snapshot.json`
- `pro-readiness.md`, `pro-gates.json`
- `session`, and POST-only `login` / `logout`

The function loads a fixed file allowlist, never a request-supplied filesystem
path. `netlify.toml` includes exactly six private files in its server bundle.
Legacy `/admin/*` routes remain blocked; existing operator workflows are retained
in source at `admin/legacy-operations.html` but are not published. General source
and report references render as filenames with copyable refresh commands rather
than dead links to private paths. The Pro readiness and gate documents have
explicit authenticated download routes.

## Data refresh

Run relevant evidence-owner commands, inspect their outcomes, then:

```powershell
node scripts/build-operator-dashboard.js
```

The optional `--image-root C:/path/to/image-audit/afrotools` consumes the parent's
image manifests read-only when integration is still pending. Rebuild without that
option after integration. The snapshot preserves dates and hashes for source
reports; snapshot generation does not refresh them or prove live health.

Registry definitions, quality grades, locale page states, source review cadence
and Pro readiness are repository evidence. Revenue, users, subscriptions and
provider health remain unavailable unless separately verified. Image placements
are reference evidence, not visual/browser approval. Planned locale reuse still
requires review of the generated image. Task progress stays device-local under
`afrotools-operator-image-progress-v1`; CSV includes those notes separately from
canonical audit status and neutralizes spreadsheet formulas.

## Validation and release

```powershell
node --test tests/operator-dashboard.test.js tests/operator-dashboard-auth.test.mjs
npx playwright test --config=playwright.operator.config.js
npm run security:scan
npm run build:deploy
npm run audit:dist
```

The dedicated local harness runs the real function with a synthetic credential;
it does not read production credentials or private accounts. Tests cover missing
configuration, incorrect keys, cross-origin login, session tampering/expiry/key
rotation, logout, anonymous direct resources, fixed path boundaries, mobile and
keyboard controls, exports, device progress and recovery states. Deployment proof
must additionally verify the Netlify function bundle, live anonymous denial,
authenticated resource access where the existing credential is available, and
continued static exclusions. Do not infer live proof from this harness.

The release coordinator owns integration and production deployment. This task
must not start a competing deploy. Rollback is the previous verified Netlify deploy;
removing the two dashboard rewrites also returns the entry points to 404 while
preserving static exclusions.
