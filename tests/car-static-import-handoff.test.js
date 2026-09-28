const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..");
const data = JSON.parse(fs.readFileSync(path.join(root, "data/cars/price-intelligence.json"), "utf8"));
const observations = JSON.parse(fs.readFileSync(path.join(root, "data/cars/market-observations.json"), "utf8")).observations;
const rules = JSON.parse(fs.readFileSync(path.join(root, "data/trade/car-import-cost-ng.json"), "utf8")).ageRules;

for (const observation of observations) {
  const country = Object.values(data.countries).find(item => item.code === observation.countryCode);
  const vehicle = data.vehicles.find(item => item.id === observation.vehicleId);
  test("static import handoff preserves " + observation.countryCode + " " + observation.vehicleId, () => {
    const file = path.join(root, "cars", country.slug, vehicle.makeSlug, vehicle.modelSlug, String(vehicle.year), "index.html");
    const html = fs.readFileSync(file, "utf8");
    const links = [...html.matchAll(/<a href="([^"]+)">Estimate import cost for this car<\/a>/g)];
    const restricted = country.code === "NG" && new Date().getUTCFullYear() - vehicle.year >= rules.maxYearsExclusive;
    if (!country.import_enabled || restricted) {
      assert.equal(links.length, 0, "Unsupported or age-restricted profiles must not expose an import action");
      return;
    }
    assert.equal(links.length, 1);
    const url = new URL(links[0][1].replaceAll("&amp;", "&"), "https://afrotools.com");
    assert.equal(url.pathname, "/tools/car-import-cost/" + country.slug + "/");
    assert.equal(url.searchParams.get("country"), country.code);
    assert.equal(url.searchParams.get("make"), vehicle.make);
    assert.equal(url.searchParams.get("year"), String(vehicle.year));
    const [minimum, maximum = minimum] = vehicle.cc;
    assert.equal(Number(url.searchParams.get("engineCc")), Math.round((minimum + maximum) / 2), "Engine capacity must use the selected profile, not the form default");
  });
}
