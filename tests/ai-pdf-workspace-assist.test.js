#!/usr/bin/env node

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const router = require("../assets/js/ai/intent-router.js");
const manifestApi = require("../assets/js/ai/tool-manifest.js");

const repoRoot = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(repoRoot, "tools", "pdf-workspace", "index.html"), "utf8");
const manifest = manifestApi.getToolManifestForRouter();

assert.ok(html.includes("data-pdf-ai-assist"), "PDF Workspace exposes the safe AI assistance panel.");
assert.ok(html.includes("No PDF file contents are sent to AI."), "PDF AI panel states that file contents are not sent.");
assert.ok(html.includes("Document-content AI is disabled for now."), "PDF AI panel disables future document-content AI.");
assert.ok(html.includes("Nothing here sends file bytes, OCR text, passwords, or document contents."), "PDF AI panel names sensitive document data that must stay local.");
assert.ok(html.includes('id="pdfAiContentAssist" type="button" disabled'), "Document-content AI control remains disabled.");
assert.ok(html.includes("afrotools.aiPrefillDraft"), "PDF Workspace can read the safe Ask AfroTools action prefill payload.");
assert.ok(html.includes('aria-label="Specialist PDF tools"'), "PDF Workspace exposes specialist handoffs for tasks outside the editing desk.");
assert.ok(html.includes('href:"/tools/pdf-ocr/"'), "The deterministic helper routes OCR work to the focused OCR tool.");
assert.ok(html.includes('href:"/tools/pdf-compare/"'), "The deterministic helper routes comparison work to the focused compare tool.");
assert.strictEqual((html.match(/\/assets\/js\/bundles\/core\.[^"']+\.min\.js/g) || []).length, 1, "PDF Workspace loads the shared core bundle once.");
assert.ok(!/fetch\(\s*['"][^'"]*ai/i.test(html), "PDF Workspace must not call an AI endpoint for document assistance.");

const pdfQueries = [
  ["compress my PDF", "compress"],
  ["merge two PDFs", "merge"],
  ["add page numbers", "page_numbers"],
  ["protect a PDF", "protect"],
];

for (const [query, expectedAction] of pdfQueries) {
  const decision = router.routeDeterministically(query, { manifest });
  assert.strictEqual(decision.selectedToolId, "pdf-workspace", query);
  assert.strictEqual(decision.extractedInputs.pdfAction, expectedAction, query);
  assert.strictEqual(decision.safetyDomain, "none", query);
}

console.log("PDF Workspace AI assistance privacy and routing contract validated.");
