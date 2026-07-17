#!/usr/bin/env node
"use strict";

/**
 * repair-fr-registry-accents.js
 *
 * Applies the French accent/elision dictionary (scripts/repair-fr-accents.js)
 * to the `name` and `desc` string values of lang:'fr' rows in
 * assets/js/components/tool-registry.js. These strings render on French tool
 * cards, search results and hubs.
 *
 * Line-based and conservative: only lines containing lang: 'fr' are touched,
 * and only the quoted values of name:/desc:. Run `npm run minify` afterwards.
 *
 * Usage: node scripts/repair-fr-registry-accents.js [--fix]
 */

const fs = require("fs");
const path = require("path");
const { applyDict } = require("./repair-fr-accents.js");

const FILE = path.join(__dirname, "..", "assets", "js", "components", "tool-registry.js");
const APPLY = process.argv.includes("--fix");

const src = fs.readFileSync(FILE, "utf8");
const lines = src.split("\n");
let changed = 0;
const samples = [];

const out = lines.map((line) => {
  if (!/lang:\s*'fr'/.test(line)) return line;
  const next = line.replace(/\b(name|desc):\s*'((?:[^'\\]|\\.)*)'/g, (m, key, val) => {
    const plain = val.replace(/\\'/g, "'");
    const fixed = applyDict(plain);
    if (fixed === plain) return m;
    return `${key}: '${fixed.replace(/'/g, "\\'")}'`;
  });
  if (next !== line) {
    changed += 1;
    if (samples.length < 5) {
      const before = (line.match(/desc:\s*'((?:[^'\\]|\\.)*)'/) || [])[1] || "";
      const after = (next.match(/desc:\s*'((?:[^'\\]|\\.)*)'/) || [])[1] || "";
      if (before !== after) samples.push({ before: before.slice(0, 70), after: after.slice(0, 70) });
    }
  }
  return next;
});

if (APPLY && changed) {
  const result = out.join("\n");
  // sanity: file must still evaluate
  const vm = require("vm");
  const ctx = { console };
  vm.createContext(ctx);
  vm.runInContext(result, ctx);
  if (!Array.isArray(ctx.AFRO_TOOLS) || ctx.AFRO_TOOLS.length < 1000) {
    throw new Error("Post-repair registry failed to evaluate — aborting write.");
  }
  fs.writeFileSync(FILE, result, "utf8");
}

console.log(JSON.stringify({ mode: APPLY ? "fix" : "dry-run", frRowsChanged: changed, samples }, null, 2));
