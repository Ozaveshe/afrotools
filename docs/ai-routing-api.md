# AfroTools AI Routing APIs

Status: developer and partner reference. This document describes the currently implemented internal `/ai/` router endpoint and the partner-safe public API. It does not expose internal prompts, provider payloads, or model behavior.

## API Surfaces

Implemented:

- Internal command-page router: `POST /.netlify/functions/ai-route-intent`
- Partner API route: `POST /api/v1/ai/route`

Related docs:

- Public HTML API doc: `docs/api/ai-route.html`
- Widget docs: `docs/ASK-AFROTOOLS-AI-WIDGET.md`
- Guardrails docs: `docs/AI-ENDPOINT-GUARDRAILS.md`

## Internal Router Endpoint

The internal endpoint is used by `/ai/`. It is built for the AfroTools web app, not partner embedding.

Path:

```text
POST /.netlify/functions/ai-route-intent
```

Request:

```json
{
  "query": "How much duty will I pay to import a 2016 Toyota Axio into Nigeria?",
  "consentToModel": false,
  "locale": "en",
  "mode": "classification",
  "sessionId": "local-session-id"
}
```

Fields:

- `query`: required, max 1,200 characters by default.
- `consentToModel`: optional boolean. Model routing is only attempted when true and provider keys exist.
- `locale`: optional UI locale hint.
- `mode`: currently normalized to classification.
- `sessionId`: optional local/session rate-limit key. Keep non-sensitive.

Response:

```json
{
  "ok": true,
  "source": "deterministic_obvious",
  "schema": {
    "schemaVersion": 1
  },
  "queryLength": 68,
  "locale": "en",
  "fallbackReason": "",
  "decision": {
    "intentCategory": "import-duty",
    "selectedToolId": "import-duty",
    "selectedRoute": "/tools/import-duty/?source=ask",
    "confidence": 0.86,
    "reasonShort": "Matched import-duty terms and vehicle details.",
    "extractedInputs": {
      "destinationCountry": "Nigeria",
      "make": "Toyota",
      "model": "Axio",
      "year": 2016
    },
    "missingInputs": ["itemValue"],
    "clarificationQuestion": "What is the item value or purchase price?",
    "safetyDomain": "finance",
    "highStakesNotice": "Planning estimate only. Confirm financial, customs, lending, investment, crypto, and business decisions with official sources or a qualified professional.",
    "privacyMode": "browser_local",
    "canPrefill": true,
    "suggestedNextActions": ["Open Import Duty Calculator"]
  },
  "telemetry": {
    "modelMode": "classification",
    "modelCalls": 0,
    "modelFailures": 0,
    "cacheHitRate": 0,
    "estimatedCostUsd": 0
  }
}
```

Internal endpoint safety:

- applies prompt guardrails before routing;
- runs deterministic routing first;
- validates model-selected tool IDs and routes against the manifest;
- rate-limits by IP/session/user;
- separately rate-limits model calls;
- uses normalized prompt fingerprints for safe cache keys;
- avoids caching raw CV/PDF/document content;
- returns telemetry summaries but not raw provider payloads.

## Partner Routing API

The partner API is designed for sites that need a recommended AfroTools link without exposing unrestricted AI behavior.

Path:

```text
POST https://afrotools.com/api/v1/ai/route
```

Authentication:

- Send an API key in `x-api-key`.
- Test keys beginning with `afro_test_` are supported by the existing API auth helper.
- Requests are rate limited. The endpoint can also enforce `AFROTOOLS_API_AI_ROUTE_LIMIT`.

Request:

```json
{
  "query": "Write me a CV for an electrical engineer in Ghana",
  "country": "Ghana",
  "locale": "en",
  "allowedCategories": ["career", "business"],
  "partnerContext": {
    "surface": "jobs-board"
  }
}
```

Fields:

- `query`: required, max 1,200 characters by default.
- `country`: optional country hint for route metadata.
- `locale`: optional locale hint. Supported base values include `en`, `fr`, `pt`, `ar`, `sw`, `ki`, `ha`, and `yo`.
- `allowedCategories`: optional array or comma string. Restricts recommendations.
- `partnerContext`: optional small non-sensitive object. Sensitive key names such as email, phone, CV, resume, document, passport, national ID, salary, bank, card, token, and API key are rejected.

Response:

```json
{
  "status": "success",
  "selectedTool": {
    "id": "cv-builder",
    "name": "CV Builder",
    "href": "/tools/cv-builder/"
  },
  "selectedRoute": "/tools/cv-builder/?source=api_ai_route&country=Ghana",
  "category": "cv-jobs",
  "confidence": 0.74,
  "missingInputs": [],
  "suggestedDisplayText": "Open CV Builder for this AfroTools workflow.",
  "privacyMode": "browser_local",
  "safetyDomain": "employment"
}
```

No-match response:

```json
{
  "status": "no_match",
  "selectedTool": {
    "id": "tool-search",
    "name": "Search AfroTools",
    "href": "/search/"
  },
  "selectedRoute": "/search/?source=api_ai_route",
  "category": "search",
  "confidence": 0,
  "missingInputs": [],
  "suggestedDisplayText": "Open AfroTools search and choose the closest workflow.",
  "privacyMode": "browser_local",
  "safetyDomain": "none"
}
```

Error response:

```json
{
  "status": "error",
  "error": {
    "code": "missing_query",
    "message": "query is required."
  }
}
```

Common error codes:

- `auth_failed`
- `rate_limited`
- `method_not_allowed`
- `invalid_json`
- `missing_query`
- `query_too_large`
- `invalid_partner_context`
- `partner_context_too_large`
- `sensitive_partner_context`

## Allowed Categories

Partner category aliases currently include:

- `career`
- `education`
- `business`
- `tax`
- `trade`
- `import`
- `energy`
- `documents`
- `pdf`
- `agriculture`
- `construction`
- `local-life`
- `relocation`
- `country-intelligence`
- `country`

The API expands aliases internally. If no allowed category matches the routed result, the endpoint returns a safe `no_match` search response.

## cURL Examples

Career:

```bash
curl -X POST https://afrotools.com/api/v1/ai/route \
  -H "x-api-key: afro_test_partner_demo" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Write me a CV for an electrical engineer in Ghana",
    "country": "Ghana",
    "allowedCategories": ["career", "business"],
    "partnerContext": { "surface": "jobs-board" }
  }'
```

Trade:

```bash
curl -X POST https://afrotools.com/api/v1/ai/route \
  -H "x-api-key: afro_test_partner_demo" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How much duty will I pay to import a 2016 Toyota Axio into Nigeria?",
    "country": "Nigeria",
    "allowedCategories": ["trade"]
  }'
```

Energy:

```bash
curl -X POST https://afrotools.com/api/v1/ai/route \
  -H "x-api-key: afro_test_partner_demo" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Should I install solar for my shop in Lagos?",
    "allowedCategories": ["energy"]
  }'
```

## Privacy Rules For Partners

Do not send:

- raw CV/resume text;
- PDFs or document contents;
- customer names, emails, phones, addresses, identity numbers, passport data, or account IDs;
- bank, card, salary, payroll, or invoice line data;
- credentials, tokens, API keys, cookies, or internal diagnostics.

Send only the short task, broad category, country hint, and non-sensitive partner context.

## Validation

```bash
node tests/api-ai-route.test.js
node tests/ai-intent-router.test.js
node tests/ai-guardrails.test.js
node tests/ai-route-intent-performance.test.js
```
