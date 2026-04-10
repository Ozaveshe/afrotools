const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const countries = ["nigeria", "kenya", "ghana", "uganda", "zambia", "tanzania"];

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

const main = read("tools/car-import-cost/index.html");
assert.ok(main.includes('id="carImportApp"'), "main route mounts app");
assert.ok(main.includes("WebApplication"), "main route WebApplication schema");
assert.ok(main.includes("FAQPage"), "main route FAQ schema");
assert.ok(main.includes("/assets/js/lib/car-import-cost-engine.js"), "main route engine script");
assert.ok(main.includes("/assets/js/car-import-cost.js"), "main route UI script");
assert.ok(main.includes("/tools/import-duty/"), "main route related import duty link");
assert.ok(main.includes("/tools/currency-converter/"), "main route related currency link");

for (const slug of countries) {
  const html = read(`tools/car-import-cost/${slug}/index.html`);
  assert.ok(html.includes('id="carImportApp"'), `${slug} app mount`);
  assert.ok(html.includes("FAQPage"), `${slug} FAQ schema`);
  assert.ok(html.includes("WebApplication"), `${slug} app schema`);
  assert.ok(html.includes("/assets/js/car-import-cost.js"), `${slug} UI script`);
  assert.ok(html.includes(`data-default-country=`), `${slug} default country`);
  assert.ok(html.includes("carImportSourceBlock"), `${slug} source verification block`);
  assert.ok(html.includes("/tools/import-duty/"), `${slug} related import duty`);
}

for (const slug of countries) {
  const html = read(`blog/car-import-cost-${slug}-guide/index.html`);
  assert.ok(html.includes("Article"), `${slug} guide Article schema`);
  assert.ok(html.includes("FAQPage"), `${slug} guide FAQ schema`);
  assert.ok(html.includes(`/tools/car-import-cost/${slug}/`), `${slug} guide calculator link`);
}

const admin = read("admin/car-import-cost-rules.html");
assert.ok(admin.includes("carImportCostRulePacksOverride"), "admin override storage");
assert.ok(admin.includes("CSV valuation upload path"), "admin CSV path");
assert.ok(admin.includes("Preview calculation"), "admin preview");

console.log("car-import-cost-routes.test.js passed");
