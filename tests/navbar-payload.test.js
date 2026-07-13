"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(ROOT, "assets/js/components/navbar.js"), "utf8");
const minified = fs.readFileSync(path.join(ROOT, "assets/js/components/navbar.min.js"));
const data = JSON.parse(fs.readFileSync(path.join(ROOT, "assets/js/components/navbar-data.json"), "utf8"));

assert(!source.includes("THEME_STANDARD_CSS"), "navbar must not embed the document theme stylesheet");
assert(!source.includes("const CSS = `"), "navbar Shadow DOM CSS must be an external asset");
assert(source.includes("NAVBAR_TOP_LEVEL_DATA_START"), "navbar must keep generated top-level category data inline");
assert(source.includes("fetch(NAV_DATA_URL"), "navbar must lazy-fetch its detailed navigation data");
assert(source.includes("prepareForOpen"), "opening a navbar surface must trigger detailed data loading");
assert(Array.isArray(data.navItems) && data.navItems.length >= 30, "generated navbar data must contain all categories");
assert(
  data.navItems.reduce((count, item) => count + (item.tools || []).length, 0) >= 400,
  "generated navbar data must contain the detailed tool links"
);
assert(minified.length < 100 * 1024, `navbar.min.js must remain below 100KB (found ${minified.length} bytes)`);

console.log(`navbar payload: PASS (${minified.length} byte shell; ${data.navItems.length} lazy categories)`);
