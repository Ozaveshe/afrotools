#!/usr/bin/env node

const assert = require("assert");
const prefill = require("../assets/js/ai/prefill-adapters.js");
const REQUIRED_ADAPTER_METHODS = [
  "supports",
  "normalizeInputs",
  "validateInputs",
  "toSafeLaunchPayload",
  "getMissingInputs",
  "getUserFacingSummary",
];

function memoryStorage() {
  const data = new Map();
  return {
    getItem(key) {
      return data.has(key) ? data.get(key) : null;
    },
    setItem(key, value) {
      data.set(key, String(value));
    },
    removeItem(key) {
      data.delete(key);
    },
  };
}

function assertUrlDoesNotLeak(launch, forbidden) {
  for (const value of forbidden) {
    if (value === undefined || value === null || value === "") continue;
    assert.ok(!launch.launchUrl.toLowerCase().includes(String(value).toLowerCase()), `${launch.launchUrl} leaked ${value}`);
  }
}

for (const adapter of prefill.ADAPTERS) {
  for (const method of REQUIRED_ADAPTER_METHODS) {
    assert.strictEqual(typeof adapter[method], "function", `${adapter.id} exposes ${method}`);
  }
}
assert.ok(prefill.getPrefillAdapter("cv-builder"));
assert.ok(prefill.getPrefillAdapter("scholarship-finder"));
assert.ok(prefill.getPrefillAdapter("import-duty"));
assert.ok(prefill.getPrefillAdapter("solar-roi"));
assert.ok(prefill.getPrefillAdapter("vat-calc-pan-african"));
assert.ok(prefill.getPrefillAdapter("invoice-generator"));
assert.ok(prefill.getPrefillAdapter("paye-calculator"));

const importLaunch = prefill.buildSafeLaunch("import-duty", {
  destinationCountry: "Nigeria",
  itemCategory: "Toyota Axio",
  productCategory: "vehicle",
  year: "2016",
  purchasePrice: 8500,
  engineCc: 1500,
  shippingCost: 1200,
  insuranceCost: 250,
  originCountry: "Japan",
  port: "tin-can",
  fxRate: 1600,
  currency: "USD",
});
assert.strictEqual(importLaunch.supported, true);
assert.strictEqual(importLaunch.toolId, "import-duty");
assert.strictEqual(importLaunch.launchUrl, "/tools/import-duty/?source=ask&prefill=1");
assert.deepStrictEqual(importLaunch.missingInputs, []);
assert.strictEqual(importLaunch.validation.valid, true);
assert.strictEqual(importLaunch.payload.normalizedInputs.mode, "car");
assert.strictEqual(importLaunch.payload.normalizedInputs.productCategory, "vehicle");
assert.strictEqual(importLaunch.payload.normalizedInputs.make, "Toyota");
assert.strictEqual(importLaunch.payload.normalizedInputs.model, "Axio");
assert.strictEqual(importLaunch.payload.normalizedInputs.engineCc, 1500);
assert.strictEqual(importLaunch.payload.normalizedInputs.shippingCost, 1200);
assert.strictEqual(importLaunch.payload.normalizedInputs.insuranceCost, 250);
assert.strictEqual(importLaunch.payload.normalizedInputs.originCountry, "Japan");
assert.strictEqual(importLaunch.payload.normalizedInputs.port, "tin-can");
assert.strictEqual(importLaunch.payload.normalizedInputs.fxRate, 1600);
assertUrlDoesNotLeak(importLaunch, ["Nigeria", "Toyota", "Axio", "2016", "8500", "1500", "1200", "Japan", "1600"]);

const importMissing = prefill.buildSafeLaunch("car-import-cost", {
  destinationCountry: "Ghana",
  itemCategory: "Honda Fit",
});
assert.deepStrictEqual(importMissing.missingInputs, ["purchasePrice", "shippingCost", "fxRate"]);
assert.strictEqual(importMissing.validation.valid, true);

