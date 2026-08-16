"use strict";

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");

const canonicalAliases = require("../scripts/lib/canonical-aliases");
const countryIdentity = require("../scripts/audit-country-identity");
const publicClaims = require("../scripts/lib/public-claims");

const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "afrotools-public-walker-"));
try {
  fs.writeFileSync(path.join(fixture, "index.html"), "<!doctype html><title>Public</title>\n", "utf8");
  for (const directory of [".codex-worktrees", ".worktrees", ".codex"]) {
    const nested = path.join(fixture, directory, "private");
    fs.mkdirSync(nested, { recursive: true });
    fs.writeFileSync(path.join(nested, "index.html"), "<!doctype html><title>Private</title>\n", "utf8");
    fs.writeFileSync(path.join(nested, "notes.txt"), "private evidence\n", "utf8");
  }

  assert.deepStrictEqual(
    canonicalAliases.walkHtmlFiles(fixture).map((file) => path.relative(fixture, file).replace(/\\/g, "/")),
    ["index.html"],
    "canonical aliases must never turn nested agent worktrees into public redirects"
  );
  assert.deepStrictEqual(
    publicClaims.collectRepositoryFiles(fixture).map((file) => file.path),
    ["index.html"],
    "claim scans must exclude nested agent worktrees from their denominator"
  );
} finally {
  fs.rmSync(fixture, { recursive: true, force: true });
}

const countries = JSON.parse(fs.readFileSync(path.join(__dirname, "../data/registry/countries.json"), "utf8"));
const leakedCountryPage = countryIdentity.collectCountryPages(countries).find(({ file }) => {
  const relative = path.relative(path.join(__dirname, ".."), file).replace(/\\/g, "/");
  return relative.startsWith(".codex-worktrees/") || relative.startsWith(".worktrees/") || relative.startsWith(".codex/");
});
assert.strictEqual(leakedCountryPage, undefined, "country reports must exclude nested agent worktrees");

for (const [file, required] of [
  ["scripts/build-dist.js", [".codex-worktrees", ".worktrees"]],
  ["scripts/check-links.js", [".codex-worktrees", ".worktrees"]],
  ["scripts/audit-dist.js", [".codex-worktrees", ".worktrees"]],
  ["scripts/inject-analytics-loader.js", [".codex-worktrees", ".worktrees"]],
  ["scripts/security-scan.js", [".codex-worktrees", ".worktrees"]]
]) {
  const source = fs.readFileSync(path.join(__dirname, "..", file), "utf8");
  required.forEach((directory) => {
    assert.ok(source.includes(`'${directory}'`) || source.includes(`"${directory}"`), `${file} must exclude ${directory}`);
  });
}

console.log("Public walker boundary tests passed");
