"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const engine = require("../engines/src/creator-bios-engine.js");
const sw = fs.readFileSync(path.join(ROOT, "sw/zana/bio-za-mitandao/app.html"), "utf8");
const index = fs.readFileSync(path.join(ROOT, "sw/zana/bio-za-mitandao/index.html"), "utf8");
const en = fs.readFileSync(path.join(ROOT, "tools/creator-bios/app.html"), "utf8");
const fr = fs.readFileSync(path.join(ROOT, "fr/tools/bio-createur/app.html"), "utf8");
const enIndex = fs.readFileSync(path.join(ROOT, "tools/creator-bios/index.html"), "utf8");
const frIndex = fs.readFileSync(path.join(ROOT, "fr/tools/bio-createur/index.html"), "utf8");

assert.match(index, /href="\/sw\/zana\/bio-za-mitandao\/app"/);
assert.match(sw, /<html\b[^>]*lang="sw"/i);
assert.match(sw, /data-bioforge-app data-locale="sw"/i);
assert.match(sw, /afrotools-sw-native-owner" content="creator-bios"/i);
assert.match(sw, /canonical" href="https:\/\/afrotools\.com\/sw\/zana\/bio-za-mitandao\/app"/i);
assert.match(sw, /name="robots" content="noindex, follow"/i);
for (const app of [sw, en, fr]) assert.doesNotMatch(app, /hreflang=/i);
assert.match(index, /hreflang="en" href="https:\/\/afrotools\.com\/tools\/creator-bios\/"/i);
assert.match(index, /hreflang="fr" href="https:\/\/afrotools\.com\/fr\/tools\/bio-createur\/"/i);
assert.match(enIndex, /hreflang="sw" href="https:\/\/afrotools\.com\/sw\/zana\/bio-za-mitandao\/"/i);
assert.match(frIndex, /hreflang="sw" href="https:\/\/afrotools\.com\/sw\/zana\/bio-za-mitandao\/"/i);
assert.doesNotMatch(sw, /<iframe\b/i);
assert.ok(fs.existsSync(path.join(ROOT, "assets/img/tools/creator-bios.webp")));

assert.equal(engine.validateInput({ who: "", what: "" }).valid, false);
const result = engine.generate({
  who: "Asha Studio",
  what: "video za biashara ndogo za Afrika Mashariki",
  tone: "kitaalamu",
  location: "Dar es Salaam",
  achievement: "kampeni 40 zilizokamilika"
}, "sw");
assert.equal(result.ok, true);
assert.equal(result.locale, "sw");
assert.equal(result.bios.length, 7);
assert.ok(result.bios.every((bio) => bio.charCount <= bio.charLimit && bio.withinLimit));
assert.equal(result.bios.find((bio) => bio.platform === "linkedin_headline").label, "Kichwa cha LinkedIn");
assert.match(result.personalBrandTip, /ahadi moja/);
const json = JSON.parse(engine.serialize(result, "json"));
assert.equal(json.bios.length, 7);
const txt = engine.serialize(result, "txt");
assert.match(txt, /Instagram \(/);
assert.match(txt, /Kichwa cha LinkedIn/);

console.log("Swahili creator bios static and engine parity passed.");
