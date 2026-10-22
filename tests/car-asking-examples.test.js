"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { createRequire } = require("node:module");
const root = path.resolve(__dirname, "..");
const generator = path.join(root, "scripts/generate-car-price-pages.js");
const source = fs.readFileSync(generator, "utf8");
const boundary = '\nif (process.argv.includes("--catalog-only")) {';
assert.equal(source.split(boundary).length, 2, "use the real declaration boundary before any generator write");
function load(examples) {
  const realRequire = createRequire(generator);
  const readOnlyFs = Object.freeze({
    existsSync: fs.existsSync,
    readFileSync(file, encoding) {
      if (examples && file === path.join(root, "data/cars/asking-price-examples.json")) return JSON.stringify({ examples });
      return fs.readFileSync(file, encoding);
    }
  });
  return vm.runInNewContext(source.split(boundary)[0] + '\n({ askingExamplesHTML, staticContentHTML, html, data });', {
    __dirname: path.dirname(generator),
    require(id) { return id === "fs" ? readOnlyFs : realRequire(id); },
    URL
  }, { timeout: 10000 });
}
const api = load();
const vehicle = api.data.vehicles.find((row) => row.id === "mercedes-g-wagon-2022");
const ng = api.data.countries.NG;
const ledger = JSON.parse(fs.readFileSync(path.join(root, "data/cars/asking-price-examples.json"), "utf8"));

test("three dated asking ads retain their individual amount, trim, condition and location", () => {
  assert.equal(ledger.schemaVersion, 1);
  assert.deepEqual(ledger.examples.map((row) => [row.area, row.city, row.askingPrice]), [
    ["Asokoro", "Abuja", 260000000], ["Jahi", "Abuja", 315000000], ["Lekki", "Lagos", 294000000]
  ]);
  for (const row of ledger.examples) {
    assert.equal(row.modelYear, 2022);
    assert.equal(row.variant, "Mercedes-AMG G 63");
    assert.equal(row.condition, "Foreign Used");
    assert.equal(row.currency, "NGN");
    assert.equal(row.observedDate, "2026-10-22");
    assert.equal(row.sourcePublishedAt, null);
    assert.equal(row.sellerClaimsVerified, false);
    assert.equal(row.availabilityConfirmed, false);
  }
});

test("generated examples preserve three exact Jiji links and label their evidence limits", () => {
  const html = api.askingExamplesHTML(ng, vehicle);
  const urls = [
    "https://jiji.ng/asokoro/cars/mercedes-benz-g-class-g-63-amg-2022-black-kk6G4z7wgeFOt7Ahe4RXYUw8.html",
    "https://jiji.ng/jahi/cars/mercedes-benz-g-class-g-63-amg-2022-gray-969bvoDvBmiejkCPKewRCHxL.html",
    "https://jiji.ng/lekki/cars/mercedes-benz-g-class-g-63-amg-2022-gray-66oE5enpAZbahr6U4ObXTKeD.html"
  ];
  for (const url of urls) assert.ok(html.includes(`href="${url}" target="_blank" rel="noopener noreferrer"`));
  assert.equal((html.match(/datetime="2026-10-22"/g) || []).length, 3);
  assert.doesNotMatch(html, /Ad publication date not known/);
  for (const price of ["260,000,000", "315,000,000", "294,000,000"]) assert.ok(html.includes(`NGN ${price} asking`));
  assert.match(html, /not completed sales or a market valuation/);
  assert.match(html, /G550 listings are not included/);
  assert.match(html, /Seller-stated year, trim and condition. Check the listing for its current price and availability./);
  assert.doesNotMatch(html, /median|middle half|6300|sold for/i);
});

test("examples do not leak to another country, model or model year", () => {
  for (const country of Object.values(api.data.countries)) {
    for (const candidate of api.data.vehicles) {
      assert.equal(Boolean(api.askingExamplesHTML(country, candidate)), country.code === "NG" && candidate.id === vehicle.id && candidate.year === 2022);
    }
  }
  assert.equal(api.askingExamplesHTML(ng, { ...vehicle, year: 2021 }), "");
});

test("real vehicle and import/local generator sections put asking evidence before the older budget", () => {
  for (const pageType of ["vehicle", "import-vs-local"]) {
    const html = api.staticContentHTML({ pageType, countryObj: ng, vehicleObj: vehicle });
    assert.ok(!html.includes('id="asking-examples"'), "static planning content does not duplicate top evidence");
    assert.match(html, /AfroTools planning estimate updated 2026-03-08/);
    const page = api.html("cars/nigeria/mercedes-benz/g-wagon/2022", {
      pageType, countryObj: ng, vehicleObj: vehicle, title: "G63 evidence", description: "Selected asks"
    });
    assert.ok(page.indexOf('id="asking-examples"') < page.indexOf('id="carsApp"'), "the full dated asking section precedes the existing long buyer report");
    assert.equal((page.match(/id="asking-examples"/g) || []).length, 1);
    assert.ok(!page.includes('data-asking-examples-link'), "redundant jump link removed");
  }
});

test("seller text is escaped and unsafe links, wrong variants and invented publication dates fail closed", () => {
  const row = { ...ledger.examples[0], area: '<script>bad</script>"&' };
  const html = load([row]).askingExamplesHTML(ng, vehicle);
  assert.ok(html.includes("&lt;script&gt;bad&lt;/script&gt;&quot;&amp;"));
  assert.ok(!html.includes("<script>bad"));
  for (const delta of [
    { sourceUrl: "javascript:alert(1)" }, { sourceUrl: "https://outside.example/cars/offer.html" },
    { sourceUrl: "https://jiji.ng@outside.example/asokoro/cars/offer.html" },
    { variant: "G550" }, { askingPrice: NaN }, { sourcePublishedAt: "2026-10-22" },
    { availabilityConfirmed: true }, { sellerClaimsVerified: true }
  ]) assert.throws(() => load([{ ...row, ...delta }]).askingExamplesHTML(ng, vehicle));
});
