#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const ARCHITECTURE_PATH = path.join(ROOT, "data", "ai", "product-architecture.json");
const READINESS_PATH = path.join(ROOT, "data", "ai", "ai-system-readiness-report.json");
const CATALOG_PACK_PATH = path.join(ROOT, "data", "ai", "tool-catalog-pack.json");
const DEFAULT_OUTPUT = path.join(ROOT, "data", "ai", "ai-product-architecture-report.json");
const HEAVY_UI_FRAMEWORKS = ["react", "next", "vue", "svelte", "angular", "@angular/core", "@vitejs/plugin-react"];

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (err) {
    return fallback;
  }
}

function exists(relativePath) {
  return fs.existsSync(path.join(ROOT, relativePath));
}

function check(label, passed, detail) {
  return { label, passed: Boolean(passed), detail: detail || "" };
}

function packageDependencies() {
  const pkg = readJson(path.join(ROOT, "package.json"), {});
  return Object.assign({}, pkg.dependencies || {}, pkg.devDependencies || {});
}

function missingLayerFiles(architecture) {
  return (architecture.layers || []).flatMap((layer) => {
    return (layer.files || []).filter((filePath) => !exists(filePath)).map((filePath) => ({
      layer: layer.id,
      file: filePath,
    }));
  });
}

function layerHasFile(architecture, layerId, relativePath) {
  return (architecture.layers || []).some((layer) => {
    return layer.id === layerId && (layer.files || []).includes(relativePath);
  });
}

function fileContains(relativePath, pattern) {
  try {
    return pattern.test(fs.readFileSync(path.join(ROOT, relativePath), "utf8"));
  } catch (err) {
    return false;
  }
}

