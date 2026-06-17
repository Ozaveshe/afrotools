#!/usr/bin/env node

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const widget = require("../widgets/ai/mini-router.js");

const root = path.join(__dirname, "..");

const education = widget.routePrompt("I want scholarships to study in Canada from Nigeria", {
  defaultCountry: "Nigeria",
  allowedCategories: "education,career,business",
});
assert.strictEqual(education.category, "education");
assert.strictEqual(education.primaryToolId, "scholarship-finder");
assert.strictEqual(education.primaryToolRoute, "/tools/scholarship-finder/");
assert.strictEqual(education.toolCall.type, "existing_tool_call");
assert.strictEqual(education.toolCall.action, "open_existing_tool");
assert.strictEqual(education.toolCall.route, "/tools/scholarship-finder/");
assert.ok(education.href.includes("source=ai_widget"));
assert.ok(education.href.includes("country=Nigeria"));
assert.ok(!education.href.includes("scholarships%20to%20study"), "raw prompt should not be placed in URL");
assert.ok(education.directToolHref.includes("/tools/scholarship-finder/"));
assert.ok(!education.directToolHref.includes("scholarships%20to%20study"), "direct tool URL should not contain raw prompt");

const career = widget.routePrompt("Write a CV for an electrical engineer in Ghana", {
  defaultCategory: "business",
  allowedCategories: ["business", "career"],
  partnerId: "jobs<script>",
});
assert.strictEqual(career.category, "career");
assert.ok(career.href.includes("partner=jobsscript"));

const limited = widget.routePrompt("How much duty to import a Toyota Axio into Nigeria", {
  defaultCategory: "business",
  allowedCategories: "business,education",
});
assert.strictEqual(limited.category, "business", "allowedCategories should prevent routing outside partner scope");

const config = widget.sanitizeConfig({
  defaultCountry: "Ghana <script>",
  defaultCategory: "trade",
  theme: "neon",
  allowedCategories: "trade,unknown",
  sponsorLabel: "Sponsored <b>by</b>\nPartner",
});
assert.deepStrictEqual(config.allowedCategories, ["trade"]);
assert.strictEqual(config.defaultCountry, "Ghana script");
assert.strictEqual(config.theme, "light");
assert.strictEqual(config.sponsorLabel, "Sponsored bby/bPartner");

const registry = require("../widgets/WIDGET-REGISTRY.js");
const entry = registry.find((item) => item.id === "ask-ai-router");
assert.ok(entry, "ask-ai-router should be registered");
assert.strictEqual(entry.scriptPath, "ai/mini-router");
assert.strictEqual(entry.iframePath, "/widgets/iframe/ai-mini-router.html");

const iframe = fs.readFileSync(path.join(root, "widgets", "iframe", "ai-mini-router.html"), "utf8");
assert.ok(iframe.includes("/widgets/ai/mini-router.js"));
assert.ok(iframe.includes("/assets/js/ai/orchestrator.js"));
assert.ok(iframe.includes("/assets/js/ai/tool-manifest.js"));
assert.ok(iframe.includes("/assets/js/ai/intent-analytics.js"));
assert.ok(iframe.includes("noindex, follow"));
assert.ok(iframe.includes("aw-ai-link--secondary"));
assert.ok(iframe.includes('target="_blank" rel="noopener"'), "iframe chrome links should escape partner embeds safely");

const miniRouter = fs.readFileSync(path.join(root, "widgets", "ai", "mini-router.js"), "utf8");
assert.ok(miniRouter.includes("function externalLink"), "widget links should use a single external-link helper");
assert.ok(miniRouter.includes("recordWidgetIntent"), "widget should record metadata-only AI funnel analytics when available");
assert.ok(miniRouter.includes('target="_blank" rel="noopener"'), "widget handoff links should escape iframes safely");

const embed = fs.readFileSync(path.join(root, "widgets", "embed.js"), "utf8");
assert.ok(embed.includes("data-afrotools-"));
assert.ok(embed.includes("replace(/^data-afrotools-/"));
assert.ok(!embed.includes("ai-route-intent"), "embed loader should not expose AI router endpoint directly");

console.log("Ask AfroTools AI mini-router widget validated.");
