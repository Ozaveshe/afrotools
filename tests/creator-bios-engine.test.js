const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const test = require("node:test");

function load(relativePath) {
  const context = { window: {}, globalThis: {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "..", relativePath), "utf8"), context);
  return context.window.AfroTools.BioForgeEngine;
}

for (const file of ["engines/src/creator-bios-engine.js", "engines/creator-bios-engine.js"]) {
  test(`${file} generates the same seven bounded English and French bios`, () => {
    const engine = load(file);
    const input = {
      who: "Amina Studio",
      what: "documentary portraits and visual stories",
      tone: "bold",
      location: "Dakar, Sénégal",
      achievement: "three regional exhibitions"
    };
    for (const locale of ["en", "fr"]) {
      const result = engine.generate(input, locale);
      assert.equal(result.ok, true);
      assert.equal(result.bios.length, 7);
      assert.deepEqual(Array.from(result.bios, (bio) => bio.platform), Array.from(engine.PLATFORM_ORDER));
      assert.ok(result.bios.every((bio) => bio.withinLimit && bio.charCount === bio.text.length));
      assert.match(result.bios[0].text, /Amina Studio/);
      assert.doesNotThrow(() => JSON.parse(engine.serialize(result, "json")));
      assert.match(engine.serialize(result, "txt"), /Instagram/);
    }
  });

  test(`${file} fails closed for empty and overlong identity fields`, () => {
    const engine = load(file);
    assert.deepEqual(Array.from(engine.generate({}, "fr").errors), ["who", "what"]);
    assert.equal(engine.generate({ who: "x".repeat(121), what: "photo" }, "en").ok, false);
    assert.throws(() => engine.serialize({ ok: false }, "json"));
  });
}

test("creator-bios routes, scoped AI mapping, discovery and artwork are exact", () => {
  const root = path.join(__dirname, "..");
  const english = fs.readFileSync(path.join(root, "tools/creator-bios/index.html"), "utf8");
  const french = fs.readFileSync(path.join(root, "fr/tools/bio-createur/index.html"), "utf8");
  const englishApp = fs.readFileSync(path.join(root, "tools/creator-bios/app.html"), "utf8");
  const frenchApp = fs.readFileSync(path.join(root, "fr/tools/bio-createur/app.html"), "utf8");
  const routeMap = fs.readFileSync(path.join(root, "scripts/lib/french-tool-route-map.js"), "utf8");
  const registry = fs.readFileSync(path.join(root, "assets/js/components/tool-registry.js"), "utf8");

  assert.match(english, /hreflang="fr" href="https:\/\/afrotools\.com\/fr\/tools\/bio-createur\/"/);
  assert.match(french, /hreflang="en" href="https:\/\/afrotools\.com\/tools\/creator-bios\/"/);
  assert.match(french, /canonical" href="https:\/\/afrotools\.com\/fr\/tools\/bio-createur\/"/);
  assert.match(french, /og:url" content="https:\/\/afrotools\.com\/fr\/tools\/bio-createur\/"/);
  assert.match(french, /"inLanguage":"fr"/);
  assert.match(englishApp, /creator-bios-controller\.js/);
  assert.match(frenchApp, /creator-bios-controller\.js/);
  assert.match(routeMap, /"bio-createur": "creator-bios"/);
  assert.match(registry, /sourceId: 'creator-bios'.+href: '\/fr\/tools\/bio-createur\/'|href: '\/fr\/tools\/bio-createur\/'.+sourceId: 'creator-bios'/);
  assert.equal(fs.existsSync(path.join(root, "assets/img/tools/creator-bios.webp")), true);
});
