"use strict";

const path = require("path");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const write = process.argv.includes("--write");
const commands = [
  ["scripts/build-french-engineering-parity.js", "--ids=boq-gen", ...(write ? ["--write"] : [])],
  ["scripts/build-fr-trade-parity-pages.js", "--slugs=documents-export", ...(write ? [] : ["--check"])]
];

for (const args of commands) {
  const result = spawnSync(process.execPath, args, { cwd: root, stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status || 1);
}

console.log(`${write ? "Built" : "Checked"} 2 final native French free-app owners.`);
