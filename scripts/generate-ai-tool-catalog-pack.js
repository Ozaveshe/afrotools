#!/usr/bin/env node

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const manifestApi = require("../assets/js/ai/tool-manifest.js");

const ROOT = path.resolve(__dirname, "..");
const DEFAULT_OUTPUT = path.join(ROOT, "data", "ai", "tool-catalog-pack.json");
const MAX_CHUNK_CHARS = 28000;
const MIN_EXPECTED_TOOLS = 1000;
const SECRET_VALUE = /(?:\bpassword\s*[:=]|\bsecret\s*[:=]|\bapi[_ -]?key\s*[:=]|\btoken\s*[:=]|\bbearer\s+[A-Za-z0-9._-]{8,})/i;
const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE = /\+?\d[\d\s().-]{7,}\d/;

function array(value) {
  return Array.isArray(value) ? value : [];
}

function text(value, fallback = "") {
  if (value === undefined || value === null) return fallback;
  const clean = String(value).replace(/\s+/g, " ").trim();
  return clean || fallback;
}

function unique(values) {
  return Array.from(new Set(array(values).map((value) => text(value)).filter(Boolean)));
}

function slug(value) {
  return text(value, "unknown")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "unknown";
}

function safeInput(input) {
  return {
    name: text(input && input.name),
    label: text(input && input.label || input && input.name),
    type: text(input && input.type, "text"),
  };
}

function compactHints(tool) {
  return unique([]
    .concat(array(tool.userIntents))
    .concat(array(tool.exampleQueries))
    .concat(array(tool.aliases)))
    .slice(0, 10);
}

function compactTool(tool) {
  const toolCall = manifestApi.buildToolInvocation(tool);
  return {
    id: tool.id,
    title: tool.title,
    route: tool.route,
    category: tool.category,
    subcategory: tool.subcategory,
    countriesSupported: array(tool.countriesSupported).slice(0, 16),
    languagesSupported: array(tool.languagesSupported).slice(0, 8),
    hints: compactHints(tool),
    requiredInputs: array(tool.requiredInputs).map(safeInput),
    optionalInputs: array(tool.optionalInputs).map(safeInput).slice(0, 8),
    privacyMode: text(tool.privacyMode, "browser_local"),
    sourcePolicy: text(tool.sourcePolicy, "reviewed"),
    safetyDomain: text(tool.highStakesDomain, "none"),
    outputTypes: unique(tool.outputTypes).slice(0, 8),
    toolCall: {
      type: toolCall.type,
      action: toolCall.action,
      toolId: toolCall.toolId,
      route: toolCall.route,
      category: toolCall.category,
      subcategory: toolCall.subcategory,
      invocationMode: toolCall.invocationMode,
      canPrefill: toolCall.canPrefill,
      privacyMode: toolCall.privacyMode,
      sourcePolicy: toolCall.sourcePolicy,
      safetyDomain: toolCall.safetyDomain,
    },
  };
}

function charCount(value) {
  return JSON.stringify(value).length;
}

function makeChunk(category, part, tools) {
  const chunk = {
    id: "tool-catalog:" + slug(category) + ":" + String(part).padStart(2, "0"),
    category,
    part,
    toolCount: tools.length,
    toolIds: tools.map((tool) => tool.id),
    tools,
  };
  chunk.charCount = charCount(chunk);
  return chunk;
}

function buildChunks(tools, maxChunkChars = MAX_CHUNK_CHARS) {
  const chunks = [];
  const grouped = new Map();
  tools.forEach((tool) => {
    const category = text(tool.category, "uncategorized");
    if (!grouped.has(category)) grouped.set(category, []);
    grouped.get(category).push(tool);
  });
  Array.from(grouped.keys()).sort().forEach((category) => {
    let part = 1;
    let current = [];
    grouped.get(category)
      .sort((left, right) => left.id.localeCompare(right.id))
      .forEach((tool) => {
        const next = current.concat([tool]);
        const candidate = makeChunk(category, part, next);
        if (current.length && candidate.charCount > maxChunkChars) {
          chunks.push(makeChunk(category, part, current));
          part += 1;
          current = [tool];
        } else {
          current = next;
        }
      });
    if (current.length) chunks.push(makeChunk(category, part, current));
  });
  return chunks;
}

function hashTools(tools) {
  const fingerprint = tools.map((tool) => [tool.id, tool.route, tool.category, tool.title].join("|")).join("\n");
  return crypto.createHash("sha256").update(fingerprint).digest("hex");
}

