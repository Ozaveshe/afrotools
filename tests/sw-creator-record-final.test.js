"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const childProcess = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");
const swFile = "sw/zana/kirekodi-skrini/index.html";
const englishApp = read("tools/creator-record/app.html");
const sw = read(swFile);
const controller = read("assets/js/pages/creative/creator-record-app-controller.js");
const familyOwner = read("scripts/build-sw-creative-parity.js");

assert.match(sw, /<html\b[^>]*\blang="sw"/i);
assert.match(sw, /name="afrotools-sw-native-owner" content="creator-record"/);
assert.match(sw, /name="afrotools-sw-source-owner" content="scripts\/build-sw-creator-record-final\.js"/);
assert.match(sw, /rel="canonical" href="https:\/\/afrotools\.com\/sw\/zana\/kirekodi-skrini\/"/);
assert.match(sw, /hreflang="en" href="https:\/\/afrotools\.com\/tools\/creator-record\/"/);
assert.match(sw, /hreflang="fr" href="https:\/\/afrotools\.com\/fr\/tools\/enregistrement-pour-createur\/"/);
assert.match(sw, /hreflang="sw" href="https:\/\/afrotools\.com\/sw\/zana\/kirekodi-skrini\/"/);
assert.match(sw, /assets\/img\/tools\/creator-record\.webp/);
assert.ok(fs.existsSync(path.join(ROOT, "assets/img/tools/creator-record.webp")));
assert.doesNotMatch(sw, /<iframe\b/i);
assert.doesNotMatch(sw, /analytics-bootstrap|supabase-auth/i);

const ids = [
  "modeSelector", "recordBtn", "pauseBtn", "stopBtn", "timerDisplay", "recIndicator",
  "audioPanel", "sysAudioToggle", "micToggle", "noiseToggle", "countdownToggle",
  "webcamPanel", "cameraSelect", "mirrorToggle", "shapeSelector", "pipGrid",
  "previewArea", "liveVideo", "playbackVideo", "annotationCanvas", "annotationBar",
  "trimPanel", "trimStart", "trimEnd", "exportPanel", "downloadBtn", "qualitySelect",
  "historyPanel", "historyList", "historyToggleBtn", "shortcutHints", "toast",
];
for (const id of ids) {
  assert.match(englishApp, new RegExp(`id=["']${id}["']`), `English fixture missing #${id}`);
  assert.match(sw, new RegExp(`id=["']${id}["']`), `Swahili parity missing #${id}`);
}
assert.equal((sw.match(/class="crd-mode-card/g) || []).length, 4);
assert.equal((sw.match(/class="crd-mode-card[^"]*" role="button" tabindex="0"/g) || []).length, 4);
assert.equal((sw.match(/class="crd-pip-pos[^"]*" role="button" tabindex="0"/g) || []).length, 4);
assert.match(sw, /id="toast" role="status" aria-live="polite"/);
assert.deepEqual(
  Array.from(sw.matchAll(/data-mode="([^"]+)"/g), (match) => match[1]),
  ["screen", "webcam", "both", "audio"],
);

for (const feature of [
  /getDisplayMedia/,
  /getUserMedia/,
  /new MediaRecorder/,
  /videoBitsPerSecond/,
  /mediaRecorder\.pause\(\)/,
  /mediaRecorder\.resume\(\)/,
  /indexedDB\.open/,
  /saveToHistory/,
  /loadHistoryItem/,
  /deleteHistoryItem/,
  /URL\.createObjectURL/,
]) assert.match(controller, feature);

for (const englishFallback of [
  "Your browser does not support media recording",
  "Screen capture not supported in this browser",
  "Permission denied — please allow access",
  "Recording cancelled",
  "Recording complete!",
  "Downloading...",
  "Recording deleted",
]) assert.match(controller, new RegExp(englishFallback.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

for (const leak of [
  "Screen Only", "Record your screen", "Webcam Only", "Audio Only", "Preview appears here",
  "Pick a mode and hit record", "Download WebM", "Recent Recordings", "No recordings yet",
]) assert.doesNotMatch(sw, new RegExp(leak, "i"));

assert.match(sw, /Rekodi na historia yake hubaki kwenye kivinjari chako/);
assert.match(sw, /Hakikisha una ruhusa kabla ya kurekodi watu/);
assert.match(sw, /"@type":"FAQPage"/);
assert.equal((sw.match(/<details>/g) || []).length, 4);
assert.match(familyOwner, /"creator-record": "scripts\/build-sw-creator-record-final\.js"/);
assert.match(familyOwner, /dedicated owner output is stale/);

const before = crypto.createHash("sha256").update(read(swFile)).digest("hex");
childProcess.execFileSync(process.execPath, [path.join(ROOT, "scripts/build-sw-creator-record-final.js")], { cwd: ROOT, stdio: "pipe" });
const after = crypto.createHash("sha256").update(read(swFile)).digest("hex");
assert.equal(after, before, "Swahili CreatorRecord generator must be idempotent");

console.log("Swahili CreatorRecord static parity passed: full English workspace controls, locale-safe controller, SEO/privacy and idempotent owner.");
