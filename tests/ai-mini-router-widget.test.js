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
assert.ok(education.href.includes("source=ai_widget"));
assert.ok(education.href.includes("country=Nigeria"));
assert.ok(!education.href.includes("scholarships%20to%20study"), "raw prompt should not be placed in URL");

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
assert.ok(iframe.includes("noindex, follow"));

const embed = fs.readFileSync(path.join(root, "widgets", "embed.js"), "utf8");
assert.ok(embed.includes("data-afrotools-"));
assert.ok(embed.includes("replace(/^data-afrotools-/"));
assert.ok(!embed.includes("ai-route-intent"), "embed loader should not expose AI router endpoint directly");

console.log("Ask AfroTools AI mini-router widget validated.");
