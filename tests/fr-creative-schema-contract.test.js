"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const {
  IN_LANGUAGE_LAUNCHERS,
  OWNERS,
  WORKSPACES,
} = require("../scripts/lib/fr-creative-route-contract");

const ROOT = path.resolve(__dirname, "..");

function schemasIn(html) {
  const schemas = [];
  for (const match of html.matchAll(
    /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  )) {
    schemas.push(JSON.parse(match[1]));
  }
  return schemas.flatMap((schema) => (Array.isArray(schema) ? schema : [schema]));
}

function schemaNodes(value) {
  if (!value || typeof value !== "object") return [];
  if (Array.isArray(value)) return value.flatMap(schemaNodes);
  return [
    value,
    ...Object.values(value).flatMap((child) => schemaNodes(child)),
  ];
}

test("French Creative physical route contract is exactly 46 + 33 + hub", () => {
  assert.equal(OWNERS.length, 46);
  assert.equal(WORKSPACES.length, 33);
  assert.equal(OWNERS.length + WORKSPACES.length + 1, 80);
});

test("all 24 named launchers own a French SoftwareApplication schema", () => {
  assert.equal(IN_LANGUAGE_LAUNCHERS.length, 24);
  for (const slug of IN_LANGUAGE_LAUNCHERS) {
    const relative = path.join("fr", "tools", slug, "index.html");
    const html = fs.readFileSync(path.join(ROOT, relative), "utf8");
    assert.match(html, /<html\b[^>]*\blang=["']fr["']/i, `${relative} language`);
    const softwareSchemas = schemasIn(html)
      .flatMap(schemaNodes)
      .filter((schema) => schema["@type"] === "SoftwareApplication");
    assert.ok(softwareSchemas.length > 0, `${relative} SoftwareApplication schema`);
    assert.ok(
      softwareSchemas.some((schema) => schema.inLanguage === "fr"),
      `${relative} SoftwareApplication inLanguage=fr`
    );
  }
});

test("Creative generators keep inLanguage in source ownership", () => {
  const owners = [
    "scripts/build-fr-creative-simple-native.js",
    "scripts/build-fr-creative-final-wave.js",
    "scripts/build-fr-creative-invoice-analytics.js",
    "scripts/generate-fr-tool-gap-pages.js",
  ];
  for (const owner of owners) {
    const source = fs.readFileSync(path.join(ROOT, owner), "utf8");
    assert.match(source, /inLanguage\s*[:=]/, `${owner} must own inLanguage`);
  }
});
