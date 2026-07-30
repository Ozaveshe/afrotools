const assert = require("assert");
const engine = require("../engines/src/trade-utility-engine.js");

function legacyProforma(items, freight, insurance) {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  return {
    subtotal,
    freight,
    insurance,
    fob: subtotal,
    cfr: subtotal + freight,
    cif: subtotal + freight + insurance,
    itemCount: items.filter((item) => item.quantity || item.unitPrice).length
  };
}

function legacyPacking(rows) {
  return rows.reduce((totals, row) => {
    totals.packageCount += row.count;
    totals.netWeight += row.netWeight;
    totals.grossWeight += row.grossWeight;
    totals.cbm += row.cbm;
    return totals;
  }, { packageCount: 0, netWeight: 0, grossWeight: 0, cbm: 0 });
}

function legacyCustoms(input) {
  const docMultiplier = input.documentStatus === "complete" ? 1 :
    (input.documentStatus === "partial" ? 1.5 : 2.5);
  const goodsMultiplier = input.goodsType === "food" || input.goodsType === "pharma" ? 1.3 : 1;
  const typicalDays = Math.round(input.typicalDays * docMultiplier * goodsMultiplier);
  return {
    minimumDays: Math.round(input.minimumDays * (input.documentStatus === "complete" ? 1 : 1.3)),
    typicalDays,
    maximumDays: Math.round(input.maximumDays * docMultiplier * goodsMultiplier),
    agentFee: Math.round(input.cargoValue * input.agentRate),
    storageCost: input.storagePerDay * typicalDays
  };
}

function legacyShipping(input) {
  const volume = input.length * input.width * input.height;
  const volumetricWeight = volume / input.divisor;
  return {
    actualWeight: input.actualWeight,
    volumetricWeight,
    chargeableWeight: Math.max(input.actualWeight, volumetricWeight)
  };
}

const proformaInput = {
  items: [
    { description: "Synthetic cacao", quantity: 12, unitPrice: 80 },
    { description: "Synthetic coffee", quantity: 5, unitPrice: 42 }
  ],
  freight: 120,
  insurance: 30
};
const proformaEngine = engine.proformaTotals(proformaInput);
assert.deepStrictEqual(
  {
    subtotal: proformaEngine.subtotal, freight: proformaEngine.freight,
    insurance: proformaEngine.insurance, fob: proformaEngine.fob,
    cfr: proformaEngine.cfr, cif: proformaEngine.cif, itemCount: proformaEngine.itemCount
  },
  legacyProforma(proformaInput.items, proformaInput.freight, proformaInput.insurance)
);

const packingRows = [
  { count: 2, netWeight: 10, grossWeight: 12, cbm: 0.4 },
  { count: 1, netWeight: 8, grossWeight: 9, cbm: 0.125 }
];
assert.deepStrictEqual(
  engine.packingTotals({ weightsAreTotals: true, packages: packingRows }),
  legacyPacking(packingRows)
);

const customsInput = {
  minimumDays: 5, typicalDays: 10, maximumDays: 20,
  documentStatus: "partial", goodsType: "food",
  cargoValue: 10000, agentRate: 0.012, storagePerDay: 35
};
assert.deepStrictEqual(engine.customsClearanceModel(customsInput), legacyCustoms(customsInput));

const shippingInput = { packages: 1, actualWeight: 8, length: 50, width: 40, height: 30, divisor: 5000 };
const shippingEngine = engine.shippingWeight(shippingInput);
assert.deepStrictEqual(
  {
    actualWeight: shippingEngine.actualWeight,
    volumetricWeight: shippingEngine.volumetricWeight,
    chargeableWeight: shippingEngine.chargeableWeight
  },
  legacyShipping(shippingInput)
);

const profile = engine.crossBorderCountryProfile({
  code: "NG", name: "Nigeria", law: "NDPA 2023", regulator: "NDPC",
  adequacy: { exists: false, note: "Synthetic fixture" },
  mechanisms: [{ name: "SCC", status: "available" }],
  steps: [{ title: "Map", detail: "Map flows" }],
  warnings: []
});
assert.deepStrictEqual(
  { code: profile.code, law: profile.law, regulator: profile.regulator, mechanisms: profile.mechanisms.length, steps: profile.steps.length },
  { code: "NG", law: "NDPA 2023", regulator: "NDPC", mechanisms: 1, steps: 1 }
);

console.log("English Trade utility pre/post parity: 5/5 owner fixtures passed.");
