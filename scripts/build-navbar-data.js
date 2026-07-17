#!/usr/bin/env node
"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { renameSyncWithRetry, writeFileSyncWithRetry } = require("./lib/safe-write");

const ROOT = path.resolve(__dirname, "..");
const NAVBAR_SOURCE_PATH = path.join(ROOT, "assets", "js", "components", "navbar.js");
const NAVBAR_CSS_PATH = path.join(ROOT, "assets", "css", "navbar.css");
const NAVBAR_MIN_CSS_PATH = path.join(ROOT, "assets", "css", "navbar.min.css");
const DATA_SOURCE_PATH = path.join(ROOT, "data", "navigation", "navbar-data.json");
const DATA_OUTPUT_PATH = path.join(ROOT, "assets", "js", "components", "navbar-data.json");

const TOP_LEVEL_START = "  // NAVBAR_TOP_LEVEL_DATA_START";
const TOP_LEVEL_END = "  // NAVBAR_TOP_LEVEL_DATA_END";
const CSS_HREF_START = "  // NAVBAR_CSS_HREF_START";
const CSS_HREF_END = "  // NAVBAR_CSS_HREF_END";

function writeAtomically(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tempPath = path.join(path.dirname(filePath), `.${path.basename(filePath)}.${process.pid}.${Date.now()}.tmp`);
  try {
    writeFileSyncWithRetry(tempPath, content, "utf8");
    renameSyncWithRetry(tempPath, filePath);
  } finally {
    try {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    } catch {}
  }
}

function writeIfChanged(filePath, content) {
  if (fs.existsSync(filePath) && fs.readFileSync(filePath, "utf8") === content) return false;
  writeAtomically(filePath, content);
  return true;
}

function minifyCss(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([{}:;,>~+])\s*/g, "$1")
    .replace(/;}/g, "}")
    .trim();
}

function replaceGeneratedBlock(source, startMarker, endMarker, body) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);
  if (start < 0 || end < 0) throw new Error(`Generated block missing: ${startMarker}`);
  return source.slice(0, start + startMarker.length) + `\n${body}\n` + source.slice(end);
}

function buildNavbarData() {
  if (!fs.existsSync(DATA_SOURCE_PATH)) throw new Error("Missing data/navigation/navbar-data.json");
  if (!fs.existsSync(NAVBAR_CSS_PATH)) throw new Error("Missing assets/css/navbar.css");

  const data = JSON.parse(fs.readFileSync(DATA_SOURCE_PATH, "utf8"));
  if (data.schemaVersion !== 1 || !Array.isArray(data.navItems)) throw new Error("Invalid navbar data schema");

  const output = `${JSON.stringify(data)}\n`;
  const outputChanged = writeIfChanged(DATA_OUTPUT_PATH, output);
  const hrefCount = (output.match(/"href(?:Fr|Sw|Ha|Yo)?":/g) || []).length;

  const navbarCss = minifyCss(fs.readFileSync(NAVBAR_CSS_PATH, "utf8"));
  const cssChanged = writeIfChanged(NAVBAR_MIN_CSS_PATH, navbarCss);
  const cssHash = crypto.createHash("md5").update(navbarCss.replace(/\r\n?/g, "\n")).digest("hex").slice(0, 8);

  const topLevelItems = data.navItems.map((item) => Object.fromEntries(
    Object.entries(item).filter(([key]) => !/^tools(?:Fr|Sw|Ha|Yo)?$/.test(key))
  ));
  let navbarSource = fs.readFileSync(NAVBAR_SOURCE_PATH, "utf8");
  navbarSource = replaceGeneratedBlock(
    navbarSource,
    TOP_LEVEL_START,
    TOP_LEVEL_END,
    `  let NAV_ITEMS = ${JSON.stringify(topLevelItems, null, 2).replace(/\n/g, "\n  ")};`
  );
  navbarSource = replaceGeneratedBlock(
    navbarSource,
    CSS_HREF_START,
    CSS_HREF_END,
    `  const NAVBAR_CSS_HREF = '/assets/css/navbar.min.css?v=${cssHash}';`
  );
  const sourceChanged = writeIfChanged(NAVBAR_SOURCE_PATH, navbarSource);

  console.log(`  NAVDATA ${data.navItems.length} categories, ${hrefCount} hrefs, ${Buffer.byteLength(output)} bytes`);
  console.log(`  NAVCSS  ${Buffer.byteLength(navbarCss)} bytes, v=${cssHash}`);
  return { outputChanged, cssChanged, sourceChanged, hrefCount, cssHash };
}

if (require.main === module) {
  try {
    buildNavbarData();
  } catch (error) {
    console.error(`  NAVDATA ERROR ${error.message}`);
    process.exit(1);
  }
}

module.exports = { buildNavbarData };
