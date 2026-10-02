const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const ImportEngine = require("../assets/js/lib/car-import-cost-engine.js");
const Price = require("../assets/js/lib/car-price-intelligence.js");

const root = path.join(__dirname, "..");
const read = (file) => JSON.parse(readFileSync(path.join(root, file), "utf8"));
const data = read("data/cars/price-intelligence.json");
const observations = read("data/cars/market-observations.json").observations;
const sourceObservations = read("data/cars/source-market-observations.json").observations;
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
assert.ok(observations.length >= 12, "the dated Nigeria marketplace sample set has expanded");
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
const thinCrvObservation = observations.find((item) => item.vehicleId === "honda-cr-v-2020" && item.countryCode === "NG");
assert.equal(thinCrvObservation.sampleSize, 5);
assert.equal(thinCrvObservation.median, 35000000);
assert.equal(thinCrvObservation.searchIndexEligible, false, "thin CR-V evidence remains buyer-visible without an indexable vehicle page");
assert.equal(thinCrvObservation.sampleVariantFr, "2020 Honda CR-V, version non vérifiée");

const projectedObservation = data.localMarketPrices.find((item) => item.source_url === observation.sourceUrl);
assert.ok(projectedObservation, "the production price pack contains the reviewed Corolla source");
assert.equal(projectedObservation.median_ask, observation.median);
assert.equal(data.localMarketPrices.filter((item) => item.country_code === "NG" && item.make === "Toyota" && item.model === "Camry" && item.year === 2005).length, 1, "reviewed local data replaces the older seed row");
assert.equal(data.localMarketPrices.filter((item) => item.source_type === "dated-marketplace-observation").length, observations.length, "every reviewed observation reaches the interactive price pack");

