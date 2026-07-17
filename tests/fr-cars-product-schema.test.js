const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const carsRoot = path.join(root, "fr", "cars");

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

function flattenSchema(value) {
  if (!value || typeof value !== "object") return [];
  if (Array.isArray(value)) return value.flatMap(flattenSchema);
  return [value, ...Object.values(value).flatMap(flattenSchema)];
}

function jsonLdBlocks(html) {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map((match) => JSON.parse(match[1]));
}

const files = walk(carsRoot).filter((file) => file.endsWith(".html"));
assert.ok(files.length > 0, "expected generated French cars pages");

for (const file of files) {
  const relative = path.relative(root, file);
  const nodes = jsonLdBlocks(fs.readFileSync(file, "utf8")).flatMap(flattenSchema);
  assert.ok(nodes.length > 0, `${relative}: expected JSON-LD`);
  assert.ok(
    nodes.every((node) => node["@type"] !== "Product"),
    `${relative}: informational estimate pages must not emit Product schema without real offers, reviews, or ratings`
  );
}

console.log("fr-cars-product-schema.test.js passed");
