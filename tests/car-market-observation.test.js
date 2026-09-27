const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const ImportEngine = require("../assets/js/lib/car-import-cost-engine.js");
const Price = require("../assets/js/lib/car-price-intelligence.js");

const root = path.join(__dirname, "..");
const read = (file) => JSON.parse(readFileSync(path.join(root, file), "utf8"));
const data = read("data/cars/price-intelligence.json");
const observations = read("data/cars/market-observations.json").observations;
const observation = observations.find((item) => item.vehicleId === "toyota-corolla-2018" && item.countryCode === "NG");
assert.ok(observation, "Nigeria Corolla observation exists");
const vehicle = data.vehicles.find((item) => item.id === observation.vehicleId);
const forex = read("data/forex/latest.json");
const importData = ImportEngine.mergeData(
  read("data/trade/car-import-cost-core.json"),
  ["ng", "ke", "gh", "ug", "zm", "tz"].map((country) => read(`data/trade/car-import-cost-${country}.json`)),
  forex.rates
);

assert.ok(vehicle, "market observation matches a catalog vehicle");
assert.ok(observation.lowerQuartile < observation.median && observation.median < observation.upperQuartile);
assert.match(observation.sourceUrl, /^https:\/\/jiji\.ng\/lagos\/cars\//);
assert.ok(observations.length >= 10, "the dated Nigeria marketplace sample set has expanded");
assert.ok(observations.every((item) => item.sampleSize >= 3 && item.sourceUrl && item.reviewedAt && item.method && item.limitations));
for (const vehicleId of ["mercedes-e-class-2017", "lexus-rx-2017", "lexus-es-2016"]) {
  assert.ok(observations.some((item) => item.vehicleId === vehicleId && item.countryCode === "NG" && item.sampleVariant), `${vehicleId} identifies the sampled trim`);
}
assert.equal(observation.corroboratingSources[0].sampleSize, 9, "Autochek year-filtered check is recorded separately");
assert.equal(observations.find((item) => item.vehicleId === "lexus-es-2016").corroboratingSources[0].sampleSize, 5, "the Lagos Autochek ES check stays separate from the Jiji sample");
const oldCamryObservation = observations.find((item) => item.vehicleId === "toyota-camry-2005" && item.countryCode === "NG");
assert.equal(oldCamryObservation.condition, "Local Used");
assert.equal(oldCamryObservation.sampleSize, 10);
assert.equal(oldCamryObservation.median, 4600000);

const withObservation = structuredClone(data);
withObservation.localMarketPrices.push({
  country_code: observation.countryCode,
  make: vehicle.make,
  model: vehicle.model,
  year: vehicle.year,
  min_ask: observation.lowerQuartile,
  median_ask: observation.median,
  max_ask: observation.upperQuartile,
  currency: observation.currency,
  sample_size: observation.sampleSize,
  collected_at: observation.reviewedAt,
  source_url: observation.sourceUrl,
  confidence: "medium",
  source_type: "dated-marketplace-observation"
});

const context = Price.buildVehicleContext(withObservation, importData, {
  country: "nigeria", make: "toyota", model: "corolla", year: 2018
});
assert.ok(context, "Nigeria Corolla comparison loads");
assert.equal(context.localPrice.sourceType, "dated-marketplace-observation");
assert.equal(context.localPrice.sampleSize, observation.sampleSize);
assert.equal(context.localPrice.sourceUrl, observation.sourceUrl);
assert.ok(Math.abs(context.localPrice.median * forex.rates.NGN - observation.median) < forex.rates.NGN * 0.01, "NGN ask is normalized only for engine math");
assert.equal(context.recommendation.status, "price-check-needed", "stale source budget cannot produce a buy/import recommendation");
assert.match(context.calculatorUrl, /^\/tools\/car-import-cost\/nigeria\//);

withObservation.localMarketPrices.push({
  country_code: oldCamryObservation.countryCode,
  make: "Toyota",
  model: "Camry",
  year: 2005,
  min_ask: oldCamryObservation.lowerQuartile,
  median_ask: oldCamryObservation.median,
  max_ask: oldCamryObservation.upperQuartile,
  currency: oldCamryObservation.currency,
  sample_size: oldCamryObservation.sampleSize,
  collected_at: oldCamryObservation.reviewedAt,
  source_url: oldCamryObservation.sourceUrl,
  confidence: "medium",
  source_type: "dated-marketplace-observation"
});
const oldCamryContext = Price.buildVehicleContext(withObservation, importData, {
  country: "nigeria", make: "toyota", model: "camry", year: 2005
});
assert.equal(oldCamryContext.localPrice.sourceUrl, oldCamryObservation.sourceUrl);
assert.equal(oldCamryContext.recommendation.status, "too-risky", "2005 local price must not imply import eligibility");

const directoryOnly = Price.buildVehicleContext(withObservation, importData, {
  country: "south-africa", make: "toyota", model: "corolla", year: 2018
});
assert.equal(directoryOnly.calculatorUrl, "", "directory-only market has no nonexistent country calculator URL");
assert.equal(directoryOnly.localPrice.sourceUrl, "", "unsourced local price is excluded from buyer recommendations");
assert.equal(directoryOnly.recommendation.status, "price-check-needed");
console.log("car-market-observation.test.js passed");
