#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const englishFile = path.join(root, "tools", "brideprice-advisor", "index.html");
const jsonFile = path.join(root, "data", "uniquely-african", "brideprice-data.json");
const browserFile = path.join(root, "assets", "js", "data", "brideprice-data.js");
const browserRoute = "/assets/js/data/brideprice-data.js";

function findObject(source) {
  const marker = "var DATA={";
  const start = source.indexOf(marker);
  if (start < 0) return null;
  const objectStart = start + marker.length - 1;
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let index = objectStart; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === "'" || char === '"') quote = char;
    else if (char === "{") depth += 1;
    else if (char === "}") {
      depth -= 1;
      if (depth === 0) return { start, end: index + 1, literal: source.slice(objectStart, index + 1) };
    }
  }
  throw new Error("Unbalanced bride-price DATA object");
}

function browserSource(data) {
  return `(function(root){\n  "use strict";\n  root.AfroToolsBridePriceData = ${JSON.stringify(data, null, 2)};\n})(window);\n`;
}

function readCanonical() {
  return JSON.parse(fs.readFileSync(jsonFile, "utf8"));
}

function validate(data) {
  const countries = Object.keys(data);
  const cultures = countries.reduce((sum, code) => sum + data[code].length, 0);
  if (countries.length !== 8 || cultures !== 13) {
    throw new Error(`Expected 8 country groups and 13 cultural contracts, found ${countries.length}/${cultures}`);
  }
  for (const code of countries) {
    for (const culture of data[code]) {
      if (!culture.name || !culture.localName || !culture.curr || !culture.total || !Number.isFinite(culture.totalAvg)) {
        throw new Error(`${code}: incomplete culture contract`);
      }
      if (!Array.isArray(culture.items) || !culture.items.length || culture.items.some((item) => !item.n || !item.r || !Number.isFinite(item.avg))) {
        throw new Error(`${code}/${culture.name}: incomplete item contract`);
      }
    }
  }
  return { countries: countries.length, cultures };
}

function writeIfChanged(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  if (fs.existsSync(file) && fs.readFileSync(file, "utf8") === value) return false;
  fs.writeFileSync(file, value);
  return true;
}

const mode = process.argv.includes("--extract-and-migrate") ? "extract" : "check";
let english = fs.readFileSync(englishFile, "utf8");
let data;
let migrated = false;

if (mode === "extract") {
  const found = findObject(english);
  if (found) {
    data = vm.runInNewContext(`(${found.literal})`, Object.create(null), { timeout: 1000 });
    english = english.slice(0, found.start) + "var DATA=window.AfroToolsBridePriceData;\n" + english.slice(found.end);
    if (!english.includes(`src="${browserRoute}"`)) {
      const insertion = english.lastIndexOf("<script>", found.start);
      if (insertion < 0) throw new Error("Could not locate English bride-price controller script");
      english = english.slice(0, insertion) + `<script src="${browserRoute}"></script>\n` + english.slice(insertion);
    }
    migrated = writeIfChanged(englishFile, english);
    writeIfChanged(jsonFile, `${JSON.stringify(data, null, 2)}\n`);
  } else {
    data = readCanonical();
  }
} else {
  data = readCanonical();
  if (findObject(english)) throw new Error("English bride-price page still owns an inline DATA object");
  if (!english.includes(`src="${browserRoute}"`) || !english.includes("var DATA=window.AfroToolsBridePriceData;")) {
    throw new Error("English bride-price page does not consume the canonical browser data owner");
  }
}

const counts = validate(data);
const browserChanged = writeIfChanged(browserFile, browserSource(data));
console.log(JSON.stringify({ mode, ...counts, migrated, browserChanged }, null, 2));
