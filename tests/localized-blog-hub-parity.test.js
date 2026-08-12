"use strict";
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const root = path.resolve(__dirname, "..");
execFileSync(process.execPath, [path.join(root, "scripts", "build-localized-blog-hubs.js")], { cwd: root, stdio: "inherit" });
for (const [locale, file, minimum] of [["fr", "fr/blog/index.html", 28], ["sw", "sw/blogu/index.html", 12]]) {
  const html = fs.readFileSync(path.join(root, file), "utf8");
  assert.match(html, new RegExp(`<html\\b[^>]*\\blang=["']${locale}["']`, "i"));
  assert.match(html, /afrotools-source-owner[^>]+build-localized-blog-hubs\.js/);
  assert.match(html, /<meta\b[^>]*name=["']description["']/i);
  assert.match(html, /<meta\b[^>]*property=["']og:image["']/i);
  assert.match(html, /"@type":"Blog"/);
  assert.match(html, /"@type":"FAQPage"/);
  assert.match(html, /id="blogSearch"/);
  assert.match(html, /id="blogCategory"/);
  assert.match(html, /aria-live="polite"/);
  assert.ok((html.match(/data-blog-card/g) || []).length >= minimum);
  assert.ok((html.match(/<details>/g) || []).length >= 5);
  assert.ok(((html.match(/<h2\b/g) || []).length + (html.match(/<h3\b/g) || []).length) >= minimum + 4);
}
console.log("Localized French/Swahili blog hub contract passed.");
