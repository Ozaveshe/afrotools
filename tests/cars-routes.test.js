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

const admin = read("admin/car-price-intelligence.html");

assert.ok(admin.includes("carPriceIntelligenceOverride"), "admin preview override"),
assert.ok(admin.includes("CSV import/update path"), "admin CSV path"), assert.ok(admin.includes("Preview a page/result"), "admin preview");

const transport = read("transport/index.html");

assert.ok(transport.includes("/cars/"), "transport hub links car directory"), assert.ok(transport.includes("/tools/car-import-cost/"), "transport hub links landed cost calculator");

const sitemap = read("sitemap-cars.xml");

assert.ok(sitemap.includes("https://afrotools.com/cars/ghana/toyota/camry/2005/"), "car sitemap detail route"),
assert.ok(sitemap.includes("https://afrotools.com/cars/south-africa/toyota/corolla/2018/"), "car sitemap includes expanded market detail route"),
assert.ok(read("sitemap-index.xml").includes("sitemap-cars.xml"), "sitemap index includes cars sitemap"),
console.log("cars-routes.test.js passed");
