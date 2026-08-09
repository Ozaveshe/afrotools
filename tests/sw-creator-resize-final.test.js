"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root, "engines/src/creator-resize-engine.js"), "utf8");

function load(locale) {
  const document = { documentElement: { lang: locale }, readyState: "loading", addEventListener() {} };
  const context = { console, document, setTimeout() {}, clearTimeout() {} };
  context.window = context;
  vm.runInNewContext(source, context);
  return context.AfroTools.engines.creatorResize;
}

const expected = [
  ["ig-square", "IG Square", 1080, 1080, "instagram-square"],
  ["ig-portrait", "IG Portrait", 1080, 1350, "instagram-portrait"],
  ["ig-story", "IG Story", 1080, 1920, "instagram-story"],
  ["x-post", "X Post", 1200, 675, "x-post"], ["x-header", "X Header", 1500, 500, "x-header"],
  ["yt-thumb", "YT Thumbnail", 1280, 720, "youtube-thumbnail"], ["yt-banner", "YT Banner", 2560, 1440, "youtube-banner"],
  ["li-post", "LinkedIn Post", 1200, 627, "linkedin-post"], ["fb-cover", "FB Cover", 820, 312, "facebook-cover"],
  ["fb-post", "FB Post", 1200, 630, "facebook-post"], ["pin", "Pinterest Pin", 1000, 1500, "pinterest-pin"],
  ["wa-status", "WA Status", 1080, 1920, "whatsapp-status"]
];
const english = load("en");
assert.deepEqual(JSON.parse(JSON.stringify(english.sizes.map((size) => [size.id, english.sizeName(size), size.w, size.h, size.slug]))), expected);
assert.equal(english.text("downloaded", { name: "IG Square" }), "Downloaded IG Square");
assert.equal(english.text("noSizes"), "Choose at least one size to download.");

const swahili = load("sw");
assert.equal(swahili.locale, "sw");
assert.equal(swahili.sizeName(swahili.sizes[0]), "Mraba wa Instagram");
assert.equal(swahili.sizeName(swahili.sizes[11]), "Status ya WhatsApp");
assert.equal(swahili.text("downloaded", { name: "Mraba wa Instagram" }), "Mraba wa Instagram imepakuliwa");
assert.match(swahili.text("unsupportedImage"), /PNG, JPEG au WebP/);
assert.equal(swahili.presets.all.length, 12);

const html = fs.readFileSync(path.join(root, "sw/zana/resize-ya-mtayarishi/index.html"), "utf8");
assert.match(html, /id="preset"/);
assert.match(html, /id="crzApp"/);
assert.match(html, /creator-resize\.webp/);
assert.match(html, /Faili au pixel hazitumwi kwa AfroTools, AI au seva/);
console.log("Swahili creator-resize final: 12 assertions passed");
