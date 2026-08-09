"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const ROOT = path.resolve(__dirname, "..");
const context = { console };
context.window = context;
vm.createContext(context);

for (const relative of [
  "data/trade/hs-codes-database.js", "data/trade/country-duty-rates.js", "engines/src/hs-lookup-engine.js",
  "data/trade/afcfta-schedule.js",
  "data/trade/shipping-routes.js", "engines/src/shipping-engine.js",
  "data/trade/fx-history.js", "engines/src/fx-impact-engine.js",
  "engines/src/lc-fee-engine.js",
  "data/trade/export-docs-data.js", "engines/src/export-docs-engine.js",
  "data/trade/coo-templates.js", "engines/src/coo-engine.js",
  "data/trade/port-demurrage.js", "engines/src/demurrage-engine.js",
  "data/trade/incoterms-data.js", "engines/src/incoterms-engine.js",
  "data/trade/trade-finance-data.js", "engines/src/trade-finance-engine.js",
  "data/trade/b2b-payments-data.js", "engines/src/payment-comparator-engine.js"
]) vm.runInContext(fs.readFileSync(path.join(ROOT, relative), "utf8"), context, { filename: relative });

const hs = context.HsLookupEngine.searchByProduct("coffee")[0];
assert.strictEqual(hs.code, "0901.11");
assert.strictEqual(context.HsLookupEngine.compareRates(hs.code, ["KE", "TZ", "UG"]).length, 3);

const afcfta = vm.runInContext("AFCFTA_DATA", context);
assert.strictEqual(afcfta.memberStates.KE.tradingStatus, "active_GTI");
assert.strictEqual(afcfta.memberStates.GH.tradingStatus, "active_GTI");
assert.strictEqual(afcfta.memberStates.KE.reductionSchedule.catA[2026], 60);

const shipping = context.ShippingEngine.estimate("CNSHA", "KEMBA", "20ft", 5, 100);
assert.deepStrictEqual(JSON.parse(JSON.stringify([shipping.sea.minUSD, shipping.sea.maxUSD])), [1200, 2500]);

const rate = context.FxImpactEngine.getCurrentRate("KE");
const fx = context.FxImpactEngine.calculateImpact(10000, "KE", rate);
assert.strictEqual(fx.localCost, 10000 * rate);
assert.strictEqual(context.FxImpactEngine.modelScenarios(10000, "KE", rate).length, 9);

const lc = context.LcFeeEngine.calculate({ lcValue: 50000, countryCode: "KE", lcType: "sight", confirmed: true, amendments: 0, includeMargin: true });
assert.strictEqual(lc.totalFees, 2100);
assert.strictEqual(lc.marginDeposit, 5000);

const docs = context.ExportDocsEngine.getDocList("KE", "coffee_tea", "EAC");
assert.ok(docs.totalDocs > docs.mandatoryCount && docs.countryInfo.currency === "KES");

const coo = context.CooEngine.generateFormData("afcfta", { exporter_name: "Biashara ya Mfano", exporter_country: "KE" });
assert.strictEqual(coo.fields.exporter_name.value, "Biashara ya Mfano");
assert.match(coo.issuingAuthority, /KEPROBA|KRA/);
assert.strictEqual(context.CooEngine.checkOriginCriteria({ hasWhollyObtained: true })[0].criteria, "WO");

const demurrage = context.DemurrageEngine.calculateDemurrage("NGAPP", "20ft", 12, 1);
assert.strictEqual(demurrage.freeDays, 5);
assert.strictEqual(demurrage.paidDays, 7);
assert.strictEqual(demurrage.demurrageUSD, 675);

const costs = { packaging:500, loading_origin:300, export_customs:200, inland_origin:1500, loading_vessel:500, freight:8000, insurance:500, unloading_dest:500, import_customs:1000, duties_taxes:15000, inland_dest:3000, delivery:1000 };
const incoterms = context.IncotermsEngine.calculateCostSplit("CIF", costs);
assert.strictEqual(incoterms.total, Object.values(costs).reduce((sum, value) => sum + value, 0));
assert.strictEqual(incoterms.sellerTotal + incoterms.buyerTotal, incoterms.total);

const finance = context.TradeFinanceEngine.calculate({ instrumentId: "lc_sight", tradeValue: 50000, countryCode: "KE", tenorDays: 90, confirmed: true });
assert.strictEqual(finance.totalFee, 1675);
assert.strictEqual(context.TradeFinanceEngine.compareAll(50000, "KE").length, 6);

const payment = context.PaymentComparatorEngine.calculateScenario(5000, "monthly", "papss");
assert.strictEqual(payment.providerId, "papss");
const comparison = context.PaymentComparatorEngine.compareAll(5000);
assert.ok(comparison.length >= 6 && comparison[0].estimatedFee <= comparison[comparison.length - 1].estimatedFee);

console.log("sw-trade-core-oracle.test.js passed: 11/11 English owner datasets and formula engines");
