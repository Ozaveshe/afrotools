const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..");

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
  test(`${relativePath} generates three deterministic French captions locally`, () => {
    const engine = loadEngine(relativePath);
    const first = engine.generateLocal(
      "instagram",
      "lancement de notre atelier créatif",
      "professional",
      { cta: true, hashtags: true, emoji: true, question: true },
      "medium",
      "french"
    );
    const second = engine.generateLocal(
      "instagram",
      "lancement de notre atelier créatif",
      "professional",
      { cta: true, hashtags: true, emoji: true, question: true },
      "medium",
      "french"
    );
    assert.equal(first.ok, true);
    assert.equal(first.mode, "local");
    assert.equal(first.captions.length, 3);
    assert.deepEqual(first.captions, second.captions);
    assert.match(first.captions[0].text, /Enregistrez|expérience/);
    assert.ok(first.captions[0].hashtags.length > 0);
    assert.equal(first.captions[0].withinLimit, true);
  });

  test(`${relativePath} respects the X limit and fails safely on empty input`, () => {
    const engine = loadEngine(relativePath);
    const result = engine.generateLocal(
      "x",
      "une très longue annonce ".repeat(40),
      "bold",
      { cta: true, hashtags: true, emoji: true, question: true },
      "long",
      "french"
    );
    assert.equal(result.ok, true);
    assert.ok(result.captions.every((caption) => caption.text.length <= 280));
    assert.equal(engine.generateLocal("instagram", "   ", "casual", {}, "short", "french").ok, false);
  });

  test(`${relativePath} rewrites locally without a network dependency`, () => {
    const engine = loadEngine(relativePath);
    const result = engine.rewriteLocal(
      "linkedin",
      "Notre coopérative ouvre un nouvel atelier samedi.",
      "french"
    );
    assert.equal(result.ok, true);
    assert.equal(result.captions.length, 3);
    assert.match(result.captions[2].text, /Qu’en pensez-vous/);
    assert.equal(engine.rewriteLocal("linkedin", "", "french").ok, false);
  });
}
