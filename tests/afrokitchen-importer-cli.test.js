"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root, "scripts/import-afrokitchen-expansion-batch.js"), "utf8");
const batch = path.join(root, "data/afrokitchen/recipe-expansion-batches/2026-04-28-wave-1.json");
const cases = [
  ["help", ["--help"], 0, 0],
  ["short help", ["-h"], 0, 0],
  ["no arguments", [], 1, 0],
  ["unknown argument", ["--wat"], 1, 0],
  ["dry run without batch", ["--dry-run"], 1, 0],
  ["apply without batch", ["--apply"], 1, 0],
  ["batch without mode", ["--batch", batch], 1, 0],
  ["missing path", ["--batch", "--apply"], 1, 0],
  ["mixed help", ["--help", "--apply"], 1, 0],
  ["conflicting modes", ["--batch", batch, "--apply", "--dry-run"], 1, 0],
  ["duplicate mode", ["--batch", batch, "--apply", "--apply"], 1, 0],
  ["duplicate batch", ["--batch", batch, "--batch", batch, "--apply"], 1, 0],
  ["explicit dry run", ["--batch", batch, "--dry-run"], 0, 0],
  ["explicit apply", ["--batch", batch, "--apply"], 1, 1]
];

for (const [name, args, expectedExit, expectedClients] of cases) {
  test(`importer CLI: ${name}`, async () => {
    let exit = 0, clients = 0, writes = 0;
    const messages = [];
    const sandbox = {
      __dirname: path.join(root, "scripts"),
      require(id) {
        if (id === "@supabase/supabase-js") return {
          createClient() { clients += 1; throw new Error("TEST: database client blocked"); }
        };
        if (id === "fs") return {
          ...fs,
          writeFileSync() { writes += 1; throw new Error("TEST: file write blocked"); },
          mkdirSync() { writes += 1; throw new Error("TEST: directory write blocked"); }
        };
        return require(id);
      },
      process: {
        argv: ["node", "importer", ...args],
        env: { SUPABASE_SERVICE_ROLE_KEY: "synthetic-test-only" },
        exit(code) { exit = code; }
      },
      console: { log(message) { messages.push(String(message)); }, error(message) { messages.push(String(message)); } }
    };
    vm.runInNewContext(source, sandbox);
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(exit, expectedExit);
    assert.equal(clients, expectedClients);
    assert.equal(writes, 0);
    if (name === "explicit apply") assert(messages.some(message => message.includes("TEST: database client blocked")));
    if (name.includes("help") && expectedExit === 0) assert(messages.some(message => message.startsWith("Usage:")));
  });
}

const ogbonoPath = path.join(root, "data/afrokitchen/recipe-expansion-batches/2026-10-23-ogbono-wave-1.json");
const ogbono = JSON.parse(fs.readFileSync(ogbonoPath, "utf8"));

async function inspectImport(candidate, mode = "--dry-run") {
  let clients = 0, writes = 0, exit = 0;
  const messages = [];
  const context = {
    __dirname: path.join(root, "scripts"),
    require(id) {
      if (id === "@supabase/supabase-js") return {
        createClient() { clients += 1; throw new Error("TEST: database client blocked"); }
      };
      if (id === "fs") return {
        ...fs,
        readFileSync() { return JSON.stringify(candidate); },
        writeFileSync() { writes += 1; throw new Error("TEST: file write blocked"); },
        mkdirSync() { writes += 1; throw new Error("TEST: directory write blocked"); }
      };
      return require(id);
    },
    process: {
      argv: ["node", "importer", "--batch", ogbonoPath, mode],
      env: { SUPABASE_SERVICE_ROLE_KEY: "synthetic-test-only" },
      exit(code) { exit = code; }
    },
    console: { log(message) { messages.push(String(message)); }, error(message) { messages.push(String(message)); } }
  };
  vm.runInNewContext(source + "\nglobalThis.probe = { ingredientPayload, recipePayload, validateBatch };", context);
  await new Promise(resolve => setImmediate(resolve));
  return { clients, writes, exit, messages, probe: context.probe };
}

