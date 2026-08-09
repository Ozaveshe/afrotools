"use strict";
const test = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  engine = require("../assets/js/engines/generator-sizing-engine.js"),
  app = require("../scripts/lib/sw-generator-sizing-contract.js");
test("default English oracle preserves worst single surge and rounding", () => {
  const r = engine.calculate(engine.defaults());
  assert.equal(r.runningWatts, 610);
  assert.equal(r.maxAdditionalSurgeWatts, 300);
  assert.equal(r.startupWatts, 910);
  assert.equal(r.rawRecommendedKVA, 1.421875);
  assert.equal(r.recommendedKVA, 2.5);
  assert.equal(r.stale, true);
  assert.equal(r.confidence, "low");
});
test("custom motor load uses exact PF headroom and standard size", () => {
  const r = engine.calculate([
    { name: "Pump", watts: 750, surge: 3, qty: 2 },
    { name: "Lights", watts: 100, surge: 1, qty: 1 },
  ]);
  assert.equal(r.runningWatts, 1600);
  assert.equal(r.maxAdditionalSurgeWatts, 3000);
  assert.equal(r.startupWatts, 4600);
  assert.equal(r.rawRecommendedKVA, 7.1875);
  assert.equal(r.recommendedKVA, 7.5);
});
test("invalid loads fail closed", () => {
  for (const input of [
    [],
    [{ name: "", watts: 1, surge: 1, qty: 1 }],
    [{ name: "x", watts: 0, surge: 1, qty: 1 }],
    [{ name: "x", watts: 1, surge: 0.5, qty: 1 }],
    [{ name: "x", watts: 1, surge: 1, qty: -1 }],
  ])
    assert.deepEqual(engine.calculate(input), {
      error: "invalid_generator_input",
    });
});
test("English and Swahili consume one DOM-free engine", () => {
  for (const file of [app.englishFile, app.file])
    assert.match(
      fs.readFileSync(file, "utf8"),
      /assets\/js\/engines\/generator-sizing-engine\.js/,
    );
  assert.doesNotMatch(
    fs.readFileSync(app.engine, "utf8"),
    /\bdocument\b|\bwindow\b|localStorage|fetch\(|XMLHttpRequest|sendBeacon/,
  );
});
test("ownership is exact Engineering credit with no Energy duplication", () => {
  const rows =
      require("../reports/swahili-free-app-parity-inventory.json").rows,
    owners = rows.filter(
      (row) => row.primarySwahiliRoute === app.swRoute.replace(/\/$/, ""),
    );
  assert.deepEqual(
    owners.map((row) => row.englishId),
    [app.id],
  );
  assert.equal(owners[0].categoryKey, "engineering");
  assert.equal(
    require("../data/registry/locale-page-coverage.json").records.find(
      (row) => row.route === app.swRoute,
    ).equivalentRoute,
    app.englishRoute,
  );
  assert.match(
    fs.readFileSync("assets/js/components/tool-registry.js", "utf8"),
    /zana-ukubwa-wa-generator-sw[\s\S]{0,500}category: "engineering"[\s\S]{0,250}sourceId: 'generator-sizing'[\s\S]{0,100}imageId: 'generator-sizing'/,
  );
});
test("native owner states source privacy safety exports and artwork boundaries", () => {
  const page = fs.readFileSync(app.file, "utf8").replace(/\s+/g, " "),
    controller = fs.readFileSync(
      "assets/js/pages/sw-generator-sizing-parity.js",
      "utf8",
    );
  for (const token of [
    "si idhini ya umeme au usakinishaji",
    "mifano ya zamani",
    "isiyo na tarehe",
    "uhakika ni mdogo",
    "monoksidi kaboni",
    "hakuna data ya vifaa inayotumwa kwenye seva",
    'data-swg-export="json"',
    'data-swg-export="csv"',
    'data-swg-export="txt"',
    'data-swg-export="pdf"',
    app.image,
  ])
    assert.match(
      page,
      new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"),
    );
  for (const token of [
    "Jokofu dogo",
    "Taa za LED",
    "Kizidishi cha kuanza",
    "chanzo cha mtengenezaji",
  ]) assert.match(controller, new RegExp(token, "i"));
  assert.equal(fs.existsSync(app.image), true);
});
