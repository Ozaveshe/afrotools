"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { createRequire } = require("node:module");
const root = path.join(__dirname, "..");
const filename = path.join(root, "scripts/generate-car-price-pages.js");

function render(removeEvidence) {
  const writes = new Map();
  const localRequire = createRequire(filename);
  const virtualFs = {
    ...fs,
    mkdirSync() {},
    writeFileSync(file, content) { writes.set(path.relative(root, file).replaceAll("\\", "/"), String(content)); },
    readFileSync(file, encoding) {
      const contents = fs.readFileSync(file, encoding);
      if (removeEvidence && path.basename(file) === "market-observations.json") {
        const data = JSON.parse(contents);
        data.observations = data.observations.filter(row => row.vehicleId !== "mercedes-e-class-2017");
        return JSON.stringify(data);
      }
      return contents;
    }
  };
  vm.runInNewContext(fs.readFileSync(filename, "utf8"), {
    require: id => id === "fs" ? virtualFs : localRequire(id),
    __dirname: path.dirname(filename), process: { argv: ["node", filename] }, console: { log() {} },
    Buffer, URL, URLSearchParams
  }, { filename });
  return writes;
}

test("Nigeria Mercedes evidence page is crawlable without indexing unrelated make/model shells", () => {
  const pages = render(false);
  const html = pages.get("cars/nigeria/mercedes-benz/index.html");
  assert.match(html, /content="index, follow"/);
  assert.equal((html.match(/rel="canonical"/g) || []).length, 1);
  assert.match(pages.get("sitemap-cars.xml"), /<loc>https:\/\/afrotools.com\/cars\/nigeria\/mercedes-benz\/<\/loc>/);
  for (const token of ["2026-09-27", "2017 Mercedes-Benz E300", "NGN 34,100,000", "2026-10-22", "not a market range", "jiji.ng/lagos/cars/mercedes-benz-e300-2017", "Open E-Class prices and import options"]) assert(html.includes(token), token);
  assert(html.indexOf('id="ng-mercedes-prices-title"') < html.indexOf('id="carsApp"'));
  for (const route of ["cars/kenya/mercedes-benz/index.html", "cars/nigeria/mercedes-benz/c-class/index.html", "cars/nigeria/ford/index.html"]) assert.match(pages.get(route), /content="noindex, follow"/, route);
});

test("removing the reviewed local sample removes indexing eligibility and sitemap entry", () => {
  const pages = render(true);
  assert.match(pages.get("cars/nigeria/mercedes-benz/index.html"), /content="noindex, follow"/);
  assert(!pages.get("sitemap-cars.xml").includes("<loc>https://afrotools.com/cars/nigeria/mercedes-benz/</loc>"));
});
