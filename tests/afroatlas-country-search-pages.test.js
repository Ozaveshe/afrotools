"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const directory = path.join(root, "tools", "afroatlas", "country");
const pages = fs.readdirSync(directory, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(directory, entry.name, "index.html")));

assert.strictEqual(pages.length, 54, "AfroAtlas must retain all 54 country route owners");
for (const entry of pages) {
  const file = path.join(directory, entry.name, "index.html");
  const html = fs.readFileSync(file, "utf8");
  const routeUrl = `https://afrotools.com/tools/afroatlas/country/${entry.name}/`;
  const descriptionTag = html.match(/<meta\b[^>]*name=["']description["'][^>]*>/i)?.[0] || "";
  const description = descriptionTag.match(/\bcontent=(["'])([\s\S]*?)\1/i)?.[2] || "";
  assert.match(html, /<meta name="robots" content="index, follow">/, file + " must remain indexable");
  assert.ok(html.includes(`<link rel="canonical" href="${routeUrl}">`), file + " must self-canonicalize");
  assert.ok(html.includes(`<meta property="og:url" content="${routeUrl}">`), file + " must align OG URL");
  assert.ok(description.length >= 70 && description.length <= 180, file + " description must fit the useful snippet range");
}

console.log("AfroAtlas country search pages verified: 54");
