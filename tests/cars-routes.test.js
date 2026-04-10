const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const countries = ["nigeria", "kenya", "ghana", "uganda", "zambia", "tanzania"];

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function exists(file) {
  assert.ok(fs.existsSync(path.join(root, file)), `${file} exists`);
}

exists("cars/index.html");
exists("cars/compare/index.html");
for (const country of countries) exists(`cars/${country}/index.html`);

const routeExamples = [
  "cars/nigeria/toyota/camry/2005/index.html",
  "cars/kenya/toyota/axio/2018/index.html",
  "cars/ghana/honda/cr-v/2016/index.html",
  "cars/uganda/mazda/demio/2017/index.html",
  "cars/zambia/toyota/hilux/2015/index.html",
  "cars/tanzania/toyota/noah/2014/index.html",
  "cars/tanzania/mercedes-benz/g-wagon/2022/index.html",
  "cars/import-vs-local/ghana/toyota/camry/2005/index.html"
];

for (const route of routeExamples) {
  exists(route);
  const html = read(route);
  assert.ok(html.includes('id="carsApp"'), `${route}: app mount`);
  assert.ok(html.includes("WebApplication"), `${route}: WebApplication schema`);
  assert.ok(html.includes("FAQPage"), `${route}: FAQ schema`);
  assert.ok(html.includes("BreadcrumbList"), `${route}: breadcrumb schema`);
  assert.ok(html.includes("/assets/js/lib/car-price-intelligence.js"), `${route}: price engine script`);
  assert.ok(html.includes("/assets/js/cars-directory.js"), `${route}: UI script`);
  assert.ok(html.includes("/assets/css/cars-directory.css"), `${route}: CSS`);
}

const main = read("cars/index.html");
assert.ok(main.includes("African Car Price Directory"), "main directory title");
assert.ok(main.includes("/assets/js/lib/car-import-cost-engine.js"), "main route reuses landed-cost engine");

const admin = read("admin/car-price-intelligence.html");
assert.ok(admin.includes("carPriceIntelligenceOverride"), "admin preview override");
assert.ok(admin.includes("CSV import/update path"), "admin CSV path");
assert.ok(admin.includes("Preview a page/result"), "admin preview");

const transport = read("transport/index.html");
assert.ok(transport.includes("/cars/"), "transport hub links car directory");
assert.ok(transport.includes("/tools/car-import-cost/"), "transport hub links landed cost calculator");

const sitemap = read("sitemap-cars.xml");
assert.ok(sitemap.includes("https://afrotools.com/cars/ghana/toyota/camry/2005/"), "car sitemap detail route");
assert.ok(read("sitemap-index.xml").includes("sitemap-cars.xml"), "sitemap index includes cars sitemap");

console.log("cars-routes.test.js passed");
