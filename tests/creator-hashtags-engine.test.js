const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..");

function load(file) {
  const context = { window: {}, Set, Date, JSON };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context);
  return context.window.AfroTools.TagWaveEngine;
}

for (const file of ["engines/src/creator-hashtags-engine.js", "engines/creator-hashtags-engine.js"]) {
  test(`${file} keeps the shared deterministic contract`, () => {
    const engine = load(file);
    const result = engine.generateLocal("coulisses photo mariage à Dakar", "instagram", "fr");
    assert.equal(result.source, "local-deterministic");
    assert.equal(result.platform, "instagram");
    assert.equal(result.sets.length, 3);
    assert.equal(result.sets[0].tags.length, 15);
    assert.ok(result.sets.flatMap((set) => set.tags).some((tag) => tag.tag === "#DakarCreative"));
    assert.match(result.sets[2].name, /COMMUNAUTÉ/);
    assert.doesNotMatch(JSON.stringify(result), /\b\d+(?:K|M|B)\b/);

    const second = engine.generateLocal("coulisses photo mariage à Dakar", "instagram", "fr");
    assert.deepEqual(JSON.parse(JSON.stringify(second)), JSON.parse(JSON.stringify(result)));
  });

  test(`${file} fails closed and produces parseable exports`, () => {
    const engine = load(file);
    assert.match(engine.generateLocal("  ", "instagram", "fr").error, /Décrivez/);
    const result = engine.generateLocal("atelier textile au Sénégal", "linkedin", "fr");
    const json = JSON.parse(engine.serialize(result, "json", "fr"));
    assert.equal(json.sets.length, 3);
    assert.equal(json.sets[0].tags.length, 4);
    const txt = engine.serialize(result, "txt", "fr");
    assert.match(txt, /PORTÉE ÉQUILIBRÉE/);
    assert.match(txt, /#CreateursSenegalais/);
  });

  test(`${file} retains the English prompt and parser compatibility`, () => {
    const engine = load(file);
    const prompt = engine.buildPrompt("Lagos wedding photos", "tiktok");
    assert.match(prompt, /three relevant hashtag sets/);
    assert.match(prompt, /TikTok/);
    const parsed = engine.parseSets('prefix {"sets":[]} suffix');
    assert.deepEqual(JSON.parse(JSON.stringify(parsed)), { sets: [] });
  });
}
