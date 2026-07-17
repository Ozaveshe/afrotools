#!/usr/bin/env node
"use strict";

const assert = require("assert");
const { syncContent } = require("../scripts/sync-yoruba-fallbacks");

const record = {
  state: "english-fallback",
  fallbackRoute: "/tools/example/",
  sourceOwner: "yo/awon-ise/example/index.html"
};

const input = [
  "<!doctype html>",
  "<html><head>",
  '<meta name="robots" content="index, follow">',
  '<link rel="canonical" href="https://afrotools.com/yo/awon-ise/example/">',
  "</head><body><main>Example</main></body></html>"
].join("\n");

const first = syncContent(input, record);
const second = syncContent(first, record);

assert.strictEqual(second, first, "Yoruba fallback synchronization must be idempotent");
assert.match(
  first,
  /data-yoruba-fallback-style>\n<link rel="canonical"/,
  "The fallback stylesheet must remain before route-contract metadata"
);

const cacheBusted = first.replace(
  "/assets/css/yoruba-fallback.css",
  "/assets/css/yoruba-fallback.css?v=72ea27b7"
);
const normalizedCacheBusted = syncContent(cacheBusted, record);
assert.strictEqual(
  (normalizedCacheBusted.match(/data-yoruba-fallback-style/g) || []).length,
  1,
  "Cache-busted fallback stylesheets must be normalized instead of duplicated"
);

console.log("Yoruba fallback sync tests passed.");
