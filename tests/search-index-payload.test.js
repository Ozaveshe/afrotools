"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const slimPath = path.join(ROOT, "data/search-index.json");
const fullPath = path.join(ROOT, "data/search-index-full.json");
const slim = JSON.parse(fs.readFileSync(slimPath, "utf8"));
const full = JSON.parse(fs.readFileSync(fullPath, "utf8"));
const searchPage = fs.readFileSync(path.join(ROOT, "search/index.html"), "utf8");

assert(fs.statSync(slimPath).size < 300 * 1024, "first-load search index must remain below 300KB");
assert.strictEqual(slim.length, full.length, "slim and full-text indexes must contain the same routes");
assert(slim.every((row) => Array.isArray(row) && row.length === 4), "slim rows must contain title, route, category, and priority only");
assert(full.every((row) => Array.isArray(row) && row.length === 10), "full-text rows must retain the complete search contract");
assert.deepStrictEqual(
  slim.map((row) => row[1]).sort(),
  full.map((row) => row[6]).sort(),
  "slim and full-text route sets must match"
);
assert(searchPage.includes("/data/search-index-full.json"), "search page must know the lazy full-text shard URL");
assert(searchPage.includes("if (val.trim()) requestFullSearchIndexLoad()"), "first search input must request the full-text shard");

console.log(`search index payload: PASS (${fs.statSync(slimPath).size} byte first load; ${full.length} routes)`);
