# AfroTools AI Structured Output Schemas

Status: implemented schema contracts and validation helpers. UI workflows can adopt these incrementally.

AfroTools AI workflows should render model-assisted output only after parsing and validating JSON against a named schema. The shared module is:

```js
const schemas = require("../assets/js/ai/workflow-schemas.js");
const result = schemas.parseStructuredOutput("WorkflowBrief", modelText);
```

In browser code the same API is exposed as `window.AfroToolsAIWorkflowSchemas`.

## Schema Names

- `IntentRouteResult`
- `ClarificationQuestion`
- `ToolPrefillPayload`
- `WorkflowBrief`
- `SourceAwareExplanation`
- `CVStarterDraft`
- `ScholarshipPlan`
- `ImportEstimateBrief`
- `EnergyDecisionBrief`
- `SMEFinanceBrief`
- `ConstructionPlanningBrief`
- `LocalLifeBudgetBrief`

## Provider Usage

The model-provider abstraction accepts `schemaName` on generation calls. When present, the provider returns validated `data` and an empty `text` field. Invalid JSON, missing required fields, or missing high-stakes safeguards return `ok:false` with `errorReason:"response_schema_validation_failed"`.

```js
const provider = createModelProvider({ method: "generateWorkflowBrief" });
const response = await provider.generateWorkflowBrief({
  system: "Return WorkflowBrief JSON only.",
  prompt: "Create a study-abroad plan from structured inputs.",
  schemaName: "WorkflowBrief",
  allowedSourceUrls: ["https://afrotools.com/data/source-registry"]
});
```

Do not render model text directly when `schemaName` is expected. Treat a schema failure as a fallback path: show deterministic guidance, ask clarification questions, or open the underlying tool.

## High-Stakes Rule

If a payload uses a high-stakes `safetyDomain`, validation requires:

- `disclaimer`, `highStakesNotice`, or `approvalWarning`
- At least one `sources` item with source metadata

High-stakes domains are `tax`, `immigration`, `legal`, `health`, `finance`, `employment`, `education`, `energy`, and `construction`.

Source items use the same source-confidence vocabulary:

```json
{
  "sourceName": "AfroTools reviewed dataset",
  "sourceUrl": "https://afrotools.com/data/source-registry",
  "sourceType": "reviewed_dataset",
  "countryCodes": ["NG"],
  "lastCheckedAt": "2026-06-01",
  "lastReviewedAt": "2026-06-01",
  "freshnessStatus": "acceptable",
  "confidence": "reviewed",
  "notes": "Reviewed planning source for this workflow."
}
```

When a workflow knows the allowed source URLs from the data layer, pass them as `allowedSourceUrls`. The validator rejects source URLs outside that allow-list to prevent model-fabricated citations.

## Example: Import Estimate

```json
{
  "schemaVersion": 1,
  "destinationCountry": "Nigeria",
  "originCountry": "Japan",
  "productCategory": "vehicle",
  "vehicle": { "make": "Toyota", "model": "Axio", "year": 2016 },
  "cif": { "amount": 9200, "currency": "USD" },
  "dutyTaxEstimate": { "amount": 3200, "currency": "USD" },
  "clearingPortEstimate": { "amount": 900, "currency": "USD" },
  "totalLandedCost": { "amount": 13300, "currency": "USD" },
  "assumptions": ["Uses planning duty bands and user-entered price."],
  "officialVerificationChecklist": ["Confirm HS classification", "Confirm customs value", "Confirm customs FX rate"],
  "sources": [
    {
      "sourceName": "AfroTools reviewed dataset",
      "sourceType": "reviewed_dataset",
      "countryCodes": ["NG"],
      "lastCheckedAt": "2026-06-01",
      "lastReviewedAt": "2026-06-01",
      "freshnessStatus": "acceptable",
      "confidence": "reviewed"
    }
  ],
  "disclaimer": "Planning estimate only. Final customs assessment may differ.",
  "safetyDomain": "finance"
}
```

## Adding A Schema

1. Add the schema definition in `assets/js/ai/workflow-schemas.js`.
2. Keep required fields limited to values the UI needs before rendering.
3. Add a valid and invalid fixture in `tests/ai-workflow-schemas.test.js`.
4. If the schema is high-stakes, require `sources` and a disclaimer-style warning.
5. Use `schemaName` in provider calls only after the calling endpoint has a deterministic fallback.
