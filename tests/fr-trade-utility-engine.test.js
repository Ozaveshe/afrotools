const assert = require("assert");
const engine = require("../engines/src/trade-utility-engine.js");

const proforma = engine.proformaTotals({
  items: [
    { description: "Cacao", quantity: 12, unitPrice: 80 },
    { description: "Café", quantity: 5, unitPrice: 42 }
  ],
  freight: 120,
  insurance: 30
});
assert.deepStrictEqual(
  { subtotal: proforma.subtotal, cfr: proforma.cfr, cif: proforma.cif, itemCount: proforma.itemCount },
  { subtotal: 1170, cfr: 1290, cif: 1320, itemCount: 2 }
);

const packing = engine.packingTotals({
  packages: [
    { count: 2, netWeight: 10, grossWeight: 12, lengthCm: 100, widthCm: 50, heightCm: 40 }
  ]
});
assert.deepStrictEqual(packing, { packageCount: 2, netWeight: 20, grossWeight: 24, cbm: 0.4 });
assert.deepStrictEqual(
  engine.packingTotals({
    weightsAreTotals: true,
    packages: [{ count: 2, netWeight: 10, grossWeight: 12, cbm: 0.4 }]
  }),
  { packageCount: 2, netWeight: 10, grossWeight: 12, cbm: 0.4 }
);

assert.strictEqual(engine.billOfLadingDraft({
  shipper: "A", consignee: "B", cargo: "Cacao", loadPort: "Tema", dischargePort: "Dakar"
}).valid, true);
assert.deepStrictEqual(engine.billOfLadingDraft({ shipper: "", consignee: "B", cargo: "" }).missing, ["shipper", "cargo"]);

const checklist = engine.crossBorderChecklist({
  legalBasis: true, contract: true, riskAssessment: true, security: true,
  processors: false, retention: false, rights: false, incident: false,
  sensitive: true
});
assert.deepStrictEqual(
  { completed: checklist.completed, total: checklist.total, completionRate: checklist.completionRate, highRisk: checklist.highRisk },
  { completed: 4, total: 8, completionRate: 50, highRisk: true }
);

assert.deepStrictEqual(
  engine.customsTime({ mode: "sea", documentsReady: false, inspection: true, regulated: false, congestion: false, broker: true, preArrival: false }),
  { lowDays: 6, highDays: 14, riskDays: 7 }
);
assert.deepStrictEqual(
  engine.customsClearanceModel({
    minimumDays: 5, typicalDays: 10, maximumDays: 20,
    documentStatus: "partial", goodsType: "food", cargoValue: 10000,
    agentRate: 0.012, storagePerDay: 35
  }),
  { minimumDays: 7, typicalDays: 20, maximumDays: 39, agentFee: 120, storageCost: 700 }
);

const weight = engine.shippingWeight({
  packages: 2, actualWeight: 4, length: 50, width: 40, height: 30,
  divisor: 5000, rate: 3, fuelRate: 10, declaredValue: 1000,
  insuranceRate: 1, fixedCharges: 5, contingencyRate: 10
});
assert.deepStrictEqual(
  {
    actualWeight: weight.actualWeight,
    volumetricWeight: weight.volumetricWeight,
    chargeableWeight: weight.chargeableWeight,
    total: Number(weight.total.toFixed(2))
  },
  { actualWeight: 8, volumetricWeight: 24, chargeableWeight: 24, total: 103.62 }
);

console.log("French Trade shared utility engine: 6/6 oracle fixtures passed.");
