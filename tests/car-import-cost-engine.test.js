const assert = require("assert");
const fs = require("fs");
const path = require("path");
const Engine = require("../assets/js/lib/car-import-cost-engine.js");

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, "..", file), "utf8"));
}

function loadData() {
  const core = readJson("data/trade/car-import-cost-core.json");
  const packs = ["ng", "ke", "gh", "ug", "zm", "tz"].map((code) =>
    readJson(`data/trade/car-import-cost-${code}.json`)
  );
  return Engine.mergeData(core, packs, {
    NGN: 1535.5,
    KES: 129.45,
    GHS: 14.89,
    UGX: 3720,
    ZMW: 27.5,
    TZS: 2650
  });
}

function close(actual, expected, label) {
  assert.ok(Math.abs(actual - expected) < 0.02, `${label}: expected ${expected}, got ${actual}`);
}

const data = loadData();

const cases = [
  {
    label: "Nigeria 2018 Corolla",
    input: { countryCode: "NG", make: "Toyota", model: "Corolla", year: 2018, sourceMarket: "japan", destinationCity: "lagos", driveSide: "right", engineCc: 1800, outputMode: "practical" },
    expectedOnRoadUsd: 18209.88,
    expectedWarnings: []
  },
  {
    label: "Kenya 2019 Toyota Axio",
    input: { countryCode: "KE", make: "Toyota", model: "Axio", year: 2019, sourceMarket: "japan", destinationCity: "nairobi", driveSide: "right", engineCc: 1500, outputMode: "practical" },
    expectedOnRoadUsd: 17501.38,
    expectedWarnings: []
  },
  {
    label: "Ghana 2016 Honda CR-V",
    input: { countryCode: "GH", make: "Honda", model: "CR-V", year: 2016, sourceMarket: "japan", destinationCity: "accra", driveSide: "left", engineCc: 2400, outputMode: "practical" },
    expectedOnRoadUsd: 18779.04,
    expectedWarnings: ["age-sensitive"]
  },
  {
    label: "Uganda 2017 Mazda Demio",
    input: { countryCode: "UG", make: "Mazda", model: "Demio", year: 2017, sourceMarket: "japan", destinationCity: "kampala", driveSide: "right", engineCc: 1300, outputMode: "practical" },
    expectedOnRoadUsd: 12790.21,
    expectedWarnings: ["age-sensitive"]
  },
  {
    label: "Zambia 2015 Hilux",
    input: { countryCode: "ZM", make: "Toyota", model: "Hilux", year: 2015, sourceMarket: "japan", destinationCity: "lusaka", driveSide: "right", engineCc: 2500, outputMode: "practical" },
    expectedOnRoadUsd: 29646.67,
    expectedWarnings: ["age-sensitive"]
  },
  {
    label: "Tanzania 2014 Noah",
    input: { countryCode: "TZ", make: "Toyota", model: "Noah", year: 2014, sourceMarket: "japan", destinationCity: "dar-es-salaam", driveSide: "right", engineCc: 2000, outputMode: "practical" },
    expectedOnRoadUsd: 19743.96,
    expectedWarnings: ["age-sensitive"]
  }
];

for (const testCase of cases) {
  const result = Engine.calculate(testCase.input, data);
  close(result.totals.onRoadUsd, testCase.expectedOnRoadUsd, testCase.label);
  assert.strictEqual(result.sourceMarketCompare.length, 5, `${testCase.label}: compare markets`);
  assert.ok(result.breakdowns.officialTaxes.length > 0, `${testCase.label}: official taxes`);
  assert.ok(result.breakdowns.registration.length > 0, `${testCase.label}: registration`);
  assert.deepStrictEqual(result.warnings.map((warning) => warning.code), testCase.expectedWarnings, `${testCase.label}: warnings`);
}

const nigeriaTooOld = Engine.calculate({ countryCode: "NG", make: "Toyota", model: "Corolla", year: 2010, purchasePriceUsd: 4000, engineCc: 1800 }, data);
assert.ok(nigeriaTooOld.warnings.some((warning) => warning.code === "age-ineligible"), "Nigeria over-12-year age warning");

const kenyaWrongSteering = Engine.calculate({ countryCode: "KE", make: "Toyota", model: "Axio", year: 2019, engineCc: 1500, driveSide: "left" }, data);
assert.ok(kenyaWrongSteering.warnings.some((warning) => warning.code === "steering-ineligible"), "Kenya RHD warning");

const noShipping = Engine.calculate({ countryCode: "GH", cifUsd: 8000, freightUsd: 0, insuranceUsd: 0, engineCc: 1800, outputMode: "official" }, data);
assert.ok(noShipping.totals.onRoadUsd > 0, "CIF-only flow still calculates");
assert.ok(noShipping.breakdowns.practicalCosts.length === 0, "Official mode excludes practical extras");

console.log("car-import-cost-engine.test.js passed");