function hasSensitiveText(value) {
  const serialized = typeof value === "string" ? value : JSON.stringify(value);
  return SECRET_VALUE.test(serialized || "") || EMAIL.test(serialized || "") || PHONE.test(serialized || "");
}

function summarizeByCategory(tools) {
  const counts = {};
  tools.forEach((tool) => {
    const category = text(tool.category, "uncategorized");
    counts[category] = (counts[category] || 0) + 1;
  });
  return Object.entries(counts)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([category, count]) => ({ category, count }));
}

function buildPack(options = {}) {
  const manifest = manifestApi.getToolManifestForRouter();
  const tools = manifest.map(compactTool).sort((left, right) => {
    return left.category.localeCompare(right.category) || left.id.localeCompare(right.id);
  });
  const chunks = buildChunks(tools, options.maxChunkChars || MAX_CHUNK_CHARS);
  const coveredIds = new Set(chunks.flatMap((chunk) => chunk.toolIds));
  const duplicateIds = tools.map((tool) => tool.id).filter((id, index, ids) => ids.indexOf(id) !== index);
  const rawTextDetected = hasSensitiveText(tools);
  const gate = {
    passed: tools.length >= MIN_EXPECTED_TOOLS && coveredIds.size === tools.length && duplicateIds.length === 0 && !rawTextDetected && chunks.every((chunk) => chunk.charCount <= (options.maxChunkChars || MAX_CHUNK_CHARS)),
    minExpectedTools: MIN_EXPECTED_TOOLS,
    toolCoverageComplete: coveredIds.size === tools.length,
    duplicateIds,
    rawTextDetected,
  };
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    task: "afrotools_full_tool_catalog_pack",
    scope: "model_context_for_existing_tool_calls",
    manifestHash: hashTools(tools),
    toolCount: tools.length,
    categoryCount: new Set(tools.map((tool) => tool.category)).size,
    chunkCount: chunks.length,
    maxChunkChars: options.maxChunkChars || MAX_CHUNK_CHARS,
    gate,
    toolCallSchema: {
      type: "existing_tool_call",
      requiredFields: ["type", "action", "toolId", "route", "invocationMode", "privacyMode", "sourcePolicy"],
      allowedActions: ["open_existing_tool", "prefill_existing_tool"],
      routeRule: "route must be a root-relative existing AfroTools route",
      privacyRule: "do not include raw user prompts, private documents, emails, phone numbers, secrets, or sensitive financial/career text in tool-call arguments",
    },
    retrievalPolicy: {
      recommendedFlow: [
        "rank the full catalog with assets/js/ai/tool-manifest.js rankToolCandidates",
        "send only the top candidate chunk or shortlisted tool calls to the provider",
        "validate provider-selected tool ids against this catalog before launch",
        "execute through assets/js/ai/tool-invocation-runtime.js",
      ],
      fallback: "use deterministic routing and /search/ when no candidate passes score thresholds",
    },
    byCategory: summarizeByCategory(tools),
    chunks,
    privacy: {
      source: "public_router_safe_manifest",
      containsRealUserData: false,
      storesRawPrivateContent: false,
      rawPromptIncluded: false,
      rawTextDetected,
    },
  };
}

function writePack(filePath, pack) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(pack, null, 2) + "\n");
}

function main() {
  const args = process.argv.slice(2);
  const write = args.includes("--write");
  const json = args.includes("--json");
  const outputIndex = args.indexOf("--output");
  const output = outputIndex >= 0 && args[outputIndex + 1] ? path.resolve(args[outputIndex + 1]) : DEFAULT_OUTPUT;
  const pack = buildPack();
  if (write) writePack(output, pack);
  if (json) {
    console.log(JSON.stringify(pack, null, 2));
  } else {
    console.log("AfroTools AI full tool catalog pack: " + (pack.gate.passed ? "passed" : "failed"));
    console.log("Tools/chunks/categories: " + pack.toolCount + "/" + pack.chunkCount + "/" + pack.categoryCount);
    console.log("Output: " + output);
  }
  if (!pack.gate.passed) process.exitCode = 1;
}

if (require.main === module) {
  main();
}

module.exports = {
  buildPack,
  buildChunks,
  compactTool,
  hasSensitiveText,
  MAX_CHUNK_CHARS,
};
