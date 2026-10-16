"use strict";
// Declaration validation plus confined physical-owner validation for the route compiler.
const assert = require("node:assert/strict");
const fs = require("node:fs"), path = require("node:path");
function routeKey(route) { return route === "/" ? route : route.replace(/\/+$/, ""); }
function literalPath(value) {
  assert.equal(typeof value, "string");
  assert.match(value, /^\/[A-Za-z0-9_/-]+(?:\.html)?\/?$/, "Literal local path required");
  assert(!value.startsWith("//") && !value.includes("//"));
  assert(!value.split("/").some(part => part === "." || part === ".."));
  assert(!/^\/(?:dist|node_modules|scripts|docs|netlify|supabase)(?:\/|$)/.test(value));
  return value;
}
function staticOwnerDecisions(policy) {
  const values = policy.staticOwnerDecisions || [];
  assert(Array.isArray(values));
  const seen = new Set(), ids = new Set();
  const canonical = new Set((policy.canonicalDecisions || []).map(d => routeKey(d.source)));
  return values.map(value => {
    assert.deepEqual(Object.keys(value).sort(), ["destination", "force", "id", "rationale", "source", "statusCode"].sort());
    assert.match(value.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert(!ids.has(value.id), "Duplicate static owner ID"); ids.add(value.id);
    assert.equal(typeof value.rationale, "string"); assert(value.rationale.trim());
    const source = literalPath(value.source), destination = literalPath(value.destination);
    assert.equal(value.statusCode, 200); assert.equal(value.force, true);
    assert(destination.endsWith(".html"), "Explicit physical HTML target required");
    assert.notEqual(source, destination, "Literal self rewrite forbidden");
    const key = routeKey(source);
    assert(!seen.has(key), "Duplicate normalized static owner");
    assert(!canonical.has(key), "Static owner conflicts with canonical decision");
    seen.add(key);
    return { ...value, source, destination };
  });
}
function staticOwnerRules(policy) {
  return staticOwnerDecisions(policy).map((d, index) => ({
    id: `static-owner:${d.id}`, route: d.source, target: d.destination,
    statusCode: 200, force: true, conditions: {}, query: {},
    owner: "data/registry/route-policy.json", line: index + 1, order: index,
    preserveEquity: false, deprecated: false, rationale: d.rationale
  }));
}
function staticOwnerLines(policy) {
  return staticOwnerDecisions(policy).map(d => `${d.source}  ${d.destination}  200!`);
}
function isPublishedHtml(file, policy) {
  if (typeof file !== "string" || path.isAbsolute(file) || file.includes("\\") || !file.endsWith(".html")) return false;
  const parts = file.split("/");
  if (parts.some(part => !part || part.startsWith("."))) return false;
  return !(policy.excludedDirectories || []).includes(parts[0]) && !(policy.excludedHtmlFiles || []).includes(file);
}
function validatePhysicalOwners(policy, sourceRoot, publicFiles) {
  assert(publicFiles instanceof Set, "Current published HTML inventory required");
  const root = fs.realpathSync(sourceRoot);
  return staticOwnerRules(policy).map(rule => {
    const file = rule.target.slice(1);
    assert(isPublishedHtml(file, policy), "Static owner target excluded from published HTML");
    assert(publicFiles.has(file), "Static owner absent from current published HTML inventory");
    const target = path.resolve(root, file), actual = fs.realpathSync(target), relative = path.relative(root, actual);
    assert(relative && relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative), "Static owner escapes source root");
    assert(isPublishedHtml(relative.split(path.sep).join("/"), policy), "Resolved static owner is excluded");
    assert(fs.lstatSync(target).isFile(), "Static owner must be a regular published file");
    let current = root;
    for (const part of file.split("/")) { current = path.join(current, part); assert(!fs.lstatSync(current).isSymbolicLink(), "Symlink is not a discovered published file"); }
    return rule;
  });
}
module.exports = { literalPath, routeKey, staticOwnerDecisions, staticOwnerRules, staticOwnerLines, isPublishedHtml, validatePhysicalOwners };
