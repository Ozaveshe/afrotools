const assert = require("assert");
const Pricing = require("../assets/js/lib/fp-material-pricing.js");
const Boq = require("../engineering/floor-planner/js/fp-boq-engine.js");

{
  assert.strictEqual(Pricing.currencyForCountry("KE").currency, "KES");
  assert.strictEqual(Pricing.currencyForCountry("KE").symbol, "KSh");
  assert.strictEqual(Pricing.currencyForCountry("NG").currency, "NGN");
  assert.strictEqual(Pricing.currencyForCountry("NG").symbol, "₦");
  assert.strictEqual(Pricing.currencyForCountry("GH").symbol, "GH₵");
  assert.strictEqual(Pricing.currencyForCountry("UG").currency, "UGX");
  assert.strictEqual(Pricing.currencyForCountry("RW").currency, "RWF");
  assert.strictEqual(Pricing.currencyForCountry("ET").currency, "ETB");
}

{
  const result = Pricing.getMaterialPrice({
    country: "KE",
    city: "Nairobi",
    materialName: "Cement",
    specification: "50kg bag",
    unit: "bags",
    quantity: 10,
    date: "2026-05-22"
  }, {
    asOfDate: "2026-05-22",
    records: [
      {
        materialName: "Cement",
        country: "KE",
        city: "Nairobi",
        unit: "bags",
        unitPrice: 1180,
        currency: "KES",
        sourceType: "verified_supplier",
        sourceName: "Nairobi supplier quote",
        verifiedDate: "2026-05-20"
      },
      {
        materialName: "Cement",
        country: "KE",
        unit: "bags",
        unitPrice: 1300,
        currency: "KES",
        sourceType: "country_average",
        sourceName: "Country average",
        verifiedDate: "2026-05-01"
      }
    ]
  });
  assert.strictEqual(result.unitPrice, 1180);
  assert.strictEqual(result.currency, "KES");
  assert.strictEqual(result.sourceType, "verified_supplier");
  assert.strictEqual(result.freshness, "High");
  assert.ok(result.confidenceScore >= 0.8);
}

{
  const regional = Pricing.getMaterialPrice({
    country: "NG",
    city: "Ibadan",
    materialName: "Sharp sand",
    unit: "trips",
    quantity: 2
  }, {
    asOfDate: "2026-05-22",
    records: [
      { materialName: "Sharp sand", country: "NG", city: "Ibadan", unit: "trips", unitPrice: 95000, currency: "NGN", sourceType: "regional_average", sourceName: "Ibadan market average", verifiedDate: "2026-05-01" },
      { materialName: "Sharp sand", country: "NG", unit: "trips", unitPrice: 115000, currency: "NGN", sourceType: "country_average", sourceName: "Nigeria country average", verifiedDate: "2026-05-01" }
    ]
  });
  assert.strictEqual(regional.sourceType, "regional_average");
  assert.strictEqual(regional.unitPrice, 95000);
}

{
  const fallback = Pricing.getMaterialPrice({
    country: "TZ",
    city: "Arusha",
    materialName: "Unknown special finish",
    unit: "m2",
    quantity: 20
  }, { records: [] });
  assert.strictEqual(fallback.sourceType, "fallback_estimate");
  assert.strictEqual(fallback.fallbackUsed, true);
  assert.ok(fallback.fallbackWarning.includes("No matching Afro Prices"));
}

{
  assert.deepStrictEqual(Pricing.freshnessForDate("2026-05-18", "2026-05-22").label, "High");
  assert.deepStrictEqual(Pricing.freshnessForDate("2026-05-01", "2026-05-22").label, "Medium");
  assert.deepStrictEqual(Pricing.freshnessForDate("2026-03-01", "2026-05-22").label, "Low");
  assert.deepStrictEqual(Pricing.freshnessForDate("2025-12-01", "2026-05-22").label, "Outdated");
}

{
  const converted = Pricing.convertUnitPrice({ unitPrice: 50000, fromUnit: "trips", toUnit: "m3", tripCapacityM3: 5 });
  assert.strictEqual(converted.ok, true);
  assert.strictEqual(converted.unitPrice, 10000);
  const missing = Pricing.convertUnitPrice({ unitPrice: 50000, fromUnit: "trips", toUnit: "m3" });
  assert.strictEqual(missing.ok, false);
  assert.ok(missing.warning.includes("capacity definition"));
}

{
  const boq = Boq.buildBoq({
    country: "KE",
    city: "Nairobi",
    rooms: [{ type: "room", name: "Kitchen", points: [{ x: 0, y: 0 }, { x: 6, y: 0 }, { x: 6, y: 5 }, { x: 0, y: 5 }] }],
    walls: [
      { type: "wall", x1: 0, y1: 0, x2: 6, y2: 0 },
      { type: "wall", x1: 6, y1: 0, x2: 6, y2: 5 },
      { type: "wall", x1: 6, y1: 5, x2: 0, y2: 5 },
      { type: "wall", x1: 0, y1: 5, x2: 0, y2: 0 }
    ],
    doors: [{ type: "door", width: 0.9 }],
    windows: [{ type: "window", width: 1.2 }]
  }, { country: "Kenya", city: "Nairobi", currency: "KES", currencySymbol: "KSh", rates: { cement: 1200, block: 120, sand: 18000, stone: 27000, rod: 950, roof: 1100, door: 6500, window: 9500, tile: 650, paint: 5000, labour: 0.45 }, priceSource: "Test fallback" });
  const priced = Pricing.applyPricesToBoq(boq, Pricing.buildPriceRequestsFromBoq(boq, { country: "KE", city: "Nairobi" }).map((request) => {
    if (request.priceKey === "cement") return { ...Pricing.getMaterialPrice(request), sourceType: "verified_supplier", sourceName: "Test cement supplier", unitPrice: 1100, currency: "KES", verifiedDate: "2026-05-22", fallbackUsed: false, fallbackWarning: "" };
    return Pricing.getMaterialPrice(request);
  }));
  assert.ok(priced.items.every((line) => line.priceResult && line.priceResult.sourceType));
  assert.ok(priced.items.some((line) => line.priceResult.sourceType === "verified_supplier"));
  assert.ok(priced.priceStatus.fallbackCount > 0);
}

console.log("floor planner pricing tests passed");
