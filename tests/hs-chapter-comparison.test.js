const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

test("chapter comparison sorts zero before positive and missing references", () => {
  const context = vm.createContext({
    HS_DATABASE: { searchIndex: [{ code: "1006.30", chapter: "10" }, { code: "1001.99", chapter: "10" }] },
    COUNTRY_DUTY_RATES: {
      A: { name: "Missing", dutyRates: {} },
      B: { name: "Positive", dutyRates: { 10: { typical: 10 } } },
      C: { name: "Zero", dutyRates: { 10: { typical: 0 } } }
    }
  });
  const source = fs.readFileSync(path.join(__dirname, "../engines/src/hs-lookup-engine.js"), "utf8");
  vm.runInContext(source, context);
  for (const code of ["1006.30", "1001.99"]) {
    const rows = context.HsLookupEngine.compareRates(code, ["A", "B", "C"]);
    assert.deepEqual(Array.from(rows, row => row.dutyTypical), [0, 10, null]);
    const observations = context.HsLookupEngine.getObservations(code, "B");
    assert.match(observations[0].text, /chapter 10/);
    assert.doesNotMatch(observations.map(row => row.text).join(" "), /rice|wheat|lowest duty on this product/i);
  }
});
test("every stored heading and six-digit record uses the chapter in its code", () => {
  const { HS_DATABASE } = require("../data/trade/hs-codes-database");
  const { COUNTRY_DUTY_RATES } = require("../data/trade/country-duty-rates");
  const context = vm.createContext({ HS_DATABASE, COUNTRY_DUTY_RATES });
  vm.runInContext(fs.readFileSync(path.join(__dirname, "../engines/src/hs-lookup-engine.js"), "utf8"), context);
  const engine = context.HsLookupEngine;
  assert.equal(HS_DATABASE.searchIndex.length, 354);
  for (const chapter of HS_DATABASE.chapters) {
    for (const heading of chapter.headings) assert.equal(heading.code.slice(0, 2), chapter.chapter);
  }
  for (const item of HS_DATABASE.searchIndex) {
    const prefix = item.code.slice(0, 2);
    assert.equal(item.chapter, prefix, item.code);
    for (const [country, schedule] of Object.entries(COUNTRY_DUTY_RATES)) {
      assert.equal(engine.getDutyRates(item.code, country).dutyTypical, schedule.dutyRates[prefix]?.typical ?? null);
    }
  }
  const rows = engine.compareRates("0201.10", ["KE", "ZA"]);
  assert.deepEqual(Array.from(rows, row => row.dutyTypical), [0, 25]);
  assert.doesNotMatch(engine.getObservations("0201.10", "KE").map(row => row.text).join(" "), /lowest|Egypt/);
});

test("HS 2022 distinguishes cellular phones and photovoltaic components", () => {
  const { HS_DATABASE } = require("../data/trade/hs-codes-database");
  const { COUNTRY_DUTY_RATES } = require("../data/trade/country-duty-rates");
  const context = vm.createContext({ HS_DATABASE, COUNTRY_DUTY_RATES });
  vm.runInContext(fs.readFileSync(path.join(__dirname, "../engines/src/hs-lookup-engine.js"), "utf8"), context);
  const engine = context.HsLookupEngine;
  for (const [query, code] of [["smartphones", "8517.13"], ["feature phone", "8517.14"],
    ["solar panels", "8541.43"], ["bare solar cell", "8541.42"], ["phototransistor", "8541.49"],
    ["paneli za jua", "8541.43"], ["panneau solaire", "8541.43"]]) {
    assert.equal(engine.searchByProduct(query)[0].code, code, query);
    assert.equal(engine.lookupByCode(code.replace(".", "")).code, code);
    assert.equal(engine.getDutyRates(code, "KE").notes, undefined);
  }
  for (const oldCode of ["8517.12", "8541.40"]) assert.equal(engine.lookupByCode(oldCode), null);
});
