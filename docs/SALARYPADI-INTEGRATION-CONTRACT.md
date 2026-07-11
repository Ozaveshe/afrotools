# SalaryPadi integration contract

Contract version: `1.0.0`
Published: 2026-07-11
Canonical API base: `https://afrotools.com/api/v1`

## Audit evidence

The implementation was checked against the following repository sources before the catalog was published:

| Surface | Current source of truth | Verified behavior |
| --- | --- | --- |
| Public v1 routes | `netlify.toml`, `_redirects`, `data/api-public-contract.json` | PAYE, tax rates, VAT, FX, fuel, central-bank rates, countries, AI routing, offer comparison and scam checks have deployed v1 route mappings. The wildcard router also serves the broader AfroData routes and `/api/v1/health`. |
| API authentication | `netlify/functions/api-tax.js`, `netlify/functions/utils/api-auth.js`, `netlify/functions/_shared/api-auth.js` | Sandbox, dashboard/Blob, legacy Supabase and anonymous boundaries already existed. SalaryPadi previously had an unmetered environment-key exception in PAYE and career routes. It now uses one scoped, quota-enforced service-key boundary. |
| Published tool registry | `assets/js/components/tool-registry.js`, generated `data/tool-directory.json` | The SalaryPadi catalog uses only live English registry tools with canonical public routes. It does not infer an integration mode from a marketing description. |
| Widgets | `widgets/iframe/` | PAYE country widgets and job-oriented employer-cost, freelance-rate, leave, salary-budget and severance widgets exist. None is declared as a SalaryPadi widget integration because the catalog tools do not yet have a tested, versioned widget contract that matches those iframe products. |
| Career calculations | `netlify/functions/api-career.mjs`, `netlify/functions/_shared/career-engine.js`, `tests/api-career.test.js` | Offer comparison and scam-check calculations exist and remain backward compatible. The SalaryPadi catalog still maps the public Job Offer Evaluator as `link`: its product-page contract is not being represented as the separate career API contract. |
| Quotas | `netlify/functions/_shared/api-plans.js`, `netlify/functions/_shared/rate-limit.js` | Public plans remain unchanged. SalaryPadi defaults to 10,000 requests/day and can be changed through server-only configuration. |

## Service authentication

SalaryPadi must send its dedicated key in the `x-api-key` header from server-side code only.

```http
x-api-key: <SALARYPADI_API_KEY>
```

Server configuration:

- `SALARYPADI_API_KEY`: dedicated secret; required.
- `SALARYPADI_API_DAILY_LIMIT`: positive integer up to 1,000,000; defaults to `10000`.
- `SALARYPADI_API_SCOPES`: optional comma-separated override. Default scopes are `catalog:tools`, `tax:paye`, `tax:rates`, `fx:rates`, `countries`, `career:offer-compare`, and `career:job-scam-check`.

Never put this key in browser JavaScript, `NEXT_PUBLIC_*` variables, URLs, analytics, logs, screenshots or client error payloads. AfroTools does not log PAYE input bodies, salary results or the supplied service key.

## Catalog request

```http
GET /api/v1/catalog/tools?product=salarypadi&category=career
x-api-key: <SALARYPADI_API_KEY>
```

Only the exact `product=salarypadi` and `category=career` query is supported in v1. A different query returns `400 UNSUPPORTED_CATALOG_QUERY`.

Response headers:

- `ETag`: content-derived SHA-256 validator.
- `Cache-Control: private, max-age=300, stale-while-revalidate=600`.
- `Vary: Origin, x-api-key, If-None-Match`.
- `X-RateLimit-Limit` and `X-RateLimit-Remaining`.
- `X-RateLimit-Scope: service:salarypadi`.

SalaryPadi should store the last verified response, send its `ETag` as `If-None-Match`, and retain the stored response on a `304`. A failed request must not replace the last-known-good catalog.

## Tool metadata v1

The normative schema is `https://afrotools.com/api/schemas/v1/tool-catalog-response.schema.json`.

Every published tool contains:

