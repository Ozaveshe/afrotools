"use strict";
const test = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  engine = require("../assets/js/engines/engineering-materials-engine.js"),
  app = require("../scripts/lib/sw-paint-contract.js");
const room = engine.paintRoom({
  shape: "rect",
  unit: "m",
  length: 5,
  width: 4,
  height: 3,
  doors: 1,
  windows: 2,
  doorArea: 1.68,
  windowArea: 1.44,
  includeCeiling: true,
});
test("rectangle geometry and paint oracle preserve English formulas", () => {
  assert.equal(room.wallArea, 54);
  assert.equal(room.openings, 4.56);
  assert.equal(room.ceilingArea, 20);
  assert.equal(room.paintable, 69.44);
  const r = engine.paint({
    rooms: [room],
    baseCoverage: 10,
    surface: "smooth",
    coats: 2,
    wastagePct: 10,
    pricePerLitre: 100,
  });
  assert.equal(r.effectiveCoverage, 10);
  assert.equal(r.litresNeeded, 16);
  assert.equal(r.primerLitres, 0);
  assert.deepEqual(r.tins, { litres20: 0, litres4: 4, litres1: 0 });
  assert.equal(r.totalCost, 1600);
});
test("L-shape custom and primer formulas remain exact", () => {
  const l = engine.paintRoom({
      shape: "lshape",
      unit: "m",
      length1: 5,
      width1: 4,
      length2: 3,
      width2: 2,
      height: 3,
      doors: 1,
      windows: 2,
      includeCeiling: true,
    }),
    c = engine.paintRoom({
      shape: "custom",
      wallArea: 50,
      ceilingArea: 20,
      doors: 1,
      windows: 2,
      includeCeiling: true,
    });
  assert.equal(l.wallArea, 72);
  assert.equal(l.paintable, 93.44);
  assert.equal(c.paintable, 65.44);
  const r = engine.paint({
    rooms: [room],
    baseCoverage: 10,
    surface: "new",
    coats: 2,
    wastagePct: 10,
    pricePerLitre: 100,
  });
  assert.equal(r.effectiveCoverage, 6);
  assert.equal(r.litresNeeded, 26);
  assert.equal(r.primerLitres, 10);
  assert.deepEqual(r.tins, { litres20: 1, litres4: 1, litres1: 2 });
  assert.equal(r.primerCost, 700);
});
test("invalid geometry and assumptions fail closed", () => {
  assert.deepEqual(
    engine.paintRoom({ shape: "rect", length: 0, width: 4, height: 3 }),
    { error: "invalid_room" },
  );
  assert.deepEqual(
    engine.paint({ rooms: [], baseCoverage: 10, surface: "smooth", coats: 2 }),
    { error: "invalid_paint_input" },
  );
  assert.deepEqual(
    engine.paint({
      rooms: [room],
      baseCoverage: 0,
      surface: "smooth",
      coats: 2,
    }),
    { error: "invalid_paint_input" },
  );
});
test("English and Swahili consume the maintained DOM-free engine", () => {
  for (const file of [app.englishFile, app.file])
    assert.match(
      fs.readFileSync(file, "utf8"),
      /assets\/js\/engines\/engineering-materials-engine\.js/,
    );
  const source = fs.readFileSync(app.engine, "utf8");
  assert.doesNotMatch(
    source,
    /\bdocument\b|\bwindow\b|localStorage|fetch\(|XMLHttpRequest|sendBeacon/,
  );
});
test("route ownership is exact and no color or cost tool receives credit", () => {
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
  const coverage =
    require("../data/registry/locale-page-coverage.json").records.find(
      (row) => row.route === app.swRoute,
    );
  assert.equal(coverage.equivalentRoute, app.englishRoute);
  const registry = fs.readFileSync(
    "assets/js/components/tool-registry.js",
    "utf8",
  );
  assert.match(
    registry,
    /kikokotoo-rangi[\s\S]{0,500}sourceId: 'paint-calc'[\s\S]{0,100}imageId: 'paint-calc'/,
  );
});
test("native page states source privacy outputs and artwork", () => {
  const page = fs.readFileSync(app.file, "utf8");
  for (const token of [
    "bei zote hapa zinaingizwa na mtumiaji",
    "uhakika wa kati hadi mdogo",
    "Hakuna data ya chumba inayotumwa kwenye seva",
    'data-swp-export="json"',
    'data-swp-export="csv"',
    'data-swp-export="txt"',
    'data-swp-export="pdf"',
    app.image,
  ])
    assert.match(
      page,
      new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"),
    );
  assert.equal(fs.existsSync(app.image), true);
});
