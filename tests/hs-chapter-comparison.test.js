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