const cvLaunch = prefill.buildSafeLaunch("cv-jobs", {
  country: "Ghana",
  targetRole: "electrical engineer",
  careerStage: "professional",
  experienceYears: 4,
  sector: "engineering",
  skills: "solar installation, maintenance",
  languagePreference: "English",
  templateId: "trade-skills",
  starterId: "trade",
});
assert.strictEqual(cvLaunch.toolId, "cv-builder");
assert.deepStrictEqual(cvLaunch.missingInputs, []);
assert.ok(cvLaunch.userFacingSummary.includes("electrical engineer"));
assert.strictEqual(cvLaunch.payload.normalizedInputs.experienceYears, 4);
assert.strictEqual(cvLaunch.payload.normalizedInputs.sector, "engineering");
assert.strictEqual(cvLaunch.payload.normalizedInputs.templateId, "trade-skills");
assert.strictEqual(cvLaunch.payload.normalizedInputs.starterId, "trade");
assert.strictEqual(cvLaunch.payload.normalizedInputs.languagePreference, "English");
assertUrlDoesNotLeak(cvLaunch, ["Ghana", "electrical engineer", "solar"]);

const cvMissing = prefill.buildSafeLaunch("cv-builder", {
  targetRole: "data analyst",
});
assert.deepStrictEqual(cvMissing.missingInputs, ["country"]);

const scholarshipLaunch = prefill.buildSafeLaunch("scholarships", {
  country: "Cameroon",
  studyLevel: "masters",
  targetCountry: "Canada",
  gpa: 3.6,
});
assert.strictEqual(scholarshipLaunch.toolId, "scholarship-finder");
assert.deepStrictEqual(scholarshipLaunch.missingInputs, []);
assert.strictEqual(scholarshipLaunch.payload.normalizedInputs.studyLevel, "masters");
assert.strictEqual(scholarshipLaunch.payload.normalizedInputs.gpa, 3.6);
assertUrlDoesNotLeak(scholarshipLaunch, ["Cameroon", "Canada", "masters"]);

const scholarshipMissing = prefill.buildSafeLaunch("scholarship-finder", {
  country: "Nigeria",
});
assert.deepStrictEqual(scholarshipMissing.missingInputs, ["studyLevel"]);

const solarLaunch = prefill.buildSafeLaunch("solar-energy", {
  country: "Nigeria",
  city: "Lagos",
  monthlyBill: 120000,
  loadSizeKw: 5,
  backupHours: 6,
});
assert.strictEqual(solarLaunch.toolId, "solar-roi");
assert.strictEqual(solarLaunch.route, "/tools/solar-roi/");
assert.deepStrictEqual(solarLaunch.missingInputs, []);
assert.strictEqual(solarLaunch.payload.normalizedInputs.loadSizeKw, 5);
assert.strictEqual(solarLaunch.payload.normalizedInputs.backupHours, 6);
assertUrlDoesNotLeak(solarLaunch, ["Nigeria", "Lagos", "120000"]);

const solarCountryLaunch = prefill.buildSafeLaunch("solar-roi", {
  country: "Nigeria",
  countrySlug: "nigeria",
  city: "Lagos",
  userType: "shop",
  monthlyBill: 120000,
  monthlyGeneratorSpend: 95000,
  loadSizeKw: 5,
  outageHours: 6,
});
assert.strictEqual(solarCountryLaunch.toolId, "solar-roi");
assert.strictEqual(solarCountryLaunch.route, "/tools/solar-roi/nigeria/");
assert.strictEqual(solarCountryLaunch.launchUrl, "/tools/solar-roi/nigeria/?source=ask&prefill=1");
assert.strictEqual(solarCountryLaunch.payload.normalizedInputs.monthlyGeneratorSpend, 95000);
assert.strictEqual(solarCountryLaunch.payload.normalizedInputs.userType, "shop");
assertUrlDoesNotLeak(solarCountryLaunch, ["Lagos", "120000", "95000"]);

const generatorLaunch = prefill.buildSafeLaunch("fuel-tracker", {
  country: "Kenya",
  fuelType: "diesel",
  generatorHoursPerDay: 6,
});
assert.strictEqual(generatorLaunch.toolId, "fuel-tracker");
assert.strictEqual(generatorLaunch.route, "/tools/fuel-tracker/#generator-cost");
assert.strictEqual(generatorLaunch.launchUrl, "/tools/fuel-tracker/?source=ask&prefill=1#generator-cost");
assert.deepStrictEqual(generatorLaunch.missingInputs, []);
assertUrlDoesNotLeak(generatorLaunch, ["Kenya", "diesel", "6"]);

