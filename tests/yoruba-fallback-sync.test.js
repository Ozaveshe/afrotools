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

const unavailable = syncContent(input, { ...record, state: "unavailable", fallbackRoute: undefined });
const withNav = input.replace('<body>', '<body><afro-navbar active="tools"></afro-navbar>');
const navResult = syncContent(withNav, record);
assert.ok(navResult.indexOf('</afro-navbar>') < navResult.indexOf('<!-- yoruba-fallback:start -->'), 'Notice must not displace the fixed mobile menu from its navbar');
assert.strictEqual(syncContent(navResult, record), navResult);
assert.match(unavailable, /href="\/yo\/awon-ise\/"/);
assert.doesNotMatch(unavailable, /href="undefined"|hreflang="en"/);
assert.strictEqual(syncContent(unavailable, { ...record, state: "unavailable", fallbackRoute: undefined }), unavailable);
for (const fallbackRoute of [undefined, "", "//example.com/", '" onclick="alert(1)']) {
  assert.throws(() => syncContent(input, { ...record, fallbackRoute }), /valid local English fallback route/);
}
console.log("Yoruba fallback sync tests passed.");