function buildReport() {
  const architecture = readJson(ARCHITECTURE_PATH, {});
  const readiness = readJson(READINESS_PATH, {});
  const catalogPack = readJson(CATALOG_PACK_PATH, {});
  const deps = packageDependencies();
  const dependencyNames = Object.keys(deps);
  const installedHeavyFrameworks = HEAVY_UI_FRAMEWORKS.filter((name) => dependencyNames.includes(name));
  const missingFiles = missingLayerFiles(architecture);
  const checks = [
    check("architecture_contract_present", architecture.schemaVersion === 1 && Array.isArray(architecture.layers), ARCHITECTURE_PATH),
    check("static_first_framework_decision", architecture.frameworkDecision && architecture.frameworkDecision.decision && installedHeavyFrameworks.length === 0, installedHeavyFrameworks.join(", ") || "no heavy UI framework dependencies"),
    check("layer_files_exist", missingFiles.length === 0, missingFiles.map((item) => item.layer + ":" + item.file).join(", ")),
    check("orchestrator_contract_present", layerHasFile(architecture, "routing", "assets/js/ai/orchestrator.js") && exists("assets/js/ai/orchestrator.js") && /AI orchestrator/.test(architecture.mermaid || ""), "assets/js/ai/orchestrator.js"),
    check("homepage_ai_bridge_present", layerHasFile(architecture, "interfaces", "index.html") && fileContains("index.html", /loadAIHeroRouter/) && fileContains("index.html", /AI match/), "index.html"),
    check("ask_ai_bridge_present", layerHasFile(architecture, "interfaces", "ask/index.html") && fileContains("ask/index.html", /AfroToolsAIOrchestrator/) && fileContains("ask/index.html", /orchestrated tool match/) && !fileContains("ask/index.html", /<iframe/i), "ask/index.html"),
    check("ask_refinement_chips_present", fileContains("ask/index.html", /data-detail-chip/) && fileContains("ask/index.html", /Add the detail in the prompt/) && fileContains("tests/e2e/ask-command-page.spec.js", /Add detail: Study Level/), "ask/index.html"),
    check("ask_feedback_telemetry_present", fileContains("ask/index.html", /data-ask-feedback/) && fileContains("ask/index.html", /ai_router_feedback_submitted/) && fileContains("tests/e2e/ask-command-page.spec.js", /routerFeedbackSubmitted/), "ask/index.html"),
    check("ask_funnel_telemetry_present", fileContains("ask/index.html", /ai_prompt_submitted/) && fileContains("ask/index.html", /ai_intent_detected/) && fileContains("ask/index.html", /ai_intent_fallback/) && fileContains("ask/index.html", /ai_tool_opened/) && fileContains("ask/index.html", /surface:\s*"ask_page"/) && fileContains("tests/e2e/ask-command-page.spec.js", /topSurfaces/) && fileContains("tests/e2e/ask-command-page.spec.js", /totals\.toolOpen/), "ask/index.html"),
    check("ask_source_freshness_notice_present", fileContains("ask/index.html", /sourceNoteFor/) && fileContains("ask/index.html", /Planning estimate/) && fileContains("ask/index.html", /freshness labels/) && fileContains("tests/e2e/ask-command-page.spec.js", /source and freshness guidance/), "ask/index.html"),
    check("analytics_surface_dimension_present", fileContains("assets/js/ai/intent-analytics.js", /normalizeSurface/) && fileContains("assets/js/ai/intent-analytics.js", /surfaceBreakdown/) && fileContains("admin/ai-traction.html", /surfaceList/) && fileContains("ai/intent-report.html", /topSurfaces/), "assets/js/ai/intent-analytics.js"),
    check("multi_surface_funnel_telemetry_present", fileContains("index.html", /surface:\s*'homepage'/) && fileContains("search/index.html", /surface:\s*'search_page'/) && fileContains("widgets/ai/mini-router.js", /surface:\s*"ai_widget"/) && fileContains("tests/e2e/ai-home-command-hero.spec.js", /surfaceBreakdown/) && fileContains("tests/e2e/tool-discovery.spec.js", /surfaceBreakdown/) && fileContains("tests/e2e/ai-mini-router-widget.spec.js", /surfaceBreakdown/), "index.html | search/index.html | widgets/ai/mini-router.js"),
    check("ai_fallback_links_avoid_raw_prompt_urls", fileContains("ask/index.html", /savePrivateSearchHandoff/) && fileContains("ask/index.html", /source=ask_private/) && fileContains("ai/index.html", /savePrivateSearchHandoff/) && fileContains("ai/index.html", /source=ai_private/) && fileContains("search/index.html", /readPrivateSearchHandoff/) && fileContains("tests/e2e/ask-command-page.spec.js", /ask private search handoff keeps prompt out of the URL/) && fileContains("tests/e2e/ai-command-page.spec.js", /source=ai_private/), "ask/index.html | ai/index.html | search/index.html"),
    check("search_ai_bridge_present", layerHasFile(architecture, "interfaces", "search/index.html") && fileContains("search/index.html", /AfroToolsAIOrchestrator/) && fileContains("search/index.html", /AI match/), "search/index.html"),
    check("widget_iframe_handoff_contract", layerHasFile(architecture, "interfaces", "widgets/ai/mini-router.js") && fileContains("widgets/ai/mini-router.js", /target="_blank" rel="noopener"/) && fileContains("tests/e2e/ai-mini-router-widget.spec.js", /toHaveAttribute\("target", "_blank"\)/), "widgets/ai/mini-router.js"),
    check("existing_tool_catalog_large_enough", catalogPack.toolCount >= 1000 && catalogPack.gate && catalogPack.gate.passed === true, String(catalogPack.toolCount || 0) + " tools"),
    check("model_readiness_gate_passing", readiness.gate && readiness.gate.passed === true, String((readiness.checks || []).length) + " readiness checks"),
    check("tool_catalog_pack_in_readiness", readiness.toolCatalogPack && readiness.toolCatalogPack.toolCount === catalogPack.toolCount, String(readiness.toolCatalogPack && readiness.toolCatalogPack.toolCount || 0) + "/" + String(catalogPack.toolCount || 0)),
    check("training_and_eval_gates_declared", (architecture.gates || []).includes("npm run ai:model-splits") && (architecture.gates || []).includes("npm run eval:ai-tool-calls"), (architecture.gates || []).join(" | ")),
    check("privacy_first_principle_declared", (architecture.principles || []).some((item) => /Sensitive workflow content stays browser-local/i.test(item)), "browser-local sensitive content principle"),
  ];
  const failed = checks.filter((item) => !item.passed);
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    task: "afrotools_ai_product_architecture",
    scope: "repo_artifacts_not_live_production",
    gate: {
      passed: failed.length === 0,
      failedCount: failed.length,
      failedChecks: failed.map((item) => item.label),
    },
    checks,
    architecture: {
      name: architecture.name || "",
      architectureStyle: architecture.architectureStyle || "",
      frameworkDecision: architecture.frameworkDecision || {},
      layerCount: (architecture.layers || []).length,
      layers: (architecture.layers || []).map((layer) => ({
        id: layer.id,
        label: layer.label,
        fileCount: (layer.files || []).length,
      })),
      gates: architecture.gates || [],
      mermaid: architecture.mermaid || "",
    },
    dependencyPolicy: {
      heavyUiFrameworksBlockedByDefault: HEAVY_UI_FRAMEWORKS,
      installedHeavyUiFrameworks: installedHeavyFrameworks,
      packageDependencyCount: dependencyNames.length,
    },
    catalog: {
      toolCount: catalogPack.toolCount || 0,
      chunkCount: catalogPack.chunkCount || 0,
      categoryCount: catalogPack.categoryCount || 0,
      gate: catalogPack.gate || {},
    },
    readiness: {
      gate: readiness.gate || {},
      checks: (readiness.checks || []).map((item) => ({ label: item.label, passed: item.passed })),
    },
  };
}

function writeReport(filePath, report) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(report, null, 2) + "\n");
}

function main() {
  const args = process.argv.slice(2);
  const write = args.includes("--write");
  const json = args.includes("--json");
  const outputIndex = args.indexOf("--output");
  const output = outputIndex >= 0 && args[outputIndex + 1] ? path.resolve(args[outputIndex + 1]) : DEFAULT_OUTPUT;
  const report = buildReport();
  if (write) writeReport(output, report);
  if (json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log("AfroTools AI product architecture: " + (report.gate.passed ? "passed" : "failed"));
    console.log("Layers/catalog/chunks: " + report.architecture.layerCount + "/" + report.catalog.toolCount + "/" + report.catalog.chunkCount);
    console.log("Output: " + output);
  }
  if (!report.gate.passed) process.exitCode = 1;
}

if (require.main === module) {
  main();
}

module.exports = {
  buildReport,
  layerHasFile,
  missingLayerFiles,
};
