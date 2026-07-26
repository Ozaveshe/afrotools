"use strict";

const assert = require("assert");
const { shouldSkipDirectory } = require("../scripts/dedupe-content-blocks");

for (const directory of [
  ".agents",
  ".claude",
  ".codex",
  ".git",
  ".netlify",
  ".playwright",
  "artifacts",
  "audit-results",
  "dist",
  "node_modules",
  "reports",
  "test-results",
  "tests",
]) {
  assert.strictEqual(shouldSkipDirectory(directory), true, `${directory} must be outside the content rewrite scope`);
}

for (const directory of ["fr", "sw", "tools"]) {
  assert.strictEqual(shouldSkipDirectory(directory), false, `${directory} must remain in the content rewrite scope`);
}

console.log("dedupe-content-blocks-scope.test.js passed");