const context = Price.buildVehicleContext(data, importData, {
  country: "nigeria", make: "toyota", model: "corolla", year: 2018
});
assert.ok(context, "Nigeria Corolla comparison loads");
const observedComparison = context.sourceComparison.find((row) => row.sourceMarket === "local-dealer");
assert.ok(observedComparison, "dated local evidence remains available in the source comparison");
assert.equal(observedComparison.price.sourceUrl, observation.sourceUrl);
assert.equal(Math.round(observedComparison.landed.normal * forex.rates.NGN), observation.median);
assert.equal(context.localPrice.sourceType, "dated-marketplace-observation");
assert.equal(context.localPrice.sampleSize, observation.sampleSize);
assert.equal(context.localPrice.sourceUrl, observation.sourceUrl);
assert.ok(Math.abs(context.localPrice.median * forex.rates.NGN - observation.median) < forex.rates.NGN * 0.01, "NGN ask is normalized only for engine math");
assert.equal(context.recommendation.status, "price-check-needed", "a policy-review customs pack cannot produce a buy/import recommendation");
assert.match(context.recommendation.explanation, /planning rule pack or has a critical customs warning/, "the buyer sees why the decision is withheld");
assert.match(context.calculatorUrl, /^\/tools\/car-import-cost\/nigeria\//);

const ghCorollaObservation = observations.find((item) => item.vehicleId === "toyota-corolla-2018" && item.countryCode === "GH");
assert.equal(ghCorollaObservation.sampleSize, 11, "Ghana Corolla sample excludes mismatched or anomalous cards");
assert.equal(ghCorollaObservation.median, 194000);
assert.equal(ghCorollaObservation.corroboratingSources[0].sampleSize, 9, "the engine-specific Jiji check remains separate");
const ghCorollaContext = Price.buildVehicleContext(data, importData, {
  country: "ghana", make: "toyota", model: "corolla", year: 2018
});
const corollaSource = sourceObservations.find((item) => item.vehicleId === "toyota-corolla-2018" && item.sourceMarket === "uae");
assert.equal(corollaSource.sampleSize, 4, "only exact petrol 1.8L UAE offers are in the source sample");
assert.equal(corollaSource.median, 30750);
assert.equal(ghCorollaContext.sourceMarket, "uae");
assert.equal(ghCorollaContext.sourcePrice.sourceType, "dated-marketplace-observation");
assert.equal(ghCorollaContext.sourcePrice.sampleSize, 4);
assert.equal(ghCorollaContext.sourcePrice.median, 8400);
assert.equal(ghCorollaContext.sourcePrice.sourceUrl, corollaSource.sourceUrl);
assert.equal(ghCorollaContext.localPrice.sourceUrl, ghCorollaObservation.sourceUrl);
assert.equal(ghCorollaContext.localPrice.sampleSize, 11);
assert.equal(ghCorollaContext.localPrice.confidence, "low", "unverified engine displacement lowers confidence");
assert.equal(ghCorollaContext.recommendation.status, "price-check-needed", "small source and variant-mixed local samples cannot settle Ghana import versus local");

const oldCamryContext = Price.buildVehicleContext(data, importData, {
  country: "nigeria", make: "toyota", model: "camry", year: 2005
});
assert.equal(oldCamryContext.localPrice.sourceUrl, oldCamryObservation.sourceUrl);
assert.equal(oldCamryContext.recommendation.status, "too-risky", "2005 local price must not imply import eligibility");

const newCamryObservation = observations.find((item) => item.vehicleId === "toyota-camry-2018");
const newCamrySource = sourceObservations.find((item) => item.vehicleId === "toyota-camry-2018" && item.sourceMarket === "uae");
assert.equal(newCamryObservation.sampleSize, 12);
assert.equal(newCamryObservation.median, 25300000);
assert.equal(newCamrySource.sampleSize, 8);
const newCamryContext = Price.buildVehicleContext(data, importData, {
  country: "nigeria", make: "toyota", model: "camry", year: 2018
});
assert.equal(newCamryContext.localPrice.sourceUrl, newCamryObservation.sourceUrl);
assert.equal(newCamryContext.localPrice.sampleSize, 12);
assert.equal(newCamryContext.sourceMarket, "uae");
assert.equal(newCamryContext.sourcePrice.sourceType, "dated-marketplace-observation");
assert.equal(newCamryContext.sourcePrice.median, 10700);
assert.equal(newCamryContext.sourcePrice.sourceUrl, newCamrySource.sourceUrl);
assert.equal(Math.round(newCamryContext.localPrice.median * forex.rates.NGN), newCamryObservation.median, "the browser can display the reviewed NGN ask without conversion drift");
const camryHero = data.mediaLibrary.assets.find((asset) => asset.id === "toyota-camry-2018-hero");
assert.equal(newCamryContext.media.hero.sourceType, "licensed");
assert.equal(newCamryContext.media.hero.imageUrl, camryHero.imageUrl);
assert.equal(camryHero.sourceUrl, "https://commons.wikimedia.org/wiki/File:2018_Toyota_Camry.jpg");
assert.equal(camryHero.licenseId, "PD-self");
assert.equal(camryHero.rightsHolder, "Bull-Doser");
assert.equal(camryHero.modelReview.vehicleId, "toyota-camry-2018");
assert.equal(camryHero.visualReview.status, "reviewed");

const rav4Observation = observations.find((item) => item.vehicleId === "toyota-rav4-2018" && item.countryCode === "NG");
const rav4Source = sourceObservations.find((item) => item.vehicleId === "toyota-rav4-2018" && item.sourceMarket === "uae");
assert.equal(rav4Observation.sampleSize, 10);
assert.equal(rav4Observation.median, 24000000);
assert.equal(rav4Source.sampleSize, 10);
// Independent arithmetic from the ten retained asks recorded in the source method.
const rav4RecordedAsks = [38500,39000,40000,41100,44300,45000,53000,55000,55000,68100];
assert.equal(rav4Source.sampleSize, rav4RecordedAsks.length);
assert.equal(rav4Source.median, (rav4RecordedAsks[4] + rav4RecordedAsks[5]) / 2);
assert.equal(Math.round(rav4Source.median / rav4Source.sourceCurrencyPerUsd / 100) * 100, 12200);
assert.equal(rav4Source.sourceSnapshotAt, "2026-09-16", "an arithmetic correction does not refresh source age");
assert.equal(rav4Source.reviewedAt, "2026-09-27");
const rav4Context = Price.buildVehicleContext(data, importData, {
  country: "nigeria", make: "toyota", model: "rav4", year: 2018
});
assert.ok(rav4Context, "Nigeria 2018 RAV4 comparison loads");
assert.equal(rav4Context.localPrice.sourceUrl, rav4Observation.sourceUrl);
assert.equal(rav4Context.localPrice.sampleSize, 10);
assert.equal(rav4Context.sourceMarket, "uae");
assert.equal(rav4Context.sourcePrice.sourceType, "dated-marketplace-observation");
assert.equal(rav4Context.sourcePrice.median, 12200);
assert.equal(rav4Context.sourcePrice.sourceUrl, rav4Source.sourceUrl);
assert.equal(Math.round(rav4Context.localPrice.median * forex.rates.NGN), rav4Observation.median);
assert.equal(rav4Context.media.hero.sourceType, "generated");
assert.match(rav4Context.media.hero.imageUrl, /toyota-rav4-2018-hero\.webp$/);
assert.match(rav4Context.calculatorUrl, /source=uae.*price=12200/);

const directoryOnly = Price.buildVehicleContext(data, importData, {
  country: "south-africa", make: "toyota", model: "corolla", year: 2018
});
assert.equal(directoryOnly.calculatorUrl, "", "directory-only market has no nonexistent country calculator URL");
assert.equal(directoryOnly.localPrice.sourceUrl, "", "unsourced local price is excluded from buyer recommendations");
assert.ok(!directoryOnly.sourceComparison.some((row) => row.sourceMarket === "local-dealer"), "a missing local observation cannot manufacture a comparison row");
assert.equal(directoryOnly.recommendation.status, "price-check-needed");
console.log("car-market-observation.test.js passed");
