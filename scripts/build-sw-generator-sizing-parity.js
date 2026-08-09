"use strict";
const fs = require("fs"),
  path = require("path"),
  app = require("./lib/sw-generator-sizing-contract.js"),
  root = path.resolve(__dirname, ".."),
  sw = fs.readFileSync(path.join(root, app.file), "utf8"),
  compactSw = sw.replace(/\s+/g, " "),
  en = fs.readFileSync(path.join(root, app.englishFile), "utf8");
for (const token of [
  app.engine,
  "sw-generator-sizing-parity.js",
  'data-swg-export="json"',
  'data-swg-export="csv"',
  'data-swg-export="txt"',
  'data-swg-export="pdf"',
  `hreflang="en" href="https://afrotools.com${app.englishRoute}"`,
  `hreflang="fr" href="https://afrotools.com${app.frenchRoute}"`,
  `hreflang="sw" href="https://afrotools.com${app.swRoute}"`,
  app.image,
])
  if (!compactSw.includes(token))
    throw new Error(`Swahili generator owner missing ${token}`);
if (!en.includes(app.engine))
  throw new Error("English generator route does not consume shared engine.");
console.log(`checked ${app.id}: ${app.englishRoute} -> ${app.swRoute}`);
