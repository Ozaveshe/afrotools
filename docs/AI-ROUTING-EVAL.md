# AfroTools AI Routing Evaluation

This suite measures whether Ask AfroTools AI routes common African user tasks into the right workflow and creates safe prefill handoffs where supported.

## Files

- Fixtures: `data/ai/routing-eval-fixtures.json`
- Runner: `scripts/evaluate-ai-routing.js`
- CI test wrapper: `tests/ai-routing-eval.test.js`

The fixture corpus must keep at least 100 prompts across:

- education, scholarships, and study abroad
- career, CV, and cover letter
- PAYE, payroll, VAT, and invoice
- import duty, car import, and trade
- solar, generator, and fuel
- cost of living, relocation, and rent
- PDF and document tools
- agriculture
- floor planner and construction
- country intelligence

## Commands

Deterministic mode, safe for CI and local development:

```bash
npm run eval:ai-routing
npm run test:ai-routing-eval
```

Optional live model mode:

```bash
npm run eval:ai-routing:live
```

Live mode is skipped when no provider key is configured. In CI it is skipped unless `AFROTOOLS_ALLOW_LIVE_AI_EVAL=1` is set. Deterministic mode never requires model provider keys.

## Adding Fixtures

Add an object to `data/ai/routing-eval-fixtures.json`:

```json
{
  "id": "trade-011",
  "category": "trade",
  "prompt": "Customs duty for phones into Nigeria worth $2000",
  "expected": {
    "selectedToolId": "import-duty",
    "category": "import-duty",
    "safetyDomain": "finance",
    "extractedInputs": {
      "country": "Nigeria",
      "destinationCountry": "Nigeria",
      "itemCategory": "electronics",
      "itemValue": 2000
    },
    "missingInputs": []
  }
}
```

Rules:

- `selectedToolId` must exist in the AI tool manifest.
- `category` is the router `intentCategory`, not necessarily the public page category.
- `extractedInputs` should include only fields that the router must extract for launch-readiness.
- `missingInputs` should match the router decision for required fields that still need clarification.
- Use synthetic amounts and generic roles. Do not add real CVs, invoices, personal data, or private documents.
- If a prompt should route but cannot prefill safely, leave sensitive content out of expected fields and let the destination tool ask for it.

Run `npm run eval:ai-routing` after adding fixtures. The report prints pass/fail counts by category plus prefill-check coverage.
