import assert from "node:assert/strict";
import test from "node:test";
import { DrawingFile } from "../src/core/DrawingFile.js";
import { Engine } from "../src/core/Engine.js";
import { LineEntity } from "../src/core/Entity.js";

test("command-created line and polyline retain geometry and properties across file open", () => {
  const engine = new Engine();
  engine.addEntity({ type: "line", x1: 0, y1: 0, x2: 100, y2: 0 });
  const points = [{ x: 10, y: 10 }, { x: 20, y: 30 }, { x: 40, y: 15 }];
  engine.addEntity({ type: "polyline", points, closed: true });
  const saved = DrawingFile.serialize(engine);
  const records = JSON.parse(saved).entities;
  assert.equal(records.length, 2);
  assert.deepEqual(records[0].start, { x: 0, y: 0 });
  assert.deepEqual(records[0].end, { x: 100, y: 0 });
  assert.deepEqual(records[1].vertices, points);
  const reopened = new Engine();
  DrawingFile.deserialize(saved, reopened);
  assert.deepEqual(JSON.parse(DrawingFile.serialize(reopened)).entities, records);
  assert.deepEqual(reopened.entities.get(records[0].id).getBounds(), { minX: 0, minY: 0, maxX: 100, maxY: 0 });
});

test("existing version 6 line files keep typed geometry", () => {
  const entity = { id: 86, type: "line", start: { x: 4, y: 7 }, end: { x: 14, y: 17 } };
  const engine = new Engine();
  DrawingFile.deserialize(JSON.stringify({ version: "6.0", entities: [entity] }), engine);
  assert.ok(engine.entities.get(86) instanceof LineEntity);
  const [record] = JSON.parse(DrawingFile.serialize(engine)).entities;
  assert.deepEqual(record.start, entity.start);
  assert.deepEqual(record.end, entity.end);
  assert.equal(record.commandGeometry, undefined);
});

test("an unsupported command cannot produce a silently incomplete file", () => {
  const engine = new Engine();
  engine.entities.set(4, { type: "unrecognized" });
  assert.throws(() => DrawingFile.serialize(engine), /unsupported drawing object/);
  assert.throws(() => DrawingFile.deserialize('{"entities":[{"type":"unrecognized","commandGeometry":true}]}', engine), /Unsupported command geometry/);
  assert.equal(engine.entities.size, 1);
});
