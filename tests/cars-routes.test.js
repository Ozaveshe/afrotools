const assert = require("assert"), fs = require("fs"), path = require("path"), root = path.join(__dirname, ".."), data = JSON.parse(fs.readFileSync(path.join(root, "data/cars/price-intelligence.json"), "utf8")), countries = Object.values(data.countries).filter(s => !1 !== s.directory_enabled);

function read(s) {
    return fs.readFileSync(path.join(root, s), "utf8");
}

function exists(s) {
    assert.ok(fs.existsSync(path.join(root, s)), `${s} exists`);
}

exists("cars/index.html"), exists("cars/compare/index.html"), assert.strictEqual(countries.length, 20, "20 car country routes expected");

for (const s of countries) exists(`cars/${s.slug}/index.html`);

const routeExamples = [ "cars/nigeria/toyota/camry/2005/index.html", "cars/kenya/toyota/axio/2018/index.html", "cars/ghana/honda/cr-v/2016/index.html", "cars/uganda/mazda/demio/2017/index.html", "cars/zambia/toyota/hilux/2015/index.html", "cars/tanzania/toyota/noah/2014/index.html", "cars/south-africa/toyota/corolla/2018/index.html", "cars/egypt/toyota/camry/2012/index.html", "cars/cote-divoire/toyota/camry/2005/index.html", "cars/import-vs-local/south-africa/toyota/corolla/2018/index.html" ];

for (const s of routeExamples) {
    exists(s);
    const e = read(s);
    assert.ok(e.includes('id="carsApp"'), `${s}: app mount`), assert.ok(e.includes("WebApplication"), `${s}: WebApplication schema`),
    assert.ok(e.includes("cars-static-summary"), `${s}: server-rendered summary`), assert.ok(e.includes("BreadcrumbList"), `${s}: breadcrumb schema`),
    assert.ok(e.includes("/assets/js/lib/car-price-intelligence.js"), `${s}: price engine script`),
    assert.ok(e.includes("/assets/js/cars-directory.js"), `${s}: UI script`), assert.ok(/\/assets\/css\/design-system(?:\.min)?\.css/.test(e), `${s}: design system CSS`),
    assert.ok(e.includes("/assets/css/cars-directory.css"), `${s}: cars CSS`);
}

const ivl = read("cars/import-vs-local/south-africa/toyota/corolla/2018/index.html");

assert.ok(ivl.includes("noindex, follow"), "import-vs-local noindex"), assert.ok(ivl.includes("https://afrotools.com/cars/south-africa/toyota/corolla/2018/"), "import-vs-local canonical to vehicle page"),
assert.ok(read("cars/nigeria/index.html").includes("FAQPage"), "country page FAQ schema"),
assert.ok(!read("sitemap-cars.xml").includes("/cars/import-vs-local/"), "import-vs-local excluded from sitemap");

const main = read("cars/index.html");

assert.ok(main.includes("African Car Price Directory"), "main directory title"),
assert.ok(main.includes("African markets"), "main directory local-market description"),
assert.ok(main.includes("/assets/js/lib/car-import-cost-engine.js"), "main route reuses landed-cost engine");
assert.ok(main.includes('id="carsCatalogForm"'), "main directory offers the wider model catalog");
assert.strictEqual((main.match(/data-make="/g) || []).length, 481, "all 25 starter and 456 additional model/year options are searchable from the car directory");
assert.ok(main.includes("/assets/js/pages/car-catalog-search.js"), "model search has an editable import-cost handoff");

const admin = read("admin/car-price-intelligence.html");

assert.ok(admin.includes("carPriceIntelligenceOverride"), "admin preview override"),
assert.ok(admin.includes("CSV import/update path"), "admin CSV path"), assert.ok(admin.includes("Preview a page/result"), "admin preview");

const transport = read("transport/index.html");

assert.ok(transport.includes("/cars/"), "transport hub links car directory"), assert.ok(transport.includes("/tools/car-import-cost/"), "transport hub links landed cost calculator");

const sitemap = read("sitemap-cars.xml");

const observations = JSON.parse(read("data/cars/market-observations.json")).observations;
const corolla = read("cars/nigeria/toyota/corolla/2018/index.html");
assert.ok(corolla.includes("asking prices in Lagos State"), "observed page explains the dated local sample");
assert.ok(corolla.includes("Estimate import cost for this car"), "observed page links to the supported calculator");
assert.ok(corolla.includes("toyota-corolla-2018-hero.webp"), "observed page uses its existing model image");
assert.ok(corolla.includes('content="index, follow"'), "observed detail is indexable");
assert.ok(sitemap.includes("https://afrotools.com/cars/nigeria/toyota/corolla/2018/"), "observed detail is in car sitemap");
assert.ok(!sitemap.includes("https://afrotools.com/cars/ghana/toyota/camry/2005/"), "unobserved detail stays out of sitemap");
assert.ok(!sitemap.includes("https://afrotools.com/cars/south-africa/toyota/corolla/2018/"), "directory-only detail stays out of sitemap");
assert.ok(!sitemap.includes("https://afrotools.com/cars/south-africa/"), "country without a sourced local price stays out of sitemap");
assert.ok(read("cars/south-africa/index.html").includes('content="noindex, follow"'), "unobserved country hub remains browsable but noindex");
assert.ok(read("cars/south-africa/toyota/corolla/2018/index.html").includes('content="noindex, follow"'), "unobserved detail is noindex");
assert.ok(read("cars/nigeria/toyota/index.html").includes('content="noindex, follow"'), "thin make page is noindex");
assert.strictEqual((sitemap.match(/<url>/g) || []).length, 2 + observations.length, "sitemap includes root, observed country, and observed details only");
assert.ok(read("sitemap-index.xml").includes("sitemap-cars.xml"), "sitemap index includes cars sitemap");
console.log("cars-routes.test.js passed");
