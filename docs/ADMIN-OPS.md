# Admin Ops

## Mission Control

`/mc-7a2f9x.html` is the single admin cockpit.

Use it for:

- backend freshness and scraper health
- API status and protected-endpoint audit
- alerts and gazette review queue visibility
- jumping into the narrower admin data-entry pages

`/admin/dashboard.html` now exists only as a redirect shell back to Mission Control so we do not maintain two competing dashboards.

## Admin Auth Flow

Mission Control no longer carries a hardcoded unlock password in the page.

It validates the shared admin key against:

- `GET|POST /api/admin-session`

Frontend behavior:

- operator enters the admin key once in Mission Control
- the validated key is stored in `sessionStorage.admin_key`
- sub-pages such as `/admin/alerts.html` and `/admin/review.html` reuse that browser-session key

## Backend Status Feed

Mission Control reads consolidated live health from:

- `GET /api/admin-status`

That protected endpoint aggregates:

- `/api/data-freshness`
- `/api/scraper-health`
- `/api/alerts?view=admin`
- `/api/gazette-review`
- monitored endpoint checks across public, protected, and admin API routes

Endpoint classifications:

- `working` means the route responded and matched the expected payload shape
- `protected` means the route correctly required auth or an API key
- `degraded` means the route responded but the payload shape or freshness looked wrong
- `broken` means the route failed or returned an unexpected error status

## Operational Note

If you change the shared admin secret, Mission Control and any admin sub-page session will need a fresh login because the browser only keeps the validated key for the current session.
