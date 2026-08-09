"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const context = { console, Date, Math, JSON };
context.window = context;
vm.runInNewContext(fs.readFileSync(path.join(root, "engines/src/creator-repurpose-engine.js"), "utf8"), context);
const engine = context.AfroTools.RepurposeEngine;
const source = "A practical creative business needs a clear offer, consistent delivery, and honest communication with clients.";

const english = engine.generateLocalOutputs(source, "blog_post", ["twitter", "newsletter", "blog"], "en");
assert.equal(english.language, "en");
assert.deepEqual(JSON.parse(JSON.stringify(english.outputs)), [
  { platform: "twitter", platformLabel: "X / Twitter", format: "Thread", text: `1/2 ${source}\n\n2/2 What would you add?`, charCount: 139 },
  { platform: "newsletter", platformLabel: "Newsletter", format: "Snippet", text: `Subject: ${source}\n\nMain idea: ${source}\n\nTakeaway: adapt this draft for your audience.`, charCount: 289 },
  { platform: "blog", platformLabel: "Blog Summary", format: "Summary", text: `Summary: ${source}\n\nKey point: verify facts and add sources before publishing.`, charCount: 179 }
]);

const swahili = engine.generateLocalOutputs(source, "blog_post", ["twitter", "newsletter", "blog"], "sw");
assert.equal(swahili.language, "sw");
assert.equal(swahili.outputs.length, 3);
assert.equal(swahili.outputs[1].platformLabel, "Jarida la barua pepe");
assert.equal(swahili.outputs[1].format, "Dondoo");
assert.match(swahili.outputs[0].text, /Wewe ungeongeza jambo gani/);
assert.match(swahili.outputs[2].text, /hakiki ukweli na uongeze vyanzo/);
assert.throws(() => engine.generateLocalOutputs("fupi", "blog_post", ["instagram"], "sw"), /20 characters/);
assert.throws(() => engine.generateLocalOutputs(source, "blog_post", [], "sw"), /platform/);

const html = fs.readFileSync(path.join(root, "sw/zana/kubadilisha-maudhui-kwa-majukwaa/index.html"), "utf8");
assert.match(html, /id="copyPlan"/);
assert.match(html, /data-creator-repurpose-native data-lang="sw"/);
assert.match(html, /creator-repurpose\.webp/);
assert.doesNotMatch(html, /data-creator-repurpose-native[^]*action=/);

console.log("Swahili creator-repurpose final: 15 assertions passed");