- `schemaVersion`, `id`, `name`, `description`, and `category`.
- `integrationMode`: exactly `api`, `widget`, or `link`.
- `canonicalUrl` and `countries` (`ALL` or ISO alpha-2 codes).
- `api` or `widget` only when the selected mode is implemented and tested.
- `inputSchema` and `outputSchema` for API tools; `null` for link tools.
- `rulesVersion`, which is nullable where no statutory/data ruleset applies.
- `lastVerified`, `disclaimer`, and required attribution.

Link-mode records must have `api`, `widget`, `inputSchema`, and `outputSchema` set to `null`. Unpublished records are validated but excluded from responses. Malformed metadata makes the endpoint fail closed with `503 CATALOG_INVALID`.

## Published integration modes

| Tool | Mode | Contract |
| --- | --- | --- |
| Nigeria PAYE Calculator | `api` | `POST /api/v1/tax/paye`; PAYE request/response schemas; Nigeria only. |
| AfroFX | `api` | `GET /api/v1/fx/rates`; query/response schemas; all countries. |
| CV Builder | `link` | Canonical AfroTools workflow only. |
| Salary Benchmarker | `link` | Canonical AfroTools workflow only. |
| Salary Intelligence | `link` | Canonical AfroTools workflow only. |
| Minimum Wage Checker | `link` | Canonical AfroTools workflow only. |
| Overtime Calculator | `link` | Canonical AfroTools workflow only. |
| Leave & PTO Calculator | `link` | Canonical AfroTools workflow only. |
| Pension Fund Projection | `link` | Canonical AfroTools workflow only. |
| Job Offer Evaluator | `link` | Canonical AfroTools workflow only; SalaryPadi keeps its own deterministic comparison. |
| Interview Preparation | `link` | Canonical AfroTools workflow only. |
| Career Switch | `link` | Canonical AfroTools workflow only. |
| Career Growth | `link` | Canonical AfroTools workflow only. |
| Salary Negotiation | `link` | Canonical AfroTools workflow only. |
| Retirement Readiness | `link` | Canonical AfroTools workflow only. |

No SalaryPadi catalog record currently declares `widget` mode.

## Calculation and metadata APIs

PAYE:

```http
POST /api/v1/tax/paye
x-api-key: <SALARYPADI_API_KEY>
Content-Type: application/json

{"country":"NG","grossMonthly":500000}
```

Use exactly one of `grossAnnual`, `grossMonthly`, `netAnnual`, or `netMonthly`. The response includes API metadata and a timestamp. SalaryPadi must display the rules version and verification date supplied by the catalog and must not silently substitute a different statutory engine.

FX:

```http
GET /api/v1/fx/rates?base=USD&target=NGN&amount=1
x-api-key: <SALARYPADI_API_KEY>
```

Request a unit rate when SalaryPadi can perform multiplication locally. Display the returned source and `updated_at`; do not present the result as an executable transfer quote.

Country metadata:

```http
GET /api/v1/countries?code=NG
x-api-key: <SALARYPADI_API_KEY>
```

The countries endpoint remains the documented source for country name, currency, region and available API products.

## Health and failure behavior

```http
GET /api/v1/catalog/health
x-api-key: <SALARYPADI_API_KEY>
```

Health returns the contract version, product/category, published count and last-verification date. It does not return or validate salary data.

Stable catalog errors:

| Status | Code | Meaning |
| --- | --- | --- |
| 400 | `UNSUPPORTED_CATALOG_QUERY` | Product/category is outside the v1 contract. |
| 401 | `INVALID_SERVICE_KEY` | Missing or invalid dedicated key. |
| 403 | `SERVICE_SCOPE_DENIED` | Key exists but lacks the catalog scope. |
| 429 | `RATE_LIMIT_EXCEEDED` | Dedicated daily quota is exhausted. |
| 503 | `CATALOG_INVALID` | Published metadata failed validation; no partial catalog is returned. |
| 503 | `SERVICE_QUOTA_UNAVAILABLE` | Production quota verification is unavailable; access fails closed. |

Existing public API routes, sandbox behavior, dashboard keys and career endpoints remain available. Breaking catalog changes require a new schema/URL version under the public 90-day deprecation policy.