test("importer preserves the six unmeasured Ogbono quantities through serving changes", async () => {
  const result = await inspectImport(ogbono);
  assert.equal(result.exit, 0);
  assert.equal(result.clients, 0);
  assert.equal(result.writes, 0);
  const recipe = ogbono.recipes[0];
  assert.equal(recipe.ingredients.length, 15);
  assert.equal(recipe.steps.length, 6);
  const payloads = recipe.ingredients.map((item, i) => result.probe.ingredientPayload("synthetic", item, i));
  const unmeasured = payloads.filter(item => item.source_quantity_unrecorded === true);
  assert.equal(unmeasured.length, 6);
  assert(unmeasured.every(item => item.amount === null));
  const engine = require(path.join(root, "engines/src/afrokitchen-engine.js"));
  for (const servings of [6, 12, 6]) {
    const scaled = engine.scaleIngredients(payloads, 6, servings);
    assert(scaled.filter(item => item.source_quantity_unrecorded === true).every(item => item.scaled_amount === ""));
    assert.equal(scaled.find(item => item.name === "ground ogbono").scaled_amount, 120 * servings / 6);
    assert.equal(scaled.find(item => item.name === "reserved stock").scaled_amount, servings / 6);
    assert.equal(scaled.find(item => item.name === "water").scaled_amount, servings / 6);
    assert.equal(scaled.find(item => item.name === "extra stock").scaled_amount, 0.5 * servings / 6);
    assert.equal(scaled.find(item => item.name === "extra water").scaled_amount, 0.5 * servings / 6);
  }
  const recipeRow = result.probe.recipePayload(recipe);
  assert.equal(recipeRow.prep_time_minutes + recipeRow.cook_time_minutes, 45);
  assert.equal(Object.hasOwn(recipeRow, "total_time_minutes"), false, "database-generated total must not be written");
});

test("importer refuses ambiguous quantities before any apply client or file write", async () => {
  const inspector = await inspectImport(ogbono);
  for (const amount of [NaN, Infinity, -Infinity]) {
    const candidate = structuredClone(ogbono);
    candidate.recipes[0].ingredients[0].amount = amount;
    assert(inspector.probe.validateBatch(candidate).length > 0);
  }
  const invalid = [
    { amount: null }, { amount: undefined }, { amount: "" }, { amount: " \t" },
    { amount: "NaN" }, { amount: "Infinity" }, { amount: "-Infinity" },
    { amount: true }, { amount: false }, { amount: [] }, { amount: {} },
    { amount: 1, source_quantity_unrecorded: true },
    { amount: "", source_quantity_unrecorded: true },
    { amount: null, source_quantity_unrecorded: false },
    ...["true", "false", 1, 0, null].map(marker => ({ amount: 1, source_quantity_unrecorded: marker }))
  ];
  for (const fields of invalid) {
    const candidate = structuredClone(ogbono);
    candidate.recipes[0].ingredients[0] = { name: "synthetic ingredient", unit: "g", ...fields };
    const result = await inspectImport(candidate, "--apply");
    assert.equal(result.exit, 1, JSON.stringify(fields));
    assert.equal(result.clients, 0);
    assert.equal(result.writes, 0);
    assert(result.messages.some(message => message.includes("ingredient 1 needs a finite measured amount")));
  }
});

test("measured values and legitimate zero retain their original import payload", async () => {
  for (const amount of [0, "0", 1, 0.3333333333333333, "2.5"]) {
    for (const marker of [undefined, false]) {
      const ingredient = { name: "synthetic ingredient", unit: "g", amount };
      if (marker !== undefined) ingredient.source_quantity_unrecorded = marker;
      const candidate = structuredClone(ogbono);
      candidate.recipes[0].ingredients[0] = ingredient;
      const result = await inspectImport(candidate);
      assert.equal(result.exit, 0);
      assert.equal(result.clients, 0);
      assert.equal(result.writes, 0);
      assert.deepEqual(JSON.parse(JSON.stringify(result.probe.ingredientPayload("synthetic", ingredient, 0))), {
        recipe_id: "synthetic", ingredient_id: null, sort_order: 10, group_name: null,
        amount: Number(amount), unit: "g", name: "synthetic ingredient", prep_note: null,
        is_optional: false, substitution: null
      });
    }
  }
});

test("valid Ogbono explicit apply reaches only the synthetic blocked client", async () => {
  const result = await inspectImport(ogbono, "--apply");
  assert.equal(result.exit, 1);
  assert.equal(result.clients, 1);
  assert.equal(result.writes, 0);
  assert(result.messages.some(message => message.includes("TEST: database client blocked")));
});