const invoiceLaunch = prefill.buildSafeLaunch("invoice-generator", {
  clientName: "Amina Stores",
  amount: 45000,
  currency: "NGN",
  lineItemDescription: "consulting",
});
assert.strictEqual(invoiceLaunch.toolId, "invoice-generator");
assert.deepStrictEqual(invoiceLaunch.missingInputs, []);
assertUrlDoesNotLeak(invoiceLaunch, ["Amina", "45000", "consulting"]);

const vatLaunch = prefill.buildSafeLaunch("vat-calc-pan-african", {
  country: "South Africa",
  amount: 10000,
  vatTreatment: "standard",
  lineItemDescription: "consulting",
});
assert.strictEqual(vatLaunch.toolId, "vat-calc-pan-african");
assert.strictEqual(vatLaunch.route, "/tools/vat-calculator/");
assert.strictEqual(vatLaunch.payload.normalizedInputs.countryCode, "ZA");
assert.strictEqual(vatLaunch.payload.normalizedInputs.vatRate, 15);
assert.deepStrictEqual(vatLaunch.missingInputs, []);
assertUrlDoesNotLeak(vatLaunch, ["South Africa", "10000", "consulting"]);

const payeLaunch = prefill.buildSafeLaunch("payroll-tax", {
  country: "Kenya",
  grossPay: 250000,
  payPeriod: "monthly",
  employeeCount: 5,
});
assert.strictEqual(payeLaunch.toolId, "paye-calculator");
assert.strictEqual(payeLaunch.route, "/kenya/ke-paye");
assert.strictEqual(payeLaunch.launchUrl, "/kenya/ke-paye?source=ask&prefill=1");
assert.strictEqual(payeLaunch.payload.normalizedInputs.countryCode, "KE");
assert.strictEqual(payeLaunch.payload.normalizedInputs.grossPayAnnual, 3000000);
assert.deepStrictEqual(payeLaunch.missingInputs, []);
assertUrlDoesNotLeak(payeLaunch, ["250000", "5"]);

const payeMissing = prefill.buildSafeLaunch("paye-calculator", {
  country: "Kenya",
});
assert.deepStrictEqual(payeMissing.missingInputs, ["grossPay"]);

const pdfMissing = prefill.buildSafeLaunch("pdf-workspace", {}, { selectedRoute: "/document-pdf/" });
assert.strictEqual(pdfMissing.supported, true);
assert.deepStrictEqual(pdfMissing.missingInputs, ["pdfAction"]);
assert.strictEqual(pdfMissing.launchUrl, "/tools/pdf-workspace/?source=ask&prefill=1");

const pdfLaunch = prefill.buildSafeLaunch("pdf-workspace", { pdfAction: "compress" });
assert.strictEqual(pdfLaunch.toolId, "pdf-workspace");
assert.deepStrictEqual(pdfLaunch.missingInputs, []);
assert.strictEqual(pdfLaunch.payload.normalizedInputs.pdfAction, "compress");

const routeOnly = prefill.buildSafeLaunch("unknown-route-only-tool", { secret: "do not leak" }, { selectedRoute: "/tools/custom-workflow/" });
assert.strictEqual(routeOnly.supported, false);
assert.strictEqual(routeOnly.payload, null);
assert.strictEqual(routeOnly.launchUrl, "/tools/custom-workflow/?source=ask&prefill=1");
assertUrlDoesNotLeak(routeOnly, ["do not leak"]);

const storage = memoryStorage();
assert.strictEqual(prefill.storeLaunchPayload(importLaunch, storage), true);
const stored = prefill.readLaunchPayload(storage);
assert.strictEqual(stored.toolId, "import-duty");
assert.strictEqual(stored.normalizedInputs.itemCategory, "Toyota Axio");
assert.ok(stored.expiresAt > stored.createdAt);

storage.setItem(prefill.PREFILL_STORAGE_KEY, JSON.stringify({
  type: "afrotools_ai_prefill",
  expiresAt: Date.now() - 1,
}));
assert.strictEqual(prefill.readLaunchPayload(storage), null);
assert.strictEqual(storage.getItem(prefill.PREFILL_STORAGE_KEY), null);

const failingStorage = {
  setItem() {
    throw new Error("storage disabled");
  },
};
assert.strictEqual(prefill.storeLaunchPayload(importLaunch, failingStorage), false);

console.log("AI prefill adapters validated: contract, core adapters, route-only fallback, missing inputs, storage failure, and URL privacy.");
