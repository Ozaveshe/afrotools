const assert = require("assert");
const engine = require("../engineering/floor-planner/js/fp-boq-engine.js");

const rates = {
  cement: 1000,
  block: 100,
  sand: 10000,
  stone: 15000,
  rod: 900,
  roof: 1200,
  door: 8000,
  window: 6000,
  tile: 700,
  paint: 5000,
  labour: 0.45
};

function samplePlan(width = 10, depth = 8) {
  return {
    name: "QS Test Plan",
    country: "KE",
    city: "Nairobi",
    rooms: [
      {
        type: "room",
        name: "Living Room",
        points: [
          { x: 0, y: 0 },
          { x: 5, y: 0 },
          { x: 5, y: depth },
          { x: 0, y: depth }
        ]
      },
      {
        type: "room",
        name: "Kitchen Bath",
        points: [
          { x: 5, y: 0 },
          { x: width, y: 0 },
          { x: width, y: depth },
          { x: 5, y: depth }
        ]
      }
    ],
    walls: [
      { type: "wall", x1: 0, y1: 0, x2: width, y2: 0 },
      { type: "wall", x1: width, y1: 0, x2: width, y2: depth },
      { type: "wall", x1: width, y1: depth, x2: 0, y2: depth },
      { type: "wall", x1: 0, y1: depth, x2: 0, y2: 0 },
      { type: "wall", x1: 5, y1: 0, x2: 5, y2: depth },
      { type: "wall", material: "site-boundary", x1: -2, y1: -2, x2: width + 2, y2: -2 }
    ],
    doors: [
      { type: "door", x: 0, y: 3, width: 0.9 },
      { type: "door", x: 5, y: 4, width: 0.8 }
    ],
    windows: [
      { type: "window", x: 2, y: 0, width: 1.2 },
      { type: "window", x: 8, y: depth, width: 1.2 },
      { type: "window", x: width, y: 3, width: 1.2 }
    ],
    siteObjects: [
      { type: "furniture", label: "Driveway", w: 5, h: 6 },
      { type: "furniture", label: "Septic tank", w: 2, h: 2 }
    ]
  };
}

function build(plan = samplePlan(), assumptions = {}) {
  return engine.buildBoq(plan, {
    country: "Kenya",
    city: "Nairobi",
    currency: "KES",
    priceSource: "Test fallback rates",
    rates,
    assumptions
  });
}

{
  const takeoff = engine.takeoff(samplePlan());
  assert.strictEqual(takeoff.totalFloorArea, 80);
  assert.strictEqual(takeoff.wallLength, 44);
  assert.strictEqual(takeoff.externalWallLength, 36);
  assert.strictEqual(takeoff.internalWallLength, 8);
  assert.strictEqual(takeoff.siteBoundaryLength, 14);
  assert.strictEqual(takeoff.doorCount, 2);
  assert.strictEqual(takeoff.windowCount, 3);
  assert.ok(takeoff.blockQuantity > 900, "block quantity should come from wall area");
  assert.ok(takeoff.concreteVolumeM3 > 0, "concrete volume should be estimated");
  assert.ok(takeoff.roofingArea > takeoff.totalFloorArea, "pitched roof should exceed floor area");
}

{
  const normal = build(samplePlan(), { wallHeight: 3 });
  const taller = build(samplePlan(), { wallHeight: 3.6 });
  assert.ok(taller.takeoff.blockQuantity > normal.takeoff.blockQuantity, "changing wall height should change block takeoff");
  assert.ok(taller.total > normal.total, "estimate total should change when plan assumptions change");
}

{
  const small = build(samplePlan(10, 8));
  const large = build(samplePlan(12, 10));
  assert.ok(large.takeoff.totalFloorArea > small.takeoff.totalFloorArea, "larger plan should have larger floor area");
  assert.ok(large.takeoff.roofingArea > small.takeoff.roofingArea, "roofing quantity should follow plan geometry");
  assert.ok(large.total > small.total, "estimate total should change when geometry changes");
}

{
  const boq = build();
  const requiredPhases = new Set(engine.PHASES);
  assert.ok(boq.items.length >= 18, "BOQ should include detailed line items");
  boq.items.forEach((line) => {
    assert.ok(requiredPhases.has(line.phase), `unknown phase ${line.phase}`);
    assert.ok(line.name, "line item must have a name");
    assert.ok(line.unit, `line ${line.name} must have a unit`);
    assert.ok(typeof line.qty === "number", `line ${line.name} must have numeric qty`);
    assert.ok(line.source, `line ${line.name} must have source`);
    assert.ok(["High", "Medium", "Low"].includes(line.confidence), `line ${line.name} must have confidence`);
    assert.ok(line.note, `line ${line.name} must explain calculation`);
    assert.ok(line.amountRange && typeof line.amountRange.min === "number", `line ${line.name} must have min/mid/max`);
  });
  assert.ok(boq.phases.blockwork.length > 0, "blockwork phase should exist");
  assert.ok(boq.phases["external works"].length > 0, "external works phase should exist");
}

console.log("floor planner BOQ engine tests passed");
