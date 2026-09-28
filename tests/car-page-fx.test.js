const test = require("node:test");
const assert = require("node:assert/strict");
const { createFxSnapshot } = require("../scripts/lib/car-page-fx");
const ledger = require("../data/forex/latest.json");
test("French Car conversion uses the existing dated USD ledger without changing metadata", () => {
  const snapshot = createFxSnapshot(ledger);
  assert.equal(snapshot.timestamp, ledger.timestamp);
  assert.equal(snapshot.source, ledger.source);
  assert.equal(snapshot.rateFor("NGN"), ledger.rates.NGN);
  assert.equal(snapshot.convert(12200, "NGN"), 12200 * ledger.rates.NGN);
});
test("missing, invalid or undated exchange rates never become a one-to-one fallback", () => {
  for (const snapshot of [
    createFxSnapshot({ ...ledger, rates: {} }),
    createFxSnapshot({ ...ledger, rates: { NGN: 0, GHS: -1, KES: "129", UGX: Infinity } }),
    createFxSnapshot({ ...ledger, timestamp: "" }),
    createFxSnapshot({ ...ledger, base: "EUR" })
  ]) {
    assert.equal(snapshot.rateFor("NGN"), null);
    assert.equal(snapshot.convert(12200, "NGN"), null);
  }
});
