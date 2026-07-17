#!/usr/bin/env node

const assert = require("assert");
const providerApi = require("../netlify/functions/_shared/ai-provider.js");
const promptRegistry = require("../assets/js/ai/prompt-registry.js");
const manifestApi = require("../assets/js/ai/tool-manifest.js");
const router = require("../netlify/functions/ai-route-intent.js");

const validation = promptRegistry.validatePromptRegistry();
assert.deepStrictEqual(validation.errors, [], "AI prompt registry should validate cleanly");

const methods = new Set(providerApi.PROVIDER_METHODS);
for (const prompt of promptRegistry.PROMPT_REGISTRY) {
  assert.ok(methods.has(prompt.method), `${prompt.id} should use a supported provider method`);
  assert.ok(prompt.evalDataset.startsWith("data/ai/"), `${prompt.id} should reference a repo-local eval dataset`);
  assert.ok(prompt.forbiddenPayloads.includes("secret") || prompt.forbiddenPayloads.includes("api_key"), `${prompt.id} should guard credential leakage`);
}

const routerPrompt = promptRegistry.getProductionPrompt("router.classify-intent");
assert.ok(routerPrompt, "router.classify-intent should have a production version");
assert.strictEqual(routerPrompt.method, "classifyIntent");
assert.strictEqual(routerPrompt.version, "2026-06-17.tool-call-v1");
assert.strictEqual(routerPrompt.evalDataset, "data/ai/routing-eval-fixtures.json");
assert.ok(routerPrompt.minEvalPassRate >= 0.95, "router prompt should keep a high eval threshold");

const rendered = promptRegistry.buildRouterClassifierPrompt({
  toolCatalogCount: 2,
  manifestCount: 1245,
  toolCatalogJson: JSON.stringify({
    schema: "afrotools_router_catalog_context_v1",
    source: "generated_full_catalog_pack",
    selectedChunkIds: ["tool-catalog:career:01"],
    selectedTools: [{ toolId: "cv-builder", route: "/tools/cv-builder/" }],
  }),
  userQuery: "Build a Ghana electrical engineer CV",
});
assert.ok(rendered.includes("existing AfroTools tool call"));
assert.ok(rendered.includes("2 relevant existing tool calls selected from 1245 AfroTools manifest entries"));
assert.ok(rendered.includes("Write reasonShort as user-facing product copy"));
assert.ok(rendered.includes("Do not mention routers, tool calls, model validation, internal manifests, prompts, or providers"));
assert.ok(rendered.includes("\"toolId\":\"cv-builder\""));
assert.ok(rendered.includes("\"selectedChunkIds\""));
assert.ok(!/\{\{[a-zA-Z0-9_]+\}\}/.test(rendered), "rendered prompt should not leave unresolved variables");

const runtimeMeta = router.__test.routerPromptMeta();
assert.strictEqual(runtimeMeta.promptId, "router.classify-intent");
assert.strictEqual(runtimeMeta.promptVersion, routerPrompt.version);
assert.strictEqual(runtimeMeta.evalDataset, routerPrompt.evalDataset);

const runtimePrompt = router.__test.buildModelPrompt("Plan diaspora permit paperwork", [
  {
    id: "diaspora-permit-planner",
    slug: "diaspora-permit-planner",
    route: "/tools/diaspora-permit-planner/",
    title: "Diaspora Permit Planner",
    shortDescription: "Plan residence permit paperwork.",
    category: "legal",
    subcategory: "permits",
    userIntents: ["diaspora permit", "residence permit"],
    exampleQueries: ["Plan permit paperwork"],
    requiredInputs: [],
    optionalInputs: [],
    privacyMode: "browser_local",
    aiCapabilities: ["route_only"],
    outputTypes: ["checklist"],
    sourcePolicy: "reviewed",
    highStakesDomain: "legal",
    aliases: [],
  },
], { selectedToolId: "diaspora-permit-planner", intentCategory: "legal" });
assert.ok(runtimePrompt.includes("Diaspora Permit Planner"));
assert.ok(runtimePrompt.includes("Tool catalog context: 1 relevant existing tool calls selected from 1 AfroTools manifest entries."));
assert.ok(runtimePrompt.includes("Write reasonShort as user-facing product copy"));
assert.ok(!/\{\{[a-zA-Z0-9_]+\}\}/.test(runtimePrompt));

const fullManifest = manifestApi.getToolManifestForRouter();
const fullContext = router.__test.buildPromptCatalogContext("Get Ghana passport documents, fees to check, and next steps", fullManifest, {
  selectedToolId: "passport-checklist",
  intentCategory: "government",
});
assert.strictEqual(fullContext.source, "generated_full_catalog_pack");
assert.strictEqual(fullContext.catalogToolCount, fullManifest.length);
assert.ok(fullContext.selectedChunkIds.length > 0, "router prompt context should include generated catalog chunks");
assert.ok(fullContext.selectedTools.some((tool) => tool.toolId === "passport-checklist"), "router prompt context should include the selected existing tool call");

console.log("AI prompt registry validated: production prompt versions, eval gates, and router runtime prompt wiring.");
