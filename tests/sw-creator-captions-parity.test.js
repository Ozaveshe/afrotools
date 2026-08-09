"use strict";

const assert = require("node:assert/strict");
const childProcess = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..");
const appPath = path.join(ROOT, "sw/zana/caption-za-maudhui/app.html");
const swIndex = fs.readFileSync(path.join(ROOT, "sw/zana/caption-za-maudhui/index.html"), "utf8");
const enApp = fs.readFileSync(path.join(ROOT, "tools/creator-captions/app.html"), "utf8");
const frApp = fs.readFileSync(path.join(ROOT, "fr/tools/legendes-createur/app.html"), "utf8");
const enIndex = fs.readFileSync(path.join(ROOT, "tools/creator-captions/index.html"), "utf8");
const frIndex = fs.readFileSync(path.join(ROOT, "fr/tools/legendes-createur/index.html"), "utf8");

function loadEngine(relativePath) {
  const window = {};
  vm.runInContext(
    fs.readFileSync(path.join(ROOT, relativePath), "utf8"),
    vm.createContext({ window, globalThis: window })
  );
  return window.AfroTools.CaptionCraftEngine;
}

for (const relativePath of [
  "engines/src/creator-captions-engine.js",
  "engines/creator-captions-engine.js",
]) {
  const engine = loadEngine(relativePath);
  const first = engine.generateLocal(
    "instagram",
    "uzinduzi wa sabuni ya asili",
    "professional",
    { cta: true, hashtags: true, emoji: true, question: true },
    "medium",
    "swahili"
  );
  const second = engine.generateLocal(
    "instagram",
    "uzinduzi wa sabuni ya asili",
    "professional",
    { cta: true, hashtags: true, emoji: true, question: true },
    "medium",
    "swahili"
  );
  assert.equal(first.ok, true);
  assert.equal(first.mode, "local");
  assert.equal(first.language, "swahili");
  assert.equal(first.captions.length, 3);
  assert.deepEqual(first.captions, second.captions);
  assert.match(first.captions[0].text, /Hifadhi chapisho hili|Uzoefu wako/);
  assert.ok(first.captions[0].hashtags.length > 0);
  assert.ok(first.captions.every((caption) => caption.withinLimit));
  assert.equal(engine.generateLocal("instagram", " ", "casual", {}, "short", "swahili").ok, false);

  const x = engine.generateLocal(
    "x",
    "tangazo refu sana ".repeat(50),
    "bold",
    { cta: true, hashtags: true, emoji: true, question: true },
    "long",
    "swahili"
  );
  assert.ok(x.captions.every((caption) => caption.text.length <= 280));

  const rewritten = engine.rewriteLocal(
    "linkedin",
    "Ushirika wetu unafungua duka jipya Jumamosi.",
    "swahili"
  );
  assert.equal(rewritten.ok, true);
  assert.equal(rewritten.captions.length, 3);
  assert.match(rewritten.captions[2].text, /Una maoni gani/);
  assert.equal(engine.rewriteLocal("linkedin", "", "swahili").ok, false);
}

const before = fs.readFileSync(appPath, "utf8");
childProcess.execFileSync(process.execPath, ["scripts/build-sw-creator-captions-app.js"], { cwd: ROOT });
const after = fs.readFileSync(appPath, "utf8");
assert.equal(after, before, "Swahili app generator must be idempotent");
assert.match(after, /<html[^>]+lang="sw"/);
assert.match(after, /afrotools-sw-native-owner" content="creator-captions"/);
assert.match(after, /afrotools-sw-source-owner" content="scripts\/build-sw-creator-captions-app\.js"/);
assert.match(after, /name="robots" content="noindex, follow"/i);
for (const app of [after, enApp, frApp]) assert.doesNotMatch(app, /hreflang=/i);
assert.match(after, /id="aiGenerateConsent"/);
assert.match(after, /Msaada wa AI wa hiari/);
assert.match(after, /Kiache bila kuchaguliwa ili kutengeneza kwenye kivinjari hiki pekee/);
assert.match(after, /id="topicInput"[^>]+aria-label="Mada au maelezo ya chapisho"/);
assert.match(after, /aria-label="Urefu wa caption"[^>]+id="lengthSlider"/);
assert.match(after, /id="langSelect"[^>]+aria-label="Lugha ya caption"/);
assert.match(after, /id="rewriteInput"[^>]+aria-label="Caption ya kuboresha"/);
assert.doesNotMatch(after, /<iframe\b/i);
assert.doesNotMatch(after, /fonts\.googleapis\.com|fonts\.gstatic\.com/i);
assert.ok(fs.existsSync(path.join(ROOT, "assets/img/tools/creator-captions.webp")));
assert.match(fs.readFileSync(path.join(ROOT, "sw/zana/caption-za-maudhui/index.html"), "utf8"), /href="\/sw\/zana\/caption-za-maudhui\/app"/);

assert.match(swIndex, /hreflang="en" href="https:\/\/afrotools\.com\/tools\/creator-captions\/"/);
assert.match(swIndex, /hreflang="fr" href="https:\/\/afrotools\.com\/fr\/tools\/legendes-createur\/"/);
for (const page of [enIndex, frIndex]) {
  assert.match(page, /hreflang="sw" href="https:\/\/afrotools\.com\/sw\/zana\/caption-za-maudhui\/"/);
}

console.log("Swahili Creator Captions static, engine and source-owner parity passed.");
