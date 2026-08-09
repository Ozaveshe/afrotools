"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "..");
const context = { console, Date, Math, JSON }; context.window = context;
vm.runInNewContext(fs.readFileSync(path.join(root, "engines/src/creator-scripts-engine.js"), "utf8"), context);
const engine = context.AfroTools.CreatorScriptsEngine;
const input = { topic: "Sustainable creative work", keyPoints: "Clear offer\nTrack costs\nConfirm scope", format: "youtube" };
const english = engine.generateLocalScript(input, "en");
assert.equal(english.language, "en");
assert.deepEqual(JSON.parse(JSON.stringify(english.sections)), [
  { type: "hook", label: "HOOK", timestamp: "0:00–0:15", text: "Here is what you need to understand about Sustainable creative work." },
  { type: "context", label: "CONTEXT", timestamp: "0:15–0:40", text: "Start with the context, assumptions, and limits." },
  { type: "main", label: "KEY POINTS", timestamp: "0:40–2:30", text: "1. Clear offer\n2. Track costs\n3. Confirm scope" },
  { type: "cta", label: "CLOSE", timestamp: "2:30–2:45", text: "Verify the facts, add your sources, and adapt this draft for your audience." }
]);
assert.equal(engine.exportPlainText(english), `Sustainable creative work\nFormat: youtube | Duration: ${english.estimatedDuration}\n\n---\n\n[HOOK] (0:00–0:15)\n\nHere is what you need to understand about Sustainable creative work.\n\n[CONTEXT] (0:15–0:40)\n\nStart with the context, assumptions, and limits.\n\n[KEY POINTS] (0:40–2:30)\n\n1. Clear offer\n2. Track costs\n3. Confirm scope\n\n[CLOSE] (2:30–2:45)\n\nVerify the facts, add your sources, and adapt this draft for your audience.\n`);
const swahili = engine.generateLocalScript({ topic: "Biashara ya ubunifu", keyPoints: "Huduma wazi\nFuatilia gharama", format: "short" }, "sw");
assert.equal(swahili.language, "sw"); assert.equal(swahili.sections[0].label, "KIVUTIO"); assert.equal(swahili.sections[3].label, "HITIMISHO");
assert.match(swahili.fullScript, /Hakiki ukweli, ongeza vyanzo/);
assert.match(engine.exportPlainText(swahili, "sw"), /Muundo: short \| Muda:/);
assert.throws(() => engine.generateLocalScript({ topic: "", keyPoints: "Hoja" }, "sw"), /topic/);
assert.throws(() => engine.generateLocalScript({ topic: "Mada", keyPoints: "" }, "sw"), /key point/);
const html = fs.readFileSync(path.join(root, "sw/zana/script-za-video/index.html"), "utf8");
assert.match(html, /data-sw-creator-workspace/); assert.match(html, /data-creator-scripts-native data-lang="sw"/); assert.match(html, /creator-scripts\.webp/);
console.log("Swahili creator-scripts final: 13 assertions passed");
