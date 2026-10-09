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
